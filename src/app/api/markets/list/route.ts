import { NextResponse } from "next/server";
import db from "@/lib/offchain/services/dbClient";
import { listFactoryMarkets, getOutcomesForMarket, getPoolsForMarket } from "@/lib/onchain/readFunctions";
import { jsonError } from '@/lib/api/errorResponse';
import { cacheGet, cacheSet } from '@/lib/offchain/services/cacheClient';

// Patch: Return structure expected by MarketCard (id, title, endTime, yesPool, noPool)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const sort = (searchParams.get('sort') || 'trending') as 'trending' | 'new' | 'ending';
    const cacheKey = `markets:list:v1:${sort}`;

    // 1) Try cache first (short TTL)
    const cached = await cacheGet<any[]>(cacheKey);
    if (cached) {
      return new NextResponse(JSON.stringify(cached), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 's-maxage=15, stale-while-revalidate=60',
        },
      });
    }

    // Load all DB markets first
    let markets = await db.market.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        endTime: true,
        totalPool: true,
        onchainAddr: true,
        status: true,
        winningOutcome: true,
        createdAt: true,
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
        } catch {
            continue;
          }
      }

  markets = await db.market.findMany({ orderBy: { createdAt: "desc" }, select: { id: true, title: true, endTime: true, totalPool: true, status: true, winningOutcome: true, createdAt: true, onchainAddr: true } });
    }

    // Filter to only markets that belong to current factory (avoid showing stale/old markets)
    try {
      const addrs = await listFactoryMarkets();
      const addrSet = new Set(addrs.map((a: string) => a.toLowerCase()));
      markets = markets.filter((m: any) => m.onchainAddr && addrSet.has(String(m.onchainAddr).toLowerCase()));
    } catch {
      // If we cannot read the factory, do not show potentially stale markets.
      markets = [] as any[];
    }
    // Map markets and, if we have onchainAddr, fetch pools for each to show yes/no pools
    const toNum = (v: any): number => {
      if (typeof v === 'bigint') {
        try {
          // Heuristic: if looks like wei, scale to ETH for UI sorting
          const asNum = Number(v);
          return asNum > 1e12 ? asNum / 1e18 : asNum;
        } catch {
          return 0;
        }
      }
      if (typeof v === 'string') {
        const n = Number(v);
        return isNaN(n) ? 0 : n;
      }
      return Number(v || 0);
    };

    const mapped = await Promise.all(
      markets.map(async (m: any) => {
        let yesPool = 0;
        let noPool = 0;
        if (m.onchainAddr) {
          try {
            const pools = await getPoolsForMarket(m.onchainAddr as `0x${string}`);
            yesPool = toNum(pools?.[0] ?? 0);
            noPool = toNum(pools?.[1] ?? 0);
          } catch {
            // ignore and fallback to zeros
          }
        }
        return {
          id: String(m.id),
          title: m.title ?? "Untitled",
          endTime: m.endTime ? new Date(m.endTime).getTime() : 0,
          status: m.status ?? undefined,
          winningOutcome: m.winningOutcome ?? undefined,
          yesPool,
          noPool,
          createdAt: m.createdAt ? new Date(m.createdAt).getTime() : 0,
        };
      })
    );

    // Server-side sorting
    let sorted = [...mapped];
    if (sort === 'trending') {
      sorted.sort((a, b) => (b.yesPool + b.noPool) - (a.yesPool + a.noPool));
    } else if (sort === 'new') {
      sorted.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    } else if (sort === 'ending') {
      const withEnd = sorted.filter((m) => m.endTime && m.endTime > 0);
      const withoutEnd = sorted.filter((m) => !m.endTime || m.endTime === 0);
      withEnd.sort((a, b) => (a.endTime || 0) - (b.endTime || 0));
      sorted = [...withEnd, ...withoutEnd];
    }

    // Remove createdAt from response payload (internal sorting only)
  const response = sorted.map((rest) => ({ ...rest }));

    // 2) Set cache (short TTL) and return with public caching headers
    await cacheSet(cacheKey, response, 15);
    return new NextResponse(JSON.stringify(response), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 's-maxage=15, stale-while-revalidate=60',
      },
    });
  } catch (error: any) {
    console.error("Markets list error:", error);
    return jsonError(error?.message ?? 'Internal server error', 500);
  }
}
