
'use client';

import { useState } from 'react';
import { useAccount, useWalletClient } from 'wagmi';
import axios from 'axios';
import { parseEther, encodeFunctionData } from 'viem';
import { MintContractABI } from '../lib/abi/mintContract';
import { CONTRACTS } from '../lib/contracts';

export default function CreatePage() {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();

  const [animal, setAnimal] = useState('');
  const [cape, setCape] = useState('');
  const [hand, setHand] = useState('');
  const [image, setImage] = useState('');
  const [loading, setLoading] = useState(false);
  const [minting, setMinting] = useState(false);
  const [tries, setTries] = useState(0);

  /** ───────────── Generate Monk Image ───────────── */
  const handleGenerate = async () => {
    if (tries >= 3) {
      alert('Has alcanzado el límite de 3 generaciones / You reached 3 attempts.');
      return;
    }

    try {
      setLoading(true);
      const res = await axios.post('/api/generate-image', {
        animalType: animal,
        capeColor: cape,
        attribute: hand,
      });
      setImage(res.data.imageUrl);
      setTries((t) => t + 1);
    } catch (err) {
      console.error('Error generating monk:', err);
      alert('Error generating image.');
    } finally {
      setLoading(false);
    }
  };

  /** ───────────── Mint NFT ───────────── */
  const handleMint = async () => {
    if (!address || !walletClient) return alert('Connect wallet first');
    if (!image) return alert('Generate your monk first');

    try {
      setMinting(true);

      // 1️⃣ Check NFT tier / price
      const res = await axios.post('/api/check-nft', { address });
      const { price } = res.data;

      const mintPrice = parseEther(price.toString());

      // 2️⃣ Upload metadata to IPFS
      const upload = await axios.post('/api/upload-ipfs', {
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
      });

      const tokenURI = upload.data.ipfsUrl;

      // 3️⃣ Encode mint() call
      const data = encodeFunctionData({
        abi: MintContractABI,
        functionName: 'mint',
        args: [tokenURI, BigInt(1)], // ✅ FIX: BigInt instead of number
      });

      // 4️⃣ Send transaction
      const txHash = await walletClient.sendTransaction({
        to: CONTRACTS.mintContract as `0x${string}`,
        value: mintPrice,
        data,
      });

      alert(`✅ Minted! TX Hash: ${txHash}`);
      window.location.href = '/success';
    } catch (err) {
      console.error('Minting failed:', err);
      alert('Minting failed. Try again.');
    } finally {
      setMinting(false);
    }
  };

  /** ───────────── UI ───────────── */
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
      <div className="w-full max-w-xl space-y-6 bg-zinc-900 border border-amber-600 p-8 rounded-xl shadow-lg">
        <h1 className="text-3xl font-bold text-center text-amber-300">
          🧘‍♂️ Crea Tu Monje / Create Your Monk
        </h1>

        <div className="space-y-4">
          <Input
            label="Animal"
            value={animal}
            setValue={setAnimal}
            placeholder="¿Qué tipo de animal? / What type of animal?"
          />
          <Input
            label="Capa"
            value={cape}
            setValue={setCape}
            placeholder="Color o diseño de capa / Cape color or design"
          />
          <Input
            label="Atributo"
            value={hand}
            setValue={setHand}
            placeholder="¿Qué sostiene en la mano? / What are they holding?"
          />
        </div>

        <button
          onClick={handleGenerate}
          disabled={loading || tries >= 3}
          className="w-full py-4 text-lg bg-amber-600 text-white font-bold rounded-lg hover:bg-amber-700 transition disabled:opacity-50"
        >
          {loading
            ? 'Creando... / Creating...'
            : `✨ Generar Monje (${3 - tries} intentos) ✨`}
        </button>

        {image && (
          <div className="mt-6 text-center space-y-4">
            <img
              src={image}
              alt="Generated Monk"
              className="w-full rounded-lg shadow-lg"
            />
            <button
              onClick={handleMint}
              disabled={minting}
              className="w-full py-4 text-lg bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition disabled:opacity-50"
            >
              {minting ? 'Minting...' : '🪙 Mint Monk'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/** Small reusable input */
function Input({
  label,
  value,
  setValue,
  placeholder,
}: {
  label: string;
  value: string;
  setValue: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div>
      <label className="block text-lg font-semibold text-amber-400 mb-1">
        {label}
      </label>
      <input
        className="w-full bg-zinc-800 text-white p-4 rounded-lg border border-zinc-700 placeholder-zinc-400"
        placeholder={placeholder}
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
    </div>
  );
}
