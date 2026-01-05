"""
Otom AI Consultant - Main Application
Voice-first AI business consultant using Whisper (STT) + Sesame (TTS)
"""

import os
import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from dotenv import load_dotenv
import uvicorn
from apscheduler.schedulers.asyncio import AsyncIOScheduler

from core.consultant.otom_brain import OtomConsultant
from interfaces.voice.voice_handler import VoiceInterface
from interfaces.chat.chat_handler import ChatInterface
from interfaces.email.email_handler import EmailInterface, email_router
from interfaces.sms.sms_handler import router as sms_router
from interfaces.whatsapp.whatsapp_handler import router as whatsapp_router
from interfaces.slack.slack_handler import router as slack_router
from interfaces.teams.teams_handler import router as teams_router
from interfaces.zoom.zoom_handler import router as zoom_router
from utils.logger import setup_logger

# Load environment variables
load_dotenv()

# Initialize logger
logger = setup_logger("otom_main")

# Scheduler for cron jobs
scheduler = AsyncIOScheduler()

async def check_scheduled_calls():
    """Background job to trigger scheduled calls every minute"""
    from datetime import datetime, timedelta
    from integrations.supabase_mcp import supabase

    if not supabase.client:
        return

    try:
        now = datetime.utcnow()
        window_start = (now - timedelta(minutes=2)).isoformat()
        window_end = (now + timedelta(minutes=2)).isoformat()

        # Get pending bookings in the current time window
        result = supabase.client.table("bookings").select("*").eq(
            "status", "scheduled"
        ).gte("scheduled_at", window_start).lte("scheduled_at", window_end).execute()

        for booking in result.data or []:
            phone = booking.get("client_phone")
            if phone:
                # Import here to avoid circular imports
                success = await trigger_scheduled_call(phone, booking.get("notes", ""))
                if success:
                    supabase.client.table("bookings").update(
                        {"status": "call_triggered"}
                    ).eq("id", booking["id"]).execute()
                    logger.info(f"Scheduled call triggered for booking {booking['id']}")

    except Exception as e:
        logger.error(f"Error in scheduled call check: {e}")

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events"""
    # Start the scheduler
    scheduler.add_job(check_scheduled_calls, 'interval', minutes=1)
    scheduler.start()
    logger.info("Scheduled call checker started (runs every minute)")
    yield
    # Shutdown
    scheduler.shutdown()

# Initialize FastAPI app
app = FastAPI(
    title="Otom AI Consultant",
    description="AI-powered business consultant with voice-first interface",
    version="1.0.0",
    lifespan=lifespan
)

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize logger
logger = setup_logger("otom_main")

# Initialize Otom consultant
otom = OtomConsultant()

# Initialize interfaces
voice_interface = VoiceInterface(otom)
chat_interface = ChatInterface(otom)
email_interface = EmailInterface(otom)

@app.get("/")
async def root():
    """Health check endpoint"""
    try:
        from integrations.supabase_mcp import supabase
        db_status = "connected" if supabase.client else "not configured"
    except Exception:
        db_status = "error"
    return {
        "status": "active",
        "service": "Otom AI Consultant",
        "version": "1.0.0",
        "database": db_status,
        "capabilities": [
            "Voice consultations",
            "Strategy development",
            "Market analysis",
            "Business optimization"
        ]
    }

@app.post("/consultation/start")
async def start_consultation(phone_number: str):
    """Initiate a voice consultation with Otom"""
    try:
        session_id = await voice_interface.initiate_call(phone_number)
        return {
            "status": "success",
            "session_id": session_id,
            "message": "Otom will call you shortly for your consultation"
        }
    except Exception as e:
        logger.error(f"Failed to start consultation: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/consultation/schedule")
async def schedule_consultation(email: str, preferred_time: str):
    """Schedule a consultation for later"""
    try:
        booking = await otom.schedule_consultation(email, preferred_time)
        return {
            "status": "scheduled",
            "booking_id": booking["id"],
            "scheduled_time": booking["time"]
        }
    except Exception as e:
        logger.error(f"Failed to schedule consultation: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/consultation/{session_id}/status")
async def get_consultation_status(session_id: str):
    """Get the status of an ongoing consultation"""
    try:
        status = await otom.get_session_status(session_id)
        return status
    except Exception as e:
        logger.error(f"Failed to get consultation status: {str(e)}")
        raise HTTPException(status_code=404, detail="Session not found")

@app.get("/services")
async def get_services():
    """Get list of available consulting services"""
    return {
        "services": [
            {
                "name": "Quick Assessment",
                "description": "48-hour business analysis with actionable recommendations",
                "price": "$500",
                "deliverables": ["Discovery call", "5-page report", "3 key recommendations"]
            },
            {
                "name": "Strategic Planning",
                "description": "Comprehensive strategy development for your business",
                "price": "$2,500",
                "deliverables": ["3 strategy sessions", "Full strategy deck", "Implementation roadmap", "30-day follow-up"]
            },
            {
                "name": "Transformation Partner",
                "description": "Full-service consulting engagement",
                "price": "$10,000",
                "deliverables": ["Weekly consultations", "Complete business analysis", "Custom frameworks", "Ongoing support"]
            }
        ]
    }

# Employee endpoints
@app.get("/employees")
async def get_employees():
    """Get all employees"""
    from integrations.supabase_mcp import supabase
    if not supabase.client:
        return []
    try:
        result = supabase.client.table("employees").select("*").order("created_at", desc=True).execute()
        return result.data or []
    except Exception as e:
        logger.error(f"Failed to fetch employees: {e}")
        return []

@app.get("/employees/{employee_id}")
async def get_employee(employee_id: str):
    """Get a single employee"""
    from integrations.supabase_mcp import supabase
    if not supabase.client:
        raise HTTPException(status_code=503, detail="Database not available")
    try:
        result = supabase.client.table("employees").select("*").eq("id", employee_id).single().execute()
        return result.data
    except Exception as e:
        logger.error(f"Failed to fetch employee: {e}")
        raise HTTPException(status_code=404, detail="Employee not found")

@app.post("/employees")
async def create_employee(request: Request):
    """Create a new employee"""
    from integrations.supabase_mcp import supabase
    if not supabase.client:
        raise HTTPException(status_code=503, detail="Database not available")
    try:
        data = await request.json()
        result = supabase.client.table("employees").insert(data).execute()
        return result.data[0] if result.data else None
    except Exception as e:
        logger.error(f"Failed to create employee: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/employees/{employee_id}")
async def update_employee(employee_id: str, request: Request):
    """Update an employee"""
    from integrations.supabase_mcp import supabase
    if not supabase.client:
        raise HTTPException(status_code=503, detail="Database not available")
    try:
        data = await request.json()
        result = supabase.client.table("employees").update(data).eq("id", employee_id).execute()
        return result.data[0] if result.data else None
    except Exception as e:
        logger.error(f"Failed to update employee: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/employees/import")
async def import_employees(request: Request):
    """Bulk import employees from parsed data"""
    from integrations.supabase_mcp import supabase
    if not supabase.client:
        raise HTTPException(status_code=503, detail="Database not available")
    try:
        data = await request.json()
        employees = data.get("employees", [])
        if not employees:
            raise HTTPException(status_code=400, detail="No employees data provided")

        imported = 0
        skipped = 0
        errors = []

        for emp in employees:
            try:
                # Validate required fields - name is required, phone or email needed
                if not emp.get("name"):
                    skipped += 1
                    errors.append(f"Missing name for employee")
                    continue

                if not emp.get("phone_number") and not emp.get("email"):
                    skipped += 1
                    errors.append(f"Missing phone or email for: {emp.get('name', 'Unknown')}")
                    continue

                # Prepare employee data
                employee_data = {
                    "name": emp.get("name", "").strip(),
                    "phone_number": emp.get("phone_number", "").strip() if emp.get("phone_number") else "",
                    "email": emp.get("email", "").strip() or None,
                    "company": emp.get("company", "").strip() or None,
                    "department": emp.get("department", "").strip() or None,
                    "role": emp.get("role", "").strip() or None,
                    "status": emp.get("status", "active"),
                    "notes": emp.get("notes", "").strip() or None
                }

                # Insert into database
                supabase.client.table("employees").insert(employee_data).execute()
                imported += 1
            except Exception as e:
                skipped += 1
                errors.append(f"Error importing {emp.get('name', 'Unknown')}: {str(e)}")

        return {
            "success": True,
            "imported": imported,
            "skipped": skipped,
            "errors": errors[:10]  # Return first 10 errors
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to import employees: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Consultations endpoints
@app.get("/consultations")
async def get_consultations():
    """Get all consultations"""
    from integrations.supabase_mcp import supabase
    if not supabase.client:
        return []
    try:
        result = supabase.client.table("consultations").select("*").order("created_at", desc=True).execute()
        return result.data or []
    except Exception as e:
        logger.error(f"Failed to fetch consultations: {e}")
        return []

@app.get("/consultations/{consultation_id}")
async def get_consultation(consultation_id: str):
    """Get a single consultation"""
    from integrations.supabase_mcp import supabase
    if not supabase.client:
        raise HTTPException(status_code=503, detail="Database not available")
    try:
        result = supabase.client.table("consultations").select("*").eq("id", consultation_id).single().execute()
        return result.data
    except Exception as e:
        logger.error(f"Failed to fetch consultation: {e}")
        raise HTTPException(status_code=404, detail="Consultation not found")

@app.post("/consultations")
async def create_consultation(request: Request):
    """Create a new consultation"""
    from integrations.supabase_mcp import supabase
    if not supabase.client:
        raise HTTPException(status_code=503, detail="Database not available")
    try:
        data = await request.json()
        result = supabase.client.table("consultations").insert(data).execute()
        return result.data[0] if result.data else None
    except Exception as e:
        logger.error(f"Failed to create consultation: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/consultations/{consultation_id}")
async def update_consultation(consultation_id: str, request: Request):
    """Update a consultation"""
    from integrations.supabase_mcp import supabase
    if not supabase.client:
        raise HTTPException(status_code=503, detail="Database not available")
    try:
        data = await request.json()
        result = supabase.client.table("consultations").update(data).eq("id", consultation_id).execute()
        return result.data[0] if result.data else None
    except Exception as e:
        logger.error(f"Failed to update consultation: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Processes endpoints
@app.get("/processes")
async def get_processes():
    """Get all processes"""
    from integrations.supabase_mcp import supabase
    if not supabase.client:
        return []
    try:
        result = supabase.client.table("processes").select("*").order("created_at", desc=True).execute()
        return result.data or []
    except Exception as e:
        logger.error(f"Failed to fetch processes: {e}")
        return []

@app.get("/processes/{process_id}")
async def get_process(process_id: str):
    """Get a single process"""
    from integrations.supabase_mcp import supabase
    if not supabase.client:
        raise HTTPException(status_code=503, detail="Database not available")
    try:
        result = supabase.client.table("processes").select("*").eq("id", process_id).single().execute()
        return result.data
    except Exception as e:
        logger.error(f"Failed to fetch process: {e}")
        raise HTTPException(status_code=404, detail="Process not found")

@app.post("/processes")
async def create_process(request: Request):
    """Create a new process"""
    from integrations.supabase_mcp import supabase
    if not supabase.client:
        raise HTTPException(status_code=503, detail="Database not available")
    try:
        data = await request.json()
        result = supabase.client.table("processes").insert(data).execute()
        return result.data[0] if result.data else None
    except Exception as e:
        logger.error(f"Failed to create process: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/processes/{process_id}")
async def update_process(process_id: str, request: Request):
    """Update a process"""
    from integrations.supabase_mcp import supabase
    if not supabase.client:
        raise HTTPException(status_code=503, detail="Database not available")
    try:
        data = await request.json()
        result = supabase.client.table("processes").update(data).eq("id", process_id).execute()
        return result.data[0] if result.data else None
    except Exception as e:
        logger.error(f"Failed to update process: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Reports endpoints
@app.get("/reports")
async def get_reports():
    """Get all reports"""
    from integrations.supabase_mcp import supabase
    if not supabase.client:
        return []
    try:
        result = supabase.client.table("reports").select("*").order("created_at", desc=True).execute()
        return result.data or []
    except Exception as e:
        logger.error(f"Failed to fetch reports: {e}")
        return []

@app.get("/reports/{report_id}")
async def get_report(report_id: str):
    """Get a single report"""
    from integrations.supabase_mcp import supabase
    if not supabase.client:
        raise HTTPException(status_code=503, detail="Database not available")
    try:
        result = supabase.client.table("reports").select("*").eq("id", report_id).single().execute()
        return result.data
    except Exception as e:
        logger.error(f"Failed to fetch report: {e}")
        raise HTTPException(status_code=404, detail="Report not found")

@app.post("/reports")
async def create_report(request: Request):
    """Create a new report"""
    from integrations.supabase_mcp import supabase
    if not supabase.client:
        raise HTTPException(status_code=503, detail="Database not available")
    try:
        data = await request.json()
        result = supabase.client.table("reports").insert(data).execute()
        return result.data[0] if result.data else None
    except Exception as e:
        logger.error(f"Failed to create report: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Cal.com webhook for scheduled calls
@app.post("/webhooks/cal")
async def cal_webhook(request: Request):
    """Handle Cal.com booking webhooks - triggers Vapi call at scheduled time"""
    import aiohttp
    from datetime import datetime
    from integrations.supabase_mcp import supabase

    try:
        data = await request.json()
        event_type = data.get("triggerEvent")
        payload = data.get("payload", {})

        logger.info(f"Cal.com webhook received: {event_type}")

        if event_type == "BOOKING_CREATED":
            # Extract booking details
            attendees = payload.get("attendees", [])
            attendee = attendees[0] if attendees else {}

            booking_data = {
                "id": payload.get("uid"),
                "client_email": attendee.get("email"),
                "client_phone": attendee.get("phone") or payload.get("responses", {}).get("phone", {}).get("value"),
                "scheduled_at": payload.get("startTime"),
                "timezone": attendee.get("timeZone", "UTC"),
                "status": "scheduled",
                "source_platform": "cal.com",
                "notes": f"Booked by {attendee.get('name', 'Unknown')} via Cal.com",
                "created_at": datetime.utcnow().isoformat()
            }

            # Save to database
            if supabase.client:
                supabase.client.table("bookings").insert(booking_data).execute()
                logger.info(f"Booking saved: {booking_data['id']}")

            # If booking is within next 5 minutes, trigger call immediately
            if booking_data.get("scheduled_at"):
                scheduled_time = datetime.fromisoformat(booking_data["scheduled_at"].replace("Z", "+00:00"))
                now = datetime.now(scheduled_time.tzinfo)
                minutes_until = (scheduled_time - now).total_seconds() / 60

                if minutes_until <= 5 and booking_data.get("client_phone"):
                    # Trigger Vapi call now
                    await trigger_scheduled_call(booking_data["client_phone"], attendee.get("name", ""))
                    logger.info(f"Immediate call triggered for {booking_data['client_phone']}")

            return {"status": "success", "booking_id": booking_data.get("id")}

        elif event_type == "BOOKING_CANCELLED":
            booking_uid = payload.get("uid")
            if supabase.client and booking_uid:
                supabase.client.table("bookings").update(
                    {"status": "cancelled"}
                ).eq("id", booking_uid).execute()
            return {"status": "success", "cancelled": booking_uid}

        return {"status": "received", "event": event_type}

    except Exception as e:
        logger.error(f"Cal.com webhook error: {e}")
        return {"status": "error", "message": str(e)}

async def trigger_scheduled_call(phone_number: str, name: str = ""):
    """Trigger a Vapi call for a scheduled booking with full employee context"""
    import aiohttp
    from integrations.supabase_mcp import supabase

    vapi_api_key = os.getenv("VAPI_API_KEY")
    vapi_phone_id = os.getenv("VAPI_PHONE_NUMBER_ID")
    vapi_assistant_id = os.getenv("VAPI_ASSISTANT_ID")

    if not vapi_api_key or not vapi_phone_id:
        logger.error("VAPI credentials not configured")
        return False

    # Look up employee by phone number to get full context
    employee = None
    if supabase.client:
        try:
            result = supabase.client.table("employees").select("*").eq("phone_number", phone_number).execute()
            if result.data:
                employee = result.data[0]
                logger.info(f"Found employee context for {phone_number}: {employee.get('name')}")
        except Exception as e:
            logger.warning(f"Could not fetch employee data: {e}")

    try:
        async with aiohttp.ClientSession() as session:
            headers = {
                "Authorization": f"Bearer {vapi_api_key}",
                "Content-Type": "application/json"
            }

            # Build variable values for Vapi template
            variable_values = {
                "full_name": employee.get("name", name) if employee else name,
                "company_name": employee.get("company", "") if employee else "",
                "department": employee.get("department", "") if employee else "",
                "position": employee.get("role", "") if employee else "",
                "employee_id": employee.get("id", "") if employee else "",
                "kpis": employee.get("notes", "") if employee else "",
                "email": employee.get("email", "") if employee else "",
                "phone": phone_number
            }

            payload = {
                "phoneNumberId": vapi_phone_id,
                "customer": {
                    "number": phone_number,
                    "name": variable_values["full_name"]
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
                    logger.info(f"Scheduled Vapi call triggered: {result.get('id')}")
                    return True
                else:
                    error = await response.text()
                    logger.error(f"Failed to trigger scheduled call: {error}")
                    return False

    except Exception as e:
        logger.error(f"Error triggering scheduled call: {e}")
        return False

# Debug endpoint to check SMS config
@app.get("/debug/sms-config")
async def debug_sms_config():
    """Check SMS/Twilio configuration"""
    return {
        "TWILIO_ACCOUNT_SID": "set" if os.getenv("TWILIO_ACCOUNT_SID") else "MISSING",
        "TWILIO_AUTH_TOKEN": "set" if os.getenv("TWILIO_AUTH_TOKEN") else "MISSING",
        "TWILIO_PHONE_NUMBER": os.getenv("TWILIO_PHONE_NUMBER", "MISSING")
    }

# Debug endpoint to check bookings
@app.get("/debug/bookings")
async def debug_bookings():
    """Check pending bookings"""
    from datetime import datetime
    from integrations.supabase_mcp import supabase

    if not supabase.client:
        return {"error": "Database not available"}

    try:
        result = supabase.client.table("bookings").select("*").order("created_at", desc=True).limit(10).execute()
        return {
            "current_time_utc": datetime.utcnow().isoformat(),
            "bookings": result.data or []
        }
    except Exception as e:
        return {"error": str(e)}

# Test endpoint to trigger a Vapi call with employee context
@app.post("/test/trigger-call/{employee_id}")
async def test_trigger_call(employee_id: str):
    """Test endpoint to trigger a Vapi call with full employee context"""
    import aiohttp
    from integrations.supabase_mcp import supabase

    vapi_api_key = os.getenv("VAPI_API_KEY")
    vapi_phone_id = os.getenv("VAPI_PHONE_NUMBER_ID")
    vapi_assistant_id = os.getenv("VAPI_ASSISTANT_ID")

    # Check env vars first
    env_status = {
        "VAPI_API_KEY": "set" if vapi_api_key else "MISSING",
        "VAPI_PHONE_NUMBER_ID": "set" if vapi_phone_id else "MISSING",
        "VAPI_ASSISTANT_ID": "set" if vapi_assistant_id else "MISSING"
    }

    if not vapi_api_key or not vapi_phone_id:
        return {
            "success": False,
            "error": "Missing VAPI credentials",
            "env_status": env_status
        }

    if not supabase.client:
        raise HTTPException(status_code=503, detail="Database not available")

    try:
        # Get employee
        result = supabase.client.table("employees").select("*").eq("id", employee_id).single().execute()
        employee = result.data

        if not employee:
            raise HTTPException(status_code=404, detail="Employee not found")

        phone = employee.get("phone_number")
        if not phone:
            raise HTTPException(status_code=400, detail="Employee has no phone number")

        # Build context
        variable_values = {
            "full_name": employee.get("name", ""),
            "company_name": employee.get("company", ""),
            "department": employee.get("department", ""),
            "position": employee.get("role", ""),
            "employee_id": employee.get("id", ""),
            "kpis": employee.get("notes", ""),
            "email": employee.get("email", ""),
            "phone": phone
        }

        # Make direct Vapi call with detailed error handling
        async with aiohttp.ClientSession() as session:
            headers = {
                "Authorization": f"Bearer {vapi_api_key}",
                "Content-Type": "application/json"
            }

            payload = {
                "phoneNumberId": vapi_phone_id,
                "customer": {
                    "number": phone,
                    "name": variable_values["full_name"]
                },
                "assistantOverrides": {
                    "variableValues": variable_values
                }
            }

            if vapi_assistant_id:
                payload["assistantId"] = vapi_assistant_id

            async with session.post(
                "https://api.vapi.ai/call/phone",
                headers=headers,
                json=payload
            ) as response:
                response_text = await response.text()

                return {
                    "success": response.status == 201,
                    "vapi_status": response.status,
                    "vapi_response": response_text,
                    "employee": employee.get("name"),
                    "phone": phone,
                    "context_sent": variable_values,
                    "env_status": env_status
                }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Test call error: {e}")
        return {
            "success": False,
            "error": str(e),
            "env_status": env_status
        }

# Endpoint to manually trigger pending calls (for cron job)
@app.post("/webhooks/trigger-scheduled-calls")
async def trigger_pending_calls():
    """Trigger calls for bookings that are due now (call via cron every minute)"""
    from datetime import datetime, timedelta
    from integrations.supabase_mcp import supabase

    if not supabase.client:
        return {"status": "error", "message": "Database not available"}

    try:
        now = datetime.utcnow()
        window_start = (now - timedelta(minutes=2)).isoformat()
        window_end = (now + timedelta(minutes=2)).isoformat()

        # Get pending bookings in the current time window
        result = supabase.client.table("bookings").select("*").eq(
            "status", "scheduled"
        ).gte("scheduled_at", window_start).lte("scheduled_at", window_end).execute()

        calls_triggered = 0
        for booking in result.data or []:
            phone = booking.get("client_phone")
            if phone:
                success = await trigger_scheduled_call(phone, booking.get("notes", ""))
                if success:
                    # Update booking status
                    supabase.client.table("bookings").update(
                        {"status": "call_triggered"}
                    ).eq("id", booking["id"]).execute()
                    calls_triggered += 1

        return {"status": "success", "calls_triggered": calls_triggered}

    except Exception as e:
        logger.error(f"Error triggering scheduled calls: {e}")
        return {"status": "error", "message": str(e)}

# ============================================
# Public SMS Consent Page (for TFV Submission)
# ============================================
@app.get("/sms-consent", response_class=HTMLResponse)
async def sms_consent_page():
    """
    Public SMS consent page for Twilio Toll-Free Verification (TFV).
    Screenshot this page for your TFV submission proof of consent.
    """
    privacy_url = os.getenv("PRIVACY_URL", "https://otom.ai/privacy")
    terms_url = os.getenv("TERMS_URL", "https://otom.ai/terms")

    html_content = f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Otom SMS Consent</title>
        <style>
            * {{
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }}
            body {{
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 20px;
            }}
            .container {{
                background: white;
                border-radius: 16px;
                box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
                max-width: 500px;
                width: 100%;
                padding: 40px;
            }}
            .logo {{
                text-align: center;
                margin-bottom: 24px;
            }}
            .logo h1 {{
                font-size: 32px;
                color: #1a1a2e;
                font-weight: 700;
            }}
            .logo span {{
                color: #667eea;
            }}
            h2 {{
                color: #1a1a2e;
                font-size: 24px;
                margin-bottom: 16px;
                text-align: center;
            }}
            .description {{
                color: #4a5568;
                line-height: 1.6;
                margin-bottom: 24px;
                text-align: center;
            }}
            .consent-box {{
                background: #f7fafc;
                border: 2px solid #e2e8f0;
                border-radius: 12px;
                padding: 24px;
                margin-bottom: 24px;
            }}
            .consent-box h3 {{
                color: #2d3748;
                font-size: 16px;
                margin-bottom: 12px;
            }}
            .consent-box p {{
                color: #4a5568;
                font-size: 14px;
                line-height: 1.6;
                margin-bottom: 12px;
            }}
            .consent-box ul {{
                color: #4a5568;
                font-size: 14px;
                line-height: 1.8;
                margin-left: 20px;
            }}
            .message-preview {{
                background: #edf2f7;
                border-left: 4px solid #667eea;
                padding: 16px;
                border-radius: 0 8px 8px 0;
                margin: 16px 0;
            }}
            .message-preview code {{
                font-family: 'SF Mono', Monaco, 'Courier New', monospace;
                font-size: 13px;
                color: #2d3748;
                white-space: pre-wrap;
                display: block;
            }}
            .keywords {{
                display: flex;
                gap: 12px;
                flex-wrap: wrap;
                margin-top: 16px;
            }}
            .keyword {{
                background: #667eea;
                color: white;
                padding: 6px 14px;
                border-radius: 20px;
                font-size: 13px;
                font-weight: 500;
            }}
            .keyword.stop {{
                background: #e53e3e;
            }}
            .keyword.help {{
                background: #38a169;
            }}
            .links {{
                text-align: center;
                margin-top: 24px;
                padding-top: 24px;
                border-top: 1px solid #e2e8f0;
            }}
            .links a {{
                color: #667eea;
                text-decoration: none;
                margin: 0 12px;
                font-size: 14px;
            }}
            .links a:hover {{
                text-decoration: underline;
            }}
            .footer {{
                text-align: center;
                margin-top: 24px;
                color: #718096;
                font-size: 12px;
            }}
            .badge {{
                display: inline-block;
                background: #48bb78;
                color: white;
                padding: 4px 12px;
                border-radius: 12px;
                font-size: 12px;
                font-weight: 600;
                margin-bottom: 16px;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="logo">
                <h1><span>Otom</span></h1>
            </div>

            <span class="badge" style="display: block; text-align: center;">TCPA Compliant</span>

            <h2>SMS Communication Consent</h2>

            <p class="description">
                Otom uses SMS to schedule feedback calls and gather insights.
                Your consent is required before receiving any messages.
            </p>

            <div class="consent-box">
                <h3>How It Works (Double Opt-In)</h3>
                <p><strong>Step 1:</strong> You receive a consent request message:</p>
                <div class="message-preview">
                    <code>Hi [Name]! This is Otom on behalf of [Company].

We'd like to send you occasional texts for feedback & interview scheduling.

Reply YES to opt in. Reply STOP to opt out anytime.

Msg & data rates may apply. Privacy: {privacy_url}</code>
                </div>

                <p><strong>Step 2:</strong> Only if you reply YES, you'll receive our feedback invitation:</p>
                <div class="message-preview">
                    <code>Hi [Name]! This is Otom from [Company].

We're reaching out to learn about your experience and gather feedback.

Would you be available for a quick 15 minute call?

Reply:
1 - Yes, call me now
2 - Schedule for later
3 - Not interested

Reply STOP to opt out. HELP for help.</code>
                </div>
            </div>

            <div class="consent-box">
                <h3>Your Rights</h3>
                <ul>
                    <li>Consent is <strong>100% optional</strong> - not required for any service</li>
                    <li>You can opt out at any time by replying <strong>STOP</strong></li>
                    <li>Message frequency: ~1-3 messages per feedback session</li>
                    <li>Standard message and data rates may apply</li>
                    <li>Your phone number is never shared with third parties</li>
                </ul>

                <div class="keywords">
                    <span class="keyword stop">STOP - Unsubscribe</span>
                    <span class="keyword help">HELP - Get Help</span>
                    <span class="keyword">START - Re-subscribe</span>
                </div>
            </div>

            <div class="links">
                <a href="{privacy_url}" target="_blank">Privacy Policy</a>
                <a href="{terms_url}" target="_blank">Terms of Service</a>
                <a href="mailto:support@otom.ai">Contact Support</a>
            </div>

            <div class="footer">
                <p>&copy; 2024 Otom. All rights reserved.</p>
                <p style="margin-top: 8px;">Business: Otom | support@otom.ai</p>
            </div>
        </div>
    </body>
    </html>
    """
    return HTMLResponse(content=html_content)


# Include interface routers
app.include_router(voice_interface.router)
app.include_router(chat_interface.router)
app.include_router(sms_router)
app.include_router(email_router)
app.include_router(whatsapp_router)
app.include_router(slack_router)
app.include_router(teams_router)
app.include_router(zoom_router)

if __name__ == "__main__":
    logger.info("Starting Otom AI Consultant...")
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )