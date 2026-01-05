import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  ArrowLeft, Calendar, Phone, MessageCircle, Eye, FileText, RefreshCw, User, 
  Building2, Users, AlertTriangle, Target, Lightbulb, Clock, TrendingUp, 
  CheckCircle, Zap, Workflow, Award, CalendarClock, Mail, History, XCircle, 
  ChevronRight, ChevronDown, HelpCircle, UserCheck, MessageSquare, BarChart3, 
  Quote, MapPin, Briefcase, Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import Header from '@/components/Header';
import QuotesModal from '@/components/QuotesModal';
import AddContextModal from '@/components/AddContextModal';
import ProcessTable from '@/components/processes/ProcessTable';
import { getEmployeeById, Employee, formatInterviewStatus, getInterviewLogs, getLatestCompletedInterview, InterviewLog, employeesData } from '@/data/employeesData';
import { processData, Process } from '@/data/processData';

// Interview depth types for this employee's responses
type InterviewDepth = 'deep-dive' | 'detailed' | 'brief' | 'passing' | 'dismissive';
type ConfidenceLevel = 'high' | 'medium' | 'low' | 'unverified';

interface EmployeeQuote {
  quote: string;
  topic: string;
  sentiment: 'positive' | 'negative' | 'neutral' | 'frustrated';
  interviewDate: string;
  depth: InterviewDepth;
}

interface ProcessMention {
  processName: string;
  role: string;
  mentionDepth: InterviewDepth;
  quotes: EmployeeQuote[];
  challenges?: string[];
  suggestions?: string[];
}

interface EmployeeInsight {
  category: 'improvement' | 'concern' | 'strength' | 'workaround';
  summary: string;
  confidence: ConfidenceLevel;
  supportingQuotes: EmployeeQuote[];
  mentionCount: number;
}

// Employee Tag Component - clickable and consistent
interface EmployeeTagProps {
  employeeId: string;
  employeeName: string;
  role?: string;
}

const EmployeeTag = ({ employeeId, employeeName, role }: EmployeeTagProps) => {
  const navigate = useNavigate();
  
  const handleClick = () => {
    navigate(`/employees/${employeeId}`);
  };
  
  return (
    <button
      onClick={handleClick}
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-muted hover:bg-accent transition-colors cursor-pointer"
    >
      <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-medium text-primary">
        {employeeName.charAt(0)}
      </div>
      <span className="text-sm text-foreground">{employeeName}</span>
      {role && (
        <span className="text-xs text-muted-foreground">({role})</span>
      )}
    </button>
  );
};

// Collapsible Section Component
interface CollapsibleSectionProps {
  title: string;
  icon: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
  badge?: string | number;
}

const CollapsibleSection = ({ title, icon, defaultOpen = false, children, badge }: CollapsibleSectionProps) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="flex items-center gap-2 w-full text-left hover:bg-muted/50 p-2 -ml-2 rounded group">
        {isOpen ? (
          <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        ) : (
          <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        )}
        <span className="text-muted-foreground">{icon}</span>
        <span className="text-xl font-bold text-foreground">{title}</span>
        {badge !== undefined && (
          <Badge variant="secondary" className="ml-2">{badge}</Badge>
        )}
      </CollapsibleTrigger>
      
      <CollapsibleContent className="pl-8 mt-3 space-y-4">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
};

// Editable Property Component
interface EditablePropertyProps {
  value: string;
  onChange: (value: string) => void;
  type?: 'text' | 'select' | 'badge';
  options?: string[];
  badgeClassName?: string;
}

