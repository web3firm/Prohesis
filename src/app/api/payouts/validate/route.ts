import { NextResponse } from "next/server";
import prisma from "@/lib/offchain/services/dbClient";
import { z } from "zod";
import { jsonError } from '@/lib/api/errorResponse';

const querySchema = z.object({
  marketId: z.string().regex(/^\d+$/),
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
      return jsonError('marketId and userId are required and must be numbers', 400, parseResult.error.issues);
    }
  const marketId = Number(parseResult.data.marketId);
  const userIdRaw = parseResult.data.userId;

    const market = await prisma.markets.findUnique({
      where: { id: marketId },
    });
    if (!market) {
      return NextResponse.json({ canClaim: false, reason: "Market not found" });
    }
    if (market.status !== "resolved") {
      return NextResponse.json({ canClaim: false, reason: "Market not resolved yet" });
    }

    // Try by numeric user id or wallet address
    const userBet = await prisma.bet.findFirst({
      where: { marketId: marketId, OR: [{ userId: String(userIdRaw) }, { walletAddress: String(userIdRaw) }] },
    });
    if (!userBet) {
      return NextResponse.json({ canClaim: false, reason: "No bet placed by this user" });
    }

    const alreadyClaimed = await prisma.payout.findFirst({
      where: { marketId: marketId, userId: String(userIdRaw) },
    });
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
