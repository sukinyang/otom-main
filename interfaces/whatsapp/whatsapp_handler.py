"""
WhatsApp Interface for Otom
Handles WhatsApp messaging via Twilio WhatsApp API
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
    TWILIO_AVAILABLE = True
except ImportError:
    Client = None
    MessagingResponse = None
    TWILIO_AVAILABLE = False

from utils.logger import setup_logger
from integrations.supabase_mcp import supabase

logger = setup_logger("whatsapp_handler")

if not TWILIO_AVAILABLE:
    logger.warning("Twilio package not installed - WhatsApp features unavailable")

router = APIRouter(prefix="/whatsapp", tags=["WhatsApp"])


class WhatsAppInterface:
    """Handles WhatsApp-based interactions with Otom via Twilio"""

    def __init__(self):
        """Initialize WhatsApp interface with Twilio"""
        self.account_sid = os.getenv("TWILIO_ACCOUNT_SID")
        self.auth_token = os.getenv("TWILIO_AUTH_TOKEN")
        # WhatsApp numbers are prefixed with 'whatsapp:'
        self.whatsapp_number = os.getenv("TWILIO_WHATSAPP_NUMBER", "whatsapp:+14155238886")

        # Initialize Twilio client if credentials are available
        if self.account_sid and self.auth_token and TWILIO_AVAILABLE:
            self.client = Client(self.account_sid, self.auth_token)
            logger.info("Twilio WhatsApp interface initialized")
        else:
            self.client = None
            logger.warning("Twilio credentials not configured - WhatsApp features unavailable")

        # Cal.com booking link
        self.cal_link = os.getenv("CAL_BOOKING_URL", "https://cal.com/sukin-yang-vw9ds8/meet-with-otom")

        # Message templates
        self.templates = {
            "initial_outreach": """Hi {name}! 👋

I'm Otom, a business process consultant working with {company}.

We're reaching out to learn about your workflows and gather feedback.

Would you be available for a quick 10-15 minute call?

Reply:
*1* - Yes, call me now
*2* - Schedule for later
*3* - Not interested

Thank you!""",

            "schedule_followup": """Great! 📅

Pick a time that works for you:
{cal_link}

