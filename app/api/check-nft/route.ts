import { createClient } from '@farcaster/quick-auth';
import { NextRequest, NextResponse } from 'next/server';

const quickAuthClient = createClient();

const ORIGIN_CONTRACT = process.env.ORIGIN_CONTRACT!;
const DOMAIN = process.env.APP_DOMAIN!;
const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY!;
const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY!;

const ALCHEMY_URL = `https://base-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`;

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = authHeader.split(' ')[1];

  try {
    // 1. Verify Farcaster token → get FID
    const payload = await quickAuthClient.verifyJwt({ token, domain: DOMAIN });
    const fid = payload.sub;

    // 2. Fetch connected ETH addresses from Neynar
    const neynarRes = await fetch(`https://api.neynar.com/v2/fid/${fid}`, {
      headers: { 'api_key': NEYNAR_API_KEY },
    });

    if (!neynarRes.ok) throw new Error('Failed to fetch from Neynar');

    const { connected_addresses } = await neynarRes.json();
    const addresses: string[] = connected_addresses.eth_addresses;

    if (!addresses || addresses.length === 0) {
      return NextResponse.json({ tier: 'public' });
    }

    // 3. Check if any address holds OriginStory token
    const isHolder = await Promise.any(
      addresses.map(async (address) => {
        const alchemyRes = await fetch(ALCHEMY_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'alchemy_getTokenBalances',
            params: [address, [ORIGIN_CONTRACT]],
          }),
        });

        const json = await alchemyRes.json();
        const balance = json.result?.tokenBalances?.[0]?.tokenBalance;

        return balance && BigInt(balance) > 0n;
      })
    ).catch(() => false);

    return NextResponse.json({ tier: isHolder ? 'originHolder' : 'public', fid });
  } catch (err) {
    console.error('🔴 Token check failed:', err);
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}
