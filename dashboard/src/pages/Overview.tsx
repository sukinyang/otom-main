import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  AlertTriangle,
  GitBranch,
  RefreshCw,
  Zap,
  Clock,
  Users,
  TrendingUp,
  Phone,
  MessageSquare,
  Mail,
  CheckCircle2,
  User
} from 'lucide-react'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip
} from 'recharts'
import clsx from 'clsx'
import type { LucideIcon } from 'lucide-react'

interface Interviewee {
  name: string
  department: string
  status: 'done' | 'pending'
}

const recentProcesses = [
  { id: 1, name: 'Customer Onboarding', department: 'Sales', bottlenecks: 1, status: 'active' },
  { id: 2, name: 'Invoice Processing', department: 'Finance', bottlenecks: 2, status: 'needs_improvement' },
  { id: 3, name: 'Employee Offboarding', department: 'HR', bottlenecks: 1, status: 'active' },
  { id: 4, name: 'Bug Report Triage', department: 'Engineering', bottlenecks: 0, status: 'optimized' },
]

const interviewees: Interviewee[] = [
  { name: 'Sarah Johnson', department: 'Sales', status: 'done' },
  { name: 'Mike Chen', department: 'Engineering', status: 'done' },
  { name: 'Emily Davis', department: 'Finance', status: 'pending' },
  { name: 'John Smith', department: 'Finance', status: 'done' },
  { name: 'Amanda Wilson', department: 'Operations', status: 'pending' },
  { name: 'David Brown', department: 'HR', status: 'done' },
  { name: 'Lisa Taylor', department: 'Marketing', status: 'pending' },
]

const topInsights = [
  {
    id: 1,
    type: 'bottleneck',
    title: 'Proposal Creation taking 2-3 hours per deal',
    context: 'in Customer Onboarding',
    color: 'bg-red-50 border-red-200',
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600'
  },
  {
    id: 2,
    type: 'duplicate',
    title: 'Customer data entered in multiple systems',
    context: '4 hrs/week lost',
    color: 'bg-amber-50 border-amber-200',
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600'
  },
  {
    id: 3,
    type: 'improvement',
    title: 'Automate CRM sync to save 6+ hours/week',
    context: 'high priority',
    color: 'bg-green-50 border-green-200',
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600'
  },
]

const sessionData = [
  { day: 'Mon', sessions: 6, consultations: 3 },
  { day: 'Tue', sessions: 8, consultations: 4 },
  { day: 'Wed', sessions: 12, consultations: 6 },
  { day: 'Thu', sessions: 9, consultations: 5 },
  { day: 'Fri', sessions: 7, consultations: 3 },
  { day: 'Sat', sessions: 3, consultations: 1 },
  { day: 'Sun', sessions: 2, consultations: 1 },
]

const recentSessions = [
  { client: 'Acme Corp', type: 'voice', duration: '45 min', status: 'completed', time: '2 hours ago' },
  { client: 'TechStart Inc', type: 'chat', duration: '30 min', status: 'active', time: '5 min ago' },
  { client: 'Global Ventures', type: 'voice', duration: '1h 15min', status: 'completed', time: '4 hours ago' },
]

const statusConfig = {
  active: { label: 'Active', color: 'bg-blue-100 text-blue-700' },
  needs_improvement: { label: 'Needs Improvement', color: 'bg-red-100 text-red-700' },
  optimized: { label: 'Optimized', color: 'bg-green-100 text-green-700' },
  completed: { label: 'completed', color: 'bg-green-100 text-green-700' },
}

const typeIcons = {
  voice: Phone,
  chat: MessageSquare,
  email: Mail,
}

