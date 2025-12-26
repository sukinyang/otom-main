"""
Otom AI Consultant - Main Application
Voice-first AI business consultant using Whisper (STT) + Sesame (TTS)
"""

import os
import asyncio
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import uvicorn

from core.consultant.otom_brain import OtomConsultant
from interfaces.voice.voice_handler import VoiceInterface
from interfaces.chat.chat_handler import ChatInterface
from interfaces.email.email_handler import EmailInterface
from interfaces.sms.sms_handler import router as sms_router
from utils.logger import setup_logger

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(
    title="Otom AI Consultant",
    description="AI-powered business consultant with voice-first interface",
    version="1.0.0"
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
    return {
        "status": "active",
        "service": "Otom AI Consultant",
        "version": "1.0.0",
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
                # Validate required fields
                if not emp.get("name") or not emp.get("phone_number"):
                    skipped += 1
                    errors.append(f"Missing name or phone for: {emp.get('name', 'Unknown')}")
                    continue

                # Prepare employee data
                employee_data = {
                    "name": emp.get("name", "").strip(),
                    "phone_number": emp.get("phone_number", "").strip(),
                    "email": emp.get("email", "").strip() or None,
                    "company": emp.get("company", "").strip() or None,
                    "department": emp.get("department", "").strip() or None,
                    "role": emp.get("role", "").strip() or None,
                    "status": emp.get("status", "pending"),
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

# Include interface routers
app.include_router(voice_interface.router)
app.include_router(chat_interface.router)
app.include_router(sms_router)
# Note: EmailInterface doesn't have HTTP routes - it's used for outbound emails only

if __name__ == "__main__":
    logger.info("Starting Otom AI Consultant...")
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )