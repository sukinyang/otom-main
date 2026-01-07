#!/usr/bin/env python3
"""
Otom AI - Transcript Seeding Script

This script seeds 20 sample interview transcripts into the database
for testing the AI synthesis feature.

Usage:
    python seed_transcripts.py

Requirements:
    - SUPABASE_URL environment variable
    - SUPABASE_KEY environment variable

To run against production:
    export SUPABASE_URL=your_supabase_url
    export SUPABASE_KEY=your_supabase_key
    python seed_transcripts.py
"""

import os
import uuid
import random
from datetime import datetime, timedelta
from typing import List, Dict

# Try to import supabase, provide helpful error if not available
try:
    from supabase import create_client, Client
except ImportError:
    print("Error: supabase package not installed")
    print("Install it with: pip install supabase")
    exit(1)

# Sample employees data
SAMPLE_EMPLOYEES = [
    {"name": "Sarah Johnson", "department": "Operations", "role": "Operations Manager", "phone": "+15551000001"},
    {"name": "Mike Chen", "department": "Sales", "role": "Sales Director", "phone": "+15551000002"},
    {"name": "Emma Davis", "department": "HR", "role": "HR Specialist", "phone": "+15551000003"},
    {"name": "David Wilson", "department": "Finance", "role": "Finance Lead", "phone": "+15551000004"},
    {"name": "Lisa Rodriguez", "department": "IT", "role": "IT Manager", "phone": "+15551000005"},
    {"name": "Tom Anderson", "department": "Marketing", "role": "Marketing Head", "phone": "+15551000006"},
    {"name": "Anna Thompson", "department": "Customer Success", "role": "Customer Success Manager", "phone": "+15551000007"},
    {"name": "James Miller", "department": "Product", "role": "Product Manager", "phone": "+15551000008"},
    {"name": "Rachel Brown", "department": "Engineering", "role": "Software Engineer", "phone": "+15551000009"},
    {"name": "Kevin Lee", "department": "Product", "role": "UX Designer", "phone": "+15551000010"},
    {"name": "Amanda White", "department": "Sales", "role": "Sales Representative", "phone": "+15551000011"},
    {"name": "Robert Garcia", "department": "Engineering", "role": "DevOps Engineer", "phone": "+15551000012"},
    {"name": "Jennifer Adams", "department": "Sales", "role": "VP of Sales", "phone": "+15551000013"},
    {"name": "Chris Martinez", "department": "Engineering", "role": "Engineering Manager", "phone": "+15551000014"},
    {"name": "Patricia Brown", "department": "Finance", "role": "CFO", "phone": "+15551000015"},
    {"name": "Michael Lee", "department": "Customer Success", "role": "Customer Success Lead", "phone": "+15551000016"},
    {"name": "Susan Clark", "department": "Marketing", "role": "CMO", "phone": "+15551000017"},
    {"name": "Emily White", "department": "Product", "role": "VP of Product", "phone": "+15551000018"},
    {"name": "James Thompson", "department": "IT", "role": "CTO", "phone": "+15551000019"},
    {"name": "Robert Miller", "department": "HR", "role": "HR Director", "phone": "+15551000020"},
]

