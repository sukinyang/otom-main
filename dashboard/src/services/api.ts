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
}

export const api = new ApiService()

// WebSocket connection for real-time chat
export function createChatWebSocket(sessionId: string) {
  const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  const wsHost = window.location.host
  const ws = new WebSocket(`${wsProtocol}//${wsHost}/api/chat/ws/${sessionId}`)

  return ws
}
