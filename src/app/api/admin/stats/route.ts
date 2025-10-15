import { NextResponse } from "next/server";
import db from "@/lib/offchain/services/dbClient";
import { jsonError } from '@/lib/api/errorResponse';

export async function GET() {
  try {
    const [marketCount, betCount, payoutCount, userCount] = await Promise.all([
      db.market.count(),
      db.bet.count(),
      db.payout.count(),
      db.user.count(),
    ]);

    const recentMarkets = await db.market.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, title: true, createdAt: true },
    });

    return NextResponse.json({
      marketCount,
      betCount,
      payoutCount,
      userCount,
  totalFees: 0,
      recentMarkets,
    });
  } catch (error: any) {
    console.error("Admin stats error:", error);
    return jsonError(error?.message ?? 'Internal server error', 500);
  }
}
