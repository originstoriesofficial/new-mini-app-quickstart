'use client'

import { useState } from 'react'
import { useAccount, useBalance, useWalletClient } from 'wagmi'
import axios from 'axios'
import { ethers } from 'ethers'
import { CONTRACTS } from "../../../lib/contracts"

export default function CreatePage() {
  const { address } = useAccount()
  const { data: walletClient } = useWalletClient()
  const [animal, setAnimal] = useState('')
  const [cape, setCape] = useState('')
  const [hand, setHand] = useState('')
  const [image, setImage] = useState('')
  const [loading, setLoading] = useState(false)
  const [tries, setTries] = useState(0)
  const [minting, setMinting] = useState(false)

  // ---- GENERATION ----
  async function handleGenerate() {
    if (tries >= 3) {
      alert('Has alcanzado el límite de 3 generaciones / You reached 3 attempts.')
      return
    }

    try {
      setLoading(true)
      const res = await axios.post(
        '/api/generate-image',
        {
          animalType: animal,
          capeColor: cape,
          jewels: hand,
          attribute: 'sabiduría', // wisdom in Spanish
        }
      )
      setImage(res.data.imageUrl)
      setTries(tries + 1)
    } catch (err) {
      console.error('Error generating monk:', err)
    } finally {
      setLoading(false)
    }
  }

  // ---- NFT MINT ----
  async function handleMint() {
    if (!address || !walletClient) {
      alert('Connect wallet first')
      return
    }
    if (!image) {
      alert('Generate your monk first')
      return
    }

    setMinting(true)
    try {
      // Step 1: Check NFT ownership + price
      const res = await axios.post('/api/check-nft', { address })
      const { tier } = res.data
      let mintPrice = ethers.parseEther('0.002')

      if (tier === 'holder') mintPrice = ethers.parseEther('0')
      if (tier === 'discount') mintPrice = ethers.parseEther('0.001')

      // Step 2: Upload to IPFS
      const uploadRes = await axios.post('/api/upload-ipfs', {
        image,
        metadata: {
          name: `Monk of ${animal}`,
          description: `A ${animal} monk wearing a ${cape} cape and holding ${hand}.`,
          attributes: [
            { trait_type: 'Animal', value: animal },
            { trait_type: 'Cape', value: cape },
            { trait_type: 'Hand', value: hand },
          ],
        },
      })

      const tokenURI = uploadRes.data.ipfsUrl

      // Step 3: Call mint on your collection contract
      const tx = await walletClient.sendTransaction({
        to: CONTRACTS.mintContract, // defined in lib/contracts.ts
        value: mintPrice,
        data: '0x', // replace with encoded mint call if using ABI
      })
      console.log('Mint Tx:', tx)
      alert(`Minted! TX: ${tx}`)

      // Step 4: Redirect to success page
      window.location.href = '/success'
    } catch (err) {
      console.error('Minting failed:', err)
      alert('Minting failed. Try again.')
    } finally {
      setMinting(false)
    }
  }

  return (
    <div className="max-w-md mx-auto p-8 text-center">
      <h1 className="text-3xl font-bold mb-4">🧘‍♂️ Crea Tu Monje / Create Your Monk</h1>

      <div className="space-y-3">
        <input
          placeholder="¿Qué tipo de animal? / What type of animal?"
          className="w-full border rounded-md p-2"
          value={animal}
          onChange={(e) => setAnimal(e.target.value)}
        />
        <input
          placeholder="Color o diseño de capa / Cape color or design"
          className="w-full border rounded-md p-2"
          value={cape}
          onChange={(e) => setCape(e.target.value)}
        />
        <input
          placeholder="¿Qué sostiene en la mano? / What are they holding?"
          className="w-full border rounded-md p-2"
          value={hand}
          onChange={(e) => setHand(e.target.value)}
        />
      </div>

      <button
        onClick={handleGenerate}
        disabled={loading || tries >= 3}
        className="mt-4 px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 disabled:opacity-50"
      >
        {loading
          ? 'Creando... / Creating...'
          : `✨ Generar Monje / Generate Monk (${3 - tries} left) ✨`}
      </button>

      {image && (
        <div className="mt-6">
          <img src={image} alt="Generated Monk" className="rounded-md shadow-md mx-auto" />
          <button
            onClick={handleMint}
            disabled={minting}
            className="mt-4 px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 disabled:opacity-50"
          >
            {minting ? 'Minting...' : '🪙 Mint Monk'}
          </button>
        </div>
      )}
    </div>
  )
}
