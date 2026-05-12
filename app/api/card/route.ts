export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const paid = req.nextUrl.searchParams.get('paid')

  // x402: first request without proof → 402 Payment Required
  if (!paid) {
    return NextResponse.json(
      {
        error: 'Payment required',
        x402: {
          version: '1.0',
          amount: '0.50',
          currency: 'USDC',
          network: 'solana-devnet',
          recipient: process.env.NEXT_PUBLIC_TREASURY_ADDRESS,
          description: 'SilkPay virtual Mastercard issuance fee',
          scheme: 'exact',
        },
      },
      { status: 402 }
    )
  }

  // x402: second request with payment proof → return card
  const last4 = String(Math.floor(1000 + Math.random() * 9000))
  return NextResponse.json({
    card: {
      number: `4242 4242 4242 ${last4}`,
      expiry: '12/28',
      cvv: '***',
      network: 'Mastercard',
      type: 'Virtual Prepaid',
      currency: 'USDC',
      issuedBy: 'SilkPay',
      poweredBy: 'Solana',
    },
  })
}
