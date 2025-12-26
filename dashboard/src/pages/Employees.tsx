import { useState, useEffect } from 'react'
import {
  Search,
  Users,
  Mail,
  Phone,
  Building2,
  MoreVertical,
  Plus,
  Loader2,
  MessageCircle,
  X
} from 'lucide-react'
import clsx from 'clsx'
import { api, Employee } from '../services/api'

const statusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pending', color: 'bg-amber-100 text-amber-700' },
  contacted: { label: 'Contacted', color: 'bg-blue-100 text-blue-700' },
  call_requested: { label: 'Call Requested', color: 'bg-purple-100 text-purple-700' },
  scheduling: { label: 'Scheduling', color: 'bg-indigo-100 text-indigo-700' },
  interviewed: { label: 'Interviewed', color: 'bg-green-100 text-green-700' },
  declined: { label: 'Declined', color: 'bg-red-100 text-red-700' },
  active: { label: 'Active', color: 'bg-green-100 text-green-700' },
}

export default function Employees() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('All')
  const [showAddModal, setShowAddModal] = useState(false)
  const [addForm, setAddForm] = useState({ name: '', phone_number: '', email: '', company: '', department: '', role: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchEmployees()
  }, [])

  const fetchEmployees = async () => {
    try {
      setLoading(true)
      const data = await api.getEmployees()
      setEmployees(data)
    } catch (error) {
      console.error('Failed to fetch employees:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddEmployee = async () => {
    if (!addForm.name || !addForm.phone_number) return
    setSaving(true)
    try {
      await api.createEmployee({
        name: addForm.name,
        phone_number: addForm.phone_number,
        email: addForm.email || undefined,
        company: addForm.company || undefined,
        department: addForm.department || undefined,
        role: addForm.role || undefined,
        status: 'pending'
      })
      setShowAddModal(false)
      setAddForm({ name: '', phone_number: '', email: '', company: '', department: '', role: '' })
      fetchEmployees()
    } catch (error) {
      console.error('Failed to add employee:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleSendSMS = async (employee: Employee) => {
    try {
      await api.sendOutreach(employee.phone_number, employee.name, employee.company || 'Otom', employee.id)
      fetchEmployees()
    } catch (error) {
      console.error('Failed to send SMS:', error)
    }
  }

  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = emp.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.phone_number?.includes(searchQuery)
    const matchesStatus = selectedStatus === 'All' || emp.status === selectedStatus.toLowerCase()
    return matchesSearch && matchesStatus
  })

  const totalEmployees = employees.length
  const pendingEmployees = employees.filter(e => e.status === 'pending').length
  const interviewedEmployees = employees.filter(e => e.status === 'interviewed').length

  const statuses = ['All', 'Pending', 'Contacted', 'Call_requested', 'Interviewed', 'Declined']

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Employees</h1>
          <p className="text-slate-600">Manage team members for outreach and interviews</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
        >
          <Plus size={18} />
          Add Employee
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
              <Users size={20} className="text-slate-900" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{totalEmployees}</p>
              <p className="text-sm text-slate-500">Total Employees</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <Users size={20} className="text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{pendingEmployees}</p>
              <p className="text-sm text-slate-500">Pending Outreach</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <Users size={20} className="text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{interviewedEmployees}</p>
              <p className="text-sm text-slate-500">Interviewed</p>
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
              placeholder="Search employees..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-700"
            />
          </div>
          <div className="flex items-center gap-2">
            {statuses.map((status) => (
              <button
                key={status}
                onClick={() => setSelectedStatus(status)}
                className={clsx(
                  'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                  selectedStatus === status
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                )}
              >
                {status.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="bg-white rounded-xl border border-slate-200 p-12 flex flex-col items-center justify-center">
          <Loader2 size={32} className="text-slate-400 animate-spin mb-3" />
          <p className="text-slate-500">Loading employees...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredEmployees.length === 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-12 flex flex-col items-center justify-center">
          <Users size={48} className="text-slate-300 mb-3" />
          <p className="text-slate-500 font-medium">No employees found</p>
          <p className="text-slate-400 text-sm">Add employees to start outreach</p>
        </div>
      )}

      {/* Employee Grid */}
      {!loading && filteredEmployees.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          {filteredEmployees.map((employee) => {
            const status = statusConfig[employee.status] || statusConfig.pending
            return (
              <div key={employee.id} className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                        <span className="text-slate-900 font-medium">
                          {employee.name?.split(' ').map(n => n[0]).join('') || '?'}
                        </span>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">{employee.name}</h3>
                      <p className="text-sm text-slate-500">{employee.role || 'No role'}</p>
                    </div>
                  </div>
                  <button className="p-1 rounded hover:bg-slate-100 transition-colors">
                    <MoreVertical size={18} className="text-slate-400" />
                  </button>
                </div>

                <div className="space-y-2 mb-4">
                  {employee.email && (
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Mail size={14} />
                      <span>{employee.email}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Phone size={14} />
                    <span>{employee.phone_number}</span>
                  </div>
                  {employee.company && (
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Building2 size={14} />
                      <span>{employee.company}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <span className={clsx('px-2 py-1 rounded text-xs font-medium', status.color)}>
                    {status.label}
                  </span>
                  {employee.status === 'pending' && (
                    <button
                      onClick={() => handleSendSMS(employee)}
                      className="flex items-center gap-1 px-3 py-1 bg-slate-900 text-white rounded text-xs hover:bg-slate-800 transition-colors"
                    >
                      <MessageCircle size={12} />
                      Send SMS
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add Employee Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900">Add Employee</h2>
              <button onClick={() => setShowAddModal(false)} className="p-1 hover:bg-slate-100 rounded">
                <X size={20} className="text-slate-400" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Name *</label>
                <input
                  type="text"
                  value={addForm.name}
                  onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                  placeholder="John Doe"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-700"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number *</label>
                <input
                  type="tel"
                  value={addForm.phone_number}
                  onChange={(e) => setAddForm({ ...addForm, phone_number: e.target.value })}
                  placeholder="+14255551234"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-700"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  value={addForm.email}
                  onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                  placeholder="john@company.com"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-700"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Company</label>
                <input
                  type="text"
                  value={addForm.company}
                  onChange={(e) => setAddForm({ ...addForm, company: e.target.value })}
                  placeholder="Acme Corp"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-700"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
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
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                  <input
                    type="text"
                    value={addForm.role}
                    onChange={(e) => setAddForm({ ...addForm, role: e.target.value })}
                    placeholder="Manager"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-700"
                  />
                </div>
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
                onClick={handleAddEmployee}
                disabled={saving || !addForm.name || !addForm.phone_number}
                className="flex-1 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50"
              >
                {saving ? 'Adding...' : 'Add Employee'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
