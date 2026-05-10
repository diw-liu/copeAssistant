import { MessageCircleHeart } from 'lucide-react'
import { MessageInput } from './components/MessageInput'
import { MessageList } from './components/MessageList'
import { PersonaSelection } from './components/PersonaSelection'
import { useChat } from './hooks/useChat'

function App() {
  const { messages, isConnected, isLoading, selectedPersona, sendMessage, setPersona } = useChat()

  return (
    <main className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-900 to-slate-900 px-4 py-8 text-zinc-100">
      <section className="mx-auto flex min-h-[85vh] w-full max-w-3xl flex-col rounded-3xl border border-zinc-700/70 bg-zinc-900/70 shadow-2xl shadow-zinc-950/40 backdrop-blur">
        <header className="border-b border-zinc-700/60 px-6 py-5">
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-full bg-zinc-800 p-2 text-sky-200">
              <MessageCircleHeart size={18} />
            </div>
            <div>
              <h1 className="text-lg font-semibold tracking-tight">Copassistant</h1>
              <p className="text-sm text-zinc-400">
                {isConnected ? 'Connected and ready to listen' : 'Connecting...'}
              </p>
            </div>
          </div>
          <PersonaSelection selectedPersona={selectedPersona} onSelectPersona={setPersona} />
        </header>

        <MessageList messages={messages} />
        <MessageInput disabled={!isConnected || isLoading} isLoading={isLoading} onSend={sendMessage} />
      </section>
    </main>
  )
}

export default App
