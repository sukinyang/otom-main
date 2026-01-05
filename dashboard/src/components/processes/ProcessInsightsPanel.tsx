import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { 
  AlertTriangle, FileSpreadsheet, Copy, GitBranch, 
  Users, Zap, MessageSquare, UserCheck, HelpCircle, Lightbulb, Eye, EyeOff, Quote, ExternalLink
} from 'lucide-react';

// Types for interview-backed insights
interface InterviewQuote {
  employeeId: string;
  employeeName: string;
  role: string;
  department: string;
  quote: string;
  sentiment: 'positive' | 'negative' | 'neutral' | 'frustrated';
  interviewDate: string;
  interviewDepth: 'deep-dive' | 'detailed' | 'brief' | 'passing' | 'dismissive';
}

type ConfidenceLevel = 'high' | 'medium' | 'low' | 'unverified';

interface InsightBase {
  id: number;
  title: string;
  synthesizedDescription: string;
  confidenceLevel: ConfidenceLevel;
  supportingQuotes: InterviewQuote[];
  mentionCount: number;
  departments: string[];
  status: 'investigating' | 'confirmed' | 'addressed';
  employeeSuggestions?: {
    suggestion: string;
    suggestedBy: InterviewQuote;
  }[];
  knowledgeGaps?: string[];
  contradictions?: {
    claim1: InterviewQuote;
    claim2: InterviewQuote;
  }[];
}

interface BottleneckInsight extends InsightBase {
  type: 'bottleneck';
  frequencyMentioned: string;
}

interface ShadowProcessInsight extends InsightBase {
  type: 'shadow';
  toolName: string;
  reasonsGiven: InterviewQuote[];
}

interface DuplicateWorkInsight extends InsightBase {
  type: 'duplicate';
  duplicatedAcross: string[];
}

interface FrictionInsight extends InsightBase {
  type: 'friction';
  fromDepartment: string;
  toDepartment: string;
}

type AnyInsight = BottleneckInsight | ShadowProcessInsight | DuplicateWorkInsight | FrictionInsight;

