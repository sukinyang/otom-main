import { useState, useEffect } from 'react'
import {
  Search,
  Phone,
  MessageSquare,
  Mail,
  Clock,
  Calendar,
  MoreVertical,
  Play,
  Loader2,
  AlertCircle,
  PhoneIncoming,
  PhoneOutgoing
} from 'lucide-react'
import clsx from 'clsx'
import { api, CallSession } from '../services/api'

const typeConfig = {
  voice: { icon: Phone, color: 'bg-green-100 text-green-600' },
  chat: { icon: MessageSquare, color: 'bg-blue-100 text-blue-600' },
  email: { icon: Mail, color: 'bg-amber-100 text-amber-600' },
}

const statusConfig = {
  completed: { label: 'completed', color: 'bg-green-100 text-green-700' },
  'in-progress': { label: 'active', color: 'bg-blue-100 text-blue-700' },
  connecting: { label: 'connecting', color: 'bg-amber-100 text-amber-700' },
  initiated: { label: 'pending', color: 'bg-amber-100 text-amber-700' },
  failed: { label: 'failed', color: 'bg-red-100 text-red-700' },
}

function formatDuration(seconds?: number): string {
  if (!seconds) return '-'
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  if (mins > 60) {
    const hours = Math.floor(mins / 60)
    const remainingMins = mins % 60
    return `${hours}h ${remainingMins}m`
  }
  return `${mins}m ${secs}s`
}

function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  } catch {
    return dateString
  }
}

export default function Sessions() {
  const [filterType] = useState<'all' | 'voice' | 'chat' | 'email'>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [calls, setCalls] = useState<CallSession[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchCalls()
  }, [])

  async function fetchCalls() {
    try {
      setLoading(true)
      setError(null)
      const response = await api.getCallSessions({ limit: 100 })
      setCalls(response.calls)
    } catch (err) {
      setError('Failed to load call sessions. Make sure the backend is running.')
      console.error('Failed to fetch calls:', err)
    } finally {
      setLoading(false)
    }
  }

  const filteredCalls = calls.filter(call => {
    // For now, all calls are voice type since we're fetching from voice/calls
    if (filterType !== 'all' && filterType !== 'voice') return false
    if (filterStatus !== 'all' && call.status !== filterStatus) return false
    if (searchQuery && !call.phone_number.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  const voiceCalls = calls.length
  const completedCalls = calls.filter(c => c.status === 'completed').length
  const activeCalls = calls.filter(c => ['connecting', 'in-progress', 'initiated'].includes(c.status)).length

  // Calculate average duration
  const durations = calls
    .filter(c => c.duration_seconds)
    .map(c => c.duration_seconds!)
  const avgDuration = durations.length > 0
    ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
    : 0

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Sessions</h1>
          <p className="text-slate-600">View and manage all consulting sessions</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors">
          <Play size={18} />
          Start New Session
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <Phone size={20} className="text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{voiceCalls}</p>
              <p className="text-sm text-slate-500">Total Calls</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <MessageSquare size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{activeCalls}</p>
              <p className="text-sm text-slate-500">Active Sessions</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <Mail size={20} className="text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{completedCalls}</p>
              <p className="text-sm text-slate-500">Completed</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <Clock size={20} className="text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{formatDuration(avgDuration)}</p>
              <p className="text-sm text-slate-500">Avg Duration</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by phone number..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-700"
            />
          </div>
          <div className="flex items-center gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-1.5 rounded-lg text-sm font-medium bg-slate-100 text-slate-600 border-0 focus:ring-2 focus:ring-slate-700"
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="in-progress">Active</option>
              <option value="connecting">Connecting</option>
              <option value="failed">Failed</option>
            </select>
            <button
              onClick={fetchCalls}
              className="px-3 py-1.5 rounded-lg text-sm font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="bg-white rounded-xl border border-slate-200 p-12 flex flex-col items-center justify-center">
          <Loader2 size={32} className="text-slate-400 animate-spin mb-3" />
          <p className="text-slate-500">Loading call sessions...</p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="bg-red-50 rounded-xl border border-red-200 p-6 flex items-center gap-4">
          <AlertCircle size={24} className="text-red-500" />
          <div>
            <p className="font-medium text-red-700">{error}</p>
            <button
              onClick={fetchCalls}
              className="text-sm text-red-600 hover:text-red-700 underline mt-1"
            >
              Try again
            </button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredCalls.length === 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-12 flex flex-col items-center justify-center">
          <Phone size={48} className="text-slate-300 mb-3" />
          <p className="text-slate-500 font-medium">No call sessions found</p>
          <p className="text-slate-400 text-sm">Call sessions will appear here once calls are made via Vapi</p>
        </div>
      )}

      {/* Sessions List */}
      {!loading && !error && filteredCalls.length > 0 && (
        <div className="space-y-3">
          {filteredCalls.map((call) => {
            const type = typeConfig.voice
            const TypeIcon = type.icon
            const status = statusConfig[call.status as keyof typeof statusConfig] || statusConfig.initiated
            const DirectionIcon = call.direction === 'inbound' ? PhoneIncoming : PhoneOutgoing

            return (
              <div key={call.id} className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-start gap-4">
                  <div className={clsx('w-12 h-12 rounded-lg flex items-center justify-center', type.color)}>
                    <TypeIcon size={24} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-slate-900">{call.phone_number}</h3>
                          <DirectionIcon size={14} className="text-slate-400" />
                          <span className="text-xs text-slate-400">{call.direction}</span>
                        </div>
                        <p className="text-sm text-slate-500">
                          {call.vapi_call_id ? `Call ID: ${call.vapi_call_id.slice(0, 8)}...` : 'Voice consultation'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={clsx('px-2 py-1 rounded text-xs font-medium', status.color)}>
                          {status.label}
                        </span>
                        <button className="p-1 hover:bg-slate-100 rounded transition-colors">
                          <MoreVertical size={16} className="text-slate-400" />
                        </button>
                      </div>
                    </div>
                    {call.summary && (
                      <p className="text-sm text-slate-600 mb-2 line-clamp-2">{call.summary}</p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Calendar size={12} />
                        {formatDate(call.started_at || call.created_at)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {formatDuration(call.duration_seconds)}
                      </span>
                      {call.cost && (
                        <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-600">
                          ${call.cost.toFixed(2)}
                        </span>
                      )}
                      <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-600">
                        {call.platform}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
