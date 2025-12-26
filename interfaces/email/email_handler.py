"""
Email Interface for Otom
Handles asynchronous email-based consultations
"""

import os
import json
import asyncio
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
import uuid
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.application import MIMEApplication
import aiosmtplib
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail, Attachment, FileContent, FileName, FileType, Disposition
import base64

from utils.logger import setup_logger
from utils.nlp_parser import NLPParser

try:
    from core.tasks.email_tasks import process_email_consultation
    CELERY_ENABLED = True
except ImportError:
    CELERY_ENABLED = False

logger = setup_logger("email_handler")

class EmailInterface:
    """Handles email-based interactions with Otom"""

    def __init__(self, otom_consultant):
        """Initialize email interface"""
        self.otom = otom_consultant

        # Email configuration
        self.sendgrid_api_key = os.getenv("SENDGRID_API_KEY")
        self.from_email = os.getenv("FROM_EMAIL", "otom@consultant.ai")
        self.smtp_host = os.getenv("SMTP_HOST")
        self.smtp_port = int(os.getenv("SMTP_PORT", 587))
        self.smtp_user = os.getenv("SMTP_USER")
        self.smtp_password = os.getenv("SMTP_PASSWORD")

        # Email templates
        self.templates = self._load_email_templates()

        # Active email conversations
        self.email_sessions = {}

        # Initialize NLP parser for email analysis
        self.nlp_parser = NLPParser()

    def _load_email_templates(self) -> Dict:
        """Load email templates"""
        return {
            "welcome": {
                "subject": "Welcome to Otom AI Consulting",
                "template": """
                <h2>Welcome to Otom AI Consulting!</h2>
                <p>Thank you for reaching out. I'm Otom, your AI business consultant.</p>
                <p>I specialize in:</p>
                <ul>
                    <li>Strategic business analysis</li>
                    <li>Workflow optimization</li>
                    <li>Market research and competitive analysis</li>
                    <li>Implementation roadmaps</li>
                </ul>
                <p>To get started, please reply with:</p>
                <ol>
                    <li>Your company name and industry</li>
                    <li>Your main business challenge</li>
                    <li>Your timeline and budget</li>
                </ol>
                <p>I'll analyze your situation and provide recommendations within 48 hours.</p>
                <p>Best regards,<br>Otom</p>
                """
            },
            "consultation_complete": {
                "subject": "Your Otom Consultation Report is Ready",
                "template": """
                <h2>Consultation Complete!</h2>
                <p>Dear {client_name},</p>
                <p>I've completed my analysis of {company_name} and identified significant opportunities for improvement.</p>
                <h3>Key Findings:</h3>
                {key_findings}
                <h3>Top Recommendations:</h3>
                {recommendations}
                <h3>Potential Impact:</h3>
                {impact}
                <p>Please find attached:</p>
                <ul>
                    <li>Executive Summary (2 pages)</li>
                    <li>Strategic Analysis Deck (25 slides)</li>
                    <li>Implementation Roadmap</li>
                </ul>
                <p>I'm available 24/7 to discuss these recommendations. Simply reply to this email or <a href="{booking_link}">schedule a call</a>.</p>
                <p>Your success is my mission!</p>
                <p>Best regards,<br>Otom</p>
                """
            },
            "workflow_questionnaire": {
                "subject": "Quick Workflow Survey - {company_name}",
                "template": """
                <h2>Help Us Optimize Your Workflows</h2>
                <p>Dear {employee_name},</p>
                <p>We're conducting a workflow analysis to improve efficiency at {company_name}.</p>
                <p>Your insights are crucial! Please take 20 minutes to complete this survey:</p>
                <p><a href="{survey_link}" style="background: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Start Survey</a></p>
                <p>The survey covers:</p>
                <ul>
                    <li>Your daily activities and time allocation</li>
                    <li>Tools and systems you use</li>
                    <li>Collaboration patterns</li>
                    <li>Pain points and bottlenecks</li>
                    <li>Improvement suggestions</li>
                </ul>
                <p>All responses are confidential and will be used solely to improve workflows.</p>
                <p>Deadline: {deadline}</p>
                <p>Thank you for your participation!</p>
                <p>Best regards,<br>Otom AI Consultant</p>
                """
            },
            "follow_up": {
                "subject": "Follow-Up: {subject}",
                "template": """
                <h2>Following Up</h2>
                <p>Dear {client_name},</p>
                <p>{follow_up_content}</p>
                <p>Best regards,<br>Otom</p>
                """
            }
        }

    async def send_email(self, to_email: str, subject: str, content: str,
                        attachments: List[Dict] = None, template: str = None) -> bool:
        """Send email using configured provider"""
        try:
            if self.sendgrid_api_key:
                return await self._send_via_sendgrid(to_email, subject, content, attachments)
            elif self.smtp_host:
                return await self._send_via_smtp(to_email, subject, content, attachments)
            else:
                logger.error("No email provider configured")
                return False

        except Exception as e:
            logger.error(f"Failed to send email: {str(e)}")
            return False

    async def _send_via_sendgrid(self, to_email: str, subject: str,
                                 content: str, attachments: List[Dict] = None) -> bool:
        """Send email via SendGrid"""
        try:
            message = Mail(
                from_email=self.from_email,
                to_emails=to_email,
                subject=subject,
                html_content=content
            )

            # Add attachments if provided
            if attachments:
                for attachment_data in attachments:
                    attachment = Attachment(
                        FileContent(attachment_data['content']),
                        FileName(attachment_data['filename']),
                        FileType(attachment_data['type']),
                        Disposition('attachment')
                    )
                    message.add_attachment(attachment)

            sg = SendGridAPIClient(self.sendgrid_api_key)
            response = sg.send(message)

            logger.info(f"Email sent to {to_email} via SendGrid: {response.status_code}")
            return response.status_code in [200, 201, 202]

        except Exception as e:
            logger.error(f"SendGrid error: {str(e)}")
            return False

    async def _send_via_smtp(self, to_email: str, subject: str,
                             content: str, attachments: List[Dict] = None) -> bool:
        """Send email via SMTP"""
        try:
            msg = MIMEMultipart('alternative')
            msg['Subject'] = subject
            msg['From'] = self.from_email
            msg['To'] = to_email

            # Add HTML content
            html_part = MIMEText(content, 'html')
            msg.attach(html_part)

            # Add attachments
            if attachments:
                for attachment_data in attachments:
                    attachment = MIMEApplication(
                        base64.b64decode(attachment_data['content']),
                        Name=attachment_data['filename']
                    )
                    attachment['Content-Disposition'] = f'attachment; filename="{attachment_data["filename"]}"'
                    msg.attach(attachment)

            # Send email
            async with aiosmtplib.SMTP(
                hostname=self.smtp_host,
                port=self.smtp_port,
                use_tls=True
            ) as smtp:
                await smtp.login(self.smtp_user, self.smtp_password)
                await smtp.send_message(msg)

            logger.info(f"Email sent to {to_email} via SMTP")
            return True

        except Exception as e:
            logger.error(f"SMTP error: {str(e)}")
            return False

    async def send_welcome_email(self, to_email: str, client_name: str = None) -> bool:
        """Send welcome email to new client"""
        template = self.templates["welcome"]
        content = template["template"].format(
            client_name=client_name or "Valued Client"
        )

        return await self.send_email(
            to_email,
            template["subject"],
            content
        )

    async def send_consultation_report(self, to_email: str, session: Dict,
                                      attachments: List[Dict]) -> bool:
        """Send consultation report with attachments"""
        try:
            template = self.templates["consultation_complete"]

            # Format key findings
            key_findings = "<ul>"
            if session.get("analysis", {}).get("key_insights"):
                for insight in session["analysis"]["key_insights"][:3]:
                    key_findings += f"<li>{insight}</li>"
            key_findings += "</ul>"

            # Format recommendations
            recommendations = "<ol>"
            if session.get("recommendations"):
                for rec in session["recommendations"][:3]:
                    recommendations += f"<li><strong>{rec.get('name', 'Initiative')}</strong>: {rec.get('impact', 'High impact')}</li>"
            recommendations += "</ol>"

            # Format impact
            impact = """
            <ul>
                <li>Cost Savings: $250K-500K annually</li>
                <li>Revenue Growth: 20-30% increase</li>
                <li>ROI Timeline: 6-9 months</li>
            </ul>
            """

            content = template["template"].format(
                client_name=session.get("context", {}).get("contact_name", "Valued Client"),
                company_name=session.get("context", {}).get("company", "Your Company"),
                key_findings=key_findings,
                recommendations=recommendations,
                impact=impact,
                booking_link=f"https://calendly.com/otom-ai/follow-up"
            )

            return await self.send_email(
                to_email,
                template["subject"],
                content,
                attachments
            )

        except Exception as e:
            logger.error(f"Failed to send consultation report: {str(e)}")
            return False

    async def send_workflow_questionnaire(self, to_email: str, employee_name: str,
                                         company_name: str, survey_link: str) -> bool:
        """Send workflow questionnaire to employee"""
        template = self.templates["workflow_questionnaire"]
        deadline = (datetime.now() + timedelta(days=7)).strftime("%B %d, %Y")

        content = template["template"].format(
            employee_name=employee_name,
            company_name=company_name,
            survey_link=survey_link,
            deadline=deadline
        )

        return await self.send_email(
            to_email,
            template["subject"].format(company_name=company_name),
            content
        )

    async def process_email_consultation(self, from_email: str, subject: str,
                                        body: str, attachments: List = None) -> Dict:
        """Process an email consultation request"""
        try:
            # Create or get session
            session_id = self.email_sessions.get(from_email, str(uuid.uuid4()))
            self.email_sessions[from_email] = session_id

            # Extract context from email
            context = await self._extract_email_context(body)

            # Start consultation
            consultation = await self.otom.start_consultation(session_id, {
                "email": from_email,
                "initial_message": body,
                "subject": subject,
                **context
            })

            # Process through discovery
            response = await self.otom.process_consultation_input(session_id, body)

            # Schedule full analysis
            await self._schedule_email_analysis(session_id, from_email)

            return {
                "status": "processing",
                "session_id": session_id,
                "estimated_completion": "48 hours",
                "next_action": "email_response"
            }

        except Exception as e:
            logger.error(f"Failed to process email consultation: {str(e)}")
            return {"status": "error", "message": str(e)}

    async def _extract_email_context(self, email_body: str) -> Dict:
        """Extract context from email body using NLP"""
        # Use NLP parser for sophisticated extraction
        parsed_result = self.nlp_parser.parse_consultation_request(email_body)
        context = parsed_result.get("context", {})

        # Add additional parsed information
        if parsed_result.get("urgency"):
            context["urgency"] = parsed_result["urgency"]
        if parsed_result.get("service_type"):
            context["service_type"] = parsed_result["service_type"]
        if parsed_result.get("estimated_scope"):
            context["scope"] = parsed_result["estimated_scope"]

        # Ensure we have all key fields
        context.setdefault("company", "Unknown")
        context.setdefault("industry", "General")

        logger.info(f"Extracted context from email: {context}")
        return context

    async def _schedule_email_analysis(self, session_id: str, email: str):
        """Schedule background analysis for email consultation"""
        # In production, would use Celery or similar task queue
        asyncio.create_task(self._run_email_analysis(session_id, email))

    async def _run_email_analysis(self, session_id: str, email: str):
        """Run full analysis in background and email results"""
        try:
            await asyncio.sleep(2)  # Simulate processing time

            # Get session
            session = self.otom.active_sessions.get(session_id)
            if not session:
                return

            # Run analysis phases
            session["status"] = "analysis"
            analysis_result = await self.otom._handle_analysis(session, "")

            session["status"] = "strategy"
            strategy_result = await self.otom._handle_strategy(session, "")

            # Generate deliverables
            deliverables = []

            # Generate strategy deck
            deck = await self.otom.report_generator.create_strategy_deck(session)
            if deck["status"] == "success":
                with open(deck["filepath"], 'rb') as f:
                    deliverables.append({
                        "filename": "strategy_deck.pdf",
                        "content": base64.b64encode(f.read()).decode(),
                        "type": "application/pdf"
                    })

            # Generate executive summary
            summary = await self.otom.report_generator.create_executive_summary(session)
            if summary["status"] == "success":
                with open(summary["filepath"], 'rb') as f:
                    deliverables.append({
                        "filename": "executive_summary.pdf",
                        "content": base64.b64encode(f.read()).decode(),
                        "type": "application/pdf"
                    })

            # Send report email
            await self.send_consultation_report(email, session, deliverables)

            logger.info(f"Email consultation completed for {email}")

        except Exception as e:
            logger.error(f"Failed to complete email analysis: {str(e)}")
            # Send error notification
            await self.send_email(
                email,
                "Consultation Update",
                f"We encountered an issue processing your consultation. Our team will follow up shortly."
            )

    async def send_follow_up(self, to_email: str, subject: str, content: str) -> bool:
        """Send follow-up email"""
        template = self.templates["follow_up"]

        html_content = template["template"].format(
            client_name="Valued Client",
            follow_up_content=content
        )

        return await self.send_email(
            to_email,
            template["subject"].format(subject=subject),
            html_content
        )

    async def send_monthly_update(self, to_email: str, company_name: str,
                                 workflow_update: Dict) -> bool:
        """Send monthly workflow update email"""
        content = f"""
        <h2>Monthly Workflow Update - {company_name}</h2>
        <p>Here's your monthly workflow optimization update:</p>

        <h3>Improvements Since Last Month:</h3>
        <ul>
            <li>Bottlenecks Resolved: {workflow_update.get('improvements', {}).get('bottlenecks_resolved', 0)}</li>
            <li>Time Saved: {workflow_update.get('improvements', {}).get('time_saved_hours', 0)} hours</li>
            <li>Processes Automated: {workflow_update.get('improvements', {}).get('processes_automated', 0)}</li>
            <li>Efficiency Gain: {workflow_update.get('improvements', {}).get('efficiency_gain_percentage', 0)}%</li>
        </ul>

        <h3>Current Status:</h3>
        <ul>
            <li>Active Bottlenecks: {workflow_update.get('current_bottlenecks', 0)}</li>
            <li>Next Update: {workflow_update.get('next_update_scheduled', 'TBD')}</li>
        </ul>

        <p>Reply to this email to discuss optimizations or schedule a consultation.</p>

        <p>Best regards,<br>Otom AI Consultant</p>
        """

        return await self.send_email(
            to_email,
            f"Monthly Workflow Update - {company_name}",
            content
        )

    async def handle_email_webhook(self, webhook_data: Dict) -> Dict:
        """Handle incoming email webhooks (SendGrid Inbound Parse, etc.)"""
        try:
            from_email = webhook_data.get("from")
            subject = webhook_data.get("subject")
            body = webhook_data.get("text") or webhook_data.get("html")
            attachments = webhook_data.get("attachments", [])

            # Process the email consultation
            result = await self.process_email_consultation(
                from_email,
                subject,
                body,
                attachments
            )

            return {
                "status": "success",
                "result": result
            }

        except Exception as e:
            logger.error(f"Email webhook error: {str(e)}")
            return {"status": "error", "message": str(e)}

    async def send_followup(self, session_id: str, followup_type: str) -> bool:
        """Send follow-up email for consultation"""
        try:
            # Get consultation details from database
            session = self.otom.active_sessions.get(session_id, {})
            email = session.get("context", {}).get("email", "")

            if not email:
                logger.warning(f"No email found for session {session_id}")
                return False

            followup_content = {
                "weekly": "I wanted to check in on your progress with the strategic initiatives we discussed. How can I help?",
                "monthly": "It's been a month since our consultation. I'd love to hear about your implementation progress.",
                "quarterly": "Quarterly check-in: How are the strategic changes impacting your business?"
            }

            content = followup_content.get(followup_type, "Following up on our recent consultation.")

            return await self.send_follow_up(
                email,
                f"Otom AI - {followup_type.capitalize()} Check-in",
                content
            )

        except Exception as e:
            logger.error(f"Failed to send follow-up: {str(e)}")
            return False