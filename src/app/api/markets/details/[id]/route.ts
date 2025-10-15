import { NextResponse } from "next/server";
import db from "@/lib/offchain/services/dbClient";
import { getOutcomesForMarket, getPoolsForMarket } from "@/lib/onchain/readFunctions";
import { z } from "zod";
import { jsonError } from '@/lib/api/errorResponse';

interface Params { params: { id: string } }

const idSchema = z.object({ id: z.string().regex(/^\d+$/) });

// Next.js may provide params either directly or as a Promise; normalize by
// accepting the context object where params may be a Promise.
export async function GET(_: Request, context: any) {
  // normalize (Next may provide params or a Promise)
  const rawParams = context?.params;
  const params = rawParams && typeof rawParams.then === "function" ? await rawParams : rawParams;
  try {
    const parseResult = idSchema.safeParse(params);
    if (!parseResult.success) {
      return jsonError('Invalid id', 400, parseResult.error.issues);
    }
    const id = Number(parseResult.data.id);
    let market = await db.market.findUnique({
      where: { id },
      include: { bets: true, payouts: true },
    });

  if (!market) return jsonError('Market not found', 404);

    // If we have an onchain address, fetch pools/outcomes directly
    if (market.onchainAddr) {
      const pools = await getPoolsForMarket(market.onchainAddr as `0x${string}`).catch(() => [0, 0]);
      const yesPool = pools[0] ?? 0;
      const noPool = pools[1] ?? 0;
      return NextResponse.json({ id: String(market.id), title: market.title, endTime: new Date(market.endTime).getTime(), yesPool, noPool });
    }

    // Fallback: return DB data
    return NextResponse.json({ id: String(market.id), title: market.title, endTime: new Date(market.endTime).getTime(), yesPool: 0, noPool: 0 });
  } catch (e: any) {
    console.error("Market details error:", e);
    return jsonError(e?.message ?? 'Internal server error', 500);
  }
}