const EditableProperty = ({ value, onChange, type = 'text', options = [], badgeClassName }: EditablePropertyProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const inputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  const handleSave = () => {
    onChange(editValue);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setEditValue(value);
      setIsEditing(false);
    }
  };

  if (type === 'select') {
    return (
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="text-sm bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-primary rounded px-1 py-0.5 cursor-pointer hover:bg-muted/50"
      >
        {options.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    );
  }

  if (type === 'badge') {
    return (
      <div className="relative group">
        {isEditing ? (
          <select
            value={editValue}
            onChange={(e) => {
              onChange(e.target.value);
              setIsEditing(false);
            }}
            onBlur={() => setIsEditing(false)}
            autoFocus
            className="text-sm bg-muted border border-border rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {options.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        ) : (
          <Badge 
            variant="secondary" 
            className={`${badgeClassName} cursor-pointer hover:ring-1 hover:ring-primary/50`}
            onClick={() => setIsEditing(true)}
          >
            {value}
          </Badge>
        )}
      </div>
    );
  }

  return (
    <div className="relative group">
      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          className="text-sm bg-muted border border-border rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary min-w-[150px]"
        />
      ) : (
        <span 
          onClick={() => setIsEditing(true)}
          className="text-sm text-foreground cursor-pointer hover:bg-muted/50 px-1 py-0.5 rounded -mx-1 transition-colors"
        >
          {value || <span className="text-muted-foreground">Empty</span>}
        </span>
      )}
    </div>
  );
};

