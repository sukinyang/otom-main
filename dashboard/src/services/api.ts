const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://otom-production-1790.up.railway.app'

export interface Employee {
  id: string
  name: string
  phone_number: string
  email?: string
  company?: string
  department?: string
  role?: string
  status: string
  notes?: string
  created_at: string
  updated_at?: string
}

export interface SMSMessage {
  id: string
  employee_id?: string
  phone_number: string
  direction: 'inbound' | 'outbound'
  message: string
  status: string
  created_at: string
  employee_name?: string
}

export interface Consultation {
  session_id: string
  status: string
  started_at: string
  messages: Message[]
}

export interface Message {
  sender: 'user' | 'otom'
  content: string
  timestamp: string
  metadata?: Record<string, unknown>
}

export interface Service {
  name: string
  description: string
  price: string
  deliverables: string[]
}

export interface CallSession {
  id: string
  vapi_call_id?: string
  phone_number: string
  direction: 'inbound' | 'outbound'
  status: 'initiated' | 'connecting' | 'in-progress' | 'completed' | 'failed'
  platform: string
  transcript?: string
  summary?: string
  duration_seconds?: number
  cost?: number
  metadata?: Record<string, unknown>
  started_at: string
  ended_at?: string
  created_at: string
  updated_at?: string
}

export interface CallStats {
  total_calls: number
  completed_calls: number
  active_calls: number
  avg_duration_seconds: number
  avg_duration_formatted: string
  completion_rate: number
  inbound_calls: number
  outbound_calls: number
}

export interface ConsultationData {
  id: string
  consultation_session_id?: string
  client_email?: string
  client_phone?: string
  company_name?: string
  contact_name?: string
  title?: string
  source_platform?: string
  status: string
  phase?: string
  progress?: number
  frameworks?: string[]
  deliverables?: { name: string; completed: boolean }[]
  context?: Record<string, unknown>
  analysis?: Record<string, unknown>
  recommendations?: string[]
  created_at: string
  updated_at?: string
}

export interface Process {
  id: string
  name: string
  department?: string
  description?: string
  steps: number
  employees: number
  tools: number
  status: 'active' | 'needs_improvement' | 'optimized' | 'draft'
  automation_level: number
  created_at: string
  updated_at?: string
}

export interface Report {
  id: string
  title: string
  client?: string
  consultation_id?: string
  type: 'comprehensive' | 'swot' | 'porters' | 'pestel' | 'process_map'
  status: 'ready' | 'generating' | 'delivered'
  pages?: number
  size?: string
  file_url?: string
  frameworks?: string[]
  created_at: string
}

export interface Document {
  id: string
  name: string
  file_path?: string
  file_url?: string
  file_type: string
  file_size?: number
  category?: string
  department?: string
  extracted_text?: string
  summary?: string
  status: string
  uploaded_by?: string
  created_at: string
}

export interface CallInsights {
  id: string
  call_session_id: string
  summary?: string
  pain_points?: Array<{
    description: string
    severity: string
    frequency: string
    impact: string
    quote?: string
  }>
  workarounds?: Array<{
    description: string
    reason: string
    time_cost: string
  }>
  tools_mentioned?: Array<{
    name: string
    usage: string
    satisfaction: string
    issues?: string
  }>
  improvement_suggestions?: Array<{
    suggestion: string
    source: string
    priority: string
    expected_impact: string
  }>
  automation_opportunities?: Array<{
    process: string
    current_time: string
    automation_type: string
    complexity: string
  }>
  key_quotes?: Array<{
    quote: string
    context: string
    sentiment: string
  }>
  sentiment?: string
  engagement_level?: string
  follow_up_questions?: string[]
  analyzed_at: string
  created_at: string
}

