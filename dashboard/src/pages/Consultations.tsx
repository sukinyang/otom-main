import { useState, useEffect } from 'react'
import {
  Plus,
  Calendar,
  Mail,
  User,
  CheckCircle2,
  Circle,
  Loader2,
  FileText,
  X
} from 'lucide-react'
import clsx from 'clsx'
import { api, ConsultationData } from '../services/api'

const statusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pending', color: 'bg-amber-100 text-amber-700' },
  in_progress: { label: 'In Progress', color: 'bg-blue-100 text-blue-700' },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-700' },
}

export default function Consultations() {
  const [consultations, setConsultations] = useState<ConsultationData[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [addForm, setAddForm] = useState({
    title: '',
    company_name: '',
    contact_name: '',
    client_email: '',
    client_phone: ''
  })

  useEffect(() => {
    fetchConsultations()
  }, [])

  const fetchConsultations = async () => {
    try {
      setLoading(true)
      const data = await api.getConsultations()
      setConsultations(data)
    } catch (error) {
      console.error('Failed to fetch consultations:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddConsultation = async () => {
    if (!addForm.title || !addForm.company_name) return
    setSaving(true)
    try {
      await api.createConsultation({
        title: addForm.title,
        company_name: addForm.company_name,
        contact_name: addForm.contact_name || undefined,
        client_email: addForm.client_email || undefined,
        client_phone: addForm.client_phone || undefined,
        status: 'pending',
        progress: 0,
        frameworks: [],
        deliverables: []
      })
      setShowAddModal(false)
      setAddForm({ title: '', company_name: '', contact_name: '', client_email: '', client_phone: '' })
      fetchConsultations()
    } catch (error) {
      console.error('Failed to add consultation:', error)
    } finally {
      setSaving(false)
    }
  }

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
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors"
        >
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
          All ({counts.all})
        </button>
        <button
          onClick={() => setFilterStatus('pending')}
          className={clsx(
            'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
            filterStatus === 'pending' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          )}
        >
          Pending ({counts.pending})
        </button>
        <button
          onClick={() => setFilterStatus('in_progress')}
          className={clsx(
            'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
            filterStatus === 'in_progress' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          )}
        >
          In Progress ({counts.in_progress})
        </button>
        <button
          onClick={() => setFilterStatus('completed')}
          className={clsx(
            'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
            filterStatus === 'completed' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          )}
        >
          Completed ({counts.completed})
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="bg-white rounded-xl border border-slate-200 p-12 flex flex-col items-center justify-center">
          <Loader2 size={32} className="text-slate-400 animate-spin mb-3" />
          <p className="text-slate-500">Loading consultations...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredConsultations.length === 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-12 flex flex-col items-center justify-center">
          <FileText size={48} className="text-slate-300 mb-3" />
          <p className="text-slate-500 font-medium">No consultations yet</p>
          <p className="text-slate-400 text-sm">Create a new consultation to get started</p>
        </div>
      )}

      {/* Consultations Grid */}
      {!loading && filteredConsultations.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          {filteredConsultations.map((consultation) => {
            const status = statusConfig[consultation.status] || statusConfig.pending
            const deliverables = consultation.deliverables || []
            const completedDeliverables = deliverables.filter(d => d.completed).length
            const frameworks = consultation.frameworks || []
            return (
              <div key={consultation.id} className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-slate-900">{consultation.title || 'Untitled'}</h3>
                    <p className="text-sm text-slate-500">{consultation.company_name}</p>
                  </div>
                  <span className={clsx('px-2 py-1 rounded text-xs font-medium', status.color)}>
                    {status.label}
                  </span>
                </div>

                <div className="space-y-2 mb-4 text-sm">
                  {consultation.contact_name && (
                    <div className="flex items-center gap-2 text-slate-600">
                      <User size={14} className="text-slate-400" />
                      {consultation.contact_name}
                    </div>
                  )}
                  {consultation.client_email && (
                    <div className="flex items-center gap-2 text-slate-600">
                      <Mail size={14} className="text-slate-400" />
                      {consultation.client_email}
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-slate-600">
                    <Calendar size={14} className="text-slate-400" />
                    {new Date(consultation.created_at).toLocaleDateString()}
                  </div>
                </div>

                {/* Progress */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-slate-500">Progress</span>
                    <span className="font-medium text-slate-900">{consultation.progress || 0}%</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={clsx(
                        'h-full rounded-full transition-all',
                        (consultation.progress || 0) === 100 ? 'bg-green-500' :
                        (consultation.progress || 0) > 0 ? 'bg-slate-700' : 'bg-slate-300'
                      )}
                      style={{ width: `${consultation.progress || 0}%` }}
                    />
                  </div>
                </div>

                {/* Frameworks */}
                {frameworks.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs text-slate-500 mb-2">Frameworks</p>
                    <div className="flex flex-wrap gap-1">
                      {frameworks.map((fw) => (
                        <span key={fw} className="px-2 py-0.5 bg-slate-100 rounded text-xs text-slate-600">
                          {fw}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Deliverables */}
                {deliverables.length > 0 && (
                  <div>
                    <p className="text-xs text-slate-500 mb-2">
                      Deliverables ({completedDeliverables}/{deliverables.length})
                    </p>
                    <div className="space-y-1">
                      {deliverables.slice(0, 3).map((deliverable, i) => (
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
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Add Consultation Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900">New Consultation</h2>
              <button onClick={() => setShowAddModal(false)} className="p-1 hover:bg-slate-100 rounded">
                <X size={20} className="text-slate-400" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Title *</label>
                <input
                  type="text"
                  value={addForm.title}
                  onChange={(e) => setAddForm({ ...addForm, title: e.target.value })}
                  placeholder="Strategic Planning"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-700"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Company *</label>
                <input
                  type="text"
                  value={addForm.company_name}
                  onChange={(e) => setAddForm({ ...addForm, company_name: e.target.value })}
                  placeholder="Acme Corp"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-700"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Contact Name</label>
                <input
                  type="text"
                  value={addForm.contact_name}
                  onChange={(e) => setAddForm({ ...addForm, contact_name: e.target.value })}
                  placeholder="John Smith"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-700"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  value={addForm.client_email}
                  onChange={(e) => setAddForm({ ...addForm, client_email: e.target.value })}
                  placeholder="john@acme.com"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-700"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={addForm.client_phone}
                  onChange={(e) => setAddForm({ ...addForm, client_phone: e.target.value })}
                  placeholder="+14255551234"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-700"
                />
              </div>
            </div>
            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddConsultation}
                disabled={saving || !addForm.title || !addForm.company_name}
                className="flex-1 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50"
              >
                {saving ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
