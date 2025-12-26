import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  RefreshCw,
  Clock,
  Users,
  TrendingUp,
  Phone,
  MessageSquare,
  CheckCircle2,
  Loader2
} from 'lucide-react'
import { api, CallSession, CallStats, Employee } from '../services/api'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip
} from 'recharts'
import clsx from 'clsx'
import type { LucideIcon } from 'lucide-react'

function formatDuration(seconds?: number): string {
  if (!seconds) return '-'
  const mins = Math.floor(seconds / 60)
  if (mins > 60) {
    const hours = Math.floor(mins / 60)
    const remainingMins = mins % 60
    return `${hours}h ${remainingMins}m`
  }
  return `${mins} min`
}

function formatTimeAgo(dateString: string): string {
  try {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} min ago`
    if (diffHours < 24) return `${diffHours} hours ago`
    return `${diffDays} days ago`
  } catch {
    return dateString
  }
}

const statusConfig = {
  active: { label: 'Active', color: 'bg-blue-100 text-blue-700' },
  completed: { label: 'completed', color: 'bg-green-100 text-green-700' },
}

function generateSessionData(calls: CallSession[]) {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const counts: Record<string, { sessions: number; completed: number }> = {}

  days.forEach(day => {
    counts[day] = { sessions: 0, completed: 0 }
  })

  calls.forEach(call => {
    const date = new Date(call.created_at)
    const dayName = days[date.getDay()]
    counts[dayName].sessions++
    if (call.status === 'completed') {
      counts[dayName].completed++
    }
  })

  return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => ({
    day,
    sessions: counts[day].sessions,
    completed: counts[day].completed
  }))
}

export default function Overview() {
  const [stats, setStats] = useState<CallStats | null>(null)
  const [recentCalls, setRecentCalls] = useState<CallSession[]>([])
  const [allCalls, setAllCalls] = useState<CallSession[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      setLoading(true)
      const [statsResponse, callsResponse, allCallsResponse, employeesResponse] = await Promise.all([
        api.getCallStats(),
        api.getCallSessions({ limit: 5 }),
        api.getCallSessions({ limit: 100 }),
        api.getEmployees()
      ])
      setStats(statsResponse)
      setRecentCalls(callsResponse.calls)
      setAllCalls(allCallsResponse.calls)
      setEmployees(employeesResponse)
      setLastUpdated(new Date())
    } catch (err) {
      console.error('Failed to fetch overview data:', err)
    } finally {
      setLoading(false)
    }
  }

  const sessionData = generateSessionData(allCalls)

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-slate-600">Monitor your consulting sessions and analytics</p>
        </div>
        <div className="flex items-center gap-3">
          <p className="text-sm text-slate-500">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
          <button
            onClick={fetchData}
            className="p-1.5 hover:bg-slate-100 rounded transition-colors"
            title="Refresh"
          >
            <RefreshCw size={16} className={clsx('text-slate-500', loading && 'animate-spin')} />
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          label="Total Sessions"
          value={loading ? '...' : String(stats?.total_calls || 0)}
          icon={Phone}
          iconBg="bg-blue-100"
          iconColor="text-blue-600"
        />
        <StatCard
          label="Active Consultations"
          value={loading ? '...' : String(stats?.active_calls || 0)}
          icon={MessageSquare}
          iconBg="bg-green-100"
          iconColor="text-green-600"
        />
        <StatCard
          label="Avg. Duration"
          value={loading ? '...' : (stats?.avg_duration_formatted || '0m')}
          icon={Clock}
          iconBg="bg-purple-100"
          iconColor="text-purple-600"
        />
        <StatCard
          label="Completion Rate"
          value={loading ? '...' : `${stats?.completion_rate || 0}%`}
          icon={TrendingUp}
          iconBg="bg-green-100"
          iconColor="text-green-600"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-6">
        {/* Sessions Chart */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-900 mb-4">Sessions by Day</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={sessionData}>
              <defs>
                <linearGradient id="sessionGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="completedGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
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
                name="Total Sessions"
              />
              <Area
                type="monotone"
                dataKey="completed"
                stroke="#22c55e"
                strokeWidth={2}
                fill="url(#completedGradient)"
                name="Completed"
              />
            </AreaChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-6 mt-4 text-xs text-slate-600">
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-indigo-400" />
              Total Sessions
            </span>
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-green-500" />
              Completed
            </span>
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
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={24} className="text-slate-400 animate-spin" />
          </div>
        ) : recentCalls.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-slate-500">
            <Phone size={32} className="text-slate-300 mb-2" />
            <p>No recent sessions</p>
            <p className="text-sm text-slate-400">Call data will appear here once calls are made</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs text-slate-500 border-b border-slate-100">
                <th className="pb-3 font-medium">Phone Number</th>
                <th className="pb-3 font-medium">Type</th>
                <th className="pb-3 font-medium">Duration</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium">Time</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {recentCalls.map((call) => {
                const TypeIcon = Phone
                const callStatus = call.status === 'completed'
                  ? statusConfig.completed
                  : call.status === 'in-progress' || call.status === 'connecting'
                  ? statusConfig.active
                  : statusConfig.active
                return (
                  <tr key={call.id} className="border-b border-slate-50 last:border-0">
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                          <Users size={14} className="text-slate-500" />
                        </div>
                        <span className="font-medium text-slate-900">{call.phone_number}</span>
                      </div>
                    </td>
                    <td className="py-3">
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 rounded text-xs text-slate-600">
                        <TypeIcon size={12} />
                        Voice
                      </span>
                    </td>
                    <td className="py-3 text-slate-600">{formatDuration(call.duration_seconds)}</td>
                    <td className="py-3">
                      <span className={clsx('px-2 py-1 rounded text-xs font-medium', callStatus.color)}>
                        {call.status}
                      </span>
                    </td>
                    <td className="py-3 text-slate-500">{formatTimeAgo(call.started_at || call.created_at)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Bottom Row - Employee Status */}
      <div className="grid grid-cols-1 gap-6">
        <EmployeeStatus employees={employees} loading={loading} />
      </div>

      {/* CTA Banner */}
      <div className="bg-slate-900 rounded-xl p-6 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Ready to start outreach?</h3>
          <p className="text-slate-200">Add employees and send SMS to schedule voice consultations.</p>
        </div>
        <div className="flex gap-3">
          <Link to="/employees" className="px-4 py-2 bg-white text-slate-900 rounded-lg font-medium hover:bg-slate-50 transition-colors">
            Manage Employees
          </Link>
          <Link to="/messages" className="px-4 py-2 bg-slate-700 text-white rounded-lg font-medium hover:bg-slate-600 transition-colors flex items-center gap-2">
            View Messages <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  )
}

interface StatCardProps {
  label: string
  value: string
  icon: LucideIcon
  iconBg: string
  iconColor: string
}

function StatCard({ label, value, icon: Icon, iconBg, iconColor }: StatCardProps) {
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
    </div>
  )
}

const employeeStatusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pending', color: 'bg-amber-50 text-amber-600' },
  contacted: { label: 'Contacted', color: 'bg-blue-50 text-blue-600' },
  call_requested: { label: 'Call Requested', color: 'bg-purple-50 text-purple-600' },
  interviewed: { label: 'Interviewed', color: 'bg-green-50 text-green-600' },
  declined: { label: 'Declined', color: 'bg-red-50 text-red-600' },
}

function EmployeeStatus({ employees, loading }: { employees: Employee[]; loading: boolean }) {
  const [filter, setFilter] = useState<string>('all')

  const interviewedCount = employees.filter(e => e.status === 'interviewed').length
  const pendingCount = employees.filter(e => e.status === 'pending').length
  const contactedCount = employees.filter(e => ['contacted', 'call_requested'].includes(e.status)).length

  const filteredEmployees = filter === 'all'
    ? employees
    : employees.filter(e => e.status === filter)

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-slate-900">Employee Outreach Status</h3>
        <Link to="/employees" className="text-sm text-slate-600 border border-slate-200 px-3 py-1 rounded-lg hover:bg-slate-50">
          Manage
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <button
          onClick={() => setFilter('all')}
          className={clsx(
            'px-4 py-1.5 rounded-full text-sm font-medium transition-colors',
            filter === 'all'
              ? 'bg-slate-900 text-white'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          )}
        >
          All ({employees.length})
        </button>
        <button
          onClick={() => setFilter('pending')}
          className={clsx(
            'px-4 py-1.5 rounded-full text-sm font-medium transition-colors',
            filter === 'pending'
              ? 'bg-amber-100 text-amber-700'
              : 'bg-amber-50 text-amber-600 hover:bg-amber-100'
          )}
        >
          Pending ({pendingCount})
        </button>
        <button
          onClick={() => setFilter('contacted')}
          className={clsx(
            'px-4 py-1.5 rounded-full text-sm font-medium transition-colors',
            filter === 'contacted'
              ? 'bg-blue-100 text-blue-700'
              : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
          )}
        >
          In Progress ({contactedCount})
        </button>
        <button
          onClick={() => setFilter('interviewed')}
          className={clsx(
            'px-4 py-1.5 rounded-full text-sm font-medium transition-colors',
            filter === 'interviewed'
              ? 'bg-green-100 text-green-700'
              : 'bg-green-50 text-green-600 hover:bg-green-100'
          )}
        >
          Interviewed ({interviewedCount})
        </button>
      </div>

      {/* Employee List */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 size={24} className="text-slate-400 animate-spin" />
        </div>
      ) : filteredEmployees.length === 0 ? (
        <div className="text-center py-8 text-slate-500">
          <Users size={32} className="mx-auto mb-2 text-slate-300" />
          <p>No employees yet</p>
          <Link to="/employees" className="text-sm text-slate-900 underline mt-1 inline-block">Add employees</Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {filteredEmployees.slice(0, 8).map((employee) => {
            const status = employeeStatusConfig[employee.status] || employeeStatusConfig.pending
            return (
              <div key={employee.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-medium text-slate-700">
                    {employee.name?.split(' ').map(n => n[0]).join('') || '?'}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-slate-900 truncate">{employee.name}</p>
                  <span className={clsx('inline-flex items-center gap-1 text-xs font-medium', status.color)}>
                    {employee.status === 'interviewed' && <CheckCircle2 size={12} />}
                    {employee.status === 'pending' && <Clock size={12} />}
                    {status.label}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
      {filteredEmployees.length > 8 && (
        <Link to="/employees" className="block text-center text-sm text-slate-600 mt-4 hover:text-slate-900">
          View all {filteredEmployees.length} employees
        </Link>
      )}
    </div>
  )
}
