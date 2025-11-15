import { createClient } from '@farcaster/quick-auth'
import { NextRequest, NextResponse } from 'next/server'
import { base } from 'viem/chains'
import { createPublicClient, http, parseAbi } from 'viem'
import { getFarcasterUser } from '@/app/lib/getFarcasterUser'

const quickAuthClient = createClient()

const DOMAIN = process.env.APP_DOMAIN!
const ORIGIN_CONTRACT = '0x45737f6950f5c9e9475e9e045c7a89b565fa3648'

const publicClient = createPublicClient({
  chain: base,
  transport: http(process.env.RPC_URL!), // e.g. Alchemy or Infura
})

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer '))
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const token = authHeader.split(' ')[1]

  try {
    // ✅ 1. Verify the QuickAuth JWT
    const payload = await quickAuthClient.verifyJwt({ token, domain: DOMAIN })
    const fid = Number(payload.sub)

    // ✅ 2. Get user info (custody address) from Neynar by FID
    const userRes = await fetch(`https://api.neynar.com/v2/farcaster/user/bulk?fids=${fid}`, {
      headers: { 'x-api-key': process.env.NEYNAR_API_KEY! },
    })

    if (!userRes.ok) {
      console.error('Neynar user lookup failed', userRes.status)
      return NextResponse.json({ error: 'Neynar lookup failed' }, { status: 500 })
    }

    const userData = await userRes.json()
    const address = userData?.users?.[0]?.custody_address as `0x${string}`

    if (!address) {
      return NextResponse.json({ error: 'Custody address not found' }, { status: 400 })
    }

    // ✅ 3. Check NFT ownership on-chain
    const balance = await publicClient.readContract({
      address: ORIGIN_CONTRACT,
      abi: parseAbi(['function balanceOf(address) view returns (uint256)']),
      functionName: 'balanceOf',
      args: [address],
    })

    const ownsNFT = BigInt(balance) > 0n

    return NextResponse.json({ verified: ownsNFT, fid, address })
  } catch (err) {
    console.error('🔴 NFT check failed:', err)
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 })
  }
}
