import { useState } from 'react'
import {
  Search,
  Phone,
  MessageSquare,
  Mail,
  Clock,
  Calendar,
  MoreVertical,
  Play
} from 'lucide-react'
import clsx from 'clsx'

interface Session {
  id: string
  client: string
  email: string
  description: string
  date: string
  time: string
  duration: string
  type: 'voice' | 'chat' | 'email'
  status: 'completed' | 'active' | 'pending'
  frameworks: string[]
}

const sessions: Session[] = [
  {
    id: '1',
    client: 'Acme Corporation',
    email: 'john@acme.com',
    description: 'Initial SWOT analysis consultation for market expansion strategy',
    date: 'Jan 15, 10:30 AM',
    time: '10:30 AM',
    duration: '45m',
    type: 'voice',
    status: 'completed',
    frameworks: ['SWOT', "Porter's Five Forces"]
  },
  {
    id: '2',
    client: 'TechStart Inc',
    email: 'sarah@techstart.io',
    description: 'Discussing competitive landscape analysis',
    date: 'Jan 15, 02:00 PM',
    time: '02:00 PM',
    duration: '30m',
    type: 'chat',
    status: 'active',
    frameworks: ["Porter's Five Forces"]
  },
  {
    id: '3',
    client: 'Global Ventures',
    email: 'mike@globalventures.com',
    description: 'Comprehensive business strategy review and process mapping',
    date: 'Jan 14, 09:00 AM',
    time: '09:00 AM',
    duration: '1h 15m',
    type: 'voice',
    status: 'completed',
    frameworks: ['SWOT', 'PESTEL', 'Value Chain']
  },
  {
    id: '4',
    client: 'Innovation Labs',
    email: 'alex@innovationlabs.com',
    description: 'Follow-up on market research findings',
    date: 'Jan 14, 03:00 PM',
    time: '03:00 PM',
    duration: '20m',
    type: 'email',
    status: 'pending',
    frameworks: ['SWOT']
  },
  {
    id: '5',
    client: 'RetailMax',
    email: 'lisa@retailmax.com',
    description: 'Supply chain optimization discussion',
    date: 'Jan 13, 11:00 AM',
    time: '11:00 AM',
    duration: '55m',
    type: 'voice',
    status: 'completed',
    frameworks: ['Value Chain', 'PESTEL']
  },
]

const typeConfig = {
  voice: { icon: Phone, color: 'bg-green-100 text-green-600' },
  chat: { icon: MessageSquare, color: 'bg-blue-100 text-blue-600' },
  email: { icon: Mail, color: 'bg-amber-100 text-amber-600' },
}

const statusConfig = {
  completed: { label: 'completed', color: 'bg-green-100 text-green-700' },
  active: { label: 'active', color: 'bg-blue-100 text-blue-700' },
  pending: { label: 'pending', color: 'bg-amber-100 text-amber-700' },
}

export default function Sessions() {
  const [filterType, setFilterType] = useState<'all' | 'voice' | 'chat' | 'email'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const filteredSessions = sessions.filter(s => {
    if (filterType !== 'all' && s.type !== filterType) return false
    if (searchQuery && !s.client.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  const voiceCalls = sessions.filter(s => s.type === 'voice').length
  const chatSessions = sessions.filter(s => s.type === 'chat').length
  const emailThreads = sessions.filter(s => s.type === 'email').length

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
              <p className="text-2xl font-bold text-slate-900">{voiceCalls * 12}</p>
              <p className="text-sm text-slate-500">Voice Calls</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <MessageSquare size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{chatSessions * 18}</p>
              <p className="text-sm text-slate-500">Chat Sessions</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <Mail size={20} className="text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{emailThreads * 12}</p>
              <p className="text-sm text-slate-500">Email Threads</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <Clock size={20} className="text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">42m</p>
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
              placeholder="Search sessions..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-700"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilterType('all')}
              className={clsx(
                'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                filterType === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              )}
            >
              All
            </button>
            <button
              onClick={() => setFilterType('voice')}
              className={clsx(
                'flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                filterType === 'voice' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              )}
            >
              <Phone size={14} />
              Voice
            </button>
            <button
              onClick={() => setFilterType('chat')}
              className={clsx(
                'flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                filterType === 'chat' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              )}
            >
              <MessageSquare size={14} />
              Chat
            </button>
            <button
              onClick={() => setFilterType('email')}
              className={clsx(
                'flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                filterType === 'email' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              )}
            >
              <Mail size={14} />
              Email
            </button>
          </div>
        </div>
      </div>

      {/* Sessions List */}
      <div className="space-y-3">
        {filteredSessions.map((session) => {
          const type = typeConfig[session.type]
          const TypeIcon = type.icon
          const status = statusConfig[session.status]
          return (
            <div key={session.id} className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-start gap-4">
                <div className={clsx('w-12 h-12 rounded-lg flex items-center justify-center', type.color)}>
                  <TypeIcon size={24} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <div>
                      <h3 className="font-semibold text-slate-900">{session.client}</h3>
                      <p className="text-sm text-slate-500">{session.email}</p>
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
                  <p className="text-sm text-slate-600 mb-2">{session.description}</p>
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Calendar size={12} />
                      {session.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {session.duration}
                    </span>
                    <div className="flex items-center gap-1">
                      {session.frameworks.map((fw) => (
                        <span key={fw} className="px-2 py-0.5 bg-slate-100 rounded text-slate-600">
                          {fw}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
