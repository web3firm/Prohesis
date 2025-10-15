import { NextResponse } from "next/server";
import { createPublicClient, getContract, http } from "viem";
import { sepolia } from "viem/chains";
import MarketABI from "@/lib/onchain/abis/ProhesisPredictionMarket.json";
import { CONTRACT_ADDRESS } from "@/lib/utils/constants";
import db from "@/lib/offchain/services/dbClient";
import { jsonError } from '@/lib/api/errorResponse';

export async function GET() {
  try {
    const client = createPublicClient({ chain: sepolia, transport: http() });
    const contract = getContract({
      address: CONTRACT_ADDRESS,
      abi: (MarketABI as any).abi,
      client,
    });

  const markets = await db.market.findMany();

    for (const m of markets) {
      // resolve on-chain contract address and fetch pools via helper which
      // calls getPoolTotals/getTotalPool fallbacks as needed
      const onchainAddr = (m as any).onchainAddr ?? (m as any).onchain_addr ?? null;
      if (!onchainAddr) continue;
      const pools = await (async () => {
        try {
          const { getPoolsForMarket } = await import('@/lib/onchain/readFunctions');
          return await getPoolsForMarket(onchainAddr as `0x${string}`);
        } catch {
          return [] as number[];
        }
      })();

      for (let i = 0; i < pools.length; i++) {
        // Upsert into marketOutcome model (if present)
        try {
          await (db as any).marketOutcome.upsert({
            where: { marketId_outcomeIndex: { marketId: m.id, outcomeIndex: i } },
            update: { totalStaked: pools[i] },
            create: {
              marketId: m.id,
              outcomeIndex: i,
              label: (m as any).outcomes ? (m as any).outcomes[i] : `Outcome #${i + 1}`,
              totalStaked: pools[i],
            },
          });
        } catch (e) {
          // fallback: ignore per-outcome persistence and continue
          continue;
        }
      }
    }

    return NextResponse.json({ success: true, updated: markets.length });
  } catch (error: any) {
    console.error("Outcome sync error:", error);
    return jsonError(error?.message ?? 'Internal server error', 500);
  }
}
