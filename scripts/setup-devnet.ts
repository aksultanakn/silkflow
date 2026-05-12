/**
 * Setup script: creates a mock USDC mint on devnet and funds the treasury.
 * Run once: npx ts-node scripts/setup-devnet.ts
 */
import { Connection, PublicKey, Keypair, LAMPORTS_PER_SOL } from '@solana/web3.js'
import { createMint, getOrCreateAssociatedTokenAccount, mintTo } from '@solana/spl-token'
import bs58 from 'bs58'
import * as fs from 'fs'
import { fileURLToPath } from 'url'
import * as path from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const DEVNET_RPC = 'https://api.devnet.solana.com'
const ENV_PATH = path.join(__dirname, '../.env.local')

async function main() {
  const connection = new Connection(DEVNET_RPC, 'confirmed')

  // Load treasury keypair
  const envContent = fs.readFileSync(ENV_PATH, 'utf8')
  const privKeyMatch = envContent.match(/TREASURY_PRIVATE_KEY=(.+)/)
  if (!privKeyMatch) throw new Error('TREASURY_PRIVATE_KEY not found in .env.local')
  const treasury = Keypair.fromSecretKey(bs58.decode(privKeyMatch[1].trim()))

  console.log('Treasury:', treasury.publicKey.toBase58())

  // Airdrop SOL for fees
  console.log('Airdropping 2 SOL...')
  try {
    const sig = await connection.requestAirdrop(treasury.publicKey, 2 * LAMPORTS_PER_SOL)
    await connection.confirmTransaction(sig)
    console.log('✓ SOL airdrop confirmed')
  } catch (e) {
    console.warn('Airdrop failed (rate limit?) - checking existing balance...')
    const bal = await connection.getBalance(treasury.publicKey)
    if (bal < 0.1 * LAMPORTS_PER_SOL) {
      throw new Error('Insufficient SOL. Visit https://faucet.solana.com and airdrop to: ' + treasury.publicKey.toBase58())
    }
    console.log('Existing balance:', bal / LAMPORTS_PER_SOL, 'SOL — proceeding')
  }

  // Create mock USDC mint (6 decimals, treasury is mint authority)
  console.log('Creating mock USDC mint...')
  const mint = await createMint(
    connection,
    treasury,
    treasury.publicKey, // mint authority
    treasury.publicKey, // freeze authority
    6                   // 6 decimals like real USDC
  )
  console.log('✓ Mint:', mint.toBase58())

  // Create ATA for treasury and mint 10,000 USDC
  const treasuryATA = await getOrCreateAssociatedTokenAccount(
    connection, treasury, mint, treasury.publicKey
  )
  await mintTo(connection, treasury, mint, treasuryATA.address, treasury, 10_000 * 1e6)
  console.log('✓ Minted 10,000 mock USDC to treasury')

  // Update .env.local with new mint address
  const updated = envContent.replace(/USDC_MINT=.+/, `USDC_MINT=${mint.toBase58()}`)
  fs.writeFileSync(ENV_PATH, updated)
  console.log('✓ Updated .env.local USDC_MINT =', mint.toBase58())
  console.log('\nAll done! Run: npm run dev')
}

main().catch(console.error)
