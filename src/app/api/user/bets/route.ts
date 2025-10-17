import { NextResponse } from "next/server";
import db from "@/lib/offchain/services/dbClient";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const wallet = String(searchParams.get("wallet") || "").toLowerCase();
  if (!wallet) return NextResponse.json({ error: "wallet required" }, { status: 400 });

  // Load bets with market & payouts
  const bets = await db.bet.findMany({
    where: { walletAddress: wallet },
    orderBy: { createdAt: "desc" },
    include: { market: true },
  });

  const payouts = await db.payout.findMany({
    where: { userId: wallet },
  });
  const paidByMarket = new Map<number, number>();
  payouts.forEach((p: any) => paidByMarket.set(p.marketId, (paidByMarket.get(p.marketId) || 0) + p.amount));

  const now = Date.now();
  const activeBets: any[] = [];
  const pendingClaims: any[] = [];
  const pastBets: any[] = [];

  for (const b of bets) {
    const m: any = b.market as any;
    const end = m.endTime ? new Date(m.endTime).getTime() : 0;
    const resolved = (m.status === "resolved") || (m.winningOutcome !== null && m.winningOutcome !== undefined);
    const paid = paidByMarket.has(m.id);

    const base = {
      betId: b.id,
      marketId: m.id,
      marketTitle: m.title,
      outcomeIndex: b.outcomeIndex,
      amount: b.amount,
      txHash: b.txHash,
      createdAt: b.createdAt,
      endTime: m.endTime,
      resolved,
      paidAmount: paidByMarket.get(m.id) || 0,
      winningOutcome: m.winningOutcome ?? null,
    };

    if (!resolved && end > now) activeBets.push(base);
    else if (resolved && !paid) pendingClaims.push(base);
    else pastBets.push(base);
  }

  return NextResponse.json({ activeBets, pendingClaims, pastBets });
}
