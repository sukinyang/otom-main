export interface InterviewLog {
  id: string;
  date: string;
  time: string;
  duration: string;
  interviewer: string;
  type: 'Monthly Audit' | 'Follow-up' | 'Initial' | 'Quarterly Review';
  status: 'completed' | 'scheduled' | 'cancelled' | 'missed';
  sentiment?: 'Positive' | 'Neutral' | 'Negative';
  engagementScore?: number;
  keyTopics?: string[];
  summary?: string;
  insights?: {
    improvements: string[];
    concerns: string[];
    strengths: string[];
  };
  transcript?: string;
}

export interface Employee {
  id: string;
  name: string;
  role: string;
  department: string;
  status: 'completed' | 'scheduled' | 'pending';
  email: string;
  phone: string;
  interviewDate: string | null;
  interviewTime: string | null;
  manager: string;
  engagement: 'High' | 'Medium' | 'Low';
  tenure: string;
  location: string;
}

// Interview logs for each employee
export const interviewLogsData: Record<string, InterviewLog[]> = {
  'sarah-johnson': [
    {
      id: 'sj-int-001',
      date: '2024-01-15',
      time: '10:00 AM',
      duration: '45 min',
      interviewer: 'AI Assistant',
      type: 'Monthly Audit',
      status: 'completed',
      sentiment: 'Positive',
      engagementScore: 92,
      keyTopics: ['Process workflows', 'Team collaboration', 'System challenges'],
      summary: 'Sarah demonstrated excellent process knowledge and identified key bottlenecks in order processing.',
      insights: {
        improvements: ['Automate data entry between CRM and ERP', 'Implement real-time tracking'],
        concerns: ['Legacy system limitations', 'Manual approval delays'],
        strengths: ['Cross-team collaboration', 'Process documentation']
      },
      transcript: `AI Assistant: Good morning, Sarah. Thank you for joining today's monthly audit interview. How are you doing today?

Sarah Johnson: Good morning! I'm doing well, thank you. Ready to dive in.

AI Assistant: Great to hear. Let's start by discussing your current process workflows. Can you walk me through your typical day-to-day operations?

Sarah Johnson: Sure. My day usually starts with checking the order queue in our ERP system. I review any overnight orders, flag urgent ones, and then coordinate with the warehouse team on fulfillment priorities.

AI Assistant: That sounds like a structured approach. What would you say are the main challenges you face in this workflow?

Sarah Johnson: The biggest challenge is definitely the manual data entry between our CRM and ERP systems. When a sales rep closes a deal, I have to manually transfer that information, which takes time and sometimes leads to errors.

AI Assistant: I see. How often do these errors occur, and what's the typical impact?

Sarah Johnson: I'd say maybe 2-3 times a week we catch something that needs correction. Usually it's minor - wrong quantities or shipping addresses. But it delays the order by at least a few hours while we sort it out.

AI Assistant: That's valuable insight. What about team collaboration? How do you coordinate with other departments?

Sarah Johnson: We've gotten much better at this actually. We have daily standups with the warehouse team, and I've set up a Slack channel for real-time updates. The sales team pings me there if there's anything urgent.

AI Assistant: Excellent. It sounds like you've built strong cross-team communication. Any areas where you think collaboration could improve?

Sarah Johnson: Honestly, the approval process for large orders is still a bottleneck. We need sign-off from finance for anything over $50k, and sometimes that takes days when people are traveling or in back-to-back meetings.

AI Assistant: Thank you for sharing that. Before we wrap up, are there any tools or process improvements you'd recommend?

Sarah Johnson: I'd love to see real-time tracking implemented so customers can see where their orders are. Also, automating that CRM to ERP data transfer would save me probably 5-6 hours a week.

AI Assistant: Those are excellent suggestions. Thank you for your time today, Sarah. Your insights are incredibly valuable for our process improvement initiatives.

Sarah Johnson: Happy to help! Let me know if you need any follow-up information.`
    },
    {
      id: 'sj-int-002',
      date: '2023-12-12',
      time: '2:00 PM',
      duration: '38 min',
      interviewer: 'AI Assistant',
      type: 'Monthly Audit',
      status: 'completed',
      sentiment: 'Positive',
      engagementScore: 88,
      keyTopics: ['Holiday planning', 'Resource allocation', 'Budget concerns'],
      summary: 'Discussed year-end challenges and planning for Q1. Identified resource gaps.',
      insights: {
        improvements: ['Better resource forecasting', 'Automated scheduling'],
        concerns: ['Staff availability during holidays'],
        strengths: ['Proactive planning', 'Team coordination']
      }
    },
    {
      id: 'sj-int-003',
      date: '2023-11-08',
      time: '11:00 AM',
      duration: '42 min',
      interviewer: 'AI Assistant',
      type: 'Monthly Audit',
      status: 'completed',
      sentiment: 'Neutral',
      engagementScore: 75,
      keyTopics: ['System updates', 'Training needs', 'Process changes'],
      summary: 'Reviewed recent system updates and their impact on daily operations.',
      insights: {
        improvements: ['More training on new features', 'Better documentation'],
        concerns: ['Learning curve for new tools'],
        strengths: ['Adaptability', 'Willingness to learn']
      }
    },
    {
      id: 'sj-int-004',
      date: '2023-10-10',
      time: '10:30 AM',
      duration: '50 min',
      interviewer: 'AI Assistant',
      type: 'Quarterly Review',
      status: 'completed',
      sentiment: 'Positive',
      engagementScore: 95,
      keyTopics: ['Q3 achievements', 'Goals review', 'Career development'],
      summary: 'Comprehensive quarterly review with excellent engagement and clear goal alignment.',
      insights: {
        improvements: ['Leadership training opportunity', 'Cross-department projects'],
        concerns: [],
        strengths: ['Goal achievement', 'Initiative', 'Leadership potential']
      }
    }
  ],
  'emma-davis': [
    {
      id: 'ed-int-001',
      date: '2024-01-12',
      time: '2:00 PM',
      duration: '40 min',
      interviewer: 'AI Assistant',
      type: 'Monthly Audit',
      status: 'completed',
      sentiment: 'Positive',
      engagementScore: 85,
      keyTopics: ['HR processes', 'Onboarding workflows', 'Employee satisfaction'],
      summary: 'Emma provided valuable insights into HR process improvements and onboarding challenges.',
      insights: {
        improvements: ['Streamline onboarding checklist', 'Automate document collection'],
        concerns: ['Manual paperwork processes'],
        strengths: ['Employee relations', 'Process optimization ideas']
      }
    },
    {
      id: 'ed-int-002',
      date: '2023-12-08',
      time: '3:00 PM',
      duration: '35 min',
      interviewer: 'AI Assistant',
      type: 'Monthly Audit',
      status: 'completed',
      sentiment: 'Positive',
      engagementScore: 82,
      keyTopics: ['Year-end reviews', 'Benefits administration', 'Compliance'],
      summary: 'Discussed year-end HR activities and compliance requirements.',
      insights: {
        improvements: ['Digital signature implementation', 'Self-service portal'],
        concerns: ['Deadline pressures during year-end'],
        strengths: ['Attention to detail', 'Compliance knowledge']
      }
    }
  ],
  'lisa-rodriguez': [
    {
      id: 'lr-int-001',
      date: '2024-01-10',
      time: '9:00 AM',
      duration: '55 min',
      interviewer: 'AI Assistant',
      type: 'Monthly Audit',
      status: 'completed',
      sentiment: 'Positive',
      engagementScore: 90,
      keyTopics: ['IT infrastructure', 'Security protocols', 'System integrations'],
      summary: 'Detailed technical discussion about infrastructure improvements and security enhancements.',
      insights: {
        improvements: ['Cloud migration phases', 'API standardization'],
        concerns: ['Legacy system maintenance costs'],
        strengths: ['Technical expertise', 'Strategic thinking']
      }
    },
    {
      id: 'lr-int-002',
      date: '2023-12-05',
      time: '10:00 AM',
      duration: '48 min',
      interviewer: 'AI Assistant',
      type: 'Monthly Audit',
      status: 'completed',
      sentiment: 'Neutral',
      engagementScore: 78,
      keyTopics: ['Vendor management', 'Budget planning', 'Team capacity'],
      summary: 'Reviewed vendor contracts and discussed budget allocation for next quarter.',
      insights: {
        improvements: ['Vendor consolidation', 'Contract renegotiation'],
        concerns: ['Budget constraints', 'Hiring freeze impact'],
        strengths: ['Vendor relationships', 'Cost management']
      }
    },
    {
      id: 'lr-int-003',
      date: '2023-11-02',
      time: '11:30 AM',
      duration: '45 min',
      interviewer: 'AI Assistant',
      type: 'Monthly Audit',
      status: 'completed',
      sentiment: 'Positive',
      engagementScore: 88,
      keyTopics: ['Cybersecurity training', 'Incident response', 'Tool adoption'],
      summary: 'Focused on security initiatives and team training programs.',
      insights: {
        improvements: ['Phishing awareness training', 'Incident playbooks'],
        concerns: [],
        strengths: ['Security-first mindset', 'Team development']
      }
    }
  ],
  'anna-thompson': [
    {
      id: 'at-int-001',
      date: '2024-01-08',
      time: '3:00 PM',
      duration: '42 min',
      interviewer: 'AI Assistant',
      type: 'Monthly Audit',
      status: 'completed',
      sentiment: 'Positive',
      engagementScore: 87,
      keyTopics: ['Customer feedback', 'Support processes', 'Retention strategies'],
      summary: 'Anna shared insights on customer success metrics and retention improvements.',
      insights: {
        improvements: ['Proactive outreach automation', 'Health score dashboard'],
        concerns: ['Response time during peak hours'],
        strengths: ['Customer empathy', 'Problem resolution']
      }
    }
  ],
  'rachel-brown': [
    {
      id: 'rb-int-001',
      date: '2024-01-05',
      time: '10:30 AM',
      duration: '50 min',
      interviewer: 'AI Assistant',
      type: 'Monthly Audit',
      status: 'completed',
      sentiment: 'Positive',
      engagementScore: 91,
      keyTopics: ['Development workflows', 'Code review process', 'Technical debt'],
      summary: 'Thorough discussion about engineering practices and technical improvements.',
      insights: {
        improvements: ['CI/CD pipeline optimization', 'Automated testing coverage'],
        concerns: ['Technical debt accumulation'],
        strengths: ['Code quality focus', 'Best practices advocacy']
      }
    },
    {
      id: 'rb-int-002',
      date: '2023-12-01',
      time: '2:00 PM',
      duration: '45 min',
      interviewer: 'AI Assistant',
      type: 'Monthly Audit',
      status: 'completed',
      sentiment: 'Positive',
      engagementScore: 85,
      keyTopics: ['Sprint planning', 'Team dynamics', 'Knowledge sharing'],
      summary: 'Discussed agile practices and team collaboration improvements.',
      insights: {
        improvements: ['Documentation standards', 'Pair programming sessions'],
        concerns: ['Knowledge silos'],
        strengths: ['Mentorship', 'Collaboration']
      }
    }
  ],
  'robert-garcia': [
    {
      id: 'rg-int-001',
      date: '2024-01-03',
      time: '11:30 AM',
      duration: '48 min',
      interviewer: 'AI Assistant',
      type: 'Monthly Audit',
      status: 'completed',
      sentiment: 'Positive',
      engagementScore: 89,
      keyTopics: ['Infrastructure automation', 'Deployment processes', 'Monitoring'],
      summary: 'Robert provided excellent insights on DevOps improvements and automation opportunities.',
      insights: {
        improvements: ['Infrastructure as code expansion', 'Alert optimization'],
        concerns: ['On-call burden'],
        strengths: ['Automation expertise', 'Reliability focus']
      }
    }
  ],
  'david-wilson': [
    {
      id: 'dw-int-001',
      date: '2024-01-18',
      time: '11:00 AM',
      duration: '45 min',
      interviewer: 'AI Assistant',
      type: 'Monthly Audit',
      status: 'scheduled',
      keyTopics: ['Financial reporting', 'Budget processes', 'Compliance']
    },
    {
      id: 'dw-int-002',
      date: '2023-12-15',
      time: '10:00 AM',
      duration: '40 min',
      interviewer: 'AI Assistant',
      type: 'Monthly Audit',
      status: 'completed',
      sentiment: 'Neutral',
      engagementScore: 76,
      keyTopics: ['Year-end closing', 'Audit preparation', 'Process documentation'],
      summary: 'Discussed year-end financial processes and audit readiness.',
      insights: {
        improvements: ['Automated reconciliation', 'Real-time reporting'],
        concerns: ['Manual data consolidation'],
        strengths: ['Accuracy', 'Compliance focus']
      }
    }
  ],
  'james-miller': [
    {
      id: 'jm-int-001',
      date: '2024-01-20',
      time: '1:00 PM',
      duration: '45 min',
      interviewer: 'AI Assistant',
      type: 'Monthly Audit',
      status: 'scheduled',
      keyTopics: ['Product roadmap', 'Feature prioritization', 'Stakeholder feedback']
    }
  ],
  'amanda-white': [
    {
      id: 'aw-int-001',
      date: '2024-01-22',
      time: '4:00 PM',
      duration: '45 min',
      interviewer: 'AI Assistant',
      type: 'Monthly Audit',
      status: 'scheduled',
      keyTopics: ['Sales pipeline', 'Customer outreach', 'CRM usage']
    }
  ],
  'mike-chen': [],
  'tom-anderson': [],
  'kevin-lee': []
};

