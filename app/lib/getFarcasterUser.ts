export async function getFarcasterUser(address: string) {
    if (!address) throw new Error('Missing address');
  
    const res = await fetch(
      `https://api.neynar.com/v2/farcaster/user-by-custody-address?address=${address}`,
      {
        headers: {
          'x-api-key': process.env.NEYNAR_API_KEY!,
        },
        next: { revalidate: 0 },
      }
    );
  
    if (!res.ok) {
      console.error('Neynar lookup failed', res.status, await res.text());
      throw new Error(`Neynar returned ${res.status}`);
    }
  
    const data = await res.json();
    return data?.result?.user;
  }
  