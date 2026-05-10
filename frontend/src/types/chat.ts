/** Must match backend Persona literal */
export type PersonaOption = 'socrates' | 'lao_tzu' | 'custom'

export type ChatMessageRole = 'user' | 'assistant' | 'status' | 'error'

export interface ChatMessage {
  id: string
  role: ChatMessageRole
  content: string
}

export interface ChatHistoryItem {
  role: 'user' | 'assistant'
  content: string
}

/** Outbound JSON matching backend ChatRequest */
export interface ChatRequestPayload {
  message: string
  history: ChatHistoryItem[]
  persona: PersonaOption
}

/** Inbound events from backend StreamEvent */
export type StreamEventPayload =
  | { type: 'start' }
  | { type: 'chunk'; content: string | null }
  | { type: 'done' }
  | { type: 'error'; message: string | null }