// Sample interview-backed data
const bottleneckInsights: BottleneckInsight[] = [
  {
    id: 1,
    type: 'bottleneck',
    title: 'Invoice Approval Delays',
    synthesizedDescription: 'Invoices over $5K require 4 approvals, causing 5-7 day delays. Vendors calling for payment status ~3x weekly per AP staff.',
    confidenceLevel: 'high',
    frequencyMentioned: 'mentioned by 6 of 8 Finance employees interviewed',
    mentionCount: 6,
    departments: ['Finance'],
    status: 'confirmed',
    supportingQuotes: [
      {
        employeeId: 'emp-12',
        employeeName: 'Sarah Chen',
        role: 'Senior Accountant',
        department: 'Finance',
        quote: "Every invoice over five grand needs like... four different signatures? And I've literally had invoices sitting on someone's desk for a week because they were traveling. Vendors are calling me like 'where's our money?' and I'm like... I don't know, ask Bob in procurement.",
        sentiment: 'frustrated',
        interviewDate: '2024-01-15',
        interviewDepth: 'deep-dive'
      },
      {
        employeeId: 'emp-15',
        employeeName: 'Michael Torres',
        role: 'AP Specialist',
        department: 'Finance',
        quote: "Yeah the approval chain is... it's a lot. I don't really know all the details but there's multiple people who have to sign off on stuff.",
        sentiment: 'neutral',
        interviewDate: '2024-01-16',
        interviewDepth: 'brief'
      },
      {
        employeeId: 'emp-18',
        employeeName: 'Jennifer Walsh',
        role: 'Finance Manager',
        department: 'Finance',
        quote: "Look, we have controls for a reason. But yeah, I'll admit the thresholds might be... they could probably use a look. Some of my team has mentioned tiered approvals, which honestly isn't a bad idea.",
        sentiment: 'neutral',
        interviewDate: '2024-01-18',
        interviewDepth: 'detailed'
      }
    ],
    employeeSuggestions: [
      {
        suggestion: 'Implement tiered approval: auto-approve <$1K, single approval $1K-$5K, full chain >$5K only',
        suggestedBy: {
          employeeId: 'emp-18',
          employeeName: 'Jennifer Walsh',
          role: 'Finance Manager',
          department: 'Finance',
          quote: "I've been thinking about this - what if we did like, auto-approve anything under a thousand bucks? Single approval up to five K, and then the full chain only for the big stuff? That would cut out like... half our volume probably.",
          sentiment: 'positive',
          interviewDate: '2024-01-18',
          interviewDepth: 'detailed'
        }
      }
    ],
    knowledgeGaps: [
      'Specific approval thresholds not confirmed across all interviewees',
      'Unclear if digital signatures would be accepted'
    ]
  },
  {
    id: 2,
    type: 'bottleneck',
    title: 'Cross-Department Data Access Requests',
    synthesizedDescription: 'Sales forecast data requires manual Slack request to Sales team, causing 4-8 hour delays. Operations makes ~5 requests/week for capacity planning.',
    confidenceLevel: 'high',
    frequencyMentioned: 'mentioned by 12 employees across 4 departments',
    mentionCount: 12,
    departments: ['Operations', 'Sales', 'Marketing', 'Finance'],
    status: 'confirmed',
    supportingQuotes: [
      {
        employeeId: 'emp-22',
        employeeName: 'David Park',
        role: 'Operations Manager',
        department: 'Operations',
        quote: "So for capacity planning I need sales forecast data, right? But I literally have to Slack someone on the sales team and be like 'hey can you export this for me?' And then wait. Every. Single. Week. It's ridiculous.",
        sentiment: 'frustrated',
        interviewDate: '2024-01-17',
        interviewDepth: 'deep-dive'
      },
      {
        employeeId: 'emp-8',
        employeeName: 'Lisa Martinez',
        role: 'Sales Rep',
        department: 'Sales',
        quote: "Oh yeah people ping me for data all the time. It's like... I get it, they need it, but I'm trying to sell here. Every export I do is time away from customers.",
        sentiment: 'negative',
        interviewDate: '2024-01-14',
        interviewDepth: 'brief'
      }
    ],
    employeeSuggestions: [
      {
        suggestion: 'Self-service dashboard where departments can pull their own reports',
        suggestedBy: {
          employeeId: 'emp-22',
          employeeName: 'David Park',
          role: 'Operations Manager',
          department: 'Operations',
          quote: "Just... give us a dashboard? Like I can pull my own data? We're all grown adults here, I don't need to go through a gatekeeper to see basic sales numbers. It's 2024.",
          sentiment: 'frustrated',
          interviewDate: '2024-01-17',
          interviewDepth: 'deep-dive'
        }
      }
    ],
    contradictions: [
      {
        claim1: {
          employeeId: 'emp-22',
          employeeName: 'David Park',
          role: 'Operations Manager',
          department: 'Operations',
          quote: "There's no centralized system. Everything is like... in its own little silo. Sales has their stuff, finance has theirs, nobody can see anything.",
          sentiment: 'frustrated',
          interviewDate: '2024-01-17',
          interviewDepth: 'deep-dive'
        },
        claim2: {
          employeeId: 'emp-31',
          employeeName: 'Kevin Nguyen',
          role: 'IT Director',
          department: 'IT',
          quote: "We actually do have a data warehouse. Not everyone has access yet - the rollout has been... slower than we'd like - but it exists. We're getting there.",
          sentiment: 'neutral',
          interviewDate: '2024-01-19',
          interviewDepth: 'detailed'
        }
      }
    ]
  },
  {
    id: 3,
    type: 'bottleneck',
    title: 'Meeting Overload',
    synthesizedDescription: 'Managers report 25-35 hrs/week in meetings, leaving actual work for evenings. Engineering leads average 6 recurring meetings daily.',
    confidenceLevel: 'medium',
    frequencyMentioned: 'mentioned by 5 managers unprompted',
    mentionCount: 5,
    departments: ['Engineering', 'Product', 'Operations'],
    status: 'investigating',
    supportingQuotes: [
      {
        employeeId: 'emp-45',
        employeeName: 'Rachel Kim',
        role: 'Engineering Manager',
        department: 'Engineering',
        quote: "I'm in meetings literally all day. By the time I actually have time to do like... actual work? Everyone's gone home. So then I'm working at night. It's not sustainable, honestly.",
        sentiment: 'frustrated',
        interviewDate: '2024-01-20',
        interviewDepth: 'detailed'
      },
      {
        employeeId: 'emp-47',
        employeeName: 'Tom Bradley',
        role: 'Product Manager',
        department: 'Product',
        quote: "I mean meetings are just... part of the job, you know? Could we be more efficient? Probably. But it is what it is.",
        sentiment: 'neutral',
        interviewDate: '2024-01-20',
        interviewDepth: 'brief'
      }
    ],
    knowledgeGaps: [
      'No concrete data on actual hours spent in meetings',
      'Unclear if this is role-specific or company-wide'
    ]
  }
];