Just click the link and choose a slot. We'll call you at the scheduled time!""",

            "call_confirmation": """Perfect! ✅

You'll receive a call from Otom shortly.

The call will take about 10-15 minutes. We appreciate your time!""",

            "thank_you": """Thank you for your response. 🙏

We appreciate your time! If you change your mind, just send "CALL" and we'll reach out."""
        }

    async def send_whatsapp(
        self,
        to_number: str,
        message: str,
        employee_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Send a WhatsApp message"""
        if not self.client:
            logger.error("Twilio client not initialized")
            return {"success": False, "error": "WhatsApp not configured"}

        try:
            # Ensure proper WhatsApp format
            if not to_number.startswith("whatsapp:"):
                to_number = f"whatsapp:{to_number}"

            # Send the message
            twilio_message = self.client.messages.create(
                body=message,
                from_=self.whatsapp_number,
                to=to_number
            )

            # Log to Supabase
            wa_record = {
                "id": str(uuid.uuid4()),
                "employee_id": employee_id,
                "phone_number": to_number.replace("whatsapp:", ""),
                "direction": "outbound",
                "message": message,
                "twilio_sid": twilio_message.sid,
                "status": twilio_message.status,
                "platform": "whatsapp",
                "created_at": datetime.utcnow().isoformat()
            }

            if supabase.client:
                try:
                    supabase.client.table("whatsapp_messages").insert(wa_record).execute()
                except Exception as e:
                    logger.warning(f"Failed to log WhatsApp message: {e}")

            logger.info(f"WhatsApp sent to {to_number}: {twilio_message.sid}")
            return {
                "success": True,
                "message_sid": twilio_message.sid,
                "status": twilio_message.status
            }

        except Exception as e:
            logger.error(f"Failed to send WhatsApp: {str(e)}")
            return {"success": False, "error": str(e)}

    async def send_initial_outreach(
        self,
        to_number: str,
        employee_name: str,
        company_name: str,
        employee_id: str
    ) -> Dict[str, Any]:
        """Send initial outreach WhatsApp to an employee"""
        message = self.templates["initial_outreach"].format(
            name=employee_name,
            company=company_name
        )
        return await self.send_whatsapp(to_number, message, employee_id)

    async def handle_incoming_whatsapp(
        self,
        from_number: str,
        body: str,
        twilio_sid: str
    ) -> str:
        """Handle incoming WhatsApp and return response"""
        # Remove whatsapp: prefix for lookup
        phone_number = from_number.replace("whatsapp:", "")
        body_lower = body.strip().lower()

        # Log incoming message
        wa_record = {
            "id": str(uuid.uuid4()),
            "phone_number": phone_number,
            "direction": "inbound",
            "message": body,
            "twilio_sid": twilio_sid,
            "status": "received",
            "platform": "whatsapp",
            "created_at": datetime.utcnow().isoformat()
        }

        # Find employee by phone number
        employee = None
        if supabase.client:
            try:
                supabase.client.table("whatsapp_messages").insert(wa_record).execute()
            except Exception as e:
                logger.warning(f"Failed to log incoming WhatsApp: {e}")

            # Try to find the employee
            result = supabase.client.table("employees").select("*").eq("phone_number", phone_number).execute()
            if result.data:
                employee = result.data[0]
                wa_record["employee_id"] = employee.get("id")

        # Determine response based on input
        if body_lower in ["1", "yes", "call", "call me"]:
            # User wants a call now - trigger Vapi call
            if employee:
                await self._trigger_vapi_call(phone_number, employee)
                if supabase.client:
                    supabase.client.table("employees").update(
                        {"status": "call_requested", "updated_at": datetime.utcnow().isoformat()}
                    ).eq("id", employee["id"]).execute()
            return self.templates["call_confirmation"]

        elif body_lower in ["2", "schedule", "later"]:
            # User wants to schedule - send Cal.com link
            if employee and supabase.client:
                supabase.client.table("employees").update(
                    {"status": "scheduling", "updated_at": datetime.utcnow().isoformat()}
                ).eq("id", employee["id"]).execute()
            return self.templates["schedule_followup"].format(cal_link=self.cal_link)

        elif body_lower in ["3", "no", "not interested", "stop"]:
            # User not interested
            if employee and supabase.client:
                supabase.client.table("employees").update(
                    {"status": "declined", "updated_at": datetime.utcnow().isoformat()}
                ).eq("id", employee["id"]).execute()
            return self.templates["thank_you"]

        else:
            # Default response
            return "Thanks for your message! Reply *1* for a call now, *2* to schedule, or *3* if not interested."

    async def _trigger_vapi_call(self, phone_number: str, employee: Dict) -> None:
        """Trigger a Vapi call to the phone number with full employee context"""
        import aiohttp

        vapi_api_key = os.getenv("VAPI_API_KEY")
        vapi_assistant_id = os.getenv("VAPI_ASSISTANT_ID")
        vapi_phone_id = os.getenv("VAPI_PHONE_NUMBER_ID")

        if not vapi_api_key or not vapi_phone_id:
            logger.warning("VAPI credentials not set - cannot trigger call")
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
                    "kpis": employee.get("notes", ""),
                    "email": employee.get("email", ""),
                    "phone": phone_number
                }

                payload = {
                    "phoneNumberId": vapi_phone_id,
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

                logger.info(f"Triggering Vapi call from WhatsApp: {variable_values}")

                async with session.post(
                    "https://api.vapi.ai/call/phone",
                    headers=headers,
                    json=payload
                ) as response:
                    if response.status == 201:
                        result = await response.json()
                        logger.info(f"Vapi call triggered from WhatsApp: {result.get('id')}")
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
        """Send outreach WhatsApp to multiple employees"""
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


# Initialize WhatsApp interface
whatsapp_interface = WhatsAppInterface()


# ============================================
# API Routes
# ============================================

@router.post("/webhook")
async def whatsapp_webhook(request: Request):
    """Handle incoming WhatsApp from Twilio"""
    try:
        form_data = await request.form()

        from_number = form_data.get("From", "")
        body = form_data.get("Body", "")
        message_sid = form_data.get("MessageSid", "")

        logger.info(f"Incoming WhatsApp from {from_number}: {body}")

        # Handle the message and get response
        response_text = await whatsapp_interface.handle_incoming_whatsapp(
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
        logger.error(f"WhatsApp webhook error: {str(e)}")
        response = MessagingResponse()
        response.message("Sorry, there was an error processing your message.")
        return PlainTextResponse(
            content=str(response),
            media_type="application/xml"
        )


@router.post("/send")
async def send_whatsapp(request: Request):
    """Send a WhatsApp message"""
    try:
        data = await request.json()

        to_number = data.get("to")
        message = data.get("message")
        employee_id = data.get("employee_id")

        if not to_number or not message:
            raise HTTPException(status_code=400, detail="Missing 'to' or 'message'")

        result = await whatsapp_interface.send_whatsapp(
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
        logger.error(f"Send WhatsApp error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/outreach")
async def send_whatsapp_outreach(request: Request):
    """Send initial outreach WhatsApp to an employee"""
    try:
        data = await request.json()

        to_number = data.get("phone_number")
        employee_name = data.get("name", "there")
        company_name = data.get("company", "our team")
        employee_id = data.get("employee_id")

        if not to_number:
            raise HTTPException(status_code=400, detail="Missing 'phone_number'")

        result = await whatsapp_interface.send_initial_outreach(
            to_number=to_number,
            employee_name=employee_name,
            company_name=company_name,
            employee_id=employee_id
        )

        return result

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"WhatsApp outreach error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/bulk-outreach")
async def bulk_whatsapp_outreach(request: Request):
    """Send outreach WhatsApp to multiple employees"""
    try:
        data = await request.json()

        employees = data.get("employees", [])
        company_name = data.get("company", "our team")

        if not employees:
            raise HTTPException(status_code=400, detail="No employees provided")

        result = await whatsapp_interface.bulk_send_outreach(
            employees=employees,
            company_name=company_name
        )

        return result

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Bulk WhatsApp outreach error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/config")
async def get_whatsapp_config():
    """Check WhatsApp configuration status"""
    return {
        "TWILIO_ACCOUNT_SID": "set" if os.getenv("TWILIO_ACCOUNT_SID") else "MISSING",
        "TWILIO_AUTH_TOKEN": "set" if os.getenv("TWILIO_AUTH_TOKEN") else "MISSING",
        "TWILIO_WHATSAPP_NUMBER": os.getenv("TWILIO_WHATSAPP_NUMBER", "not configured"),
        "note": "WhatsApp requires Twilio WhatsApp Business API approval"
    }
