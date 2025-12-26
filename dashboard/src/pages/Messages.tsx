import { useState, useEffect } from 'react'
import {
  Search,
  MessageSquare,
  Phone,
  Send,
  Clock,
  CheckCircle,
  XCircle,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  Plus
} from 'lucide-react'
import clsx from 'clsx'

interface SMSMessage {
  id: string
  employee_id: string | null
  phone_number: string
  direction: 'inbound' | 'outbound'
  message: string
  status: string
  created_at: string
  employee_name?: string
}

interface Employee {
  id: string
  name: string
  phone_number: string
  company: string
  status: string
}

const statusConfig = {
  queued: { label: 'Queued', color: 'bg-amber-100 text-amber-700', icon: Clock },
  sent: { label: 'Sent', color: 'bg-blue-100 text-blue-700', icon: Send },
  delivered: { label: 'Delivered', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  received: { label: 'Received', color: 'bg-purple-100 text-purple-700', icon: ArrowDownLeft },
  failed: { label: 'Failed', color: 'bg-red-100 text-red-700', icon: XCircle },
}

const API_BASE = import.meta.env.VITE_API_URL || 'https://otom-production-1790.up.railway.app'

export default function Messages() {
  const [messages, setMessages] = useState<SMSMessage[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterDirection, setFilterDirection] = useState<'all' | 'inbound' | 'outbound'>('all')
  const [showSendModal, setShowSendModal] = useState(false)
  const [sendForm, setSendForm] = useState({ phone: '', name: '', company: 'Otom' })
  const [sending, setSending] = useState(false)

  useEffect(() => {
    fetchMessages()
    fetchEmployees()
  }, [])

  const fetchMessages = async () => {
    try {
      const response = await fetch(`${API_BASE}/sms/messages`)
      if (response.ok) {
        const data = await response.json()
        setMessages(data)
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchEmployees = async () => {
    try {
      const response = await fetch(`${API_BASE}/employees`)
      if (response.ok) {
        const data = await response.json()
        setEmployees(data)
      }
    } catch (error) {
      console.error('Failed to fetch employees:', error)
    }
  }

  const sendOutreach = async () => {
    setSending(true)
    try {
      const response = await fetch(`${API_BASE}/sms/outreach`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone_number: sendForm.phone,
          name: sendForm.name,
          company: sendForm.company
        })
      })
      if (response.ok) {
        setShowSendModal(false)
        setSendForm({ phone: '', name: '', company: 'Otom' })
        fetchMessages()
      }
    } catch (error) {
      console.error('Failed to send SMS:', error)
    } finally {
      setSending(false)
    }
  }

  const filteredMessages = messages.filter(msg => {
    const matchesSearch = msg.phone_number.includes(searchQuery) ||
      msg.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (msg.employee_name && msg.employee_name.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesDirection = filterDirection === 'all' || msg.direction === filterDirection
    return matchesSearch && matchesDirection
  })

  const totalMessages = messages.length
  const outboundCount = messages.filter(m => m.direction === 'outbound').length
  const inboundCount = messages.filter(m => m.direction === 'inbound').length
  const deliveredCount = messages.filter(m => m.status === 'delivered').length

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Messages</h1>
          <p className="text-slate-600">SMS outreach and conversation history</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchMessages}
            className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <RefreshCw size={18} />
            Refresh
          </button>
          <button
            onClick={() => setShowSendModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <Plus size={18} />
            Send SMS
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
              <MessageSquare size={20} className="text-slate-900" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{totalMessages}</p>
              <p className="text-sm text-slate-500">Total Messages</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <ArrowUpRight size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{outboundCount}</p>
              <p className="text-sm text-slate-500">Sent</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <ArrowDownLeft size={20} className="text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{inboundCount}</p>
              <p className="text-sm text-slate-500">Received</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <CheckCircle size={20} className="text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{deliveredCount}</p>
              <p className="text-sm text-slate-500">Delivered</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search messages..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-700"
            />
          </div>
          <div className="flex items-center gap-2">
            {(['all', 'outbound', 'inbound'] as const).map((dir) => (
              <button
                key={dir}
                onClick={() => setFilterDirection(dir)}
                className={clsx(
                  'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize',
                  filterDirection === dir
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                )}
              >
                {dir}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Messages List */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading messages...</div>
        ) : filteredMessages.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            <MessageSquare size={48} className="mx-auto mb-4 text-slate-300" />
            <p>No messages yet</p>
            <p className="text-sm mt-1">Send your first SMS to get started</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">Direction</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">Phone</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">Message</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">Status</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMessages.map((msg) => {
                const status = statusConfig[msg.status as keyof typeof statusConfig] || statusConfig.queued
                const StatusIcon = status.icon
                return (
                  <tr key={msg.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className={clsx(
                        'inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium',
                        msg.direction === 'outbound' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                      )}>
                        {msg.direction === 'outbound' ? <ArrowUpRight size={12} /> : <ArrowDownLeft size={12} />}
                        {msg.direction}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Phone size={14} className="text-slate-400" />
                        <span className="text-sm text-slate-900">{msg.phone_number}</span>
                      </div>
                      {msg.employee_name && (
                        <p className="text-xs text-slate-500 mt-0.5">{msg.employee_name}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-slate-700 max-w-md truncate">{msg.message}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className={clsx('inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium', status.color)}>
                        <StatusIcon size={12} />
                        {status.label}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-slate-500">{formatTime(msg.created_at)}</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Send SMS Modal */}
      {showSendModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Send SMS Outreach</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={sendForm.phone}
                  onChange={(e) => setSendForm({ ...sendForm, phone: e.target.value })}
                  placeholder="+14255551234"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-700"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                <input
                  type="text"
                  value={sendForm.name}
                  onChange={(e) => setSendForm({ ...sendForm, name: e.target.value })}
                  placeholder="John Doe"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-700"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Company</label>
                <input
                  type="text"
                  value={sendForm.company}
                  onChange={(e) => setSendForm({ ...sendForm, company: e.target.value })}
                  placeholder="Otom"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-700"
                />
              </div>
            </div>
            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={() => setShowSendModal(false)}
                className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={sendOutreach}
                disabled={sending || !sendForm.phone}
                className="flex-1 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50"
              >
                {sending ? 'Sending...' : 'Send SMS'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
