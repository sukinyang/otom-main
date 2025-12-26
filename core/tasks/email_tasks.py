"""
Email-related Celery tasks
"""

from typing import Dict, Any
import asyncio
from celery import shared_task
from utils.logger import setup_logger

logger = setup_logger("email_tasks")


@shared_task(name='otom.tasks.email.process_consultation')
def process_email_consultation(session_id: str, email_data: Dict[str, Any]) -> Dict:
    """
    Process email consultation in background
    """
    try:
        from interfaces.email.email_handler import EmailInterface
        from core.consultant.otom_brain import OtomConsultant

        # Create async event loop for task
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)

        # Initialize consultant and email handler
        consultant = OtomConsultant()
        email_handler = EmailInterface(consultant)

        # Process email
        result = loop.run_until_complete(
            email_handler._process_email_consultation(session_id, email_data)
        )

        loop.close()

        logger.info(f"Completed email consultation {session_id}")
        return result

    except Exception as e:
        logger.error(f"Failed to process email consultation: {str(e)}")
        return {"error": str(e)}


@shared_task(name='otom.tasks.email.generate_report')
def generate_email_report(session_id: str, report_type: str) -> str:
    """
    Generate report for email consultation
    """
    try:
        from core.deliverables.report_generator import ReportGenerator

        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)

        generator = ReportGenerator()

        # Generate report based on session data
        report_path = loop.run_until_complete(
            generator.generate_consultation_report(session_id, report_type)
        )

        loop.close()

        logger.info(f"Generated {report_type} report for session {session_id}")
        return report_path

    except Exception as e:
        logger.error(f"Failed to generate report: {str(e)}")
        return ""


@shared_task(name='otom.tasks.email.process_pending_emails')
def process_pending_emails():
    """
    Process any pending email consultations (periodic task)
    """
    try:
        from integrations.supabase_mcp import SupabaseMCP

        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)

        mcp = SupabaseMCP()

        # Get pending emails from database
        pending = loop.run_until_complete(
            mcp.query_data(
                "consultations",
                filters={"status": "pending", "channel": "email"}
            )
        )

        processed = 0
        for consultation in pending.get("data", []):
            process_email_consultation.delay(
                consultation["session_id"],
                consultation["email_data"]
            )
            processed += 1

        loop.close()

        logger.info(f"Queued {processed} pending email consultations")
        return processed

    except Exception as e:
        logger.error(f"Failed to process pending emails: {str(e)}")
        return 0


@shared_task(name='otom.tasks.email.send_followup')
def send_followup_email(session_id: str, followup_type: str) -> bool:
    """
    Send follow-up email for consultation
    """
    try:
        from interfaces.email.email_handler import EmailInterface
        from core.consultant.otom_brain import OtomConsultant

        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)

        consultant = OtomConsultant()
        email_handler = EmailInterface(consultant)

        success = loop.run_until_complete(
            email_handler.send_followup(session_id, followup_type)
        )

        loop.close()

        logger.info(f"Sent {followup_type} follow-up for session {session_id}")
        return success

    except Exception as e:
        logger.error(f"Failed to send follow-up: {str(e)}")
        return False