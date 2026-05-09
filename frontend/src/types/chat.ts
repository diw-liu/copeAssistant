export type MoodOption = 'Job Hunt' | 'Burnout' | 'General Stress'

export type ChatMessageRole = 'user' | 'assistant' | 'status' | 'error'

export interface ChatMessage {
  id: string
  role: ChatMessageRole
  content: string
}

export interface ClientMessagePayload {
  type: 'message'
  content: string
}

export interface ClientContextPayload {
  type: 'context'
  mood: MoodOption
}

export type ClientPayload = ClientMessagePayload | ClientContextPayload

export interface ServerPayload {
  type: 'assistant' | 'status' | 'error'
  content: string
}
