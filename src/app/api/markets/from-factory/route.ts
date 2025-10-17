import { NextResponse } from "next/server";
import { listFactoryMarkets, getPoolsForMarket, getOutcomesForMarket } from "@/lib/onchain/readFunctions";
import { jsonError } from "@/lib/api/errorResponse";

// Simple in-memory cache shared across lambda invocations during cold start.
let cache: { ts: number; data: any[] } | null = null;
const TTL_MS = 60 * 1000; // 60 seconds

export async function GET() {
  try {
    if (cache && Date.now() - cache.ts < TTL_MS) {
      return NextResponse.json(cache.data, { status: 200 });
    }

    const addrs = await listFactoryMarkets();
    const mapped = await Promise.all(
      addrs.map(async (addr) => {
        try {
          const outcomes = await getOutcomesForMarket(addr as `0x${string}`);
          const pools = await getPoolsForMarket(addr as `0x${string}`);
          return {
            address: addr,
            title: outcomes?.[0] ? outcomes[0] : `Market ${addr.slice(0, 10)}`,
            endTime: 0,
            resolved: false,
            yesPool: pools?.[0] ?? 0,
            noPool: pools?.[1] ?? 0,
            _source: 'factory',
          };
        } catch (e) {
          return { address: addr, error: String(e) };
        }
      })
    );

    cache = { ts: Date.now(), data: mapped };
    return NextResponse.json(mapped, { status: 200 });
  } catch (error: any) {
    console.error("/api/markets/from-factory error:", error);
    return jsonError(error?.message ?? "Internal server error", 500);
  }
}
