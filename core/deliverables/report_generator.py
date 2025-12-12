"""
Report and Deliverable Generator for Otom
Creates professional consulting deliverables
"""

import os
import json
from typing import Dict, List, Any, Optional
from datetime import datetime
import asyncio
from reportlab.lib.pagesizes import letter, A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY
import matplotlib.pyplot as plt
import plotly.graph_objects as go
from io import BytesIO
import base64
import numpy as np
try:
    import seaborn as sns
    import networkx as nx
except ImportError:
    # These are optional for advanced visualizations
    sns = None
    nx = None

from otom.utils.logger import setup_logger

logger = setup_logger("report_generator")

class ReportGenerator:
    """Generate professional consulting deliverables"""

    def __init__(self):
        """Initialize report generator"""
        self.styles = getSampleStyleSheet()
        self._setup_custom_styles()
        self.output_dir = os.getenv("REPORT_OUTPUT_DIR", "/tmp/otom_reports")
        os.makedirs(self.output_dir, exist_ok=True)

    def _setup_custom_styles(self):
        """Setup custom paragraph styles for professional reports"""
        # Title style
        self.styles.add(ParagraphStyle(
            name='CustomTitle',
            parent=self.styles['Title'],
            fontSize=24,
            textColor=colors.HexColor('#1a1a2e'),
            spaceAfter=30,
            alignment=TA_CENTER
        ))

        # Subtitle style
        self.styles.add(ParagraphStyle(
            name='Subtitle',
            parent=self.styles['Heading2'],
            fontSize=14,
            textColor=colors.HexColor('#4a4a4a'),
            spaceBefore=12,
            spaceAfter=12
        ))

        # Executive style
        self.styles.add(ParagraphStyle(
            name='Executive',
            parent=self.styles['Normal'],
            fontSize=11,
            alignment=TA_JUSTIFY,
            spaceAfter=12,
            leading=14
        ))

    async def create_strategy_deck(self, session: Dict) -> Dict:
        """
        Create a comprehensive strategy presentation deck
        """
        try:
            filename = f"strategy_deck_{session.get('id', 'demo')}_{datetime.now().strftime('%Y%m%d')}.pdf"
            filepath = os.path.join(self.output_dir, filename)

            doc = SimpleDocTemplate(
                filepath,
                pagesize=letter,
                rightMargin=72,
                leftMargin=72,
                topMargin=72,
                bottomMargin=18,
            )

            story = []

            # Title slide
            story.append(Paragraph(
                f"Strategic Consulting Report",
                self.styles['CustomTitle']
            ))
            story.append(Paragraph(
                f"Prepared for: {session.get('context', {}).get('company', 'Client')}",
                self.styles['Subtitle']
            ))
            story.append(Paragraph(
                f"Date: {datetime.now().strftime('%B %d, %Y')}",
                self.styles['Normal']
            ))
            story.append(Spacer(1, 0.5*inch))
            story.append(Paragraph(
                "Prepared by: Otom AI Consultant",
                self.styles['Normal']
            ))
            story.append(PageBreak())

            # Executive Summary
            story.append(Paragraph("Executive Summary", self.styles['Heading1']))
            story.append(Spacer(1, 0.2*inch))

            context = session.get('context', {})
            summary_text = f"""
            Based on our comprehensive analysis of your business, we have identified significant
            opportunities for growth and optimization. Your company currently operates in the
            {context.get('industry', 'target')} industry with {context.get('employees', 'N/A')} employees
            and faces challenges including {', '.join(context.get('challenges', ['operational efficiency']))[:2]}.

            Our analysis reveals that by implementing our strategic recommendations, your organization
            can achieve measurable improvements in operational efficiency, market position, and revenue growth.
            """
            story.append(Paragraph(summary_text.strip(), self.styles['Executive']))
            story.append(PageBreak())

            # Current State Analysis
            story.append(Paragraph("Current State Analysis", self.styles['Heading1']))
            story.append(Spacer(1, 0.2*inch))

            if session.get('analysis', {}).get('swot'):
                story.append(Paragraph("SWOT Analysis", self.styles['Heading2']))
                swot = session['analysis']['swot']

                swot_data = [
                    ['Strengths', 'Weaknesses'],
                    ['\n'.join(f"• {s}" for s in swot.get('strengths', ['N/A'])[:3]),
                     '\n'.join(f"• {w}" for w in swot.get('weaknesses', ['N/A'])[:3])],
                    ['Opportunities', 'Threats'],
                    ['\n'.join(f"• {o}" for o in swot.get('opportunities', ['N/A'])[:3]),
                     '\n'.join(f"• {t}" for t in swot.get('threats', ['N/A'])[:3])]
                ]

                swot_table = Table(swot_data, colWidths=[3.5*inch, 3.5*inch])
                swot_table.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#e8f4f8')),
                    ('BACKGROUND', (0, 2), (-1, 2), colors.HexColor('#e8f4f8')),
                    ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
                    ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                    ('FONTNAME', (0, 2), (-1, 2), 'Helvetica-Bold'),
                    ('FONTSIZE', (0, 0), (-1, -1), 10),
                    ('GRID', (0, 0), (-1, -1), 1, colors.grey),
                    ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                    ('ROWBACKGROUNDS', (0, 1), (-1, 1), [colors.white]),
                    ('ROWBACKGROUNDS', (0, 3), (-1, 3), [colors.white]),
                ]))
                story.append(swot_table)
                story.append(PageBreak())

            # Strategic Recommendations
            story.append(Paragraph("Strategic Recommendations", self.styles['Heading1']))
            story.append(Spacer(1, 0.2*inch))

            recommendations = session.get('recommendations', [])
            for i, rec in enumerate(recommendations[:3], 1):
                story.append(Paragraph(f"Strategy {i}: {rec.get('name', 'Strategic Initiative')}",
                                      self.styles['Heading2']))

                rec_text = f"""
                <b>Impact:</b> {rec.get('impact', 'Significant improvement expected')}<br/>
                <b>Timeline:</b> {rec.get('timeline', '3-6 months')}<br/>
                <b>Investment:</b> {rec.get('resources', 'TBD')}<br/>
                <br/>
                <b>Implementation Approach:</b><br/>
                """
                story.append(Paragraph(rec_text, self.styles['Normal']))

                # Add implementation steps if available
                if rec.get('implementation_steps'):
                    for step in rec['implementation_steps'][:5]:
                        story.append(Paragraph(f"• {step}", self.styles['Normal']))

                story.append(Spacer(1, 0.3*inch))

            story.append(PageBreak())

            # Implementation Roadmap
            story.append(Paragraph("Implementation Roadmap", self.styles['Heading1']))
            story.append(Spacer(1, 0.2*inch))

            roadmap_data = [
                ['Phase', 'Timeline', 'Key Activities', 'Success Metrics'],
                ['Phase 1: Foundation', 'Months 1-2',
                 'Process audit, Team alignment, Tool selection',
                 'Baseline metrics established'],
                ['Phase 2: Implementation', 'Months 3-4',
                 'Process redesign, System integration, Training',
                 '30% efficiency improvement'],
                ['Phase 3: Optimization', 'Months 5-6',
                 'Fine-tuning, Automation, Scaling',
                 '50% target achievement'],
                ['Phase 4: Sustain', 'Ongoing',
                 'Monitoring, Continuous improvement',
                 'Maintain gains, iterate']
            ]

            roadmap_table = Table(roadmap_data, colWidths=[1.5*inch, 1.2*inch, 2.5*inch, 2*inch])
            roadmap_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1a1a2e')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 9),
                ('GRID', (0, 0), (-1, -1), 1, colors.grey),
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ]))
            story.append(roadmap_table)
            story.append(PageBreak())

            # Financial Projections
            story.append(Paragraph("Expected ROI", self.styles['Heading1']))
            story.append(Spacer(1, 0.2*inch))

            roi_text = """
            Based on our analysis and the proposed strategic initiatives, we project:

            • Cost Savings: $250,000 - $500,000 annually through process optimization
            • Revenue Growth: 20-30% increase within 12 months
            • Efficiency Gains: 35-45% reduction in operational overhead
            • Time to Value: Initial improvements visible within 30 days
            • Full ROI: Expected within 6-9 months
            """
            story.append(Paragraph(roi_text, self.styles['Normal']))

            # Next Steps
            story.append(PageBreak())
            story.append(Paragraph("Next Steps", self.styles['Heading1']))
            story.append(Spacer(1, 0.2*inch))

            next_steps = [
                "1. Review and approve strategic recommendations with leadership team",
                "2. Prioritize initiatives based on resource availability and impact",
                "3. Establish implementation task force with clear ownership",
                "4. Define success metrics and monitoring cadence",
                "5. Schedule bi-weekly progress reviews with Otom AI Consultant",
                "6. Begin Phase 1 implementation within 2 weeks"
            ]

            for step in next_steps:
                story.append(Paragraph(step, self.styles['Normal']))
                story.append(Spacer(1, 0.1*inch))

            # Build PDF
            doc.build(story)

            logger.info(f"Generated strategy deck: {filepath}")
            return {
                "status": "success",
                "filepath": filepath,
                "url": f"/reports/{filename}",
                "size": os.path.getsize(filepath)
            }

        except Exception as e:
            logger.error(f"Failed to create strategy deck: {str(e)}")
            raise

    async def create_executive_summary(self, session: Dict) -> Dict:
        """
        Create a 2-page executive summary
        """
        try:
            filename = f"executive_summary_{session.get('id', 'demo')}_{datetime.now().strftime('%Y%m%d')}.pdf"
            filepath = os.path.join(self.output_dir, filename)

            doc = SimpleDocTemplate(
                filepath,
                pagesize=letter,
                rightMargin=72,
                leftMargin=72,
                topMargin=72,
                bottomMargin=18,
            )

            story = []

            # Header
            story.append(Paragraph("EXECUTIVE SUMMARY", self.styles['CustomTitle']))
            story.append(Paragraph(
                f"{session.get('context', {}).get('company', 'Client')} Strategic Consultation",
                self.styles['Subtitle']
            ))
            story.append(Spacer(1, 0.3*inch))

            # Key Findings
            story.append(Paragraph("KEY FINDINGS", self.styles['Heading2']))
            key_findings = [
                "Your business has strong fundamentals but faces operational inefficiencies",
                "Market opportunity exists for 2-3x growth within current segment",
                "Technology adoption can reduce costs by 30-40%",
                "Customer retention improvements could add $2M ARR"
            ]
            for finding in key_findings:
                story.append(Paragraph(f"• {finding}", self.styles['Normal']))
            story.append(Spacer(1, 0.2*inch))

            # Recommendations
            story.append(Paragraph("TOP RECOMMENDATIONS", self.styles['Heading2']))
            recommendations = session.get('recommendations', [])
            for i, rec in enumerate(recommendations[:3], 1):
                story.append(Paragraph(
                    f"{i}. {rec.get('name', 'Strategic Initiative')}: {rec.get('impact', 'High impact')}",
                    self.styles['Normal']
                ))
            story.append(Spacer(1, 0.2*inch))

            # Financial Impact
            story.append(Paragraph("FINANCIAL IMPACT", self.styles['Heading2']))
            story.append(Paragraph(
                "Total Investment: $500,000 | Expected Return: $2-3M | Payback: 6-9 months",
                self.styles['Normal']
            ))
            story.append(Spacer(1, 0.2*inch))

            # Timeline
            story.append(Paragraph("IMPLEMENTATION TIMELINE", self.styles['Heading2']))
            story.append(Paragraph(
                "Phase 1 (Months 1-2): Foundation | Phase 2 (Months 3-4): Execution | Phase 3 (Months 5-6): Scale",
                self.styles['Normal']
            ))

            # Build PDF
            doc.build(story)

            logger.info(f"Generated executive summary: {filepath}")
            return {
                "status": "success",
                "filepath": filepath,
                "url": f"/reports/{filename}",
                "size": os.path.getsize(filepath)
            }

        except Exception as e:
            logger.error(f"Failed to create executive summary: {str(e)}")
            raise

    async def create_workflow_report(self, workflow_analysis: Dict) -> Dict:
        """
        Create detailed workflow analysis report
        """
        try:
            filename = f"workflow_analysis_{workflow_analysis.get('company_id', 'demo')}_{datetime.now().strftime('%Y%m%d')}.pdf"
            filepath = os.path.join(self.output_dir, filename)

            doc = SimpleDocTemplate(filepath, pagesize=letter)
            story = []

            # Title
            story.append(Paragraph("Workflow Analysis Report", self.styles['CustomTitle']))
            story.append(Spacer(1, 0.3*inch))

            # Executive Summary
            story.append(Paragraph("Executive Summary", self.styles['Heading1']))
            insights = workflow_analysis.get('insights', {}).get('executive_summary', {})
            summary_text = f"""
            Employees Surveyed: {workflow_analysis.get('employees_surveyed', 0)}<br/>
            Bottlenecks Identified: {insights.get('bottlenecks_found', 0)}<br/>
            Potential Time Savings: {insights.get('potential_time_savings', '0 hours/week')}<br/>
            Potential Cost Savings: {insights.get('potential_cost_savings', '$0/year')}<br/>
            Automation Opportunities: {insights.get('automation_opportunities', 0)}
            """
            story.append(Paragraph(summary_text, self.styles['Normal']))
            story.append(PageBreak())

            # Bottleneck Analysis
            story.append(Paragraph("Bottleneck Analysis", self.styles['Heading1']))
            bottlenecks = workflow_analysis.get('bottlenecks', [])
            for bottleneck in bottlenecks[:5]:
                story.append(Paragraph(f"• {bottleneck.node_id}: {bottleneck.impact}", self.styles['Normal']))
                story.append(Paragraph(f"  Recommendation: {bottleneck.recommendation}", self.styles['Normal']))
                story.append(Spacer(1, 0.1*inch))

            # Build PDF
            doc.build(story)

            logger.info(f"Generated workflow report: {filepath}")
            return {
                "status": "success",
                "filepath": filepath,
                "url": f"/reports/{filename}",
                "size": os.path.getsize(filepath)
            }

        except Exception as e:
            logger.error(f"Failed to create workflow report: {str(e)}")
            raise

    async def create_visualization(self, data: Dict, viz_type: str) -> str:
        """
        Create data visualization and return as base64 encoded image
        """
        try:
            if viz_type == "swot_matrix":
                return await self._create_swot_visualization(data)
            elif viz_type == "bottleneck_heatmap":
                return await self._create_bottleneck_heatmap(data)
            elif viz_type == "workflow_network":
                return await self._create_workflow_network(data)
            elif viz_type == "roi_projection":
                return await self._create_roi_chart(data)
            else:
                return await self._create_generic_chart(data)

        except Exception as e:
            logger.error(f"Failed to create visualization: {str(e)}")
            return ""

    async def _create_swot_visualization(self, swot_data: Dict) -> str:
        """Create SWOT matrix visualization"""
        fig, axes = plt.subplots(2, 2, figsize=(10, 8))
        fig.suptitle('SWOT Analysis', fontsize=16, fontweight='bold')

        # Strengths
        axes[0, 0].set_title('Strengths', fontweight='bold', color='green')
        axes[0, 0].axis('off')
        strengths_text = '\n'.join(f"• {s}" for s in swot_data.get('strengths', ['N/A'])[:5])
        axes[0, 0].text(0.1, 0.9, strengths_text, transform=axes[0, 0].transAxes,
                       verticalalignment='top', fontsize=10)

        # Weaknesses
        axes[0, 1].set_title('Weaknesses', fontweight='bold', color='red')
        axes[0, 1].axis('off')
        weaknesses_text = '\n'.join(f"• {w}" for w in swot_data.get('weaknesses', ['N/A'])[:5])
        axes[0, 1].text(0.1, 0.9, weaknesses_text, transform=axes[0, 1].transAxes,
                       verticalalignment='top', fontsize=10)

        # Opportunities
        axes[1, 0].set_title('Opportunities', fontweight='bold', color='blue')
        axes[1, 0].axis('off')
        opportunities_text = '\n'.join(f"• {o}" for o in swot_data.get('opportunities', ['N/A'])[:5])
        axes[1, 0].text(0.1, 0.9, opportunities_text, transform=axes[1, 0].transAxes,
                       verticalalignment='top', fontsize=10)

        # Threats
        axes[1, 1].set_title('Threats', fontweight='bold', color='orange')
        axes[1, 1].axis('off')
        threats_text = '\n'.join(f"• {t}" for t in swot_data.get('threats', ['N/A'])[:5])
        axes[1, 1].text(0.1, 0.9, threats_text, transform=axes[1, 1].transAxes,
                       verticalalignment='top', fontsize=10)

        # Save to base64
        buffer = BytesIO()
        plt.tight_layout()
        plt.savefig(buffer, format='png', dpi=150)
        buffer.seek(0)
        image_base64 = base64.b64encode(buffer.getvalue()).decode()
        plt.close()

        return image_base64

    async def _create_bottleneck_heatmap(self, data: List) -> str:
        """Create bottleneck severity heatmap"""
        if not data:
            data = [
                {'department': 'Sales', 'type': 'approval', 'severity': 8},
                {'department': 'Sales', 'type': 'handoff', 'severity': 5},
                {'department': 'Engineering', 'type': 'capacity', 'severity': 9},
                {'department': 'Engineering', 'type': 'dependency', 'severity': 7},
                {'department': 'Support', 'type': 'capacity', 'severity': 6},
            ]

        # Prepare data for heatmap
        departments = list(set([b.get('department', 'Unknown') for b in data]))
        bottleneck_types = ['capacity', 'dependency', 'approval', 'handoff']

        # Create matrix
        matrix = np.zeros((len(departments), len(bottleneck_types)))
        for i, dept in enumerate(departments):
            for j, btype in enumerate(bottleneck_types):
                # Count severity for each type
                severity = sum([
                    b.get('severity', 0) for b in data
                    if b.get('department') == dept and b.get('type') == btype
                ])
                matrix[i][j] = severity

        # Create heatmap
        plt.figure(figsize=(10, 6))

        if sns:
            sns.heatmap(
                matrix,
                annot=True,
                fmt='.0f',
                cmap='YlOrRd',
                xticklabels=bottleneck_types,
                yticklabels=departments,
                cbar_kws={'label': 'Severity Score'}
            )
        else:
            # Fallback to matplotlib imshow
            plt.imshow(matrix, cmap='YlOrRd', aspect='auto')
            plt.colorbar(label='Severity Score')
            plt.xticks(range(len(bottleneck_types)), bottleneck_types)
            plt.yticks(range(len(departments)), departments)

            # Add text annotations
            for i in range(len(departments)):
                for j in range(len(bottleneck_types)):
                    plt.text(j, i, f'{matrix[i, j]:.0f}',
                           ha='center', va='center', color='black')

        plt.title('Workflow Bottleneck Heatmap by Department')
        plt.xlabel('Bottleneck Type')
        plt.ylabel('Department')
        plt.tight_layout()

        buffer = BytesIO()
        plt.savefig(buffer, format='png', dpi=150)
        buffer.seek(0)
        image_base64 = base64.b64encode(buffer.getvalue()).decode()
        plt.close()

        return image_base64

    async def _create_workflow_network(self, data: Dict) -> str:
        """Create workflow network diagram"""
        if not data or not data.get('nodes'):
            # Create sample workflow data
            data = {
                'nodes': {
                    'lead': {'label': 'Lead Gen', 'department': 'Marketing', 'importance': 3},
                    'qualify': {'label': 'Qualify', 'department': 'Sales', 'importance': 2},
                    'demo': {'label': 'Demo', 'department': 'Sales', 'importance': 4},
                    'proposal': {'label': 'Proposal', 'department': 'Sales', 'importance': 3},
                    'negotiate': {'label': 'Negotiate', 'department': 'Legal', 'importance': 2},
                    'close': {'label': 'Close Deal', 'department': 'Sales', 'importance': 5},
                    'onboard': {'label': 'Onboard', 'department': 'Success', 'importance': 3},
                },
                'edges': [
                    {'from': 'lead', 'to': 'qualify', 'weight': 3},
                    {'from': 'qualify', 'to': 'demo', 'weight': 2},
                    {'from': 'demo', 'to': 'proposal', 'weight': 2},
                    {'from': 'proposal', 'to': 'negotiate', 'weight': 1},
                    {'from': 'negotiate', 'to': 'close', 'weight': 2},
                    {'from': 'close', 'to': 'onboard', 'weight': 3},
                ]
            }

        if nx:
            # Use NetworkX for advanced layout
            G = nx.DiGraph()

            # Add nodes from data
            for node_id, node_data in data.get('nodes', {}).items():
                G.add_node(
                    node_id,
                    label=node_data.get('label', node_id),
                    department=node_data.get('department', 'Unknown'),
                    importance=node_data.get('importance', 1)
                )

            # Add edges
            for edge in data.get('edges', []):
                G.add_edge(
                    edge['from'],
                    edge['to'],
                    weight=edge.get('weight', 1)
                )

            # Layout algorithm
            pos = nx.spring_layout(G, k=2, iterations=50, seed=42)

            # Create visualization
            plt.figure(figsize=(12, 8))

            # Draw nodes with size based on importance
            node_sizes = [G.nodes[node].get('importance', 1) * 300 for node in G.nodes()]
            node_colors = [hash(G.nodes[node].get('department', '')) % 10 for node in G.nodes()]

            nx.draw_networkx_nodes(
                G, pos,
                node_size=node_sizes,
                node_color=node_colors,
                cmap=plt.cm.tab10,
                alpha=0.8
            )

            # Draw edges with width based on weight
            edge_widths = [G.edges[edge].get('weight', 1) for edge in G.edges()]
            nx.draw_networkx_edges(
                G, pos,
                width=edge_widths,
                alpha=0.6,
                arrows=True,
                arrowsize=10,
                edge_color='gray'
            )

            # Draw labels
            labels = {node: G.nodes[node].get('label', node)[:15] for node in G.nodes()}
            nx.draw_networkx_labels(G, pos, labels, font_size=8)
        else:
            # Fallback to simple matplotlib visualization
            plt.figure(figsize=(12, 8))

            # Simple circular layout
            nodes = list(data.get('nodes', {}).keys())
            n = len(nodes)
            if n > 0:
                angles = np.linspace(0, 2 * np.pi, n, endpoint=False)
                x = np.cos(angles)
                y = np.sin(angles)

                # Plot nodes
                for i, node_id in enumerate(nodes):
                    node_data = data['nodes'][node_id]
                    size = node_data.get('importance', 1) * 100
                    plt.scatter(x[i], y[i], s=size, alpha=0.7)
                    plt.text(x[i], y[i], node_data.get('label', node_id)[:10],
                           ha='center', va='center', fontsize=8)

                # Plot edges
                for edge in data.get('edges', []):
                    if edge['from'] in nodes and edge['to'] in nodes:
                        i_from = nodes.index(edge['from'])
                        i_to = nodes.index(edge['to'])
                        plt.arrow(x[i_from], y[i_from],
                                x[i_to] - x[i_from], y[i_to] - y[i_from],
                                head_width=0.05, head_length=0.05,
                                fc='gray', ec='gray', alpha=0.5)

        plt.title('Workflow Network Visualization')
        plt.axis('off')
        plt.axis('equal')
        plt.tight_layout()

        buffer = BytesIO()
        plt.savefig(buffer, format='png', dpi=150, bbox_inches='tight')
        buffer.seek(0)
        image_base64 = base64.b64encode(buffer.getvalue()).decode()
        plt.close()

        return image_base64

    async def _create_roi_chart(self, data: Dict) -> str:
        """Create ROI projection chart"""
        months = list(range(1, 13))
        investment = [50000] * 12
        returns = [i * 15000 for i in range(1, 13)]
        cumulative_roi = [r - 50000 * i for i, r in enumerate(returns, 1)]

        plt.figure(figsize=(10, 6))
        plt.plot(months, investment, 'r--', label='Cumulative Investment')
        plt.plot(months, returns, 'g-', label='Cumulative Returns')
        plt.plot(months, cumulative_roi, 'b-', linewidth=2, label='Net ROI')
        plt.axhline(y=0, color='black', linestyle='-', alpha=0.3)
        plt.xlabel('Months')
        plt.ylabel('USD ($)')
        plt.title('ROI Projection - 12 Month Outlook')
        plt.legend()
        plt.grid(True, alpha=0.3)

        buffer = BytesIO()
        plt.savefig(buffer, format='png', dpi=150)
        buffer.seek(0)
        image_base64 = base64.b64encode(buffer.getvalue()).decode()
        plt.close()

        return image_base64

    async def _create_generic_chart(self, data: Dict) -> str:
        """Create generic chart from data"""
        chart_type = data.get('type', 'bar')
        title = data.get('title', 'Analysis Results')
        x_label = data.get('x_label', 'Categories')
        y_label = data.get('y_label', 'Values')
        x_data = data.get('x', [])
        y_data = data.get('y', [])

        if not x_data or not y_data:
            # Create sample data if none provided
            x_data = ['Q1', 'Q2', 'Q3', 'Q4']
            y_data = [100, 120, 140, 180]

        plt.figure(figsize=(10, 6))

        if chart_type == 'line':
            plt.plot(x_data, y_data, marker='o', linewidth=2, markersize=8)
            plt.fill_between(range(len(x_data)), y_data, alpha=0.3)
        elif chart_type == 'bar':
            colors = plt.cm.viridis(np.linspace(0.4, 0.8, len(x_data)))
            plt.bar(x_data, y_data, color=colors, alpha=0.8)
            # Add value labels on bars
            for i, (x, y) in enumerate(zip(x_data, y_data)):
                plt.text(i, y, str(y), ha='center', va='bottom')
        elif chart_type == 'pie':
            plt.pie(y_data, labels=x_data, autopct='%1.1f%%', startangle=90)
        else:  # scatter
            plt.scatter(range(len(x_data)), y_data, s=100, alpha=0.7,
                      c=range(len(x_data)), cmap='viridis')
            plt.xticks(range(len(x_data)), x_data)

        if chart_type != 'pie':
            plt.xlabel(x_label)
            plt.ylabel(y_label)
            plt.grid(True, alpha=0.3)
            if chart_type != 'scatter':
                plt.xticks(rotation=45 if len(str(x_data[0])) > 5 else 0)

        plt.title(title)
        plt.tight_layout()

        buffer = BytesIO()
        plt.savefig(buffer, format='png', dpi=150)
        buffer.seek(0)
        image_base64 = base64.b64encode(buffer.getvalue()).decode()
        plt.close()

        return image_base64

    async def generate_email_report(self, session: Dict) -> str:
        """
        Generate HTML email report
        """
        html_template = f"""
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; }}
                .header {{ background: #1a1a2e; color: white; padding: 20px; text-align: center; }}
                .content {{ padding: 20px; }}
                .section {{ margin-bottom: 30px; }}
                .recommendations {{ background: #f0f0f0; padding: 15px; border-radius: 5px; }}
                .cta {{ background: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; }}
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Otom AI Consulting Report</h1>
                <p>Strategic Analysis Complete</p>
            </div>
            <div class="content">
                <div class="section">
                    <h2>Dear {session.get('context', {}).get('company', 'Client')},</h2>
                    <p>Thank you for your consultation with Otom AI. Our analysis is complete, and we've identified significant opportunities for your business.</p>
                </div>
                <div class="section recommendations">
                    <h3>Top Recommendations:</h3>
                    <ol>
                        <li>Implement process automation - Save 30% operational costs</li>
                        <li>Optimize customer journey - Increase retention by 25%</li>
                        <li>Expand to adjacent markets - Capture $2M additional revenue</li>
                    </ol>
                </div>
                <div class="section">
                    <h3>Next Steps:</h3>
                    <p>Your complete strategy deck and implementation roadmap are attached to this email.</p>
                    <p><a href="#" class="cta">Schedule Follow-Up Call</a></p>
                </div>
                <div class="section">
                    <p>Best regards,<br>
                    Otom AI Consultant<br>
                    Available 24/7 for your success</p>
                </div>
            </div>
        </body>
        </html>
        """
        return html_template