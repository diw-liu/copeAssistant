import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ChatMessage, ClientPayload, MoodOption, ServerPayload } from '../types/chat'

const WS_URL = 'ws://localhost:8080/ws'
const DEFAULT_MOOD: MoodOption = 'General Stress'

const makeMessage = (role: ChatMessage['role'], content: string): ChatMessage => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
  role,
  content,
})

export function useChat() {
  const socketRef = useRef<WebSocket | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedMood, setSelectedMood] = useState<MoodOption>(DEFAULT_MOOD)

  const appendMessage = useCallback((role: ChatMessage['role'], content: string) => {
    setMessages((prev) => [...prev, makeMessage(role, content)])
  }, [])

  const sendPayload = useCallback((payload: ClientPayload) => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      appendMessage('error', 'Connection is not ready yet. Please wait a moment.')
      return
    }

    socketRef.current.send(JSON.stringify(payload))
  }, [appendMessage])

  useEffect(() => {
    const socket = new WebSocket(WS_URL)
    socketRef.current = socket

    socket.onopen = () => {
      setIsConnected(true)
      sendPayload({ type: 'context', mood: DEFAULT_MOOD })
    }

    socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as ServerPayload
        if (!payload.content?.trim()) return

        if (payload.type === 'assistant') {
          appendMessage('assistant', payload.content)
          setIsLoading(false)
          return
        }

        appendMessage(payload.type, payload.content)
      } catch {
        appendMessage('error', 'Received an invalid response from server.')
        setIsLoading(false)
      }
    }

    socket.onerror = () => {
      appendMessage('error', 'WebSocket connection error.')
      setIsLoading(false)
    }

    socket.onclose = () => {
      setIsConnected(false)
      setIsLoading(false)
    }

    return () => {
      socket.close()
      socketRef.current = null
    }
  }, [appendMessage, sendPayload])

  const sendMessage = useCallback((content: string) => {
    const trimmed = content.trim()
    if (!trimmed) return
    appendMessage('user', trimmed)
    setIsLoading(true)
    sendPayload({ type: 'message', content: trimmed })
  }, [appendMessage, sendPayload])

  const setMood = useCallback((mood: MoodOption) => {
    setSelectedMood(mood)
    sendPayload({ type: 'context', mood })
  }, [sendPayload])

  return useMemo(() => ({
    messages,
    isConnected,
    isLoading,
    selectedMood,
    sendMessage,
    setMood,
  }), [isConnected, isLoading, messages, selectedMood, sendMessage, setMood])
}
