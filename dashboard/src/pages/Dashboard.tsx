import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  AlertTriangle,
  Clock,
  CheckCircle2,
  ArrowRight,
  Users,
  Layers,
  MessageSquare,
  Building2,
  Lightbulb,
  ArrowRightLeft,
  Copy,
  FileSpreadsheet,
  Loader2,
  RefreshCw,
  Phone
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { api, CallStats, Employee, Process } from '@/services/api';

// Helper function to format interview status from API employee data
const formatInterviewStatus = (employee: Employee): { label: string; detail: string } => {
  const status = employee.status?.toLowerCase() || 'pending';

  if (status === 'completed') {
    const updatedDate = employee.updated_at ? new Date(employee.updated_at) : new Date(employee.created_at);
    return {
      label: 'Completed',
      detail: updatedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    };
  } else if (status === 'scheduled') {
    return {
      label: 'Scheduled',
      detail: 'Upcoming'
    };
  } else {
    return {
      label: 'Pending',
      detail: 'Not scheduled'
    };
  }
};

interface DashboardProps {
  onNavigate?: (view: string) => void;
}

const Dashboard = ({ onNavigate }: DashboardProps) => {
  const navigate = useNavigate();

  // API data state
  const [callStats, setCallStats] = useState<CallStats | null>(null);
  const [apiEmployees, setApiEmployees] = useState<Employee[]>([]);
  const [processes, setProcesses] = useState<Process[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Fetch data from API
  const fetchDashboardData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [callStatsData, employeesData, processesData] = await Promise.all([
        api.getCallStats().catch(() => null),
        api.getEmployees().catch(() => []),
        api.getProcesses().catch(() => [])
      ]);

      setCallStats(callStatsData);
      setApiEmployees(employeesData);
      setProcesses(processesData);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Calculate stats from API data
  const totalApiEmployees = apiEmployees.length;
  const completedInterviews = apiEmployees.filter(e => e.status?.toLowerCase() === 'completed').length;
  const scheduledInterviews = apiEmployees.filter(e => e.status?.toLowerCase() === 'scheduled').length;
  const pendingInterviews = apiEmployees.filter(e => !e.status || e.status?.toLowerCase() === 'pending').length;

  // Get unique departments from API employees
  const apiDepartments = [...new Set(apiEmployees.map(e => e.department).filter(Boolean))];
  const departmentsAudited = apiDepartments.length;

  // Audit Progress Stats - using real API data
  const auditStats = {
    interviewsCompleted: completedInterviews,
    interviewsTotal: totalApiEmployees,
    departmentsAudited: departmentsAudited,
    departmentsTotal: Math.max(departmentsAudited, 8),
    processesDiscovered: processes.length,
    insightsGenerated: 23
  };

  // Department Progress - calculated from API employee data
  const departmentProgress = apiDepartments.slice(0, 6).map((dept, index) => {
    const deptEmployees = apiEmployees.filter(e => e.department === dept);
    const completed = deptEmployees.filter(e => e.status?.toLowerCase() === 'completed').length;
    return {
      name: dept || 'Unknown',
      completed,
      total: deptEmployees.length,
      color: index % 2 === 0 ? 'bg-primary' : 'bg-accent'
    };
  });

  // Interview status from API data
  const interviewStatus = apiEmployees.map(emp => {
    const statusInfo = formatInterviewStatus(emp);
    return {
      id: emp.id,
      name: emp.name,
      department: emp.department || 'Unknown',
      status: statusInfo.label,
      timestamp: statusInfo.detail
    };
  });

  const latestInsights = [
    { 
      type: 'bottleneck', 
      title: 'Proposal Creation taking 2-3 hours per deal',
      context: 'Sales → Customer Onboarding',
      icon: AlertTriangle,
      color: 'destructive',
      processId: '2'
    },
    { 
      type: 'shadow', 
      title: 'Unofficial Excel tracker in Finance',
      context: 'Risk: data inconsistency',
      icon: FileSpreadsheet,
      color: 'warning',
      processId: '1'
    },
    { 
      type: 'duplicate', 
      title: 'Customer data entered in 4 different systems',
      context: 'Est. 6 hrs/week wasted',
      icon: Copy,
      color: 'warning',
      processId: '3'
    },
    { 
      type: 'friction', 
      title: 'Sales → Finance handoff delayed 48hrs avg',
      context: 'Missing approval workflow',
      icon: ArrowRightLeft,
      color: 'destructive',
      processId: '1'
    },
  ];

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'In Progress': return 'bg-primary/10 text-primary border-primary/20';
      case 'Needs Review': return 'bg-warning/10 text-warning border-warning/20';
      case 'Critical': return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'Optimized': return 'bg-success/10 text-success border-success/20';
      case 'Completed': return 'text-success';
      case 'Scheduled': return 'text-warning';
      case 'Pending': return 'text-muted-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const [activeTab, setActiveTab] = React.useState('pending');

  const filteredInterviews = interviewStatus.filter(i => {
    if (activeTab === 'all') return true;
    if (activeTab === 'completed') return i.status === 'Completed';
    if (activeTab === 'scheduled') return i.status === 'Scheduled';
    if (activeTab === 'pending') return i.status === 'Pending';
    return true;
  });

  const overallProgress = Math.round((auditStats.interviewsCompleted / auditStats.interviewsTotal) * 100);

  // Format last updated time
  const formatLastUpdated = () => {
    const now = new Date();
    const diff = Math.floor((now.getTime() - lastUpdated.getTime()) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
    return lastUpdated.toLocaleTimeString();
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-muted-foreground">Track audit progress, uncover bottlenecks, and surface actionable insights</p>
        </div>
        <div className="flex items-center gap-3">
          {isLoading && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Loading...</span>
            </div>
          )}
          {error && (
            <Badge variant="destructive" className="text-xs">
              {error}
            </Badge>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchDashboardData}
            disabled={isLoading}
            className="h-8 gap-2"
          >
            <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
            Refresh
          </Button>
          <p className="text-sm text-muted-foreground">Last updated: {formatLastUpdated()}</p>
        </div>
      </div>

      {/* Audit Progress Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="shadow-card hover:shadow-card-hover transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Interviews Completed</p>
                <p className="text-3xl font-display font-semibold text-foreground">
                  {auditStats.interviewsCompleted}
                  <span className="text-lg text-muted-foreground font-normal"> / {auditStats.interviewsTotal}</span>
                </p>
                <div className="flex items-center gap-2">
                  <Progress value={overallProgress} className="h-2 flex-1" />
                  <span className="text-xs font-medium text-muted-foreground">{overallProgress}%</span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card hover:shadow-card-hover transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Voice Calls</p>
                <p className="text-3xl font-display font-semibold text-foreground">
                  {callStats?.total_calls ?? 0}
                </p>
                <p className="text-sm text-muted-foreground">
                  {callStats ? `${callStats.completed_calls} completed, ${callStats.active_calls} active` : 'Loading...'}
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                <Phone className="w-5 h-5 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card hover:shadow-card-hover transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Departments Audited</p>
                <p className="text-3xl font-display font-semibold text-foreground">
                  {auditStats.departmentsAudited}
                  <span className="text-lg text-muted-foreground font-normal"> / {auditStats.departmentsTotal}</span>
                </p>
                <div className="flex items-center gap-2">
                  <Progress value={(auditStats.departmentsAudited / auditStats.departmentsTotal) * 100} className="h-2 flex-1" />
                  <span className="text-xs font-medium text-muted-foreground">{Math.round((auditStats.departmentsAudited / auditStats.departmentsTotal) * 100)}%</span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-accent" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card hover:shadow-card-hover transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Processes Discovered</p>
                <p className="text-3xl font-display font-semibold text-foreground">{auditStats.processesDiscovered}</p>
                <p className="text-sm text-muted-foreground">mapped from interviews</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Layers className="w-5 h-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card hover:shadow-card-hover transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Insights Generated</p>
                <p className="text-3xl font-display font-semibold text-foreground">{auditStats.insightsGenerated}</p>
                <p className="text-sm text-muted-foreground">actionable findings</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                <Lightbulb className="w-5 h-5 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Interview Progress by Department */}
      <Card className="shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-display font-semibold">Interview Progress by Department</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {departmentProgress.map((dept) => (
              <div key={dept.name} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">{dept.name}</span>
                  <span className="text-xs text-muted-foreground">{dept.completed}/{dept.total}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Progress 
                    value={(dept.completed / dept.total) * 100} 
                    className="h-2 flex-1"
                  />
                  <span className="text-xs font-medium text-muted-foreground">{Math.round((dept.completed / dept.total) * 100)}%</span>
                </div>
                {dept.completed === dept.total && (
                  <div className="flex items-center gap-1 text-success">
                    <CheckCircle2 className="w-3 h-3" />
                    <span className="text-xs">Complete</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Latest Insights */}
        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-display font-semibold">Latest Insights</CardTitle>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-primary hover:text-primary/80 h-8"
                onClick={() => navigate('/processes')}
              >
                View All <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {latestInsights.map((insight, i) => (
              <div 
                key={i} 
                className="p-3 rounded-lg border border-border bg-card hover:shadow-card-hover transition-shadow cursor-pointer"
                onClick={() => navigate(`/processes/${insight.processId}`)}
              >
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                    insight.color === 'destructive' && 'bg-destructive/10',
                    insight.color === 'warning' && 'bg-warning/10'
                  )}>
                    <insight.icon className={cn(
                      "w-4 h-4",
                      insight.color === 'destructive' && 'text-destructive',
                      insight.color === 'warning' && 'text-warning'
                    )} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge 
                        variant="outline" 
                        className={cn(
                          "text-[10px] uppercase tracking-wide",
                          insight.color === 'destructive' && 'border-destructive/30 text-destructive bg-destructive/5',
                          insight.color === 'warning' && 'border-warning/30 text-warning bg-warning/5'
                        )}
                      >
                        {insight.type}
                      </Badge>
                    </div>
                    <p className="text-sm font-medium text-foreground">{insight.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">{insight.context}</p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Interview Status */}
        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-display font-semibold">Employee Interviews</CardTitle>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-primary hover:text-primary/80 h-8"
                onClick={() => onNavigate?.('employees')}
              >
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Tabs */}
            <div className="flex gap-2 mb-4 flex-wrap">
              {[
                { id: 'all', label: `All (${interviewStatus.length})` },
                { id: 'completed', label: `Completed (${completedInterviews})` },
                { id: 'scheduled', label: `Scheduled (${scheduledInterviews})` },
                { id: 'pending', label: `Pending (${pendingInterviews})` },
              ].map((tab) => (
                <Button
                  key={tab.id}
                  variant={activeTab === tab.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "text-xs h-8",
                    activeTab === tab.id 
                      ? 'bg-primary text-primary-foreground' 
                      : 'border-border text-muted-foreground hover:text-foreground'
                  )}
                >
                  {tab.label}
                </Button>
              ))}
            </div>
            
            <div className="space-y-2 max-h-[322px] overflow-y-auto">
              {filteredInterviews.map((person) => (
                <div 
                  key={person.id} 
                  className="flex items-center justify-between p-2.5 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => navigate(`/employees/${person.id}`)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                      <Users className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground hover:text-primary transition-colors">{person.name}</p>
                      <p className="text-xs text-muted-foreground">{person.department}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <div className={cn("flex items-center gap-1.5 text-sm font-medium", getStatusStyle(person.status))}>
                      {person.status === 'Completed' && <CheckCircle2 className="w-4 h-4" />}
                      {person.status === 'Scheduled' && <Clock className="w-4 h-4" />}
                      {person.status === 'Pending' && <Badge variant="outline" className="text-xs bg-muted text-muted-foreground border-muted-foreground/30">Pending</Badge>}
                      {person.status !== 'Pending' && person.status}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {person.timestamp}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  );
};

export default Dashboard;
