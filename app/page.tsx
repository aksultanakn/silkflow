'use client'

import { useState, useRef, useEffect } from 'react'

type Message = { role: 'user' | 'agent'; text: string }

function renderMarkdown(text: string) {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" class="underline text-emerald-400">$1</a>')
    .replace(/`([^`]+)`/g, '<code class="bg-white/10 px-1 rounded text-xs">$1</code>')
    .split('\n')
    .map(l => `<p class="mb-1">${l}</p>`)
    .join('')
}

const SUGGESTIONS = [
  'Check treasury balance',
  'Show yield info',
  'List my team',
  'Pay Aldiyar $500 and Baha $300',
]

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'agent',
      text: "Hi! I'm the **SilkFlow** payroll agent.\n\n• Check **treasury balance** and T-bill yield\n• **Pay workers** — \"pay Aldiyar $500 and Baha $300\"\n• List your **team**\n\nWhat would you like to do?",
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function send(text: string) {
    if (!text.trim() || loading) return
    setMessages(prev => [...prev, { role: 'user', text }])
    setInput('')
    setLoading(true)
    try {
      const res = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history: messages }),
      })
      const data = await res.json()
      setMessages(prev => [...prev, { role: 'agent', text: data.text }])
    } catch {
      setMessages(prev => [...prev, { role: 'agent', text: 'Something went wrong. Please try again.' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-sm font-bold">S</div>
          <div>
            <div className="font-semibold text-sm">SilkFlow</div>
            <div className="text-xs text-gray-400">AI Payroll Agent · Solana · SilkPay</div>
          </div>
        </div>
        <a href="/worker" className="text-xs text-emerald-400 hover:underline">Worker Portal →</a>
      </header>

      <div className="border-b border-white/10 px-6 py-3 flex gap-6 text-xs text-gray-400">
        <span>Treasury: <strong className="text-white">USDC on Solana</strong></span>
        <span>Yield: <strong className="text-emerald-400">4.85% APY</strong> (sUSD T-bill)</span>
        <span>Network: <strong className="text-white">Devnet</strong></span>
        <span>Offramp: <strong className="text-white">SilkPay Mastercard</strong></span>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4 max-w-2xl mx-auto w-full">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {m.role === 'agent' && (
              <div className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center text-xs font-bold mr-2 mt-1 shrink-0">S</div>
            )}
            <div
              className={`max-w-sm rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                m.role === 'user'
                  ? 'bg-emerald-600 text-white rounded-br-sm'
                  : 'bg-white/10 text-gray-100 rounded-bl-sm'
              }`}
              dangerouslySetInnerHTML={{ __html: renderMarkdown(m.text) }}
            />
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center text-xs font-bold mr-2 shrink-0">S</div>
            <div className="bg-white/10 rounded-2xl rounded-bl-sm px-4 py-3 text-sm text-gray-400 animate-pulse">
              Thinking...
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {messages.length <= 1 && (
        <div className="px-6 pb-2 flex gap-2 flex-wrap max-w-2xl mx-auto w-full">
          {SUGGESTIONS.map(s => (
            <button
              key={s}
              onClick={() => send(s)}
              className="text-xs border border-white/20 rounded-full px-3 py-1.5 text-gray-300 hover:border-emerald-400 hover:text-emerald-400 transition"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <div className="border-t border-white/10 px-6 py-4 max-w-2xl mx-auto w-full">
        <form onSubmit={e => { e.preventDefault(); send(input) }} className="flex gap-3">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder='e.g. "Pay Aldiyar $500 and Baha $300"'
            className="flex-1 bg-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-emerald-500 placeholder-gray-500"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed px-5 py-3 rounded-xl text-sm font-medium transition"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  )
}
