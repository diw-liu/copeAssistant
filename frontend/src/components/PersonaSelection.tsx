import { Sparkles } from 'lucide-react'
import type { PersonaOption } from '../types/chat'

const PERSONA_CHOICES: { value: PersonaOption; label: string }[] = [
  { value: 'socrates', label: 'Socrates' },
  { value: 'lao_tzu', label: 'Lao Tzu' },
  { value: 'custom', label: 'Me' },
]

interface PersonaSelectionProps {
  selectedPersona: PersonaOption
  onSelectPersona: (persona: PersonaOption) => void
}

export function PersonaSelection({ selectedPersona, onSelectPersona }: PersonaSelectionProps) {
  return (
    <div className="space-y-2">
      <p className="flex items-center gap-2 text-xs uppercase tracking-wider text-zinc-400">
        <Sparkles size={14} />
        Philosopher
      </p>
      <div className="flex flex-wrap gap-2">
        {PERSONA_CHOICES.map(({ value, label }) => {
          const active = value === selectedPersona
          return (
            <button
              key={value}
              type="button"
              onClick={() => onSelectPersona(value)}
              className={`rounded-full border px-4 py-2 text-sm transition ${
                active
                  ? 'border-sky-400/80 bg-sky-500/15 text-sky-100'
                  : 'border-zinc-600 bg-zinc-800/70 text-zinc-200 hover:border-zinc-500 hover:bg-zinc-800'
              }`}
            >
              {label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
