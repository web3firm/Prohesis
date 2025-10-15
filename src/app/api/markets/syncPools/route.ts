import { NextResponse } from "next/server";
import db from "@/lib/offchain/services/dbClient"; // default export is `db` client
import { getPoolsForMarket } from "@/lib/onchain/readFunctions";
import { createPublicClient, getContract, http, type Abi } from "viem";
import { sepolia } from "viem/chains";
import MarketJSON from "@/lib/onchain/abis/ProhesisPredictionMarket.json"; // ✅ JSON
// If you already created /src/lib/onchain/abis/index.ts with exports, you can instead:
// import { MarketABI } from "@/lib/onchain/abis";

const MarketABI = MarketJSON.abi as unknown as Abi; // typed ABI
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_MARKET_CONTRACT as `0x${string}` | undefined; // from env

export async function GET() {
  try {
    // No global CONTRACT_ADDRESS required here — we will read per-market
    // on-chain addresses from the DB and call getPoolsForMarket which already
    // constructs a market contract for each address.

    // ⬇️ Pick the correct Prisma model name for your schema.
    // If your Prisma model is `model Market { ... }`, the client is `prisma.market`.
    // If you named it `model Markets { ... }`, then keep `prisma.markets`.
    const markets = await db.market.findMany();

    for (const m of markets) {
      // If your schema stores on-chain id differently, adjust here.
      // Example: assuming you have `onchainMarketId: Int` on Market:
      // const pools = await contract.read.getPools([BigInt(m.onchainMarketId)]);
      //
      // If you only store per-market contract address, use a per-market contract instead.

      // Placeholder if you indeed have an onchain numeric id:
      // Attempt to read on-chain id; guard if the field does not exist.
      // If we have an onchain contract address on the market, read pools from chain
      const onchainAddr = (m as any).onchainAddr ?? (m as any).onchain_addr ?? null;
      if (!onchainAddr) {
        console.warn("Skipping market without on-chain address", m.id);
        continue;
      }

      try {
        const pools = await getPoolsForMarket(onchainAddr as `0x${string}`);
        const total = (pools || []).reduce((a, b) => a + b, 0);

        // Upsert into marketPools if the model exists, otherwise update market.totalPool
        try {
          await db.marketPools.upsert({
            where: { market_id: m.id },
            update: { total_pool: total, last_updated: new Date() },
            create: { market_id: m.id, total_pool: total, last_updated: new Date() },
          });
        } catch {
          // Fallback: write to market.totalPool
          await db.market.update({ where: { id: m.id }, data: { totalPool: total } });
        }
      } catch (e) {
        console.warn("Failed to fetch pools for", m.id, e);
        continue;
      }
    }

    return NextResponse.json({ success: true, count: markets.length });
  } catch (e: any) {
    console.error("Pool sync error", e);
    // Use helper lazily to avoid changing runtime semantics for callers of this endpoint
    const { jsonError } = await import('@/lib/api/errorResponse');
    return jsonError(e?.message ?? 'Internal server error', 500);
  }
}
