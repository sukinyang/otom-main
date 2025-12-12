"""
Workflow Mapping Engine for Otom
Maps actual company workflows through employee input and AI analysis
"""

import json
import asyncio
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime, timedelta
from dataclasses import dataclass
import networkx as nx
import numpy as np

from otom.utils.logger import setup_logger

logger = setup_logger("workflow_mapper")

@dataclass
class WorkflowNode:
    """Represents a single step in a workflow"""
    id: str
    name: str
    department: str
    owner: str
    duration_hours: float
    dependencies: List[str]
    tools_used: List[str]
    frequency: str  # daily, weekly, monthly
    pain_points: List[str]
    automation_potential: float  # 0-1 score

@dataclass
class WorkflowBottleneck:
    """Identified bottleneck in workflow"""
    node_id: str
    type: str  # "capacity", "dependency", "approval", "handoff"
    severity: float  # 0-1 score
    impact: str
    recommendation: str
    estimated_savings_hours: float

class WorkflowMapper:
    """Maps and analyzes company workflows using AI and employee input"""

    def __init__(self):
        """Initialize workflow mapping engine"""
        self.workflows = {}
        self.bottlenecks = []
        self.redundancies = []
        self.dependencies_graph = nx.DiGraph()
        self.last_update = None
        self.update_schedule = []

    async def collect_employee_data(self, employee_id: str, questionnaire_responses: Dict) -> Dict:
        """
        Process employee questionnaire responses (~20 min survey)
        Maps actual day-to-day workflows, not org charts
        """
        try:
            employee_workflows = {
                "employee_id": employee_id,
                "department": questionnaire_responses.get("department"),
                "role": questionnaire_responses.get("role"),
                "workflows": [],
                "pain_points": [],
                "suggestions": []
            }

            # Parse daily activities
            daily_activities = questionnaire_responses.get("daily_activities", [])
            for activity in daily_activities:
                workflow_node = await self._create_workflow_node(activity)
                employee_workflows["workflows"].append(workflow_node)

            # Parse collaboration patterns
            collaborations = questionnaire_responses.get("collaborations", [])
            for collab in collaborations:
                await self._map_collaboration(collab)

            # Parse tool usage
            tools = questionnaire_responses.get("tools_used", [])
            await self._analyze_tool_usage(tools)

            # Parse pain points and bottlenecks
            pain_points = questionnaire_responses.get("pain_points", [])
            for pain_point in pain_points:
                employee_workflows["pain_points"].append({
                    "description": pain_point["description"],
                    "frequency": pain_point.get("frequency", "weekly"),
                    "time_wasted_hours": pain_point.get("time_wasted", 2),
                    "suggested_fix": pain_point.get("suggestion", "")
                })

            # Process improvement suggestions
            suggestions = questionnaire_responses.get("improvement_suggestions", [])
            employee_workflows["suggestions"] = suggestions

            logger.info(f"Collected workflow data from employee {employee_id}")
            return employee_workflows

        except Exception as e:
            logger.error(f"Failed to collect employee data: {str(e)}")
            raise

    async def _create_workflow_node(self, activity: Dict) -> WorkflowNode:
        """Create a workflow node from activity data"""
        return WorkflowNode(
            id=f"node_{activity['name'].replace(' ', '_').lower()}",
            name=activity["name"],
            department=activity.get("department", "unknown"),
            owner=activity.get("owner", "unassigned"),
            duration_hours=activity.get("duration", 1.0),
            dependencies=activity.get("dependencies", []),
            tools_used=activity.get("tools", []),
            frequency=activity.get("frequency", "daily"),
            pain_points=activity.get("pain_points", []),
            automation_potential=await self._calculate_automation_potential(activity)
        )

    async def _calculate_automation_potential(self, activity: Dict) -> float:
        """Calculate how automatable an activity is (0-1 score)"""
        score = 0.0

        # Repetitive tasks have high automation potential
        if activity.get("repetitive", False):
            score += 0.3

        # Digital tasks are easier to automate
        if activity.get("digital", False):
            score += 0.3

        # Rule-based tasks can be automated
        if activity.get("rule_based", False):
            score += 0.2

        # Tasks requiring human judgment are harder to automate
        if activity.get("requires_judgment", False):
            score -= 0.3

        # Creative tasks are difficult to automate
        if activity.get("creative", False):
            score -= 0.2

        return max(0.0, min(1.0, score))

    async def map_company_workflows(self, all_employee_data: List[Dict]) -> Dict:
        """
        Synthesize all employee data into comprehensive workflow map
        """
        try:
            company_workflows = {
                "total_employees_surveyed": len(all_employee_data),
                "departments": {},
                "cross_functional_workflows": [],
                "key_processes": [],
                "workflow_graph": None
            }

            # Build workflow graph
            for employee_data in all_employee_data:
                for workflow in employee_data.get("workflows", []):
                    self._add_to_workflow_graph(workflow)

            # Identify cross-functional workflows
            cross_functional = await self._identify_cross_functional_workflows()
            company_workflows["cross_functional_workflows"] = cross_functional

            # Map department-specific workflows
            for employee_data in all_employee_data:
                dept = employee_data.get("department")
                if dept not in company_workflows["departments"]:
                    company_workflows["departments"][dept] = {
                        "employees": 0,
                        "workflows": [],
                        "total_hours_per_week": 0,
                        "automation_opportunities": []
                    }

                dept_data = company_workflows["departments"][dept]
                dept_data["employees"] += 1
                dept_data["workflows"].extend(employee_data.get("workflows", []))

            # Analyze key processes
            key_processes = await self._identify_key_processes()
            company_workflows["key_processes"] = key_processes

            # Store the graph for visualization
            company_workflows["workflow_graph"] = self._export_graph()

            self.workflows = company_workflows
            self.last_update = datetime.now()

            logger.info("Successfully mapped company workflows")
            return company_workflows

        except Exception as e:
            logger.error(f"Failed to map company workflows: {str(e)}")
            raise

    def _add_to_workflow_graph(self, workflow: Dict):
        """Add workflow node to the dependency graph"""
        node_id = workflow.get("id") or workflow["name"]

        # Add node with attributes
        self.dependencies_graph.add_node(
            node_id,
            name=workflow["name"],
            department=workflow.get("department"),
            duration=workflow.get("duration_hours", 1),
            frequency=workflow.get("frequency", "daily")
        )

        # Add edges for dependencies
        for dep in workflow.get("dependencies", []):
            self.dependencies_graph.add_edge(dep, node_id)

    async def identify_bottlenecks(self) -> List[WorkflowBottleneck]:
        """
        Identify bottlenecks in workflows using graph analysis
        """
        bottlenecks = []

        try:
            # 1. Capacity bottlenecks (high betweenness centrality)
            centrality = nx.betweenness_centrality(self.dependencies_graph)
            for node, score in centrality.items():
                if score > 0.3:  # High centrality threshold
                    bottleneck = WorkflowBottleneck(
                        node_id=node,
                        type="capacity",
                        severity=min(score * 2, 1.0),
                        impact=f"This step is a critical path for {int(score * 100)}% of workflows",
                        recommendation="Consider parallelizing or adding resources",
                        estimated_savings_hours=score * 40  # Weekly hours
                    )
                    bottlenecks.append(bottleneck)

            # 2. Dependency bottlenecks (nodes with many dependencies)
            for node in self.dependencies_graph.nodes():
                in_degree = self.dependencies_graph.in_degree(node)
                if in_degree > 5:  # Many dependencies
                    bottleneck = WorkflowBottleneck(
                        node_id=node,
                        type="dependency",
                        severity=min(in_degree / 10, 1.0),
                        impact=f"Blocked by {in_degree} other tasks",
                        recommendation="Reduce dependencies or batch processing",
                        estimated_savings_hours=in_degree * 2
                    )
                    bottlenecks.append(bottleneck)

            # 3. Approval bottlenecks (nodes with "approval" in name)
            for node in self.dependencies_graph.nodes():
                node_data = self.dependencies_graph.nodes[node]
                if "approval" in node_data.get("name", "").lower():
                    bottleneck = WorkflowBottleneck(
                        node_id=node,
                        type="approval",
                        severity=0.7,
                        impact="Manual approval causing delays",
                        recommendation="Implement automated approval rules for standard cases",
                        estimated_savings_hours=10
                    )
                    bottlenecks.append(bottleneck)

            # 4. Handoff bottlenecks (edges between departments)
            for edge in self.dependencies_graph.edges():
                node1_dept = self.dependencies_graph.nodes[edge[0]].get("department")
                node2_dept = self.dependencies_graph.nodes[edge[1]].get("department")
                if node1_dept != node2_dept:
                    bottleneck = WorkflowBottleneck(
                        node_id=f"{edge[0]}_to_{edge[1]}",
                        type="handoff",
                        severity=0.6,
                        impact=f"Cross-department handoff between {node1_dept} and {node2_dept}",
                        recommendation="Standardize handoff process or co-locate teams",
                        estimated_savings_hours=5
                    )
                    bottlenecks.append(bottleneck)

            self.bottlenecks = bottlenecks
            logger.info(f"Identified {len(bottlenecks)} workflow bottlenecks")
            return bottlenecks

        except Exception as e:
            logger.error(f"Failed to identify bottlenecks: {str(e)}")
            raise

    async def detect_redundancies(self) -> List[Dict]:
        """
        Detect redundant processes and duplicate work
        """
        redundancies = []

        try:
            # Find similar workflow nodes
            nodes = list(self.dependencies_graph.nodes(data=True))

            for i, (node1, data1) in enumerate(nodes):
                for node2, data2 in nodes[i+1:]:
                    similarity = self._calculate_similarity(data1, data2)

                    if similarity > 0.8:  # High similarity threshold
                        redundancy = {
                            "type": "duplicate_process",
                            "nodes": [node1, node2],
                            "similarity_score": similarity,
                            "departments": [data1.get("department"), data2.get("department")],
                            "estimated_waste_hours": data1.get("duration", 1) * 4,  # Weekly
                            "recommendation": "Consolidate these similar processes"
                        }
                        redundancies.append(redundancy)

            # Find cycles (circular dependencies)
            try:
                cycles = list(nx.simple_cycles(self.dependencies_graph))
                for cycle in cycles:
                    redundancy = {
                        "type": "circular_dependency",
                        "nodes": cycle,
                        "impact": "Tasks waiting on each other causing delays",
                        "estimated_waste_hours": len(cycle) * 3,
                        "recommendation": "Break circular dependency by reordering tasks"
                    }
                    redundancies.append(redundancy)
            except:
                pass  # Graph might not have cycles

            self.redundancies = redundancies
            logger.info(f"Detected {len(redundancies)} redundancies")
            return redundancies

        except Exception as e:
            logger.error(f"Failed to detect redundancies: {str(e)}")
            raise

    def _calculate_similarity(self, node1_data: Dict, node2_data: Dict) -> float:
        """Calculate similarity between two workflow nodes"""
        score = 0.0

        # Similar names
        name1 = node1_data.get("name", "").lower()
        name2 = node2_data.get("name", "").lower()
        if name1 and name2:
            common_words = set(name1.split()) & set(name2.split())
            if common_words:
                score += len(common_words) / max(len(name1.split()), len(name2.split()))

        # Same department
        if node1_data.get("department") == node2_data.get("department"):
            score += 0.2

        # Similar duration
        duration1 = node1_data.get("duration", 0)
        duration2 = node2_data.get("duration", 0)
        if duration1 and duration2:
            duration_diff = abs(duration1 - duration2) / max(duration1, duration2)
            score += (1 - duration_diff) * 0.3

        return min(score, 1.0)

    async def generate_visualizations(self) -> Dict:
        """
        Generate workflow visualizations
        """
        visualizations = {
            "workflow_map": await self._create_workflow_map(),
            "bottleneck_heatmap": await self._create_bottleneck_heatmap(),
            "department_flow": await self._create_department_flow(),
            "automation_opportunities": await self._create_automation_chart(),
            "time_analysis": await self._create_time_analysis()
        }

        return visualizations

    async def _create_workflow_map(self) -> Dict:
        """Create interactive workflow map visualization"""
        nodes = []
        edges = []

        for node in self.dependencies_graph.nodes(data=True):
            nodes.append({
                "id": node[0],
                "label": node[1].get("name", node[0]),
                "department": node[1].get("department", "unknown"),
                "duration": node[1].get("duration", 1),
                "x": np.random.randint(0, 1000),  # Would use proper layout algorithm
                "y": np.random.randint(0, 600)
            })

        for edge in self.dependencies_graph.edges():
            edges.append({
                "from": edge[0],
                "to": edge[1],
                "type": "dependency"
            })

        return {
            "type": "network",
            "nodes": nodes,
            "edges": edges,
            "layout": "hierarchical"
        }

    async def _create_bottleneck_heatmap(self) -> Dict:
        """Create heatmap showing bottleneck severity"""
        heatmap_data = []

        for bottleneck in self.bottlenecks:
            heatmap_data.append({
                "node": bottleneck.node_id,
                "type": bottleneck.type,
                "severity": bottleneck.severity,
                "savings_potential": bottleneck.estimated_savings_hours
            })

        return {
            "type": "heatmap",
            "data": heatmap_data,
            "color_scale": "red_yellow_green"
        }

    async def _create_department_flow(self) -> Dict:
        """Create Sankey diagram of inter-department workflows"""
        flows = []

        for edge in self.dependencies_graph.edges():
            node1_dept = self.dependencies_graph.nodes[edge[0]].get("department", "unknown")
            node2_dept = self.dependencies_graph.nodes[edge[1]].get("department", "unknown")

            if node1_dept != node2_dept:
                flows.append({
                    "source": node1_dept,
                    "target": node2_dept,
                    "value": 1  # Would calculate actual flow volume
                })

        return {
            "type": "sankey",
            "flows": flows
        }

    async def _create_automation_chart(self) -> Dict:
        """Create chart of automation opportunities"""
        opportunities = []

        for node in self.dependencies_graph.nodes(data=True):
            if "automation_potential" in node[1]:
                opportunities.append({
                    "process": node[1].get("name", node[0]),
                    "potential": node[1]["automation_potential"],
                    "hours_saved": node[1].get("duration", 1) * node[1]["automation_potential"] * 40
                })

        # Sort by potential
        opportunities.sort(key=lambda x: x["potential"], reverse=True)

        return {
            "type": "bar_chart",
            "data": opportunities[:10],  # Top 10 opportunities
            "x_axis": "process",
            "y_axis": "hours_saved"
        }

    async def _create_time_analysis(self) -> Dict:
        """Create time spent analysis by department and process"""
        time_by_dept = {}

        for node in self.dependencies_graph.nodes(data=True):
            dept = node[1].get("department", "unknown")
            duration = node[1].get("duration", 1)
            frequency = node[1].get("frequency", "daily")

            # Calculate weekly hours
            if frequency == "daily":
                weekly_hours = duration * 5
            elif frequency == "weekly":
                weekly_hours = duration
            elif frequency == "monthly":
                weekly_hours = duration / 4
            else:
                weekly_hours = duration

            if dept not in time_by_dept:
                time_by_dept[dept] = 0
            time_by_dept[dept] += weekly_hours

        return {
            "type": "pie_chart",
            "data": [{"department": k, "hours": v} for k, v in time_by_dept.items()],
            "total_hours": sum(time_by_dept.values())
        }

    async def _identify_cross_functional_workflows(self) -> List[Dict]:
        """Identify workflows that span multiple departments"""
        cross_functional = []

        # Use connected components to find workflow chains
        for component in nx.weakly_connected_components(self.dependencies_graph):
            if len(component) > 1:
                departments = set()
                for node in component:
                    dept = self.dependencies_graph.nodes[node].get("department")
                    if dept:
                        departments.add(dept)

                if len(departments) > 1:
                    cross_functional.append({
                        "name": f"Cross-functional process {len(cross_functional) + 1}",
                        "departments": list(departments),
                        "nodes": list(component),
                        "complexity": len(component)
                    })

        return cross_functional

    async def _identify_key_processes(self) -> List[Dict]:
        """Identify the most critical business processes"""
        key_processes = []

        # Identify by centrality and criticality
        centrality = nx.degree_centrality(self.dependencies_graph)

        for node, score in sorted(centrality.items(), key=lambda x: x[1], reverse=True)[:10]:
            node_data = self.dependencies_graph.nodes[node]
            key_processes.append({
                "name": node_data.get("name", node),
                "department": node_data.get("department", "unknown"),
                "criticality_score": score,
                "dependencies": list(self.dependencies_graph.predecessors(node)),
                "dependent_processes": list(self.dependencies_graph.successors(node))
            })

        return key_processes

    def _export_graph(self) -> Dict:
        """Export workflow graph for visualization"""
        return {
            "nodes": list(self.dependencies_graph.nodes(data=True)),
            "edges": list(self.dependencies_graph.edges()),
            "statistics": {
                "total_nodes": self.dependencies_graph.number_of_nodes(),
                "total_edges": self.dependencies_graph.number_of_edges(),
                "is_dag": nx.is_directed_acyclic_graph(self.dependencies_graph),
                "connected_components": nx.number_weakly_connected_components(self.dependencies_graph)
            }
        }

    async def schedule_monthly_updates(self, company_id: str):
        """
        Schedule monthly workflow updates to stay current
        """
        update_schedule = {
            "company_id": company_id,
            "frequency": "monthly",
            "next_update": datetime.now() + timedelta(days=30),
            "update_method": "progressive",  # Don't resurvey everyone at once
            "departments_per_month": 2,  # Rotate through departments
            "notification_settings": {
                "email_reminder": True,
                "days_before": 3
            }
        }

        self.update_schedule = update_schedule
        logger.info(f"Scheduled monthly updates for company {company_id}")
        return update_schedule

    async def generate_insights(self) -> Dict:
        """
        Generate actionable insights from workflow analysis
        """
        total_bottlenecks = len(self.bottlenecks)
        total_redundancies = len(self.redundancies)
        total_savings_hours = sum(b.estimated_savings_hours for b in self.bottlenecks)

        insights = {
            "executive_summary": {
                "bottlenecks_found": total_bottlenecks,
                "redundancies_found": total_redundancies,
                "potential_time_savings": f"{total_savings_hours:.0f} hours/week",
                "potential_cost_savings": f"${total_savings_hours * 50 * 52:,.0f}/year",  # $50/hour assumption
                "automation_opportunities": len([n for n in self.dependencies_graph.nodes(data=True)
                                                if n[1].get("automation_potential", 0) > 0.7])
            },
            "top_recommendations": [
                {
                    "priority": "HIGH",
                    "action": "Address capacity bottlenecks",
                    "impact": f"Save {total_savings_hours * 0.4:.0f} hours/week",
                    "effort": "Medium",
                    "timeline": "2-3 months"
                },
                {
                    "priority": "HIGH",
                    "action": "Automate repetitive processes",
                    "impact": f"Save {total_savings_hours * 0.3:.0f} hours/week",
                    "effort": "Low-Medium",
                    "timeline": "1-2 months"
                },
                {
                    "priority": "MEDIUM",
                    "action": "Consolidate redundant workflows",
                    "impact": f"Save {total_savings_hours * 0.2:.0f} hours/week",
                    "effort": "Low",
                    "timeline": "1 month"
                },
                {
                    "priority": "MEDIUM",
                    "action": "Optimize cross-department handoffs",
                    "impact": f"Save {total_savings_hours * 0.1:.0f} hours/week",
                    "effort": "Medium",
                    "timeline": "2 months"
                }
            ],
            "department_specific": await self._generate_department_insights(),
            "quick_wins": await self._identify_quick_wins(),
            "long_term_initiatives": await self._identify_long_term_initiatives()
        }

        return insights

    async def _generate_department_insights(self) -> Dict:
        """Generate insights for each department"""
        dept_insights = {}

        for dept in set(n[1].get("department", "unknown")
                       for n in self.dependencies_graph.nodes(data=True)):
            dept_nodes = [n for n in self.dependencies_graph.nodes(data=True)
                         if n[1].get("department") == dept]

            dept_insights[dept] = {
                "total_processes": len(dept_nodes),
                "bottlenecks": len([b for b in self.bottlenecks
                                  if any(b.node_id == n[0] for n in dept_nodes)]),
                "automation_candidates": len([n for n in dept_nodes
                                            if n[1].get("automation_potential", 0) > 0.7]),
                "weekly_hours": sum(n[1].get("duration", 0) * 5 for n in dept_nodes)
            }

        return dept_insights

    async def _identify_quick_wins(self) -> List[Dict]:
        """Identify quick wins that can be implemented immediately"""
        quick_wins = []

        # High automation potential with low complexity
        for node in self.dependencies_graph.nodes(data=True):
            if (node[1].get("automation_potential", 0) > 0.8 and
                self.dependencies_graph.in_degree(node[0]) < 2):
                quick_wins.append({
                    "action": f"Automate {node[1].get('name', node[0])}",
                    "effort": "Low",
                    "impact": "High",
                    "timeline": "1-2 weeks",
                    "savings": f"{node[1].get('duration', 1) * 5:.0f} hours/week"
                })

        return quick_wins[:5]  # Top 5 quick wins

    async def _identify_long_term_initiatives(self) -> List[Dict]:
        """Identify strategic long-term improvements"""
        initiatives = [
            {
                "name": "Digital Transformation",
                "description": "Digitize all paper-based processes",
                "timeline": "6-12 months",
                "investment": "$100K-500K",
                "roi": "200-300%"
            },
            {
                "name": "Process Reengineering",
                "description": "Redesign core business processes",
                "timeline": "3-6 months",
                "investment": "$50K-200K",
                "roi": "150-250%"
            },
            {
                "name": "Workflow Automation Platform",
                "description": "Implement enterprise automation tools",
                "timeline": "4-8 months",
                "investment": "$75K-300K",
                "roi": "300-400%"
            }
        ]

        return initiatives