export default function Overview() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-slate-600">Monitor your consulting sessions and analytics</p>
        </div>
        <p className="text-sm text-slate-500">Last updated: Just now</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          label="Total Sessions"
          value="156"
          change="+12%"
          changeType="positive"
          icon={Phone}
          iconBg="bg-blue-100"
          iconColor="text-blue-600"
        />
        <StatCard
          label="Active Consultations"
          value="24"
          change="+8%"
          changeType="positive"
          icon={MessageSquare}
          iconBg="bg-green-100"
          iconColor="text-green-600"
        />
        <StatCard
          label="Avg. Duration"
          value="42 min"
          change="-5%"
          changeType="negative"
          icon={Clock}
          iconBg="bg-red-100"
          iconColor="text-red-600"
        />
        <StatCard
          label="Completion Rate"
          value="94%"
          change="+3%"
          changeType="positive"
          icon={TrendingUp}
          iconBg="bg-green-100"
          iconColor="text-green-600"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-3 gap-6">
        {/* Sessions Chart */}
        <div className="col-span-2 bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-900 mb-4">Sessions & Consultations</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={sessionData}>
              <defs>
                <linearGradient id="sessionGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="sessions"
                stroke="#818cf8"
                strokeWidth={2}
                fill="url(#sessionGradient)"
              />
              <Area
                type="monotone"
                dataKey="consultations"
                stroke="#c084fc"
                strokeWidth={2}
                fill="none"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Framework Usage */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-900 mb-4">Framework Usage</h3>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie
                data={[
                  { name: 'SWOT', value: 35 },
                  { name: "Porter's Five", value: 25 },
                  { name: 'PESTEL', value: 20 },
                  { name: 'Value Chain', value: 12 },
                  { name: 'BCG Matrix', value: 8 },
                ]}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={60}
                paddingAngle={2}
                dataKey="value"
              >
                <Cell fill="#818cf8" />
                <Cell fill="#c084fc" />
                <Cell fill="#f472b6" />
                <Cell fill="#94a3b8" />
                <Cell fill="#cbd5e1" />
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-2 justify-center text-xs">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-600" /> SWOT</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-400" /> Porter's Five</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-pink-400" /> PESTEL</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-400" /> Value Chain</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-300" /> BCG Matrix</span>
          </div>
        </div>
      </div>

      {/* Recent Sessions */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-900">Recent Sessions</h3>
          <Link to="/sessions" className="text-sm text-slate-900 hover:text-slate-800 font-medium">
            View all
          </Link>
        </div>
        <table className="w-full">
          <thead>
            <tr className="text-left text-xs text-slate-500 border-b border-slate-100">
              <th className="pb-3 font-medium">Client</th>
              <th className="pb-3 font-medium">Type</th>
              <th className="pb-3 font-medium">Duration</th>
              <th className="pb-3 font-medium">Status</th>
              <th className="pb-3 font-medium">Time</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {recentSessions.map((session, i) => {
              const TypeIcon = typeIcons[session.type as keyof typeof typeIcons]
              const status = statusConfig[session.status as keyof typeof statusConfig]
              return (
                <tr key={i} className="border-b border-slate-50 last:border-0">
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                        <Users size={14} className="text-slate-500" />
                      </div>
                      <span className="font-medium text-slate-900">{session.client}</span>
                    </div>
                  </td>
                  <td className="py-3">
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 rounded text-xs text-slate-600">
                      <TypeIcon size={12} />
                      {session.type.charAt(0).toUpperCase() + session.type.slice(1)}
                    </span>
                  </td>
                  <td className="py-3 text-slate-600">{session.duration}</td>
                  <td className="py-3">
                    <span className={clsx('px-2 py-1 rounded text-xs font-medium', status.color)}>
                      {status.label}
                    </span>
                  </td>
                  <td className="py-3 text-slate-500">{session.time}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-3 gap-6">
        {/* Recent Processes */}
        <div className="col-span-2 bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900">Recent Processes</h3>
            <Link to="/processes" className="text-sm text-slate-900 hover:text-slate-800 font-medium flex items-center gap-1">
              View All <ArrowRight size={14} />
            </Link>
          </div>
          <div className="space-y-3">
            {recentProcesses.map((process) => {
              const status = statusConfig[process.status as keyof typeof statusConfig]
              return (
                <div key={process.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center">
                      <GitBranch size={18} className="text-slate-500" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{process.name}</p>
                      <p className="text-sm text-slate-500">{process.department}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {process.bottlenecks > 0 && (
                      <span className="flex items-center gap-1 text-amber-600 text-sm">
                        <AlertTriangle size={14} />
                        {process.bottlenecks}
                      </span>
                    )}
                    <span className={clsx('px-2 py-1 rounded text-xs font-medium', status.color)}>
                      {status.label}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Interview Status */}
        <InterviewStatus interviewees={interviewees} />
      </div>

      {/* Top Insights */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-900">Top Insights</h3>
          <Link to="/insights" className="text-sm text-slate-900 hover:text-slate-800 font-medium flex items-center gap-1">
            View All Insights <ArrowRight size={14} />
          </Link>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {topInsights.map((insight) => (
            <div key={insight.id} className={clsx('p-4 rounded-lg border', insight.color)}>
              <div className="flex items-center gap-2 mb-2">
                <div className={clsx('w-6 h-6 rounded flex items-center justify-center', insight.iconBg)}>
                  {insight.type === 'bottleneck' && <AlertTriangle size={14} className={insight.iconColor} />}
                  {insight.type === 'duplicate' && <RefreshCw size={14} className={insight.iconColor} />}
                  {insight.type === 'improvement' && <Zap size={14} className={insight.iconColor} />}
                </div>
                <span className="text-xs font-medium text-slate-500 uppercase">{insight.type}</span>
              </div>
              <p className="text-sm font-medium text-slate-900 mb-1">{insight.title}</p>
              <p className={clsx(
                'text-xs',
                insight.type === 'duplicate' ? 'text-red-600' :
                insight.type === 'improvement' ? 'text-green-600 font-medium' : 'text-slate-500'
              )}>
                {insight.context}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Banner */}
      <div className="bg-slate-900 rounded-xl p-6 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Ready to optimize your processes?</h3>
          <p className="text-slate-200">View detailed insights and recommendations to improve efficiency.</p>
        </div>
        <div className="flex gap-3">
          <Link to="/processes" className="px-4 py-2 bg-white text-slate-900 rounded-lg font-medium hover:bg-slate-50 transition-colors">
            View Processes
          </Link>
          <Link to="/insights" className="px-4 py-2 bg-slate-700 text-white rounded-lg font-medium hover:bg-slate-600 transition-colors flex items-center gap-2">
            See Insights <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  )
}

interface StatCardProps {
  label: string
  value: string
  change: string
  changeType: 'positive' | 'negative'
  icon: LucideIcon
  iconBg: string
  iconColor: string
}

function StatCard({ label, value, change, changeType, icon: Icon, iconBg, iconColor }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500 mb-1">{label}</p>
          <p className="text-2xl font-bold text-slate-900">{value}</p>
        </div>
        <div className={clsx('w-10 h-10 rounded-lg flex items-center justify-center', iconBg)}>
          <Icon size={20} className={iconColor} />
        </div>
      </div>
      <p className={clsx(
        'text-xs mt-2 flex items-center gap-1',
        changeType === 'positive' ? 'text-green-600' : 'text-red-600'
      )}>
        <TrendingUp size={12} className={changeType === 'negative' ? 'rotate-180' : ''} />
        {change} vs last week
      </p>
    </div>
  )
}

function InterviewStatus({ interviewees }: { interviewees: Interviewee[] }) {
  const [filter, setFilter] = useState<'all' | 'done' | 'pending'>('all')

  const completedCount = interviewees.filter(i => i.status === 'done').length
  const pendingCount = interviewees.filter(i => i.status === 'pending').length

  const filteredInterviewees = filter === 'all'
    ? interviewees
    : interviewees.filter(i => i.status === filter)

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-slate-900">Interview Status</h3>
        <button className="text-sm text-slate-600 border border-slate-200 px-3 py-1 rounded-lg hover:bg-slate-50">
          View All
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setFilter('all')}
          className={clsx(
            'px-4 py-1.5 rounded-full text-sm font-medium transition-colors',
            filter === 'all'
              ? 'bg-slate-900 text-white'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          )}
        >
          All ({interviewees.length})
        </button>
        <button
          onClick={() => setFilter('done')}
          className={clsx(
            'px-4 py-1.5 rounded-full text-sm font-medium transition-colors',
            filter === 'done'
              ? 'bg-green-100 text-green-700'
              : 'bg-green-50 text-green-600 hover:bg-green-100'
          )}
        >
          Completed ({completedCount})
        </button>
        <button
          onClick={() => setFilter('pending')}
          className={clsx(
            'px-4 py-1.5 rounded-full text-sm font-medium transition-colors',
            filter === 'pending'
              ? 'bg-yellow-100 text-yellow-700'
              : 'bg-yellow-50 text-yellow-600 hover:bg-yellow-100'
          )}
        >
          Pending ({pendingCount})
        </button>
      </div>

      {/* Interviewee List */}
      <div className="space-y-3 max-h-[280px] overflow-y-auto">
        {filteredInterviewees.map((person, i) => (
          <div key={i} className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                <User size={18} className="text-slate-400" />
              </div>
              <div>
                <p className="font-medium text-slate-900">{person.name}</p>
                <p className="text-sm text-slate-500">{person.department}</p>
              </div>
            </div>
            <span className={clsx(
              'flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium',
              person.status === 'done'
                ? 'bg-green-50 text-green-600'
                : 'bg-yellow-50 text-yellow-600'
            )}>
              {person.status === 'done' ? (
                <>
                  <CheckCircle2 size={14} />
                  Done
                </>
              ) : (
                <>
                  <Clock size={14} />
                  Pending
                </>
              )}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
