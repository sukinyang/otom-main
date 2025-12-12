"""
Chat Interface for Otom
Multi-platform chat integrations: Slack, WhatsApp, Telegram, Teams, and Web
"""

import os
import json
import asyncio
import hmac
import hashlib
import time
from typing import Dict, List, Any, Optional
from datetime import datetime
import uuid

import aiohttp
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException, Request, Header
from fastapi.responses import JSONResponse, PlainTextResponse

from otom.utils.logger import setup_logger
from otom.integrations.supabase_mcp import supabase

logger = setup_logger("chat_handler")


class ChatInterface:
    """
    Multi-platform chat interface for Otom.
    Supports: Web (WebSocket), Slack, WhatsApp, Telegram, Microsoft Teams
    """

    def __init__(self, otom_consultant):
        """Initialize chat interface with all platform configurations"""
        self.otom = otom_consultant
        self.active_chats: Dict[str, Dict] = {}
        self.router = APIRouter(prefix="/chat")

        # Platform configurations
        self._init_slack_config()
        self._init_whatsapp_config()
        self._init_telegram_config()
        self._init_teams_config()

        self._setup_routes()
        logger.info("Multi-platform chat interface initialized")

    def _init_slack_config(self):
        """Initialize Slack configuration"""
        self.slack_bot_token = os.getenv("SLACK_BOT_TOKEN")
        self.slack_signing_secret = os.getenv("SLACK_SIGNING_SECRET")
        self.slack_app_token = os.getenv("SLACK_APP_TOKEN")  # For Socket Mode

    def _init_whatsapp_config(self):
        """Initialize WhatsApp configuration (Meta Cloud API)"""
        self.whatsapp_token = os.getenv("WHATSAPP_ACCESS_TOKEN")
        self.whatsapp_phone_id = os.getenv("WHATSAPP_PHONE_NUMBER_ID")
        self.whatsapp_verify_token = os.getenv("WHATSAPP_VERIFY_TOKEN", "otom_verify_token")
        self.whatsapp_api_url = "https://graph.facebook.com/v18.0"

    def _init_telegram_config(self):
        """Initialize Telegram configuration"""
        self.telegram_bot_token = os.getenv("TELEGRAM_BOT_TOKEN")
        self.telegram_api_url = f"https://api.telegram.org/bot{self.telegram_bot_token}"

    def _init_teams_config(self):
        """Initialize Microsoft Teams configuration"""
        self.teams_app_id = os.getenv("TEAMS_APP_ID")
        self.teams_app_password = os.getenv("TEAMS_APP_PASSWORD")
        self.teams_tenant_id = os.getenv("TEAMS_TENANT_ID")

    def _setup_routes(self):
        """Setup all chat-related API routes"""

        # ===========================================
        # WEB INTERFACE (WebSocket + REST)
        # ===========================================

        @self.router.websocket("/ws/{session_id}")
        async def websocket_endpoint(websocket: WebSocket, session_id: str):
            """WebSocket endpoint for real-time web chat"""
            await self.handle_websocket(websocket, session_id)

        @self.router.post("/message")
        async def send_message(message: Dict):
            """Send a message to Otom via REST API"""
            return await self.handle_message(message)

        @self.router.get("/session/{session_id}/history")
        async def get_chat_history(session_id: str):
            """Get chat history for a session"""
            return await self.get_history(session_id)

        # ===========================================
        # SLACK INTEGRATION
        # ===========================================

        @self.router.post("/slack/events")
        async def slack_events(request: Request):
            """
            Slack Events API endpoint.
            Handles: URL verification, messages, app mentions, etc.
            """
            body = await request.body()
            payload = await request.json()

            # Verify Slack signature
            if not await self._verify_slack_signature(request, body):
                raise HTTPException(status_code=401, detail="Invalid signature")

            # Handle URL verification challenge
            if payload.get("type") == "url_verification":
                return PlainTextResponse(content=payload.get("challenge"))

            # Handle events
            if payload.get("type") == "event_callback":
                event = payload.get("event", {})
                asyncio.create_task(self._process_slack_event(event))

            return JSONResponse(content={"status": "ok"})

        @self.router.post("/slack/interactions")
        async def slack_interactions(request: Request):
            """Handle Slack interactive components (buttons, modals, etc.)"""
            form = await request.form()
            payload = json.loads(form.get("payload", "{}"))
            return await self._handle_slack_interaction(payload)

        @self.router.post("/slack/commands")
        async def slack_commands(request: Request):
            """Handle Slack slash commands"""
            form = await request.form()
            return await self._handle_slack_command(dict(form))

        # ===========================================
        # WHATSAPP INTEGRATION (Meta Cloud API)
        # ===========================================

        @self.router.get("/whatsapp/webhook")
        async def whatsapp_verify(
            hub_mode: str = None,
            hub_verify_token: str = None,
            hub_challenge: str = None
        ):
            """WhatsApp webhook verification"""
            # Meta sends these as hub.mode, hub.verify_token, hub.challenge
            # FastAPI converts dots to underscores
            if hub_mode == "subscribe" and hub_verify_token == self.whatsapp_verify_token:
                logger.info("WhatsApp webhook verified")
                return PlainTextResponse(content=hub_challenge)
            raise HTTPException(status_code=403, detail="Verification failed")

        @self.router.post("/whatsapp/webhook")
        async def whatsapp_webhook(request: Request):
            """Handle incoming WhatsApp messages"""
            payload = await request.json()
            asyncio.create_task(self._process_whatsapp_message(payload))
            return JSONResponse(content={"status": "ok"})

        # ===========================================
        # TELEGRAM INTEGRATION
        # ===========================================

        @self.router.post("/telegram/webhook")
        async def telegram_webhook(request: Request):
            """Handle incoming Telegram messages"""
            payload = await request.json()
            asyncio.create_task(self._process_telegram_update(payload))
            return JSONResponse(content={"status": "ok"})

        @self.router.post("/telegram/setup")
        async def setup_telegram_webhook():
            """Setup Telegram webhook (call once during deployment)"""
            return await self._setup_telegram_webhook()

        # ===========================================
        # MICROSOFT TEAMS INTEGRATION
        # ===========================================

        @self.router.post("/teams/messages")
        async def teams_messages(request: Request):
            """Handle incoming Teams messages via Bot Framework"""
            payload = await request.json()
            auth_header = request.headers.get("Authorization", "")
            return await self._process_teams_message(payload, auth_header)

    # ===========================================
    # WEB INTERFACE HANDLERS
    # ===========================================

    async def handle_websocket(self, websocket: WebSocket, session_id: str):
        """Handle WebSocket connection for real-time chat"""
        await websocket.accept()

        # Initialize chat session
        if session_id not in self.active_chats:
            self.active_chats[session_id] = {
                "id": session_id,
                "platform": "web",
                "started_at": datetime.utcnow().isoformat(),
                "messages": [],
                "context": {}
            }

        try:
            # Send welcome message
            welcome = {
                "type": "message",
                "sender": "otom",
                "content": "Hello! I'm Otom, your AI business consultant. How can I help you today?",
                "timestamp": datetime.utcnow().isoformat()
            }
            await websocket.send_json(welcome)
            self.active_chats[session_id]["messages"].append(welcome)

            # Handle incoming messages
            while True:
                data = await websocket.receive_json()

                if data.get("type") == "message":
                    user_message = {
                        "type": "message",
                        "sender": "user",
                        "content": data.get("content"),
                        "timestamp": datetime.utcnow().isoformat()
                    }
                    self.active_chats[session_id]["messages"].append(user_message)

                    # Send typing indicator
                    await websocket.send_json({"type": "typing", "sender": "otom"})

                    # Get Otom's response
                    response = await self.process_chat_message(
                        session_id,
                        data.get("content")
                    )

                    otom_message = {
                        "type": "message",
                        "sender": "otom",
                        "content": response["content"],
                        "timestamp": datetime.utcnow().isoformat(),
                        "metadata": response.get("metadata", {})
                    }
                    await websocket.send_json(otom_message)
                    self.active_chats[session_id]["messages"].append(otom_message)

                elif data.get("type") == "end":
                    break

        except WebSocketDisconnect:
            logger.info(f"WebSocket disconnected for session {session_id}")
        except Exception as e:
            logger.error(f"WebSocket error: {str(e)}")

    async def handle_message(self, message: Dict) -> Dict:
        """Handle a single message via REST API"""
        session_id = message.get("session_id", str(uuid.uuid4()))

        if session_id not in self.active_chats:
            self.active_chats[session_id] = {
                "id": session_id,
                "platform": "api",
                "started_at": datetime.utcnow().isoformat(),
                "messages": [],
                "context": {}
            }

        response = await self.process_chat_message(session_id, message.get("content"))

        self.active_chats[session_id]["messages"].extend([
            {"sender": "user", "content": message.get("content"), "timestamp": datetime.utcnow().isoformat()},
            {"sender": "otom", "content": response["content"], "timestamp": datetime.utcnow().isoformat()}
        ])

        return {"status": "success", "session_id": session_id, "response": response}

    # ===========================================
    # SLACK HANDLERS
    # ===========================================

    async def _verify_slack_signature(self, request: Request, body: bytes) -> bool:
        """Verify Slack request signature"""
        if not self.slack_signing_secret:
            logger.warning("Slack signing secret not configured")
            return True  # Skip verification if not configured

        timestamp = request.headers.get("X-Slack-Request-Timestamp", "")
        signature = request.headers.get("X-Slack-Signature", "")

        # Check timestamp to prevent replay attacks
        if abs(time.time() - int(timestamp)) > 60 * 5:
            return False

        # Compute signature
        sig_basestring = f"v0:{timestamp}:{body.decode('utf-8')}"
        computed_sig = "v0=" + hmac.new(
            self.slack_signing_secret.encode(),
            sig_basestring.encode(),
            hashlib.sha256
        ).hexdigest()

        return hmac.compare_digest(computed_sig, signature)

    async def _process_slack_event(self, event: Dict):
        """Process Slack events asynchronously"""
        try:
            event_type = event.get("type")

            if event_type == "message" and not event.get("bot_id"):
                await self._handle_slack_message(event)
            elif event_type == "app_mention":
                await self._handle_slack_mention(event)

        except Exception as e:
            logger.error(f"Error processing Slack event: {str(e)}")

    async def _handle_slack_message(self, event: Dict):
        """Handle direct messages in Slack"""
        user_id = event.get("user")
        channel = event.get("channel")
        text = event.get("text", "")
        thread_ts = event.get("thread_ts") or event.get("ts")

        # Create session ID based on channel and thread
        session_id = f"slack_{channel}_{thread_ts}"

        # Initialize session
        if session_id not in self.active_chats:
            self.active_chats[session_id] = {
                "id": session_id,
                "platform": "slack",
                "channel": channel,
                "user_id": user_id,
                "thread_ts": thread_ts,
                "started_at": datetime.utcnow().isoformat(),
                "messages": [],
                "context": {}
            }
            # Create session in Supabase
            await supabase.create_chat_session({
                "session_id": session_id,
                "platform": "slack",
                "user_id": user_id,
                "channel_id": channel
            })

        # Process through Otom
        response = await self.process_chat_message(session_id, text)

        # Send response back to Slack
        await self._send_slack_message(channel, response["content"], thread_ts)

    async def _handle_slack_mention(self, event: Dict):
        """Handle @otom mentions in Slack channels"""
        # Remove the mention from the text
        text = event.get("text", "")
        # Remove <@BOTID> pattern
        import re
        text = re.sub(r'<@[A-Z0-9]+>', '', text).strip()

        await self._handle_slack_message({**event, "text": text})

    async def _send_slack_message(self, channel: str, text: str, thread_ts: str = None):
        """Send a message to Slack"""
        if not self.slack_bot_token:
            logger.warning("Slack bot token not configured")
            return

        headers = {
            "Authorization": f"Bearer {self.slack_bot_token}",
            "Content-Type": "application/json"
        }

        payload = {
            "channel": channel,
            "text": text,
            "mrkdwn": True
        }

        if thread_ts:
            payload["thread_ts"] = thread_ts

        async with aiohttp.ClientSession() as session:
            async with session.post(
                "https://slack.com/api/chat.postMessage",
                json=payload,
                headers=headers
            ) as resp:
                result = await resp.json()
                if not result.get("ok"):
                    logger.error(f"Slack API error: {result.get('error')}")

    async def _handle_slack_interaction(self, payload: Dict) -> JSONResponse:
        """Handle Slack interactive components"""
        action_type = payload.get("type")

        if action_type == "block_actions":
            # Handle button clicks, select menus, etc.
            actions = payload.get("actions", [])
            for action in actions:
                action_id = action.get("action_id")
                # Process action based on action_id
                logger.info(f"Slack action: {action_id}")

        elif action_type == "view_submission":
            # Handle modal submissions
            pass

        return JSONResponse(content={"response_action": "clear"})

    async def _handle_slack_command(self, form_data: Dict) -> JSONResponse:
        """Handle Slack slash commands"""
        command = form_data.get("command", "")
        text = form_data.get("text", "")
        user_id = form_data.get("user_id")
        channel_id = form_data.get("channel_id")

        if command == "/otom":
            # Process the command text through Otom
            session_id = f"slack_cmd_{user_id}"
            response = await self.process_chat_message(session_id, text or "Hello")

            return JSONResponse(content={
                "response_type": "in_channel",
                "text": response["content"]
            })

        return JSONResponse(content={"text": "Unknown command"})

    # ===========================================
    # WHATSAPP HANDLERS
    # ===========================================

    async def _process_whatsapp_message(self, payload: Dict):
        """Process incoming WhatsApp messages"""
        try:
            entry = payload.get("entry", [{}])[0]
            changes = entry.get("changes", [{}])[0]
            value = changes.get("value", {})
            messages = value.get("messages", [])

            for message in messages:
                await self._handle_whatsapp_message(message, value)

        except Exception as e:
            logger.error(f"Error processing WhatsApp message: {str(e)}")

    async def _handle_whatsapp_message(self, message: Dict, value: Dict):
        """Handle individual WhatsApp message"""
        message_type = message.get("type")
        from_number = message.get("from")
        message_id = message.get("id")

        # Extract text content
        if message_type == "text":
            text = message.get("text", {}).get("body", "")
        elif message_type == "interactive":
            # Handle button replies
            interactive = message.get("interactive", {})
            if interactive.get("type") == "button_reply":
                text = interactive.get("button_reply", {}).get("title", "")
            else:
                text = interactive.get("list_reply", {}).get("title", "")
        else:
            # Voice, image, etc. - acknowledge but explain limitation
            await self._send_whatsapp_message(
                from_number,
                "I can currently only process text messages. Please type your question."
            )
            return

        # Create session
        session_id = f"whatsapp_{from_number}"

        if session_id not in self.active_chats:
            self.active_chats[session_id] = {
                "id": session_id,
                "platform": "whatsapp",
                "phone_number": from_number,
                "started_at": datetime.utcnow().isoformat(),
                "messages": [],
                "context": {}
            }
            # Create session in Supabase
            await supabase.create_chat_session({
                "session_id": session_id,
                "platform": "whatsapp",
                "phone_number": from_number
            })

        # Mark message as read
        await self._mark_whatsapp_read(message_id)

        # Send typing indicator
        await self._send_whatsapp_typing(from_number)

        # Process through Otom
        response = await self.process_chat_message(session_id, text)

        # Send response
        await self._send_whatsapp_message(from_number, response["content"])

    async def _send_whatsapp_message(self, to: str, text: str):
        """Send a WhatsApp message"""
        if not self.whatsapp_token or not self.whatsapp_phone_id:
            logger.warning("WhatsApp not configured")
            return

        url = f"{self.whatsapp_api_url}/{self.whatsapp_phone_id}/messages"
        headers = {
            "Authorization": f"Bearer {self.whatsapp_token}",
            "Content-Type": "application/json"
        }

        # Split long messages (WhatsApp limit is 4096 chars)
        chunks = [text[i:i+4000] for i in range(0, len(text), 4000)]

        async with aiohttp.ClientSession() as session:
            for chunk in chunks:
                payload = {
                    "messaging_product": "whatsapp",
                    "recipient_type": "individual",
                    "to": to,
                    "type": "text",
                    "text": {"body": chunk}
                }

                async with session.post(url, json=payload, headers=headers) as resp:
                    if resp.status != 200:
                        error = await resp.text()
                        logger.error(f"WhatsApp API error: {error}")

    async def _send_whatsapp_typing(self, to: str):
        """Send typing indicator on WhatsApp"""
        # WhatsApp doesn't have a typing indicator API
        # But we can use the "mark as read" which shows activity
        pass

    async def _mark_whatsapp_read(self, message_id: str):
        """Mark WhatsApp message as read"""
        if not self.whatsapp_token or not self.whatsapp_phone_id:
            return

        url = f"{self.whatsapp_api_url}/{self.whatsapp_phone_id}/messages"
        headers = {
            "Authorization": f"Bearer {self.whatsapp_token}",
            "Content-Type": "application/json"
        }

        payload = {
            "messaging_product": "whatsapp",
            "status": "read",
            "message_id": message_id
        }

        async with aiohttp.ClientSession() as session:
            await session.post(url, json=payload, headers=headers)

    async def _send_whatsapp_buttons(self, to: str, text: str, buttons: List[Dict]):
        """Send interactive buttons on WhatsApp"""
        if not self.whatsapp_token or not self.whatsapp_phone_id:
            return

        url = f"{self.whatsapp_api_url}/{self.whatsapp_phone_id}/messages"
        headers = {
            "Authorization": f"Bearer {self.whatsapp_token}",
            "Content-Type": "application/json"
        }

        payload = {
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": to,
            "type": "interactive",
            "interactive": {
                "type": "button",
                "body": {"text": text},
                "action": {
                    "buttons": [
                        {"type": "reply", "reply": {"id": btn["id"], "title": btn["title"]}}
                        for btn in buttons[:3]  # Max 3 buttons
                    ]
                }
            }
        }

        async with aiohttp.ClientSession() as session:
            await session.post(url, json=payload, headers=headers)

    # ===========================================
    # TELEGRAM HANDLERS
    # ===========================================

    async def _process_telegram_update(self, update: Dict):
        """Process Telegram update"""
        try:
            if "message" in update:
                await self._handle_telegram_message(update["message"])
            elif "callback_query" in update:
                await self._handle_telegram_callback(update["callback_query"])

        except Exception as e:
            logger.error(f"Error processing Telegram update: {str(e)}")

    async def _handle_telegram_message(self, message: Dict):
        """Handle Telegram message"""
        chat_id = message.get("chat", {}).get("id")
        user_id = message.get("from", {}).get("id")
        text = message.get("text", "")
        username = message.get("from", {}).get("username", "")

        # Handle commands
        if text.startswith("/"):
            await self._handle_telegram_command(chat_id, text)
            return

        # Create session
        session_id = f"telegram_{chat_id}"

        if session_id not in self.active_chats:
            self.active_chats[session_id] = {
                "id": session_id,
                "platform": "telegram",
                "chat_id": chat_id,
                "user_id": user_id,
                "username": username,
                "started_at": datetime.utcnow().isoformat(),
                "messages": [],
                "context": {}
            }
            # Create session in Supabase
            await supabase.create_chat_session({
                "session_id": session_id,
                "platform": "telegram",
                "user_id": str(user_id),
                "user_name": username
            })

        # Send typing action
        await self._send_telegram_action(chat_id, "typing")

        # Process through Otom
        response = await self.process_chat_message(session_id, text)

        # Send response
        await self._send_telegram_message(chat_id, response["content"])

    async def _handle_telegram_command(self, chat_id: int, command: str):
        """Handle Telegram bot commands"""
        cmd = command.split()[0].lower()
        args = command.split()[1:] if len(command.split()) > 1 else []

        if cmd == "/start":
            welcome = """👋 Hello! I'm *Otom*, your AI business consultant.

I can help you with:
• Business strategy and analysis
• Workflow optimization
• Market research
• Strategic planning

Just send me a message describing your business challenge, and let's get started!

Use /help for more commands."""
            await self._send_telegram_message(chat_id, welcome, parse_mode="Markdown")

        elif cmd == "/help":
            help_text = """*Available Commands:*

/start - Start a new conversation
/services - View consulting services
/status - Check current session status
/schedule - Schedule a consultation call
/help - Show this help message

Or simply type your question and I'll assist you!"""
            await self._send_telegram_message(chat_id, help_text, parse_mode="Markdown")

        elif cmd == "/services":
            response = await self._handle_pricing_query()
            await self._send_telegram_message(chat_id, response["response"], parse_mode="Markdown")

        elif cmd == "/schedule":
            await self._send_telegram_message(
                chat_id,
                "To schedule a consultation, please provide your email and preferred time.\n\nExample: `john@company.com, Tuesday 2pm EST`",
                parse_mode="Markdown"
            )

        elif cmd == "/status":
            session_id = f"telegram_{chat_id}"
            response = await self._handle_status_query(session_id)
            await self._send_telegram_message(chat_id, response["response"])

    async def _handle_telegram_callback(self, callback: Dict):
        """Handle Telegram inline button callbacks"""
        callback_id = callback.get("id")
        data = callback.get("data")
        chat_id = callback.get("message", {}).get("chat", {}).get("id")

        # Acknowledge the callback
        await self._answer_telegram_callback(callback_id)

        # Process based on callback data
        if data.startswith("service_"):
            service = data.replace("service_", "")
            await self._send_telegram_message(
                chat_id,
                f"Great choice! To proceed with the {service} service, please share your email address."
            )

    async def _send_telegram_message(
        self,
        chat_id: int,
        text: str,
        parse_mode: str = None,
        reply_markup: Dict = None
    ):
        """Send a Telegram message"""
        if not self.telegram_bot_token:
            logger.warning("Telegram bot token not configured")
            return

        url = f"{self.telegram_api_url}/sendMessage"

        payload = {
            "chat_id": chat_id,
            "text": text
        }

        if parse_mode:
            payload["parse_mode"] = parse_mode

        if reply_markup:
            payload["reply_markup"] = json.dumps(reply_markup)

        async with aiohttp.ClientSession() as session:
            async with session.post(url, json=payload) as resp:
                if resp.status != 200:
                    error = await resp.text()
                    logger.error(f"Telegram API error: {error}")

    async def _send_telegram_action(self, chat_id: int, action: str = "typing"):
        """Send typing or other action indicator"""
        if not self.telegram_bot_token:
            return

        url = f"{self.telegram_api_url}/sendChatAction"
        payload = {"chat_id": chat_id, "action": action}

        async with aiohttp.ClientSession() as session:
            await session.post(url, json=payload)

    async def _answer_telegram_callback(self, callback_id: str, text: str = None):
        """Answer a callback query"""
        if not self.telegram_bot_token:
            return

        url = f"{self.telegram_api_url}/answerCallbackQuery"
        payload = {"callback_query_id": callback_id}
        if text:
            payload["text"] = text

        async with aiohttp.ClientSession() as session:
            await session.post(url, json=payload)

    async def _setup_telegram_webhook(self) -> Dict:
        """Setup Telegram webhook"""
        if not self.telegram_bot_token:
            raise HTTPException(status_code=400, detail="Telegram bot token not configured")

        base_url = os.getenv("BASE_URL", "")
        webhook_url = f"{base_url}/chat/telegram/webhook"

        url = f"{self.telegram_api_url}/setWebhook"
        payload = {
            "url": webhook_url,
            "allowed_updates": ["message", "callback_query"]
        }

        async with aiohttp.ClientSession() as session:
            async with session.post(url, json=payload) as resp:
                result = await resp.json()
                logger.info(f"Telegram webhook setup: {result}")
                return result

    # ===========================================
    # MICROSOFT TEAMS HANDLERS
    # ===========================================

    async def _process_teams_message(self, activity: Dict, auth_header: str) -> JSONResponse:
        """Process Microsoft Teams Bot Framework activity"""
        try:
            activity_type = activity.get("type")

            if activity_type == "message":
                await self._handle_teams_message(activity)
            elif activity_type == "conversationUpdate":
                await self._handle_teams_conversation_update(activity)

            return JSONResponse(content={"status": "ok"})

        except Exception as e:
            logger.error(f"Error processing Teams message: {str(e)}")
            return JSONResponse(content={"status": "error"}, status_code=500)

    async def _handle_teams_message(self, activity: Dict):
        """Handle Teams message"""
        conversation_id = activity.get("conversation", {}).get("id")
        from_id = activity.get("from", {}).get("id")
        from_name = activity.get("from", {}).get("name", "User")
        text = activity.get("text", "")
        service_url = activity.get("serviceUrl")

        # Remove bot mention from text
        if activity.get("entities"):
            for entity in activity["entities"]:
                if entity.get("type") == "mention":
                    mentioned = entity.get("text", "")
                    text = text.replace(mentioned, "").strip()

        # Create session
        session_id = f"teams_{conversation_id}"

        if session_id not in self.active_chats:
            self.active_chats[session_id] = {
                "id": session_id,
                "platform": "teams",
                "conversation_id": conversation_id,
                "service_url": service_url,
                "user_id": from_id,
                "user_name": from_name,
                "started_at": datetime.utcnow().isoformat(),
                "messages": [],
                "context": {}
            }
            # Create session in Supabase
            await supabase.create_chat_session({
                "session_id": session_id,
                "platform": "teams",
                "user_id": from_id,
                "user_name": from_name,
                "channel_id": conversation_id
            })

        # Send typing indicator
        await self._send_teams_typing(activity)

        # Process through Otom
        response = await self.process_chat_message(session_id, text)

        # Send response
        await self._send_teams_message(activity, response["content"])

    async def _handle_teams_conversation_update(self, activity: Dict):
        """Handle Teams conversation updates (member added, etc.)"""
        members_added = activity.get("membersAdded", [])

        for member in members_added:
            # Check if our bot was added
            if member.get("id") == activity.get("recipient", {}).get("id"):
                welcome = """Hello! 👋 I'm **Otom**, your AI business consultant.

I can help you with:
- Business strategy and analysis
- Workflow optimization
- Market research
- Strategic planning

Just send me a message describing your business challenge!"""

                await self._send_teams_message(activity, welcome)

    async def _send_teams_message(self, activity: Dict, text: str):
        """Send a message back to Teams"""
        service_url = activity.get("serviceUrl", "").rstrip("/")
        conversation_id = activity.get("conversation", {}).get("id")

        if not service_url or not self.teams_app_id:
            logger.warning("Teams not properly configured")
            return

        # Get access token
        token = await self._get_teams_token()
        if not token:
            return

        url = f"{service_url}/v3/conversations/{conversation_id}/activities"
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }

        payload = {
            "type": "message",
            "text": text,
            "textFormat": "markdown"
        }

        async with aiohttp.ClientSession() as session:
            async with session.post(url, json=payload, headers=headers) as resp:
                if resp.status not in [200, 201]:
                    error = await resp.text()
                    logger.error(f"Teams API error: {error}")

    async def _send_teams_typing(self, activity: Dict):
        """Send typing indicator to Teams"""
        service_url = activity.get("serviceUrl", "").rstrip("/")
        conversation_id = activity.get("conversation", {}).get("id")

        if not service_url:
            return

        token = await self._get_teams_token()
        if not token:
            return

        url = f"{service_url}/v3/conversations/{conversation_id}/activities"
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }

        payload = {"type": "typing"}

        async with aiohttp.ClientSession() as session:
            await session.post(url, json=payload, headers=headers)

    async def _get_teams_token(self) -> Optional[str]:
        """Get Microsoft Bot Framework access token"""
        if not self.teams_app_id or not self.teams_app_password:
            return None

        url = "https://login.microsoftonline.com/botframework.com/oauth2/v2.0/token"
        data = {
            "grant_type": "client_credentials",
            "client_id": self.teams_app_id,
            "client_secret": self.teams_app_password,
            "scope": "https://api.botframework.com/.default"
        }

        async with aiohttp.ClientSession() as session:
            async with session.post(url, data=data) as resp:
                if resp.status == 200:
                    result = await resp.json()
                    return result.get("access_token")
                else:
                    logger.error(f"Failed to get Teams token: {await resp.text()}")
                    return None

    # ===========================================
    # SHARED MESSAGE PROCESSING
    # ===========================================

    async def process_chat_message(self, session_id: str, message: str) -> Dict:
        """Process a chat message through Otom"""
        try:
            chat_session = self.active_chats.get(session_id)
            platform = chat_session.get("platform", "unknown") if chat_session else "unknown"

            # Store incoming message in Supabase
            await supabase.store_message(session_id, {
                "sender": "user",
                "content": message,
                "platform": platform
            })

            # Track analytics
            await supabase.track_event("message_received", {
                "session_id": session_id,
                "platform": platform
            })

            # Determine intent
            intent = await self._analyze_intent(message)

            # Route to appropriate handler
            if intent == "consultation":
                response = await self.otom.process_consultation_input(session_id, message)
            elif intent == "workflow_mapping":
                response = await self._handle_workflow_query(session_id, message)
            elif intent == "status":
                response = await self._handle_status_query(session_id)
            elif intent == "pricing":
                response = await self._handle_pricing_query()
            elif intent == "schedule":
                response = await self._handle_scheduling(message)
            else:
                response = await self.otom.process_consultation_input(session_id, message)

            # Format response
            if isinstance(response, dict):
                content = response.get("response", str(response))
            else:
                content = str(response)

            # Store Otom's response in Supabase
            await supabase.store_message(session_id, {
                "sender": "otom",
                "content": content,
                "platform": platform,
                "intent": intent
            })

            return {
                "content": content,
                "intent": intent,
                "metadata": {
                    "session_phase": response.get("phase") if isinstance(response, dict) else "general",
                    "has_deliverables": bool(response.get("deliverable")) if isinstance(response, dict) else False
                }
            }

        except Exception as e:
            logger.error(f"Failed to process chat message: {str(e)}")
            return {
                "content": "I apologize, but I encountered an error. Could you please rephrase your question?",
                "intent": "error",
                "metadata": {"error": str(e)}
            }

    async def _analyze_intent(self, message: str) -> str:
        """Analyze user intent from message"""
        message_lower = message.lower()

        if any(word in message_lower for word in ["workflow", "process", "bottleneck", "efficiency"]):
            return "workflow_mapping"
        elif any(word in message_lower for word in ["price", "cost", "pricing", "fee", "charge"]):
            return "pricing"
        elif any(word in message_lower for word in ["schedule", "book", "appointment", "call me"]):
            return "schedule"
        elif any(word in message_lower for word in ["status", "progress", "update"]):
            return "status"
        else:
            return "consultation"

    async def _handle_workflow_query(self, session_id: str, message: str) -> Dict:
        """Handle workflow-related queries"""
        return {
            "response": """I can help you map and optimize your company workflows.

Our workflow mapping service includes:
• Employee questionnaires (20 minutes each)
• Actual workflow mapping (not just org charts)
• Bottleneck and redundancy identification
• Actionable visualizations
• Monthly progress updates

Would you like to initiate workflow mapping for your organization?""",
            "phase": "workflow_inquiry"
        }

    async def _handle_status_query(self, session_id: str) -> Dict:
        """Handle status queries"""
        if session_id in self.active_chats:
            chat_session = self.active_chats[session_id]
            message_count = len(chat_session.get("messages", []))
            platform = chat_session.get("platform", "unknown")

            return {
                "response": f"Session active on {platform} with {message_count} messages. How can I help you further?",
                "phase": "status"
            }
        return {
            "response": "No active session found. Let's start fresh! What business challenge can I help you with?",
            "phase": "new"
        }

    async def _handle_pricing_query(self) -> Dict:
        """Handle pricing queries"""
        return {
            "response": """Our consulting services:

📊 *Quick Assessment* - $500
• 48-hour turnaround
• Discovery call + 5-page report
• 3 key recommendations

🎯 *Strategic Planning* - $2,500
• 1-week engagement
• 3 strategy sessions
• Full strategy deck + roadmap

🚀 *Transformation Partner* - $10,000
• 1-month partnership
• Weekly consultations
• Complete analysis + ongoing support

Which service interests you?""",
            "phase": "pricing"
        }

    async def _handle_scheduling(self, message: str) -> Dict:
        """Handle scheduling requests"""
        return {
            "response": "I'd be happy to schedule a consultation! Please provide your email and preferred time, and I'll send you a calendar invitation.",
            "phase": "scheduling"
        }

    async def get_history(self, session_id: str) -> Dict:
        """Get chat history for a session"""
        if session_id not in self.active_chats:
            raise HTTPException(status_code=404, detail="Session not found")

        return {
            "session_id": session_id,
            "platform": self.active_chats[session_id].get("platform"),
            "messages": self.active_chats[session_id]["messages"],
            "started_at": self.active_chats[session_id]["started_at"]
        }

    async def export_conversation(self, session_id: str) -> str:
        """Export conversation as formatted text"""
        if session_id not in self.active_chats:
            return ""

        chat = self.active_chats[session_id]
        export = f"Otom AI Consultation - Session {session_id}\n"
        export += f"Platform: {chat.get('platform', 'unknown')}\n"
        export += f"Started: {chat['started_at']}\n"
        export += "=" * 50 + "\n\n"

        for msg in chat["messages"]:
            sender = "Otom" if msg.get("sender") == "otom" else "Client"
            export += f"{sender} ({msg.get('timestamp', 'N/A')}):\n"
            export += f"{msg.get('content', '')}\n\n"

        return export
