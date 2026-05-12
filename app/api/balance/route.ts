export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getUSDCBalance } from '@/lib/solana'

export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get('address') ?? process.env.NEXT_PUBLIC_TREASURY_ADDRESS!
  const balance = await getUSDCBalance(address)
  return NextResponse.json({ balance })
}
