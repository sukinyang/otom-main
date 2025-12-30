"""
Microsoft Teams Interface for Otom
Handles Teams messaging and notifications via webhooks and Graph API
"""

import os
import json
from typing import Dict, List, Any, Optional
from datetime import datetime
import uuid
import aiohttp

from fastapi import APIRouter, Request, HTTPException

from utils.logger import setup_logger
from integrations.supabase_mcp import supabase

logger = setup_logger("teams_handler")

router = APIRouter(prefix="/teams", tags=["Microsoft Teams"])


class TeamsInterface:
    """Handles Microsoft Teams interactions with Otom"""

    def __init__(self):
        """Initialize Teams interface"""
        # Incoming webhook URL for posting messages
        self.webhook_url = os.getenv("TEAMS_WEBHOOK_URL")

        # Microsoft Graph API credentials (for advanced features)
        self.tenant_id = os.getenv("TEAMS_TENANT_ID")
        self.client_id = os.getenv("TEAMS_CLIENT_ID")
        self.client_secret = os.getenv("TEAMS_CLIENT_SECRET")

        if self.webhook_url:
            logger.info("Teams interface initialized with webhook")
        elif self.client_id:
            logger.info("Teams interface initialized with Graph API")
        else:
            logger.warning("Teams credentials not configured")

        # Cal.com booking link
        self.cal_link = os.getenv("CAL_BOOKING_URL", "https://cal.com/sukin-yang-vw9ds8/meet-with-otom")

    async def send_webhook_message(
        self,
        message: str,
        card: Dict = None
    ) -> Dict[str, Any]:
        """Send a message via Teams incoming webhook"""
        if not self.webhook_url:
            return {"success": False, "error": "Teams webhook URL not configured"}

        try:
            async with aiohttp.ClientSession() as session:
                if card:
                    payload = card
                else:
                    # Simple text message in Adaptive Card format
                    payload = {
                        "@type": "MessageCard",
                        "@context": "http://schema.org/extensions",
                        "summary": message[:50],
                        "themeColor": "0076D7",
                        "text": message
                    }

                async with session.post(
                    self.webhook_url,
                    json=payload,
                    headers={"Content-Type": "application/json"}
                ) as response:
                    if response.status == 200:
                        logger.info("Teams webhook message sent")
                        return {"success": True}
                    else:
                        error = await response.text()
                        logger.error(f"Teams webhook error: {error}")
                        return {"success": False, "error": error}

        except Exception as e:
            logger.error(f"Failed to send Teams webhook: {str(e)}")
            return {"success": False, "error": str(e)}

    async def send_outreach_card(
        self,
        employee_name: str,
        company_name: str
    ) -> Dict[str, Any]:
        """Send outreach notification with action buttons"""
        card = {
            "@type": "MessageCard",
            "@context": "http://schema.org/extensions",
            "summary": f"Process Review Request for {employee_name}",
            "themeColor": "0076D7",
            "title": "📞 Process Review Request",
            "sections": [
                {
                    "activityTitle": f"Hi {employee_name}!",
                    "text": f"I'm Otom, a business process consultant working with **{company_name}**.\n\nWe're conducting a brief workflow analysis and would love to chat with you for 10-15 minutes about your day-to-day work.",
                    "markdown": True
                }
            ],
            "potentialAction": [
                {
                    "@type": "OpenUri",
                    "name": "📅 Schedule Call",
                    "targets": [
                        {
                            "os": "default",
                            "uri": self.cal_link
                        }
                    ]
                }
            ]
        }

        return await self.send_webhook_message("", card)

    async def send_call_notification(
        self,
        employee_name: str,
        phone_number: str,
        status: str = "triggered"
    ) -> Dict[str, Any]:
        """Send notification when a call is triggered"""
        color = "00FF00" if status == "completed" else "0076D7" if status == "triggered" else "FF0000"
        emoji = "📞" if status == "triggered" else "✅" if status == "completed" else "❌"

        card = {
            "@type": "MessageCard",
            "@context": "http://schema.org/extensions",
            "summary": f"Call {status}",
            "themeColor": color,
            "title": f"{emoji} Call {status.capitalize()}",
            "sections": [
                {
                    "facts": [
                        {"name": "Employee", "value": employee_name},
                        {"name": "Phone", "value": phone_number},
                        {"name": "Status", "value": status.capitalize()},
                        {"name": "Time", "value": datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")}
                    ]
                }
            ]
        }

        return await self.send_webhook_message("", card)

    async def send_booking_notification(
        self,
        booking_data: Dict
    ) -> Dict[str, Any]:
        """Send notification when a new booking is created"""
        card = {
            "@type": "MessageCard",
            "@context": "http://schema.org/extensions",
            "summary": "New Booking",
            "themeColor": "00FF00",
            "title": "📅 New Booking Created",
            "sections": [
                {
                    "facts": [
                        {"name": "Name", "value": booking_data.get("name", "Unknown")},
                        {"name": "Email", "value": booking_data.get("email", "N/A")},
                        {"name": "Phone", "value": booking_data.get("phone", "N/A")},
                        {"name": "Scheduled", "value": booking_data.get("scheduled_at", "TBD")}
                    ]
                }
            ]
        }

        return await self.send_webhook_message("", card)

    async def send_daily_summary(
        self,
        summary_data: Dict
    ) -> Dict[str, Any]:
        """Send daily summary of outreach activities"""
        card = {
            "@type": "MessageCard",
            "@context": "http://schema.org/extensions",
            "summary": "Daily Outreach Summary",
            "themeColor": "0076D7",
            "title": "📊 Daily Outreach Summary",
            "sections": [
                {
                    "facts": [
                        {"name": "Emails Sent", "value": str(summary_data.get("emails_sent", 0))},
                        {"name": "Calls Made", "value": str(summary_data.get("calls_made", 0))},
                        {"name": "Calls Completed", "value": str(summary_data.get("calls_completed", 0))},
                        {"name": "Bookings", "value": str(summary_data.get("bookings", 0))},
                        {"name": "Response Rate", "value": f"{summary_data.get('response_rate', 0)}%"}
                    ]
                }
            ]
        }

        return await self.send_webhook_message("", card)


# Initialize Teams interface
teams_interface = TeamsInterface()


# ============================================
# API Routes
# ============================================

@router.post("/send")
async def send_teams_message(request: Request):
    """Send a Teams message"""
    try:
        data = await request.json()

        message = data.get("message")
        card = data.get("card")

        if not message and not card:
            raise HTTPException(status_code=400, detail="Missing 'message' or 'card'")

        result = await teams_interface.send_webhook_message(message or "", card)

        if result.get("success"):
            return result
        else:
            raise HTTPException(status_code=500, detail=result.get("error"))

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Teams send error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/notify/call")
async def notify_call(request: Request):
    """Send call notification to Teams"""
    try:
        data = await request.json()

        result = await teams_interface.send_call_notification(
            employee_name=data.get("name", "Unknown"),
            phone_number=data.get("phone", ""),
            status=data.get("status", "triggered")
        )

        return result

    except Exception as e:
        logger.error(f"Teams notify error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/notify/booking")
async def notify_booking(request: Request):
    """Send booking notification to Teams"""
    try:
        data = await request.json()
        result = await teams_interface.send_booking_notification(data)
        return result

    except Exception as e:
        logger.error(f"Teams booking notify error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/outreach")
async def send_teams_outreach(request: Request):
    """Send outreach card to Teams"""
    try:
        data = await request.json()

        result = await teams_interface.send_outreach_card(
            employee_name=data.get("name", "there"),
            company_name=data.get("company", "your company")
        )

        return result

    except Exception as e:
        logger.error(f"Teams outreach error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/config")
async def get_teams_config():
    """Check Teams configuration status"""
    return {
        "TEAMS_WEBHOOK_URL": "set" if os.getenv("TEAMS_WEBHOOK_URL") else "MISSING",
        "TEAMS_TENANT_ID": "set" if os.getenv("TEAMS_TENANT_ID") else "not configured",
        "TEAMS_CLIENT_ID": "set" if os.getenv("TEAMS_CLIENT_ID") else "not configured"
    }