const shadowProcessInsights: ShadowProcessInsight[] = [
  {
    id: 1,
    type: 'shadow',
    title: 'Personal Spreadsheet Usage',
    toolName: 'Personal Excel/Google Sheets',
    synthesizedDescription: '9 employees maintain personal spreadsheets tracking same data as official systems. Est. 2-3 hrs/week per person on duplicate data entry.',
    confidenceLevel: 'high',
    mentionCount: 9,
    departments: ['Finance', 'Operations', 'Sales'],
    status: 'confirmed',
    supportingQuotes: [
      {
        employeeId: 'emp-12',
        employeeName: 'Sarah Chen',
        role: 'Senior Accountant',
        department: 'Finance',
        quote: "Don't tell anyone but I have my own spreadsheet. The system is just... it doesn't show me what I need at a glance, you know? So I made my own thing. I'm not the only one either.",
        sentiment: 'neutral',
        interviewDate: '2024-01-15',
        interviewDepth: 'deep-dive'
      },
      {
        employeeId: 'emp-28',
        employeeName: 'James Wilson',
        role: 'Operations Analyst',
        department: 'Operations',
        quote: "Oh everyone has their own spreadsheets. That's like... that's an open secret around here. [laughs] It's how we actually get work done.",
        sentiment: 'neutral',
        interviewDate: '2024-01-18',
        interviewDepth: 'brief'
      }
    ],
    reasonsGiven: [
      {
        employeeId: 'emp-12',
        employeeName: 'Sarah Chen',
        role: 'Senior Accountant',
        department: 'Finance',
        quote: "The official system takes like... so many clicks to get to what I need. I just need quick visibility. Is that too much to ask?",
        sentiment: 'negative',
        interviewDate: '2024-01-15',
        interviewDepth: 'deep-dive'
      },
      {
        employeeId: 'emp-34',
        employeeName: 'Maria Santos',
        role: 'Sales Coordinator',
        department: 'Sales',
        quote: "The CRM doesn't let me customize views the way I want. Like I can't rearrange columns or filter the way I need to. So I export to Excel and work there. It's dumb but it's faster.",
        sentiment: 'neutral',
        interviewDate: '2024-01-19',
        interviewDepth: 'detailed'
      }
    ],
    employeeSuggestions: [
      {
        suggestion: 'Add customizable dashboard views with drag-drop columns and saved filters',
        suggestedBy: {
          employeeId: 'emp-12',
          employeeName: 'Sarah Chen',
          role: 'Senior Accountant',
          department: 'Finance',
          quote: "If I could just... make my own views in the system? Like drag and drop the columns I want, save my filters? I wouldn't need my spreadsheet at all. That's literally all I'm asking for.",
          sentiment: 'positive',
          interviewDate: '2024-01-15',
          interviewDepth: 'deep-dive'
        }
      }
    ]
  },
  {
    id: 2,
    type: 'shadow',
    title: 'Personal Messaging for Work',
    toolName: 'WhatsApp/iMessage',
    synthesizedDescription: 'Sales uses WhatsApp for client comms (~40% of deals), Field Ops texts team from sites due to slow Teams mobile app.',
    confidenceLevel: 'medium',
    mentionCount: 4,
    departments: ['Sales', 'Operations'],
    status: 'investigating',
    supportingQuotes: [
      {
        employeeId: 'emp-8',
        employeeName: 'Lisa Martinez',
        role: 'Sales Rep',
        department: 'Sales',
        quote: "WhatsApp is just easier for quick stuff with clients. They're already on there anyway. What am I gonna do, make them download Slack? They won't do that.",
        sentiment: 'neutral',
        interviewDate: '2024-01-14',
        interviewDepth: 'brief'
      },
      {
        employeeId: 'emp-55',
        employeeName: 'Carlos Reyes',
        role: 'Field Operations',
        department: 'Operations',
        quote: "When I'm on site, Teams is just... it's so slow. Takes forever to load. I just text my team. It's faster.",
        sentiment: 'neutral',
        interviewDate: '2024-01-21',
        interviewDepth: 'passing'
      }
    ],
    reasonsGiven: [
      {
        employeeId: 'emp-8',
        employeeName: 'Lisa Martinez',
        role: 'Sales Rep',
        department: 'Sales',
        quote: "Slack is for internal stuff. Clients don't want to download another app just to talk to us. They're already on WhatsApp, so that's where we meet them.",
        sentiment: 'neutral',
        interviewDate: '2024-01-14',
        interviewDepth: 'brief'
      }
    ],
    knowledgeGaps: [
      'Unclear how widespread this practice is',
      'No information on what types of work content is shared'
    ]
  }
];

