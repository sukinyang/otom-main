
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, RadialBarChart, RadialBar } from 'recharts';
import { 
  TrendingUp, TrendingDown, Users, Clock, CheckCircle, AlertTriangle, Target, Lightbulb, Award, AlertCircle,
  FileText, Download, Search, Calendar, Filter, Eye, MapPin, Layers, Settings, BarChart3, Heart,
  ExternalLink, ThumbsUp, ThumbsDown, Zap, FileSpreadsheet, GitBranch, Shield
} from 'lucide-react';

const Analytics = () => {
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Executive Summary Data
  const executiveSummary = {
    totalEmployees: 700,
    completionRate: 100,
    avgInterviewTime: 18,
    totalProcesses: 1247,
    bottlenecksIdentified: 89,
    shadowProcessRate: 34,
    kpiMisalignmentRate: 28,
    optimizationSuggestions: 156,
    cultureHealthIndex: 'Medium'
  };

  // Process Heatmap Data
  const processHeatmapData = [
    { name: 'Invoice Processing', department: 'Finance', value: 85, type: 'bottleneck', employees: 12 },
    { name: 'Customer Onboarding', department: 'Sales', value: 92, type: 'high-value', employees: 8 },
    { name: 'Employee Recruitment', department: 'HR', value: 67, type: 'overhead', employees: 15 },
    { name: 'Inventory Management', department: 'Operations', value: 78, type: 'bottleneck', employees: 22 },
    { name: 'Quality Assurance', department: 'Operations', value: 88, type: 'high-value', employees: 18 },
    { name: 'Budget Planning', department: 'Finance', value: 72, type: 'overhead', employees: 9 },
  ];

  // Top Bottlenecks Data
  const topBottlenecks = [
    {
      process: 'Invoice Approval Workflow',
      frequency: 45,
      impact: 'High',
      affectedTeams: ['Finance', 'Operations'],
      issue: 'Manual approval required from multiple stakeholders',
      suggestedFix: 'Implement digital approval system with automated routing'
    },
    {
      process: 'Cross-Department Data Sharing',
      frequency: 38,
      impact: 'High',
      affectedTeams: ['All Departments'],
      issue: 'No centralized data access system',
      suggestedFix: 'Deploy integrated CRM/ERP solution'
    },
    {
      process: 'Employee Onboarding IT Setup',
      frequency: 32,
      impact: 'Medium',
      affectedTeams: ['HR', 'IT'],
      issue: 'IT equipment setup delays',
      suggestedFix: 'Pre-configure equipment based on role requirements'
    },
    {
      process: 'Purchase Order Processing',
      frequency: 28,
      impact: 'Medium',
      affectedTeams: ['Operations', 'Finance'],
      issue: 'Vendor verification delays',
      suggestedFix: 'Create pre-qualified vendor database'
    }
  ];

  // Shadow Processes Data
  const shadowProcessData = [
    { tool: 'Personal Excel Sheets', usage: 68, departments: ['Finance', 'Operations', 'HR'], risk: 'High' },
    { tool: 'Notion/Personal Wikis', usage: 45, departments: ['Marketing', 'Product'], risk: 'Medium' },
    { tool: 'WhatsApp/Slack DMs', usage: 72, departments: ['All'], risk: 'Medium' },
    { tool: 'Google Docs/Sheets', usage: 38, departments: ['Sales', 'Marketing'], risk: 'Low' },
    { tool: 'Personal Task Apps', usage: 29, departments: ['All'], risk: 'Low' }
  ];

  // KPI Alignment Data
  const kpiAlignmentData = [
    { department: 'Operations', clear: 65, partial: 25, unclear: 10 },
    { department: 'Sales', clear: 78, partial: 18, unclear: 4 },
    { department: 'Finance', clear: 82, partial: 15, unclear: 3 },
    { department: 'HR', clear: 58, partial: 32, unclear: 10 },
    { department: 'Marketing', clear: 71, partial: 22, unclear: 7 },
    { department: 'IT', clear: 69, partial: 23, unclear: 8 }
  ];

  // Optimization Suggestions
  const optimizationSuggestions = [
    {
      category: 'Automation',
      count: 42,
      suggestions: [
        { title: 'Automate invoice processing', votes: 28, department: 'Finance', impact: 'High' },
        { title: 'Customer data entry automation', votes: 24, department: 'Sales', impact: 'Medium' },
        { title: 'Inventory tracking automation', votes: 19, department: 'Operations', impact: 'High' }
      ]
    },
    {
      category: 'Workflow Redesign',
      count: 38,
      suggestions: [
        { title: 'Redesign approval workflows', votes: 35, department: 'All', impact: 'High' },
        { title: 'Streamline onboarding process', votes: 22, department: 'HR', impact: 'Medium' },
        { title: 'Optimize meeting structures', votes: 18, department: 'All', impact: 'Low' }
      ]
    },
    {
      category: 'Training Needs',
      count: 34,
      suggestions: [
        { title: 'Advanced Excel training', votes: 31, department: 'Finance', impact: 'Medium' },
        { title: 'CRM system training', votes: 26, department: 'Sales', impact: 'High' },
        { title: 'Process documentation training', votes: 20, department: 'All', impact: 'Medium' }
      ]
    },
    {
      category: 'Tools Requests',
      count: 42,
      suggestions: [
        { title: 'Integrated project management tool', votes: 38, department: 'All', impact: 'High' },
        { title: 'Advanced analytics dashboard', votes: 29, department: 'Management', impact: 'Medium' },
        { title: 'Mobile access to systems', votes: 25, department: 'Sales', impact: 'Medium' }
      ]
    }
  ];

  // Culture Health Data
  const cultureHealthData = [
    { department: 'Sales', health: 85, engagement: 'High', sentiment: 'Positive', risk: 'Low' },
    { department: 'Operations', health: 72, engagement: 'Medium', sentiment: 'Neutral', risk: 'Medium' },
    { department: 'Finance', health: 78, engagement: 'High', sentiment: 'Positive', risk: 'Low' },
    { department: 'HR', health: 65, engagement: 'Medium', sentiment: 'Mixed', risk: 'Medium' },
    { department: 'Marketing', health: 81, engagement: 'High', sentiment: 'Positive', risk: 'Low' },
    { department: 'IT', health: 59, engagement: 'Low', sentiment: 'Negative', risk: 'High' }
  ];

  // Role Clarity Data
  const roleClarityData = [
    { department: 'Operations', clear: 68, overlaps: 15, gaps: 17 },
    { department: 'Sales', clear: 82, overlaps: 8, gaps: 10 },
    { department: 'Finance', clear: 85, overlaps: 5, gaps: 10 },
    { department: 'HR', clear: 62, overlaps: 22, gaps: 16 },
    { department: 'Marketing', clear: 75, overlaps: 12, gaps: 13 },
    { department: 'IT', clear: 71, overlaps: 18, gaps: 11 }
  ];

  const getHealthColor = (health: number) => {
    if (health >= 80) return 'text-green-600';
    if (health >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'High': return 'bg-red-100 text-red-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'Low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'High': return 'bg-red-100 text-red-800';
      case 'Medium': return 'bg-orange-100 text-orange-800';
      case 'Low': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCultureHealthColor = (index: string) => {
    switch (index) {
      case 'High': return 'text-green-600';
      case 'Medium': return 'text-yellow-600';
      case 'At Risk': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Organizational Insights Dashboard</h1>
          <p className="text-gray-600 mt-1">Post-Survey Analytics & Executive Summary</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export Reports
          </Button>
          <Button variant="outline" size="sm">
            <Calendar className="w-4 h-4 mr-2" />
            Schedule Follow-ups
          </Button>
        </div>
      </div>

      {/* Executive Summary Panel */}
      <Card className="border-2 border-blue-200 bg-blue-50/30">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Executive Summary
          </CardTitle>
          <CardDescription>Top-level organizational health overview</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            <div className="text-center p-3 bg-white rounded-lg shadow-sm">
              <div className="text-2xl font-bold text-blue-600">{executiveSummary.totalEmployees}</div>
              <div className="text-sm text-gray-600">Employees Surveyed</div>
            </div>
            <div className="text-center p-3 bg-white rounded-lg shadow-sm">
              <div className="text-2xl font-bold text-green-600">{executiveSummary.completionRate}%</div>
              <div className="text-sm text-gray-600">Completion Rate</div>
            </div>
            <div className="text-center p-3 bg-white rounded-lg shadow-sm">
              <div className="text-2xl font-bold text-purple-600">{executiveSummary.avgInterviewTime}min</div>
              <div className="text-sm text-gray-600">Avg Interview Time</div>
            </div>
            <div className="text-center p-3 bg-white rounded-lg shadow-sm">
              <div className="text-2xl font-bold text-indigo-600">{executiveSummary.totalProcesses}</div>
              <div className="text-sm text-gray-600">Processes Identified</div>
            </div>
            <div className="text-center p-3 bg-white rounded-lg shadow-sm">
              <div className="text-2xl font-bold text-red-600">{executiveSummary.bottlenecksIdentified}</div>
              <div className="text-sm text-gray-600">Bottlenecks Found</div>
            </div>
            <div className="text-center p-3 bg-white rounded-lg shadow-sm">
              <div className="text-2xl font-bold text-orange-600">{executiveSummary.shadowProcessRate}%</div>
              <div className="text-sm text-gray-600">Shadow Processes</div>
            </div>
            <div className="text-center p-3 bg-white rounded-lg shadow-sm">
              <div className="text-2xl font-bold text-yellow-600">{executiveSummary.kpiMisalignmentRate}%</div>
              <div className="text-sm text-gray-600">KPI Misalignment</div>
            </div>
            <div className="text-center p-3 bg-white rounded-lg shadow-sm">
              <div className="text-2xl font-bold text-teal-600">{executiveSummary.optimizationSuggestions}</div>
              <div className="text-sm text-gray-600">Suggestions</div>
            </div>
            <div className="text-center p-3 bg-white rounded-lg shadow-sm">
              <div className={`text-2xl font-bold ${getCultureHealthColor(executiveSummary.cultureHealthIndex)}`}>
                {executiveSummary.cultureHealthIndex}
              </div>
              <div className="text-sm text-gray-600">Culture Health</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search and Filter Controls */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input 
                placeholder="Search processes, employees, or departments..." 
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                <SelectItem value="operations">Operations</SelectItem>
                <SelectItem value="sales">Sales</SelectItem>
                <SelectItem value="finance">Finance</SelectItem>
                <SelectItem value="hr">HR</SelectItem>
                <SelectItem value="marketing">Marketing</SelectItem>
                <SelectItem value="it">IT</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              More Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="process-map" className="space-y-4">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="process-map">Process Map</TabsTrigger>
          <TabsTrigger value="bottlenecks">Bottlenecks</TabsTrigger>
          <TabsTrigger value="shadow">Shadow Processes</TabsTrigger>
          <TabsTrigger value="kpi">KPI Alignment</TabsTrigger>
          <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
          <TabsTrigger value="culture">Culture Health</TabsTrigger>
          <TabsTrigger value="roles">Role Clarity</TabsTrigger>
        </TabsList>

        <TabsContent value="process-map" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Process Map Heatmap
              </CardTitle>
              <CardDescription>Interactive visualization of all organizational processes with health indicators</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 mb-6">
                <div className="flex gap-4 items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-red-500 rounded"></div>
                    <span className="text-sm">Bottleneck areas</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-orange-500 rounded"></div>
                    <span className="text-sm">Overhead-heavy processes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-500 rounded"></div>
                    <span className="text-sm">High-value processes</span>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {processHeatmapData.map((process, index) => (
                  <div key={index} className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-medium">{process.name}</h4>
                        <p className="text-sm text-gray-600">{process.department}</p>
                      </div>
                      <div className={`w-3 h-3 rounded-full ${
                        process.type === 'bottleneck' ? 'bg-red-500' :
                        process.type === 'overhead' ? 'bg-orange-500' : 'bg-green-500'
                      }`}></div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Efficiency Score</span>
                        <span className="font-medium">{process.value}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            process.type === 'bottleneck' ? 'bg-red-500' :
                            process.type === 'overhead' ? 'bg-orange-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${process.value}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between items-center text-sm text-gray-600">
                        <span>{process.employees} employees involved</span>
                        <Eye className="w-4 h-4 cursor-pointer hover:text-blue-600" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bottlenecks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                Top Organizational Bottlenecks
              </CardTitle>
              <CardDescription>Most critical process impediments ranked by frequency and impact</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topBottlenecks.map((bottleneck, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-medium text-lg">{bottleneck.process}</h4>
                          <Badge className={getImpactColor(bottleneck.impact)}>{bottleneck.impact} Impact</Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>Reported by {bottleneck.frequency} employees</span>
                          <span>Affects: {bottleneck.affectedTeams.join(', ')}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-red-600">#{index + 1}</div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-red-50 p-3 rounded">
                        <h5 className="font-medium text-red-800 mb-1">⚠️ Issue Identified</h5>
                        <p className="text-sm text-red-700">{bottleneck.issue}</p>
                      </div>
                      <div className="bg-green-50 p-3 rounded">
                        <h5 className="font-medium text-green-800 mb-1">🔧 Suggested Solution</h5>
                        <p className="text-sm text-green-700">{bottleneck.suggestedFix}</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <Eye className="w-4 h-4 mr-1" />
                        View Details
                      </Button>
                      <Button size="sm" variant="outline">
                        <Users className="w-4 h-4 mr-1" />
                        Affected Employees
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="shadow" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-orange-500" />
                Shadow Processes Analysis
              </CardTitle>
              <CardDescription>Unofficial tools and processes used across the organization</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {shadowProcessData.map((shadow, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <FileSpreadsheet className="w-5 h-5 text-orange-500" />
                          <h4 className="font-medium text-lg">{shadow.tool}</h4>
                          <Badge className={getRiskColor(shadow.risk)}>{shadow.risk} Risk</Badge>
                        </div>
                        <p className="text-sm text-gray-600">Used by {shadow.usage}% of surveyed employees</p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-orange-600">{shadow.usage}%</div>
                      </div>
                    </div>
                    
                    <div className="bg-orange-50 p-3 rounded mb-3">
                      <h5 className="font-medium text-orange-800 mb-1">Departments Using This Tool</h5>
                      <div className="flex flex-wrap gap-2">
                        {shadow.departments.map((dept, idx) => (
                          <Badge key={idx} variant="outline">{dept}</Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                      <div 
                        className="bg-orange-500 h-2 rounded-full"
                        style={{ width: `${shadow.usage}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="kpi" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-500" />
                KPI Alignment Report
              </CardTitle>
              <CardDescription>Employee understanding and alignment with key performance indicators</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {Math.round(kpiAlignmentData.reduce((acc, dept) => acc + dept.clear, 0) / kpiAlignmentData.length)}%
                    </div>
                    <div className="text-sm text-green-700">Fully Understand KPIs</div>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">
                      {Math.round(kpiAlignmentData.reduce((acc, dept) => acc + dept.partial, 0) / kpiAlignmentData.length)}%
                    </div>
                    <div className="text-sm text-yellow-700">Partial Understanding</div>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">
                      {Math.round(kpiAlignmentData.reduce((acc, dept) => acc + dept.unclear, 0) / kpiAlignmentData.length)}%
                    </div>
                    <div className="text-sm text-red-700">Unclear Understanding</div>
                  </div>
                </div>

                <div className="space-y-4">
                  {kpiAlignmentData.map((dept, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="font-medium text-lg">{dept.department}</h4>
                        <div className="text-sm text-gray-600">
                          Total: {dept.clear + dept.partial + dept.unclear}%
                        </div>
                      </div>
                      
                      <div className="w-full bg-gray-200 rounded-full h-4 flex overflow-hidden mb-2">
                        <div
                          className="bg-green-500 h-4"
                          style={{ width: `${dept.clear}%` }}
                        />
                        <div
                          className="bg-yellow-500 h-4"
                          style={{ width: `${dept.partial}%` }}
                        />
                        <div
                          className="bg-red-500 h-4"
                          style={{ width: `${dept.unclear}%` }}
                        />
                      </div>
                      
                      <div className="flex justify-between text-sm">
                        <span className="text-green-600">Clear: {dept.clear}%</span>
                        <span className="text-yellow-600">Partial: {dept.partial}%</span>
                        <span className="text-red-600">Unclear: {dept.unclear}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="suggestions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-yellow-500" />
                Optimization Suggestion Board
              </CardTitle>
              <CardDescription>Employee-generated improvement ideas categorized and prioritized</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {optimizationSuggestions.map((category, index) => (
                  <Card key={index}>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center justify-between">
                        <span>{category.category}</span>
                        <Badge variant="secondary">{category.count} suggestions</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {category.suggestions.map((suggestion, idx) => (
                          <div key={idx} className="border rounded p-3 hover:bg-gray-50">
                            <div className="flex justify-between items-start mb-2">
                              <h5 className="font-medium text-sm">{suggestion.title}</h5>
                              <Badge className={getImpactColor(suggestion.impact)} variant="outline">
                                {suggestion.impact}
                              </Badge>
                            </div>
                            <div className="flex justify-between items-center text-sm text-gray-600">
                              <span>{suggestion.department}</span>
                              <div className="flex items-center gap-2">
                                <ThumbsUp className="w-4 h-4" />
                                <span>{suggestion.votes}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="culture" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-pink-500" />
                Culture Fit Heatmap
              </CardTitle>
              <CardDescription>Departmental culture health and employee engagement levels</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {cultureHealthData.map((dept, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="font-medium text-lg">{dept.department}</h4>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>Engagement: {dept.engagement}</span>
                          <span>Sentiment: {dept.sentiment}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-2xl font-bold ${getHealthColor(dept.health)}`}>
                          {dept.health}
                        </div>
                        <Badge className={getRiskColor(dept.risk)}>{dept.risk} Risk</Badge>
                      </div>
                    </div>
                    
                    <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                      <div 
                        className={`h-3 rounded-full ${
                          dept.health >= 80 ? 'bg-green-500' :
                          dept.health >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${dept.health}%` }}
                      ></div>
                    </div>
                    
                    <div className="text-sm text-gray-600">
                      Health Score: {dept.health}/100
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GitBranch className="w-5 h-5 text-purple-500" />
                Role Clarity Matrix
              </CardTitle>
              <CardDescription>Employee understanding of roles, responsibilities, and organizational overlaps</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {roleClarityData.map((dept, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="font-medium text-lg">{dept.department}</h4>
                      <div className="text-sm text-gray-600">
                        Total Coverage: {dept.clear + dept.overlaps + dept.gaps}%
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="text-center p-3 bg-green-50 rounded">
                        <div className="text-xl font-bold text-green-600">{dept.clear}%</div>
                        <div className="text-sm text-green-700">Clear Roles</div>
                      </div>
                      <div className="text-center p-3 bg-orange-50 rounded">
                        <div className="text-xl font-bold text-orange-600">{dept.overlaps}%</div>
                        <div className="text-sm text-orange-700">Role Overlaps</div>
                      </div>
                      <div className="text-center p-3 bg-red-50 rounded">
                        <div className="text-xl font-bold text-red-600">{dept.gaps}%</div>
                        <div className="text-sm text-red-700">Role Gaps</div>
                      </div>
                    </div>
                    
                    <div className="w-full bg-gray-200 rounded-full h-4 flex overflow-hidden">
                      <div
                        className="bg-green-500 h-4"
                        style={{ width: `${dept.clear}%` }}
                      />
                      <div
                        className="bg-orange-500 h-4"
                        style={{ width: `${dept.overlaps}%` }}
                      />
                      <div
                        className="bg-red-500 h-4"
                        style={{ width: `${dept.gaps}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Analytics;
