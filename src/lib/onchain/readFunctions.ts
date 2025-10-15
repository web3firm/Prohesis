// File: src/lib/onchain/readFunctions.ts
import { createPublicClient, getContract, http } from "viem";
import { sepolia } from "viem/chains";
import MarketJSON from "@/lib/onchain/abis/ProhesisPredictionMarket.json";
import { ABIS, FACTORY, client as publicClient } from "@/lib/onchain/contract";
import { CONTRACT_ADDRESS } from "@/lib/utils/constants";

const CHAIN = sepolia;

// Factory contract helper
export function getFactoryContract() {
  if (!FACTORY) throw new Error("FACTORY not configured");
  return getContract({ address: FACTORY, abi: (ABIS.factory as any).abi ?? ABIS.factory, client: publicClient });
}

export function getMarketContract(marketAddress: `0x${string}`) {
  return getContract({ address: marketAddress, abi: (ABIS.market as any).abi ?? ABIS.market, client: publicClient });
}

export async function listFactoryMarkets(): Promise<`0x${string}`[]> {
  try {
    const factory = getFactoryContract();
    // Try modern getter
    try {
      const res = await factory.read.getAllMarkets([] as any);
      return (res as `0x${string}`[]) || [];
    } catch {
      // Fallback: query totalMarkets and iterate allMarkets(i)
      try {
        const total = Number((await factory.read.totalMarkets([] as any)) as bigint);
        const out: `0x${string}`[] = [];
        for (let i = 0; i < total; i++) {
          const addr = (await factory.read.allMarkets([BigInt(i)])) as `0x${string}`;
          if (addr) out.push(addr);
        }
        return out;
      } catch {
        return [];
      }
    }
  } catch (e) {
    return [];
  }
}

export async function getOutcomesForMarket(marketAddress: `0x${string}`): Promise<string[]> {
  try {
    const market = getMarketContract(marketAddress);
  const res = (await market.read.getOutcomes([] as any)) as string[];
    return res ?? [];
  } catch {
    return [];
  }
}

export async function getPoolsForMarket(marketAddress: `0x${string}`): Promise<number[]> {
  try {
    const market = getMarketContract(marketAddress);
  const pools = (await market.read.getPoolTotals([] as any)) as [bigint, bigint];
    return pools.map((p) => Number(p) / 1e18);
  } catch {
    return [];
  }
}

export function getImpliedOddsFromPools(pools: number[]): number[] {
  const total = pools.reduce((a, b) => a + b, 0);
  if (total <= 0) return pools.map(() => 0);
  return pools.map((v) => (v / total) * 100);
}

export { publicClient };

// Backwards-compatible exports used across the codebase
// Resolve market address from factory when given a numeric marketId
export async function resolveMarketAddress(market: number | `0x${string}`): Promise<`0x${string}` | undefined> {
  if (typeof market === "string") return market;
  if (!FACTORY) return undefined;
  try {
    const factory = getFactoryContract();
    // try modern getter first
    try {
      const addr = (await factory.read.allMarkets([BigInt(market)])) as `0x${string}`;
      return addr;
    } catch {
      // fallback: if factory exposes markets mapping by index
      try {
        const addr = (await factory.read.allMarkets([BigInt(market)])) as `0x${string}`;
        return addr;
      } catch {
        return undefined;
      }
    }
  } catch {
    return undefined;
  }
}

export async function getOutcomes(market: number | `0x${string}`): Promise<string[]> {
  const addr = await resolveMarketAddress(market);
  if (!addr) return [];
  return getOutcomesForMarket(addr);
}

export async function getPools(market: number | `0x${string}`): Promise<number[]> {
  const addr = await resolveMarketAddress(market);
  if (!addr) return [];
  return getPoolsForMarket(addr);
}

export { CONTRACT_ADDRESS };
