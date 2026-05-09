import { Sparkles } from 'lucide-react'
import type { MoodOption } from '../types/chat'

const moodOptions: MoodOption[] = ['Job Hunt', 'Burnout', 'General Stress']

interface MoodSelectionProps {
  selectedMood: MoodOption
  onSelectMood: (mood: MoodOption) => void
}

export function MoodSelection({ selectedMood, onSelectMood }: MoodSelectionProps) {
  return (
    <div className="space-y-2">
      <p className="flex items-center gap-2 text-xs uppercase tracking-wider text-zinc-400">
        <Sparkles size={14} />
        Mood Selection
      </p>
      <div className="flex flex-wrap gap-2">
        {moodOptions.map((mood) => {
          const active = mood === selectedMood
          return (
            <button
              key={mood}
              type="button"
              onClick={() => onSelectMood(mood)}
              className={`rounded-full border px-4 py-2 text-sm transition ${
                active
                  ? 'border-sky-400/80 bg-sky-500/15 text-sky-100'
                  : 'border-zinc-600 bg-zinc-800/70 text-zinc-200 hover:border-zinc-500 hover:bg-zinc-800'
              }`}
            >
              {mood}
            </button>
          )
        })}
      </div>
    </div>
  )
}
