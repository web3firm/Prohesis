import { NextResponse } from "next/server";
import prisma from "@/lib/offchain/services/dbClient";

export async function GET() {
  try {
    const [marketCount, betCount, payoutCount, userCount, totalFees] = await Promise.all([
      prisma.markets.count(),
      prisma.bets.count(),
      prisma.payouts.count(),
      prisma.users.count(),
      prisma.fees.aggregate({ _sum: { amount: true } }),
    ]);

    const recentMarkets = await prisma.markets.findMany({
      orderBy: { created_at: "desc" },
      take: 5,
      select: { id: true, title: true, status: true, created_at: true },
    });

    return NextResponse.json({
      marketCount,
      betCount,
      payoutCount,
      userCount,
      totalFees: totalFees._sum.amount || 0,
      recentMarkets,
    });
  } catch (error: any) {
    console.error("Admin stats error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
