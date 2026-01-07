"""
Transcript Analyzer - AI-powered analysis of call transcripts
Extracts pain points, workarounds, tool usage, and improvement suggestions
"""

import os
import json
from typing import Dict, List, Optional
from datetime import datetime
import uuid

from openai import AsyncOpenAI

from utils.logger import setup_logger

logger = setup_logger("transcript_analyzer")


class TranscriptAnalyzer:
    """
    Analyzes call transcripts using GPT to extract structured insights.
    Used after interviews end to generate actionable process intelligence.
    """

    def __init__(self):
        """Initialize the transcript analyzer with OpenAI client"""
        openai_key = os.getenv("OPENAI_API_KEY")
        if openai_key:
            self.openai_client = AsyncOpenAI(api_key=openai_key)
        else:
            logger.warning("OPENAI_API_KEY not set - transcript analysis unavailable")
            self.openai_client = None

    async def analyze_transcript(
        self,
        transcript: str,
        employee_name: str = None,
        department: str = None,
        role: str = None,
        process_context: str = None
    ) -> Dict:
        """
        Analyze a call transcript and extract structured insights.

        Returns:
            {
                "id": "analysis_uuid",
                "analyzed_at": "ISO timestamp",
                "summary": "Brief executive summary",
                "pain_points": [...],
                "workarounds": [...],
                "tools_mentioned": [...],
                "improvement_suggestions": [...],
                "sentiment": "positive|neutral|negative",
                "key_quotes": [...],
                "follow_up_questions": [...],
                "automation_opportunities": [...]
            }
        """
        if not self.openai_client:
            logger.error("OpenAI client not available for transcript analysis")
            return {"error": "AI analysis not available"}

        if not transcript or len(transcript.strip()) < 50:
            logger.warning("Transcript too short for meaningful analysis")
            return {"error": "Transcript too short for analysis"}

        # Build context for the analysis
        context_parts = []
        if employee_name:
            context_parts.append(f"Employee: {employee_name}")
        if department:
            context_parts.append(f"Department: {department}")
        if role:
            context_parts.append(f"Role: {role}")
        if process_context:
            context_parts.append(f"Process Focus: {process_context}")

        context_str = "\n".join(context_parts) if context_parts else "No additional context"

        analysis_prompt = f"""You are an expert business process analyst. Analyze this interview transcript and extract structured insights.

CONTEXT:
{context_str}

TRANSCRIPT:
{transcript}

Analyze this transcript and provide a JSON response with the following structure:

{{
    "summary": "2-3 sentence executive summary of the interview",
    "pain_points": [
        {{
            "description": "Clear description of the pain point",
            "severity": "high|medium|low",
            "frequency": "daily|weekly|monthly|occasionally",
            "impact": "Brief description of business impact",
            "quote": "Relevant quote from transcript if available"
        }}
    ],
    "workarounds": [
        {{
            "description": "What the employee does to work around issues",
            "reason": "Why they need this workaround",
            "time_cost": "Estimated time spent on workaround"
        }}
    ],
    "tools_mentioned": [
        {{
            "name": "Tool or system name",
            "usage": "How it's used",
            "satisfaction": "positive|neutral|negative",
            "issues": "Any issues mentioned with the tool"
        }}
    ],
    "improvement_suggestions": [
        {{
            "suggestion": "Specific improvement suggestion",
            "source": "employee|analyst",
            "priority": "high|medium|low",
            "expected_impact": "Expected benefit if implemented"
        }}
    ],
    "automation_opportunities": [
        {{
            "process": "Process that could be automated",
            "current_time": "Current time spent",
            "automation_type": "full|partial",
            "complexity": "simple|moderate|complex"
        }}
    ],
    "key_quotes": [
        {{
            "quote": "Exact or near-exact quote from transcript",
            "context": "What this quote relates to",
            "sentiment": "positive|neutral|negative"
        }}
    ],
    "sentiment": "positive|neutral|negative",
    "engagement_level": "high|medium|low",
    "follow_up_questions": [
        "Question to ask in follow-up interview"
    ]
}}

Be thorough but concise. Extract actionable insights that can drive process improvements.
If certain sections don't apply based on the transcript, use empty arrays.
Ensure all JSON is properly formatted."""

        try:
            response = await self.openai_client.chat.completions.create(
                model="gpt-4-turbo-preview",
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert business process analyst. Always respond with valid JSON only, no markdown formatting."
                    },
                    {"role": "user", "content": analysis_prompt}
                ],
                response_format={"type": "json_object"},
                temperature=0.3,
                max_tokens=2000
            )

            analysis_result = json.loads(response.choices[0].message.content)

            # Add metadata
            analysis_result["id"] = str(uuid.uuid4())
            analysis_result["analyzed_at"] = datetime.utcnow().isoformat()
            analysis_result["transcript_length"] = len(transcript)
            analysis_result["model_used"] = "gpt-4-turbo-preview"

            logger.info(f"Transcript analysis completed: {analysis_result['id']}")
            return analysis_result

        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse analysis response: {e}")
            return {"error": "Failed to parse analysis results"}
        except Exception as e:
            logger.error(f"Transcript analysis failed: {e}")
            return {"error": str(e)}

    async def analyze_multiple_transcripts(
        self,
        transcripts: List[Dict],
        process_name: str = None
    ) -> Dict:
        """
        Analyze multiple transcripts and synthesize cross-interview insights.

        Args:
            transcripts: List of {"transcript": str, "employee_name": str, ...}
            process_name: Optional process being analyzed

        Returns:
            Aggregated insights across all transcripts
        """
        if not self.openai_client:
            return {"error": "AI analysis not available"}

        # First, analyze each transcript individually
        individual_analyses = []
        for t in transcripts:
            analysis = await self.analyze_transcript(
                transcript=t.get("transcript", ""),
                employee_name=t.get("employee_name"),
                department=t.get("department"),
                role=t.get("role")
            )
            if "error" not in analysis:
                individual_analyses.append(analysis)

        if not individual_analyses:
            return {"error": "No valid transcripts to analyze"}

        # Now synthesize across all analyses
        synthesis_prompt = f"""You are a senior business process consultant. You have individual interview analyses from {len(individual_analyses)} employees about their work processes{f' related to {process_name}' if process_name else ''}.

INDIVIDUAL ANALYSES:
{json.dumps(individual_analyses, indent=2)}

Synthesize these into a comprehensive report with the following JSON structure:

{{
    "executive_summary": "3-4 sentence summary of key findings across all interviews",
    "common_pain_points": [
        {{
            "pain_point": "Description",
            "mentioned_by": 3,
            "severity": "high|medium|low",
            "departments_affected": ["dept1", "dept2"],
            "recommended_action": "Specific recommendation"
        }}
    ],
    "process_bottlenecks": [
        {{
            "bottleneck": "Description of bottleneck",
            "impact": "Business impact",
            "root_cause": "Underlying cause",
            "solution": "Recommended solution"
        }}
    ],
    "quick_wins": [
        {{
            "opportunity": "Description",
            "effort": "low|medium|high",
            "impact": "Expected impact",
            "timeline": "Estimated implementation time"
        }}
    ],
    "automation_priorities": [
        {{
            "process": "Process to automate",
            "current_state": "How it works now",
            "automation_approach": "Recommended approach",
            "roi_estimate": "Expected ROI or time savings"
        }}
    ],
    "tool_insights": {{
        "well_received": ["tools that work well"],
        "needs_improvement": ["tools with issues"],
        "gaps": ["missing tools or capabilities"]
    }},
    "culture_insights": "Observations about team culture and dynamics",
    "recommended_next_steps": [
        "Prioritized action items"
    ],
    "risk_areas": [
        "Areas requiring immediate attention"
    ]
}}

Focus on patterns and themes across interviews. Prioritize actionable insights."""

        try:
            response = await self.openai_client.chat.completions.create(
                model="gpt-4-turbo-preview",
                messages=[
                    {
                        "role": "system",
                        "content": "You are a senior business process consultant. Always respond with valid JSON only."
                    },
                    {"role": "user", "content": synthesis_prompt}
                ],
                response_format={"type": "json_object"},
                temperature=0.3,
                max_tokens=3000
            )

            synthesis = json.loads(response.choices[0].message.content)

            # Add metadata
            synthesis["id"] = str(uuid.uuid4())
            synthesis["synthesized_at"] = datetime.utcnow().isoformat()
            synthesis["interviews_analyzed"] = len(individual_analyses)
            synthesis["individual_analyses"] = individual_analyses
            synthesis["process_name"] = process_name

            logger.info(f"Multi-transcript synthesis completed: {synthesis['id']}")
            return synthesis

        except Exception as e:
            logger.error(f"Multi-transcript synthesis failed: {e}")
            return {"error": str(e), "individual_analyses": individual_analyses}


# Global instance
transcript_analyzer = TranscriptAnalyzer()
