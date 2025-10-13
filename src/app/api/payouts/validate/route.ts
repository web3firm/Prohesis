import { NextResponse } from "next/server";
import prisma from "@/lib/offchain/services/dbClient";
import { z } from "zod";

const querySchema = z.object({
  marketId: z.string().regex(/^\d+$/),
  userId: z.string().regex(/^\d+$/),
});

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const parseResult = querySchema.safeParse({
      marketId: searchParams.get("marketId"),
      userId: searchParams.get("userId"),
    });
    if (!parseResult.success) {
      return NextResponse.json({ error: "marketId and userId are required and must be numbers", details: parseResult.error.issues }, { status: 400 });
    }
    const marketId = Number(parseResult.data.marketId);
    const userId = Number(parseResult.data.userId);

    const market = await prisma.markets.findUnique({
      where: { id: marketId },
    });
    if (!market) {
      return NextResponse.json({ canClaim: false, reason: "Market not found" });
    }
    if (market.status !== "resolved") {
      return NextResponse.json({ canClaim: false, reason: "Market not resolved yet" });
    }

    const userBet = await prisma.bets.findFirst({
      where: { market_id: marketId, user_id: userId },
    });
    if (!userBet) {
      return NextResponse.json({ canClaim: false, reason: "No bet placed by this user" });
    }

    const alreadyClaimed = await prisma.payouts.findFirst({
      where: { market_id: marketId, user_id: userId, claimed: true },
    });
    if (alreadyClaimed) {
      return NextResponse.json({ canClaim: false, reason: "Payout already claimed" });
    }

    const winning = market.resolved_outcome_index === userBet.outcome_index;

    return NextResponse.json({
      canClaim: winning,
      reason: winning ? "Eligible for payout" : "Your bet was on a losing outcome",
    });
  } catch (error: any) {
    console.error("Validate payout error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
