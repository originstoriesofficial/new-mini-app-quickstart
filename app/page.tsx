'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { sdk } from '@farcaster/miniapp-sdk';

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    sdk.actions.ready(); // ✅ splash screen will hide only after app is mounted
  }, []);

  const handleEntrar = async () => {
    setError('');
    setLoading(true);

    try {
      const { token } = await sdk.quickAuth.getToken();

      // ✅ NFT ownership check — temporarily disabled
      /*
      const response = await sdk.quickAuth.fetch('/api/check-nft', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const { ownsNFT } = await response.json();

      if (!ownsNFT) {
        setError("❌ Sorry you don’t own any OriginStory. Grab some ⚡️ and try again.");
        return;
      }
      */

      router.push('/dashboard');
    } catch (err) {
      console.error(err);
      setError('Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center space-y-6 p-6">
      <h1 className="text-4xl font-bold text-amber-400">⚡️ La Monjería</h1>

      <button
        onClick={handleEntrar}
        className="bg-amber-600 px-6 py-3 rounded-lg text-lg font-bold hover:bg-amber-700 transition"
        disabled={loading}
      >
        {loading ? 'Checking...' : 'Entrar'}
      </button>

      {error && <p className="text-red-500 text-center">{error}</p>}
    </main>
  );
}
