'use client'

import React, { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { ConnectButton } from '@rainbow-me/rainbowkit'

const styles = [
  'Electronic', 'Hip-Hop', 'Trap', 'Lo-fi', 'Jazz', 'Ambient',
  'Synthwave', 'Orchestral', 'Fantasy', 'Cyberpunk', 'Retro', 'Rock',
  'Funk', 'Drill', 'Dubstep', 'Techno', 'Industrial', 'Afrobeats',
  'Pop', 'Ballad', 'Hardstyle', 'Epic', 'Darkwave', 'R&B', 'Chillwave',
  'Glitch', 'Punk', 'EDM', 'Metal', 'Reggaeton', 'Acoustic', 'Minimal',
  'Experimental', 'Dream Pop', 'Gospel', 'Neo Soul', 'Boom Bap',
  'Future Bass', 'Trap Soul', 'Post-Rock', 'Shoegaze', 'Vaporwave',
  'Bossa Nova', 'Trance',
]

export default function MusicPage() {
  const { address, isConnected } = useAccount()
  const [access, setAccess] = useState<boolean | null>(null)
  const [checking, setChecking] = useState(false)

  const [prompt, setPrompt] = useState('')
  const [lyrics, setLyrics] = useState('')
  const [style, setStyle] = useState(styles[0])
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 🧿 Check NFT access when wallet connects
  useEffect(() => {
    if (!address) return
    const checkAccess = async () => {
      try {
        setChecking(true)
        const res = await fetch('/api/check-nft', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ address }),
        })
        const data = await res.json()
        setAccess(data.access || false)
      } catch (err) {
        console.error('Access check failed:', err)
        setAccess(false)
      } finally {
        setChecking(false)
      }
    }
    checkAccess()
  }, [address])

  // 🎵 Generate Music
  const generateSong = async () => {
    setLoading(true)
    setError(null)
    setAudioUrl(null)

    try {
      const fullPrompt = `${prompt} in the style of ${style}. ${lyrics ? 'Lyrics: ' + lyrics : ''}`
      const res = await fetch('/api/compose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: fullPrompt,
          music_length_ms: 60000,
          output_format: 'mp3_44100_128',
        }),
      })

      if (!res.ok) throw new Error('Failed to generate song')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      setAudioUrl(url)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      console.error('Error generating music:', msg)
      setError('Error generando música / Error generating music.')
    } finally {
      setLoading(false)
    }
  }

  // 🧱 Gating UI
  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-center">
        <h2 className="text-xl mb-4">🎧 Conecta tu wallet / Connect your wallet</h2>
        <ConnectButton />
      </div>
    )
  }

  if (checking) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh]">
        <p className="text-lg text-gray-300">🔍 Checking NFT ownership...</p>
      </div>
    )
  }

  if (access === false) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-center space-y-4">
        <h2 className="text-xl text-red-400 font-semibold">
          🚫 No tienes acceso / You don’t hold the required Monk NFT
        </h2>
        <p className="text-gray-400">Mint one first to unlock the music creation experience.</p>
        <a
          href="/create"
          className="mt-4 px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700 transition"
        >
          🪷 Go Mint a Monk
        </a>
      </div>
    )
  }

  // 🎶 Main Music Generator
  return (
    <div className="flex flex-col items-center justify-center p-6">
      <h1 className="text-3xl font-bold mb-4 text-amber-200">🎶 Crea tu Himno del Monje / Create Your Monk Anthem</h1>

      <div className="w-full max-w-2xl bg-black/80 p-6 rounded-lg text-amber-100 border border-amber-600 space-y-4">
        <label className="block text-sm text-amber-300 text-left">Lore / Historia del Monje</label>
        <textarea
          className="w-full p-3 bg-gray-900 rounded"
          rows={3}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe la leyenda de tu monje / Describe your monk's story..."
        />

        <label className="block text-sm text-amber-300 text-left mt-2">Letra opcional / Optional lyrics</label>
        <textarea
          className="w-full p-3 bg-gray-900 rounded"
          rows={2}
          value={lyrics}
          onChange={(e) => setLyrics(e.target.value)}
          placeholder="Añade letra si quieres / Add lyrics if you'd like..."
        />

        <label className="block text-sm text-amber-300 text-left mt-2">Estilo Musical / Music Style</label>
        <select
          className="w-full p-3 bg-gray-900 rounded"
          value={style}
          onChange={(e) => setStyle(e.target.value)}
        >
          {styles.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <button
          onClick={generateSong}
          disabled={loading || !prompt}
          className="w-full mt-4 py-3 bg-amber-600 text-white rounded hover:bg-amber-700 transition disabled:opacity-50"
        >
          {loading ? '🎧 Generando Himno...' : '🎼 Crear Himno del Monje'}
        </button>

        {error && <p className="text-red-400 text-center mt-3">{error}</p>}

        {audioUrl && (
          <div className="mt-4 text-center">
            <audio controls src={audioUrl} className="w-full rounded-lg" />
            <a
              href={audioUrl}
              download={`monk-anthem-${Date.now()}.mp3`}
              className="mt-3 inline-block px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700"
            >
              ⬇️ Descargar Himno / Download Anthem
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