export const employeesData: Employee[] = [
  {
    id: 'sarah-johnson',
    name: 'Sarah Johnson',
    role: 'Operations Manager',
    department: 'Operations',
    status: 'completed',
    email: 'sarah.johnson@company.com',
    phone: '+1 (555) 123-4567',
    interviewDate: '2024-01-15',
    interviewTime: '10:00 AM',
    manager: 'David Wilson',
    engagement: 'High',
    tenure: '3 years',
    location: 'New York, NY'
  },
  {
    id: 'mike-chen',
    name: 'Mike Chen',
    role: 'Sales Director',
    department: 'Sales',
    status: 'pending',
    email: 'mike.chen@company.com',
    phone: '+1 (555) 234-5678',
    interviewDate: null,
    interviewTime: null,
    manager: 'Jennifer Adams',
    engagement: 'Medium',
    tenure: '2 years',
    location: 'San Francisco, CA'
  },
  {
    id: 'emma-davis',
    name: 'Emma Davis',
    role: 'HR Specialist',
    department: 'HR',
    status: 'completed',
    email: 'emma.davis@company.com',
    phone: '+1 (555) 345-6789',
    interviewDate: '2024-01-12',
    interviewTime: '2:00 PM',
    manager: 'Robert Miller',
    engagement: 'High',
    tenure: '4 years',
    location: 'Chicago, IL'
  },
  {
    id: 'david-wilson',
    name: 'David Wilson',
    role: 'Finance Lead',
    department: 'Finance',
    status: 'scheduled',
    email: 'david.wilson@company.com',
    phone: '+1 (555) 456-7890',
    interviewDate: '2024-01-18',
    interviewTime: '11:00 AM',
    manager: 'Patricia Brown',
    engagement: 'High',
    tenure: '5 years',
    location: 'Boston, MA'
  },
  {
    id: 'lisa-rodriguez',
    name: 'Lisa Rodriguez',
    role: 'IT Manager',
    department: 'IT',
    status: 'completed',
    email: 'lisa.rodriguez@company.com',
    phone: '+1 (555) 567-8901',
    interviewDate: '2024-01-10',
    interviewTime: '9:00 AM',
    manager: 'James Thompson',
    engagement: 'High',
    tenure: '6 years',
    location: 'Austin, TX'
  },
  {
    id: 'tom-anderson',
    name: 'Tom Anderson',
    role: 'Marketing Head',
    department: 'Marketing',
    status: 'pending',
    email: 'tom.anderson@company.com',
    phone: '+1 (555) 678-9012',
    interviewDate: null,
    interviewTime: null,
    manager: 'Susan Clark',
    engagement: 'Low',
    tenure: '1 year',
    location: 'Seattle, WA'
  },
  {
    id: 'anna-thompson',
    name: 'Anna Thompson',
    role: 'Customer Success Manager',
    department: 'Customer Success',
    status: 'completed',
    email: 'anna.thompson@company.com',
    phone: '+1 (555) 789-0123',
    interviewDate: '2024-01-08',
    interviewTime: '3:00 PM',
    manager: 'Michael Lee',
    engagement: 'High',
    tenure: '2 years',
    location: 'Denver, CO'
  },
  {
    id: 'james-miller',
    name: 'James Miller',
    role: 'Product Manager',
    department: 'Product',
    status: 'scheduled',
    email: 'james.miller@company.com',
    phone: '+1 (555) 890-1234',
    interviewDate: '2024-01-20',
    interviewTime: '1:00 PM',
    manager: 'Emily White',
    engagement: 'Medium',
    tenure: '3 years',
    location: 'Portland, OR'
  },
  {
    id: 'rachel-brown',
    name: 'Rachel Brown',
    role: 'Software Engineer',
    department: 'Engineering',
    status: 'completed',
    email: 'rachel.brown@company.com',
    phone: '+1 (555) 901-2345',
    interviewDate: '2024-01-05',
    interviewTime: '10:30 AM',
    manager: 'Chris Martinez',
    engagement: 'High',
    tenure: '4 years',
    location: 'San Jose, CA'
  },
  {
    id: 'kevin-lee',
    name: 'Kevin Lee',
    role: 'UX Designer',
    department: 'Product',
    status: 'pending',
    email: 'kevin.lee@company.com',
    phone: '+1 (555) 012-3456',
    interviewDate: null,
    interviewTime: null,
    manager: 'Emily White',
    engagement: 'Medium',
    tenure: '1 year',
    location: 'Los Angeles, CA'
  },
  {
    id: 'amanda-white',
    name: 'Amanda White',
    role: 'Sales Representative',
    department: 'Sales',
    status: 'scheduled',
    email: 'amanda.white@company.com',
    phone: '+1 (555) 123-4567',
    interviewDate: '2024-01-22',
    interviewTime: '4:00 PM',
    manager: 'Mike Chen',
    engagement: 'High',
    tenure: '2 years',
    location: 'Miami, FL'
  },
  {
    id: 'robert-garcia',
    name: 'Robert Garcia',
    role: 'DevOps Engineer',
    department: 'Engineering',
    status: 'completed',
    email: 'robert.garcia@company.com',
    phone: '+1 (555) 234-5678',
    interviewDate: '2024-01-03',
    interviewTime: '11:30 AM',
    manager: 'Chris Martinez',
    engagement: 'High',
    tenure: '3 years',
    location: 'Atlanta, GA'
  }
];