class ApiService {
  private async fetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    })

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`)
    }

    return response.json()
  }

  // Health check
  async getHealth() {
    return this.fetch<{
      status: string
      service: string
      version: string
      capabilities: string[]
    }>('/')
  }

  // Services
  async getServices() {
    return this.fetch<{ services: Service[] }>('/services')
  }

  // Consultations
  async startConsultation(phoneNumber: string) {
    return this.fetch<{
      status: string
      session_id: string
      message: string
    }>('/consultation/start', {
      method: 'POST',
      body: JSON.stringify({ phone_number: phoneNumber }),
    })
  }

  async scheduleConsultation(email: string, preferredTime: string) {
    return this.fetch<{
      status: string
      booking_id: string
      scheduled_time: string
    }>('/consultation/schedule', {
      method: 'POST',
      body: JSON.stringify({ email, preferred_time: preferredTime }),
    })
  }

  async getConsultationStatus(sessionId: string) {
    return this.fetch<Consultation>(`/consultation/${sessionId}/status`)
  }

  // Chat
  async sendChatMessage(sessionId: string, content: string) {
    return this.fetch<{
      status: string
      session_id: string
      response: {
        content: string
        intent: string
        metadata: Record<string, unknown>
      }
    }>('/chat/message', {
      method: 'POST',
      body: JSON.stringify({ session_id: sessionId, content }),
    })
  }

  async getChatHistory(sessionId: string) {
    return this.fetch<{
      session_id: string
      platform: string
      messages: Message[]
      started_at: string
    }>(`/chat/session/${sessionId}/history`)
  }

  // Voice Calls
  async getCallSessions(params?: { limit?: number; status?: string; phone_number?: string }) {
    const searchParams = new URLSearchParams()
    if (params?.limit) searchParams.set('limit', params.limit.toString())
    if (params?.status) searchParams.set('status', params.status)
    if (params?.phone_number) searchParams.set('phone_number', params.phone_number)

    const query = searchParams.toString()
    return this.fetch<{ calls: CallSession[]; total: number }>(
      `/voice/calls${query ? `?${query}` : ''}`
    )
  }

  async getCallSession(sessionId: string) {
    return this.fetch<CallSession>(`/voice/calls/${sessionId}`)
  }

  async getCallStats(days = 30) {
    return this.fetch<CallStats>(`/voice/calls/stats?days=${days}`)
  }

  async getEmployeeCallSessions(phoneNumber: string) {
    return this.fetch<{ calls: CallSession[]; total: number }>(
      `/voice/calls?phone_number=${encodeURIComponent(phoneNumber)}`
    )
  }

  // Employees
  async getEmployees() {
    return this.fetch<Employee[]>('/employees')
  }

  async getEmployee(id: string) {
    return this.fetch<Employee>(`/employees/${id}`)
  }

  async createEmployee(data: Partial<Employee>) {
    return this.fetch<Employee>('/employees', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateEmployee(id: string, data: Partial<Employee>) {
    return this.fetch<Employee>(`/employees/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async importEmployees(employees: Partial<Employee>[]) {
    return this.fetch<{ success: boolean; imported: number; skipped: number; errors: string[] }>('/employees/import', {
      method: 'POST',
      body: JSON.stringify({ employees }),
    })
  }

  // SMS
  async getSMSMessages(limit = 100) {
    return this.fetch<SMSMessage[]>(`/sms/messages?limit=${limit}`)
  }

  async sendSMS(phoneNumber: string, message: string, employeeId?: string) {
    return this.fetch<{ success: boolean; message_sid: string }>('/sms/send', {
      method: 'POST',
      body: JSON.stringify({ to: phoneNumber, message, employee_id: employeeId }),
    })
  }

  async sendOutreach(phoneNumber: string, name: string, company: string, employeeId?: string) {
    return this.fetch<{ success: boolean; message_sid: string }>('/sms/outreach', {
      method: 'POST',
      body: JSON.stringify({ phone_number: phoneNumber, name, company, employee_id: employeeId }),
    })
  }

  async sendBulkOutreach(employees: { id: string; name: string; phone_number: string }[], company: string) {
    return this.fetch<{ total: number; sent: number; failed: number; errors: string[] }>('/sms/bulk-outreach', {
      method: 'POST',
      body: JSON.stringify({ employees, company }),
    })
  }

  // Consultations
  async getConsultations() {
    return this.fetch<ConsultationData[]>('/consultations')
  }

  async getConsultation(id: string) {
    return this.fetch<ConsultationData>(`/consultations/${id}`)
  }

  async createConsultation(data: Partial<ConsultationData>) {
    return this.fetch<ConsultationData>('/consultations', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateConsultation(id: string, data: Partial<ConsultationData>) {
    return this.fetch<ConsultationData>(`/consultations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  // Processes
  async getProcesses() {
    return this.fetch<Process[]>('/processes')
  }

  async getProcess(id: string) {
    return this.fetch<Process>(`/processes/${id}`)
  }

  async createProcess(data: Partial<Process>) {
    return this.fetch<Process>('/processes', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateProcess(id: string, data: Partial<Process>) {
    return this.fetch<Process>(`/processes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  // Reports
  async getReports() {
    return this.fetch<Report[]>('/reports')
  }

  async getReport(id: string) {
    return this.fetch<Report>(`/reports/${id}`)
  }

  async createReport(data: Partial<Report>) {
    return this.fetch<Report>('/reports', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  // Documents
  async getDocuments(params?: { category?: string; department?: string; limit?: number }) {
    const searchParams = new URLSearchParams()
    if (params?.category) searchParams.set('category', params.category)
    if (params?.department) searchParams.set('department', params.department)
    if (params?.limit) searchParams.set('limit', params.limit.toString())

    const query = searchParams.toString()
    return this.fetch<{ documents: Document[]; total: number }>(
      `/documents${query ? `?${query}` : ''}`
    )
  }

  async uploadDocument(file: File, category?: string, department?: string) {
    const formData = new FormData()
    formData.append('file', file)
    if (category) formData.append('category', category)
    if (department) formData.append('department', department)

    const response = await fetch(`${API_BASE_URL}/documents/upload`, {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`)
    }

    return response.json() as Promise<{
      status: string
      document: {
        id: string
        name: string
        file_url?: string
        summary?: string
        page_count?: number
        category?: string
        department?: string
      }
    }>
  }

  async deleteDocument(id: string) {
    return this.fetch<{ status: string; id: string }>(`/documents/${id}`, {
      method: 'DELETE',
    })
  }

  // AI Insights
  async getInsights(limit = 50) {
    return this.fetch<{ insights: CallInsights[]; total: number }>(`/insights?limit=${limit}`)
  }

  async getCallInsights(callSessionId: string) {
    return this.fetch<CallInsights>(`/insights/${callSessionId}`)
  }

  async analyzeCall(callSessionId: string) {
    return this.fetch<{ status: string; insights: CallInsights }>(`/insights/analyze/${callSessionId}`, {
      method: 'POST',
    })
  }

  async synthesizeInsights(callSessionIds: string[], processName?: string) {
    return this.fetch<{
      executive_summary: string
      common_pain_points: Array<{
        pain_point: string
        mentioned_by: number
        severity: string
        departments_affected: string[]
        recommended_action: string
      }>
      process_bottlenecks: Array<{
        bottleneck: string
        impact: string
        root_cause: string
        solution: string
      }>
      quick_wins: Array<{
        opportunity: string
        effort: string
        impact: string
        timeline: string
      }>
      automation_priorities: Array<{
        process: string
        current_state: string
        automation_approach: string
        roi_estimate: string
      }>
    }>('/insights/synthesize', {
      method: 'POST',
      body: JSON.stringify({ call_session_ids: callSessionIds, process_name: processName }),
    })
  }
}

export const api = new ApiService()

// WebSocket connection for real-time chat
export function createChatWebSocket(sessionId: string) {
  const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  const wsHost = window.location.host
  const ws = new WebSocket(`${wsProtocol}//${wsHost}/api/chat/ws/${sessionId}`)

  return ws
}
