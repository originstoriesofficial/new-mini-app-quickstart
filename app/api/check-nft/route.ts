import { NextResponse } from "next/server"
import { Alchemy, Network } from "alchemy-sdk"
import { CONTRACTS } from "../../lib/contracts"

const alchemy = new Alchemy({
  apiKey: process.env.ALCHEMY_KEY!,
  network: Network.BASE_SEPOLIA // use BASE_MAINNET for prod
})

export async function POST(req: Request) {
  try {
    const { address } = (await req.json()) as { address: string }

    if (!address) {
      return NextResponse.json({ error: "Missing wallet address" }, { status: 400 })
    }

    const nfts = await alchemy.nft.getNftsForOwner(address)

    const ownedContracts: string[] = nfts.ownedNfts.map(
      (nft: { contract: { address: string } }) => nft.contract.address.toLowerCase()
    )

    // 🆓 Monks or Mantle holders = 1 free, then 0.001 ETH mints
    const isMonkHolder =
      ownedContracts.includes(CONTRACTS.monks.toLowerCase()) ||
      ownedContracts.includes(CONTRACTS.mantle.toLowerCase())

    // 💸 Discounted (.001 ETH)
    const isDiscountHolder = CONTRACTS.discountCollections.some(
      (addr: string) => ownedContracts.includes(addr.toLowerCase())
    )

    // 🎶 Access to music page (requires minted NFT)
    const hasMusicAccess = ownedContracts.includes(CONTRACTS.musicAccess.toLowerCase())

    let price = 0.002 // default public mint
    if (isMonkHolder) price = 0.001 // after free
    else if (isDiscountHolder) price = 0.001

    return NextResponse.json({
      price,
      access: hasMusicAccess,
      isMonkHolder,
      isDiscountHolder,
    })
  } catch (err) {
    console.error("NFT check error:", err)
    return NextResponse.json({ error: "Failed to check NFTs" }, { status: 500 })
  }
}
