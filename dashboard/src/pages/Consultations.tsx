import { useState } from 'react'
import {
  Plus,
  Calendar,
  Mail,
  User,
  CheckCircle2,
  Circle,
  Clock
} from 'lucide-react'
import clsx from 'clsx'

interface Consultation {
  id: string
  title: string
  client: string
  contact: string
  email: string
  date: string
  progress: number
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  frameworks: string[]
  deliverables: { name: string; completed: boolean }[]
}

const consultations: Consultation[] = [
  {
    id: '1',
    title: 'Strategic Planning',
    client: 'Acme Corporation',
    contact: 'John Smith',
    email: 'john@acme.com',
    date: 'Mon, Jan 15, 10:00 AM',
    progress: 65,
    status: 'in_progress',
    frameworks: ['SWOT', "Porter's Five Forces", 'PESTEL'],
    deliverables: [
      { name: 'Market Analysis Report', completed: true },
      { name: 'Competitive Landscape', completed: true },
      { name: 'Strategic Recommendations', completed: false },
    ]
  },
  {
    id: '2',
    title: 'Process Optimization',
    client: 'TechStart Inc',
    contact: 'Sarah Johnson',
    email: 'sarah@techstart.io',
    date: 'Tue, Jan 16, 02:00 PM',
    progress: 0,
    status: 'pending',
    frameworks: ['Value Chain Analysis', 'Process Mapping'],
    deliverables: [
      { name: 'Current State Analysis', completed: false },
      { name: 'Process Map', completed: false },
      { name: 'Improvement Plan', completed: false },
    ]
  },
  {
    id: '3',
    title: 'Market Entry Strategy',
    client: 'Global Ventures',
    contact: 'Michael Chen',
    email: 'mike@globalventures.com',
    date: 'Wed, Jan 10, 09:00 AM',
    progress: 100,
    status: 'completed',
    frameworks: ['PESTEL', 'SWOT', 'Market Sizing'],
    deliverables: [
      { name: 'Market Research', completed: true },
      { name: 'Entry Strategy', completed: true },
      { name: 'Risk Assessment', completed: true },
    ]
  },
  {
    id: '4',
    title: 'Digital Transformation',
    client: 'Innovation Labs',
    contact: 'Emily Davis',
    email: 'emily@innovationlabs.com',
    date: 'Mon, Jan 8, 11:00 AM',
    progress: 20,
    status: 'cancelled',
    frameworks: ['Digital Maturity Assessment'],
    deliverables: [
      { name: 'Current State Assessment', completed: true },
      { name: 'Technology Roadmap', completed: false },
      { name: 'Implementation Plan', completed: false },
    ]
  },
]

const statusConfig = {
  pending: { label: 'Pending', color: 'bg-amber-100 text-amber-700', border: 'border-amber-200' },
  in_progress: { label: 'In Progress', color: 'bg-blue-100 text-blue-700', border: 'border-blue-200' },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-700', border: 'border-green-200' },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-700', border: 'border-red-200' },
}

export default function Consultations() {
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'in_progress' | 'completed' | 'cancelled'>('all')

  const filteredConsultations = filterStatus === 'all'
    ? consultations
    : consultations.filter(c => c.status === filterStatus)

  const counts = {
    all: consultations.length,
    pending: consultations.filter(c => c.status === 'pending').length,
    in_progress: consultations.filter(c => c.status === 'in_progress').length,
    completed: consultations.filter(c => c.status === 'completed').length,
    cancelled: consultations.filter(c => c.status === 'cancelled').length,
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Consultations</h1>
          <p className="text-slate-600">Manage and track consulting engagements</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors">
          <Plus size={18} />
          New Consultation
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setFilterStatus('all')}
          className={clsx(
            'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
            filterStatus === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          )}
        >
          All <span className="ml-1 px-1.5 py-0.5 bg-white/20 rounded">{counts.all}</span>
        </button>
        <button
          onClick={() => setFilterStatus('pending')}
          className={clsx(
            'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
            filterStatus === 'pending' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          )}
        >
          Pending {counts.pending}
        </button>
        <button
          onClick={() => setFilterStatus('in_progress')}
          className={clsx(
            'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
            filterStatus === 'in_progress' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          )}
        >
          In Progress {counts.in_progress}
        </button>
        <button
          onClick={() => setFilterStatus('completed')}
          className={clsx(
            'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
            filterStatus === 'completed' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          )}
        >
          Completed {counts.completed}
        </button>
        <button
          onClick={() => setFilterStatus('cancelled')}
          className={clsx(
            'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
            filterStatus === 'cancelled' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          )}
        >
          Cancelled {counts.cancelled}
        </button>
      </div>

      {/* Consultations Grid */}
      <div className="grid grid-cols-2 gap-4">
        {filteredConsultations.map((consultation) => {
          const status = statusConfig[consultation.status]
          const completedDeliverables = consultation.deliverables.filter(d => d.completed).length
          return (
            <div key={consultation.id} className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-slate-900">{consultation.title}</h3>
                  <p className="text-sm text-slate-500">{consultation.client}</p>
                </div>
                <span className={clsx('px-2 py-1 rounded text-xs font-medium', status.color)}>
                  {status.label}
                </span>
              </div>

              <div className="space-y-2 mb-4 text-sm">
                <div className="flex items-center gap-2 text-slate-600">
                  <User size={14} className="text-slate-400" />
                  {consultation.contact}
                  <Mail size={14} className="text-slate-400 ml-2" />
                  {consultation.email}
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <Calendar size={14} className="text-slate-400" />
                  {consultation.date}
                </div>
              </div>

              {/* Progress */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-slate-500">Progress</span>
                  <span className="font-medium text-slate-900">{consultation.progress}%</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={clsx(
                      'h-full rounded-full transition-all',
                      consultation.progress === 100 ? 'bg-green-500' :
                      consultation.progress > 0 ? 'bg-slate-700' : 'bg-slate-300'
                    )}
                    style={{ width: `${consultation.progress}%` }}
                  />
                </div>
              </div>

              {/* Frameworks */}
              <div className="mb-4">
                <p className="text-xs text-slate-500 mb-2">Frameworks</p>
                <div className="flex flex-wrap gap-1">
                  {consultation.frameworks.map((fw) => (
                    <span key={fw} className="px-2 py-0.5 bg-slate-100 rounded text-xs text-slate-600">
                      {fw}
                    </span>
                  ))}
                </div>
              </div>

              {/* Deliverables */}
              <div>
                <p className="text-xs text-slate-500 mb-2">
                  Deliverables ({completedDeliverables}/{consultation.deliverables.length})
                </p>
                <div className="space-y-1">
                  {consultation.deliverables.map((deliverable, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      {deliverable.completed ? (
                        <CheckCircle2 size={14} className="text-green-500" />
                      ) : (
                        <Circle size={14} className="text-slate-300" />
                      )}
                      <span className={clsx(
                        deliverable.completed ? 'text-slate-500 line-through' : 'text-slate-700'
                      )}>
                        {deliverable.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* View Details */}
              <button className="w-full mt-4 py-2 text-sm text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors flex items-center justify-center gap-1">
                View Details
                <span className="text-slate-400">›</span>
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
