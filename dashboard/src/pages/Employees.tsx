import { useState, useEffect, useRef } from 'react'
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
  X,
  Upload,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2
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

interface ParsedEmployee {
  name: string
  phone_number: string
  email?: string
  company?: string
  department?: string
  role?: string
}

export default function Employees() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('All')
  const [showAddModal, setShowAddModal] = useState(false)
  const [addForm, setAddForm] = useState({ name: '', phone_number: '', email: '', company: '', department: '', role: '' })
  const [saving, setSaving] = useState(false)

  // Import state
  const [showImportModal, setShowImportModal] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [parsedData, setParsedData] = useState<ParsedEmployee[]>([])
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<{ imported: number; skipped: number; errors: string[] } | null>(null)
  const [parseError, setParseError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  const parseCSV = (text: string): ParsedEmployee[] => {
    const lines = text.split('\n').filter(line => line.trim())
    if (lines.length < 2) return []

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/['"]/g, ''))
    const employees: ParsedEmployee[] = []

    // Map common header variations
    const headerMap: Record<string, string> = {
      'name': 'name',
      'full name': 'name',
      'fullname': 'name',
      'employee name': 'name',
      'phone': 'phone_number',
      'phone_number': 'phone_number',
      'phone number': 'phone_number',
      'mobile': 'phone_number',
      'telephone': 'phone_number',
      'email': 'email',
      'email address': 'email',
      'company': 'company',
      'company name': 'company',
      'organization': 'company',
      'department': 'department',
      'dept': 'department',
      'role': 'role',
      'job title': 'role',
      'title': 'role',
      'position': 'role'
    }

    const columnIndices: Record<string, number> = {}
    headers.forEach((header, index) => {
      const mappedField = headerMap[header]
      if (mappedField) {
        columnIndices[mappedField] = index
      }
    })

    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i])
      if (values.length === 0) continue

      const emp: ParsedEmployee = {
        name: values[columnIndices['name']] || '',
        phone_number: values[columnIndices['phone_number']] || '',
        email: values[columnIndices['email']] || undefined,
        company: values[columnIndices['company']] || undefined,
        department: values[columnIndices['department']] || undefined,
        role: values[columnIndices['role']] || undefined
      }

      if (emp.name && emp.phone_number) {
        employees.push(emp)
      }
    }

    return employees
  }

  const parseCSVLine = (line: string): string[] => {
    const values: string[] = []
    let current = ''
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    values.push(current.trim())
    return values
  }

  const parseJSON = (text: string): ParsedEmployee[] => {
    const data = JSON.parse(text)
    const items = Array.isArray(data) ? data : data.employees || data.data || []

    return items.map((item: Record<string, string>) => ({
      name: item.name || item.fullName || item.full_name || '',
      phone_number: item.phone_number || item.phoneNumber || item.phone || item.mobile || '',
      email: item.email || item.emailAddress || undefined,
      company: item.company || item.organization || undefined,
      department: item.department || item.dept || undefined,
      role: item.role || item.title || item.position || item.jobTitle || undefined
    })).filter((emp: ParsedEmployee) => emp.name && emp.phone_number)
  }

  const handleFileSelect = async (file: File) => {
    setImportFile(file)
    setParseError(null)
    setParsedData([])
    setImportResult(null)

    try {
      const text = await file.text()
      let parsed: ParsedEmployee[] = []

      if (file.name.endsWith('.csv')) {
        parsed = parseCSV(text)
      } else if (file.name.endsWith('.json')) {
        parsed = parseJSON(text)
      } else if (file.name.endsWith('.tsv') || file.name.endsWith('.txt')) {
        // TSV format
        const tsvText = text.replace(/\t/g, ',')
        parsed = parseCSV(tsvText)
      } else {
        setParseError('Unsupported file format. Please use CSV, JSON, or TSV files.')
        return
      }

      if (parsed.length === 0) {
        setParseError('No valid employees found. Make sure your file has "name" and "phone" columns.')
        return
      }

      setParsedData(parsed)
    } catch (error) {
      console.error('Failed to parse file:', error)
      setParseError('Failed to parse file. Please check the file format.')
    }
  }

  const handleImport = async () => {
    if (parsedData.length === 0) return

    setImporting(true)
    try {
      const result = await api.importEmployees(parsedData)
      setImportResult(result)
      if (result.imported > 0) {
        fetchEmployees()
      }
    } catch (error) {
      console.error('Failed to import:', error)
      setImportResult({ imported: 0, skipped: parsedData.length, errors: ['Import failed. Please try again.'] })
    } finally {
      setImporting(false)
    }
  }

  const resetImportModal = () => {
    setShowImportModal(false)
    setImportFile(null)
    setParsedData([])
    setImportResult(null)
    setParseError(null)
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
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <Upload size={18} />
            Import
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <Plus size={18} />
            Add Employee
          </button>
        </div>
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

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900">Import Employees</h2>
              <button onClick={resetImportModal} className="p-1 hover:bg-slate-100 rounded">
                <X size={20} className="text-slate-400" />
              </button>
            </div>

            {/* Import Result */}
            {importResult && (
              <div className={clsx(
                'p-4 rounded-lg mb-4',
                importResult.imported > 0 ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'
              )}>
                <div className="flex items-start gap-3">
                  {importResult.imported > 0 ? (
                    <CheckCircle2 size={20} className="text-green-600 mt-0.5" />
                  ) : (
                    <AlertCircle size={20} className="text-amber-600 mt-0.5" />
                  )}
                  <div>
                    <p className={clsx('font-medium', importResult.imported > 0 ? 'text-green-800' : 'text-amber-800')}>
                      {importResult.imported > 0
                        ? `Successfully imported ${importResult.imported} employee${importResult.imported > 1 ? 's' : ''}`
                        : 'Import completed with issues'}
                    </p>
                    {importResult.skipped > 0 && (
                      <p className="text-sm text-slate-600 mt-1">
                        {importResult.skipped} record{importResult.skipped > 1 ? 's' : ''} skipped
                      </p>
                    )}
                    {importResult.errors.length > 0 && (
                      <ul className="text-sm text-slate-600 mt-2 space-y-1">
                        {importResult.errors.map((error, i) => (
                          <li key={i}>• {error}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
                <button
                  onClick={resetImportModal}
                  className="mt-4 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm hover:bg-slate-800 transition-colors"
                >
                  Done
                </button>
              </div>
            )}

            {/* File Upload */}
            {!importResult && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.json,.tsv,.txt"
                  onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                  className="hidden"
                />

                {!importFile && (
                  <>
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault()
                        const file = e.dataTransfer.files[0]
                        if (file) handleFileSelect(file)
                      }}
                      className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center cursor-pointer hover:border-slate-400 hover:bg-slate-50 transition-colors"
                    >
                      <FileSpreadsheet size={48} className="text-slate-400 mx-auto mb-3" />
                      <p className="text-slate-900 font-medium mb-1">Drop your file here or click to browse</p>
                      <p className="text-sm text-slate-500">Supports CSV, JSON, and TSV files</p>
                      <p className="text-xs text-slate-400 mt-2">
                        Required columns: name, phone (or phone_number)
                      </p>
                    </div>
                    <div className="mt-4 text-center">
                      <a
                        href="/sample-employees.csv"
                        download="sample-employees.csv"
                        className="text-sm text-slate-600 hover:text-slate-900 underline"
                      >
                        Download sample CSV template
                      </a>
                    </div>
                  </>
                )}

                {/* Parse Error */}
                {parseError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
                    <div className="flex items-center gap-2 text-red-700">
                      <AlertCircle size={18} />
                      <p className="font-medium">{parseError}</p>
                    </div>
                    <button
                      onClick={() => {
                        setImportFile(null)
                        setParseError(null)
                        fileInputRef.current?.click()
                      }}
                      className="mt-3 text-sm text-red-600 hover:text-red-800 underline"
                    >
                      Try another file
                    </button>
                  </div>
                )}

                {/* Parsed Data Preview */}
                {parsedData.length > 0 && (
                  <>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <FileSpreadsheet size={18} className="text-slate-500" />
                        <span className="text-sm text-slate-700">{importFile?.name}</span>
                      </div>
                      <button
                        onClick={() => {
                          setImportFile(null)
                          setParsedData([])
                          fileInputRef.current?.click()
                        }}
                        className="text-sm text-slate-500 hover:text-slate-700"
                      >
                        Change file
                      </button>
                    </div>

                    <div className="bg-slate-50 rounded-lg p-3 mb-4">
                      <p className="text-sm text-slate-700">
                        <span className="font-medium">{parsedData.length}</span> employees ready to import
                      </p>
                    </div>

                    <div className="flex-1 overflow-auto border border-slate-200 rounded-lg">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-50 sticky top-0">
                          <tr>
                            <th className="text-left px-3 py-2 font-medium text-slate-700">Name</th>
                            <th className="text-left px-3 py-2 font-medium text-slate-700">Phone</th>
                            <th className="text-left px-3 py-2 font-medium text-slate-700">Email</th>
                            <th className="text-left px-3 py-2 font-medium text-slate-700">Company</th>
                            <th className="text-left px-3 py-2 font-medium text-slate-700">Role</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {parsedData.slice(0, 10).map((emp, i) => (
                            <tr key={i} className="hover:bg-slate-50">
                              <td className="px-3 py-2 text-slate-900">{emp.name}</td>
                              <td className="px-3 py-2 text-slate-600">{emp.phone_number}</td>
                              <td className="px-3 py-2 text-slate-600">{emp.email || '-'}</td>
                              <td className="px-3 py-2 text-slate-600">{emp.company || '-'}</td>
                              <td className="px-3 py-2 text-slate-600">{emp.role || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {parsedData.length > 10 && (
                        <div className="px-3 py-2 bg-slate-50 text-sm text-slate-500 border-t border-slate-200">
                          +{parsedData.length - 10} more rows
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-3 mt-4">
                      <button
                        onClick={resetImportModal}
                        className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleImport}
                        disabled={importing}
                        className="flex-1 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {importing ? (
                          <>
                            <Loader2 size={16} className="animate-spin" />
                            Importing...
                          </>
                        ) : (
                          <>
                            <Upload size={16} />
                            Import {parsedData.length} Employees
                          </>
                        )}
                      </button>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