const duplicateWorkInsights: DuplicateWorkInsight[] = [
  {
    id: 1,
    type: 'duplicate',
    title: 'Customer Data Entry',
    synthesizedDescription: 'Customer data entered in 3 systems (CRM, Billing, Support). ~6 hrs/week wasted on duplicate entry, 15% address mismatch rate between systems.',
    confidenceLevel: 'high',
    mentionCount: 7,
    departments: ['Sales', 'Support', 'Finance'],
    duplicatedAcross: ['CRM', 'Billing System', 'Support Ticketing'],
    status: 'confirmed',
    supportingQuotes: [
      {
        employeeId: 'emp-34',
        employeeName: 'Maria Santos',
        role: 'Sales Coordinator',
        department: 'Sales',
        quote: "When we close a deal, I put everything in Salesforce. Then I have to enter it AGAIN in the billing system. And if the address changes later? I have to remember to update both. Which I don't always remember to do.",
        sentiment: 'frustrated',
        interviewDate: '2024-01-19',
        interviewDepth: 'detailed'
      },
      {
        employeeId: 'emp-42',
        employeeName: 'Amy Chen',
        role: 'Support Lead',
        department: 'Support',
        quote: "Half my team's time is just... looking up customer info that doesn't match between systems. 'Which one is right? This says they're in Texas, that says California.' I get that question literally every day.",
        sentiment: 'frustrated',
        interviewDate: '2024-01-20',
        interviewDepth: 'deep-dive'
      }
    ],
    employeeSuggestions: [
      {
        suggestion: 'Single source of truth for customer data that syncs to other systems',
        suggestedBy: {
          employeeId: 'emp-42',
          employeeName: 'Amy Chen',
          role: 'Support Lead',
          department: 'Support',
          quote: "We just need one place where the customer info lives. I don't care which system it is, just pick one. And then everything else pulls from that. That's it. That's the fix.",
          sentiment: 'neutral',
          interviewDate: '2024-01-20',
          interviewDepth: 'deep-dive'
        }
      }
    ]
  },
  {
    id: 2,
    type: 'duplicate',
    title: 'Status Reporting',
    synthesizedDescription: 'Engineering managers write 3 weekly reports (team, product, exec) with 70% content overlap. ~4 hrs/week per manager on report writing.',
    confidenceLevel: 'medium',
    mentionCount: 4,
    departments: ['Engineering', 'Product'],
    duplicatedAcross: ['Engineering Weekly', 'Product Updates', 'Exec Summary'],
    status: 'investigating',
    supportingQuotes: [
      {
        employeeId: 'emp-45',
        employeeName: 'Rachel Kim',
        role: 'Engineering Manager',
        department: 'Engineering',
        quote: "Every week I write an update for my team. Then I summarize it for product. Then I summarize THAT for the exec team. It's like... the same information in three different formats. There's gotta be a better way.",
        sentiment: 'frustrated',
        interviewDate: '2024-01-20',
        interviewDepth: 'detailed'
      }
    ],
    knowledgeGaps: [
      'Unclear how many hours are spent on overlapping reports',
      'Not confirmed if other departments have similar issues'
    ]
  }
];

