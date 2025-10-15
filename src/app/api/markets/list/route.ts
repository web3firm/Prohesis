import { NextResponse } from "next/server";
import db from "@/lib/offchain/services/dbClient";
import { listFactoryMarkets, getOutcomesForMarket, getPoolsForMarket } from "@/lib/onchain/readFunctions";

// Patch: Return structure expected by MarketCard (id, title, endTime, yesPool, noPool)
export async function GET() {
  try {
    let markets = await db.market.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        endTime: true,
        totalPool: true,
        onchainAddr: true,
      },
    });

    // If there are no markets in the DB, try to read from the deployed contract
    if (markets.length === 0) {
      const addrs = await listFactoryMarkets();
      for (const addr of addrs) {
        try {
          const outcomes = await getOutcomesForMarket(addr);
          if (!outcomes || outcomes.length === 0) continue;
          const pools = await getPoolsForMarket(addr);
          const totalPool = (pools || []).reduce((a, b) => a + b, 0);
          const title = `Market ${addr.slice(0, 10)}`;
          await db.market.upsert({
            where: { onchainAddr: addr },
            update: { totalPool },
            create: { title, endTime: new Date(Date.now() + 86400000), onchainAddr: addr, totalPool },
          });
        } catch (e) {
          continue;
        }
      }

      markets = await db.market.findMany({ orderBy: { createdAt: "desc" }, select: { id: true, title: true, endTime: true, totalPool: true } });
    }
    // Map markets and, if we have onchainAddr, fetch pools for each to show yes/no pools
    const mapped = await Promise.all(
      markets.map(async (m: any) => {
        let yesPool = 0;
        let noPool = 0;
        if (m.onchainAddr) {
          try {
            const pools = await getPoolsForMarket(m.onchainAddr as `0x${string}`);
            yesPool = pools?.[0] ?? 0;
            noPool = pools?.[1] ?? 0;
          } catch (e) {
            // ignore and fallback to zeros
          }
        }
        return {
          id: String(m.id),
          title: m.title ?? "Untitled",
          endTime: m.endTime ? new Date(m.endTime).getTime() : 0,
          yesPool,
          noPool,
        };
      })
    );

    return NextResponse.json(mapped, { status: 200 });
  } catch (error: any) {
    console.error("Markets list error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
