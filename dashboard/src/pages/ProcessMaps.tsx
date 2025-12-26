import { useState, useEffect } from 'react'
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  CheckCircle2,
  Clock,
  ArrowRight,
  Loader2,
  Map
} from 'lucide-react'
import clsx from 'clsx'
import { api, Process } from '../services/api'

const statusConfig = {
  active: { label: 'Active', color: 'bg-blue-100 text-blue-700' },
  draft: { label: 'Draft', color: 'bg-slate-100 text-slate-600' },
  needs_improvement: { label: 'Needs Work', color: 'bg-amber-100 text-amber-700' },
  optimized: { label: 'Optimized', color: 'bg-green-100 text-green-700' },
}

export default function ProcessMaps() {
  const [processes, setProcesses] = useState<Process[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProcess, setSelectedProcess] = useState<Process | null>(null)
  const [zoom, setZoom] = useState(100)

  useEffect(() => {
    fetchProcesses()
  }, [])

  const fetchProcesses = async () => {
    try {
      setLoading(true)
      const data = await api.getProcesses()
      setProcesses(data)
      if (data.length > 0) {
        setSelectedProcess(data[0])
      }
    } catch (error) {
      console.error('Failed to fetch processes:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Process Maps</h1>
          <p className="text-slate-600">Visualize and optimize business processes</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-12 flex flex-col items-center justify-center">
          <Loader2 size={32} className="text-slate-400 animate-spin mb-3" />
          <p className="text-slate-500">Loading process maps...</p>
        </div>
      </div>
    )
  }

  if (processes.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Process Maps</h1>
            <p className="text-slate-600">Visualize and optimize business processes</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-12 flex flex-col items-center justify-center">
          <Map size={48} className="text-slate-300 mb-3" />
          <p className="text-slate-500 font-medium">No processes to visualize</p>
          <p className="text-slate-400 text-sm">Add processes first from the Processes page</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Process Maps</h1>
          <p className="text-slate-600">Visualize and optimize business processes</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Process List */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <h3 className="font-semibold text-slate-900 mb-4">Your Processes</h3>
            <div className="space-y-2">
              {processes.map((process) => {
                const status = statusConfig[process.status] || statusConfig.active
                return (
                  <div
                    key={process.id}
                    onClick={() => setSelectedProcess(process)}
                    className={clsx(
                      'p-3 rounded-lg cursor-pointer transition-colors',
                      selectedProcess?.id === process.id ? 'bg-slate-50 border border-slate-200' : 'hover:bg-slate-50'
                    )}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-medium text-slate-900">{process.name}</h4>
                      <span className={clsx('px-2 py-0.5 rounded text-xs font-medium', status.color)}>
                        {status.label}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 mb-2">{process.department || 'No department'}</p>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span>{process.steps} steps</span>
                      <span className="flex items-center gap-1">
                        <CheckCircle2 size={12} className="text-green-500" />
                        {process.automation_level}% automated
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Process Metrics */}
          {selectedProcess && (
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <h3 className="font-semibold text-slate-900 mb-4">Process Metrics</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">Total Steps</span>
                  <span className="text-sm font-medium text-slate-900">{selectedProcess.steps}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">Employees</span>
                  <span className="text-sm font-medium text-slate-900">{selectedProcess.employees}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">Tools Used</span>
                  <span className="text-sm font-medium text-slate-900">{selectedProcess.tools}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">Automation</span>
                  <span className="text-sm font-medium text-green-600">{selectedProcess.automation_level}%</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Process Map Viewer */}
        <div className="col-span-2 bg-white rounded-xl border border-slate-200 overflow-hidden">
          {selectedProcess ? (
            <>
              {/* Map Header */}
              <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-slate-900">{selectedProcess.name}</h3>
                  <p className="text-sm text-slate-500">{selectedProcess.department || 'No department'}</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
                    <button
                      onClick={() => setZoom(Math.max(50, zoom - 10))}
                      className="p-1.5 hover:bg-white rounded transition-colors"
                    >
                      <ZoomOut size={16} className="text-slate-600" />
                    </button>
                    <span className="px-2 text-sm text-slate-600">{zoom}%</span>
                    <button
                      onClick={() => setZoom(Math.min(150, zoom + 10))}
                      className="p-1.5 hover:bg-white rounded transition-colors"
                    >
                      <ZoomIn size={16} className="text-slate-600" />
                    </button>
                  </div>
                  <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                    <Maximize2 size={16} className="text-slate-600" />
                  </button>
                </div>
              </div>

              {/* Map Content */}
              <div className="p-6 bg-slate-50 min-h-[400px]">
                {/* Process Flow */}
                <div className="flex items-start gap-4 overflow-x-auto pb-4" style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'left top' }}>
                  {/* Start Node */}
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                      <CheckCircle2 size={20} className="text-white" />
                    </div>
                    <span className="text-xs text-slate-500 mt-2">Start</span>
                  </div>

                  <ArrowRight size={20} className="text-slate-300 mt-2.5 flex-shrink-0" />

                  {/* Process Steps */}
                  {Array.from({ length: Math.min(selectedProcess.steps, 6) }).map((_, index) => (
                    <div key={index} className="flex items-start">
                      <div className="flex flex-col items-center">
                        <div className={clsx(
                          'px-4 py-3 rounded-lg border-2 min-w-[140px] text-center',
                          index < 2 ? 'bg-green-100 border-green-300 text-green-800' :
                          index === 2 ? 'bg-blue-100 border-blue-300 text-blue-800' :
                          'bg-slate-50 border-slate-200 text-slate-500'
                        )}>
                          <p className="font-medium text-sm mb-1">Step {index + 1}</p>
                          <div className="flex items-center justify-center gap-2 text-xs">
                            <span className="flex items-center gap-1">
                              <Clock size={10} />
                              In progress
                            </span>
                          </div>
                        </div>
                        <span className={clsx(
                          'text-xs mt-2 px-2 py-0.5 rounded',
                          index < 2 ? 'bg-green-100 text-green-700' :
                          index === 2 ? 'bg-blue-100 text-blue-700' :
                          'bg-slate-100 text-slate-500'
                        )}>
                          {index < 2 ? 'Done' : index === 2 ? 'Current' : 'Pending'}
                        </span>
                      </div>
                      {index < Math.min(selectedProcess.steps, 6) - 1 && (
                        <ArrowRight size={20} className="text-slate-300 mt-5 mx-2 flex-shrink-0" />
                      )}
                    </div>
                  ))}

                  {selectedProcess.steps > 6 && (
                    <div className="flex items-center text-sm text-slate-400 mt-5">
                      +{selectedProcess.steps - 6} more steps
                    </div>
                  )}

                  <ArrowRight size={20} className="text-slate-300 mt-2.5 flex-shrink-0" />

                  {/* End Node */}
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full bg-slate-300 flex items-center justify-center">
                      <CheckCircle2 size={20} className="text-white" />
                    </div>
                    <span className="text-xs text-slate-500 mt-2">End</span>
                  </div>
                </div>

                {/* Legend */}
                <div className="flex items-center gap-4 mt-6 pt-4 border-t border-slate-200">
                  <span className="text-xs text-slate-500">Legend:</span>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-green-100 border border-green-300" />
                    <span className="text-xs text-slate-600">Completed</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-blue-100 border border-blue-300" />
                    <span className="text-xs text-slate-600">Current</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-slate-50 border border-slate-200" />
                    <span className="text-xs text-slate-600">Pending</span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="p-12 flex flex-col items-center justify-center text-center">
              <Map size={48} className="text-slate-300 mb-3" />
              <p className="text-slate-500">Select a process to view its map</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
