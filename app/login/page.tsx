'use client'
import { useState } from 'react'
import { sdk } from '@farcaster/miniapp-sdk'

export default function LoginPage() {
  const [fid, setFid] = useState<number | null>(null)
  const [token, setToken] = useState<string | null>(null)

  async function signIn() {
    try {
      const { token } = await sdk.quickAuth.getToken()
      setToken(token)

      const res = await sdk.quickAuth.fetch('/api/auth', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      setFid(data.fid)
    } catch (err) {
      console.error('Auth failed', err)
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <button
          onClick={signIn}
          className="bg-amber-600 px-6 py-3 rounded text-white text-lg"
        >
          Authenticate with Farcaster
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center flex-col text-center">
      <p className="text-amber-400 text-xl">
        ✅ Authenticated as FID: {fid}
      </p>
      <a href="/create" className="mt-6 underline text-white">
        Go Create Your Monk →
      </a>
    </div>
  )
}
