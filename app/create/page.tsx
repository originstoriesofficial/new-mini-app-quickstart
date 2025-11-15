'use client'

import { useState } from 'react'
import axios from 'axios'
import { parseEther } from 'viem'
import { useAccount } from 'wagmi'
import { useWriteContract } from 'wagmi'
import { wagmiConfig } from '../lib/wagmi'
import ComposeCastButton from '../components/ComposeCastButton'
import { MONKERIA_ABI } from '../lib/abi/monkeria'
import Image from 'next/image'

const MONKERIA_ADDRESS = '0x3D1E34Aa63d26f7b1307b96a612a40e5F8297AC7'

export default function CreatePage() {
  const { address, isConnected } = useAccount()

  const [animal, setAnimal] = useState('')
  const [cape, setCape] = useState('')
  const [hand, setHand] = useState('')
  const [image, setImage] = useState('')
  const [loading, setLoading] = useState(false)
  const [minting, setMinting] = useState(false)
  const [tries, setTries] = useState(0)

  const handleGenerate = async () => {
    if (tries >= 3) {
      alert('Has alcanzado el límite de 3 generaciones / You reached 3 attempts.')
      return
    }

    try {
      setLoading(true)
      const res = await axios.post('/api/generate-image', {
        animalType: animal,
        capeColor: cape,
        attribute: hand,
      })

      const imageUrl = res.data?.imageUrl
      if (!imageUrl) throw new Error('No image URL returned')

      setImage(imageUrl)
      setTries((prev) => prev + 1)
    } catch (err) {
      console.error('Generation error:', err)
      alert('❌ Error generating image. Try again.')
    } finally {
      setLoading(false)
    }
  }

  const { writeContractAsync } = useWriteContract()

  const handleMint = async () => {
    if (!image || !isConnected || !address) {
      alert('Wallet not connected or image missing.')
      return
    }
  
    setMinting(true)
  
    try {
      await writeContractAsync({
        address: MONKERIA_ADDRESS,
        abi: MONKERIA_ABI,
        functionName: 'mint',
        account: address,
        value: parseEther('0'),
        args: [image, 1],
      })
  
      alert('✅ Mint successful!')
    } catch (err) {
      console.error('Mint error:', err)
      alert('❌ Mint failed. Try again.')
    } finally {
      setMinting(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
      <div className="w-full max-w-xl space-y-6 bg-zinc-900 border border-amber-600 p-8 rounded-xl shadow-lg">
        <h1 className="text-3xl font-bold text-center text-amber-300">🧘‍♂️ Crea Tu Monje</h1>

        <div className="space-y-4">
          <Input label="Animal" value={animal} setValue={setAnimal} placeholder="¿Qué tipo de animal?" />
          <Input label="Capa" value={cape} setValue={setCape} placeholder="Color de capa" />
          <Input label="Atributo" value={hand} setValue={setHand} placeholder="¿Qué sostiene?" />
        </div>

        <button
          onClick={handleGenerate}
          disabled={loading || tries >= 3}
          className="w-full py-4 text-lg bg-amber-600 text-white font-bold rounded-lg hover:bg-amber-700 transition disabled:opacity-50"
        >
          {loading ? 'Creando...' : `✨ Generar Monje (${3 - tries} intentos) ✨`}
        </button>

        {image && (
          <div className="mt-6 text-center space-y-4">
            <Image
              src={image}
              alt="Generated Monk"
              width={512}
              height={512}
              className="w-full rounded-lg shadow-lg"
            />

            <button
              onClick={handleMint}
              disabled={minting}
              className="w-full py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700"
            >
              {minting ? 'Minting...' : '🪙 Mint on Base'}
            </button>

            <ComposeCastButton imageUrl={image} />
          </div>
        )}
      </div>
    </div>
  )
}

function Input({
  label,
  value,
  setValue,
  placeholder,
}: {
  label: string
  value: string
  setValue: (v: string) => void
  placeholder: string
}) {
  return (
    <div>
      <label className="block text-lg font-semibold text-amber-400 mb-1">{label}</label>
      <input
        className="w-full bg-zinc-800 text-white p-4 rounded-lg border border-zinc-700 placeholder-zinc-400"
        placeholder={placeholder}
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
    </div>
  )
}
