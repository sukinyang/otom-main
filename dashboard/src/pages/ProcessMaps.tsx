import { useState } from 'react'
import {
  Plus,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Download,
  Share2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight
} from 'lucide-react'
import clsx from 'clsx'

interface ProcessMap {
  id: string
  name: string
  client: string
  steps: number
  bottlenecks: number
  optimized: number
  status: 'active' | 'draft' | 'completed'
}

interface Step {
  id: string
  name: string
  duration: string
  owner: string
  status: 'completed' | 'current' | 'pending' | 'bottleneck'
}

const processMaps: ProcessMap[] = [
  { id: '1', name: 'Customer Onboarding Flow', client: 'Acme Corporation', steps: 8, bottlenecks: 2, optimized: 3, status: 'active' },
  { id: '2', name: 'Order Fulfillment Process', client: 'TechStart Inc', steps: 12, bottlenecks: 4, optimized: 5, status: 'draft' },
  { id: '3', name: 'Support Ticket Resolution', client: 'Global Ventures', steps: 6, bottlenecks: 1, optimized: 2, status: 'completed' },
]

const processSteps: Step[] = [
  { id: '1', name: 'Initial Contact', duration: '1 day', owner: 'Sales', status: 'completed' },
  { id: '2', name: 'Requirements Gathering', duration: '5 days', owner: 'Consulting', status: 'completed' },
  { id: '3', name: 'Proposal Creation', duration: '3 days', owner: 'Consulting', status: 'bottleneck' },
  { id: '4', name: 'Client Review', duration: '7 days', owner: 'Client', status: 'current' },
  { id: '5', name: 'Contract Negotiation', duration: '5 days', owner: 'Legal', status: 'pending' },
]

const statusConfig = {
  active: { label: 'active', color: 'bg-blue-100 text-blue-700' },
  draft: { label: 'draft', color: 'bg-slate-100 text-slate-600' },
  completed: { label: 'completed', color: 'bg-green-100 text-green-700' },
}

const stepStatusConfig = {
  completed: { color: 'bg-green-100 border-green-300 text-green-800' },
  current: { color: 'bg-blue-100 border-blue-300 text-blue-800' },
  pending: { color: 'bg-slate-50 border-slate-200 text-slate-500' },
  bottleneck: { color: 'bg-red-100 border-red-300 text-red-800' },
}

export default function ProcessMaps() {
  const [selectedMap, setSelectedMap] = useState<ProcessMap>(processMaps[0])
  const [zoom, setZoom] = useState(100)

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Process Maps</h1>
          <p className="text-slate-600">Visualize and optimize business processes</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors">
          <Plus size={18} />
          Create Process Map
        </button>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Process List */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <h3 className="font-semibold text-slate-900 mb-4">Your Process Maps</h3>
            <div className="space-y-2">
              {processMaps.map((map) => {
                const status = statusConfig[map.status]
                return (
                  <div
                    key={map.id}
                    onClick={() => setSelectedMap(map)}
                    className={clsx(
                      'p-3 rounded-lg cursor-pointer transition-colors',
                      selectedMap.id === map.id ? 'bg-slate-50 border border-slate-200' : 'hover:bg-slate-50'
                    )}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-medium text-slate-900">{map.name}</h4>
                      <span className={clsx('px-2 py-0.5 rounded text-xs font-medium', status.color)}>
                        {status.label}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 mb-2">{map.client}</p>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span>{map.steps} steps</span>
                      <span className="text-amber-600 flex items-center gap-1">
                        <AlertTriangle size={12} />
                        {map.bottlenecks} bottlenecks
                      </span>
                      <span className="text-green-600 flex items-center gap-1">
                        <CheckCircle2 size={12} />
                        {map.optimized} optimized
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Process Metrics */}
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <h3 className="font-semibold text-slate-900 mb-4">Process Metrics</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Total Duration</span>
                <span className="text-sm font-medium text-slate-900">23 days</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Active Steps</span>
                <span className="text-sm font-medium text-slate-900">8</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Bottlenecks</span>
                <span className="text-sm font-medium text-red-600">2</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Efficiency Score</span>
                <span className="text-sm font-medium text-green-600">78%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Process Map Viewer */}
        <div className="col-span-2 bg-white rounded-xl border border-slate-200 overflow-hidden">
          {/* Map Header */}
          <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-slate-900">{selectedMap.name}</h3>
              <p className="text-sm text-slate-500">{selectedMap.client}</p>
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
              <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                <Download size={16} className="text-slate-600" />
              </button>
              <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                <Share2 size={16} className="text-slate-600" />
              </button>
            </div>
          </div>

          {/* Map Content */}
          <div className="p-6 bg-slate-50 min-h-[400px]">
            {/* Process Flow */}
            <div className="flex items-start gap-4 overflow-x-auto pb-4">
              {/* Start Node */}
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                  <CheckCircle2 size={20} className="text-white" />
                </div>
                <span className="text-xs text-slate-500 mt-2">Start</span>
              </div>

              <ArrowRight size={20} className="text-slate-300 mt-2.5 flex-shrink-0" />

              {/* Process Steps */}
              {processSteps.map((step, index) => (
                <div key={step.id} className="flex items-start">
                  <div className="flex flex-col items-center">
                    <div className={clsx(
                      'px-4 py-3 rounded-lg border-2 min-w-[140px] text-center',
                      stepStatusConfig[step.status].color
                    )}>
                      <p className="font-medium text-sm mb-1">{step.name}</p>
                      <div className="flex items-center justify-center gap-2 text-xs">
                        <span className="flex items-center gap-1">
                          <Clock size={10} />
                          {step.duration}
                        </span>
                      </div>
                      <p className="text-xs mt-1 opacity-75">{step.owner}</p>
                      {step.status === 'bottleneck' && (
                        <div className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                          <AlertTriangle size={12} className="text-white" />
                        </div>
                      )}
                    </div>
                    <span className={clsx(
                      'text-xs mt-2 px-2 py-0.5 rounded',
                      step.status === 'completed' ? 'bg-green-100 text-green-700' :
                      step.status === 'current' ? 'bg-blue-100 text-blue-700' :
                      step.status === 'bottleneck' ? 'bg-red-100 text-red-700' :
                      'bg-slate-100 text-slate-500'
                    )}>
                      {step.status === 'current' ? 'Current' :
                       step.status === 'bottleneck' ? 'Bottleneck' :
                       step.status === 'completed' ? 'Done' : 'Pending'}
                    </span>
                  </div>
                  {index < processSteps.length - 1 && (
                    <ArrowRight size={20} className="text-slate-300 mt-5 mx-2 flex-shrink-0" />
                  )}
                </div>
              ))}

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
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-red-100 border border-red-300" />
                <span className="text-xs text-slate-600">Bottleneck</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
