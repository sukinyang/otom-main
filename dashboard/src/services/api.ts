const API_BASE_URL = '/api'

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
}

export const api = new ApiService()

// WebSocket connection for real-time chat
export function createChatWebSocket(sessionId: string) {
  const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  const wsHost = window.location.host
  const ws = new WebSocket(`${wsProtocol}//${wsHost}/api/chat/ws/${sessionId}`)

  return ws
}
