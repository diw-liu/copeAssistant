import { LoaderCircle, SendHorizontal } from 'lucide-react'
import { FormEvent, useState } from 'react'

interface MessageInputProps {
  disabled: boolean
  isLoading: boolean
  onSend: (message: string) => void
}

export function MessageInput({ disabled, isLoading, onSend }: MessageInputProps) {
  const [value, setValue] = useState('')

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (disabled || !value.trim()) return
    onSend(value)
    setValue('')
  }

  return (
    <form onSubmit={handleSubmit} className="border-t border-zinc-700/60 p-4">
      <div className="flex items-center gap-3 rounded-2xl border border-zinc-700 bg-zinc-900 px-3 py-2">
        <input
          type="text"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="Type your message..."
          disabled={disabled}
          className="w-full bg-transparent px-2 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-70"
        />
        <button
          type="submit"
          disabled={disabled || !value.trim()}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-600 text-slate-100 transition hover:bg-slate-500 disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-400"
          aria-label="Send message"
        >
          {isLoading ? <LoaderCircle size={18} className="animate-spin" /> : <SendHorizontal size={18} />}
        </button>
      </div>
    </form>
  )
}