const frictionInsights: FrictionInsight[] = [
  {
    id: 1,
    type: 'friction',
    title: 'Contract-to-Invoice Handoff',
    synthesizedDescription: 'Signed contracts sit 3-5 days before Finance receives them. Sales emails PDFs; Finance waits for "official" handoff that never comes.',
    confidenceLevel: 'high',
    fromDepartment: 'Sales',
    toDepartment: 'Finance',
    mentionCount: 5,
    departments: ['Sales', 'Finance'],
    status: 'confirmed',
    supportingQuotes: [
      {
        employeeId: 'emp-34',
        employeeName: 'Maria Santos',
        role: 'Sales Coordinator',
        department: 'Sales',
        quote: "When a contract is signed, I email it to Finance. That's it, that's the handoff. I don't even know if they got it half the time. I just email and hope?",
        sentiment: 'neutral',
        interviewDate: '2024-01-19',
        interviewDepth: 'detailed'
      },
      {
        employeeId: 'emp-12',
        employeeName: 'Sarah Chen',
        role: 'Senior Accountant',
        department: 'Finance',
        quote: "Sales sends contracts to this shared inbox, and honestly? Things get lost in there. I only know to look when the customer calls asking about their first invoice.",
        sentiment: 'frustrated',
        interviewDate: '2024-01-15',
        interviewDepth: 'deep-dive'
      }
    ],
    employeeSuggestions: [
      {
        suggestion: 'Auto-notify Finance when contract is signed in DocuSign, create invoice task automatically',
        suggestedBy: {
          employeeId: 'emp-12',
          employeeName: 'Sarah Chen',
          role: 'Senior Accountant',
          department: 'Finance',
          quote: "Can't the e-signature thing just... ping us automatically? Like create a task or something when a contract closes? That way nothing falls through the cracks.",
          sentiment: 'positive',
          interviewDate: '2024-01-15',
          interviewDepth: 'deep-dive'
        }
      }
    ]
  },
  {
    id: 2,
    type: 'friction',
    title: 'Engineering-Design Handoff',
    synthesizedDescription: 'Designs delivered as static mockups without specs. Engineers spend 2-3 hrs/feature asking clarifying questions in Slack.',
    confidenceLevel: 'medium',
    fromDepartment: 'Design',
    toDepartment: 'Engineering',
    mentionCount: 6,
    departments: ['Design', 'Engineering'],
    status: 'investigating',
    supportingQuotes: [
      {
        employeeId: 'emp-50',
        employeeName: 'Alex Turner',
        role: 'Frontend Developer',
        department: 'Engineering',
        quote: "I get these beautiful mockups and then spend half my day asking 'what happens when this is empty? What's the error state? How does this animate?' None of that is documented.",
        sentiment: 'frustrated',
        interviewDate: '2024-01-21',
        interviewDepth: 'detailed'
      },
      {
        employeeId: 'emp-52',
        employeeName: 'Nina Patel',
        role: 'Product Designer',
        department: 'Design',
        quote: "I mean... I try to document everything but I don't always think of every edge case. If they have questions they can just ask, right? That's what Slack is for.",
        sentiment: 'neutral',
        interviewDate: '2024-01-21',
        interviewDepth: 'brief'
      }
    ],
    knowledgeGaps: [
      'Exact time spent on clarifications not measured',
      'Unknown if this varies by project complexity'
    ]
  }
];

