import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type {
  ChatHistoryItem,
  ChatMessage,
  ChatRequestPayload,
  PersonaOption,
  StreamEventPayload,
} from '../types/chat'

function websocketUrl(): string {
  const fromEnv = import.meta.env.VITE_WS_URL as string | undefined
  if (fromEnv) return fromEnv

  const isSecurePage = typeof window !== 'undefined' && window.location.protocol === 'https:'
  const protocol = isSecurePage ? 'wss:' : 'ws:'
  const host = typeof window !== 'undefined' ? window.location.host : 'localhost:5173'
  return `${protocol}//${host}/ws`
}

const DEFAULT_PERSONA: PersonaOption = 'socrates'

const makeMessage = (role: ChatMessage['role'], content: string): ChatMessage => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
  role,
  content,
})

function toHistory(messages: ChatMessage[]): ChatHistoryItem[] {
  return messages
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .filter((m) => m.content.trim().length > 0)
    .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }))
}

export function useChat() {
  const socketRef = useRef<WebSocket | null>(null)
  const messagesRef = useRef<ChatMessage[]>([])
  const selectedPersonaRef = useRef<PersonaOption>(DEFAULT_PERSONA)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedPersona, setSelectedPersona] = useState<PersonaOption>(DEFAULT_PERSONA)

  selectedPersonaRef.current = selectedPersona

  useEffect(() => {
    messagesRef.current = messages
  }, [messages])

  const appendMessage = useCallback((role: ChatMessage['role'], content: string) => {
    setMessages((prev) => [...prev, makeMessage(role, content)])
  }, [])

  const sendChatPayload = useCallback(
    (payload: ChatRequestPayload) => {
      if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
        appendMessage('error', 'Connection is not ready yet. Please wait a moment.')
        return
      }

      socketRef.current.send(JSON.stringify(payload))
    },
    [appendMessage],
  )

  useEffect(() => {
    const url = websocketUrl()
    const socket = new WebSocket(url)
    socketRef.current = socket

    socket.onopen = () => {
      setIsConnected(true)
    }

    socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as StreamEventPayload

        if (payload.type === 'start') {
          setMessages((prev) => [...prev, makeMessage('assistant', '')])
          return
        }

        if (payload.type === 'chunk') {
          const part = payload.content ?? ''
          if (!part) return
          setMessages((prev) => {
            const next = [...prev]
            const last = next[next.length - 1]
            if (!last || last.role !== 'assistant') return next
            next[next.length - 1] = {
              ...last,
              content: last.content + part,
            }
            return next
          })
          return
        }

        if (payload.type === 'done') {
          setIsLoading(false)
          return
        }

        if (payload.type === 'error') {
          appendMessage('error', payload.message?.trim() || 'Something went wrong.')
          setIsLoading(false)
          return
        }
      } catch {
        appendMessage('error', 'Received an invalid response from server.')
        setIsLoading(false)
      }
    }

    socket.onerror = () => {
      // Ignore errors from sockets we've already replaced (e.g. React Strict Mode) or torn down.
      if (socketRef.current !== socket) return
      appendMessage('error', 'WebSocket connection error.')
      setIsLoading(false)
    }

    socket.onclose = () => {
      setIsConnected(false)
      setIsLoading(false)
    }

    return () => {
      socketRef.current = null
      socket.close()
    }
  }, [appendMessage])

  const sendMessage = useCallback(
    (content: string) => {
      const trimmed = content.trim()
      if (!trimmed) return

      const history = toHistory(messagesRef.current)

      appendMessage('user', trimmed)
      setIsLoading(true)
      sendChatPayload({
        message: trimmed,
        history,
        persona: selectedPersonaRef.current,
      })
    },
    [appendMessage, sendChatPayload],
  )

  const setPersona = useCallback((persona: PersonaOption) => {
    setSelectedPersona(persona)
  }, [])

  return useMemo(
    () => ({
      messages,
      isConnected,
      isLoading,
      selectedPersona,
      sendMessage,
      setPersona,
    }),
    [isConnected, isLoading, messages, selectedPersona, sendMessage, setPersona],
  )
}
