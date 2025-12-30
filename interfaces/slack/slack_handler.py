"""
Slack Interface for Otom
Handles Slack messaging and notifications
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

logger = setup_logger("slack_handler")

router = APIRouter(prefix="/slack", tags=["Slack"])


class SlackInterface:
    """Handles Slack-based interactions with Otom"""

    def __init__(self):
        """Initialize Slack interface"""
        self.bot_token = os.getenv("SLACK_BOT_TOKEN")
        self.signing_secret = os.getenv("SLACK_SIGNING_SECRET")
        self.webhook_url = os.getenv("SLACK_WEBHOOK_URL")

        if self.bot_token:
            logger.info("Slack interface initialized with bot token")
        elif self.webhook_url:
            logger.info("Slack interface initialized with webhook")
        else:
            logger.warning("Slack credentials not configured")

        # Cal.com booking link
        self.cal_link = os.getenv("CAL_BOOKING_URL", "https://cal.com/sukin-yang-vw9ds8/meet-with-otom")

    async def send_message(
        self,
        channel: str,
        message: str,
        blocks: List[Dict] = None
    ) -> Dict[str, Any]:
        """Send a message to a Slack channel"""
        if not self.bot_token:
            return {"success": False, "error": "Slack bot token not configured"}

        try:
            async with aiohttp.ClientSession() as session:
                headers = {
                    "Authorization": f"Bearer {self.bot_token}",
                    "Content-Type": "application/json"
                }

                payload = {
                    "channel": channel,
                    "text": message
                }

                if blocks:
                    payload["blocks"] = blocks

                async with session.post(
                    "https://slack.com/api/chat.postMessage",
                    headers=headers,
                    json=payload
                ) as response:
                    result = await response.json()

                    if result.get("ok"):
                        logger.info(f"Slack message sent to {channel}")
                        return {"success": True, "ts": result.get("ts")}
                    else:
                        error = result.get("error", "Unknown error")
                        logger.error(f"Slack API error: {error}")
                        return {"success": False, "error": error}

        except Exception as e:
            logger.error(f"Failed to send Slack message: {str(e)}")
            return {"success": False, "error": str(e)}

    async def send_webhook_message(
        self,
        message: str,
        blocks: List[Dict] = None
    ) -> Dict[str, Any]:
        """Send a message via Slack webhook"""
        if not self.webhook_url:
            return {"success": False, "error": "Slack webhook URL not configured"}

        try:
            async with aiohttp.ClientSession() as session:
                payload = {"text": message}

                if blocks:
                    payload["blocks"] = blocks

                async with session.post(
                    self.webhook_url,
                    json=payload
                ) as response:
                    if response.status == 200:
                        logger.info("Slack webhook message sent")
                        return {"success": True}
                    else:
                        error = await response.text()
                        logger.error(f"Slack webhook error: {error}")
                        return {"success": False, "error": error}

        except Exception as e:
            logger.error(f"Failed to send Slack webhook: {str(e)}")
            return {"success": False, "error": str(e)}

    async def send_dm(
        self,
        user_id: str,
        message: str,
        blocks: List[Dict] = None
    ) -> Dict[str, Any]:
        """Send a direct message to a Slack user"""
        if not self.bot_token:
            return {"success": False, "error": "Slack bot token not configured"}

        try:
            async with aiohttp.ClientSession() as session:
                headers = {
                    "Authorization": f"Bearer {self.bot_token}",
                    "Content-Type": "application/json"
                }

                # Open DM channel
                async with session.post(
                    "https://slack.com/api/conversations.open",
                    headers=headers,
                    json={"users": user_id}
                ) as response:
                    result = await response.json()
                    if not result.get("ok"):
                        return {"success": False, "error": result.get("error")}
                    channel_id = result["channel"]["id"]

                # Send message
                return await self.send_message(channel_id, message, blocks)

        except Exception as e:
            logger.error(f"Failed to send Slack DM: {str(e)}")
            return {"success": False, "error": str(e)}

    async def send_outreach_notification(
        self,
        employee_name: str,
        company_name: str,
        channel: str = None
    ) -> Dict[str, Any]:
        """Send outreach notification with interactive buttons"""
        blocks = [
            {
                "type": "header",
                "text": {
                    "type": "plain_text",
                    "text": "📞 Process Review Request"
                }
            },
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": f"Hi *{employee_name}*!\n\nI'm Otom, a business process consultant working with *{company_name}*.\n\nWe're conducting a brief workflow analysis and would love to chat with you for 10-15 minutes."
                }
            },
            {
                "type": "actions",
                "elements": [
                    {
                        "type": "button",
                        "text": {
                            "type": "plain_text",
                            "text": "📅 Schedule Call"
                        },
                        "url": self.cal_link,
                        "style": "primary"
                    },
                    {
                        "type": "button",
                        "text": {
                            "type": "plain_text",
                            "text": "Not Now"
                        },
                        "action_id": "decline_outreach"
                    }
                ]
            }
        ]

        message = f"Process review request for {employee_name} at {company_name}"

        if channel:
            return await self.send_message(channel, message, blocks)
        elif self.webhook_url:
            return await self.send_webhook_message(message, blocks)
        else:
            return {"success": False, "error": "No Slack channel or webhook configured"}

    async def send_call_notification(
        self,
        employee_name: str,
        phone_number: str,
        status: str = "triggered"
    ) -> Dict[str, Any]:
        """Send notification when a call is triggered"""
        emoji = "📞" if status == "triggered" else "✅" if status == "completed" else "❌"
        message = f"{emoji} *Call {status}*: {employee_name} ({phone_number})"

        if self.webhook_url:
            return await self.send_webhook_message(message)
        else:
            return {"success": False, "error": "No webhook configured"}

    async def send_booking_notification(
        self,
        booking_data: Dict
    ) -> Dict[str, Any]:
        """Send notification when a new booking is created"""
        blocks = [
            {
                "type": "header",
                "text": {
                    "type": "plain_text",
                    "text": "📅 New Booking"
                }
            },
            {
                "type": "section",
                "fields": [
                    {
                        "type": "mrkdwn",
                        "text": f"*Name:*\n{booking_data.get('name', 'Unknown')}"
                    },
                    {
                        "type": "mrkdwn",
                        "text": f"*Email:*\n{booking_data.get('email', 'N/A')}"
                    },
                    {
                        "type": "mrkdwn",
                        "text": f"*Phone:*\n{booking_data.get('phone', 'N/A')}"
                    },
                    {
                        "type": "mrkdwn",
                        "text": f"*Scheduled:*\n{booking_data.get('scheduled_at', 'TBD')}"
                    }
                ]
            }
        ]

        message = f"New booking from {booking_data.get('name', 'Unknown')}"

        if self.webhook_url:
            return await self.send_webhook_message(message, blocks)
        else:
            return {"success": False, "error": "No webhook configured"}


# Initialize Slack interface
slack_interface = SlackInterface()


# ============================================
# API Routes
# ============================================

@router.post("/send")
async def send_slack_message(request: Request):
    """Send a Slack message"""
    try:
        data = await request.json()

        channel = data.get("channel")
        message = data.get("message")
        blocks = data.get("blocks")

        if not message:
            raise HTTPException(status_code=400, detail="Missing 'message'")

        if channel:
            result = await slack_interface.send_message(channel, message, blocks)
        else:
            result = await slack_interface.send_webhook_message(message, blocks)

        if result.get("success"):
            return result
        else:
            raise HTTPException(status_code=500, detail=result.get("error"))

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Slack send error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/notify/call")
async def notify_call(request: Request):
    """Send call notification to Slack"""
    try:
        data = await request.json()

        result = await slack_interface.send_call_notification(
            employee_name=data.get("name", "Unknown"),
            phone_number=data.get("phone", ""),
            status=data.get("status", "triggered")
        )

        return result

    except Exception as e:
        logger.error(f"Slack notify error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/notify/booking")
async def notify_booking(request: Request):
    """Send booking notification to Slack"""
    try:
        data = await request.json()
        result = await slack_interface.send_booking_notification(data)
        return result

    except Exception as e:
        logger.error(f"Slack booking notify error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/webhook")
async def slack_webhook(request: Request):
    """Handle incoming Slack webhooks (events, interactions)"""
    try:
        data = await request.json()

        # Handle URL verification challenge
        if data.get("type") == "url_verification":
            return {"challenge": data.get("challenge")}

        # Handle events
        event = data.get("event", {})
        event_type = event.get("type")

        if event_type == "message":
            # Handle incoming messages
            user = event.get("user")
            text = event.get("text", "")
            channel = event.get("channel")

            logger.info(f"Slack message from {user}: {text}")

            # Simple response logic
            if "schedule" in text.lower() or "call" in text.lower():
                await slack_interface.send_message(
                    channel,
                    f"📅 Schedule a call here: {slack_interface.cal_link}"
                )

        return {"status": "ok"}

    except Exception as e:
        logger.error(f"Slack webhook error: {str(e)}")
        return {"status": "error", "message": str(e)}


@router.get("/config")
async def get_slack_config():
    """Check Slack configuration status"""
    return {
        "SLACK_BOT_TOKEN": "set" if os.getenv("SLACK_BOT_TOKEN") else "MISSING",
        "SLACK_WEBHOOK_URL": "set" if os.getenv("SLACK_WEBHOOK_URL") else "MISSING",
        "SLACK_SIGNING_SECRET": "set" if os.getenv("SLACK_SIGNING_SECRET") else "MISSING"
    }
