// File: src/app/api/bets/place/route.ts

import { NextResponse } from "next/server";
import db from "@/lib/offchain/services/dbClient";
import { verifyBetTx } from "@/lib/onchain/writeFunctions";
import { getOutcomes } from "@/lib/onchain/readFunctions";
import { z } from "zod";

const betSchema = z.object({
  txHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/),
  userId: z.string().min(1),
});

/**
 * Client should:
 * 1) Call contract.placeBet(...) with wallet
 * 2) On success, send POST here with { txHash, userId }
 *
 * Body:
 * {
 *   "txHash": "0x...",
 *   "userId": "USER_ID_STRING"
 * }
 *
 * We will decode tx logs to find marketId/outcomeIndex/amount and then
 * persist Bet + update Market.totalPool.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parseResult = betSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json({ error: "Invalid input", details: parseResult.error.issues }, { status: 400 });
    }
    const { txHash, userId } = parseResult.data;

    const decoded = await verifyBetTx(txHash as `0x${string}`);
    const { marketId, outcomeIndex, amountEth } = decoded;

    // Get the outcome label from chain (if available)
    const outcomes = await getOutcomes(marketId);
    const outcomeLabel = outcomes?.[outcomeIndex] ?? `Outcome #${outcomeIndex + 1}`;

    // Ensure user exists (optional upsert)
  const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: "User not found in off-chain DB" }, { status: 404 });
    }

    // Ensure market exists off-chain (optional soft create if you prefer)
  const market = await db.market.findUnique({ where: { id: marketId } });
    if (!market) {
      return NextResponse.json({ error: "Market not found in off-chain DB" }, { status: 404 });
    }

    // Create bet
    const bet = await db.bet.create({
      data: {
        amount: amountEth,
        marketId: marketId,
        userId: userId,
        txHash: txHash,
        walletChainId: 11155111,
        outcomeIndex: outcomeIndex,
        walletAddress: decoded.wallet as string,
      },
    });

    // Update market totalPool
    await db.market.update({
      where: { id: marketId },
      data: {
        totalPool: (market.totalPool || 0) + amountEth,
      },
    });

    return NextResponse.json({ success: true, bet, decoded }, { status: 200 });
  } catch (error: any) {
    console.error("Place bet error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
