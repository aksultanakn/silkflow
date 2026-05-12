import { Connection, PublicKey, Keypair } from '@solana/web3.js'
import {
  getOrCreateAssociatedTokenAccount,
  transfer,
  getAccount,
} from '@solana/spl-token'
import bs58 from 'bs58'

// Lazy init — never evaluated at build time, only at request time
function getConnection() {
  return new Connection('https://api.devnet.solana.com', 'confirmed')
}

function getUSDCMint() {
  return new PublicKey(process.env.USDC_MINT!)
}

export function getTreasuryKeypair(): Keypair {
  return Keypair.fromSecretKey(bs58.decode(process.env.TREASURY_PRIVATE_KEY!))
}

export async function getUSDCBalance(walletAddress: string): Promise<number> {
  try {
    const connection = getConnection()
    const mint = getUSDCMint()
    const pubkey = new PublicKey(walletAddress)
    const payer = getTreasuryKeypair()
    const ata = await getOrCreateAssociatedTokenAccount(connection, payer, mint, pubkey)
    const account = await getAccount(connection, ata.address)
    return Number(account.amount) / 1e6
  } catch {
    return 0
  }
}

export async function sendUSDC(toAddress: string, amount: number): Promise<string> {
  const connection = getConnection()
  const mint = getUSDCMint()
  const payer = getTreasuryKeypair()
  const toPubkey = new PublicKey(toAddress)

  const fromATA = await getOrCreateAssociatedTokenAccount(connection, payer, mint, payer.publicKey)
  const toATA = await getOrCreateAssociatedTokenAccount(connection, payer, mint, toPubkey)

  const sig = await transfer(
    connection,
    payer,
    fromATA.address,
    toATA.address,
    payer,
    BigInt(Math.round(amount * 1e6))
  )
  return sig
}
