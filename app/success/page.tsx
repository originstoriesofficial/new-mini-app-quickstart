// app/success/page.tsx
import type { Metadata } from "next";
import Image from "next/image";

export const dynamic = "force-static";

// ✅ dynamically build Open Graph / Farcaster embed
export async function generateMetadata(): Promise<Metadata> {
  const imageUrl = "https://basemonks.vercel.app/og.png"; // fallback
  return {
    title: "Monk Minted!",
    description: "Your Monk is now live on Base 🧘‍♂️",
    other: {
      "fc:miniapp": JSON.stringify({
        version: "next",
        imageUrl,
        button: {
          title: "View My Monk",
          action: {
            type: "launch_frame",
            url: "https://basemonks.vercel.app/create",
            name: "Basemonks",
            splashImageUrl: "https://basemonks.vercel.app/icon.png",
            splashBackgroundColor: "#000000",
          },
        },
      }),
    },
    openGraph: {
      title: "Basemonks — Mint Complete",
      description: "Your monk has been minted successfully.",
      images: [imageUrl],
    },
  };
}

export default function SuccessPage() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-4">
      <h1 className="text-4xl font-bold mb-4 text-amber-400">
        🧘‍♂️ Mint Successful!
      </h1>
      <p className="text-gray-400 mb-6 text-center">
        Your monk is live on Base. Share it with your friends below.
      </p>

      <Image
        src="/og.png"
        alt="Minted Monk"
        width={400}
        height={400}
        className="rounded-xl shadow-lg border border-amber-600"
      />

      <a
        href="https://warpcast.com/~/compose?text=Just%20minted%20my%20Monk%20on%20Base%20🧘‍♂️%20%23Basemonks&embeds[]=https%3A%2F%2Fbasemonks.vercel.app%2Fsuccess"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-6 bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 px-6 rounded-lg transition"
      >
        🔗 Share on Farcaster
      </a>

      <a
        href="/create"
        className="mt-4 text-sm text-gray-400 underline hover:text-gray-200"
      >
        Create another monk →
      </a>
    </div>
  );
}
