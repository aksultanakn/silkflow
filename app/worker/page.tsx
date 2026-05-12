'use client'

import { useState } from 'react'

const WORKERS = [
  { id: 'aldiyar', name: 'Aldiyar', address: process.env.NEXT_PUBLIC_WORKER1 ?? '' },
  { id: 'baha',    name: 'Baha',    address: process.env.NEXT_PUBLIC_WORKER2 ?? '' },
  { id: 'dana',    name: 'Dana',    address: process.env.NEXT_PUBLIC_WORKER3 ?? '' },
]

type Card = {
  number: string
  expiry: string
  cvv: string
  network: string
  type: string
  currency: string
  issuedBy: string
}

type WorkerState = 'idle' | 'paying_fee' | 'claiming' | 'done'

export default function WorkerPage() {
  const [selected, setSelected] = useState<string | null>(null)
  const [state, setState] = useState<WorkerState>('idle')
  const [card, setCard] = useState<Card | null>(null)
  const [log, setLog] = useState<string[]>([])

  function addLog(msg: string) {
    setLog(prev => [...prev, msg])
  }

  async function claimCard(workerId: string) {
    setSelected(workerId)
    setCard(null)
    setLog([])
    setState('paying_fee')

    // Step 1: Hit card endpoint — will get 402
    addLog('→ Requesting SilkPay virtual card...')
    const first = await fetch('/api/card')
    if (first.status === 402) {
      const data = await first.json()
      addLog(`← 402 Payment Required: ${data.x402.amount} ${data.x402.currency} issuance fee`)
      addLog('→ Agent pays fee autonomously via x402 (USDC on Solana)...')

      // Simulate payment delay
      await new Promise(r => setTimeout(r, 1800))
      addLog('✓ Fee paid · tx: mock_x402_' + Math.random().toString(36).slice(2, 10))
    }

    // Step 2: Retry with payment proof → get card
    setState('claiming')
    addLog('→ Retrying with payment proof...')
    await new Promise(r => setTimeout(r, 800))

    const second = await fetch('/api/card?paid=true')
    const cardData = await second.json()

    setCard(cardData.card)
    setState('done')
    addLog('✓ SilkPay virtual Mastercard issued')
  }

  const worker = WORKERS.find(w => w.id === selected)

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-sm font-bold">S</div>
          <div>
            <div className="font-semibold text-sm">SilkFlow · Worker Portal</div>
            <div className="text-xs text-gray-400">Claim your SilkPay virtual Mastercard</div>
          </div>
        </div>
        <a href="/" className="text-xs text-emerald-400 hover:underline">← Employer Dashboard</a>
      </header>

      <div className="max-w-lg mx-auto w-full px-6 py-10 space-y-6">
        <div>
          <h2 className="text-lg font-semibold mb-1">Who are you?</h2>
          <p className="text-sm text-gray-400 mb-4">Select your name to claim your payroll card.</p>
          <div className="grid grid-cols-3 gap-3">
            {WORKERS.map(w => (
              <button
                key={w.id}
                onClick={() => claimCard(w.id)}
                disabled={state === 'paying_fee' || state === 'claiming'}
                className={`rounded-xl border py-4 text-sm font-medium transition ${
                  selected === w.id
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                    : 'border-white/20 hover:border-emerald-400 hover:text-emerald-400'
                } disabled:opacity-40 disabled:cursor-not-allowed`}
              >
                {w.name}
              </button>
            ))}
          </div>
        </div>

        {log.length > 0 && (
          <div className="bg-black/40 rounded-xl p-4 font-mono text-xs space-y-1 text-gray-300">
            <div className="text-gray-500 mb-2">x402 payment log</div>
            {log.map((l, i) => (
              <div key={i} className={l.startsWith('✓') ? 'text-emerald-400' : ''}>{l}</div>
            ))}
            {(state === 'paying_fee' || state === 'claiming') && (
              <div className="text-gray-500 animate-pulse">processing...</div>
            )}
          </div>
        )}

        {card && (
          <div className="relative rounded-2xl overflow-hidden p-6 bg-gradient-to-br from-emerald-600 to-teal-800 shadow-2xl">
            <div className="flex justify-between items-start mb-8">
              <div>
                <div className="text-xs text-emerald-200 mb-1">issued by</div>
                <div className="font-bold text-lg">{card.issuedBy}</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-emerald-200">powered by</div>
                <div className="text-sm font-medium">Solana</div>
              </div>
            </div>

            <div className="font-mono text-xl tracking-widest mb-6">{card.number}</div>

            <div className="flex justify-between items-end">
              <div>
                <div className="text-xs text-emerald-200">cardholder</div>
                <div className="font-medium">{worker?.name.toUpperCase()}</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-emerald-200">expires</div>
                <div className="font-mono">{card.expiry}</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-emerald-200 mb-1">{card.type}</div>
                <div className="font-bold text-lg">{card.network}</div>
              </div>
            </div>

            <div className="absolute top-4 right-4 opacity-10 text-8xl font-black select-none">◎</div>
          </div>
        )}

        {card && (
          <div className="rounded-xl border border-white/10 p-4 text-sm space-y-2">
            <div className="text-gray-400 text-xs font-medium uppercase tracking-wide mb-3">Card details</div>
            <div className="flex justify-between"><span className="text-gray-400">Currency</span><span>{card.currency}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Network</span><span>{card.network}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Type</span><span>{card.type}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Usable at</span><span>Any Mastercard merchant</span></div>
          </div>
        )}
      </div>
    </div>
  )
}
