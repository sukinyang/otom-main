"""
Supabase Backend for Otom
Provides data persistence for voice calls, chat sessions, and consultations
Free tier: 500MB database, 1GB file storage, 2GB bandwidth
"""

import os
import json
import asyncio
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
import uuid

from supabase import create_client, Client

from utils.logger import setup_logger

logger = setup_logger("supabase")


class SupabaseBackend:
    """
    Supabase backend for Otom.
    Handles all database operations, file storage, and real-time subscriptions.
    """

    def __init__(self):
        """Initialize Supabase client"""
        self.supabase_url = os.getenv("SUPABASE_URL")
        self.supabase_key = os.getenv("SUPABASE_KEY") or os.getenv("SUPABASE_ANON_KEY")
        self.service_key = os.getenv("SUPABASE_SERVICE_KEY")

        if not self.supabase_url or not self.supabase_key:
            logger.warning("Supabase credentials not configured - running in memory-only mode")
            self.client = None
            return

        # Initialize Supabase client
        try:
            self.client: Client = create_client(self.supabase_url, self.supabase_key)
            logger.info("Supabase client initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize Supabase client: {e}")
            self.client = None
            return

        # Service client for admin operations
        self.service_client: Client = None
        if self.service_key:
            try:
                self.service_client = create_client(self.supabase_url, self.service_key)
            except Exception as e:
                logger.error(f"Failed to initialize Supabase service client: {e}")

        self.storage_bucket = os.getenv("SUPABASE_STORAGE_BUCKET", "otom-files")
        logger.info("Supabase backend initialized")

    def _check_client(self) -> bool:
        """Check if Supabase client is available"""
        if not self.client:
            logger.warning("Supabase client not available")
            return False
        return True

    # ===========================================
    # VOICE CALL SESSIONS (Vapi Integration)
    # ===========================================

    async def create_call_session(self, session_data: Dict) -> Dict:
        """Create a new voice call session"""
        if not self._check_client():
            return session_data

        try:
            data = {
                "id": session_data.get("id") or session_data.get("session_id", str(uuid.uuid4())),
                "vapi_call_id": session_data.get("vapi_call_id") or session_data.get("call_id"),
                "phone_number": session_data.get("phone_number"),
                "direction": session_data.get("direction", "outbound"),
                "status": session_data.get("status", "initiated"),
                "platform": session_data.get("platform", "vapi"),
                "transcript": session_data.get("transcript"),
                "summary": session_data.get("summary"),
                "duration_seconds": session_data.get("duration_seconds"),
                "metadata": json.dumps(session_data.get("metadata", {})) if isinstance(session_data.get("metadata"), dict) else session_data.get("metadata"),
                "started_at": session_data.get("started_at") or datetime.utcnow().isoformat(),
                "ended_at": session_data.get("ended_at"),
                "created_at": datetime.utcnow().isoformat()
            }

            # Remove None values
            data = {k: v for k, v in data.items() if v is not None}

            response = self.client.table("call_sessions").insert(data).execute()
            logger.info(f"Created call session: {data['id']}")
            return response.data[0] if response.data else data

        except Exception as e:
            logger.error(f"Failed to create call session: {str(e)}")
            return session_data

    async def update_call_session(self, session_id: str, updates: Dict) -> Dict:
        """Update a voice call session"""
        if not self._check_client():
            return updates

        try:
            updates["updated_at"] = datetime.utcnow().isoformat()

            # Handle JSON fields
            if "metadata" in updates and isinstance(updates["metadata"], dict):
                updates["metadata"] = json.dumps(updates["metadata"])

            response = self.client.table("call_sessions").update(updates).eq(
                "id", session_id
            ).execute()

            return response.data[0] if response.data else updates

        except Exception as e:
            logger.error(f"Failed to update call session: {str(e)}")
            return updates

    async def complete_call_session(self, session_id: str, call_data: Dict) -> Dict:
        """Complete a call session with transcript and summary"""
        if not self._check_client():
            return call_data

        try:
            updates = {
                "status": "completed",
                "ended_at": datetime.utcnow().isoformat(),
                "duration_seconds": call_data.get("duration_seconds", 0),
                "transcript": call_data.get("transcript", ""),
                "summary": call_data.get("summary", ""),
                "cost": call_data.get("cost"),
                "updated_at": datetime.utcnow().isoformat()
            }

            response = self.client.table("call_sessions").update(updates).eq(
                "id", session_id
            ).execute()

            logger.info(f"Completed call session: {session_id}")
            return response.data[0] if response.data else updates

        except Exception as e:
            logger.error(f"Failed to complete call session: {str(e)}")
            return call_data

    async def get_call_session(self, session_id: str) -> Optional[Dict]:
        """Get call session by ID"""
        if not self._check_client():
            return None

        try:
            response = self.client.table("call_sessions").select("*").eq(
                "id", session_id
            ).single().execute()

            if response.data:
                data = response.data
                if data.get("metadata"):
                    data["metadata"] = json.loads(data["metadata"])
                return data
            return None

        except Exception as e:
            logger.error(f"Failed to get call session: {str(e)}")
            return None

    async def list_call_sessions(
        self,
        phone_number: str = None,
        status: str = None,
        limit: int = 50
    ) -> List[Dict]:
        """List call sessions with filters"""
        if not self._check_client():
            return []

        try:
            query = self.client.table("call_sessions").select("*")

            if phone_number:
                query = query.eq("phone_number", phone_number)
            if status:
                query = query.eq("status", status)

            query = query.order("created_at", desc=True).limit(limit)
            response = query.execute()

            return response.data if response.data else []

        except Exception as e:
            logger.error(f"Failed to list call sessions: {str(e)}")
            return []

    # ===========================================
    # CHAT SESSIONS (Multi-platform)
    # ===========================================

    async def create_chat_session(self, session_data: Dict) -> Dict:
        """Create a new chat session"""
        if not self._check_client():
            return session_data

        try:
            data = {
                "id": session_data.get("session_id", str(uuid.uuid4())),
                "platform": session_data.get("platform"),  # slack, whatsapp, telegram, teams, web
                "platform_user_id": session_data.get("user_id"),
                "platform_channel_id": session_data.get("channel_id"),
                "user_name": session_data.get("user_name"),
                "phone_number": session_data.get("phone_number"),  # For WhatsApp
                "status": "active",
                "metadata": json.dumps(session_data.get("metadata", {})),
                "started_at": datetime.utcnow().isoformat(),
                "created_at": datetime.utcnow().isoformat()
            }

            response = self.client.table("chat_sessions").insert(data).execute()
            logger.info(f"Created chat session: {data['id']} on {data['platform']}")
            return response.data[0] if response.data else data

        except Exception as e:
            logger.error(f"Failed to create chat session: {str(e)}")
            return session_data

    async def get_or_create_chat_session(self, session_id: str, session_data: Dict) -> Dict:
        """Get existing chat session or create new one"""
        if not self._check_client():
            return session_data

        try:
            # Try to get existing
            response = self.client.table("chat_sessions").select("*").eq(
                "id", session_id
            ).single().execute()

            if response.data:
                return response.data

            # Create new
            return await self.create_chat_session({**session_data, "session_id": session_id})

        except Exception as e:
            # Likely not found, create new
            return await self.create_chat_session({**session_data, "session_id": session_id})

    async def update_chat_session(self, session_id: str, updates: Dict) -> Dict:
        """Update chat session"""
        if not self._check_client():
            return updates

        try:
            updates["updated_at"] = datetime.utcnow().isoformat()
            updates["last_message_at"] = datetime.utcnow().isoformat()

            response = self.client.table("chat_sessions").update(updates).eq(
                "id", session_id
            ).execute()

            return response.data[0] if response.data else updates

        except Exception as e:
            logger.error(f"Failed to update chat session: {str(e)}")
            return updates

    # ===========================================
    # CHAT MESSAGES
    # ===========================================

    async def store_message(self, session_id: str, message: Dict) -> Dict:
        """Store a chat message"""
        if not self._check_client():
            return message

        try:
            data = {
                "id": str(uuid.uuid4()),
                "session_id": session_id,
                "sender": message.get("sender"),  # 'user' or 'otom'
                "content": message.get("content"),
                "platform": message.get("platform"),
                "intent": message.get("intent"),
                "metadata": json.dumps(message.get("metadata", {})),
                "timestamp": message.get("timestamp", datetime.utcnow().isoformat())
            }

            response = self.client.table("messages").insert(data).execute()
            return response.data[0] if response.data else data

        except Exception as e:
            logger.error(f"Failed to store message: {str(e)}")
            return message

    async def get_messages(self, session_id: str, limit: int = 100) -> List[Dict]:
        """Get messages for a session"""
        if not self._check_client():
            return []

        try:
            response = self.client.table("messages").select("*").eq(
                "session_id", session_id
            ).order("timestamp", desc=False).limit(limit).execute()

            messages = response.data if response.data else []
            for msg in messages:
                if msg.get("metadata"):
                    msg["metadata"] = json.loads(msg["metadata"])
            return messages

        except Exception as e:
            logger.error(f"Failed to get messages: {str(e)}")
            return []

    # ===========================================
    # CONSULTATIONS
    # ===========================================

    async def create_consultation(self, consultation_data: Dict) -> Dict:
        """Create a new consultation"""
        if not self._check_client():
            return consultation_data

        try:
            data = {
                "id": consultation_data.get("id", str(uuid.uuid4())),
                "session_id": consultation_data.get("session_id"),
                "client_email": consultation_data.get("client_email"),
                "client_phone": consultation_data.get("client_phone"),
                "company_name": consultation_data.get("company_name"),
                "source_platform": consultation_data.get("platform"),  # vapi, slack, whatsapp, etc.
                "status": consultation_data.get("status", "discovery"),
                "phase": consultation_data.get("phase", "discovery"),
                "context": json.dumps(consultation_data.get("context", {})),
                "analysis": json.dumps(consultation_data.get("analysis", {})),
                "recommendations": json.dumps(consultation_data.get("recommendations", [])),
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat()
            }

            response = self.client.table("consultations").insert(data).execute()
            logger.info(f"Created consultation: {data['id']}")
            return response.data[0] if response.data else data

        except Exception as e:
            logger.error(f"Failed to create consultation: {str(e)}")
            return consultation_data

    async def update_consultation(self, consultation_id: str, updates: Dict) -> Dict:
        """Update consultation"""
        if not self._check_client():
            return updates

        try:
            updates["updated_at"] = datetime.utcnow().isoformat()

            # Handle JSON fields
            for field in ["context", "analysis", "recommendations"]:
                if field in updates and isinstance(updates[field], (dict, list)):
                    updates[field] = json.dumps(updates[field])

            response = self.client.table("consultations").update(updates).eq(
                "id", consultation_id
            ).execute()

            return response.data[0] if response.data else updates

        except Exception as e:
            logger.error(f"Failed to update consultation: {str(e)}")
            return updates

    async def get_consultation(self, consultation_id: str) -> Optional[Dict]:
        """Get consultation by ID"""
        if not self._check_client():
            return None

        try:
            response = self.client.table("consultations").select("*").eq(
                "id", consultation_id
            ).single().execute()

            if response.data:
                data = response.data
                for field in ["context", "analysis", "recommendations"]:
                    if data.get(field):
                        data[field] = json.loads(data[field])
                return data
            return None

        except Exception as e:
            logger.error(f"Failed to get consultation: {str(e)}")
            return None

    async def get_consultation_by_session(self, session_id: str) -> Optional[Dict]:
        """Get consultation by session ID"""
        if not self._check_client():
            return None

        try:
            response = self.client.table("consultations").select("*").eq(
                "session_id", session_id
            ).order("created_at", desc=True).limit(1).execute()

            if response.data:
                data = response.data[0]
                for field in ["context", "analysis", "recommendations"]:
                    if data.get(field):
                        data[field] = json.loads(data[field])
                return data
            return None

        except Exception as e:
            logger.error(f"Failed to get consultation by session: {str(e)}")
            return None

    # ===========================================
    # SCHEDULED CALLS / BOOKINGS
    # ===========================================

    async def create_booking(self, booking_data: Dict) -> Dict:
        """Create a scheduled consultation booking"""
        if not self._check_client():
            return booking_data

        try:
            data = {
                "id": booking_data.get("id", str(uuid.uuid4())),
                "client_email": booking_data.get("email"),
                "client_phone": booking_data.get("phone"),
                "preferred_time": booking_data.get("preferred_time"),
                "scheduled_at": booking_data.get("scheduled_at"),
                "timezone": booking_data.get("timezone", "UTC"),
                "status": "scheduled",
                "source_platform": booking_data.get("platform"),
                "notes": booking_data.get("notes"),
                "created_at": datetime.utcnow().isoformat()
            }

            response = self.client.table("bookings").insert(data).execute()
            logger.info(f"Created booking: {data['id']}")
            return response.data[0] if response.data else data

        except Exception as e:
            logger.error(f"Failed to create booking: {str(e)}")
            return booking_data

    async def get_pending_bookings(self) -> List[Dict]:
        """Get bookings that need to be processed"""
        if not self._check_client():
            return []

        try:
            now = datetime.utcnow().isoformat()
            response = self.client.table("bookings").select("*").eq(
                "status", "scheduled"
            ).lte("scheduled_at", now).execute()

            return response.data if response.data else []

        except Exception as e:
            logger.error(f"Failed to get pending bookings: {str(e)}")
            return []

    # ===========================================
    # FILE STORAGE
    # ===========================================

    async def upload_file(
        self,
        file_data: bytes,
        file_name: str,
        folder: str = "reports",
        content_type: str = "application/pdf"
    ) -> Optional[str]:
        """Upload file to Supabase Storage"""
        if not self._check_client():
            return None

        try:
            storage_path = f"{folder}/{file_name}"

            self.client.storage.from_(self.storage_bucket).upload(
                storage_path,
                file_data,
                {"content-type": content_type}
            )

            # Get public URL
            public_url = self.client.storage.from_(self.storage_bucket).get_public_url(storage_path)
            logger.info(f"Uploaded file: {storage_path}")
            return public_url

        except Exception as e:
            logger.error(f"Failed to upload file: {str(e)}")
            return None

    async def get_file_url(self, file_path: str) -> Optional[str]:
        """Get public URL for a file"""
        if not self._check_client():
            return None

        try:
            return self.client.storage.from_(self.storage_bucket).get_public_url(file_path)
        except Exception as e:
            logger.error(f"Failed to get file URL: {str(e)}")
            return None

    # ===========================================
    # ANALYTICS
    # ===========================================

    async def track_event(self, event_type: str, event_data: Dict) -> None:
        """Track an analytics event"""
        if not self._check_client():
            return

        try:
            data = {
                "id": str(uuid.uuid4()),
                "event_type": event_type,
                "platform": event_data.get("platform"),
                "session_id": event_data.get("session_id"),
                "data": json.dumps(event_data),
                "timestamp": datetime.utcnow().isoformat()
            }

            self.client.table("analytics").insert(data).execute()

        except Exception as e:
            logger.error(f"Failed to track event: {str(e)}")

    async def get_analytics_summary(self, days: int = 30) -> Dict:
        """Get analytics summary"""
        if not self._check_client():
            return {}

        try:
            start_date = (datetime.utcnow() - timedelta(days=days)).isoformat()

            # Get counts by type
            response = self.client.table("analytics").select("event_type").gte(
                "timestamp", start_date
            ).execute()

            events = response.data if response.data else []

            summary = {
                "total_events": len(events),
                "calls_initiated": 0,
                "calls_completed": 0,
                "messages_received": 0,
                "consultations_started": 0,
                "consultations_completed": 0,
                "by_platform": {}
            }

            for event in events:
                event_type = event.get("event_type")
                if event_type == "call_initiated":
                    summary["calls_initiated"] += 1
                elif event_type == "call_completed":
                    summary["calls_completed"] += 1
                elif event_type == "message_received":
                    summary["messages_received"] += 1
                elif event_type == "consultation_started":
                    summary["consultations_started"] += 1
                elif event_type == "consultation_completed":
                    summary["consultations_completed"] += 1

            return summary

        except Exception as e:
            logger.error(f"Failed to get analytics: {str(e)}")
            return {}

    # ===========================================
    # REAL-TIME SUBSCRIPTIONS
    # ===========================================

    def subscribe_to_calls(self, callback) -> None:
        """Subscribe to real-time call updates"""
        if not self._check_client():
            return

        try:
            channel = self.client.channel("call_updates")
            channel.on_postgres_changes(
                event="*",
                schema="public",
                table="call_sessions",
                callback=callback
            )
            channel.subscribe()
            logger.info("Subscribed to call updates")

        except Exception as e:
            logger.error(f"Failed to subscribe to calls: {str(e)}")

    def subscribe_to_messages(self, session_id: str, callback) -> None:
        """Subscribe to real-time messages for a session"""
        if not self._check_client():
            return

        try:
            channel = self.client.channel(f"messages_{session_id}")
            channel.on_postgres_changes(
                event="INSERT",
                schema="public",
                table="messages",
                filter=f"session_id=eq.{session_id}",
                callback=callback
            )
            channel.subscribe()
            logger.info(f"Subscribed to messages for session: {session_id}")

        except Exception as e:
            logger.error(f"Failed to subscribe to messages: {str(e)}")


# Global instance
supabase = SupabaseBackend()

# Backwards compatibility alias
supabase_mcp = supabase
SupabaseMCP = SupabaseBackend
