import { useState } from 'react'
import {
  Search,
  Grid3X3,
  List,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Users,
  Wrench,
  ArrowRight
} from 'lucide-react'
import clsx from 'clsx'

interface Process {
  id: string
  name: string
  department: string
  steps: number
  employees: number
  tools: number
  status: 'active' | 'needs_improvement' | 'optimized'
  automationLevel: number
  lastUpdated: string
}

const processes: Process[] = [
  {
    id: '1',
    name: 'Customer Onboarding',
    department: 'Sales',
    steps: 8,
    employees: 12,
    tools: 5,
    status: 'active',
    automationLevel: 45,
    lastUpdated: '2 days ago'
  },
  {
    id: '2',
    name: 'Invoice Processing',
    department: 'Finance',
    steps: 6,
    employees: 4,
    tools: 3,
    status: 'needs_improvement',
    automationLevel: 25,
    lastUpdated: '1 week ago'
  },
  {
    id: '3',
    name: 'Employee Onboarding',
    department: 'HR',
    steps: 12,
    employees: 8,
    tools: 7,
    status: 'optimized',
    automationLevel: 78,
    lastUpdated: '3 days ago'
  },
  {
    id: '4',
    name: 'Support Ticket Resolution',
    department: 'Support',
    steps: 5,
    employees: 15,
    tools: 4,
    status: 'active',
    automationLevel: 55,
    lastUpdated: '1 day ago'
  },
  {
    id: '5',
    name: 'Order Fulfillment',
    department: 'Operations',
    steps: 10,
    employees: 20,
    tools: 8,
    status: 'needs_improvement',
    automationLevel: 35,
    lastUpdated: '5 days ago'
  },
]

const statusConfig = {
  active: { label: 'Active', color: 'bg-blue-100 text-blue-700', icon: Clock },
  needs_improvement: { label: 'Needs Improvement', color: 'bg-amber-100 text-amber-700', icon: AlertTriangle },
  optimized: { label: 'Optimized', color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
}

export default function Processes() {
  const [viewMode, setViewMode] = useState<'table' | 'map'>('table')
  const [searchQuery, setSearchQuery] = useState('')

  const filteredProcesses = processes.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const totalProcesses = processes.length
  const needsImprovement = processes.filter(p => p.status === 'needs_improvement').length
  const totalEmployees = processes.reduce((sum, p) => sum + p.employees, 0)
  const totalTools = new Set(processes.flatMap(p => Array(p.tools).fill(0))).size

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Processes</h1>
          <p className="text-slate-600">View and analyze your business processes</p>
        </div>
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
            onClick={() => setViewMode('map')}
            className={clsx(
              'flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium transition-colors',
              viewMode === 'map' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
            )}
          >
            <Grid3X3 size={16} />
            Map
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

      {/* Content */}
      {viewMode === 'table' ? (
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
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Updated</th>
              </tr>
            </thead>
            <tbody>
              {filteredProcesses.map((process) => {
                const status = statusConfig[process.status]
                return (
                  <tr key={process.id} className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">{process.name}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">{process.department}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{process.steps}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{process.employees}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-slate-700 rounded-full"
                            style={{ width: `${process.automationLevel}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-500">{process.automationLevel}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={clsx('px-2 py-1 rounded text-xs font-medium', status.color)}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500">{process.lastUpdated}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {filteredProcesses.map((process) => {
            const status = statusConfig[process.status]
            const StatusIcon = status.icon
            return (
              <div key={process.id} className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-slate-900">{process.name}</h3>
                    <p className="text-sm text-slate-500">{process.department}</p>
                  </div>
                  <span className={clsx('flex items-center gap-1 px-2 py-1 rounded text-xs font-medium', status.color)}>
                    <StatusIcon size={12} />
                    {status.label}
                  </span>
                </div>

                {/* Mini process flow */}
                <div className="flex items-center gap-1 mb-4 overflow-x-auto pb-2">
                  {Array.from({ length: Math.min(process.steps, 6) }).map((_, i) => (
                    <div key={i} className="flex items-center">
                      <div className={clsx(
                        'w-8 h-8 rounded flex items-center justify-center text-xs font-medium',
                        i < 3 ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                      )}>
                        {i + 1}
                      </div>
                      {i < Math.min(process.steps, 6) - 1 && (
                        <ArrowRight size={14} className="text-slate-300 mx-1" />
                      )}
                    </div>
                  ))}
                  {process.steps > 6 && (
                    <span className="text-xs text-slate-400 ml-2">+{process.steps - 6} more</span>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-lg font-bold text-slate-900">{process.employees}</p>
                    <p className="text-xs text-slate-500">Employees</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-slate-900">{process.tools}</p>
                    <p className="text-xs text-slate-500">Tools</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-slate-900">{process.automationLevel}%</p>
                    <p className="text-xs text-slate-500">Automated</p>
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
