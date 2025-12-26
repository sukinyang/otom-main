import { useState, useEffect } from 'react'
import {
  Users,
  Phone,
  MessageCircle,
  TrendingUp,
  Loader2,
  Lightbulb
} from 'lucide-react'
import { api, CallStats, Employee } from '../services/api'

export default function Insights() {
  const [stats, setStats] = useState<CallStats | null>(null)
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [statsData, employeesData] = await Promise.all([
        api.getCallStats(),
        api.getEmployees()
      ])
      setStats(statsData)
      setEmployees(employeesData)
    } catch (error) {
      console.error('Failed to fetch insights:', error)
    } finally {
      setLoading(false)
    }
  }

  const pendingOutreach = employees.filter(e => e.status === 'pending').length
  const contactedCount = employees.filter(e => e.status === 'contacted').length
  const interviewedCount = employees.filter(e => e.status === 'interviewed').length

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Insights</h1>
          <p className="text-slate-600">AI-powered analysis of your outreach and consultations</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-12 flex flex-col items-center justify-center">
          <Loader2 size={32} className="text-slate-400 animate-spin mb-3" />
          <p className="text-slate-500">Loading insights...</p>
        </div>
      </div>
    )
  }

  const hasData = employees.length > 0 || (stats && stats.total_calls > 0)

  if (!hasData) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Insights</h1>
          <p className="text-slate-600">AI-powered analysis of your outreach and consultations</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-12 flex flex-col items-center justify-center">
          <Lightbulb size={48} className="text-slate-300 mb-3" />
          <p className="text-slate-500 font-medium">No insights available yet</p>
          <p className="text-slate-400 text-sm">Add employees and start making calls to see insights</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Insights</h1>
        <p className="text-slate-600">AI-powered analysis of your outreach and consultations</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
              <Users size={20} className="text-slate-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{employees.length}</p>
              <p className="text-sm text-slate-500">Total Employees</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Phone size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{stats?.total_calls || 0}</p>
              <p className="text-sm text-slate-500">Total Calls</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <TrendingUp size={20} className="text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{stats?.completion_rate || 0}%</p>
              <p className="text-sm text-slate-500">Completion Rate</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <MessageCircle size={20} className="text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{stats?.avg_duration_formatted || '0m'}</p>
              <p className="text-sm text-slate-500">Avg Duration</p>
            </div>
          </div>
        </div>
      </div>

      {/* Outreach Pipeline */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="font-semibold text-slate-900 mb-4">Outreach Pipeline</h3>
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center p-4 bg-amber-50 rounded-lg border border-amber-100">
            <p className="text-3xl font-bold text-amber-700">{pendingOutreach}</p>
            <p className="text-sm text-amber-600">Pending Outreach</p>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-100">
            <p className="text-3xl font-bold text-blue-700">{contactedCount}</p>
            <p className="text-sm text-blue-600">Contacted</p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-100">
            <p className="text-3xl font-bold text-purple-700">{stats?.active_calls || 0}</p>
            <p className="text-sm text-purple-600">Active Calls</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg border border-green-100">
            <p className="text-3xl font-bold text-green-700">{interviewedCount}</p>
            <p className="text-sm text-green-600">Interviewed</p>
          </div>
        </div>
      </div>

      {/* Call Breakdown */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-900 mb-4">Call Direction</h3>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-slate-600">Inbound</span>
                <span className="text-sm font-medium text-slate-900">{stats?.inbound_calls || 0}</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full"
                  style={{ width: `${stats?.total_calls ? ((stats.inbound_calls || 0) / stats.total_calls) * 100 : 0}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-slate-600">Outbound</span>
                <span className="text-sm font-medium text-slate-900">{stats?.outbound_calls || 0}</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full"
                  style={{ width: `${stats?.total_calls ? ((stats.outbound_calls || 0) / stats.total_calls) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-900 mb-4">Call Status</h3>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-slate-600">Completed</span>
                <span className="text-sm font-medium text-slate-900">{stats?.completed_calls || 0}</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full"
                  style={{ width: `${stats?.total_calls ? ((stats.completed_calls || 0) / stats.total_calls) * 100 : 0}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-slate-600">Active</span>
                <span className="text-sm font-medium text-slate-900">{stats?.active_calls || 0}</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full"
                  style={{ width: `${stats?.total_calls ? ((stats.active_calls || 0) / stats.total_calls) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
