'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { sdk } from '@farcaster/miniapp-sdk';

export default function Dashboard() {
  const router = useRouter();
  const [fid, setFid] = useState<number | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const isMiniApp = await sdk.isInMiniApp();
        if (!isMiniApp) {
          alert('Please open in a Farcaster Mini App');
          return;
        }

        const context = await sdk.context;
        setFid(context.user?.fid || null);
      } catch (err) {
        console.error('Mini App context failed:', err);
      }
    };

    init();
  }, []);

  const goTo = (path: string) => {
    if (!fid) {
      alert('Missing user data, cannot continue.');
      return;
    }

    // Pass fid via URL or persist it
    router.push(`${path}?fid=${fid}`);
  };

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center space-y-6 p-6">
      <h1 className="text-3xl font-bold text-amber-300">Bienvenido 🔓</h1>

      <button
        className="bg-green-600 px-6 py-3 rounded-lg font-bold hover:bg-green-700"
        onClick={() => goTo('/create')}
      >
        🎨 Create
      </button>

      <button
        className="bg-purple-600 px-6 py-3 rounded-lg font-bold hover:bg-purple-700"
        onClick={() => goTo('/music')}
      >
        🎵 Play
      </button>
    </main>
  );
}
