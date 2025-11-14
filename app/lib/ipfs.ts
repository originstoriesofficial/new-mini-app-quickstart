// lib/ipfs.ts
import { PinataSDK } from 'pinata';

const pinata = new PinataSDK({
  pinataJwt: process.env.PINATA_JWT!,
  pinataGateway: process.env.PINATA_GATEWAY!, // e.g. "yourgateway.mypinata.cloud"
});

// Upload a file to IPFS
export async function uploadToIPFS(file: File) {
  try {
    const result = await pinata.upload.public.file(file);
    return {
      cid: result.cid,
      url: `https://${process.env.PINATA_GATEWAY!}/ipfs/${result.cid}`,
    };
  } catch (err) {
    console.error('IPFS Upload Error:', err);
    throw err;
  }
}

// Get content by CID
export async function getIPFSData(cid: string) {
  try {
    const data = await pinata.gateways.public.get(cid);
    return data;
  } catch (err) {
    console.error('IPFS Fetch Error:', err);
    throw err;
  }
}

// Generate gateway URL from CID
export function getIPFSUrl(cid: string) {
  return `https://${process.env.PINATA_GATEWAY!}/ipfs/${cid}`;
}
