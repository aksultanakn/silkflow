export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getUSDCBalance, sendUSDC } from '@/lib/solana'

const MOCK = process.env.MOCK_MODE === 'true'
const MOCK_BALANCE = 12_500 // $12,500 USDC in treasury

const WORKERS: Record<string, { address: string; name: string }> = {
  aldiyar: { address: process.env.NEXT_PUBLIC_WORKER1!, name: 'Aldiyar' },
  baha:    { address: process.env.NEXT_PUBLIC_WORKER2!, name: 'Baha' },
  dana:    { address: process.env.NEXT_PUBLIC_WORKER3!, name: 'Dana' },
}

const YIELD_APY = 4.85

function parsePayments(input: string): { name: string; amount: number }[] {
  const matches = [...input.matchAll(/([a-zA-Z]+)\s+\$?([\d,]+)/g)]
  return matches
    .map(m => ({ name: m[1].toLowerCase(), amount: parseFloat(m[2].replace(',', '')) }))
    .filter(p => WORKERS[p.name] && p.amount > 0)
}

function mockTxSig() {
  return Array.from({ length: 88 }, () => '23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'[Math.floor(Math.random() * 58)]).join('')
}

export async function POST(req: NextRequest) {
  const { message } = await req.json()
  const lower = message.toLowerCase()

  // INTENT: balance
  if (lower.includes('balance') || lower.includes('treasury')) {
    const bal = MOCK ? MOCK_BALANCE : await getUSDCBalance(process.env.NEXT_PUBLIC_TREASURY_ADDRESS!)
    const daily = ((bal * YIELD_APY) / 100 / 365).toFixed(4)
    return NextResponse.json({
      text: `Treasury holds **$${Number(bal).toFixed(2)} USDC**.\nEarning **${YIELD_APY}% APY** via T-bill tokens (sUSD on Solana) — ~$${daily} USDC/day while funds sit idle.`,
    })
  }

  // INTENT: yield info
  if (lower.includes('yield') || lower.includes('tbill') || lower.includes('t-bill') || lower.includes('interest')) {
    return NextResponse.json({
      text: `Idle payroll funds are held in **sUSD** (Solayer's T-bill-backed stablecoin on Solana).\n\n• APY: **${YIELD_APY}%**\n• Backed by: US Treasury Bills\n• Settlement: Solana (~400ms, ~$0.00025/tx)\n• Redeemable to USDC anytime before payroll runs`,
    })
  }

  // INTENT: list workers
  if (lower.includes('worker') || lower.includes('employee') || lower.includes('team') || lower.includes('list')) {
    const list = Object.values(WORKERS).map(w => `• **${w.name}** — \`${w.address.slice(0, 8)}...\``).join('\n')
    return NextResponse.json({
      text: `Registered workers:\n\n${list}\n\nSay "pay Alice $500 and Bob $300" to run payroll.`,
    })
  }

  // INTENT: pay workers
  const payments = parsePayments(message)
  if ((lower.includes('pay') || lower.includes('send')) && payments.length > 0) {
    const total = payments.reduce((s, p) => s + p.amount, 0)
    const bal = MOCK ? MOCK_BALANCE : await getUSDCBalance(process.env.NEXT_PUBLIC_TREASURY_ADDRESS!)

    if (bal < total) {
      return NextResponse.json({
        text: `Insufficient balance. Treasury has **$${Number(bal).toFixed(2)} USDC** but payroll needs **$${total}**.`,
      })
    }

    let text = `Running payroll for ${payments.length} worker(s) — total **$${total} USDC**:\n\n`
    const results = []

    for (const p of payments) {
      const worker = WORKERS[p.name]
      try {
        const sig = MOCK ? mockTxSig() : await sendUSDC(worker.address, p.amount)
        results.push({ name: worker.name, amount: p.amount, sig, status: 'paid' })
        text += `✓ **${worker.name}** — $${p.amount} USDC · [view tx](https://explorer.solana.com/tx/${sig}?cluster=devnet)\n`
      } catch (e: any) {
        results.push({ name: worker.name, amount: p.amount, status: 'failed' })
        text += `✗ **${worker.name}** — failed: ${e?.message ?? 'unknown error'}\n`
      }
    }

    text += `\nWorkers can now claim their **SilkPay virtual Mastercard** at [/worker](/worker)`
    return NextResponse.json({ text, meta: { payments: results } })
  }

  // DEFAULT
  return NextResponse.json({
    text: `Hi! I'm the **SilkFlow** payroll agent. I can:\n\n• Check **treasury balance** and T-bill yield\n• **Pay workers** — "pay Aldiyar $500 and Baha $300"\n• List your **team**\n\nWhat would you like to do?`,
  })
}
