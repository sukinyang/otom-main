import { useState, useEffect } from 'react'
import {
  Search,
  FileText,
  Download,
  Calendar,
  CheckCircle2,
  Loader2,
  FileBarChart
} from 'lucide-react'
import clsx from 'clsx'
import { api, Report } from '../services/api'

const typeLabels: Record<string, string> = {
  comprehensive: 'Comprehensive',
  swot: 'SWOT Analysis',
  porters: "Porter's Analysis",
  pestel: 'PESTEL',
  process_map: 'Process Map',
}

const statusConfig = {
  ready: { label: 'Ready', color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
  generating: { label: 'Generating', color: 'bg-amber-100 text-amber-700', icon: Loader2 },
  delivered: { label: 'Delivered', color: 'bg-blue-100 text-blue-700', icon: CheckCircle2 },
}

export default function Reports() {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchReports()
  }, [])

  const fetchReports = async () => {
    try {
      setLoading(true)
      const data = await api.getReports()
      setReports(data)
    } catch (error) {
      console.error('Failed to fetch reports:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredReports = reports.filter(r => {
    if (filterType !== 'all' && r.type !== filterType) return false
    if (searchQuery && !r.title.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  const totalReports = reports.length
  const readyReports = reports.filter(r => r.status === 'ready').length
  const generatingReports = reports.filter(r => r.status === 'generating').length
  const deliveredReports = reports.filter(r => r.status === 'delivered').length

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Reports</h1>
          <p className="text-slate-600">Access and download generated consulting reports</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
              <FileText size={20} className="text-slate-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{totalReports}</p>
              <p className="text-sm text-slate-500">Total Reports</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <CheckCircle2 size={20} className="text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{readyReports}</p>
              <p className="text-sm text-slate-500">Ready</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <Loader2 size={20} className="text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{generatingReports}</p>
              <p className="text-sm text-slate-500">Generating</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Download size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{deliveredReports}</p>
              <p className="text-sm text-slate-500">Delivered</p>
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
              placeholder="Search reports..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-700"
            />
          </div>
          <div className="flex items-center gap-2">
            {['all', 'comprehensive', 'swot', 'porters', 'pestel'].map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={clsx(
                  'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                  filterType === type ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                )}
              >
                {type === 'all' ? 'All' : typeLabels[type] || type}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="bg-white rounded-xl border border-slate-200 p-12 flex flex-col items-center justify-center">
          <Loader2 size={32} className="text-slate-400 animate-spin mb-3" />
          <p className="text-slate-500">Loading reports...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredReports.length === 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-12 flex flex-col items-center justify-center">
          <FileBarChart size={48} className="text-slate-300 mb-3" />
          <p className="text-slate-500 font-medium">No reports yet</p>
          <p className="text-slate-400 text-sm">Reports will be generated from completed consultations</p>
        </div>
      )}

      {/* Reports List */}
      {!loading && filteredReports.length > 0 && (
        <div className="space-y-3">
          {filteredReports.map((report) => {
            const status = statusConfig[report.status] || statusConfig.ready
            const StatusIcon = status.icon
            const frameworks = report.frameworks || []
            return (
              <div key={report.id} className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center">
                    <FileBarChart size={24} className="text-slate-900" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <div>
                        <h3 className="font-semibold text-slate-900">{report.title}</h3>
                        {report.client && <p className="text-sm text-slate-500">{report.client}</p>}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={clsx(
                          'flex items-center gap-1 px-2 py-1 rounded text-xs font-medium',
                          status.color
                        )}>
                          <StatusIcon size={12} className={report.status === 'generating' ? 'animate-spin' : ''} />
                          {status.label}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-500 mb-3">
                      <span className="px-2 py-0.5 bg-slate-100 rounded">
                        {typeLabels[report.type] || report.type}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar size={12} />
                        {new Date(report.created_at).toLocaleDateString()}
                      </span>
                      {report.pages && report.pages > 0 && (
                        <span>{report.pages} pages</span>
                      )}
                      {report.size && (
                        <span>{report.size}</span>
                      )}
                    </div>
                    {frameworks.length > 0 && (
                      <div className="flex items-center gap-2">
                        {frameworks.map((fw) => (
                          <span key={fw} className="px-2 py-0.5 bg-slate-100 rounded text-xs text-slate-600">
                            {fw}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {(report.status === 'ready' || report.status === 'delivered') && report.file_url && (
                      <a
                        href={report.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 px-3 py-1.5 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors"
                      >
                        <Download size={14} />
                        Download
                      </a>
                    )}
                    {report.status === 'generating' && (
                      <button className="flex items-center gap-1 px-3 py-1.5 border border-slate-200 rounded-lg text-sm text-slate-400 cursor-not-allowed" disabled>
                        <Loader2 size={14} className="animate-spin" />
                        Processing...
                      </button>
                    )}
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
