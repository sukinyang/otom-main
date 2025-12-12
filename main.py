"""
Otom AI Consultant - Main Application
Voice-first AI business consultant using Whisper (STT) + Sesame (TTS)
"""

import os
import asyncio
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import uvicorn

from otom.core.consultant.otom_brain import OtomConsultant
from otom.interfaces.voice.voice_handler import VoiceInterface
from otom.interfaces.chat.chat_handler import ChatInterface
from otom.interfaces.email.email_handler import EmailInterface
from otom.utils.logger import setup_logger

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

# Include interface routers
app.include_router(voice_interface.router)
app.include_router(chat_interface.router)
app.include_router(email_interface.router)

if __name__ == "__main__":
    logger.info("Starting Otom AI Consultant...")
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )