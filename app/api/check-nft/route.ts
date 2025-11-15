import { createClient } from '@farcaster/quick-auth'
import { NextRequest, NextResponse } from 'next/server'
import { base } from 'viem/chains'
import { createPublicClient, http, parseAbi } from 'viem'
import { getFarcasterUser } from '@/app/lib/getFarcasterUser' // ✅ import only

const quickAuthClient = createClient()

const DOMAIN = process.env.APP_DOMAIN!
const ORIGIN_CONTRACT = '0x45737f6950f5c9e9475e9e045c7a89b565fa3648'

const publicClient = createPublicClient({
  chain: base,
  transport: http(process.env.RPC_URL!),
})

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const token = authHeader.split(' ')[1]

  try {
    // ✅ 1. Verify Farcaster QuickAuth JWT
    const payload = await quickAuthClient.verifyJwt({ token, domain: DOMAIN })
    const fid = Number(payload.sub)

    // ✅ 2. Get custody address from Neynar via FID
    const userRes = await fetch(
      `https://api.neynar.com/v2/farcaster/user/bulk?fids=${fid}`,
      {
        headers: { 'x-api-key': process.env.NEYNAR_API_KEY! },
        cache: 'no-store',
      }
    )

    if (!userRes.ok) throw new Error(`Neynar FID lookup failed: ${userRes.status}`)
    const userData = await userRes.json()
    const address = userData?.users?.[0]?.custody_address as `0x${string}`

    if (!address) {
      return NextResponse.json({ error: 'Custody address not found' }, { status: 400 })
    }

    // ✅ 3. Lookup Farcaster user by custody address
    const user = await getFarcasterUser(address)

    // ✅ 4. Verify NFT ownership on Origin contract
    const balance = await publicClient.readContract({
      address: ORIGIN_CONTRACT,
      abi: parseAbi(['function balanceOf(address) view returns (uint256)']),
      functionName: 'balanceOf',
      args: [address],
    })

    const ownsNFT = BigInt(balance) > 0n

    // ✅ 5. Return verified result
    return NextResponse.json({
      verified: ownsNFT,
      fid,
      address,
      username: user?.username ?? null,
    })
  } catch (err) {
    console.error('🔴 NFT check failed:', err)
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 })
  }
}