const EmployeeProfile = () => {
  const { employeeId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  const targetInterviewDate = (location.state as { interviewDate?: string })?.interviewDate;
  
  const [selectedInterview, setSelectedInterview] = useState<InterviewLog | null>(null);
  const [isContextModalOpen, setIsContextModalOpen] = useState(false);
  const [openProcesses, setOpenProcesses] = useState<Record<number, boolean>>({ 0: true });
  
  // Editable employee state
  const [editableEmployee, setEditableEmployee] = useState({
    department: '',
    location: '',
    tenure: '',
    engagement: '',
    email: '',
    phone: '',
    manager: ''
  });

  // Get employee data from shared data source
  const employee: Employee = getEmployeeById(employeeId || '') || {
    id: employeeId || 'unknown',
    name: employeeId?.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') || 'Unknown Employee',
    role: 'Team Member',
    department: 'General',
    status: 'pending',
    email: `${employeeId}@company.com`,
    phone: '+1 (555) 000-0000',
    interviewDate: null,
    interviewTime: null,
    manager: 'Not Assigned',
    engagement: 'Medium',
    tenure: '1 year',
    location: 'Remote'
  };

  // Get interview logs for this employee
  const interviewLogs = getInterviewLogs(employee.id);
  const latestCompletedInterview = getLatestCompletedInterview(employee.id);
  const completedInterviews = interviewLogs.filter(log => log.status === 'completed');
  const scheduledInterviews = interviewLogs.filter(log => log.status === 'scheduled');

  const statusInfo = formatInterviewStatus(employee);

  // Get manager as employee
  const managerEmployee = employeesData.find(e => e.name === employee.manager);

  // Initialize editable employee state from employee data
  useEffect(() => {
    setEditableEmployee({
      department: employee.department,
      location: employee.location,
      tenure: employee.tenure,
      engagement: employee.engagement,
      email: employee.email,
      phone: employee.phone,
      manager: employee.manager
    });
  }, [employee.id]);

  // Auto-select interview if navigating from a quote
  useEffect(() => {
    if (targetInterviewDate && interviewLogs.length > 0) {
      const matchingInterview = interviewLogs.find(log => log.date === targetInterviewDate);
      if (matchingInterview) {
        setSelectedInterview(matchingInterview);
      }
    }
  }, [targetInterviewDate, interviewLogs]);

  // Update editable property
  const updateProperty = (key: keyof typeof editableEmployee, value: string) => {
    setEditableEmployee(prev => ({ ...prev, [key]: value }));
    // In a real app, you'd save this to backend here
  };

  // Get processes where this employee is involved (mentioned in quotes)
  const getEmployeeProcesses = (): Process[] => {
    return processData.filter(process => {
      // Check if employee is mentioned in any quotes across the process
      const isInSteps = process.steps.some(step => 
        step.supportingQuotes.some(q => q.employeeName === employee.name || q.employeeId === employee.id)
      );
      const isInPainPoints = process.painPoints.some(pp => 
        pp.supportingQuotes.some(q => q.employeeName === employee.name || q.employeeId === employee.id)
      );
      const isInSuggestions = process.improvementSuggestions.some(is => 
        is.supportingQuotes.some(q => q.employeeName === employee.name || q.employeeId === employee.id)
      );
      const isInWorkarounds = process.workarounds.some(w => 
        w.supportingQuotes.some(q => q.employeeName === employee.name || q.employeeId === employee.id)
      );
      const isOwner = process.owner === employee.name;
      
      return isInSteps || isInPainPoints || isInSuggestions || isInWorkarounds || isOwner;
    });
  };

  const employeeProcesses = getEmployeeProcesses();

  // Mock interview-backed data for this employee
  const interviewCoverage = {
    totalInterviews: completedInterviews.length,
    averageDepth: completedInterviews.length > 0 ? 'detailed' as InterviewDepth : 'passing' as InterviewDepth,
    topicsDiscussed: completedInterviews.length > 0 ? 12 : 0,
    totalQuotes: completedInterviews.length > 0 ? 24 : 0,
  };

  // Process mentions from interviews
  const processMentions: ProcessMention[] = completedInterviews.length > 0 ? [
    {
      processName: 'Order Processing',
      role: 'Primary participant',
      mentionDepth: 'deep-dive',
      quotes: [
        {
          quote: "So every morning I'm checking the order queue, right? And the thing that kills me is the manual data entry. Like, I have to copy stuff from the CRM into SAP field by field. It takes hours and honestly I mess up sometimes. We all do.",
          topic: 'Daily workflow',
          sentiment: 'frustrated',
          interviewDate: '2024-01-15',
          depth: 'deep-dive'
        },
        {
          quote: "Rush orders are a nightmare. There's no automatic flagging so I literally have to call the warehouse and be like 'hey, this one's urgent.' It's very manual.",
          topic: 'Process challenges',
          sentiment: 'negative',
          interviewDate: '2024-01-15',
          depth: 'detailed'
        }
      ],
      challenges: ['Manual data entry between systems', 'No automated priority flagging'],
      suggestions: ['Automate CRM to ERP sync', 'Implement priority queue system']
    },
    {
      processName: 'Quality Control',
      role: 'Occasional involvement',
      mentionDepth: 'brief',
      quotes: [
        {
          quote: "Yeah I get pulled into QC stuff sometimes. Like when a customer complains about an order I processed, they'll loop me in to figure out what happened.",
          topic: 'Cross-process involvement',
          sentiment: 'neutral',
          interviewDate: '2024-01-15',
          depth: 'brief'
        }
      ]
    },
    {
      processName: 'Customer Support Escalations',
      role: 'Escalation point',
      mentionDepth: 'detailed',
      quotes: [
        {
          quote: "Support pings me constantly. 'Where's this order?' 'What's the status on that?' And I have to dig through like three different systems to find anything. It's a scavenger hunt every time.",
          topic: 'Support process',
          sentiment: 'frustrated',
          interviewDate: '2024-01-15',
          depth: 'detailed'
        }
      ],
      challenges: ['No unified order tracking view', 'Multiple systems to check']
    }
  ] : [];

  // Synthesized insights from interviews
  const employeeInsights: EmployeeInsight[] = completedInterviews.length > 0 ? [
    {
      category: 'improvement',
      summary: 'Strongly advocates for automated data sync between CRM and ERP systems',
      confidence: 'high',
      mentionCount: 4,
      supportingQuotes: [
        {
          quote: "If we could just automate this CRM to SAP thing? Like have it sync automatically? I'd save probably five, six hours a week easy. Time I could spend actually solving problems instead of just... typing.",
          topic: 'Automation suggestion',
          sentiment: 'positive',
          interviewDate: '2024-01-15',
          depth: 'deep-dive'
        }
      ]
    },
    {
      category: 'improvement',
      summary: 'Suggested implementing real-time order tracking for customers',
      confidence: 'high',
      mentionCount: 2,
      supportingQuotes: [
        {
          quote: "Real-time tracking would be amazing. Like half my calls are literally just 'where's my stuff?' I could just send them a link instead of playing phone tag all day.",
          topic: 'Customer experience',
          sentiment: 'positive',
          interviewDate: '2024-01-15',
          depth: 'detailed'
        }
      ]
    },
    {
      category: 'concern',
      summary: 'Frustrated with approval delays for large orders',
      confidence: 'medium',
      mentionCount: 2,
      supportingQuotes: [
        {
          quote: "Large orders are the worst because they need Finance to sign off. And like, if they're traveling or in back-to-back meetings? Orders just sit there for days. Customers are waiting, I'm waiting, everyone's waiting.",
          topic: 'Process bottleneck',
          sentiment: 'frustrated',
          interviewDate: '2024-01-15',
          depth: 'detailed'
        }
      ]
    },
    {
      category: 'strength',
      summary: 'Strong cross-team communication skills, built effective Slack coordination',
      confidence: 'high',
      mentionCount: 3,
      supportingQuotes: [
        {
          quote: "We've actually gotten a lot better at coordination. I set up a Slack channel for real-time stuff, and when sales has something urgent they just ping me there. It works pretty well honestly.",
          topic: 'Team collaboration',
          sentiment: 'positive',
          interviewDate: '2024-01-15',
          depth: 'deep-dive'
        }
      ]
    },
    {
      category: 'workaround',
      summary: 'Uses personal spreadsheet to track orders because official system is slow',
      confidence: 'medium',
      mentionCount: 1,
      supportingQuotes: [
        {
          quote: "Don't tell anyone but I have my own Excel sheet for urgent orders. [laughs] The ERP is just... it's slow. I can't get a quick snapshot of what's going on. So I made my own thing.",
          topic: 'Shadow process',
          sentiment: 'neutral',
          interviewDate: '2024-01-15',
          depth: 'brief'
        }
      ]
    }
  ] : [];

  // Knowledge gaps - things we still don't know about this employee
  const knowledgeGaps = completedInterviews.length > 0 ? [
    'Specific time spent on each process step not quantified',
    'Interaction with finance approval process unclear',
    'Full list of systems accessed daily not documented'
  ] : [];

  const toggleProcess = (index: number) => {
    setOpenProcesses(prev => ({ ...prev, [index]: !prev[index] }));
  };

  // Format dates
  const createdDate = employee.interviewDate ? new Date(employee.interviewDate) : new Date();
  const formattedCreated = createdDate.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  const getStatusBadge = () => {
    switch (employee.status) {
      case 'completed':
        return (
          <Badge className="bg-success/10 text-success border-success/20">
            <CheckCircle className="w-3 h-3 mr-1" />
            Completed
          </Badge>
        );
      case 'scheduled':
        return (
          <Badge className="bg-warning/10 text-warning border-warning/20">
            <Clock className="w-3 h-3 mr-1" />
            Scheduled
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-muted text-muted-foreground border-muted-foreground/20">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
    }
  };

  const getEngagementColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'high': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
      case 'medium': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
      case 'low': return 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getDepthIndicator = (depth: InterviewDepth) => {
    switch (depth) {
      case 'deep-dive': return '████';
      case 'detailed': return '███░';
      case 'brief': return '██░░';
      case 'passing': return '█░░░';
      case 'dismissive': return '░░░░';
      default: return '░░░░';
    }
  };

  const getDepthLabel = (depth: InterviewDepth) => {
    switch (depth) {
      case 'deep-dive': return 'Deep Dive';
      case 'detailed': return 'Detailed';
      case 'brief': return 'Brief';
      case 'passing': return 'Passing Mention';
      case 'dismissive': return 'Dismissive';
      default: return 'Unknown';
    }
  };

  const getDepthColor = (depth: InterviewDepth) => {
    switch (depth) {
      case 'deep-dive': return 'text-emerald-500';
      case 'detailed': return 'text-primary';
      case 'brief': return 'text-amber-500';
      case 'passing': return 'text-muted-foreground';
      case 'dismissive': return 'text-destructive';
      default: return 'text-muted-foreground';
    }
  };

  const getConfidenceLabel = (confidence: ConfidenceLevel) => {
    switch (confidence) {
      case 'high': return 'High';
      case 'medium': return 'Medium';
      case 'low': return 'Low';
      default: return 'Unverified';
    }
  };

  const getCategoryIcon = (category: EmployeeInsight['category']) => {
    switch (category) {
      case 'improvement': return <Lightbulb className="w-4 h-4 text-primary" />;
      case 'concern': return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case 'strength': return <Award className="w-4 h-4 text-success" />;
      case 'workaround': return <Zap className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getCategoryLabel = (category: EmployeeInsight['category']) => {
    switch (category) {
      case 'improvement': return 'Suggestion';
      case 'concern': return 'Concern';
      case 'strength': return 'Strength';
      case 'workaround': return 'Workaround';
    }
  };

  // Helper to convert EmployeeQuote to QuotesModal format
  const convertToQuoteItem = (quote: EmployeeQuote) => ({
    employeeName: employee.name,
    role: employee.role,
    department: employee.department,
    quote: quote.quote,
    sentiment: quote.sentiment,
    interviewDate: quote.interviewDate,
    depth: quote.depth,
    topic: quote.topic
  });

  return (
    <div className="min-h-screen bg-background w-full pt-[73px]">
      <Header />
      
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          onClick={() => navigate('/', { state: { view: 'employees' } })}
          className="mb-4 -ml-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Employees
        </Button>

        {/* Employee Name & Role */}
        <div className="mb-2">
          <h1 className="text-4xl font-bold text-foreground">{employee.name}</h1>
          <p className="text-lg text-muted-foreground mt-1">{employee.role}</p>
        </div>

        {/* Properties Section */}
        <div className="space-y-3 mb-8 mt-6">
          {/* Interview Status */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-muted-foreground w-44">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm">Interview Status</span>
            </div>
            <div className="flex items-center gap-2">
              {getStatusBadge()}
              <span className="text-sm text-muted-foreground">{statusInfo.detail}</span>
            </div>
          </div>

          {/* Last Interview */}
          {employee.interviewDate && (
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 text-muted-foreground w-44">
                <Clock className="w-4 h-4" />
                <span className="text-sm">Last Interview</span>
              </div>
              <span className="text-sm text-foreground">{formattedCreated}</span>
            </div>
          )}

          {/* Department */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-muted-foreground w-44">
              <Building2 className="w-4 h-4" />
              <span className="text-sm">Department</span>
            </div>
            <EditableProperty
              value={editableEmployee.department}
              onChange={(value) => updateProperty('department', value)}
              type="badge"
              options={['Operations', 'Finance', 'Sales', 'IT', 'HR', 'Marketing', 'Engineering', 'Customer Support']}
              badgeClassName="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
            />
          </div>

          {/* Reports To */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-muted-foreground w-44">
              <Users className="w-4 h-4" />
              <span className="text-sm">Reports to</span>
            </div>
            {managerEmployee ? (
              <EmployeeTag 
                employeeId={managerEmployee.id} 
                employeeName={managerEmployee.name}
                role={managerEmployee.role}
              />
            ) : (
              <EditableProperty
                value={editableEmployee.manager}
                onChange={(value) => updateProperty('manager', value)}
              />
            )}
          </div>

          {/* Location */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-muted-foreground w-44">
              <MapPin className="w-4 h-4" />
              <span className="text-sm">Location</span>
            </div>
            <EditableProperty
              value={editableEmployee.location}
              onChange={(value) => updateProperty('location', value)}
            />
          </div>

          {/* Tenure */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-muted-foreground w-44">
              <Briefcase className="w-4 h-4" />
              <span className="text-sm">Tenure</span>
            </div>
            <EditableProperty
              value={editableEmployee.tenure}
              onChange={(value) => updateProperty('tenure', value)}
            />
          </div>

          {/* Engagement */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-muted-foreground w-44">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm">Engagement</span>
            </div>
            <EditableProperty
              value={editableEmployee.engagement}
              onChange={(value) => updateProperty('engagement', value)}
              type="badge"
              options={['High', 'Medium', 'Low']}
              badgeClassName={getEngagementColor(editableEmployee.engagement)}
            />
          </div>

          {/* Email */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-muted-foreground w-44">
              <Mail className="w-4 h-4" />
              <span className="text-sm">Email</span>
            </div>
            <EditableProperty
              value={editableEmployee.email}
              onChange={(value) => updateProperty('email', value)}
            />
          </div>

          {/* Phone */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-muted-foreground w-44">
              <Phone className="w-4 h-4" />
              <span className="text-sm">Phone</span>
            </div>
            <EditableProperty
              value={editableEmployee.phone}
              onChange={(value) => updateProperty('phone', value)}
            />
          </div>

          {/* Add a property button */}
          <button className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm mt-2">
            <span className="text-lg leading-none">+</span>
            <span>Add a property</span>
          </button>
        </div>

        {/* Actions Section */}
        <div className="flex flex-wrap gap-3 mb-8">
          <Button variant="outline" size="sm">
            <Eye className="w-4 h-4 mr-2" />
            View Transcript
          </Button>
          <Button variant="outline" size="sm" onClick={() => setIsContextModalOpen(true)}>
            <FileText className="w-4 h-4 mr-2" />
            Add Context
          </Button>
          <Button variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Schedule Interview
          </Button>
          <Button variant="outline" size="sm">
            <Mail className="w-4 h-4 mr-2" />
            Send Reminder
          </Button>
        </div>

        {/* Comments Section */}
        <div className="mb-8">
          <h3 className="text-sm font-medium text-foreground mb-3">Comments</h3>
          {completedInterviews.length > 0 ? (
            <div className="flex items-start gap-3 mb-3">
              <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground">
                AI
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">AI Assistant</span>
                  <span className="text-xs text-muted-foreground">
                    {latestCompletedInterview ? new Date(latestCompletedInterview.date).toLocaleDateString() : ''}
                  </span>
                </div>
                <p className="text-sm text-foreground">
                  Interview completed. {latestCompletedInterview?.summary || 'Insights synthesized from conversation.'}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground mb-3">No interview data available yet.</p>
          )}
          <div className="flex items-center gap-3 text-muted-foreground">
            <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
              ?
            </div>
            <span className="text-sm">Add a comment...</span>
          </div>
        </div>

        <Separator className="my-8" />

        {/* Main Content - All Collapsible Sections */}
        <div className="space-y-6">
          {/* Employee Title in Content */}
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Employee: {employee.name}
          </h2>

          {/* Interview Summary */}
          <CollapsibleSection 
            title="Interview Coverage" 
            icon={<MessageSquare className="w-5 h-5" />}
            badge={`${completedInterviews.length} interview${completedInterviews.length !== 1 ? 's' : ''}`}
            defaultOpen={true}
          >
            {completedInterviews.length > 0 ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <p className="text-xs text-muted-foreground">Total Interviews</p>
                    <p className="font-semibold text-foreground">{interviewCoverage.totalInterviews}</p>
                  </div>
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <p className="text-xs text-muted-foreground">Response Depth</p>
                    <p className={`font-mono ${getDepthColor(interviewCoverage.averageDepth)}`}>
                      {getDepthIndicator(interviewCoverage.averageDepth)} {getDepthLabel(interviewCoverage.averageDepth)}
                    </p>
                  </div>
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <p className="text-xs text-muted-foreground">Topics Discussed</p>
                    <p className="font-semibold text-foreground">{interviewCoverage.topicsDiscussed}</p>
                  </div>
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <p className="text-xs text-muted-foreground">Usable Quotes</p>
                    <p className="font-semibold text-foreground">{interviewCoverage.totalQuotes}</p>
                  </div>
                </div>

                {/* Interview History */}
                <div className="space-y-2">
                  <p className="font-semibold text-foreground">Interview History:</p>
                  {interviewLogs.map((log) => (
                    <div 
                      key={log.id} 
                      className="p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => setSelectedInterview(log)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            log.status === 'completed' ? 'bg-success/10' : 
                            log.status === 'scheduled' ? 'bg-warning/10' : 'bg-muted'
                          }`}>
                            {log.status === 'completed' ? (
                              <CheckCircle className="w-4 h-4 text-success" />
                            ) : log.status === 'scheduled' ? (
                              <Clock className="w-4 h-4 text-warning" />
                            ) : (
                              <XCircle className="w-4 h-4 text-muted-foreground" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">{log.type}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(log.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} at {log.time}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {log.engagementScore && (
                            <Badge variant="outline">{log.engagementScore}% engagement</Badge>
                          )}
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">No interviews completed yet. Schedule an interview to gather insights.</p>
            )}
          </CollapsibleSection>

          {/* Process Involvement - Using ProcessTable */}
          <CollapsibleSection 
            title="Process Involvement" 
            icon={<Workflow className="w-5 h-5" />}
            badge={employeeProcesses.length}
            defaultOpen={true}
          >
            {employeeProcesses.length > 0 ? (
              <ProcessTable 
                processes={employeeProcesses}
                onProcessClick={(process) => navigate(`/processes/${process.id}`)}
              />
            ) : (
              <p className="text-muted-foreground">No process involvement recorded yet.</p>
            )}
          </CollapsibleSection>

          {/* Synthesized Insights */}
          {employeeInsights.length > 0 && (
            <CollapsibleSection 
              title="Synthesized Insights" 
              icon={<Lightbulb className="w-5 h-5" />}
              badge={employeeInsights.length}
            >
              <ul className="space-y-3 list-disc list-outside pl-5">
                {employeeInsights.map((insight, index) => (
                  <li key={index} className="text-foreground">
                    <span className="font-medium">{getCategoryLabel(insight.category)}:</span>{" "}
                    {insight.summary}
                  </li>
                ))}
              </ul>
            </CollapsibleSection>
          )}

          {/* Dependencies */}
          <CollapsibleSection 
            title="Dependencies" 
            icon={<Users className="w-5 h-5" />}
          >
            <div className="space-y-4">
              {/* Upstream Dependencies */}
              <div>
                <p className="font-semibold text-foreground mb-2">Upstream (receives work from):</p>
                <ul className="space-y-2 list-disc list-outside pl-5">
                  {managerEmployee && (
                    <li className="text-foreground">
                      <EmployeeTag 
                        employeeId={managerEmployee.id} 
                        employeeName={managerEmployee.name}
                        role={managerEmployee.role}
                      />
                      <span className="text-muted-foreground ml-2">— Assigns tasks and provides strategic direction</span>
                    </li>
                  )}
                  <li className="text-foreground">
                    <EmployeeTag 
                      employeeId="mike-chen" 
                      employeeName="Mike Chen"
                      role="Sales Lead"
                    />
                    <span className="text-muted-foreground ml-2">— Sends closed deals for order processing</span>
                  </li>
                  <li className="text-foreground">
                    <EmployeeTag 
                      employeeId="amy-torres" 
                      employeeName="Amy Torres"
                      role="Customer Success"
                    />
                    <span className="text-muted-foreground ml-2">— Provides customer requirements and special requests</span>
                  </li>
                </ul>
              </div>
              
              {/* Downstream Dependencies */}
              <div>
                <p className="font-semibold text-foreground mb-2">Downstream (sends work to):</p>
                <ul className="space-y-2 list-disc list-outside pl-5">
                  <li className="text-foreground">
                    <EmployeeTag 
                      employeeId="kevin-brown" 
                      employeeName="Kevin Brown"
                      role="Warehouse Manager"
                    />
                    <span className="text-muted-foreground ml-2">— Receives processed orders for fulfillment</span>
                  </li>
                  <li className="text-foreground">
                    <EmployeeTag 
                      employeeId="jennifer-white" 
                      employeeName="Jennifer White"
                      role="AP Specialist"
                    />
                    <span className="text-muted-foreground ml-2">— Receives order data for invoice matching</span>
                  </li>
                  <li className="text-foreground">
                    <EmployeeTag 
                      employeeId="david-kim" 
                      employeeName="David Kim"
                      role="Support Lead"
                    />
                    <span className="text-muted-foreground ml-2">— Receives order status updates for customer inquiries</span>
                  </li>
                </ul>
              </div>
            </div>
          </CollapsibleSection>

          {/* Knowledge Gaps */}
          {knowledgeGaps.length > 0 && (
            <CollapsibleSection 
              title="Knowledge Gaps" 
              icon={<HelpCircle className="w-5 h-5" />}
              badge={knowledgeGaps.length}
            >
              <p className="text-sm text-muted-foreground mb-3">
                These areas weren't fully explored and should be covered in the next interview:
              </p>
              <ul className="list-disc list-inside space-y-2 text-foreground">
                {knowledgeGaps.map((gap, idx) => (
                  <li key={idx}>{gap}</li>
                ))}
              </ul>
            </CollapsibleSection>
          )}

        </div>

        {/* Interview Detail Modal */}
        {selectedInterview && (
          <Dialog open={!!selectedInterview} onOpenChange={() => setSelectedInterview(null)}>
            <DialogContent className="max-w-3xl max-h-[80vh]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Interview Details - {selectedInterview.type}
                </DialogTitle>
              </DialogHeader>
              <ScrollArea className="h-[60vh] pr-4">
                <div className="space-y-6">
                  {/* Meta */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-3 bg-muted/30 rounded-lg">
                      <p className="text-xs text-muted-foreground">Date</p>
                      <p className="font-medium text-foreground">
                        {new Date(selectedInterview.date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="p-3 bg-muted/30 rounded-lg">
                      <p className="text-xs text-muted-foreground">Duration</p>
                      <p className="font-medium text-foreground">{selectedInterview.duration}</p>
                    </div>
                    <div className="p-3 bg-muted/30 rounded-lg">
                      <p className="text-xs text-muted-foreground">Sentiment</p>
                      <p className="font-medium text-foreground">{selectedInterview.sentiment || 'N/A'}</p>
                    </div>
                    <div className="p-3 bg-muted/30 rounded-lg">
                      <p className="text-xs text-muted-foreground">Engagement</p>
                      <p className="font-medium text-foreground">{selectedInterview.engagementScore || 0}%</p>
                    </div>
                  </div>

                  {/* Summary */}
                  {selectedInterview.summary && (
                    <div className="p-4 border border-border rounded-lg">
                      <p className="font-semibold text-foreground mb-2">Summary</p>
                      <p className="text-foreground">{selectedInterview.summary}</p>
                    </div>
                  )}

                  {/* Topics */}
                  {selectedInterview.keyTopics && (
                    <div>
                      <p className="font-semibold text-foreground mb-2">Topics Discussed</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedInterview.keyTopics.map((topic, i) => (
                          <Badge key={i} variant="outline">{topic}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Insights */}
                  {selectedInterview.insights && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {selectedInterview.insights.improvements.length > 0 && (
                        <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                          <h5 className="font-medium text-foreground mb-2 flex items-center gap-2">
                            <Lightbulb className="w-4 h-4 text-primary" />
                            Suggestions
                          </h5>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            {selectedInterview.insights.improvements.map((item, i) => (
                              <li key={i}>• {item}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {selectedInterview.insights.concerns.length > 0 && (
                        <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-lg">
                          <h5 className="font-medium text-foreground mb-2 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-amber-500" />
                            Concerns
                          </h5>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            {selectedInterview.insights.concerns.map((item, i) => (
                              <li key={i}>• {item}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {selectedInterview.insights.strengths.length > 0 && (
                        <div className="p-4 bg-success/5 border border-success/20 rounded-lg">
                          <h5 className="font-medium text-foreground mb-2 flex items-center gap-2">
                            <Award className="w-4 h-4 text-success" />
                            Strengths
                          </h5>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            {selectedInterview.insights.strengths.map((item, i) => (
                              <li key={i}>• {item}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Transcript */}
                  {selectedInterview.transcript && (
                    <div className="p-4 border border-border rounded-lg">
                      <p className="font-semibold text-foreground mb-2">Transcript</p>
                      <div className="whitespace-pre-wrap text-sm text-muted-foreground leading-relaxed">
                        {selectedInterview.transcript}
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Add Context Modal */}
      <AddContextModal
        open={isContextModalOpen}
        onOpenChange={setIsContextModalOpen}
        employeeName={employee.name}
      />
    </div>
  );
};

export default EmployeeProfile;