// Helper function to get employee by ID
export const getEmployeeById = (id: string): Employee | undefined => {
  return employeesData.find(emp => emp.id === id);
};

// Helper function to get interview logs by employee ID
export const getInterviewLogs = (employeeId: string): InterviewLog[] => {
  return interviewLogsData[employeeId] || [];
};

// Helper function to get latest completed interview
export const getLatestCompletedInterview = (employeeId: string): InterviewLog | undefined => {
  const logs = getInterviewLogs(employeeId);
  return logs.find(log => log.status === 'completed');
};

// Helper function to format interview status for display
export const formatInterviewStatus = (employee: Employee): { label: string; detail: string } => {
  switch (employee.status) {
    case 'completed':
      return {
        label: 'Completed',
        detail: employee.interviewDate 
          ? new Date(employee.interviewDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
          : '—'
      };
    case 'scheduled':
      return {
        label: 'Scheduled',
        detail: employee.interviewTime || '—'
      };
    case 'pending':
      return {
        label: 'Pending',
        detail: "Hasn't booked"
      };
  }
};

// Stats helper
export const getEmployeeStats = () => {
  return {
    total: employeesData.length,
    completed: employeesData.filter(e => e.status === 'completed').length,
    scheduled: employeesData.filter(e => e.status === 'scheduled').length,
    pending: employeesData.filter(e => e.status === 'pending').length,
  };
};

// Get total interview count across all employees
export const getTotalInterviewCount = (): number => {
  return Object.values(interviewLogsData).reduce((total, logs) => total + logs.filter(l => l.status === 'completed').length, 0);
};
