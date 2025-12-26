"""
Voice Interface for Otom - Vapi.ai Integration
Real-time conversational AI phone calls like Boardy
"""

import os
import json
import asyncio
from typing import Dict, Optional, Any, List
import uuid
from datetime import datetime

import aiohttp
from fastapi import APIRouter, Request, Response, HTTPException
from fastapi.responses import JSONResponse

from utils.logger import setup_logger
from integrations.supabase_mcp import supabase

logger = setup_logger("voice_handler")


class VoiceInterface:
    """
    Vapi.ai-powered voice interface for natural phone conversations.

    Unlike traditional Twilio Gather (turn-based), Vapi provides:
    - Real-time streaming audio
    - Natural conversation flow with interruptions
    - Voice Activity Detection (VAD)
    - Low-latency responses
    """

    def __init__(self, otom_consultant):
        """Initialize Vapi voice interface"""
        self.otom = otom_consultant

        # Vapi configuration
        self.vapi_api_key = os.getenv("VAPI_API_KEY")
        self.vapi_phone_number_id = os.getenv("VAPI_PHONE_NUMBER_ID")
        self.vapi_assistant_id = os.getenv("VAPI_ASSISTANT_ID")  # Optional pre-configured assistant
        self.base_url = os.getenv("BASE_URL", "http://localhost:8000")

        # API endpoints
        self.vapi_base_url = "https://api.vapi.ai"

        # Active call sessions
        self.active_calls: Dict[str, Dict] = {}

        # Setup API routes
        self.router = APIRouter(prefix="/voice")
        self._setup_routes()

        logger.info("Vapi voice interface initialized")

    def _setup_routes(self):
        """Setup Vapi webhook routes"""

        # ==========================================
        # API ENDPOINTS FOR DASHBOARD
        # ==========================================

        @self.router.get("/calls")
        async def list_calls(
            limit: int = 50,
            status: str = None,
            phone_number: str = None
        ):
            """
            List all call sessions with optional filters.
            Used by dashboard to display call history.
            """
            try:
                calls = await supabase.list_call_sessions(
                    phone_number=phone_number,
                    status=status,
                    limit=limit
                )
                return {"calls": calls, "total": len(calls)}
            except Exception as e:
                logger.error(f"Failed to list calls: {str(e)}")
                raise HTTPException(status_code=500, detail=str(e))

        @self.router.get("/calls/stats")
        async def get_call_stats(days: int = 30):
            """
            Get call statistics for dashboard overview.
            Returns aggregated metrics about calls.
            """
            try:
                # Get all calls for the period
                calls = await supabase.list_call_sessions(limit=1000)

                # Calculate statistics
                total_calls = len(calls)
                completed_calls = [c for c in calls if c.get("status") == "completed"]
                active_calls = [c for c in calls if c.get("status") in ["connecting", "in-progress", "initiated"]]

                # Calculate average duration
                durations = [c.get("duration_seconds", 0) for c in completed_calls if c.get("duration_seconds")]
                avg_duration = sum(durations) / len(durations) if durations else 0

                # Calculate completion rate
                completion_rate = (len(completed_calls) / total_calls * 100) if total_calls > 0 else 0

                # Get calls by direction
                inbound_calls = len([c for c in calls if c.get("direction") == "inbound"])
                outbound_calls = len([c for c in calls if c.get("direction") == "outbound"])

                return {
                    "total_calls": total_calls,
                    "completed_calls": len(completed_calls),
                    "active_calls": len(active_calls),
                    "avg_duration_seconds": round(avg_duration, 1),
                    "avg_duration_formatted": f"{int(avg_duration // 60)}m {int(avg_duration % 60)}s" if avg_duration > 0 else "0m",
                    "completion_rate": round(completion_rate, 1),
                    "inbound_calls": inbound_calls,
                    "outbound_calls": outbound_calls
                }
            except Exception as e:
                logger.error(f"Failed to get call stats: {str(e)}")
                raise HTTPException(status_code=500, detail=str(e))

        @self.router.get("/calls/{session_id}")
        async def get_call(session_id: str):
            """
            Get a single call session by ID.
            Returns full call details including transcript.
            """
            try:
                call = await supabase.get_call_session(session_id)
                if not call:
                    raise HTTPException(status_code=404, detail="Call session not found")
                return call
            except HTTPException:
                raise
            except Exception as e:
                logger.error(f"Failed to get call: {str(e)}")
                raise HTTPException(status_code=500, detail=str(e))

        # ==========================================
        # VAPI WEBHOOK ROUTES
        # ==========================================

        @self.router.post("/vapi/webhook")
        async def vapi_webhook(request: Request):
            """
            Main Vapi webhook handler.
            Receives all events from Vapi during calls.
            """
            try:
                payload = await request.json()
                message_type = payload.get("message", {}).get("type")

                logger.info(f"Vapi webhook received: {message_type}")

                # Route to appropriate handler
                if message_type == "assistant-request":
                    return await self._handle_assistant_request(payload)
                elif message_type == "function-call":
                    return await self._handle_function_call(payload)
                elif message_type == "tool-calls":
                    return await self._handle_tool_calls(payload)
                elif message_type == "end-of-call-report":
                    return await self._handle_end_of_call_report(payload)
                elif message_type == "status-update":
                    return await self._handle_status_update(payload)
                elif message_type == "conversation-update":
                    return await self._handle_conversation_update(payload)
                elif message_type == "transcript":
                    return await self._handle_transcript(payload)
                elif message_type == "hang":
                    return await self._handle_hang(payload)
                else:
                    logger.debug(f"Unhandled message type: {message_type}")
                    return JSONResponse(content={"status": "ok"})

            except Exception as e:
                logger.error(f"Vapi webhook error: {str(e)}")
                return JSONResponse(
                    status_code=500,
                    content={"error": str(e)}
                )

        @self.router.post("/vapi/chat-completions")
        async def custom_llm_endpoint(request: Request):
            """
            Custom LLM endpoint for Vapi.
            Vapi sends conversation context, we process through Otom brain.
            OpenAI-compatible format.
            """
            try:
                data = await request.json()
                return await self._handle_custom_llm_request(data)
            except Exception as e:
                logger.error(f"Custom LLM endpoint error: {str(e)}")
                return JSONResponse(
                    status_code=500,
                    content={"error": str(e)}
                )

    async def _handle_assistant_request(self, payload: Dict) -> JSONResponse:
        """
        Handle assistant-request event.
        Called when an inbound call comes in and we need to provide assistant config.
        Must respond within 7.5 seconds.
        """
        call_data = payload.get("message", {}).get("call", {})
        phone_number = call_data.get("customer", {}).get("number", "unknown")

        logger.info(f"Assistant request for call from: {phone_number}")

        # Create session for this call
        session_id = str(uuid.uuid4())
        self.active_calls[session_id] = {
            "phone_number": phone_number,
            "started_at": datetime.utcnow().isoformat(),
            "status": "connecting"
        }

        # Store in Supabase
        await supabase.create_call_session({
            "session_id": session_id,
            "phone_number": phone_number,
            "direction": "inbound",
            "status": "connecting"
        })

        # Track analytics
        await supabase.track_event("call_initiated", {
            "session_id": session_id,
            "platform": "vapi",
            "direction": "inbound"
        })

        # Return dynamic assistant configuration
        assistant_config = self._build_assistant_config(session_id)

        return JSONResponse(content={"assistant": assistant_config})

    def _build_assistant_config(self, session_id: str) -> Dict:
        """
        Build Vapi assistant configuration.
        This defines how Otom behaves on the phone.
        """
        return {
            "name": "Otom AI Consultant",

            # First message when call connects
            "firstMessage": (
                "Hello! I'm Otom, your AI business consultant. "
                "I help businesses develop strategies and solve challenges. "
                "What's on your mind today?"
            ),

            # How the conversation starts
            "firstMessageMode": "assistant-speaks-first",

            # System prompt - Otom's personality
            "model": {
                "provider": "custom-llm",
                "url": f"{self.base_url}/voice/vapi/chat-completions",
                "model": "otom-consultant",
                "messages": [
                    {
                        "role": "system",
                        "content": self._get_system_prompt(session_id)
                    }
                ],
                "temperature": 0.7,
                "maxTokens": 500,  # Keep responses concise for voice
            },

            # Voice configuration - use a professional voice
            "voice": {
                "provider": "11labs",
                "voiceId": os.getenv("ELEVENLABS_VOICE_ID", "21m00Tcm4TlvDq8ikWAM"),
                "stability": 0.5,
                "similarityBoost": 0.75,
                "model": "eleven_turbo_v2"
            },

            # Transcription settings
            "transcriber": {
                "provider": "deepgram",
                "model": "nova-2",
                "language": "en"
            },

            # Conversation behavior
            "silenceTimeoutSeconds": 30,
            "maxDurationSeconds": 1800,  # 30 minute max call
            "endCallMessage": "Thank you for consulting with Otom. You'll receive a summary via email. Goodbye!",

            # Background sound for natural feel
            "backgroundSound": "off",

            # Enable interruptions for natural conversation
            "backchannelingEnabled": True,

            # Server URL for events
            "serverUrl": f"{self.base_url}/voice/vapi/webhook",

            # Metadata
            "metadata": {
                "session_id": session_id
            },

            # Tools Otom can use during the call
            "tools": self._get_assistant_tools()
        }

    def _get_system_prompt(self, session_id: str) -> str:
        """Get Otom's system prompt for voice conversations"""
        return """You are Otom, an elite AI business consultant with expertise from McKinsey, BCG, and Bain methodologies.

VOICE CONVERSATION GUIDELINES:
- Keep responses concise (2-3 sentences max) - this is a phone call, not an essay
- Speak naturally and conversationally
- Use verbal confirmations like "I see", "That makes sense", "Interesting"
- Ask one question at a time
- If you need to explain something complex, break it into parts and check for understanding

YOUR APPROACH:
1. Listen actively and understand the client's situation
2. Ask clarifying questions to gather context
3. Apply relevant business frameworks when appropriate
4. Provide clear, actionable insights
5. Be direct but empathetic

CONSULTATION PHASES:
1. Discovery - Understand the business and challenges
2. Analysis - Identify patterns and opportunities
3. Strategy - Develop recommendations
4. Implementation - Create action plans

IMPORTANT:
- Never use markdown, bullet points, or formatting - this is spoken
- Don't say "as an AI" or similar - you're Otom, a consultant
- If they ask to schedule a follow-up, use the schedule_consultation tool
- If they want a detailed analysis, let them know you'll send a written report after the call

Current session: """ + session_id

    def _get_assistant_tools(self) -> List[Dict]:
        """Define tools Otom can use during calls"""
        return [
            {
                "type": "function",
                "function": {
                    "name": "schedule_consultation",
                    "description": "Schedule a follow-up consultation call",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "email": {
                                "type": "string",
                                "description": "Client's email address"
                            },
                            "preferred_time": {
                                "type": "string",
                                "description": "Preferred time for the consultation"
                            }
                        },
                        "required": ["email"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "send_report",
                    "description": "Send a detailed analysis report to the client after the call",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "email": {
                                "type": "string",
                                "description": "Client's email address"
                            },
                            "report_type": {
                                "type": "string",
                                "enum": ["quick_assessment", "strategy_deck", "full_analysis"],
                                "description": "Type of report to send"
                            }
                        },
                        "required": ["email", "report_type"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "transfer_to_human",
                    "description": "Transfer the call to a human consultant if requested",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "reason": {
                                "type": "string",
                                "description": "Reason for the transfer"
                            }
                        },
                        "required": ["reason"]
                    }
                }
            }
        ]

    async def _handle_custom_llm_request(self, data: Dict) -> JSONResponse:
        """
        Handle custom LLM requests from Vapi.
        Process the conversation through Otom's brain.
        """
        messages = data.get("messages", [])

        # Extract session ID from the call metadata or last message
        session_id = None
        for msg in messages:
            if msg.get("role") == "system":
                content = msg.get("content", "")
                if "Current session:" in content:
                    session_id = content.split("Current session:")[-1].strip()
                    break

        if not session_id:
            session_id = str(uuid.uuid4())

        # Get the last user message
        user_message = None
        for msg in reversed(messages):
            if msg.get("role") == "user":
                user_message = msg.get("content")
                break

        if not user_message:
            return JSONResponse(content={
                "choices": [{
                    "message": {
                        "role": "assistant",
                        "content": "I'm here to help. What would you like to discuss?"
                    }
                }]
            })

        try:
            # Process through Otom's brain
            response = await self.otom.process_consultation_input(session_id, user_message)
            assistant_response = response.get("response", "I understand. Tell me more about that.")

            # Return OpenAI-compatible response
            return JSONResponse(content={
                "id": f"chatcmpl-{uuid.uuid4().hex[:8]}",
                "object": "chat.completion",
                "created": int(datetime.utcnow().timestamp()),
                "model": "otom-consultant",
                "choices": [{
                    "index": 0,
                    "message": {
                        "role": "assistant",
                        "content": assistant_response
                    },
                    "finish_reason": "stop"
                }],
                "usage": {
                    "prompt_tokens": len(str(messages)),
                    "completion_tokens": len(assistant_response),
                    "total_tokens": len(str(messages)) + len(assistant_response)
                }
            })

        except ValueError:
            # Session not found, start new consultation
            await self.otom.start_consultation(session_id, {"phone_number": "vapi_call"})
            response = await self.otom.process_consultation_input(session_id, user_message)

            return JSONResponse(content={
                "choices": [{
                    "message": {
                        "role": "assistant",
                        "content": response.get("response", "Thanks for sharing. Let me understand your situation better.")
                    }
                }]
            })

    async def _handle_function_call(self, payload: Dict) -> JSONResponse:
        """Handle function calls from Vapi"""
        message = payload.get("message", {})
        function_call = message.get("functionCall", {})
        function_name = function_call.get("name")
        parameters = function_call.get("parameters", {})

        logger.info(f"Function call: {function_name} with params: {parameters}")

        result = {}

        if function_name == "schedule_consultation":
            booking = await self.otom.schedule_consultation(
                parameters.get("email"),
                parameters.get("preferred_time", "next available")
            )
            result = {
                "success": True,
                "message": f"I've scheduled a follow-up consultation. You'll receive a confirmation email at {parameters.get('email')}.",
                "booking_id": booking.get("id")
            }

        elif function_name == "send_report":
            result = {
                "success": True,
                "message": f"I'll send you a {parameters.get('report_type', 'summary')} report to {parameters.get('email')} after our call."
            }

        elif function_name == "transfer_to_human":
            result = {
                "success": True,
                "message": "I'll connect you with a human consultant. Please hold for a moment."
            }

        return JSONResponse(content={"result": json.dumps(result)})

    async def _handle_tool_calls(self, payload: Dict) -> JSONResponse:
        """Handle tool calls from Vapi (newer format)"""
        message = payload.get("message", {})
        tool_calls = message.get("toolCalls", [])

        results = []
        for tool_call in tool_calls:
            tool_call_id = tool_call.get("id")
            function = tool_call.get("function", {})
            function_name = function.get("name")
            arguments = json.loads(function.get("arguments", "{}"))

            logger.info(f"Tool call: {function_name}")

            # Process the tool call
            if function_name == "schedule_consultation":
                booking = await self.otom.schedule_consultation(
                    arguments.get("email"),
                    arguments.get("preferred_time", "next available")
                )
                result = f"Scheduled consultation. Booking ID: {booking.get('id')}"
            elif function_name == "send_report":
                result = f"Report will be sent to {arguments.get('email')}"
            elif function_name == "transfer_to_human":
                result = "Transferring to human consultant"
            else:
                result = "Tool not found"

            results.append({
                "toolCallId": tool_call_id,
                "result": result
            })

        return JSONResponse(content={"results": results})

    async def _handle_end_of_call_report(self, payload: Dict) -> JSONResponse:
        """Handle end of call report from Vapi"""
        message = payload.get("message", {})
        call = message.get("call", {})

        call_id = call.get("id")
        duration = message.get("durationSeconds", 0)
        transcript = message.get("transcript", "")
        summary = message.get("summary", "")

        logger.info(f"Call ended: {call_id}, Duration: {duration}s")

        # Find session by call metadata
        session_id = call.get("metadata", {}).get("session_id")

        if session_id and session_id in self.active_calls:
            self.active_calls[session_id].update({
                "status": "completed",
                "ended_at": datetime.utcnow().isoformat(),
                "duration_seconds": duration,
                "transcript": transcript,
                "summary": summary
            })

            # Store call completion in Supabase
            await supabase.complete_call_session(session_id, {
                "duration_seconds": duration,
                "transcript": transcript,
                "summary": summary
            })

            # Track analytics
            await supabase.track_event("call_completed", {
                "session_id": session_id,
                "platform": "vapi",
                "duration_seconds": duration
            })

        return JSONResponse(content={"status": "received"})

    async def _handle_status_update(self, payload: Dict) -> JSONResponse:
        """Handle status updates from Vapi"""
        message = payload.get("message", {})
        status = message.get("status")

        logger.info(f"Call status update: {status}")

        return JSONResponse(content={"status": "ok"})

    async def _handle_conversation_update(self, payload: Dict) -> JSONResponse:
        """Handle conversation updates from Vapi"""
        # Conversation updates contain the current state of the conversation
        # Can be used for real-time monitoring
        return JSONResponse(content={"status": "ok"})

    async def _handle_transcript(self, payload: Dict) -> JSONResponse:
        """Handle transcript events from Vapi"""
        message = payload.get("message", {})
        transcript = message.get("transcript", "")

        logger.debug(f"Transcript update: {transcript[:100]}...")

        return JSONResponse(content={"status": "ok"})

    async def _handle_hang(self, payload: Dict) -> JSONResponse:
        """Handle hang notification from Vapi"""
        logger.info("Call hang notification received")
        return JSONResponse(content={"status": "ok"})

    async def initiate_call(self, phone_number: str) -> str:
        """
        Initiate an outbound call via Vapi API.
        This is the Boardy-like experience - Otom calls you.
        """
        if not self.vapi_api_key:
            raise ValueError("VAPI_API_KEY not configured")

        if not self.vapi_phone_number_id:
            raise ValueError("VAPI_PHONE_NUMBER_ID not configured")

        session_id = str(uuid.uuid4())

        # Build the call request
        call_payload = {
            "phoneNumberId": self.vapi_phone_number_id,
            "customer": {
                "number": phone_number
            },
            "assistant": self._build_assistant_config(session_id)
        }

        # If we have a pre-configured assistant, use that instead
        if self.vapi_assistant_id:
            call_payload = {
                "phoneNumberId": self.vapi_phone_number_id,
                "customer": {
                    "number": phone_number
                },
                "assistantId": self.vapi_assistant_id,
                "assistantOverrides": {
                    "serverUrl": f"{self.base_url}/voice/vapi/webhook",
                    "metadata": {
                        "session_id": session_id
                    }
                }
            }

        headers = {
            "Authorization": f"Bearer {self.vapi_api_key}",
            "Content-Type": "application/json"
        }

        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{self.vapi_base_url}/call",
                json=call_payload,
                headers=headers
            ) as response:
                if response.status != 201:
                    error_text = await response.text()
                    logger.error(f"Vapi call creation failed: {error_text}")
                    raise Exception(f"Failed to create call: {error_text}")

                result = await response.json()

                # Track the call
                self.active_calls[session_id] = {
                    "call_id": result.get("id"),
                    "phone_number": phone_number,
                    "started_at": datetime.utcnow().isoformat(),
                    "status": "initiating"
                }

                # Store in Supabase
                await supabase.create_call_session({
                    "session_id": session_id,
                    "call_id": result.get("id"),
                    "phone_number": phone_number,
                    "direction": "outbound",
                    "status": "initiating"
                })

                # Track analytics
                await supabase.track_event("call_initiated", {
                    "session_id": session_id,
                    "platform": "vapi",
                    "direction": "outbound"
                })

                logger.info(f"Initiated Vapi call to {phone_number}, session: {session_id}")

                return session_id

    async def schedule_call(
        self,
        phone_number: str,
        scheduled_time: datetime
    ) -> str:
        """
        Schedule a call for a future time.
        """
        if not self.vapi_api_key:
            raise ValueError("VAPI_API_KEY not configured")

        session_id = str(uuid.uuid4())

        call_payload = {
            "phoneNumberId": self.vapi_phone_number_id,
            "customer": {
                "number": phone_number
            },
            "assistant": self._build_assistant_config(session_id),
            "schedulePlan": {
                "earliestAt": scheduled_time.isoformat()
            }
        }

        headers = {
            "Authorization": f"Bearer {self.vapi_api_key}",
            "Content-Type": "application/json"
        }

        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{self.vapi_base_url}/call",
                json=call_payload,
                headers=headers
            ) as response:
                if response.status != 201:
                    error_text = await response.text()
                    raise Exception(f"Failed to schedule call: {error_text}")

                result = await response.json()

                self.active_calls[session_id] = {
                    "call_id": result.get("id"),
                    "phone_number": phone_number,
                    "scheduled_for": scheduled_time.isoformat(),
                    "status": "scheduled"
                }

                logger.info(f"Scheduled Vapi call to {phone_number} for {scheduled_time}")

                return session_id

    async def end_call(self, session_id: str) -> bool:
        """End an active call"""
        call_info = self.active_calls.get(session_id)
        if not call_info:
            logger.warning(f"Call session {session_id} not found")
            return False

        call_id = call_info.get("call_id")
        if not call_id:
            return False

        headers = {
            "Authorization": f"Bearer {self.vapi_api_key}",
            "Content-Type": "application/json"
        }

        async with aiohttp.ClientSession() as session:
            async with session.patch(
                f"{self.vapi_base_url}/call/{call_id}",
                json={"status": "ended"},
                headers=headers
            ) as response:
                if response.status == 200:
                    self.active_calls[session_id]["status"] = "ended"
                    logger.info(f"Ended call session {session_id}")
                    return True
                else:
                    error_text = await response.text()
                    logger.error(f"Failed to end call: {error_text}")
                    return False

    def get_call_status(self, session_id: str) -> Optional[Dict]:
        """Get status of an active call"""
        return self.active_calls.get(session_id)

    async def list_active_calls(self) -> List[Dict]:
        """List all active calls"""
        return [
            {"session_id": sid, **info}
            for sid, info in self.active_calls.items()
            if info.get("status") not in ["completed", "ended"]
        ]

    async def create_assistant(self) -> Dict:
        """
        Create a Vapi assistant (optional - can be done via dashboard).
        Returns assistant ID for reuse.
        """
        assistant_config = {
            "name": "Otom AI Consultant",
            "firstMessage": (
                "Hello! I'm Otom, your AI business consultant. "
                "I help businesses develop strategies and solve challenges. "
                "What's on your mind today?"
            ),
            "model": {
                "provider": "custom-llm",
                "url": f"{self.base_url}/voice/vapi/chat-completions",
                "model": "otom-consultant",
                "messages": [
                    {
                        "role": "system",
                        "content": self._get_system_prompt("{{metadata.session_id}}")
                    }
                ]
            },
            "voice": {
                "provider": "11labs",
                "voiceId": os.getenv("ELEVENLABS_VOICE_ID", "21m00Tcm4TlvDq8ikWAM")
            },
            "serverUrl": f"{self.base_url}/voice/vapi/webhook"
        }

        headers = {
            "Authorization": f"Bearer {self.vapi_api_key}",
            "Content-Type": "application/json"
        }

        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{self.vapi_base_url}/assistant",
                json=assistant_config,
                headers=headers
            ) as response:
                if response.status == 201:
                    result = await response.json()
                    logger.info(f"Created Vapi assistant: {result.get('id')}")
                    return result
                else:
                    error_text = await response.text()
                    raise Exception(f"Failed to create assistant: {error_text}")
