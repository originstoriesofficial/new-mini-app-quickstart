import { createClient } from '@farcaster/quick-auth';
import { NextRequest, NextResponse } from 'next/server';

const quickAuthClient = createClient();
const ORIGIN_CONTRACT = process.env.ORIGIN_CONTRACT!;
const DOMAIN = process.env.APP_DOMAIN!;

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = authHeader.split(' ')[1];

  try {
    // Step 1: Verify JWT and extract FID
    const payload = await quickAuthClient.verifyJwt({ token, domain: DOMAIN });
    const fid = payload.sub;

    // Step 2: Get wallets from Neynar
    const neynarRes = await fetch(`https://api.neynar.com/v2/fid/${fid}`, {
      headers: { 'api_key': process.env.NEYNAR_API_KEY! },
    });

    const { connected_addresses } = await neynarRes.json();
    const addresses = connected_addresses.eth_addresses;

    if (!addresses.length) {
      return NextResponse.json({ tier: 'public' });
    }

    // Step 3: Check each wallet with SimpleHash
    const checks = await Promise.all(addresses.map(async (address: string) => {
      const res = await fetch(
        `https://api.simplehash.com/api/v0/nfts/owners/${address}?contract_address=${ORIGIN_CONTRACT}`,
        {
          headers: { 'X-API-KEY': process.env.SIMPLEHASH_KEY! },
        }
      );
      const data = await res.json();
      return data.nfts?.length > 0;
    }));

    const isHolder = checks.includes(true);

    return NextResponse.json({ tier: isHolder ? 'originHolder' : 'public' });
  } catch (err) {
    console.error('NFT check error:', err);
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}
