import {
  AlertTriangle,
  CheckCircle2,
  Lightbulb,
  Users,
  Wrench,
  TrendingUp,
  Clock,
  Layers
} from 'lucide-react'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

const toolsData = [
  { name: 'Slack', usage: 85 },
  { name: 'Salesforce', usage: 72 },
  { name: 'Jira', usage: 68 },
  { name: 'Google Sheets', usage: 55 },
  { name: 'Notion', usage: 45 },
  { name: 'Zapier', usage: 38 },
]

const automationData = [
  { name: 'Manual', value: 45, color: '#ef4444' },
  { name: 'Semi-Automated', value: 30, color: '#f59e0b' },
  { name: 'Automated', value: 25, color: '#22c55e' },
]

const employees = [
  { name: 'John Smith', role: 'Sales Manager', processes: 5 },
  { name: 'Sarah Johnson', role: 'Operations Lead', processes: 8 },
  { name: 'Mike Chen', role: 'Support Manager', processes: 4 },
  { name: 'Emily Davis', role: 'HR Director', processes: 6 },
  { name: 'Alex Wilson', role: 'Finance Lead', processes: 3 },
  { name: 'Lisa Brown', role: 'Marketing Manager', processes: 4 },
]

const bottlenecks = [
  { process: 'Invoice Processing', step: 'Manual Approval', delay: '3-5 days', severity: 'high' },
  { process: 'Customer Onboarding', step: 'Document Verification', delay: '2-3 days', severity: 'medium' },
  { process: 'Order Fulfillment', step: 'Inventory Check', delay: '1-2 days', severity: 'medium' },
]

const duplicateWork = [
  { description: 'Customer data entered in both Salesforce and Google Sheets', departments: ['Sales', 'Support'], impact: 'high' },
  { description: 'Invoice created manually after automatic generation', departments: ['Finance'], impact: 'medium' },
]

const improvements = [
  { title: 'Automate Invoice Approval', impact: 'High', effort: 'Medium', savings: '15 hrs/week' },
  { title: 'Integrate CRM with Support', impact: 'High', effort: 'Low', savings: '10 hrs/week' },
  { title: 'Standardize Onboarding Docs', impact: 'Medium', effort: 'Low', savings: '5 hrs/week' },
]

const processOverlaps = [
  { processes: ['Customer Onboarding', 'Sales Follow-up'], overlap: 'Customer data collection', recommendation: 'Consolidate into single intake form' },
  { processes: ['Support Tickets', 'Product Feedback'], overlap: 'Issue categorization', recommendation: 'Unified tagging system' },
]

export default function Insights() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Insights</h1>
        <p className="text-slate-600">AI-powered analysis of your business processes</p>
      </div>

      {/* Top Row: Tools & Automation */}
      <div className="grid grid-cols-2 gap-6">
        {/* Tools Used */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Wrench size={18} className="text-slate-600" />
            <h3 className="font-semibold text-slate-900">Tools Used</h3>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={toolsData} layout="vertical">
              <XAxis type="number" domain={[0, 100]} hide />
              <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(value) => [`${value}%`, 'Usage']} />
              <Bar dataKey="usage" fill="#1e293b" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Automation Level */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={18} className="text-slate-600" />
            <h3 className="font-semibold text-slate-900">Automation Level</h3>
          </div>
          <div className="flex items-center justify-center">
            <ResponsiveContainer width={200} height={200}>
              <PieChart>
                <Pie
                  data={automationData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {automationData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value}%`, '']} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 ml-4">
              {automationData.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-sm text-slate-600">{item.name}</span>
                  <span className="text-sm font-medium text-slate-900">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Employee Involvement */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Users size={18} className="text-slate-600" />
          <h3 className="font-semibold text-slate-900">Employee Involvement</h3>
        </div>
        <div className="grid grid-cols-6 gap-3">
          {employees.map((emp) => (
            <div key={emp.name} className="text-center p-3 bg-slate-50 rounded-lg">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-2">
                <span className="text-slate-900 font-medium text-sm">
                  {emp.name.split(' ').map(n => n[0]).join('')}
                </span>
              </div>
              <p className="text-sm font-medium text-slate-900 truncate">{emp.name.split(' ')[0]}</p>
              <p className="text-xs text-slate-500 truncate">{emp.role}</p>
              <p className="text-xs text-slate-900 mt-1">{emp.processes} processes</p>
            </div>
          ))}
        </div>
      </div>

      {/* Process Overlaps */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Layers size={18} className="text-slate-600" />
          <h3 className="font-semibold text-slate-900">Process Overlaps</h3>
        </div>
        <div className="space-y-3">
          {processOverlaps.map((overlap, i) => (
            <div key={i} className="flex items-start gap-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  {overlap.processes.map((p, j) => (
                    <span key={j} className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                      {p}
                    </span>
                  ))}
                </div>
                <p className="text-sm text-slate-600">Overlap: {overlap.overlap}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500">Recommendation</p>
                <p className="text-sm text-blue-700">{overlap.recommendation}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-2 gap-6">
        {/* Duplicate Work */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={18} className="text-red-500" />
            <h3 className="font-semibold text-slate-900">Duplicate Work Identified</h3>
          </div>
          <div className="space-y-3">
            {duplicateWork.map((item, i) => (
              <div key={i} className="p-3 bg-red-50 rounded-lg border border-red-100">
                <p className="text-sm text-slate-700 mb-2">{item.description}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    {item.departments.map((d) => (
                      <span key={d} className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs">
                        {d}
                      </span>
                    ))}
                  </div>
                  <span className={`text-xs font-medium ${item.impact === 'high' ? 'text-red-600' : 'text-amber-600'}`}>
                    {item.impact} impact
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottlenecks */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Clock size={18} className="text-amber-500" />
            <h3 className="font-semibold text-slate-900">Bottlenecks</h3>
          </div>
          <div className="space-y-3">
            {bottlenecks.map((item, i) => (
              <div key={i} className="p-3 bg-amber-50 rounded-lg border border-amber-100">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium text-slate-900">{item.process}</p>
                  <span className={`text-xs font-medium ${item.severity === 'high' ? 'text-red-600' : 'text-amber-600'}`}>
                    {item.severity}
                  </span>
                </div>
                <p className="text-sm text-slate-600">{item.step}</p>
                <p className="text-xs text-amber-600 mt-1">Delay: {item.delay}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Improvement Recommendations */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb size={18} className="text-green-500" />
          <h3 className="font-semibold text-slate-900">Improvement Recommendations</h3>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {improvements.map((item, i) => (
            <div key={i} className="p-4 bg-green-50 rounded-lg border border-green-100">
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-medium text-slate-900">{item.title}</h4>
                <CheckCircle2 size={16} className="text-green-500" />
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Impact</span>
                  <span className={`font-medium ${item.impact === 'High' ? 'text-green-600' : 'text-blue-600'}`}>
                    {item.impact}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Effort</span>
                  <span className="font-medium text-slate-700">{item.effort}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Savings</span>
                  <span className="font-medium text-green-600">{item.savings}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
