"""
SMS Interface for Otom
Handles Twilio SMS for initial outreach before phone calls
"""

import os
import json
from typing import Dict, List, Any, Optional
from datetime import datetime
import uuid

from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import PlainTextResponse

# Handle Twilio import gracefully
try:
    from twilio.rest import Client
    from twilio.twiml.messaging_response import MessagingResponse
    from twilio.request_validator import RequestValidator
    TWILIO_AVAILABLE = True
except ImportError:
    Client = None
    MessagingResponse = None
    RequestValidator = None
    TWILIO_AVAILABLE = False

from utils.logger import setup_logger
from integrations.supabase_mcp import supabase

logger = setup_logger("sms_handler")

if not TWILIO_AVAILABLE:
    logger.warning("Twilio package not installed - SMS features unavailable")

router = APIRouter(prefix="/sms", tags=["SMS"])


class SMSInterface:
    """Handles SMS-based interactions with Otom via Twilio"""

    def __init__(self):
        """Initialize SMS interface with Twilio"""
        self.account_sid = os.getenv("TWILIO_ACCOUNT_SID")
        self.auth_token = os.getenv("TWILIO_AUTH_TOKEN")
        self.phone_number = os.getenv("TWILIO_PHONE_NUMBER")

        # Initialize Twilio client if credentials are available
        if self.account_sid and self.auth_token:
            self.client = Client(self.account_sid, self.auth_token)
            self.validator = RequestValidator(self.auth_token)
            logger.info("Twilio SMS interface initialized")
        else:
            self.client = None
            self.validator = None
            logger.warning("Twilio credentials not configured - SMS features unavailable")

        # Cal.com booking link
        self.cal_link = os.getenv("CAL_BOOKING_URL", "https://cal.com/sukin-yang-vw9ds8/meet-with-otom")

        # Compliance URLs
        self.privacy_url = os.getenv("PRIVACY_URL", "https://otom.ai/privacy")
        self.terms_url = os.getenv("TERMS_URL", "https://otom.ai/terms")

        # SMS templates - TFV Compliant
        self.templates = {
            # Double opt-in: First message asks for consent
            "consent_request": """Hi {name}! This is Otom on behalf of {company}.

We'd like to send you occasional texts for feedback & interview scheduling.

Reply YES to opt in. Reply STOP to opt out anytime.

Msg & data rates may apply. Privacy: {privacy_url}""",

            # After consent received, send the actual outreach
            "initial_outreach": """Hi {name}! This is Otom from {company}.

We're reaching out to learn about your experience and gather feedback.

Would you be available for a quick 15 minute call?

Reply:
1 - Yes, call me now
2 - Schedule for later
3 - Not interested

Reply STOP to opt out. HELP for help.""",

            "schedule_followup": """Great! Pick a time that works for you:

{cal_link}

Just click the link and choose a slot. We'll call you at the scheduled time!

Reply STOP to opt out.""",

            "call_confirmation": """Perfect! You'll receive a call from Otom shortly.

The call will take about 15 minutes. We appreciate your time!

Reply STOP to opt out.""",

            "thank_you": """Thank you for your response. We appreciate your time!

If you change your mind, just reply "CALL" and we'll reach out.

Reply STOP to opt out.""",

            # STOP keyword response (required for TCPA)
            "stop_confirmation": """You have been unsubscribed from Otom messages. You will not receive any more texts from us.

Reply START to re-subscribe.""",

            # HELP keyword response (required for TCPA)
            "help_response": """Otom SMS Help:

Reply 1 to request a call now
Reply 2 to schedule a call
Reply 3 or STOP to opt out
Reply CALL to request a callback

Support: support@otom.ai
Privacy: {privacy_url}""",

            # START keyword response (re-subscribe)
            "start_confirmation": """Welcome back! You have been re-subscribed to Otom messages.

Reply STOP to opt out anytime. Msg & data rates may apply.""",

            # Consent confirmed response
            "consent_confirmed": """Thanks for opting in to Otom messages!

We'll reach out shortly with feedback opportunities.

Reply STOP to opt out anytime. Msg & data rates may apply."""
        }

    async def send_sms(
        self,
        to_number: str,
        message: str,
        employee_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Send an SMS message"""
        if not self.client:
            logger.error("Twilio client not initialized")
            return {"success": False, "error": "SMS not configured"}

        try:
            # Send the message
            twilio_message = self.client.messages.create(
                body=message,
                from_=self.phone_number,
                to=to_number
            )

            # Log to Supabase
            sms_record = {
                "id": str(uuid.uuid4()),
                "employee_id": employee_id,
                "phone_number": to_number,
                "direction": "outbound",
                "message": message,
                "twilio_sid": twilio_message.sid,
                "status": twilio_message.status,
                "created_at": datetime.utcnow().isoformat()
            }

            if supabase.client:
                supabase.client.table("sms_messages").insert(sms_record).execute()

            logger.info(f"SMS sent to {to_number}: {twilio_message.sid}")
            return {
                "success": True,
                "message_sid": twilio_message.sid,
                "status": twilio_message.status
            }

        except Exception as e:
            logger.error(f"Failed to send SMS: {str(e)}")
            return {"success": False, "error": str(e)}

    async def send_consent_request(
        self,
        to_number: str,
        employee_name: str,
        company_name: str,
        employee_id: str
    ) -> Dict[str, Any]:
        """Send double opt-in consent request SMS (Step 1 of TFV compliant flow)"""
        message = self.templates["consent_request"].format(
            name=employee_name,
            company=company_name,
            privacy_url=self.privacy_url
        )

        # Update employee status to awaiting_consent
        if supabase.client and employee_id:
            supabase.client.table("employees").update(
                {"status": "awaiting_consent", "updated_at": datetime.utcnow().isoformat()}
            ).eq("id", employee_id).execute()

        return await self.send_sms(to_number, message, employee_id)

    async def send_initial_outreach(
        self,
        to_number: str,
        employee_name: str,
        company_name: str,
        employee_id: str
    ) -> Dict[str, Any]:
        """Send initial outreach SMS to an employee (after consent received)"""
        message = self.templates["initial_outreach"].format(
            name=employee_name,
            company=company_name
        )
        return await self.send_sms(to_number, message, employee_id)

    async def handle_incoming_sms(
        self,
        from_number: str,
        body: str,
        twilio_sid: str
    ) -> str:
        """Handle incoming SMS and return response - TFV Compliant"""
        body_lower = body.strip().lower()

        # Log incoming message
        sms_record = {
            "id": str(uuid.uuid4()),
            "phone_number": from_number,
            "direction": "inbound",
            "message": body,
            "twilio_sid": twilio_sid,
            "status": "received",
            "created_at": datetime.utcnow().isoformat()
        }

        # Find employee by phone number
        employee = None
        if supabase.client:
            supabase.client.table("sms_messages").insert(sms_record).execute()
            # Try to find the employee
            result = supabase.client.table("employees").select("*").eq("phone_number", from_number).execute()
            if result.data:
                employee = result.data[0]
                sms_record["employee_id"] = employee.get("id")

        # ============================================
        # TCPA REQUIRED: Handle STOP keyword first (highest priority)
        # ============================================
        if body_lower in ["stop", "unsubscribe", "cancel", "end", "quit"]:
            if employee and supabase.client:
                supabase.client.table("employees").update(
                    {"status": "opted_out", "sms_consent": False, "updated_at": datetime.utcnow().isoformat()}
                ).eq("id", employee["id"]).execute()
            logger.info(f"User {from_number} opted out via STOP")
            return self.templates["stop_confirmation"]

        # ============================================
        # TCPA REQUIRED: Handle HELP keyword
        # ============================================
        if body_lower in ["help", "info"]:
            return self.templates["help_response"].format(privacy_url=self.privacy_url)

        # ============================================
        # Handle START keyword (re-subscribe)
        # ============================================
        if body_lower in ["start", "subscribe", "unstop"]:
            if employee and supabase.client:
                supabase.client.table("employees").update(
                    {"status": "consented", "sms_consent": True, "updated_at": datetime.utcnow().isoformat()}
                ).eq("id", employee["id"]).execute()
            logger.info(f"User {from_number} re-subscribed via START")
            return self.templates["start_confirmation"]

        # ============================================
        # Handle YES - Double opt-in consent confirmation
        # ============================================
        if body_lower in ["yes", "y", "yeah", "yep", "ok", "okay"]:
            # Check if user is in awaiting_consent status
            if employee:
                current_status = employee.get("status", "")
                if current_status == "awaiting_consent":
                    # User has consented - update status and send outreach
                    if supabase.client:
                        supabase.client.table("employees").update(
                            {
                                "status": "consented",
                                "sms_consent": True,
                                "consent_timestamp": datetime.utcnow().isoformat(),
                                "updated_at": datetime.utcnow().isoformat()
                            }
                        ).eq("id", employee["id"]).execute()
                    logger.info(f"User {from_number} provided SMS consent")

                    # Send the actual outreach message after consent
                    await self.send_initial_outreach(
                        to_number=from_number,
                        employee_name=employee.get("name", "there"),
                        company_name=employee.get("company", "our team"),
                        employee_id=employee.get("id")
                    )
                    return self.templates["consent_confirmed"]
                else:
                    # User already consented, treat as "call me now"
                    await self._trigger_vapi_call(from_number, employee)
                    if supabase.client:
                        supabase.client.table("employees").update(
                            {"status": "call_requested", "updated_at": datetime.utcnow().isoformat()}
                        ).eq("id", employee["id"]).execute()
                    return self.templates["call_confirmation"]

        # ============================================
        # Handle Option 1 - Call me now
        # ============================================
        if body_lower in ["1", "call", "call me", "yes call me"]:
            if employee:
                await self._trigger_vapi_call(from_number, employee)
                if supabase.client:
                    supabase.client.table("employees").update(
                        {"status": "call_requested", "updated_at": datetime.utcnow().isoformat()}
                    ).eq("id", employee["id"]).execute()
            return self.templates["call_confirmation"]

        # ============================================
        # Handle Option 2 - Schedule for later (send Cal.com link)
        # ============================================
        if body_lower in ["2", "schedule", "later", "schedule later"]:
            if employee and supabase.client:
                supabase.client.table("employees").update(
                    {"status": "scheduling", "updated_at": datetime.utcnow().isoformat()}
                ).eq("id", employee["id"]).execute()
            return self.templates["schedule_followup"].format(cal_link=self.cal_link)

        # ============================================
        # Handle Option 3 - Not interested (but not opt-out)
        # ============================================
        if body_lower in ["3", "no", "not interested", "no thanks"]:
            if employee and supabase.client:
                supabase.client.table("employees").update(
                    {"status": "declined", "updated_at": datetime.utcnow().isoformat()}
                ).eq("id", employee["id"]).execute()
            return self.templates["thank_you"]

        # ============================================
        # Handle CALL keyword (re-activation)
        # ============================================
        if body_lower == "call":
            if employee:
                await self._trigger_vapi_call(from_number, employee)
                if supabase.client:
                    supabase.client.table("employees").update(
                        {"status": "call_requested", "updated_at": datetime.utcnow().isoformat()}
                    ).eq("id", employee["id"]).execute()
            return self.templates["call_confirmation"]

        # ============================================
        # Default response for unrecognized messages
        # ============================================
        return "Thanks for your message! Reply 1 for a call now, 2 to schedule, or 3 if not interested. Reply STOP to opt out or HELP for help."

    async def _trigger_vapi_call(self, phone_number: str, employee: Dict) -> None:
        """Trigger a Vapi call to the phone number with full employee context"""
        import aiohttp

        vapi_api_key = os.getenv("VAPI_API_KEY")
        vapi_assistant_id = os.getenv("VAPI_ASSISTANT_ID")

        if not vapi_api_key:
            logger.warning("VAPI_API_KEY not set - cannot trigger call")
            return

        try:
            async with aiohttp.ClientSession() as session:
                headers = {
                    "Authorization": f"Bearer {vapi_api_key}",
                    "Content-Type": "application/json"
                }

                # Build variable values for Vapi template
                variable_values = {
                    "full_name": employee.get("name", ""),
                    "company_name": employee.get("company", ""),
                    "department": employee.get("department", ""),
                    "position": employee.get("role", ""),
                    "employee_id": employee.get("id", ""),
                    "kpis": employee.get("notes", ""),  # KPIs can be stored in notes field
                    "email": employee.get("email", ""),
                    "phone": phone_number
                }

                payload = {
                    "phoneNumberId": os.getenv("VAPI_PHONE_NUMBER_ID"),
                    "customer": {
                        "number": phone_number,
                        "name": employee.get("name", "")
                    },
                    "assistantOverrides": {
                        "variableValues": variable_values
                    }
                }

                if vapi_assistant_id:
                    payload["assistantId"] = vapi_assistant_id

                logger.info(f"Triggering Vapi call with context: {variable_values}")

                async with session.post(
                    "https://api.vapi.ai/call/phone",
                    headers=headers,
                    json=payload
                ) as response:
                    if response.status == 201:
                        result = await response.json()
                        logger.info(f"Vapi call triggered: {result.get('id')}")
                    else:
                        error = await response.text()
                        logger.error(f"Failed to trigger Vapi call: {error}")

        except Exception as e:
            logger.error(f"Error triggering Vapi call: {str(e)}")

    async def bulk_send_consent_requests(
        self,
        employees: List[Dict],
        company_name: str
    ) -> Dict[str, Any]:
        """Send consent request SMS to multiple employees (TFV compliant double opt-in)"""
        results = {
            "total": len(employees),
            "sent": 0,
            "failed": 0,
            "errors": []
        }

        for employee in employees:
            phone = employee.get("phone_number")
            name = employee.get("name", "there")
            emp_id = employee.get("id")

            if not phone:
                results["failed"] += 1
                results["errors"].append(f"No phone for {name}")
                continue

            result = await self.send_consent_request(
                to_number=phone,
                employee_name=name,
                company_name=company_name,
                employee_id=emp_id
            )

            if result.get("success"):
                results["sent"] += 1
            else:
                results["failed"] += 1
                results["errors"].append(f"{name}: {result.get('error')}")

        return results

    async def bulk_send_outreach(
        self,
        employees: List[Dict],
        company_name: str
    ) -> Dict[str, Any]:
        """Send outreach SMS to multiple employees (use bulk_send_consent_requests for TFV compliant flow)"""
        results = {
            "total": len(employees),
            "sent": 0,
            "failed": 0,
            "errors": []
        }

        for employee in employees:
            phone = employee.get("phone_number")
            name = employee.get("name", "there")
            emp_id = employee.get("id")

            if not phone:
                results["failed"] += 1
                results["errors"].append(f"No phone for {name}")
                continue

            result = await self.send_initial_outreach(
                to_number=phone,
                employee_name=name,
                company_name=company_name,
                employee_id=emp_id
            )

            if result.get("success"):
                results["sent"] += 1
            else:
                results["failed"] += 1
                results["errors"].append(f"{name}: {result.get('error')}")

        return results


# Initialize SMS interface
sms_interface = SMSInterface()


# API Routes
@router.post("/webhook")
async def sms_webhook(request: Request):
    """Handle incoming SMS from Twilio"""
    try:
        form_data = await request.form()

        from_number = form_data.get("From", "")
        body = form_data.get("Body", "")
        message_sid = form_data.get("MessageSid", "")

        logger.info(f"Incoming SMS from {from_number}: {body}")

        # Handle the message and get response
        response_text = await sms_interface.handle_incoming_sms(
            from_number=from_number,
            body=body,
            twilio_sid=message_sid
        )

        # Create TwiML response
        response = MessagingResponse()
        response.message(response_text)

        return PlainTextResponse(
            content=str(response),
            media_type="application/xml"
        )

    except Exception as e:
        logger.error(f"SMS webhook error: {str(e)}")
        response = MessagingResponse()
        response.message("Sorry, there was an error processing your message.")
        return PlainTextResponse(
            content=str(response),
            media_type="application/xml"
        )


@router.post("/send")
async def send_sms(request: Request):
    """Send an SMS message"""
    try:
        data = await request.json()

        to_number = data.get("to")
        message = data.get("message")
        employee_id = data.get("employee_id")

        if not to_number or not message:
            raise HTTPException(status_code=400, detail="Missing 'to' or 'message'")

        result = await sms_interface.send_sms(
            to_number=to_number,
            message=message,
            employee_id=employee_id
        )

        if result.get("success"):
            return result
        else:
            raise HTTPException(status_code=500, detail=result.get("error"))

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Send SMS error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/consent-request")
async def send_consent_request(request: Request):
    """Send double opt-in consent request SMS (TFV compliant - Step 1)"""
    try:
        data = await request.json()

        to_number = data.get("phone_number")
        employee_name = data.get("name", "there")
        company_name = data.get("company", "our team")
        employee_id = data.get("employee_id")

        if not to_number:
            raise HTTPException(status_code=400, detail="Missing 'phone_number'")

        result = await sms_interface.send_consent_request(
            to_number=to_number,
            employee_name=employee_name,
            company_name=company_name,
            employee_id=employee_id
        )

        return result

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Consent request SMS error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/outreach")
async def send_outreach(request: Request):
    """Send initial outreach SMS to an employee (use /consent-request for TFV compliant flow)"""
    try:
        data = await request.json()

        to_number = data.get("phone_number")
        employee_name = data.get("name", "there")
        company_name = data.get("company", "our team")
        employee_id = data.get("employee_id")

        if not to_number:
            raise HTTPException(status_code=400, detail="Missing 'phone_number'")

        result = await sms_interface.send_initial_outreach(
            to_number=to_number,
            employee_name=employee_name,
            company_name=company_name,
            employee_id=employee_id
        )

        return result

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Outreach SMS error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/bulk-consent-request")
async def bulk_consent_request(request: Request):
    """Send consent request SMS to multiple employees (TFV compliant - Step 1)"""
    try:
        data = await request.json()

        employees = data.get("employees", [])
        company_name = data.get("company", "our team")

        if not employees:
            raise HTTPException(status_code=400, detail="No employees provided")

        result = await sms_interface.bulk_send_consent_requests(
            employees=employees,
            company_name=company_name
        )

        return result

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Bulk consent request error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/bulk-outreach")
async def bulk_outreach(request: Request):
    """Send outreach SMS to multiple employees (use /bulk-consent-request for TFV compliant flow)"""
    try:
        data = await request.json()

        employees = data.get("employees", [])
        company_name = data.get("company", "our team")

        if not employees:
            raise HTTPException(status_code=400, detail="No employees provided")

        result = await sms_interface.bulk_send_outreach(
            employees=employees,
            company_name=company_name
        )

        return result

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Bulk outreach error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/messages")
async def get_messages(limit: int = 100):
    """Get SMS message history"""
    try:
        if not supabase.client:
            return []

        # Fetch messages with employee info
        result = await supabase.client.table("sms_messages").select(
            "*, employees(name)"
        ).order("created_at", desc=True).limit(limit).execute()

        messages = []
        for msg in result.data or []:
            employee_name = None
            if msg.get("employees"):
                employee_name = msg["employees"].get("name")
            messages.append({
                "id": msg.get("id"),
                "employee_id": msg.get("employee_id"),
                "phone_number": msg.get("phone_number"),
                "direction": msg.get("direction"),
                "message": msg.get("message"),
                "status": msg.get("status"),
                "created_at": msg.get("created_at"),
                "employee_name": employee_name
            })

        return messages

    except Exception as e:
        logger.error(f"Get messages error: {str(e)}")
        return []
