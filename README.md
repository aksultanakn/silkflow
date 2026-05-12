# SilkFlow

> Pay your team across Central Asia in seconds. No SWIFT. No bank account needed. Your treasury earns while it waits.

**Live demo → [silkflow-iota.vercel.app](https://silkflow-iota.vercel.app)**

Built for the [Superteam KZ × S1lkPay Frontier Side Track](https://superteam.fun/earn/listing/superteam-kz-x-s1lkpay-frontier-side-track) at Colosseum Frontier Hackathon.

---

## The story

Meet Aldiyar. He runs a small software agency in Almaty with contractors spread across Kazakhstan, Georgia, and Uzbekistan. Every month, the same headache: wire transfers that take 5 days, eat 5% in fees, and sometimes just... don't arrive. His contractors don't always have bank accounts that accept international transfers. And while Aldiyar's payroll budget sits waiting for pay day, it earns exactly nothing.

This is the norm for tens of thousands of businesses across the CIS region. It's not a niche problem — it's how things work here.

**SilkFlow fixes it.**

Employers top up a USDC treasury on Solana. Those funds automatically earn ~4.85% APY from tokenized US T-bills while sitting idle. On payday, the employer types one message — *"pay Aldiyar $500 and Baha $300"* — and the agent handles everything: checks the balance, executes the transfers on-chain, and issues each worker a SilkPay virtual Mastercard they can spend anywhere, right now, no bank account required.

From payroll command to spendable card in under 30 seconds.

---

## How it works

```
Employer tops up treasury with USDC
        ↓
Funds earn ~4.85% APY via sUSD (Solayer T-bill tokens) while sitting idle
        ↓
Employer: "pay Aldiyar $500 and Baha $300"
        ↓
Agent executes USDC transfers on Solana  ·  400ms  ·  $0.00025/tx
        ↓
Worker opens /worker, selects their name
        ↓
x402: agent pays card issuance fee autonomously (no login, no API key)
        ↓
SilkPay virtual Mastercard issued instantly
        ↓
Worker spends in KZ, GE, UZ, UAE — online or in-store
```

---

## Why this matters for CIS

| The old way | SilkFlow |
|---|---|
| SWIFT wire: 3–5 days, 3–7% fee | Solana transfer: <1 sec, ~$0.00025 |
| Requires recipient bank account | Works with just a wallet + SilkPay card |
| Treasury earns 0% while waiting | Treasury earns ~4.85% APY (T-bills) |
| Manual bank portal, per-transfer | One chat message, unlimited recipients |
| Breaks across borders | Works across entire CIS + UAE natively |

KZT lost 18% of its value in the last two years. UZS, AMD, and GEL tell similar stories. Workers in these countries aren't just frustrated by slow payments — they're losing real money every day their salary sits in local currency. USDC-denominated payroll via SilkFlow isn't just convenient, it's financially protective.

---

## Demo

**Employer view (`/`)**
- Chat with the SilkFlow agent
- Ask for treasury balance — see live T-bill yield accrual
- Say *"pay Aldiyar $500 and Baha $300"* — agent executes both transfers

**Worker view (`/worker`)**
- Select your name
- Watch the x402 payment flow happen in real time (agent pays the card fee autonomously)
- Receive your SilkPay virtual Mastercard — ready to spend

---

## Tech stack

| Layer | Technology |
|---|---|
| Chain | Solana (devnet / mainnet) |
| Stablecoin | USDC (SPL token) |
| Treasury yield | sUSD — Solayer's T-bill-backed stablecoin (~4.85% APY) |
| Payment protocol | x402 (HTTP 402) — autonomous agentic card issuance |
| Offramp | SilkPay virtual Mastercard (KZ, UAE, Turkey, Sudan) |
| Frontend | Next.js 16, TypeScript, Tailwind CSS |
| Solana SDK | `@solana/web3.js` + `@solana/spl-token` |

### Project structure

```
silkflow/
├── app/
│   ├── page.tsx              # Employer chat UI
│   ├── worker/page.tsx       # Worker card claim portal
│   └── api/
│       ├── agent/route.ts    # Scripted payroll agent
│       ├── balance/route.ts  # USDC balance check
│       └── card/route.ts     # x402 virtual card issuance
├── lib/
│   └── solana.ts             # USDC transfer + balance (web3.js + spl-token)
└── scripts/
    └── setup-devnet.ts       # One-time devnet token mint + treasury funding
```

---

## Why x402

The worker card issuance endpoint implements the [x402 protocol](https://x402.org) — the open HTTP payment standard for autonomous agents:

1. Worker requests `/api/card` — server returns `HTTP 402 Payment Required` with USDC amount and recipient
2. Agent pays the issuance fee autonomously — no login, no API key, no human in the loop
3. Worker retries with payment proof — server returns the virtual card

This is what AI-native finance looks like. The agent reasons about cost, authorizes payment from its own wallet, and unlocks a real-world financial product — all in one round trip. SilkFlow is one of the first products to apply x402 to a real CIS payroll use case.

---

## SilkPay integration

SilkPay is a Mastercard-principal virtual card issuer built in Kazakhstan, operating across KZ, UAE, Turkey, and Sudan — exactly where SilkFlow's users are.

In production, `/api/card` calls SilkPay's card issuance API directly. The x402 fee covers issuance cost, deducted from the worker's USDC balance before the card is topped up. Every payroll run becomes a SilkPay card distribution event — turning SilkFlow into a direct acquisition channel for SilkPay users who previously had no path to a payment card.

---

## Getting started

### Prerequisites

- Node.js 18+
- Solana CLI (`sh -c "$(curl -sSfL https://release.solana.com/stable/install)"`)

### Install

```bash
git clone https://github.com/aksultanakn/silkflow
cd silkflow
npm install
```

### Configure

Create `.env.local`:

```env
USDC_MINT=4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU
TREASURY_PRIVATE_KEY=your_bs58_encoded_private_key
NEXT_PUBLIC_TREASURY_ADDRESS=your_treasury_public_key
NEXT_PUBLIC_WORKER1=worker_1_public_key
NEXT_PUBLIC_WORKER2=worker_2_public_key
NEXT_PUBLIC_WORKER3=worker_3_public_key
MOCK_MODE=true   # set false once devnet funded
```

### Fund treasury on devnet

```bash
solana airdrop 2 YOUR_TREASURY_ADDRESS --url devnet
npm run setup:devnet   # creates mint + deposits 10,000 USDC
```

### Run

```bash
npm run dev
# open http://localhost:3000
```

---

## Roadmap

- [ ] Real SilkPay card issuance API integration
- [ ] sUSD / cUSDO yield deposit on employer funding
- [ ] Recurring payroll schedule (cron-triggered agent)
- [ ] Multi-sig treasury approval for large transfers
- [ ] On-chain payroll contract (Anchor) for fully trustless execution
- [ ] Worker KYC via SilkPay identity layer
- [ ] Mobile-first worker UI with wallet connect
- [ ] Multi-currency support (KZT, AED, GEL offramp)

---

## Team

Built solo at the Superteam KZ × S1lkPay Frontier Hackathon. Kazakhstan-based. Shipping fast.

---

## License

MIT