# Sample transcripts (abbreviated versions)
SAMPLE_TRANSCRIPTS = [
    # Interview 1: Sarah Johnson - Operations Manager
    """AI: Good morning Sarah! Thank you for joining today's process audit interview. How are you doing today?

Sarah: Good morning! I'm doing well, thanks. Ready to dive in.

AI: Great. Can you walk me through your typical day when you arrive at work?

Sarah: Sure. My day usually starts around 8 AM. First thing I do is check our task management system for any overnight issues or urgent requests. Then I review the daily production schedule.

AI: What tools do you use for task management?

Sarah: We use a combination of things - our main ERP system for production scheduling, then we have Asana for project tracking, and honestly a lot still happens through email and spreadsheets.

AI: Do you find yourself having to enter the same information in multiple places?

Sarah: Oh absolutely, that's one of my biggest pain points. When a production order changes, I have to update it in the ERP, then notify the team in Asana, then send an email to procurement, and update my tracking spreadsheet. It's probably 30 minutes of duplicate work every time.

AI: How often do these changes occur?

Sarah: At least 3-4 times a day. I've calculated it's about 10-15 hours per week just on data entry across systems.

AI: What would an ideal solution look like for you?

Sarah: If I could update one system and have it automatically sync to the others, that would be a game-changer.

AI: What's the biggest risk when these updates don't happen in sync?

Sarah: We've had situations where procurement ordered materials based on old data. Cost us about $15,000 last quarter in rush shipping.""",

    # Interview 2: Mike Chen - Sales Director
    """AI: Hello Mike! Thanks for taking the time today. Tell me about the sales pipeline.

Mike: Happy to help. When a lead comes in, it first goes to our SDR team for qualification. They have about 24 hours to make initial contact. If qualified, it gets assigned to an account executive based on territory and deal size.

AI: How do you track all of this?

Mike: Salesforce is our main CRM. Everything should be logged there.

AI: You said "should be" - is there a gap?

Mike: Yeah, data entry is a constant battle. Reps are focused on selling, not logging activities. I'd estimate we're missing about 30% of customer interactions in the CRM.

AI: What's the impact of that missing data?

Mike: It kills our forecasting accuracy. Last quarter we missed our forecast by 18% because deals weren't being updated properly.

AI: What have you tried to improve compliance?

Mike: We've tried everything - weekly reviews, gamification, tied it to bonuses. The fundamental problem is it takes too long to log everything manually.

AI: What would help?

Mike: Automatic activity capture would be huge. If our email and calendar could sync to Salesforce automatically, that would eliminate 80% of the manual entry.""",

    # Interview 3: Emma Davis - HR Specialist
    """AI: Hi Emma! I'd love to understand the HR processes, particularly around onboarding.

Emma: Of course! Once an offer is accepted, I have a checklist of about 40 items that need to happen before day one. IT needs to provision accounts, facilities needs to set up their workspace, payroll needs their information...

AI: How do you manage all these tasks?

Emma: I have a master spreadsheet that I've built over the years. Each new hire gets a row, and I manually check off items as they're completed.

AI: How often do things fall through the cracks?

Emma: More often than I'd like. Last month we had a new engineer start and IT hadn't provisioned their laptop. They sat at an empty desk for two days.

AI: What caused that?

Emma: The IT request got buried in their ticket queue. There's no automatic prioritization for new hire requests.

AI: How many onboardings do you handle at once?

Emma: During busy periods, 8-10 at a time. Each one has 40+ tasks. The mental load is exhausting.

AI: What would make this easier?

Emma: An automated workflow system where tasks get assigned automatically with deadlines, and I can see a dashboard of what's on track versus at risk.""",

    # Interview 4: David Wilson - Finance Lead
    """AI: Good afternoon David. What's the most time-consuming process for your team?

David: Without question, it's month-end close. We have a 5-day close process - reconciling accounts, reviewing transactions, preparing reports, getting management sign-offs.

AI: Where do bottlenecks typically occur?

David: Day one is always painful. We're chasing down information from other departments who are late with their submissions. I spend 4-5 hours just sending reminder emails.

AI: What percentage of departments submit on time?

David: Maybe 60% on the first deadline. Another 30% come in within a day. The last 10% are always a battle.

AI: What's the impact of late submissions?

David: Every day of delay costs us. We can't produce accurate reports for management, we may miss bank covenant deadlines, and my team ends up working weekends.

AI: What would ideal state look like?

David: Real-time data integration. If transactions flowed automatically from operational systems into the GL, we wouldn't need to wait for manual submissions.""",

    # Interview 5: Lisa Rodriguez - IT Manager
    """AI: Hello Lisa! Tell me about your support operations.

Lisa: We have a ticketing system - ServiceNow. Employees can submit tickets through a web portal, email, or call the help desk. We aim for first response within 4 hours.

AI: What's your actual response time?

Lisa: About 6 hours. The main issue is ticket routing - 40% of tickets come in with wrong categorization, so they sit in the wrong queue.

AI: Why do tickets get miscategorized?

Lisa: The category dropdown has 87 options. Users just pick something that sounds close.

AI: What types of issues take longest to resolve?

Lisa: Software access requests. Someone needs access to a system, which requires manager approval, then security review, then provisioning. The actual provisioning takes 5 minutes, but the approval chain can take days.

AI: What improvements would help?

Lisa: Two things: First, use AI to auto-categorize based on the description. Second, automate approval workflows with escalation if an approver doesn't respond in 24 hours.""",

    # Interview 6: Tom Anderson - Marketing Head
    """AI: Hi Tom! Tell me about your campaign process.

Tom: It starts with planning, then creative development, technical setup in marketing automation, review and approval, then launch.

AI: How long does a typical campaign take?

Tom: Should be 2-3 weeks. Reality is more like 4-5 weeks.

AI: Where does the extra time go?

Tom: Approvals mostly. Creative needs brand review, legal review, sometimes product team. Each reviewer has their own timeline.

AI: What's the impact of these delays?

Tom: We miss market windows. Last quarter a competitor launched two weeks before us because we were stuck in legal review. Our campaign performance was 30% below target.

AI: Any workarounds you've found?

Tom: I've started getting legal involved earlier, even before creative is final. Also created pre-approved templates.

AI: What tools do you wish you had?

Tom: A proper workflow tool with clear SLAs where I can see exactly where every piece of content is in the approval pipeline.""",

    # Interview 7: Anna Thompson - Customer Success Manager
    """AI: Hello Anna! How do you manage your portfolio of customers?

Anna: I have about 50 accounts. Each one has a health score based on product usage, support tickets, NPS scores, and engagement.

AI: How do you calculate the health score?

Anna: It's manual. Every week I pull data from 5 different systems and put it all in a spreadsheet to calculate weighted scores.

AI: How long does that take?

Anna: About 3 hours every Monday.

AI: How accurate is the health score at predicting churn?

Anna: About 80% of churned customers were red for at least a month before they left. The problem is I can only do deep interventions on 5 red accounts at a time.

AI: What would help you be more effective?

Anna: Automated health scoring would save those 3 hours weekly. Better yet, predictive analytics that tell me WHY a customer is at risk, not just that they are.""",

    # Interview 8: James Miller - Product Manager
    """AI: Hi James! How does an idea become a shipped feature?

James: Starts in our idea backlog, I prioritize based on impact versus effort, high-priority items get PRDs, then design, engineering, QA, and release.

AI: How long does that cycle take?

James: Small feature is 4-6 weeks. Medium is 2-3 months. Large can be 6 months.

AI: Where do you see inefficiencies?

James: The handoff points kill us. PRD to design takes forever because designers are overloaded. Design to engineering has friction.

AI: Tell me about stakeholder alignment.

James: For any feature touching multiple teams, I need buy-in from sales, marketing, customer success, sometimes legal. Getting everyone aligned can take 2-3 weeks of back-and-forth.

AI: How do you manage feature requests from all sources?

James: Productboard for feedback, Jira for execution. But a lot comes through Slack and emails. I probably miss 20% of feedback I receive.

AI: What would help?

James: A unified intake system with automatic tagging. Also, async alignment tools where stakeholders can review without meetings.""",

    # Interview 9: Rachel Brown - Software Engineer
    """AI: Hi Rachel! Walk me through a typical day.

Rachel: Check Slack for overnight fires, look at my Jira board, pick up a ticket, start coding. Ideally. Reality is more meetings and context-switching.

AI: How much of your day is actual coding?

Rachel: About 4 hours on a good day. The rest is meetings, code reviews, helping other developers, and waiting.

AI: Waiting for what?

Rachel: Code reviews mostly. A PR might sit for a day or two. A 4-hour feature can take 3-4 days to ship because of the review queue.

AI: Why does the queue build up?

Rachel: Everyone's busy. Reviews feel like interruptions. We require two approvals for any PR regardless of size.

AI: What about your dev environment?

Rachel: Painful. Takes 2 hours to set up from scratch. I spend 3-4 hours a week just fixing environment issues.

AI: What improvements would help?

Rachel: Automated code review for linting, formatting, security checks. Let humans focus on logic and architecture.""",

    # Interview 10: Kevin Lee - UX Designer
    """AI: Hi Kevin! How does a design project flow?

Kevin: Brief from PM, research, wireframes, user testing, visual design, and handoff to engineering.

AI: What's the biggest challenge?

Kevin: Getting enough time for research. There's always push to skip straight to wireframes. When we skip research, we end up redesigning later.

AI: How often does that happen?

Kevin: 1 in 4 features needs significant redesign within 6 months because we didn't understand the user problem upfront.

AI: Tell me about engineering handoff.

Kevin: I create detailed specs in Figma with all states and interactions, then a handoff meeting to walk through everything.

AI: How smooth is that handoff?

Kevin: Questions come up during development. Engineers Slack me, I clarify, sometimes update the design. It works but it's reactive.

AI: How much time on post-handoff Q&A?

Kevin: About 20% of my time. For a 2-week project, that's 2 full days just on Q&A.""",

    # Interview 11: Amanda White - Sales Representative
    """AI: Hi Amanda! Walk me through working a typical deal.

Amanda: Get a lead, research the company, find contacts, outreach, discovery meeting, demo, proposal, negotiation, close.

AI: How long does the research phase take?

Amanda: About 30 minutes per prospect - company size, industry, tech stack, news, key contacts. All manual.

AI: How many prospects do you research daily?

Amanda: Try to do 20. That's 10 hours of research per week.

AI: What information is most valuable?

Amanda: Knowing if they use a competitor product and who the decision maker is.

AI: What's the biggest time waste?

Amanda: Administrative stuff. Logging calls, updating deal stages, writing meeting notes. Probably 2 hours a day that doesn't generate revenue.

AI: What would help you sell more?

Amanda: Automated research - give me a company name and surface key info automatically. And auto-logging of activities.""",

    # Interview 12: Robert Garcia - DevOps Engineer
    """AI: Hi Robert! What are your main responsibilities?

Robert: Keeping production running, CI/CD pipelines, infrastructure provisioning, monitoring, and supporting developers.

AI: How do you handle production incidents?

Robert: Tiered alerting. P1 pages on-call immediately. P2 creates a ticket and Slack notification. P3 is logged for review.

AI: How many incidents per week?

Robert: P1s, 2-3. P2s, 10-15. P3s, dozens.

AI: What's average resolution time for a P1?

Robert: About 45 minutes. A lot of that is diagnosis time.

AI: What slows down diagnosis?

Robert: Monitoring is fragmented. Logs, metrics, traces all in different places. I'm tab-switching between 5 dashboards trying to correlate information.

AI: What would improve incident response?

Robert: Unified observability - one dashboard showing correlated logs, metrics, and traces. And smart runbooks that surface based on alert type.""",

    # Interview 13: Jennifer Adams - VP of Sales
    """AI: Good morning Jennifer. What are your biggest operational challenges?

Jennifer: Three things: forecast accuracy, rep productivity, and pipeline visibility. They're all connected.

AI: What's your current forecast accuracy?

Jennifer: Within 15% on average, but with high variance. Some quarters we nail it, others we're way off.

AI: What causes the variance?

Jennifer: Data quality. Reps are optimistic. We don't have objective indicators of deal health.

AI: What about rep productivity?

Jennifer: Some reps make 50 calls and close nothing. Others make 15 calls and crush quota. The best reps spend more time on research and personalization.

AI: How would you change that?

Jennifer: Measure quality automatically. Score call effectiveness based on conversation analytics instead of just volume.

AI: And pipeline visibility?

Jennifer: I can't get real-time view of where deals stand. Our dashboards are based on yesterday's data at best.""",

    # Interview 14: Chris Martinez - Engineering Manager
    """AI: Hi Chris! How do you structure your team's work?

Chris: Two-week sprints. Planning on Monday, daily standups, Friday demo and retro.

AI: What intervenes most often?

Chris: Unplanned work. Production incidents, urgent bug fixes, sales escalations. About 30% of capacity goes to unplanned work.

AI: How does that affect planning?

Chris: We only commit to 70% of theoretical capacity. Even then, we miss sprint goals 40% of the time.

AI: How do you track all of this?

Chris: Jira for tickets, spreadsheets for capacity planning, Slack for coordination. Information is scattered.

AI: What metrics do you wish you could track?

Chris: Developer experience metrics - how often are devs blocked and why? How long does code review take? Deployment frequency.

AI: What would ideal tooling look like?

Chris: A dashboard showing team health - not just output but leading indicators like PR cycle time, meeting load, interrupt frequency.""",

    # Interview 15: Patricia Brown - CFO
    """AI: Good afternoon Patricia. What are your top operational priorities?

Patricia: Closing speed, forecast accuracy, and cash flow visibility. We're a growing company, which means more complexity.

AI: What's your current close cycle?

Patricia: 7 business days. Industry benchmark for our size is 5 days.

AI: How does that cost you?

Patricia: Management decisions on stale data. If we close January on February 10th, corrective action is delayed two weeks.

AI: What's preventing faster close?

Patricia: Manual reconciliation. 15 bank accounts, 200+ vendors, intercompany transactions. 80% is manual matching.

AI: What percentage could be automated?

Patricia: 60-70% are routine matches. Vendor invoice matches PO matches payment - shouldn't need human verification.

AI: How do you consolidate departmental forecasts?

Patricia: Spreadsheets. Each department submits a template, we consolidate manually. Takes a full week each month.""",

    # Interview 16: Michael Lee - Customer Success Lead
    """AI: Hi Michael! How large is your customer base and team?

Michael: 500 accounts across 5 CSMs. About 100 accounts per person.

AI: How do you prioritize?

Michael: Tiering model. Enterprise - top 50 - gets white-glove. Mid-market gets regular check-ins. SMB is mostly tech-touch.

AI: How effective is tech-touch for SMB?

Michael: Churn rate for SMB is 3x higher than enterprise. We can't catch engagement drops early enough.

AI: What would early detection look like?

Michael: Knowing when a customer stops using key features before they've decided to leave. We see usage data weekly at best.

AI: What's your renewal rate?

Michael: About 85% dollar retention. We want 100%+ with expansion.

AI: What's preventing expansion?

Michael: We don't know when customers are ready. They might hit usage limits and we don't find out until they're frustrated.""",

    # Interview 17: Susan Clark - CMO
    """AI: Good morning Susan. What are your main operational challenges?

Susan: Attribution, speed-to-market, and content volume. Demands have grown faster than our ability to scale.

AI: How do you measure marketing effectiveness?

Susan: Multi-touch attribution. First touch 40%, last touch 40%, middle touches share 20%. But I don't fully trust the data.

AI: What creates the distrust?

Susan: Too many gaps. Different emails, different devices - we're only capturing 60% of the true customer journey.

AI: Tell me about content production.

Susan: We need 50+ pieces per month. Our team can produce maybe 30 without burning out.

AI: Have you explored AI content tools?

Susan: Experimenting. First draft quality is better, but needs heavy editing. Thought leadership content is hard for AI.

AI: What about personalization demands?

Susan: Sales wants content customized by industry, size, persona. A single whitepaper needs 6 variations. We're not set up for that scale.""",

    # Interview 18: Emily White - VP of Product
    """AI: Good afternoon Emily. How do you set product direction?

Emily: Annual planning sets major themes, quarterly OKRs translate into initiatives. PMs own their areas.

AI: How does customer feedback influence the roadmap?

Emily: Multiple inputs - CSM feedback, support tickets, sales requests, user research. Challenge is synthesizing it all.

AI: How do you currently synthesize feedback?

Emily: Productboard aggregates some of it. A lot comes through Slack, emails, meetings. 40% of valuable feedback never makes it to official tracking.

AI: What's the coordination overhead?

Emily: PMs spend about 30% of their time in coordination meetings. Almost 2 days per week not spent on product work.

AI: What kinds of coordination meetings?

Emily: Cross-PM syncs, stakeholder updates, engineering planning, design reviews, launch coordination.

AI: What would help reduce overhead?

Emily: Better async communication tools and clearer decision rights. Less escalation needed.""",

    # Interview 19: James Thompson - CTO
    """AI: Good morning James. What are your top technology priorities?

James: Platform reliability, developer productivity, and technical debt. They're interconnected but compete for resources.

AI: What's your current reliability state?

James: We target 99.9% uptime, mostly achieve it. But "up" doesn't mean "performing well." We meet SLOs about 85% of the time.

AI: What's preventing higher reliability?

James: Observability gaps. We know something is slow, but tracing root cause through microservices takes too long.

AI: Tell me about developer productivity.

James: Our deploy frequency is about 10 per week. Industry leaders are doing 10 per day.

AI: What slows down deploys?

James: Test execution, manual approvals, deployment complexity. CI pipeline takes 45 minutes, which creates batching behavior.

AI: What about technical debt?

James: The invisible tax. About 25% of velocity is lost to working around old code, understanding undocumented systems, fixing bugs from shortcuts.

AI: What would help?

James: Code quality metrics tied to business outcomes. Show the board that tech debt causes X bugs costing Y in customer impact.""",

    # Interview 20: Robert Miller - HR Director
    """AI: Good afternoon Robert. What are your main operational challenges?

Robert: Data-driven decision making, employee experience consistency, and compliance management.

AI: What decisions would benefit from better data?

Robert: Retention risk, compensation benchmarking, training effectiveness. Right now these are mostly gut feel.

AI: How painful is getting the data?

Robert: "What's retention rate by department and tenure?" requires exporting from three systems, cleaning in Excel, manual calculation. A 30-second question becomes a half-day project.

AI: What about employee experience consistency?

Robert: We want every employee to have a great experience from recruiting through offboarding. But it varies by manager.

AI: Give me an example of inconsistency.

Robert: Onboarding. Some new hires have a fantastic first week, others feel abandoned. We don't have visibility until feedback comes - often too late.

AI: What would leading indicators look like?

Robert: Manager meeting frequency with new hires, IT ticket resolution time, training completion rates. Data that tells us if someone is on track before they're off track.

AI: What's the compliance risk?

Robert: Last year we discovered 15% of employees hadn't completed mandatory harassment training. That's an audit finding waiting to happen.""",
]