const getCategoryConfig = (type: string) => {
  switch (type) {
    case 'bottleneck':
      return { label: 'Bottleneck', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30', icon: AlertTriangle };
    case 'shadow':
      return { label: 'Shadow Process', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30', icon: FileSpreadsheet };
    case 'duplicate':
      return { label: 'Duplicate Work', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: Copy };
    case 'friction':
      return { label: 'Friction Point', color: 'bg-rose-500/20 text-rose-400 border-rose-500/30', icon: GitBranch };
    default:
      return { label: 'Insight', color: 'bg-muted text-muted-foreground', icon: Zap };
  }
};

interface ProcessInsightsPanelProps {
  filterByDepartment?: string;
}

const ProcessInsightsPanel: React.FC<ProcessInsightsPanelProps> = ({ filterByDepartment }) => {
  const [quotesModalOpen, setQuotesModalOpen] = useState(false);
  const [selectedQuotes, setSelectedQuotes] = useState<InterviewQuote[]>([]);
  const [quotesModalTitle, setQuotesModalTitle] = useState('');
  const [expandedSuggestions, setExpandedSuggestions] = useState<Set<string>>(new Set());

  // Combine all insights
  const allInsights: AnyInsight[] = [
    ...bottleneckInsights,
    ...shadowProcessInsights,
    ...duplicateWorkInsights,
    ...frictionInsights
  ];

  // Filter by department if specified
  const filteredInsights = filterByDepartment
    ? allInsights.filter(insight => 
        insight.departments.some(dept => 
          dept.toLowerCase() === filterByDepartment.toLowerCase()
        )
      )
    : allInsights;
  const navigate = useNavigate();

  const openQuotesModal = (quotes: InterviewQuote[], title: string) => {
    setSelectedQuotes(quotes);
    setQuotesModalTitle(title);
    setQuotesModalOpen(true);
  };

  const toggleSuggestions = (insightId: string) => {
    const newExpanded = new Set(expandedSuggestions);
    if (newExpanded.has(insightId)) {
      newExpanded.delete(insightId);
    } else {
      newExpanded.add(insightId);
    }
    setExpandedSuggestions(newExpanded);
  };

  const renderInsightCard = (insight: AnyInsight) => {
    const category = getCategoryConfig(insight.type);
    const CategoryIcon = category.icon;
    const insightKey = `${insight.type}-${insight.id}`;
    const showSuggestions = expandedSuggestions.has(insightKey);

    return (
      <Card key={insightKey} className="bg-card/50 border-border/50 hover:border-border transition-colors">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className={`${category.color} border text-xs`}>
                  <CategoryIcon className="w-3 h-3 mr-1" />
                  {category.label}
                </Badge>
                {insight.departments.map(dept => (
                  <Badge key={dept} variant="secondary" className="text-xs">
                    {dept}
                  </Badge>
                ))}
              </div>
              <CardTitle className="text-base font-medium">{insight.title}</CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            {insight.synthesizedDescription}
          </p>

          {/* Supporting Evidence */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <button
              onClick={() => openQuotesModal(insight.supportingQuotes, `Quotes: ${insight.title}`)}
              className="flex items-center gap-1 hover:text-foreground transition-colors"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>{insight.supportingQuotes.length} quotes</span>
            </button>
            <div className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              <span>{insight.mentionCount} mentions</span>
            </div>
          </div>

          {/* Knowledge Gaps */}
          {insight.knowledgeGaps && insight.knowledgeGaps.length > 0 && (
            <div className="bg-muted/30 rounded-lg p-3 space-y-2">
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Knowledge Gaps</span>
              </div>
              <ul className="text-xs text-muted-foreground space-y-1 pl-5 list-disc">
                {insight.knowledgeGaps.map((gap, idx) => (
                  <li key={idx}>{gap}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Employee Suggestions */}
          {insight.employeeSuggestions && insight.employeeSuggestions.length > 0 && (
            <div>
              <button
                onClick={() => toggleSuggestions(insightKey)}
                className="flex items-center gap-2 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
              >
                <Lightbulb className="w-3.5 h-3.5" />
                <span>{insight.employeeSuggestions.length} Employee Suggestion{insight.employeeSuggestions.length > 1 ? 's' : ''}</span>
                {showSuggestions ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
              </button>
              
              {showSuggestions && (
                <div className="mt-2 space-y-2">
                  {insight.employeeSuggestions.map((suggestion, idx) => (
                    <div key={idx} className="bg-primary/5 border border-primary/20 rounded-lg p-3">
                      <p className="text-sm text-foreground mb-2">{suggestion.suggestion}</p>
                      <button
                        onClick={() => openQuotesModal([suggestion.suggestedBy], `Suggestion by ${suggestion.suggestedBy.employeeName}`)}
                        className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                      >
                        <UserCheck className="w-3 h-3" />
                        Suggested by {suggestion.suggestedBy.employeeName}, {suggestion.suggestedBy.role}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Contradictions */}
          {insight.contradictions && insight.contradictions.length > 0 && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
              <div className="flex items-center gap-2 text-xs font-medium text-amber-400 mb-2">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Conflicting Information</span>
              </div>
              {insight.contradictions.map((contradiction, idx) => (
                <div key={idx} className="text-xs text-muted-foreground space-y-1">
                  <p>
                    <span className="text-foreground">{contradiction.claim1.employeeName}</span> says one thing, while{' '}
                    <span className="text-foreground">{contradiction.claim2.employeeName}</span> says another.
                  </p>
                  <button
                    onClick={() => openQuotesModal([contradiction.claim1, contradiction.claim2], 'Conflicting Quotes')}
                    className="text-primary hover:text-primary/80"
                  >
                    View both quotes →
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  if (filteredInsights.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No insights found for this department.</p>
      </div>
    );
  }

  const getSentimentColor = (sentiment?: string) => {
    switch (sentiment) {
      case 'positive': return 'border-l-emerald-500';
      case 'negative': return 'border-l-destructive';
      case 'frustrated': return 'border-l-amber-500';
      default: return 'border-l-primary';
    }
  };

  const getDepthLabel = (depth?: string) => {
    switch (depth) {
      case 'deep-dive': return 'Deep Dive';
      case 'detailed': return 'Detailed';
      case 'brief': return 'Brief';
      case 'passing': return 'Passing';
      default: return depth || 'Interview';
    }
  };

  const getDepthColor = (depth?: string) => {
    switch (depth) {
      case 'deep-dive': return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
      case 'detailed': return 'bg-primary/10 text-primary border-primary/20';
      case 'brief': return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
      default: return 'bg-muted text-muted-foreground border-muted-foreground/20';
    }
  };

  return (
    <div className="space-y-4">
      {filteredInsights.map(insight => renderInsightCard(insight))}
      
      <Dialog open={quotesModalOpen} onOpenChange={setQuotesModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Quote className="w-5 h-5 text-primary" />
              {quotesModalTitle}
            </DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground -mt-2 mb-2">
            Click on a quote to view the employee's interview session
          </p>
          <div className="flex-1 overflow-y-auto space-y-4 pr-2">
            {selectedQuotes.map((quote, idx) => (
              <DialogClose asChild key={idx}>
                <div 
                  onClick={() => {
                    if (quote.employeeId) {
                      navigate(`/employee/${quote.employeeId}`, { 
                        state: { activeTab: 'history', interviewDate: quote.interviewDate } 
                      });
                    }
                  }}
                  className={`p-4 rounded-lg bg-muted/30 border-l-4 ${getSentimentColor(quote.sentiment)} ${
                    quote.employeeId ? 'cursor-pointer hover:bg-muted/50 transition-colors group' : ''
                  }`}
                >
                  <p className="text-sm italic text-foreground leading-relaxed">
                    "{quote.quote}"
                  </p>
                  <div className="mt-3 flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className={`font-medium ${quote.employeeId ? 'text-primary group-hover:underline' : 'text-foreground'}`}>
                        {quote.employeeName}
                      </span>
                      {quote.role && (
                        <>
                          <span>•</span>
                          <span>{quote.role}</span>
                        </>
                      )}
                      {quote.department && (
                        <>
                          <span>•</span>
                          <span>{quote.department}</span>
                        </>
                      )}
                      {quote.employeeId && (
                        <ExternalLink className="w-3 h-3 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {quote.interviewDate && (
                        <span className="text-xs text-muted-foreground">
                          {new Date(quote.interviewDate).toLocaleDateString()}
                        </span>
                      )}
                      {quote.interviewDepth && (
                        <Badge variant="outline" className={`text-[10px] ${getDepthColor(quote.interviewDepth)}`}>
                          {getDepthLabel(quote.interviewDepth)}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </DialogClose>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProcessInsightsPanel;
