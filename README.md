# SilkFlow

**AI-powered payroll agent for CIS businesses — USDC on Solana, T-bill yield, SilkPay virtual Mastercard offramp.**

Built for the [Superteam KZ × S1lkPay Frontier Side Track](https://superteam.fun/earn/listing/superteam-kz-x-s1lkpay-frontier-side-track) at Colosseum Frontier Hackathon.

---

## The problem

Running payroll across Kazakhstan and probably the broader CIS region is broken:

- SWIFT wires take 3–5 days and cost 3–7% in fees
- Local currencies (KZT, UZS, AMD) lose value while payroll funds sit idle
- Workers without bank accounts can't receive international transfers
- Employers have zero yield on treasury funds between pay cycles

## The solution

SilkFlow is a chat-first payroll agent that lets employers pay workers in USDC on Solana — and earn T-bill yield on idle funds while they wait.

```
Employer deposits USDC
        ↓
Funds earn ~4.85% APY (sUSD T-bill tokens, Solayer) while sitting in treasury
        ↓
Employer types: "pay Alice $500 and Bob $300"
        ↓
Agent executes USDC transfers on Solana (400ms, ~$0.00025/tx)
        ↓
Workers claim a SilkPay virtual Mastercard via x402 payment flow
        ↓
Spend anywhere Mastercard is accepted — online and in-store across CIS
```

---

## Demo

| Employer dashboard | Worker portal |
|---|---|
| Chat with the payroll agent | Claim SilkPay virtual Mastercard |
| Check treasury balance + live T-bill yield | x402 fee payment shown in real time |
| Pay multiple workers in one message | Card issued instantly after payment proof |

**Live demo:** `http://localhost:3000`

---

## Architecture

```
silkflow/
├── app/
│   ├── page.tsx              # Employer chat UI
│   ├── worker/page.tsx       # Worker claim portal
│   └── api/
│       ├── agent/route.ts    # Scripted payroll agent
│       ├── balance/route.ts  # USDC balance check
│       └── card/route.ts     # x402 virtual card issuance
├── lib/
│   └── solana.ts             # USDC transfer + balance (web3.js + spl-token)
└── scripts/
    └── setup-devnet.ts       # One-time devnet token mint + treasury funding
```

### Tech stack

| Layer | Technology |
|---|---|
| Chain | Solana (devnet / mainnet) |
| Stablecoin | USDC (SPL token, 6 decimals) |
| Treasury yield | sUSD — Solayer T-bill-backed stablecoin (~4.85% APY) |
| Payment protocol | x402 (HTTP 402 Payment Required) for card issuance fee |
| Offramp | SilkPay virtual Mastercard |
| Frontend | Next.js 16, TypeScript, Tailwind CSS |
| Solana SDK | `@solana/web3.js` + `@solana/spl-token` |

---

## Why x402

The worker card issuance endpoint (`/api/card`) implements the [x402 protocol](https://x402.org):

1. Worker hits `/api/card` — server returns `HTTP 402 Payment Required` with USDC amount and recipient
2. Agent pays the issuance fee autonomously (no login, no API key, no human step)
3. Worker retries with payment proof — server returns the virtual card

This demonstrates autonomous agentic payments: the agent reasons about cost, pays from its wallet, and unlocks access — all in one flow. Exactly the "AI-powered financial automation" use case.

---

## SilkPay integration

SilkPay is a Mastercard-principal virtual card issuer operating across Kazakhstan, UAE, Turkey, and Sudan — exactly the CIS markets SilkFlow targets.

In production, `/api/card` calls SilkPay's card issuance API directly. The x402 fee covers the issuance cost, deducted from the worker's USDC balance before the card is topped up. This makes SilkFlow a direct distribution channel for SilkPay cards — every payroll run issues new SilkPay cards to workers who don't have them.

---

## Getting started

### Prerequisites

- Node.js 18+
- Solana CLI (`sh -c "$(curl -sSfL https://release.solana.com/stable/install)"`)

### Install

```bash
git clone https://github.com/your-handle/silkflow
cd silkflow
npm install
```

### Configure

Create `.env.local`:

```env
# Solana devnet USDC mint (or your own from setup script)
USDC_MINT=4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU

# Treasury wallet (holds payroll funds)
TREASURY_PRIVATE_KEY=your_bs58_encoded_private_key
NEXT_PUBLIC_TREASURY_ADDRESS=your_treasury_public_key

# Worker wallets
NEXT_PUBLIC_WORKER1=worker_1_public_key
NEXT_PUBLIC_WORKER2=worker_2_public_key
NEXT_PUBLIC_WORKER3=worker_3_public_key

# Set to true for demo without real Solana transactions
MOCK_MODE=true
```

Generate wallets:

```bash
node -e "
const { Keypair } = require('@solana/web3.js');
const bs58 = require('bs58');
const k = Keypair.generate();
console.log('pub:', k.publicKey.toBase58());
console.log('priv:', bs58.default.encode(k.secretKey));
"
```

### Fund treasury on devnet

```bash
# Airdrop SOL for fees
solana airdrop 2 YOUR_TREASURY_ADDRESS --url devnet

# Create mock USDC mint and fund treasury with 10,000 USDC
npm run setup:devnet
```

### Run

```bash
npm run dev
```

Open `http://localhost:3000`

---

## Try it

**As an employer (`/`):**
- "Check treasury balance"
- "Show yield info"
- "Pay Alice $500 and Bob $300"

**As a worker (`/worker`):**
- Select your name
- Watch the x402 fee payment flow in real time
- Receive your SilkPay virtual Mastercard

---

## Roadmap

- [ ] Real SilkPay card issuance API integration
- [ ] sUSD / cUSDO yield deposit on employer funding
- [ ] Recurring payroll schedule (cron-triggered agent)
- [ ] Multi-sig treasury approval for large payrolls
- [ ] On-chain payroll contract (Anchor) for trustless execution
- [ ] Worker KYC via SilkPay identity layer
- [ ] Mobile-first worker UI with wallet connect

---

## Team

Built solo at the Superteam KZ × S1lkPay Frontier Hackathon.

---

## License

MIT
