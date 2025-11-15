import { createClient } from '@farcaster/quick-auth';
import { NextRequest, NextResponse } from 'next/server';
import { base } from 'viem/chains';
import { createPublicClient, http, parseAbi } from 'viem';

const quickAuthClient = createClient();

const DOMAIN = process.env.APP_DOMAIN!;
const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY!;
const ORIGIN_CONTRACT = '0x45737f6950f5c9e9475e9e045c7a89b565fa3648';

const publicClient = createPublicClient({
  chain: base,
  transport: http(process.env.RPC_URL!), // Alchemy / Infura RPC URL
});

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('Authorization');

  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = authHeader.split(' ')[1];

  try {
    // ✅ Step 1: Verify JWT and get FID
    const payload = await quickAuthClient.verifyJwt({ token, domain: DOMAIN });
    const fid = Number(payload.sub);

    // ✅ Step 2: Lookup custody address via Neynar
    const userRes = await fetch(`https://api.neynar.com/v2/fid/${fid}`, {
      headers: { 'api_key': NEYNAR_API_KEY },
    });

    const userJson = await userRes.json();
    const address = userJson?.result?.user?.custody_address as `0x${string}`;

    if (!address) {
      return NextResponse.json({ error: 'No custody address found' }, { status: 400 });
    }

    // ✅ Step 3: Check NFT ownership
    const balance = await publicClient.readContract({
      address: ORIGIN_CONTRACT,
      abi: parseAbi(['function balanceOf(address) view returns (uint256)']),
      functionName: 'balanceOf',
      args: [address],
    });

    const ownsNFT = BigInt(balance) > 0n;

    return NextResponse.json({ ownsNFT, address });
  } catch (err) {
    console.error('🔴 Token or NFT check failed:', err);
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}