def create_supabase_client() -> Client:
    """Create Supabase client from environment variables"""
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_KEY")

    if not url or not key:
        print("Error: SUPABASE_URL and SUPABASE_KEY environment variables required")
        print("\nSet them like this:")
        print("  export SUPABASE_URL=https://your-project.supabase.co")
        print("  export SUPABASE_KEY=your-anon-key")
        exit(1)

    return create_client(url, key)


def seed_employees(supabase: Client) -> List[Dict]:
    """Seed 20 sample employees"""
    print("\n1. Seeding employees...")

    employees = []
    for i, emp in enumerate(SAMPLE_EMPLOYEES):
        employee_data = {
            "id": str(uuid.uuid4()),
            "name": emp["name"],
            "phone_number": emp["phone"],
            "email": f"{emp['name'].lower().replace(' ', '.')}@company.com",
            "department": emp["department"],
            "role": emp["role"],
            "status": "active",
            "company": "Acme Corporation",
            "notes": f"Process audit interview conducted. Provided valuable insights about {emp['department']} workflows.",
            "created_at": datetime.utcnow().isoformat()
        }
        employees.append(employee_data)

    try:
        # Insert employees (upsert to avoid duplicates)
        result = supabase.table("employees").upsert(employees, on_conflict="phone_number").execute()
        print(f"   ✓ Seeded {len(result.data)} employees")
        return result.data
    except Exception as e:
        print(f"   ✗ Error seeding employees: {e}")
        return employees


