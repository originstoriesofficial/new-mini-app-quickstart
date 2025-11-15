'use client'

import { useState } from 'react'
import { sdk } from '@farcaster/miniapp-sdk'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [fid, setFid] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const router = useRouter()

  const signIn = async () => {
    setLoading(true)
    setError(null)

    try {
      const { token } = await sdk.quickAuth.getToken()

      const res = await sdk.quickAuth.fetch('/api/auth', {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!res.ok) {
        throw new Error('Failed to verify token with backend')
      }

      const data = await res.json()
      setFid(data.fid)

      // Optional: redirect after auth
      setTimeout(() => {
        router.push('/create')
      }, 1000)
    } catch (err) {
      console.error('Auth failed:', err)
      setError('❌ Authentication failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white px-4">
      <div className="max-w-md w-full space-y-6 text-center">
        {!fid ? (
          <>
            <h1 className="text-2xl font-semibold text-amber-400">Login with Farcaster</h1>

            <button
              onClick={signIn}
              disabled={loading}
              className="w-full py-3 bg-amber-600 hover:bg-amber-700 rounded-lg text-lg font-bold disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Authenticate with Farcaster'}
            </button>

            {error && <p className="text-red-500 text-sm">{error}</p>}
          </>
        ) : (
          <>
            <p className="text-xl text-green-400">✅ Authenticated as FID: {fid}</p>
            <p className="text-sm text-zinc-400">Redirecting to creation...</p>
          </>
        )}
      </div>
    </div>
  )
}
