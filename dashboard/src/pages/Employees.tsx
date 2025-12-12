import { useState } from 'react'
import {
  Search,
  Users,
  Mail,
  Phone,
  Building2,
  MoreVertical,
  Plus
} from 'lucide-react'
import clsx from 'clsx'

interface Employee {
  id: string
  name: string
  email: string
  phone: string
  department: string
  role: string
  processCount: number
  status: 'active' | 'away' | 'offline'
  avatar?: string
}

const employees: Employee[] = [
  {
    id: '1',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@company.com',
    phone: '+1 (555) 123-4567',
    department: 'Sales',
    role: 'Sales Manager',
    processCount: 5,
    status: 'active'
  },
  {
    id: '2',
    name: 'Mike Chen',
    email: 'mike.chen@company.com',
    phone: '+1 (555) 234-5678',
    department: 'Engineering',
    role: 'Senior Developer',
    processCount: 8,
    status: 'active'
  },
  {
    id: '3',
    name: 'Emily Davis',
    email: 'emily.davis@company.com',
    phone: '+1 (555) 345-6789',
    department: 'Finance',
    role: 'Finance Lead',
    processCount: 4,
    status: 'away'
  },
  {
    id: '4',
    name: 'John Smith',
    email: 'john.smith@company.com',
    phone: '+1 (555) 456-7890',
    department: 'Finance',
    role: 'Accountant',
    processCount: 3,
    status: 'active'
  },
  {
    id: '5',
    name: 'Amanda Wilson',
    email: 'amanda.wilson@company.com',
    phone: '+1 (555) 567-8901',
    department: 'Operations',
    role: 'Operations Lead',
    processCount: 6,
    status: 'offline'
  },
  {
    id: '6',
    name: 'David Brown',
    email: 'david.brown@company.com',
    phone: '+1 (555) 678-9012',
    department: 'HR',
    role: 'HR Director',
    processCount: 4,
    status: 'active'
  },
  {
    id: '7',
    name: 'Lisa Taylor',
    email: 'lisa.taylor@company.com',
    phone: '+1 (555) 789-0123',
    department: 'Marketing',
    role: 'Marketing Manager',
    processCount: 5,
    status: 'active'
  },
  {
    id: '8',
    name: 'Robert Martinez',
    email: 'robert.martinez@company.com',
    phone: '+1 (555) 890-1234',
    department: 'Support',
    role: 'Support Manager',
    processCount: 7,
    status: 'away'
  },
]

const statusConfig = {
  active: { label: 'Active', color: 'bg-green-500' },
  away: { label: 'Away', color: 'bg-amber-500' },
  offline: { label: 'Offline', color: 'bg-slate-300' },
}

const departments = ['All', 'Sales', 'Engineering', 'Finance', 'Operations', 'HR', 'Marketing', 'Support']

export default function Employees() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDepartment, setSelectedDepartment] = useState('All')

  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.role.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesDepartment = selectedDepartment === 'All' || emp.department === selectedDepartment
    return matchesSearch && matchesDepartment
  })

  const totalEmployees = employees.length
  const activeEmployees = employees.filter(e => e.status === 'active').length
  const departmentCount = new Set(employees.map(e => e.department)).size

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Employees</h1>
          <p className="text-slate-600">Manage team members and their process involvement</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors">
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
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <Users size={20} className="text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{activeEmployees}</p>
              <p className="text-sm text-slate-500">Currently Active</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Building2 size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{departmentCount}</p>
              <p className="text-sm text-slate-500">Departments</p>
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
            {departments.map((dept) => (
              <button
                key={dept}
                onClick={() => setSelectedDepartment(dept)}
                className={clsx(
                  'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                  selectedDepartment === dept
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                )}
              >
                {dept}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Employee Grid */}
      <div className="grid grid-cols-2 gap-4">
        {filteredEmployees.map((employee) => {
          const status = statusConfig[employee.status]
          return (
            <div key={employee.id} className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                      <span className="text-slate-900 font-medium">
                        {employee.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div className={clsx('absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white', status.color)} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">{employee.name}</h3>
                    <p className="text-sm text-slate-500">{employee.role}</p>
                  </div>
                </div>
                <button className="p-1 rounded hover:bg-slate-100 transition-colors">
                  <MoreVertical size={18} className="text-slate-400" />
                </button>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Mail size={14} />
                  <span>{employee.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Phone size={14} />
                  <span>{employee.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Building2 size={14} />
                  <span>{employee.department}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <div>
                  <p className="text-lg font-bold text-slate-900">{employee.processCount}</p>
                  <p className="text-xs text-slate-500">Processes Involved</p>
                </div>
                <span className={clsx(
                  'px-2 py-1 rounded text-xs font-medium',
                  employee.status === 'active' ? 'bg-green-100 text-green-700' :
                  employee.status === 'away' ? 'bg-amber-100 text-amber-700' :
                  'bg-slate-100 text-slate-600'
                )}>
                  {status.label}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
