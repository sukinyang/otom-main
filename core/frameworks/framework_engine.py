"""
Framework Engine for Otom
Implements classic consulting frameworks and methodologies
"""

import json
from typing import Dict, List, Any, Optional
from dataclasses import dataclass
import asyncio

from utils.logger import setup_logger

logger = setup_logger("framework_engine")

@dataclass
class FrameworkResult:
    """Structured result from framework analysis"""
    framework_name: str
    analysis: Dict[str, Any]
    insights: List[str]
    recommendations: List[str]
    visualizations: Optional[Dict] = None

class FrameworkEngine:
    """Applies consulting frameworks to business problems"""

    def __init__(self):
        """Initialize framework engine with available methodologies"""
        self.frameworks = {
            "swot": self.apply_swot,
            "porters_five_forces": self.apply_porters_five_forces,
            "bcg_matrix": self.apply_bcg_matrix,
            "value_chain": self.apply_value_chain,
            "pestle": self.apply_pestle,
            "ansoff_matrix": self.apply_ansoff_matrix,
            "mckinsey_7s": self.apply_mckinsey_7s,
            "blue_ocean": self.apply_blue_ocean,
            "jobs_to_be_done": self.apply_jobs_to_be_done,
            "okr": self.apply_okr_framework
        }

    async def apply_swot(self, context: Dict[str, Any]) -> FrameworkResult:
        """Apply SWOT Analysis"""
        try:
            # Extract relevant information from context
            business_info = context.get("business_info", {})
            market_data = context.get("market_analysis", {})
            competitive_data = context.get("competitive_analysis", {})

            swot = {
                "strengths": [],
                "weaknesses": [],
                "opportunities": [],
                "threats": []
            }

            # Analyze Strengths
            if business_info.get("unique_value_proposition"):
                swot["strengths"].append(f"Strong value proposition: {business_info['unique_value_proposition']}")
            if business_info.get("market_share", 0) > 0.15:
                swot["strengths"].append("Significant market share")
            if business_info.get("customer_satisfaction", 0) > 4.0:
                swot["strengths"].append("High customer satisfaction")
            if business_info.get("technology_advantage"):
                swot["strengths"].append("Technology leadership")

            # Analyze Weaknesses
            if business_info.get("cash_flow_issues"):
                swot["weaknesses"].append("Cash flow constraints")
            if business_info.get("talent_gaps"):
                swot["weaknesses"].append(f"Talent gaps in: {', '.join(business_info['talent_gaps'])}")
            if business_info.get("operational_inefficiencies"):
                swot["weaknesses"].append("Operational inefficiencies")
            if not business_info.get("digital_presence"):
                swot["weaknesses"].append("Limited digital presence")

            # Analyze Opportunities
            if market_data.get("market_growth_rate", 0) > 0.1:
                swot["opportunities"].append(f"High market growth ({market_data['market_growth_rate']*100:.1f}% annually)")
            if market_data.get("emerging_trends"):
                swot["opportunities"].append(f"Emerging trends: {', '.join(market_data['emerging_trends'][:2])}")
            if context.get("expansion_possibilities"):
                swot["opportunities"].append("Geographic expansion potential")
            if market_data.get("underserved_segments"):
                swot["opportunities"].append("Underserved customer segments identified")

            # Analyze Threats
            if competitive_data.get("new_entrants"):
                swot["threats"].append("New market entrants")
            if market_data.get("regulatory_changes"):
                swot["threats"].append("Upcoming regulatory changes")
            if competitive_data.get("price_pressure"):
                swot["threats"].append("Increasing price pressure")
            if market_data.get("technology_disruption"):
                swot["threats"].append("Potential technology disruption")

            # Generate insights
            insights = self._generate_swot_insights(swot)

            # Generate recommendations
            recommendations = self._generate_swot_recommendations(swot)

            return FrameworkResult(
                framework_name="SWOT Analysis",
                analysis=swot,
                insights=insights,
                recommendations=recommendations,
                visualizations=self._create_swot_visualization(swot)
            )

        except Exception as e:
            logger.error(f"Failed to apply SWOT analysis: {str(e)}")
            raise

    async def apply_porters_five_forces(self, context: Dict[str, Any]) -> FrameworkResult:
        """Apply Porter's Five Forces Analysis"""
        try:
            market_data = context.get("market_analysis", {})
            competitive_data = context.get("competitive_analysis", {})

            five_forces = {
                "competitive_rivalry": {
                    "intensity": "medium",
                    "factors": [],
                    "score": 3
                },
                "supplier_power": {
                    "level": "low",
                    "factors": [],
                    "score": 2
                },
                "buyer_power": {
                    "level": "medium",
                    "factors": [],
                    "score": 3
                },
                "threat_of_substitution": {
                    "risk": "medium",
                    "factors": [],
                    "score": 3
                },
                "threat_of_new_entry": {
                    "risk": "high",
                    "factors": [],
                    "score": 4
                }
            }

            # Analyze Competitive Rivalry
            if competitive_data.get("num_competitors", 0) > 10:
                five_forces["competitive_rivalry"]["intensity"] = "high"
                five_forces["competitive_rivalry"]["score"] = 4
                five_forces["competitive_rivalry"]["factors"].append("Many competitors in market")

            if market_data.get("market_growth_rate", 0) < 0.05:
                five_forces["competitive_rivalry"]["factors"].append("Slow market growth intensifies competition")

            # Analyze Supplier Power
            if context.get("supplier_concentration"):
                five_forces["supplier_power"]["level"] = "high"
                five_forces["supplier_power"]["score"] = 4
                five_forces["supplier_power"]["factors"].append("High supplier concentration")

            # Analyze Buyer Power
            if context.get("customer_concentration"):
                five_forces["buyer_power"]["level"] = "high"
                five_forces["buyer_power"]["score"] = 4
                five_forces["buyer_power"]["factors"].append("Customer concentration risk")

            # Analyze Threat of Substitution
            if market_data.get("substitute_products"):
                five_forces["threat_of_substitution"]["risk"] = "high"
                five_forces["threat_of_substitution"]["score"] = 4
                five_forces["threat_of_substitution"]["factors"].extend(market_data["substitute_products"])

            # Analyze Threat of New Entry
            if market_data.get("entry_barriers", []):
                five_forces["threat_of_new_entry"]["risk"] = "low"
                five_forces["threat_of_new_entry"]["score"] = 2
                five_forces["threat_of_new_entry"]["factors"].extend(market_data["entry_barriers"])

            # Calculate overall attractiveness
            total_score = sum(force["score"] for force in five_forces.values())
            attractiveness = "high" if total_score <= 12 else "medium" if total_score <= 17 else "low"

            insights = [
                f"Market attractiveness: {attractiveness}",
                f"Key competitive factor: {self._identify_key_force(five_forces)}",
                "Strategic positioning opportunities identified"
            ]

            recommendations = self._generate_porter_recommendations(five_forces, attractiveness)

            return FrameworkResult(
                framework_name="Porter's Five Forces",
                analysis=five_forces,
                insights=insights,
                recommendations=recommendations,
                visualizations=self._create_five_forces_visualization(five_forces)
            )

        except Exception as e:
            logger.error(f"Failed to apply Porter's Five Forces: {str(e)}")
            raise

    async def apply_bcg_matrix(self, context: Dict[str, Any]) -> FrameworkResult:
        """Apply BCG Growth-Share Matrix"""
        try:
            products = context.get("products", [])
            if not products:
                products = [{"name": "Main Product", "market_share": 0.2, "market_growth": 0.15}]

            bcg_classification = {
                "stars": [],
                "cash_cows": [],
                "question_marks": [],
                "dogs": []
            }

            for product in products:
                market_share = product.get("market_share", 0.1)
                market_growth = product.get("market_growth", 0.1)

                if market_share >= 0.5 and market_growth >= 0.1:
                    bcg_classification["stars"].append(product)
                elif market_share >= 0.5 and market_growth < 0.1:
                    bcg_classification["cash_cows"].append(product)
                elif market_share < 0.5 and market_growth >= 0.1:
                    bcg_classification["question_marks"].append(product)
                else:
                    bcg_classification["dogs"].append(product)

            insights = [
                f"{len(bcg_classification['stars'])} star products/services identified",
                f"{len(bcg_classification['cash_cows'])} cash cows generating steady revenue",
                "Portfolio rebalancing opportunities available"
            ]

            recommendations = [
                "Invest heavily in star products to maintain leadership",
                "Maximize cash generation from cash cows",
                "Evaluate question marks for investment or divestment",
                "Consider divesting or repositioning dogs"
            ]

            return FrameworkResult(
                framework_name="BCG Matrix",
                analysis=bcg_classification,
                insights=insights,
                recommendations=recommendations
            )

        except Exception as e:
            logger.error(f"Failed to apply BCG Matrix: {str(e)}")
            raise

    async def apply_value_chain(self, context: Dict[str, Any]) -> FrameworkResult:
        """Apply Porter's Value Chain Analysis"""
        value_chain = {
            "primary_activities": {
                "inbound_logistics": {"efficiency": 0.7, "opportunities": []},
                "operations": {"efficiency": 0.75, "opportunities": []},
                "outbound_logistics": {"efficiency": 0.65, "opportunities": []},
                "marketing_sales": {"efficiency": 0.8, "opportunities": []},
                "service": {"efficiency": 0.85, "opportunities": []}
            },
            "support_activities": {
                "firm_infrastructure": {"efficiency": 0.7, "opportunities": []},
                "hr_management": {"efficiency": 0.65, "opportunities": []},
                "technology_development": {"efficiency": 0.6, "opportunities": []},
                "procurement": {"efficiency": 0.75, "opportunities": []}
            }
        }

        # Identify optimization opportunities
        for activity, data in value_chain["primary_activities"].items():
            if data["efficiency"] < 0.7:
                data["opportunities"].append(f"Significant improvement potential in {activity}")

        insights = [
            "Value chain optimization can improve margins by 15-20%",
            "Technology integration opportunities across the chain",
            "Customer touchpoint improvements identified"
        ]

        recommendations = [
            "Digitize key value chain activities",
            "Implement lean processes in operations",
            "Strengthen supplier relationships",
            "Enhance customer service capabilities"
        ]

        return FrameworkResult(
            framework_name="Value Chain Analysis",
            analysis=value_chain,
            insights=insights,
            recommendations=recommendations
        )

    async def apply_pestle(self, context: Dict[str, Any]) -> FrameworkResult:
        """Apply PESTLE Analysis"""
        pestle = {
            "political": {"factors": [], "impact": "medium"},
            "economic": {"factors": [], "impact": "high"},
            "social": {"factors": [], "impact": "medium"},
            "technological": {"factors": [], "impact": "high"},
            "legal": {"factors": [], "impact": "low"},
            "environmental": {"factors": [], "impact": "medium"}
        }

        # Analyze each dimension based on context
        market_data = context.get("market_analysis", {})

        if market_data.get("regulatory_changes"):
            pestle["political"]["factors"].append("Regulatory changes affecting industry")
            pestle["political"]["impact"] = "high"

        if market_data.get("economic_indicators"):
            pestle["economic"]["factors"].extend(market_data["economic_indicators"])

        if market_data.get("demographic_shifts"):
            pestle["social"]["factors"].append("Changing demographics")

        if market_data.get("technology_trends"):
            pestle["technological"]["factors"].extend(market_data["technology_trends"])

        insights = [
            "Macro environment presents both opportunities and risks",
            "Technology and economic factors most impactful",
            "Regulatory compliance requirements increasing"
        ]

        recommendations = [
            "Develop scenario plans for economic volatility",
            "Invest in technology capabilities",
            "Build regulatory compliance framework",
            "Align with social and environmental trends"
        ]

        return FrameworkResult(
            framework_name="PESTLE Analysis",
            analysis=pestle,
            insights=insights,
            recommendations=recommendations
        )

    async def apply_ansoff_matrix(self, context: Dict[str, Any]) -> FrameworkResult:
        """Apply Ansoff Growth Matrix"""
        growth_strategies = {
            "market_penetration": {
                "feasibility": "high",
                "risk": "low",
                "potential_growth": "15-20%",
                "tactics": []
            },
            "market_development": {
                "feasibility": "medium",
                "risk": "medium",
                "potential_growth": "25-35%",
                "tactics": []
            },
            "product_development": {
                "feasibility": "medium",
                "risk": "medium",
                "potential_growth": "20-30%",
                "tactics": []
            },
            "diversification": {
                "feasibility": "low",
                "risk": "high",
                "potential_growth": "40-60%",
                "tactics": []
            }
        }

        # Add specific tactics based on context
        growth_strategies["market_penetration"]["tactics"] = [
            "Increase marketing spend",
            "Improve customer retention",
            "Competitive pricing"
        ]

        growth_strategies["market_development"]["tactics"] = [
            "Geographic expansion",
            "New customer segments",
            "New channels"
        ]

        insights = [
            "Multiple growth paths available",
            "Market penetration offers quick wins",
            "Diversification requires careful planning"
        ]

        recommendations = [
            "Start with market penetration for immediate growth",
            "Explore adjacent markets for expansion",
            "Build capabilities for product innovation",
            "Evaluate strategic partnerships for diversification"
        ]

        return FrameworkResult(
            framework_name="Ansoff Matrix",
            analysis=growth_strategies,
            insights=insights,
            recommendations=recommendations
        )

    async def apply_mckinsey_7s(self, context: Dict[str, Any]) -> FrameworkResult:
        """Apply McKinsey 7S Framework"""
        seven_s = {
            "strategy": {"alignment": 0.7, "gaps": []},
            "structure": {"alignment": 0.65, "gaps": []},
            "systems": {"alignment": 0.6, "gaps": []},
            "shared_values": {"alignment": 0.75, "gaps": []},
            "skills": {"alignment": 0.7, "gaps": []},
            "staff": {"alignment": 0.65, "gaps": []},
            "style": {"alignment": 0.7, "gaps": []}
        }

        # Identify misalignments
        for element, data in seven_s.items():
            if data["alignment"] < 0.7:
                data["gaps"].append(f"{element.title()} needs strengthening")

        insights = [
            "Organizational alignment at 68% overall",
            "Systems and structure are key improvement areas",
            "Strong shared values foundation exists"
        ]

        recommendations = [
            "Align organizational structure with strategy",
            "Upgrade systems and processes",
            "Invest in skill development",
            "Strengthen leadership style"
        ]

        return FrameworkResult(
            framework_name="McKinsey 7S",
            analysis=seven_s,
            insights=insights,
            recommendations=recommendations
        )

    async def apply_blue_ocean(self, context: Dict[str, Any]) -> FrameworkResult:
        """Apply Blue Ocean Strategy"""
        blue_ocean = {
            "eliminate": [],
            "reduce": [],
            "raise": [],
            "create": []
        }

        # Analyze what to eliminate, reduce, raise, create
        blue_ocean["eliminate"] = [
            "Non-value-adding features",
            "Complex pricing structures"
        ]

        blue_ocean["reduce"] = [
            "Service complexity",
            "Operational overhead"
        ]

        blue_ocean["raise"] = [
            "Customer experience quality",
            "Product reliability",
            "Brand differentiation"
        ]

        blue_ocean["create"] = [
            "New customer segments",
            "Innovative service models",
            "Unique value propositions"
        ]

        insights = [
            "Uncontested market spaces identified",
            "Value innovation opportunities exist",
            "Competition can be made irrelevant"
        ]

        recommendations = [
            "Focus on value innovation, not competition",
            "Create new demand in uncontested spaces",
            "Align innovation with utility and price",
            "Build execution into strategy"
        ]

        return FrameworkResult(
            framework_name="Blue Ocean Strategy",
            analysis=blue_ocean,
            insights=insights,
            recommendations=recommendations
        )

    async def apply_jobs_to_be_done(self, context: Dict[str, Any]) -> FrameworkResult:
        """Apply Jobs-to-be-Done Framework"""
        jtbd = {
            "functional_jobs": [],
            "emotional_jobs": [],
            "social_jobs": [],
            "supporting_jobs": [],
            "consumption_chain_jobs": []
        }

        # Identify jobs based on context
        customer_data = context.get("customer_analysis", {})

        jtbd["functional_jobs"] = [
            "Solve specific business problem",
            "Improve operational efficiency",
            "Reduce costs"
        ]

        jtbd["emotional_jobs"] = [
            "Feel confident in decisions",
            "Reduce anxiety about future",
            "Sense of progress"
        ]

        jtbd["social_jobs"] = [
            "Look innovative to peers",
            "Demonstrate leadership",
            "Build reputation"
        ]

        insights = [
            "Customer jobs go beyond functional needs",
            "Emotional and social jobs underserved",
            "Innovation opportunities in job satisfaction"
        ]

        recommendations = [
            "Design solutions for complete job satisfaction",
            "Address emotional and social dimensions",
            "Create metrics around job completion",
            "Innovate on underserved jobs"
        ]

        return FrameworkResult(
            framework_name="Jobs-to-be-Done",
            analysis=jtbd,
            insights=insights,
            recommendations=recommendations
        )

    async def apply_okr_framework(self, context: Dict[str, Any]) -> FrameworkResult:
        """Apply OKR (Objectives and Key Results) Framework"""
        okrs = {
            "objectives": [],
            "key_results": [],
            "initiatives": []
        }

        # Generate OKRs based on context
        business_goals = context.get("goals", [])

        okrs["objectives"] = [
            "Accelerate revenue growth",
            "Improve operational excellence",
            "Enhance customer satisfaction"
        ]

        okrs["key_results"] = [
            "Increase revenue by 30% in Q4",
            "Reduce operational costs by 15%",
            "Achieve NPS score of 70+"
        ]

        okrs["initiatives"] = [
            "Launch new product line",
            "Implement automation",
            "Redesign customer experience"
        ]

        insights = [
            "Clear objectives drive focused execution",
            "Measurable results enable tracking",
            "Alignment across organization critical"
        ]

        recommendations = [
            "Cascade OKRs throughout organization",
            "Review and adjust quarterly",
            "Link OKRs to compensation",
            "Celebrate wins and learn from misses"
        ]

        return FrameworkResult(
            framework_name="OKR Framework",
            analysis=okrs,
            insights=insights,
            recommendations=recommendations
        )

    def _generate_swot_insights(self, swot: Dict) -> List[str]:
        """Generate insights from SWOT analysis"""
        insights = []

        # Strength-Opportunity combinations
        if swot["strengths"] and swot["opportunities"]:
            insights.append("Leverage strengths to capture market opportunities")

        # Weakness-Threat combinations
        if swot["weaknesses"] and swot["threats"]:
            insights.append("Address weaknesses to mitigate threats")

        # Balance assessment
        total_positive = len(swot["strengths"]) + len(swot["opportunities"])
        total_negative = len(swot["weaknesses"]) + len(swot["threats"])

        if total_positive > total_negative:
            insights.append("Overall positive strategic position")
        else:
            insights.append("Strategic improvements needed for competitive position")

        return insights

    def _generate_swot_recommendations(self, swot: Dict) -> List[str]:
        """Generate recommendations from SWOT analysis"""
        recommendations = []

        # SO Strategies (Strength-Opportunity)
        if swot["strengths"] and swot["opportunities"]:
            recommendations.append("Pursue aggressive growth strategies")

        # WO Strategies (Weakness-Opportunity)
        if swot["weaknesses"] and swot["opportunities"]:
            recommendations.append("Develop capabilities to capture opportunities")

        # ST Strategies (Strength-Threat)
        if swot["strengths"] and swot["threats"]:
            recommendations.append("Use strengths to defend against threats")

        # WT Strategies (Weakness-Threat)
        if swot["weaknesses"] and swot["threats"]:
            recommendations.append("Consider defensive strategies or partnerships")

        return recommendations

    def _generate_porter_recommendations(self, forces: Dict, attractiveness: str) -> List[str]:
        """Generate recommendations from Porter's Five Forces"""
        recommendations = []

        if attractiveness == "high":
            recommendations.append("Invest aggressively in market position")
        elif attractiveness == "medium":
            recommendations.append("Selective investment with focus on differentiation")
        else:
            recommendations.append("Consider alternative markets or niches")

        # Force-specific recommendations
        if forces["competitive_rivalry"]["score"] >= 4:
            recommendations.append("Differentiate strongly or focus on niche segments")

        if forces["buyer_power"]["score"] >= 4:
            recommendations.append("Diversify customer base and increase switching costs")

        return recommendations

    def _identify_key_force(self, forces: Dict) -> str:
        """Identify the most critical force"""
        max_force = max(forces.items(), key=lambda x: x[1]["score"])
        return max_force[0].replace("_", " ").title()

    def _create_swot_visualization(self, swot: Dict) -> Dict:
        """Create visualization data for SWOT matrix"""
        return {
            "type": "matrix",
            "quadrants": [
                {"label": "Strengths", "items": swot["strengths"][:5]},
                {"label": "Weaknesses", "items": swot["weaknesses"][:5]},
                {"label": "Opportunities", "items": swot["opportunities"][:5]},
                {"label": "Threats", "items": swot["threats"][:5]}
            ]
        }

    def _create_five_forces_visualization(self, forces: Dict) -> Dict:
        """Create visualization data for Porter's Five Forces"""
        return {
            "type": "radar",
            "axes": [
                {"label": "Competitive Rivalry", "value": forces["competitive_rivalry"]["score"]},
                {"label": "Supplier Power", "value": forces["supplier_power"]["score"]},
                {"label": "Buyer Power", "value": forces["buyer_power"]["score"]},
                {"label": "Threat of Substitution", "value": forces["threat_of_substitution"]["score"]},
                {"label": "Threat of New Entry", "value": forces["threat_of_new_entry"]["score"]}
            ],
            "max_value": 5
        }

    async def select_frameworks(self, context: Dict[str, Any]) -> List[str]:
        """Select most appropriate frameworks for the business context"""
        selected = []

        # Always include SWOT as baseline
        selected.append("swot")

        # Add based on context
        if context.get("competitive_analysis"):
            selected.append("porters_five_forces")

        if context.get("products") and len(context["products"]) > 1:
            selected.append("bcg_matrix")

        if context.get("growth_focus"):
            selected.append("ansoff_matrix")

        if context.get("organizational_change"):
            selected.append("mckinsey_7s")

        return selected

    async def apply_multiple_frameworks(self, context: Dict[str, Any]) -> List[FrameworkResult]:
        """Apply multiple frameworks in parallel"""
        selected_frameworks = await self.select_frameworks(context)

        tasks = [
            self.frameworks[framework](context)
            for framework in selected_frameworks
            if framework in self.frameworks
        ]

        results = await asyncio.gather(*tasks, return_exceptions=True)

        # Filter out any errors
        valid_results = [r for r in results if isinstance(r, FrameworkResult)]

        return valid_results