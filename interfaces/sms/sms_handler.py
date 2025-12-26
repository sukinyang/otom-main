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

        # SMS templates
        self.templates = {
            "initial_outreach": """Hi {name}! This is Otom from {company}.

We're reaching out to learn about your experience and gather feedback.

Would you be available for a quick 5-10 minute call?

Reply:
1 - Yes, call me now
2 - Schedule for later
3 - Not interested

Thank you!""",

            "schedule_followup": """Great! When works best for you?

Reply with a number:
1 - Today
2 - Tomorrow
3 - This week

Or reply with a specific time like "Tuesday 2pm".""",

            "call_confirmation": """Perfect! You'll receive a call from Otom shortly.

The call will take about 5-10 minutes. We appreciate your time!""",

            "thank_you": """Thank you for your response. We appreciate your time!

If you change your mind, just reply "CALL" and we'll reach out."""
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
                await supabase.insert("sms_messages", sms_record)

            logger.info(f"SMS sent to {to_number}: {twilio_message.sid}")
            return {
                "success": True,
                "message_sid": twilio_message.sid,
                "status": twilio_message.status
            }

        except Exception as e:
            logger.error(f"Failed to send SMS: {str(e)}")
            return {"success": False, "error": str(e)}

    async def send_initial_outreach(
        self,
        to_number: str,
        employee_name: str,
        company_name: str,
        employee_id: str
    ) -> Dict[str, Any]:
        """Send initial outreach SMS to an employee"""
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
        """Handle incoming SMS and return response"""
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
            await supabase.insert("sms_messages", sms_record)
            # Try to find the employee
            result = await supabase.query(
                "employees",
                filters={"phone_number": from_number}
            )
            if result:
                employee = result[0]
                sms_record["employee_id"] = employee.get("id")

        # Determine response based on input
        if body_lower in ["1", "yes", "call", "call me", "yes call me"]:
            # User wants a call now - trigger Vapi call
            if employee:
                await self._trigger_vapi_call(from_number, employee)
                # Update employee status
                if supabase.client:
                    await supabase.update(
                        "employees",
                        employee["id"],
                        {"status": "call_requested", "updated_at": datetime.utcnow().isoformat()}
                    )
            return self.templates["call_confirmation"]

        elif body_lower in ["2", "schedule", "later"]:
            # User wants to schedule
            if employee and supabase.client:
                await supabase.update(
                    "employees",
                    employee["id"],
                    {"status": "scheduling", "updated_at": datetime.utcnow().isoformat()}
                )
            return self.templates["schedule_followup"]

        elif body_lower in ["3", "no", "not interested", "stop"]:
            # User not interested
            if employee and supabase.client:
                await supabase.update(
                    "employees",
                    employee["id"],
                    {"status": "declined", "updated_at": datetime.utcnow().isoformat()}
                )
            return self.templates["thank_you"]

        elif body_lower in ["today", "1"] and employee:
            # Schedule for today
            return self.templates["call_confirmation"]

        elif body_lower in ["tomorrow", "2"]:
            return "Got it! We'll call you tomorrow. What time works best? (e.g., '2pm' or '10am')"

        elif body_lower in ["this week", "3"]:
            return "Sure! What day and time works best? (e.g., 'Tuesday 2pm')"

        else:
            # Try to parse as a time/schedule
            return "Thanks for your message! Reply 1 for a call now, 2 to schedule, or 3 if not interested."

    async def _trigger_vapi_call(self, phone_number: str, employee: Dict) -> None:
        """Trigger a Vapi call to the phone number"""
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

                payload = {
                    "phoneNumberId": os.getenv("VAPI_PHONE_NUMBER_ID"),
                    "customer": {
                        "number": phone_number,
                        "name": employee.get("name", "")
                    }
                }

                if vapi_assistant_id:
                    payload["assistantId"] = vapi_assistant_id

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

    async def bulk_send_outreach(
        self,
        employees: List[Dict],
        company_name: str
    ) -> Dict[str, Any]:
        """Send outreach SMS to multiple employees"""
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


@router.post("/outreach")
async def send_outreach(request: Request):
    """Send initial outreach SMS to an employee"""
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


@router.post("/bulk-outreach")
async def bulk_outreach(request: Request):
    """Send outreach SMS to multiple employees"""
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
