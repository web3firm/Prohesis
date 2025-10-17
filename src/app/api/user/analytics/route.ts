import { NextResponse } from "next/server";
import db from "@/lib/offchain/services/dbClient";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const wallet = String(searchParams.get("wallet") || "").toLowerCase();
  if (!wallet) return NextResponse.json({ error: "wallet required" }, { status: 400 });

  const [bets, payouts] = await Promise.all([
    db.bet.findMany({ where: { walletAddress: wallet }, orderBy: { createdAt: "asc" } }),
    db.payout.findMany({ where: { userId: wallet }, orderBy: { id: "asc" } }),
  ]);

  const totalStaked = bets.reduce((a: number, b: any) => a + (b.amount || 0), 0);
  const totalWon = payouts.reduce((a: number, p: any) => a + (p.amount || 0), 0);
  const totalLost = Math.max(0, totalStaked - totalWon);

  // group bets by month for a simple area chart
  const byMonth: Record<string, number> = {};
  for (const b of bets) {
    const d = new Date(b.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    byMonth[key] = (byMonth[key] || 0) + (b.amount || 0);
  }

  return NextResponse.json({
    totals: { totalStaked, totalWon, totalLost, bets: bets.length, payouts: payouts.length },
    byMonth,
  });
}
