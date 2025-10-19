// File: src/lib/onchain/readFunctions.ts
import { getContract } from "viem";
import { sepolia } from "viem/chains";
import { ABIS, FACTORY, client as publicClient } from "@/lib/onchain/contract";

const CHAIN = sepolia;
void CHAIN;

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
  } catch {
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
  // Try DB first: markets table stores onchainAddr by numeric id
  try {
    const mod = await import("@/lib/offchain/services/dbClient");
    const db: any = (mod as any).default || mod;
    const rec = await db.market.findUnique({ where: { id: market }, select: { onchainAddr: true } });
    if (rec?.onchainAddr) {
      return rec.onchainAddr as `0x${string}`;
    }
  } catch {}
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

// Heuristic: try to locate a market address by matching metadata from the factory
// This requires that the market exposes title() and endTime() views, which our contract does.
export async function findMarketAddressByMetadata(title: string, endTimeMs: number): Promise<`0x${string}` | null> {
  if (!FACTORY) return null;
  const addresses = await listFactoryMarkets();
  if (!addresses.length) return null;
  const normalizedTitle = (title || '').trim();
  const endSeconds = Math.floor(endTimeMs / 1000);
  for (const addr of addresses) {
    try {
      const market = getMarketContract(addr);
      const [t, e] = await Promise.all([
        market.read.title([] as any) as Promise<string>,
        market.read.endTime([] as any) as Promise<bigint>
      ]);
      if ((t || '').trim() === normalizedTitle && Number(e) === endSeconds) {
        return addr;
      }
    } catch {
      // continue scanning
    }
  }
  return null;
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

