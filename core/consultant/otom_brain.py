"""
Otom Brain - Core AI Consultant Logic
Handles business analysis, strategy generation, and consulting workflows
"""

import os
import json
import asyncio
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
import uuid

# LangChain imports - handle both old and new API
try:
    from langchain.memory import ConversationBufferWindowMemory
except ImportError:
    from langchain_community.chat_message_histories import ChatMessageHistory
    # Fallback: we'll implement simple memory ourselves
    ConversationBufferWindowMemory = None

try:
    from langchain.chains import ConversationChain
except ImportError:
    ConversationChain = None

try:
    from langchain.prompts import PromptTemplate
except ImportError:
    from langchain_core.prompts import PromptTemplate
from openai import AsyncOpenAI
import anthropic

from core.frameworks.framework_engine import FrameworkEngine
from core.research.market_researcher import MarketResearcher
from core.deliverables.report_generator import ReportGenerator
from core.workflow.workflow_mapper import WorkflowMapper
from core.workflow.questionnaire_engine import QuestionnaireEngine
from utils.logger import setup_logger

logger = setup_logger("otom_brain")

class OtomConsultant:
    """Main Otom AI Consultant Brain"""

    def __init__(self):
        """Initialize Otom with all necessary components"""
        # Initialize AI clients - handle missing API keys gracefully
        openai_key = os.getenv("OPENAI_API_KEY")
        anthropic_key = os.getenv("ANTHROPIC_API_KEY")

        if openai_key:
            self.openai_client = AsyncOpenAI(api_key=openai_key)
        else:
            logger.warning("OPENAI_API_KEY not set - OpenAI features will be unavailable")
            self.openai_client = None

        if anthropic_key:
            self.anthropic_client = anthropic.AsyncAnthropic(api_key=anthropic_key)
        else:
            logger.warning("ANTHROPIC_API_KEY not set - Anthropic features will be unavailable")
            self.anthropic_client = None

        # Initialize components
        self.framework_engine = FrameworkEngine()
        self.researcher = MarketResearcher()
        self.report_generator = ReportGenerator()
        self.workflow_mapper = WorkflowMapper()
        self.questionnaire_engine = QuestionnaireEngine()

        # Session management
        self.active_sessions = {}

        # Conversation memory (2-minute context window like Sesame)
        if ConversationBufferWindowMemory:
            self.memory = ConversationBufferWindowMemory(
                k=10,  # Keep last 10 exchanges
                return_messages=True
            )
        else:
            # Fallback: use simple in-memory conversation history
            self.memory = None
            self._conversation_history = []
            logger.warning("LangChain memory not available - using simple memory")

        # Otom's personality and expertise
        self.consultant_prompt = PromptTemplate(
            input_variables=["history", "input"],
            template="""You are Otom, an elite AI business consultant with expertise from McKinsey, BCG, and Bain methodologies.
            You speak with confidence, clarity, and strategic insight. You're direct but empathetic, always focused on delivering value.

            Your approach:
            1. Listen actively and ask clarifying questions
            2. Apply relevant frameworks (SWOT, Porter's Five Forces, BCG Matrix, etc.)
            3. Provide data-driven recommendations
            4. Create actionable implementation plans
            5. Focus on measurable outcomes

            Previous conversation:
            {history}

            Client: {input}

            Otom's strategic response:"""
        )

    async def start_consultation(self, session_id: str, client_info: Dict[str, Any]) -> Dict[str, Any]:
        """Start a new consultation session"""
        try:
            # Create new session
            session = {
                "id": session_id,
                "client_info": client_info,
                "started_at": datetime.utcnow().isoformat(),
                "status": "discovery",
                "context": {},
                "recommendations": [],
                "deliverables": []
            }

            self.active_sessions[session_id] = session

            # Generate personalized greeting
            greeting = await self._generate_greeting(client_info)

            logger.info(f"Started consultation session: {session_id}")
            return {
                "session_id": session_id,
                "greeting": greeting,
                "next_steps": "discovery_questions"
            }

        except Exception as e:
            logger.error(f"Failed to start consultation: {str(e)}")
            raise

    async def process_consultation_input(self, session_id: str, input_text: str) -> Dict[str, Any]:
        """Process client input during consultation"""
        try:
            session = self.active_sessions.get(session_id)
            if not session:
                raise ValueError(f"Session {session_id} not found")

            # Determine consultation phase
            phase = session["status"]

            if phase == "discovery":
                response = await self._handle_discovery(session, input_text)
            elif phase == "analysis":
                response = await self._handle_analysis(session, input_text)
            elif phase == "strategy":
                response = await self._handle_strategy(session, input_text)
            elif phase == "implementation":
                response = await self._handle_implementation(session, input_text)
            else:
                response = await self._handle_general_consultation(session, input_text)

            # Update session context
            session["last_interaction"] = datetime.utcnow().isoformat()

            return response

        except Exception as e:
            logger.error(f"Failed to process input: {str(e)}")
            raise

    async def _handle_discovery(self, session: Dict, input_text: str) -> Dict[str, Any]:
        """Handle discovery phase of consultation"""
        # Extract key information using GPT-4
        discovery_prompt = f"""
        Analyze this client input during discovery phase and extract:
        1. Business context and industry
        2. Main challenges/pain points
        3. Goals and objectives
        4. Current metrics/KPIs
        5. Timeline and urgency

        Client input: {input_text}

        Return as JSON.
        """

        response = await self.openai_client.chat.completions.create(
            model="gpt-4-turbo-preview",
            messages=[{"role": "system", "content": discovery_prompt}],
            response_format={"type": "json_object"},
            temperature=0.3
        )

        discovery_data = json.loads(response.choices[0].message.content)

        # Update session context
        session["context"].update(discovery_data)

        # Generate follow-up questions
        follow_up = await self._generate_discovery_questions(discovery_data)

        # Check if we have enough info to move to analysis
        if self._is_discovery_complete(session["context"]):
            session["status"] = "analysis"
            return {
                "response": "Excellent! I have a clear understanding of your business situation. Let me analyze this information and identify strategic opportunities.",
                "phase": "analysis",
                "next_action": "performing_analysis"
            }

        return {
            "response": follow_up,
            "phase": "discovery",
            "questions_remaining": 3 - len(session["context"].get("answered_questions", []))
        }

    async def _handle_analysis(self, session: Dict, input_text: str) -> Dict[str, Any]:
        """Perform business analysis"""
        context = session["context"]

        # Run parallel analysis tasks
        tasks = [
            self.researcher.analyze_market(context),
            self.researcher.analyze_competitors(context),
            self.framework_engine.apply_swot(context),
            self.framework_engine.apply_porters_five_forces(context)
        ]

        results = await asyncio.gather(*tasks)

        # Synthesize insights
        analysis = {
            "market_analysis": results[0],
            "competitive_analysis": results[1],
            "swot": results[2],
            "porters_five_forces": results[3],
            "key_insights": await self._synthesize_insights(results)
        }

        session["analysis"] = analysis
        session["status"] = "strategy"

        return {
            "response": self._format_analysis_summary(analysis),
            "phase": "strategy",
            "deliverable": "analysis_report"
        }

    async def _handle_strategy(self, session: Dict, input_text: str) -> Dict[str, Any]:
        """Develop strategic recommendations"""
        context = session["context"]
        analysis = session["analysis"]

        # Generate strategic recommendations using Claude
        strategy_prompt = f"""
        Based on this business analysis, develop 3-5 strategic recommendations:

        Context: {json.dumps(context, indent=2)}
        Analysis: {json.dumps(analysis, indent=2)}

        For each recommendation provide:
        1. Strategic initiative name
        2. Rationale and expected impact
        3. Implementation timeline
        4. Success metrics
        5. Resource requirements
        6. Risk mitigation

        Focus on actionable, high-impact strategies.
        """

        response = await self.anthropic_client.messages.create(
            model="claude-3-opus-20240229",
            messages=[{"role": "user", "content": strategy_prompt}],
            max_tokens=2000
        )

        strategies = self._parse_strategies(response.content[0].text)
        session["recommendations"] = strategies
        session["status"] = "implementation"

        return {
            "response": self._format_strategy_presentation(strategies),
            "phase": "implementation",
            "deliverable": "strategy_deck"
        }

    async def _handle_implementation(self, session: Dict, input_text: str) -> Dict[str, Any]:
        """Create implementation roadmap"""
        recommendations = session["recommendations"]

        # Generate detailed implementation plan
        implementation_plan = await self._create_implementation_roadmap(recommendations)

        # Create final deliverables
        deliverables = await self._generate_deliverables(session)

        session["implementation_plan"] = implementation_plan
        session["deliverables"] = deliverables
        session["status"] = "completed"

        return {
            "response": "I've completed your comprehensive business consultation. You'll receive all deliverables via email shortly.",
            "phase": "completed",
            "deliverables": deliverables,
            "implementation_plan": implementation_plan
        }

    async def _generate_greeting(self, client_info: Dict) -> str:
        """Generate personalized greeting for client"""
        name = client_info.get("name", "there")
        return f"""Hello {name}! I'm Otom, your AI business consultant.

        I specialize in helping businesses like yours develop strategic solutions and drive growth.
        In our consultation today, I'll help you:

        1. Understand your current business challenges
        2. Analyze market opportunities
        3. Develop actionable strategies
        4. Create an implementation roadmap

        Let's start by discussing your business. What's the main challenge you're facing right now?"""

    async def _generate_discovery_questions(self, context: Dict) -> str:
        """Generate contextual discovery questions"""
        questions = [
            "What's your current monthly revenue and growth rate?",
            "Who are your main competitors and how do you differentiate?",
            "What's your customer acquisition cost and lifetime value?",
            "What resources (team, budget, time) do you have available?",
            "What would success look like for you in 6 months?"
        ]

        # Pick most relevant question based on context
        if not context.get("revenue"):
            return questions[0]
        elif not context.get("competitors"):
            return questions[1]
        elif not context.get("metrics"):
            return questions[2]
        else:
            return questions[3]

    def _is_discovery_complete(self, context: Dict) -> bool:
        """Check if we have enough information to proceed"""
        required_fields = ["industry", "challenges", "goals", "resources"]
        return all(field in context for field in required_fields)

    async def _synthesize_insights(self, analysis_results: List) -> List[str]:
        """Synthesize key insights from analysis"""
        # Use AI to identify patterns and key insights
        insights = []
        for result in analysis_results:
            if result and "insights" in result:
                insights.extend(result["insights"])
        return insights[:5]  # Top 5 insights

    def _format_analysis_summary(self, analysis: Dict) -> str:
        """Format analysis results for presentation"""
        summary = "Based on my analysis, here are the key findings:\n\n"

        if analysis.get("swot"):
            summary += "**SWOT Analysis:**\n"
            summary += f"- Strengths: {', '.join(analysis['swot'].get('strengths', [])[:2])}\n"
            summary += f"- Opportunities: {', '.join(analysis['swot'].get('opportunities', [])[:2])}\n\n"

        if analysis.get("key_insights"):
            summary += "**Key Insights:**\n"
            for insight in analysis["key_insights"][:3]:
                summary += f"- {insight}\n"

        summary += "\nNow let's develop strategic recommendations based on these findings."
        return summary

    def _format_strategy_presentation(self, strategies: List[Dict]) -> str:
        """Format strategic recommendations"""
        presentation = "Here are my strategic recommendations for your business:\n\n"

        for i, strategy in enumerate(strategies[:3], 1):
            presentation += f"**Strategy {i}: {strategy['name']}**\n"
            presentation += f"Impact: {strategy['impact']}\n"
            presentation += f"Timeline: {strategy['timeline']}\n"
            presentation += f"Investment: {strategy['resources']}\n\n"

        presentation += "Would you like me to create a detailed implementation plan for these strategies?"
        return presentation

    def _parse_strategies(self, strategy_text: str) -> List[Dict]:
        """Parse strategy recommendations from AI response"""
        # Parse and structure the strategy text
        strategies = []
        # Implementation would parse the actual response
        return strategies

    async def _create_implementation_roadmap(self, recommendations: List[Dict]) -> Dict:
        """Create detailed implementation roadmap"""
        roadmap = {
            "phases": [],
            "milestones": [],
            "dependencies": [],
            "risk_mitigation": []
        }

        # Generate implementation details for each recommendation
        for rec in recommendations:
            phase = {
                "name": rec["name"],
                "duration": rec.get("timeline", "3 months"),
                "tasks": [],
                "success_metrics": rec.get("metrics", [])
            }
            roadmap["phases"].append(phase)

        return roadmap

    async def _generate_deliverables(self, session: Dict) -> List[Dict]:
        """Generate final deliverables"""
        deliverables = []

        # Generate strategy deck
        deck = await self.report_generator.create_strategy_deck(session)
        deliverables.append({
            "type": "strategy_deck",
            "format": "pdf",
            "url": deck["url"]
        })

        # Generate executive summary
        summary = await self.report_generator.create_executive_summary(session)
        deliverables.append({
            "type": "executive_summary",
            "format": "pdf",
            "url": summary["url"]
        })

        return deliverables

    async def schedule_consultation(self, email: str, preferred_time: str) -> Dict:
        """Schedule a consultation for later"""
        booking_id = str(uuid.uuid4())
        booking = {
            "id": booking_id,
            "email": email,
            "time": preferred_time,
            "status": "scheduled"
        }

        # In production, this would integrate with calendar system
        logger.info(f"Scheduled consultation {booking_id} for {email} at {preferred_time}")

        return booking

    async def initiate_workflow_mapping(self, company_id: str, employee_count: int) -> Dict:
        """
        Initiate company-wide workflow mapping through employee questionnaires
        """
        try:
            mapping_session = {
                "id": str(uuid.uuid4()),
                "company_id": company_id,
                "employee_count": employee_count,
                "status": "initiated",
                "questionnaires_sent": 0,
                "questionnaires_completed": 0,
                "started_at": datetime.utcnow().isoformat()
            }

            # Generate personalized questionnaires for employees
            questionnaires = []
            for i in range(employee_count):
                employee_data = {"id": f"emp_{i+1}", "company_id": company_id}
                questionnaire = await self.questionnaire_engine.generate_personalized_questionnaire(employee_data)
                questionnaires.append(questionnaire)

            mapping_session["questionnaires"] = questionnaires
            mapping_session["questionnaires_sent"] = len(questionnaires)

            logger.info(f"Initiated workflow mapping for company {company_id} with {employee_count} employees")
            return mapping_session

        except Exception as e:
            logger.error(f"Failed to initiate workflow mapping: {str(e)}")
            raise

    async def process_workflow_questionnaire(self, questionnaire_id: str, responses: Dict) -> Dict:
        """
        Process completed workflow questionnaire from an employee
        """
        try:
            # Process the questionnaire response
            processed_data = await self.questionnaire_engine.process_response(questionnaire_id, responses)

            # Extract workflow data
            employee_workflows = await self.workflow_mapper.collect_employee_data(
                processed_data.get("employee_id"),
                processed_data
            )

            return {
                "status": "processed",
                "questionnaire_id": questionnaire_id,
                "workflows_identified": len(employee_workflows.get("workflows", [])),
                "pain_points_identified": len(employee_workflows.get("pain_points", [])),
                "next_steps": "Awaiting all responses for complete analysis"
            }

        except Exception as e:
            logger.error(f"Failed to process workflow questionnaire: {str(e)}")
            raise

    async def analyze_company_workflows(self, company_id: str, all_responses: List[Dict]) -> Dict:
        """
        Analyze all collected workflow data and generate insights
        """
        try:
            # Map company workflows from all responses
            workflow_map = await self.workflow_mapper.map_company_workflows(all_responses)

            # Identify bottlenecks
            bottlenecks = await self.workflow_mapper.identify_bottlenecks()

            # Detect redundancies
            redundancies = await self.workflow_mapper.detect_redundancies()

            # Generate visualizations
            visualizations = await self.workflow_mapper.generate_visualizations()

            # Generate insights
            insights = await self.workflow_mapper.generate_insights()

            # Schedule monthly updates
            update_schedule = await self.workflow_mapper.schedule_monthly_updates(company_id)

            # Create comprehensive report
            workflow_analysis = {
                "company_id": company_id,
                "analysis_date": datetime.utcnow().isoformat(),
                "employees_surveyed": len(all_responses),
                "workflows_mapped": workflow_map,
                "bottlenecks": bottlenecks,
                "redundancies": redundancies,
                "visualizations": visualizations,
                "insights": insights,
                "update_schedule": update_schedule,
                "recommendations": await self._generate_workflow_recommendations(bottlenecks, redundancies, insights)
            }

            logger.info(f"Completed workflow analysis for company {company_id}")
            return workflow_analysis

        except Exception as e:
            logger.error(f"Failed to analyze company workflows: {str(e)}")
            raise

    async def _generate_workflow_recommendations(self, bottlenecks: List, redundancies: List, insights: Dict) -> List[Dict]:
        """
        Generate actionable recommendations from workflow analysis
        """
        recommendations = []

        # Bottleneck recommendations
        if bottlenecks:
            total_savings = sum(b.estimated_savings_hours for b in bottlenecks[:5])
            recommendations.append({
                "priority": "HIGH",
                "category": "Bottleneck Elimination",
                "action": f"Address top 5 bottlenecks",
                "impact": f"Save {total_savings:.0f} hours/week",
                "timeline": "1-2 months",
                "specific_actions": [b.recommendation for b in bottlenecks[:3]]
            })

        # Redundancy recommendations
        if redundancies:
            recommendations.append({
                "priority": "MEDIUM",
                "category": "Process Consolidation",
                "action": "Eliminate redundant workflows",
                "impact": f"Reduce {len(redundancies)} duplicate processes",
                "timeline": "2-3 months",
                "specific_actions": [r["recommendation"] for r in redundancies[:3]]
            })

        # Automation recommendations
        if insights.get("executive_summary", {}).get("automation_opportunities", 0) > 0:
            recommendations.append({
                "priority": "HIGH",
                "category": "Process Automation",
                "action": "Automate high-potential workflows",
                "impact": f"{insights['executive_summary']['automation_opportunities']} processes ready for automation",
                "timeline": "3-4 months",
                "specific_actions": ["Implement RPA for repetitive tasks", "Deploy workflow automation platform"]
            })

        # Quick wins
        if insights.get("quick_wins"):
            recommendations.append({
                "priority": "HIGH",
                "category": "Quick Wins",
                "action": "Implement immediate improvements",
                "impact": "Visible results in 2 weeks",
                "timeline": "1-2 weeks",
                "specific_actions": [qw["action"] for qw in insights["quick_wins"][:3]]
            })

        return recommendations

    async def get_workflow_update(self, company_id: str) -> Dict:
        """
        Get monthly workflow update comparing to previous analysis
        """
        try:
            # Get latest workflow data
            current_workflows = self.workflow_mapper.workflows
            last_update = self.workflow_mapper.last_update

            if not current_workflows:
                return {"status": "No workflow data available"}

            # Calculate improvements since last update
            improvements = {
                "bottlenecks_resolved": 0,
                "time_saved_hours": 0,
                "processes_automated": 0,
                "efficiency_gain_percentage": 0
            }

            # Compare with previous analysis if available
            if last_update:
                time_since_update = datetime.utcnow() - datetime.fromisoformat(last_update)
                improvements["days_since_update"] = time_since_update.days

            return {
                "company_id": company_id,
                "update_date": datetime.utcnow().isoformat(),
                "improvements": improvements,
                "current_bottlenecks": len(self.workflow_mapper.bottlenecks),
                "next_update_scheduled": self.workflow_mapper.update_schedule.get("next_update")
            }

        except Exception as e:
            logger.error(f"Failed to get workflow update: {str(e)}")
            raise

    async def get_session_status(self, session_id: str) -> Dict:
        """Get current status of a consultation session"""
        session = self.active_sessions.get(session_id)
        if not session:
            raise ValueError(f"Session {session_id} not found")

        return {
            "session_id": session_id,
            "status": session["status"],
            "duration": self._calculate_duration(session["started_at"]),
            "progress": self._calculate_progress(session["status"])
        }

    def _calculate_duration(self, start_time: str) -> int:
        """Calculate session duration in minutes"""
        start = datetime.fromisoformat(start_time)
        duration = datetime.utcnow() - start
        return int(duration.total_seconds() / 60)

    def _calculate_progress(self, status: str) -> int:
        """Calculate consultation progress percentage"""
        progress_map = {
            "discovery": 25,
            "analysis": 50,
            "strategy": 75,
            "implementation": 90,
            "completed": 100
        }
        return progress_map.get(status, 0)