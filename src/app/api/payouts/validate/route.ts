import { NextResponse } from "next/server";
import db from "@/lib/offchain/services/dbClient";
import { z } from "zod";
import { jsonError } from '@/lib/api/errorResponse';

const querySchema = z.object({
  // marketId may be supplied as a numeric string (market id) or left as a string
  marketId: z.string().min(1),
  userId: z.string().min(1),
});

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const parseResult = querySchema.safeParse({
      marketId: searchParams.get("marketId"),
      userId: searchParams.get("userId"),
    });
    if (!parseResult.success) {
      return jsonError('marketId and userId are required', 400, parseResult.error.issues);
    }
  const marketIdRaw = parseResult.data.marketId;
  const userIdRaw = parseResult.data.userId;
  // If marketIdRaw is purely numeric, treat it as the numeric DB id, otherwise it's an onchain address
  const marketId = /^\d+$/.test(marketIdRaw) ? Number(marketIdRaw) : null;

    let market = null;
    if (marketId) {
      market = await db.market.findUnique({ where: { id: marketId } });
      // fallback: maybe caller passed an onchainAddr as numeric-like string; try onchainAddr too
      if (!market) {
        market = await db.market.findFirst({ where: { onchainAddr: String(marketIdRaw) } });
      }
    } else {
      market = await db.market.findFirst({ where: { onchainAddr: marketIdRaw } });
    }
    if (!market) {
      return NextResponse.json({ canClaim: false, reason: "Market not found" });
    }
    // Consider market resolved if a status column explicitly says so, or
    // if any of the common resolved/winning fields are present in the record.
    const marketAny: any = market as any;
    const resolvedFields = [
      marketAny.status === "resolved",
      marketAny.winning !== undefined && marketAny.winning !== null,
      marketAny.winningOutcome !== undefined && marketAny.winningOutcome !== null,
      marketAny.resolved_outcome_index !== undefined && marketAny.resolved_outcome_index !== null,
      marketAny.resolvedOutcome !== undefined && marketAny.resolvedOutcome !== null,
    ];
    const isResolved = resolvedFields.some(Boolean);
    if (!isResolved) {
      return NextResponse.json({ canClaim: false, reason: "Market not resolved yet" });
    }

    // Try by numeric user id or wallet address
    const userBet = await db.bet.findFirst({
      where: { marketId: marketId, OR: [{ userId: String(userIdRaw) }, { walletAddress: String(userIdRaw) }] },
    });
    if (!userBet) {
      return NextResponse.json({ canClaim: false, reason: "No bet placed by this user" });
    }

    const alreadyClaimed = await db.payout.findFirst({ where: { marketId: marketId, userId: String(userIdRaw) } });
    if (alreadyClaimed) return NextResponse.json({ canClaim: false, reason: "Payout already recorded" });

    // Determine winning by comparing market.winningOutcome (or winning) with bet.outcomeIndex
    const marketWinIdx = (market as any).winning ?? (market as any).winningOutcome ?? (market as any).resolved_outcome_index;
    const winning = Number(marketWinIdx) === Number((userBet as any).outcomeIndex ?? (userBet as any).outcome_index);

    return NextResponse.json({
      canClaim: winning,
      reason: winning ? "Eligible for payout" : "Your bet was on a losing outcome",
    });
  } catch (error: any) {
    console.error("Validate payout error:", error);
    return jsonError(error?.message ?? 'Internal server error', 500);
  }
}
