"""
Zoom Interface for Otom
Handles Zoom meeting creation and management
"""

import os
import json
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
import uuid
import aiohttp
import base64

from fastapi import APIRouter, Request, HTTPException

from utils.logger import setup_logger
from integrations.supabase_mcp import supabase

logger = setup_logger("zoom_handler")

router = APIRouter(prefix="/zoom", tags=["Zoom"])


class ZoomInterface:
    """Handles Zoom meeting creation and management"""

    def __init__(self):
        """Initialize Zoom interface"""
        self.account_id = os.getenv("ZOOM_ACCOUNT_ID")
        self.client_id = os.getenv("ZOOM_CLIENT_ID")
        self.client_secret = os.getenv("ZOOM_CLIENT_SECRET")

        self.access_token = None
        self.token_expires = None

        if self.client_id and self.client_secret:
            logger.info("Zoom interface initialized")
        else:
            logger.warning("Zoom credentials not configured")

    async def _get_access_token(self) -> Optional[str]:
        """Get Zoom OAuth access token using Server-to-Server OAuth"""
        if not self.client_id or not self.client_secret or not self.account_id:
            return None

        # Check if we have a valid token
        if self.access_token and self.token_expires and datetime.utcnow() < self.token_expires:
            return self.access_token

        try:
            async with aiohttp.ClientSession() as session:
                # Create Basic auth header
                credentials = base64.b64encode(
                    f"{self.client_id}:{self.client_secret}".encode()
                ).decode()

                headers = {
                    "Authorization": f"Basic {credentials}",
                    "Content-Type": "application/x-www-form-urlencoded"
                }

                data = {
                    "grant_type": "account_credentials",
                    "account_id": self.account_id
                }

                async with session.post(
                    "https://zoom.us/oauth/token",
                    headers=headers,
                    data=data
                ) as response:
                    if response.status == 200:
                        result = await response.json()
                        self.access_token = result.get("access_token")
                        # Token expires in 1 hour, refresh at 55 minutes
                        self.token_expires = datetime.utcnow() + timedelta(minutes=55)
                        return self.access_token
                    else:
                        error = await response.text()
                        logger.error(f"Zoom OAuth error: {error}")
                        return None

        except Exception as e:
            logger.error(f"Failed to get Zoom access token: {str(e)}")
            return None

    async def create_meeting(
        self,
        topic: str,
        start_time: datetime = None,
        duration: int = 30,
        agenda: str = "",
        invitees: List[str] = None
    ) -> Dict[str, Any]:
        """Create a Zoom meeting"""
        token = await self._get_access_token()
        if not token:
            return {"success": False, "error": "Failed to authenticate with Zoom"}

        try:
            async with aiohttp.ClientSession() as session:
                headers = {
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json"
                }

                # Meeting settings
                meeting_data = {
                    "topic": topic,
                    "type": 2 if start_time else 1,  # 2 = scheduled, 1 = instant
                    "duration": duration,
                    "timezone": "UTC",
                    "agenda": agenda or f"Process review call with Otom",
                    "settings": {
                        "host_video": True,
                        "participant_video": True,
                        "join_before_host": True,
                        "mute_upon_entry": False,
                        "waiting_room": False,
                        "meeting_authentication": False
                    }
                }

                if start_time:
                    meeting_data["start_time"] = start_time.strftime("%Y-%m-%dT%H:%M:%SZ")

                if invitees:
                    meeting_data["settings"]["meeting_invitees"] = [
                        {"email": email} for email in invitees
                    ]

                async with session.post(
                    "https://api.zoom.us/v2/users/me/meetings",
                    headers=headers,
                    json=meeting_data
                ) as response:
                    if response.status == 201:
                        result = await response.json()
                        logger.info(f"Zoom meeting created: {result.get('id')}")

                        # Store in database
                        if supabase.client:
                            try:
                                supabase.client.table("zoom_meetings").insert({
                                    "id": str(uuid.uuid4()),
                                    "zoom_meeting_id": str(result.get("id")),
                                    "topic": topic,
                                    "join_url": result.get("join_url"),
                                    "start_url": result.get("start_url"),
                                    "password": result.get("password"),
                                    "start_time": start_time.isoformat() if start_time else None,
                                    "duration": duration,
                                    "created_at": datetime.utcnow().isoformat()
                                }).execute()
                            except Exception as e:
                                logger.warning(f"Failed to store Zoom meeting: {e}")

                        return {
                            "success": True,
                            "meeting_id": result.get("id"),
                            "join_url": result.get("join_url"),
                            "start_url": result.get("start_url"),
                            "password": result.get("password")
                        }
                    else:
                        error = await response.json()
                        logger.error(f"Zoom API error: {error}")
                        return {"success": False, "error": error.get("message", "Failed to create meeting")}

        except Exception as e:
            logger.error(f"Failed to create Zoom meeting: {str(e)}")
            return {"success": False, "error": str(e)}

    async def create_consultation_meeting(
        self,
        employee_name: str,
        company_name: str,
        start_time: datetime = None,
        employee_email: str = None
    ) -> Dict[str, Any]:
        """Create a consultation meeting for an employee"""
        topic = f"Process Review: {employee_name} - {company_name}"
        agenda = f"""Process Review Call with {employee_name}

Agenda:
1. Introduction and overview
2. Daily workflow discussion
3. Pain points and challenges
4. Tools and systems used
5. Improvement suggestions
6. Next steps

This call is part of {company_name}'s process optimization initiative."""

        invitees = [employee_email] if employee_email else None

        return await self.create_meeting(
            topic=topic,
            start_time=start_time,
            duration=20,
            agenda=agenda,
            invitees=invitees
        )

    async def get_meeting(self, meeting_id: str) -> Dict[str, Any]:
        """Get meeting details"""
        token = await self._get_access_token()
        if not token:
            return {"success": False, "error": "Failed to authenticate with Zoom"}

        try:
            async with aiohttp.ClientSession() as session:
                headers = {"Authorization": f"Bearer {token}"}

                async with session.get(
                    f"https://api.zoom.us/v2/meetings/{meeting_id}",
                    headers=headers
                ) as response:
                    if response.status == 200:
                        result = await response.json()
                        return {"success": True, "meeting": result}
                    else:
                        error = await response.json()
                        return {"success": False, "error": error.get("message")}

        except Exception as e:
            logger.error(f"Failed to get Zoom meeting: {str(e)}")
            return {"success": False, "error": str(e)}

    async def delete_meeting(self, meeting_id: str) -> Dict[str, Any]:
        """Delete a meeting"""
        token = await self._get_access_token()
        if not token:
            return {"success": False, "error": "Failed to authenticate with Zoom"}

        try:
            async with aiohttp.ClientSession() as session:
                headers = {"Authorization": f"Bearer {token}"}

                async with session.delete(
                    f"https://api.zoom.us/v2/meetings/{meeting_id}",
                    headers=headers
                ) as response:
                    if response.status == 204:
                        logger.info(f"Zoom meeting deleted: {meeting_id}")
                        return {"success": True}
                    else:
                        error = await response.json()
                        return {"success": False, "error": error.get("message")}

        except Exception as e:
            logger.error(f"Failed to delete Zoom meeting: {str(e)}")
            return {"success": False, "error": str(e)}


