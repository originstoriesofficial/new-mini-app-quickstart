import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@farcaster/quick-auth'
import { baseSepolia } from 'viem/chains'
import { createWalletClient, http, parseEther, encodeFunctionData, Address } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { MintContractABI } from '../lib/abi/mintContract'
import { CONTRACTS } from '../lib/contracts'

const domain = process.env.NEXT_PUBLIC_DOMAIN!
const client = createClient()
const serverAccount = privateKeyToAccount(process.env.PRIVATE_KEY as `0x${string}`) // ✅ fixed


// server wallet client (Base Sepolia)
const wallet = createWalletClient({
  account: serverAccount,
  chain: baseSepolia,
  transport: http(process.env.RPC_URL!),
})

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (!auth?.startsWith('Bearer '))
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const token = auth.split(' ')[1]
  const payload = await client.verifyJwt({ token, domain })
  const fid = payload.sub

  const { image, animal, cape, hand } = await req.json()

  // Upload metadata to IPFS or similar here, then mint
  const tokenURI = `ipfs://example/${fid}`

  const data = encodeFunctionData({
    abi: MintContractABI,
    functionName: 'mint',
    args: [tokenURI, BigInt(1)],
  })

  const contractAddress = CONTRACTS.mintContract as Address // ✅ convert to proper Address type

  const tx = await wallet.sendTransaction({
    to: contractAddress,
    value: parseEther('0'),
    data,
  })

  return NextResponse.json({ success: true, txHash: tx })
}
