import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import type { ChatMessage } from '../types/chat'

interface MessageListProps {
  messages: ChatMessage[]
}

const bubbleByRole: Record<ChatMessage['role'], string> = {
  user: 'ml-auto max-w-[82%] bg-slate-700 text-slate-100',
  assistant: 'mr-auto max-w-[82%] bg-zinc-800 text-zinc-100',
  status: 'mx-auto max-w-[90%] bg-zinc-800/50 text-zinc-300 text-sm',
  error: 'mx-auto max-w-[90%] bg-red-900/40 text-red-200 text-sm',
}

export function MessageList({ messages }: MessageListProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return
    containerRef.current.scrollTo({
      top: containerRef.current.scrollHeight,
      behavior: 'smooth',
    })
  }, [messages])

  return (
    <div ref={containerRef} className="flex-1 space-y-3 overflow-y-auto px-6 py-5">
      {messages.length === 0 ? (
        <p className="mt-14 text-center text-sm text-zinc-400">
          Share what is on your mind. Copassistant is here with grounded support.
        </p>
      ) : (
        messages.map((message) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className={`rounded-2xl px-4 py-3 leading-relaxed shadow-sm ${bubbleByRole[message.role]}`}
          >
            {message.content}
          </motion.div>
        ))
      )}
    </div>
  )
}
