import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft, Calendar, Phone, MessageCircle, Eye, FileText, RefreshCw, User,
  Building2, Users, AlertTriangle, Target, Lightbulb, Clock, TrendingUp,
  CheckCircle, Zap, Workflow, Award, CalendarClock, Mail, History, XCircle,
  ChevronRight, ChevronDown, HelpCircle, UserCheck, MessageSquare, BarChart3,
  Quote, MapPin, Briefcase, Shield, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import Header from '@/components/Header';
import AddContextModal from '@/components/AddContextModal';
import { api, Employee, Process } from '@/services/api';

// Local type definitions for interview-related data
type InterviewDepth = 'deep-dive' | 'detailed' | 'brief' | 'passing' | 'dismissive';
type ConfidenceLevel = 'high' | 'medium' | 'low' | 'unverified';

interface InterviewLog {
  id: string;
  date: string;
  time: string;
  type: string;
  status: 'completed' | 'scheduled' | 'cancelled';
  duration?: string;
  sentiment?: string;
  engagementScore?: number;
  summary?: string;
  keyTopics?: string[];
  insights?: {
    improvements: string[];
    concerns: string[];
    strengths: string[];
  };
  transcript?: string;
}

interface EmployeeQuote {
  quote: string;
  topic: string;
  sentiment: 'positive' | 'negative' | 'neutral' | 'frustrated';
  interviewDate: string;
  depth: InterviewDepth;
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

  // API data state
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [processes, setProcesses] = useState<Process[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedInterview, setSelectedInterview] = useState<InterviewLog | null>(null);
  const [isContextModalOpen, setIsContextModalOpen] = useState(false);

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

  // Fetch employee and processes from API
  useEffect(() => {
    const fetchData = async () => {
      if (!employeeId) {
        setError('No employee ID provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const [employeeData, processesData] = await Promise.all([
          api.getEmployee(employeeId),
          api.getProcesses()
        ]);

        setEmployee(employeeData);
        setProcesses(processesData);

        // Initialize editable state from API data
        setEditableEmployee({
          department: employeeData.department || '',
          location: '',
          tenure: '',
          engagement: 'Medium',
          email: employeeData.email || '',
          phone: employeeData.phone_number || '',
          manager: ''
        });
      } catch (err) {
        console.error('Error fetching employee:', err);
        setError('Failed to load employee data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [employeeId]);

  // Update editable property and save to API
  const updateProperty = async (key: keyof typeof editableEmployee, value: string) => {
    setEditableEmployee(prev => ({ ...prev, [key]: value }));

    // Map editable keys to API fields
    if (employee) {
      const apiFieldMap: Record<string, string> = {
        department: 'department',
        email: 'email',
        phone: 'phone_number'
      };

      const apiField = apiFieldMap[key];
      if (apiField) {
        try {
          await api.updateEmployee(employee.id, { [apiField]: value });
        } catch (err) {
          console.error('Failed to update employee:', err);
        }
      }
    }
  };

  // Format interview status based on employee status
  const getStatusInfo = () => {
    if (!employee) return { status: 'pending', detail: 'No data' };

    switch (employee.status) {
      case 'completed':
        return { status: 'completed', detail: 'Interview completed' };
      case 'scheduled':
        return { status: 'scheduled', detail: 'Interview scheduled' };
      case 'active':
        return { status: 'scheduled', detail: 'Active' };
      default:
        return { status: 'pending', detail: 'No interview scheduled' };
    }
  };

  const statusInfo = getStatusInfo();

  const getStatusBadge = () => {
    switch (statusInfo.status) {
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
      default:
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

  // Format dates
  const formattedCreated = employee?.created_at
    ? new Date(employee.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })
    : '';

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background w-full pt-[73px]">
        <Header />
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="ml-3 text-muted-foreground">Loading employee...</span>
          </div>
        </div>
      </div>
    );
  }

  // Error state or employee not found
  if (error || !employee) {
    return (
      <div className="min-h-screen bg-background w-full pt-[73px]">
        <Header />
        <div className="max-w-4xl mx-auto px-6 py-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/', { state: { view: 'employees' } })}
            className="mb-4 -ml-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Employees
          </Button>

          <Card className="border-destructive/50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 text-destructive">
                <AlertTriangle className="w-6 h-6" />
                <div>
                  <h2 className="text-xl font-semibold">Employee Not Found</h2>
                  <p className="text-muted-foreground mt-1">
                    {error || `No employee found with ID: ${employeeId}`}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

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
          <p className="text-lg text-muted-foreground mt-1">{employee.role || 'Team Member'}</p>
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

          {/* Created At */}
          {employee.created_at && (
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 text-muted-foreground w-44">
                <Clock className="w-4 h-4" />
                <span className="text-sm">Created</span>
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

          {/* Company */}
          {employee.company && (
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 text-muted-foreground w-44">
                <Building2 className="w-4 h-4" />
                <span className="text-sm">Company</span>
              </div>
              <span className="text-sm text-foreground">{employee.company}</span>
            </div>
          )}

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

          {/* Notes */}
          {employee.notes && (
            <div className="flex items-start gap-6">
              <div className="flex items-center gap-2 text-muted-foreground w-44">
                <FileText className="w-4 h-4" />
                <span className="text-sm">Notes</span>
              </div>
              <span className="text-sm text-foreground">{employee.notes}</span>
            </div>
          )}

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
          <p className="text-sm text-muted-foreground mb-3">No interview data available yet.</p>
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
            badge="0 interviews"
            defaultOpen={true}
          >
            <p className="text-muted-foreground">No interviews completed yet. Schedule an interview to gather insights.</p>
          </CollapsibleSection>

          {/* Process Involvement */}
          <CollapsibleSection
            title="Process Involvement"
            icon={<Workflow className="w-5 h-5" />}
            badge={processes.length}
            defaultOpen={true}
          >
            {processes.length > 0 ? (
              <div className="space-y-2">
                {processes.map((process) => (
                  <div
                    key={process.id}
                    className="p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/processes/${process.id}`)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-foreground">{process.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {process.department} - {process.steps} steps, {process.employees} employees
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {process.automation_level}% automated
                        </Badge>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No process involvement recorded yet.</p>
            )}
          </CollapsibleSection>

          {/* Dependencies */}
          <CollapsibleSection
            title="Dependencies"
            icon={<Users className="w-5 h-5" />}
          >
            <p className="text-muted-foreground">No dependencies recorded yet.</p>
          </CollapsibleSection>

          {/* Knowledge Gaps */}
          <CollapsibleSection
            title="Knowledge Gaps"
            icon={<HelpCircle className="w-5 h-5" />}
          >
            <p className="text-sm text-muted-foreground">
              Complete an interview to identify knowledge gaps.
            </p>
          </CollapsibleSection>

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
                              <li key={i}>* {item}</li>
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
                              <li key={i}>* {item}</li>
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
                              <li key={i}>* {item}</li>
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
