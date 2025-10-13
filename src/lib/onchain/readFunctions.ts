// File: src/lib/onchain/readFunctions.ts
import { createPublicClient, getContract, http } from "viem";
import { sepolia } from "viem/chains";
import MarketJSON from "@/lib/onchain/abis/ProhesisPredictionMarket.json";

// If you have constants, you can centralize these.
// Fallback to envs for safety.
const CHAIN = sepolia;
const CONTRACT_ADDRESS = (process.env.NEXT_PUBLIC_MARKET_CONTRACT_ADDRESS ||
  "") as `0x${string}`;

const publicClient = createPublicClient({
  chain: CHAIN,
  transport: http(),
});

const contract = getContract({
  address: CONTRACT_ADDRESS,
  abi: MarketJSON.abi, // ✅ only pass the array
  client: publicClient,
});

export async function getOutcomes(marketId: number): Promise<string[]> {
  // Assumes your contract exposes getOutcomes(uint256) -> string[]
  try {
    const res = (await contract.read.getOutcomes([BigInt(marketId)])) as string[];
    return res;
  } catch {
    // If the contract doesn’t expose outcomes, return empty (UI can handle gracefully)
    return [];
  }
}

export async function getPools(marketId: number): Promise<number[]> {
  // Assumes getPools(uint256) -> uint256[] of wei (per outcome)
  const pools = (await contract.read.getPools([BigInt(marketId)])) as bigint[];
  return pools.map((p) => Number(p) / 1e18);
}

export function getImpliedOddsFromPools(pools: number[]): number[] {
  const total = pools.reduce((a, b) => a + b, 0);
  if (total <= 0) return pools.map(() => 0);
  return pools.map((v) => (v / total) * 100);
}

export { publicClient, CONTRACT_ADDRESS };