# Initialize Zoom interface
zoom_interface = ZoomInterface()


# ============================================
# API Routes
# ============================================

@router.post("/meetings")
async def create_meeting(request: Request):
    """Create a Zoom meeting"""
    try:
        data = await request.json()

        topic = data.get("topic", "Otom Consultation")
        start_time = None
        if data.get("start_time"):
            start_time = datetime.fromisoformat(data["start_time"].replace("Z", "+00:00"))
        duration = data.get("duration", 30)
        agenda = data.get("agenda", "")
        invitees = data.get("invitees", [])

        result = await zoom_interface.create_meeting(
            topic=topic,
            start_time=start_time,
            duration=duration,
            agenda=agenda,
            invitees=invitees
        )

        if result.get("success"):
            return result
        else:
            raise HTTPException(status_code=500, detail=result.get("error"))

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Create meeting error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/consultation-meeting")
async def create_consultation_meeting(request: Request):
    """Create a consultation meeting for an employee"""
    try:
        data = await request.json()

        employee_name = data.get("name", "Guest")
        company_name = data.get("company", "Company")
        employee_email = data.get("email")
        start_time = None
        if data.get("start_time"):
            start_time = datetime.fromisoformat(data["start_time"].replace("Z", "+00:00"))

        result = await zoom_interface.create_consultation_meeting(
            employee_name=employee_name,
            company_name=company_name,
            start_time=start_time,
            employee_email=employee_email
        )

        if result.get("success"):
            return result
        else:
            raise HTTPException(status_code=500, detail=result.get("error"))

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Create consultation meeting error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/meetings/{meeting_id}")
async def get_meeting(meeting_id: str):
    """Get meeting details"""
    result = await zoom_interface.get_meeting(meeting_id)

    if result.get("success"):
        return result
    else:
        raise HTTPException(status_code=404, detail=result.get("error"))


@router.delete("/meetings/{meeting_id}")
async def delete_meeting(meeting_id: str):
    """Delete a meeting"""
    result = await zoom_interface.delete_meeting(meeting_id)

    if result.get("success"):
        return result
    else:
        raise HTTPException(status_code=500, detail=result.get("error"))


@router.post("/webhook")
async def zoom_webhook(request: Request):
    """Handle Zoom webhooks"""
    try:
        data = await request.json()

        event = data.get("event")
        payload = data.get("payload", {})

        logger.info(f"Zoom webhook received: {event}")

        if event == "meeting.started":
            meeting_id = payload.get("object", {}).get("id")
            logger.info(f"Meeting started: {meeting_id}")

        elif event == "meeting.ended":
            meeting_id = payload.get("object", {}).get("id")
            duration = payload.get("object", {}).get("duration")
            logger.info(f"Meeting ended: {meeting_id}, duration: {duration} minutes")

        elif event == "meeting.participant_joined":
            participant = payload.get("object", {}).get("participant", {})
            logger.info(f"Participant joined: {participant.get('user_name')}")

        return {"status": "ok"}

    except Exception as e:
        logger.error(f"Zoom webhook error: {str(e)}")
        return {"status": "error", "message": str(e)}


@router.get("/config")
async def get_zoom_config():
    """Check Zoom configuration status"""
    return {
        "ZOOM_ACCOUNT_ID": "set" if os.getenv("ZOOM_ACCOUNT_ID") else "MISSING",
        "ZOOM_CLIENT_ID": "set" if os.getenv("ZOOM_CLIENT_ID") else "MISSING",
        "ZOOM_CLIENT_SECRET": "set" if os.getenv("ZOOM_CLIENT_SECRET") else "MISSING"
    }