def seed_call_sessions(supabase: Client, employees: List[Dict]) -> List[Dict]:
    """Seed 20 call sessions with transcripts"""
    print("\n2. Seeding call sessions with transcripts...")

    sessions = []
    base_date = datetime.utcnow() - timedelta(days=30)

    for i, (emp, transcript) in enumerate(zip(employees, SAMPLE_TRANSCRIPTS)):
        # Create realistic call timing
        call_date = base_date + timedelta(days=i, hours=random.randint(9, 17))
        duration = random.randint(840, 1620)  # 14-27 minutes

        session_data = {
            "id": str(uuid.uuid4()),
            "phone_number": emp.get("phone_number", SAMPLE_EMPLOYEES[i]["phone"]),
            "direction": "outbound",
            "status": "completed",
            "platform": "vapi",
            "vapi_call_id": f"vapi_{uuid.uuid4().hex[:16]}",
            "transcript": transcript,
            "summary": f"Process audit interview with {emp.get('name', SAMPLE_EMPLOYEES[i]['name'])} from {emp.get('department', SAMPLE_EMPLOYEES[i]['department'])}. Discussed current workflows, pain points, and improvement opportunities.",
            "duration_seconds": duration,
            "started_at": call_date.isoformat(),
            "ended_at": (call_date + timedelta(seconds=duration)).isoformat(),
            "created_at": call_date.isoformat(),
            "metadata": {
                "employee_name": emp.get("name", SAMPLE_EMPLOYEES[i]["name"]),
                "department": emp.get("department", SAMPLE_EMPLOYEES[i]["department"]),
                "interview_type": "process_audit"
            }
        }
        sessions.append(session_data)

    try:
        result = supabase.table("call_sessions").insert(sessions).execute()
        print(f"   ✓ Seeded {len(result.data)} call sessions with transcripts")
        return result.data
    except Exception as e:
        print(f"   ✗ Error seeding call sessions: {e}")
        return sessions


