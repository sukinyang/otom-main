"""
Employee Questionnaire Engine for Otom
Collects workflow data through intelligent 20-minute surveys
"""

import json
import uuid
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
from enum import Enum

from utils.logger import setup_logger

logger = setup_logger("questionnaire_engine")

class QuestionType(Enum):
    """Types of questions in the survey"""
    MULTIPLE_CHOICE = "multiple_choice"
    TEXT = "text"
    SCALE = "scale"
    TIME_ESTIMATE = "time_estimate"
    WORKFLOW_MAPPING = "workflow_mapping"
    PRIORITY_RANKING = "priority_ranking"
    MATRIX = "matrix"

class QuestionnaireEngine:
    """
    Intelligent questionnaire system that adapts based on responses
    Designed to complete in ~20 minutes
    """

    def __init__(self):
        """Initialize questionnaire engine"""
        self.questions_db = self._load_question_bank()
        self.response_cache = {}
        self.completion_times = []

    def _load_question_bank(self) -> Dict:
        """Load the comprehensive question bank"""
        return {
            "onboarding": [
                {
                    "id": "q1",
                    "type": QuestionType.TEXT,
                    "question": "What is your role/title?",
                    "required": True,
                    "estimated_time": 15
                },
                {
                    "id": "q2",
                    "type": QuestionType.MULTIPLE_CHOICE,
                    "question": "Which department do you work in?",
                    "options": ["Sales", "Marketing", "Engineering", "Operations", "Finance", "HR", "Customer Success", "Product", "Other"],
                    "required": True,
                    "estimated_time": 10
                },
                {
                    "id": "q3",
                    "type": QuestionType.SCALE,
                    "question": "How long have you been in this role?",
                    "scale": "months",
                    "min": 0,
                    "max": 120,
                    "required": True,
                    "estimated_time": 10
                }
            ],
            "daily_workflow": [
                {
                    "id": "q4",
                    "type": QuestionType.WORKFLOW_MAPPING,
                    "question": "Map your typical daily workflow - What are your main activities throughout the day?",
                    "instruction": "List each major task/activity, its duration, and dependencies",
                    "fields": ["activity_name", "duration_hours", "frequency", "dependencies", "tools_used"],
                    "allow_multiple": True,
                    "estimated_time": 180
                },
                {
                    "id": "q5",
                    "type": QuestionType.PRIORITY_RANKING,
                    "question": "Rank your daily activities by importance to business outcomes",
                    "instruction": "Drag and drop to order from most to least critical",
                    "estimated_time": 60
                },
                {
                    "id": "q6",
                    "type": QuestionType.TIME_ESTIMATE,
                    "question": "How much time do you spend on each of these categories weekly?",
                    "categories": [
                        "Deep focused work",
                        "Meetings",
                        "Email/Communication",
                        "Administrative tasks",
                        "Waiting for others",
                        "Context switching"
                    ],
                    "unit": "hours",
                    "estimated_time": 90
                }
            ],
            "collaboration": [
                {
                    "id": "q7",
                    "type": QuestionType.MATRIX,
                    "question": "Who do you collaborate with and how often?",
                    "rows": ["Daily", "Weekly", "Monthly", "Rarely"],
                    "columns": ["Direct team", "Other departments", "External partners", "Customers", "Leadership"],
                    "estimated_time": 60
                },
                {
                    "id": "q8",
                    "type": QuestionType.TEXT,
                    "question": "Describe your most important cross-department workflow",
                    "instruction": "Include who's involved, what's exchanged, and typical timeline",
                    "max_length": 500,
                    "estimated_time": 120
                },
                {
                    "id": "q9",
                    "type": QuestionType.MULTIPLE_CHOICE,
                    "question": "What causes the most delays in your collaborative work?",
                    "options": [
                        "Waiting for approvals",
                        "Unclear requirements",
                        "Missing information",
                        "Tool/system limitations",
                        "Time zone differences",
                        "Conflicting priorities"
                    ],
                    "allow_multiple": True,
                    "estimated_time": 30
                }
            ],
            "tools_and_systems": [
                {
                    "id": "q10",
                    "type": QuestionType.TEXT,
                    "question": "List all software/tools you use daily",
                    "instruction": "Include purpose and time spent in each",
                    "allow_multiple": True,
                    "estimated_time": 90
                },
                {
                    "id": "q11",
                    "type": QuestionType.SCALE,
                    "question": "How many different systems do you need to complete a typical task?",
                    "min": 1,
                    "max": 20,
                    "estimated_time": 15
                },
                {
                    "id": "q12",
                    "type": QuestionType.MULTIPLE_CHOICE,
                    "question": "How much of your work could be automated with better tools?",
                    "options": ["0-10%", "10-25%", "25-50%", "50-75%", "75%+"],
                    "estimated_time": 20
                }
            ],
            "pain_points": [
                {
                    "id": "q13",
                    "type": QuestionType.TEXT,
                    "question": "What's your biggest workflow frustration?",
                    "instruction": "Be specific about what slows you down or causes errors",
                    "max_length": 500,
                    "estimated_time": 120
                },
                {
                    "id": "q14",
                    "type": QuestionType.WORKFLOW_MAPPING,
                    "question": "Identify workflow bottlenecks",
                    "instruction": "For each bottleneck, estimate time lost and frequency",
                    "fields": ["bottleneck_description", "time_lost_hours", "frequency", "impact", "suggested_solution"],
                    "allow_multiple": True,
                    "estimated_time": 180
                },
                {
                    "id": "q15",
                    "type": QuestionType.SCALE,
                    "question": "How many hours per week do you spend on work that feels redundant?",
                    "min": 0,
                    "max": 40,
                    "estimated_time": 15
                }
            ],
            "process_details": [
                {
                    "id": "q16",
                    "type": QuestionType.WORKFLOW_MAPPING,
                    "question": "Map your most critical business process end-to-end",
                    "instruction": "Include all steps, decision points, and handoffs",
                    "fields": ["step_name", "owner", "duration", "inputs", "outputs", "decisions", "next_step"],
                    "allow_multiple": True,
                    "estimated_time": 300
                },
                {
                    "id": "q17",
                    "type": QuestionType.MULTIPLE_CHOICE,
                    "question": "Which processes have clear documentation?",
                    "options": ["All", "Most", "Some", "Few", "None"],
                    "estimated_time": 15
                },
                {
                    "id": "q18",
                    "type": QuestionType.TEXT,
                    "question": "What informal workarounds do you use to get things done?",
                    "instruction": "Describe shortcuts or unofficial processes",
                    "estimated_time": 90
                }
            ],
            "improvement_ideas": [
                {
                    "id": "q19",
                    "type": QuestionType.TEXT,
                    "question": "If you could change one thing about your workflow, what would it be?",
                    "max_length": 500,
                    "estimated_time": 90
                },
                {
                    "id": "q20",
                    "type": QuestionType.PRIORITY_RANKING,
                    "question": "Rank these potential improvements by impact",
                    "items": [
                        "Better tools/software",
                        "Clearer processes",
                        "Fewer meetings",
                        "Faster approvals",
                        "Better communication",
                        "More automation"
                    ],
                    "estimated_time": 45
                }
            ]
        }

    async def generate_personalized_questionnaire(self, employee_data: Dict) -> Dict:
        """
        Generate a personalized questionnaire based on role and department
        Ensures completion in ~20 minutes
        """
        try:
            questionnaire = {
                "id": str(uuid.uuid4()),
                "employee_id": employee_data.get("id"),
                "created_at": datetime.now().isoformat(),
                "estimated_time_minutes": 20,
                "sections": [],
                "adaptive_rules": []
            }

            # Always include onboarding questions
            questionnaire["sections"].append({
                "name": "Getting Started",
                "questions": self.questions_db["onboarding"],
                "estimated_time": 35  # seconds
            })

            # Customize based on role
            role = employee_data.get("role", "").lower()
            department = employee_data.get("department", "").lower()

            # Role-specific question selection
            if "manager" in role or "director" in role or "vp" in role:
                # Focus on process oversight and team workflows
                questionnaire["sections"].append({
                    "name": "Team Workflows",
                    "questions": self._get_manager_questions(),
                    "estimated_time": 300
                })
            elif "engineer" in role or "developer" in role:
                # Focus on technical workflows and tools
                questionnaire["sections"].append({
                    "name": "Technical Workflows",
                    "questions": self._get_technical_questions(),
                    "estimated_time": 300
                })
            elif "sales" in role or department == "sales":
                # Focus on customer interactions and pipeline
                questionnaire["sections"].append({
                    "name": "Sales Process",
                    "questions": self._get_sales_questions(),
                    "estimated_time": 300
                })
            else:
                # Standard operational questions
                questionnaire["sections"].append({
                    "name": "Daily Operations",
                    "questions": self.questions_db["daily_workflow"],
                    "estimated_time": 330
                })

            # Add collaboration section for everyone
            questionnaire["sections"].append({
                "name": "Collaboration",
                "questions": self.questions_db["collaboration"],
                "estimated_time": 210
            })

            # Add pain points section
            questionnaire["sections"].append({
                "name": "Challenges & Opportunities",
                "questions": self.questions_db["pain_points"],
                "estimated_time": 315
            })

            # Add improvement ideas
            questionnaire["sections"].append({
                "name": "Your Ideas",
                "questions": self.questions_db["improvement_ideas"],
                "estimated_time": 135
            })

            # Calculate total time
            total_seconds = sum(section["estimated_time"] for section in questionnaire["sections"])
            questionnaire["estimated_time_minutes"] = total_seconds / 60

            # Add adaptive rules
            questionnaire["adaptive_rules"] = [
                {
                    "trigger": "high_redundancy_reported",
                    "action": "add_detailed_redundancy_questions"
                },
                {
                    "trigger": "multiple_tools_mentioned",
                    "action": "add_integration_questions"
                },
                {
                    "trigger": "approval_bottleneck",
                    "action": "add_approval_flow_questions"
                }
            ]

            logger.info(f"Generated personalized questionnaire for {employee_data.get('id')}")
            return questionnaire

        except Exception as e:
            logger.error(f"Failed to generate questionnaire: {str(e)}")
            raise

    def _get_manager_questions(self) -> List[Dict]:
        """Questions specific to managers"""
        return [
            {
                "id": "m1",
                "type": QuestionType.WORKFLOW_MAPPING,
                "question": "Map your team's key workflows and dependencies",
                "fields": ["workflow_name", "team_members", "duration", "blockers", "outputs"],
                "allow_multiple": True,
                "estimated_time": 240
            },
            {
                "id": "m2",
                "type": QuestionType.SCALE,
                "question": "What percentage of your time is spent on strategic vs operational work?",
                "min": 0,
                "max": 100,
                "estimated_time": 20
            },
            {
                "id": "m3",
                "type": QuestionType.TEXT,
                "question": "What visibility do you lack into your team's workflows?",
                "estimated_time": 90
            }
        ]

    def _get_technical_questions(self) -> List[Dict]:
        """Questions specific to technical roles"""
        return [
            {
                "id": "t1",
                "type": QuestionType.WORKFLOW_MAPPING,
                "question": "Map your development/deployment workflow",
                "fields": ["stage", "tools", "duration", "automation_level", "pain_points"],
                "allow_multiple": True,
                "estimated_time": 240
            },
            {
                "id": "t2",
                "type": QuestionType.SCALE,
                "question": "How many times per day is your deep work interrupted?",
                "min": 0,
                "max": 50,
                "estimated_time": 15
            },
            {
                "id": "t3",
                "type": QuestionType.MULTIPLE_CHOICE,
                "question": "What slows down your development velocity most?",
                "options": ["Unclear requirements", "Tech debt", "Testing", "Code reviews", "Deployments", "Meetings"],
                "allow_multiple": True,
                "estimated_time": 30
            }
        ]

    def _get_sales_questions(self) -> List[Dict]:
        """Questions specific to sales roles"""
        return [
            {
                "id": "s1",
                "type": QuestionType.WORKFLOW_MAPPING,
                "question": "Map your sales process from lead to close",
                "fields": ["stage", "activities", "duration", "conversion_rate", "blockers"],
                "allow_multiple": True,
                "estimated_time": 240
            },
            {
                "id": "s2",
                "type": QuestionType.TIME_ESTIMATE,
                "question": "How much time per week on these sales activities?",
                "categories": ["Prospecting", "Calls/Meetings", "Proposals", "CRM updates", "Follow-ups", "Admin"],
                "unit": "hours",
                "estimated_time": 60
            },
            {
                "id": "s3",
                "type": QuestionType.TEXT,
                "question": "What manual tasks in your sales process could be automated?",
                "estimated_time": 90
            }
        ]

    async def process_response(self, questionnaire_id: str, responses: Dict) -> Dict:
        """
        Process questionnaire responses and extract workflow data
        """
        try:
            processed_data = {
                "questionnaire_id": questionnaire_id,
                "processed_at": datetime.now().isoformat(),
                "department": None,
                "role": None,
                "daily_activities": [],
                "collaborations": [],
                "tools_used": [],
                "pain_points": [],
                "improvement_suggestions": [],
                "workflows": [],
                "bottlenecks": [],
                "automation_opportunities": []
            }

            # Extract basic info
            for response in responses.get("onboarding", []):
                if response["id"] == "q1":
                    processed_data["role"] = response["answer"]
                elif response["id"] == "q2":
                    processed_data["department"] = response["answer"]

            # Extract daily activities
            for response in responses.get("daily_workflow", []):
                if response["id"] == "q4":
                    for activity in response["answer"]:
                        processed_data["daily_activities"].append({
                            "name": activity["activity_name"],
                            "duration": activity["duration_hours"],
                            "frequency": activity["frequency"],
                            "dependencies": activity.get("dependencies", []),
                            "tools": activity.get("tools_used", []),
                            "department": processed_data["department"],
                            "owner": processed_data["role"]
                        })

            # Extract collaboration patterns
            for response in responses.get("collaboration", []):
                if response["id"] == "q7":
                    processed_data["collaborations"] = response["answer"]
                elif response["id"] == "q8":
                    processed_data["workflows"].append({
                        "type": "cross_department",
                        "description": response["answer"]
                    })

            # Extract tools
            for response in responses.get("tools_and_systems", []):
                if response["id"] == "q10":
                    processed_data["tools_used"] = response["answer"]
                elif response["id"] == "q12":
                    automation_percentage = response["answer"]
                    processed_data["automation_opportunities"].append({
                        "potential": automation_percentage,
                        "department": processed_data["department"]
                    })

            # Extract pain points and bottlenecks
            for response in responses.get("pain_points", []):
                if response["id"] == "q13":
                    processed_data["pain_points"].append({
                        "description": response["answer"],
                        "type": "workflow_frustration"
                    })
                elif response["id"] == "q14":
                    for bottleneck in response["answer"]:
                        processed_data["bottlenecks"].append({
                            "description": bottleneck["bottleneck_description"],
                            "time_lost_hours": bottleneck["time_lost_hours"],
                            "frequency": bottleneck["frequency"],
                            "impact": bottleneck.get("impact"),
                            "suggested_solution": bottleneck.get("suggested_solution")
                        })
                elif response["id"] == "q15":
                    processed_data["redundant_hours_weekly"] = response["answer"]

            # Extract improvement suggestions
            for response in responses.get("improvement_ideas", []):
                if response["id"] == "q19":
                    processed_data["improvement_suggestions"].append(response["answer"])

            # Cache the processed response
            self.response_cache[questionnaire_id] = processed_data

            logger.info(f"Processed questionnaire response {questionnaire_id}")
            return processed_data

        except Exception as e:
            logger.error(f"Failed to process questionnaire response: {str(e)}")
            raise

    async def analyze_response_patterns(self, all_responses: List[Dict]) -> Dict:
        """
        Analyze patterns across all questionnaire responses
        """
        analysis = {
            "response_rate": len(all_responses),
            "avg_completion_time": 0,
            "common_pain_points": {},
            "common_bottlenecks": {},
            "automation_opportunities": [],
            "department_patterns": {},
            "tool_overlap": {}
        }

        # Analyze common pain points
        pain_points = {}
        for response in all_responses:
            for pain_point in response.get("pain_points", []):
                desc = pain_point["description"].lower()
                # Group similar pain points
                for key_phrase in ["approval", "waiting", "unclear", "manual", "meeting"]:
                    if key_phrase in desc:
                        pain_points[key_phrase] = pain_points.get(key_phrase, 0) + 1

        analysis["common_pain_points"] = pain_points

        # Analyze bottlenecks
        total_time_lost = 0
        for response in all_responses:
            for bottleneck in response.get("bottlenecks", []):
                total_time_lost += bottleneck.get("time_lost_hours", 0)

        analysis["total_time_lost_weekly"] = total_time_lost

        # Analyze automation potential
        for response in all_responses:
            for opportunity in response.get("automation_opportunities", []):
                analysis["automation_opportunities"].append(opportunity)

        return analysis

    async def generate_followup_questions(self, initial_responses: Dict) -> List[Dict]:
        """
        Generate follow-up questions based on initial responses
        """
        followup_questions = []

        # If high redundancy reported, dig deeper
        if initial_responses.get("redundant_hours_weekly", 0) > 10:
            followup_questions.append({
                "id": "f1",
                "type": QuestionType.TEXT,
                "question": "You mentioned significant redundant work. Can you describe the most redundant process in detail?",
                "estimated_time": 120
            })

        # If multiple bottlenecks, prioritize
        if len(initial_responses.get("bottlenecks", [])) > 3:
            followup_questions.append({
                "id": "f2",
                "type": QuestionType.PRIORITY_RANKING,
                "question": "Rank these bottlenecks by business impact",
                "items": [b["description"] for b in initial_responses["bottlenecks"][:5]],
                "estimated_time": 60
            })

        # If cross-department issues, explore
        if "cross_department" in str(initial_responses.get("workflows", [])):
            followup_questions.append({
                "id": "f3",
                "type": QuestionType.MATRIX,
                "question": "Rate the efficiency of handoffs with each department",
                "rows": ["Very Poor", "Poor", "Neutral", "Good", "Excellent"],
                "columns": ["Sales", "Marketing", "Engineering", "Operations", "Finance"],
                "estimated_time": 45
            })

        return followup_questions

    def calculate_completion_rate(self, questionnaire_id: str, responses: Dict) -> float:
        """Calculate questionnaire completion rate"""
        total_questions = 20  # Base questions
        answered_questions = sum(len(section) for section in responses.values())
        return (answered_questions / total_questions) * 100

    async def generate_summary_report(self, questionnaire_id: str) -> Dict:
        """Generate summary report from questionnaire responses"""
        processed_data = self.response_cache.get(questionnaire_id)
        if not processed_data:
            raise ValueError(f"No processed data for questionnaire {questionnaire_id}")

        summary = {
            "questionnaire_id": questionnaire_id,
            "completion_rate": 100,  # Assuming complete
            "key_findings": [],
            "time_savings_potential": 0,
            "automation_potential": 0,
            "recommendations": []
        }

        # Calculate time savings potential
        total_time_lost = sum(b.get("time_lost_hours", 0)
                            for b in processed_data.get("bottlenecks", []))
        redundant_hours = processed_data.get("redundant_hours_weekly", 0)
        summary["time_savings_potential"] = total_time_lost + redundant_hours

        # Key findings
        if total_time_lost > 10:
            summary["key_findings"].append(f"Employee loses {total_time_lost} hours/week to bottlenecks")
        if redundant_hours > 5:
            summary["key_findings"].append(f"{redundant_hours} hours/week spent on redundant tasks")

        # Recommendations
        if processed_data.get("bottlenecks"):
            summary["recommendations"].append("Address identified bottlenecks for immediate impact")
        if processed_data.get("automation_opportunities"):
            summary["recommendations"].append("Implement automation for repetitive tasks")

        return summary