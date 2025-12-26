import { useState, useEffect } from 'react'
import {
  Search,
  Grid3X3,
  List,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Users,
  Wrench,
  Plus,
  Loader2,
  X
} from 'lucide-react'
import clsx from 'clsx'
import { api, Process } from '../services/api'

const statusConfig = {
  active: { label: 'Active', color: 'bg-blue-100 text-blue-700', icon: Clock },
  needs_improvement: { label: 'Needs Improvement', color: 'bg-amber-100 text-amber-700', icon: AlertTriangle },
  optimized: { label: 'Optimized', color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
  draft: { label: 'Draft', color: 'bg-slate-100 text-slate-600', icon: Clock },
}

export default function Processes() {
  const [processes, setProcesses] = useState<Process[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table')
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [addForm, setAddForm] = useState({
    name: '',
    department: '',
    steps: 1,
    employees: 1,
    tools: 1,
    automation_level: 0
  })

  useEffect(() => {
    fetchProcesses()
  }, [])

  const fetchProcesses = async () => {
    try {
      setLoading(true)
      const data = await api.getProcesses()
      setProcesses(data)
    } catch (error) {
      console.error('Failed to fetch processes:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddProcess = async () => {
    if (!addForm.name) return
    setSaving(true)
    try {
      await api.createProcess({
        name: addForm.name,
        department: addForm.department || undefined,
        steps: addForm.steps,
        employees: addForm.employees,
        tools: addForm.tools,
        automation_level: addForm.automation_level,
        status: 'active'
      })
      setShowAddModal(false)
      setAddForm({ name: '', department: '', steps: 1, employees: 1, tools: 1, automation_level: 0 })
      fetchProcesses()
    } catch (error) {
      console.error('Failed to add process:', error)
    } finally {
      setSaving(false)
    }
  }

  const filteredProcesses = processes.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const totalProcesses = processes.length
  const needsImprovement = processes.filter(p => p.status === 'needs_improvement').length
  const totalEmployees = processes.reduce((sum, p) => sum + (p.employees || 0), 0)
  const totalTools = processes.reduce((sum, p) => sum + (p.tools || 0), 0)

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Processes</h1>
          <p className="text-slate-600">View and analyze your business processes</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => setViewMode('table')}
              className={clsx(
                'flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium transition-colors',
                viewMode === 'table' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
              )}
            >
              <List size={16} />
              Table
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={clsx(
                'flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium transition-colors',
                viewMode === 'grid' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
              )}
            >
              <Grid3X3 size={16} />
              Grid
            </button>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors"
          >
            <Plus size={18} />
            Add Process
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
              <Grid3X3 size={20} className="text-slate-900" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{totalProcesses}</p>
              <p className="text-sm text-slate-500">Total Processes</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <AlertTriangle size={20} className="text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{needsImprovement}</p>
              <p className="text-sm text-slate-500">Need Improvement</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Users size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{totalEmployees}</p>
              <p className="text-sm text-slate-500">Employees Involved</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <Wrench size={20} className="text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{totalTools}</p>
              <p className="text-sm text-slate-500">Tools Used</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search processes..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-700"
          />
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="bg-white rounded-xl border border-slate-200 p-12 flex flex-col items-center justify-center">
          <Loader2 size={32} className="text-slate-400 animate-spin mb-3" />
          <p className="text-slate-500">Loading processes...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredProcesses.length === 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-12 flex flex-col items-center justify-center">
          <Grid3X3 size={48} className="text-slate-300 mb-3" />
          <p className="text-slate-500 font-medium">No processes yet</p>
          <p className="text-slate-400 text-sm">Add a process to start tracking</p>
        </div>
      )}

      {/* Content */}
      {!loading && filteredProcesses.length > 0 && viewMode === 'table' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Process Name</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Department</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Steps</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Employees</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Automation</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredProcesses.map((process) => {
                const status = statusConfig[process.status] || statusConfig.active
                return (
                  <tr key={process.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">{process.name}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">{process.department || '-'}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{process.steps}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{process.employees}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-slate-700 rounded-full"
                            style={{ width: `${process.automation_level}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-500">{process.automation_level}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={clsx('px-2 py-1 rounded text-xs font-medium', status.color)}>
                        {status.label}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {!loading && filteredProcesses.length > 0 && viewMode === 'grid' && (
        <div className="grid grid-cols-2 gap-4">
          {filteredProcesses.map((process) => {
            const status = statusConfig[process.status] || statusConfig.active
            return (
              <div key={process.id} className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-slate-900">{process.name}</h3>
                    <p className="text-sm text-slate-500">{process.department || 'No department'}</p>
                  </div>
                  <span className={clsx('px-2 py-1 rounded text-xs font-medium', status.color)}>
                    {status.label}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-lg font-bold text-slate-900">{process.steps}</p>
                    <p className="text-xs text-slate-500">Steps</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-slate-900">{process.employees}</p>
                    <p className="text-xs text-slate-500">Employees</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-slate-900">{process.automation_level}%</p>
                    <p className="text-xs text-slate-500">Automated</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add Process Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900">Add Process</h2>
              <button onClick={() => setShowAddModal(false)} className="p-1 hover:bg-slate-100 rounded">
                <X size={20} className="text-slate-400" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Process Name *</label>
                <input
                  type="text"
                  value={addForm.name}
                  onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                  placeholder="Customer Onboarding"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-700"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Department</label>
                <input
                  type="text"
                  value={addForm.department}
                  onChange={(e) => setAddForm({ ...addForm, department: e.target.value })}
                  placeholder="Sales"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-700"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Steps</label>
                  <input
                    type="number"
                    min="1"
                    value={addForm.steps}
                    onChange={(e) => setAddForm({ ...addForm, steps: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Employees</label>
                  <input
                    type="number"
                    min="1"
                    value={addForm.employees}
                    onChange={(e) => setAddForm({ ...addForm, employees: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tools</label>
                  <input
                    type="number"
                    min="0"
                    value={addForm.tools}
                    onChange={(e) => setAddForm({ ...addForm, tools: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-700"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Automation Level (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={addForm.automation_level}
                  onChange={(e) => setAddForm({ ...addForm, automation_level: parseInt(e.target.value) || 0 })}
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
                onClick={handleAddProcess}
                disabled={saving || !addForm.name}
                className="flex-1 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50"
              >
                {saving ? 'Adding...' : 'Add Process'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