def run_analysis_on_sessions(supabase: Client, sessions: List[Dict]):
    """Optionally trigger AI analysis on seeded sessions"""
    import requests

    base_url = os.environ.get("API_BASE_URL", "https://otom-production-1790.up.railway.app")

    print("\n3. Triggering AI analysis on transcripts...")
    print(f"   Using API: {base_url}")

    analyzed = 0
    for session in sessions[:5]:  # Only analyze first 5 to save API costs
        try:
            response = requests.post(
                f"{base_url}/insights/analyze/{session['id']}",
                timeout=60
            )
            if response.status_code == 200:
                analyzed += 1
                print(f"   ✓ Analyzed session for {session.get('metadata', {}).get('employee_name', 'Unknown')}")
            else:
                print(f"   ✗ Failed to analyze: {response.status_code}")
        except Exception as e:
            print(f"   ✗ Error: {e}")

    print(f"\n   Analyzed {analyzed}/{min(5, len(sessions))} sessions")


def main():
    """Main function to run the seeding script"""
    print("=" * 60)
    print("Otom AI - Transcript Seeding Script")
    print("=" * 60)

    # Create Supabase client
    supabase = create_supabase_client()
    print("✓ Connected to Supabase")

    # Seed employees
    employees = seed_employees(supabase)

    # Seed call sessions with transcripts
    sessions = seed_call_sessions(supabase, employees)

    # Ask if user wants to run analysis
    print("\n" + "=" * 60)
    print("Seeding complete!")
    print(f"  - {len(employees)} employees created")
    print(f"  - {len(sessions)} call sessions with transcripts created")
    print("=" * 60)

    # Optional: Run analysis
    run_analysis = input("\nDo you want to run AI analysis on first 5 transcripts? (y/N): ")
    if run_analysis.lower() == 'y':
        run_analysis_on_sessions(supabase, sessions)

    print("\nDone! You can now view the data in your dashboard.")


if __name__ == "__main__":
    main()
