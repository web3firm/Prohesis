// File: src/app/api/bets/place/route.ts

import { NextResponse } from "next/server";
import db from "@/lib/offchain/services/dbClient";
import { verifyBetTx } from "@/lib/onchain/writeFunctions";
import { getOutcomes } from "@/lib/onchain/readFunctions";
import { z } from "zod";
import { jsonError } from '@/lib/api/errorResponse';
import { rateLimit } from '@/lib/api/rateLimit';

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
const limiter = rateLimit({ windowMs: 60_000, max: 10 });
export async function POST(req: Request) {
  try {
    // Basic per-IP rate limit
    const ip = (req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'ip:unknown').split(',')[0].trim();
    const verdict = limiter(`bets:${ip}`);
    if (!verdict.allowed) return jsonError('Too many requests', 429);

    const body = await req.json();
    const parseResult = betSchema.safeParse(body);
    if (!parseResult.success) {
      return jsonError('Invalid input', 400, parseResult.error.issues);
    }
    const { txHash, userId } = parseResult.data;

    const decoded = await verifyBetTx(txHash as `0x${string}`);
    const { marketId, outcomeIndex, amountEth } = decoded;

  // Get the outcome label from chain (if available)
  const outcomes = await getOutcomes(marketId);
  void outcomes; // intentionally unused here but keep call for side-effects/future use

    // Ensure user exists (optional upsert)
  const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) {
      return jsonError('User not found in off-chain DB', 404);
    }

    // Ensure market exists off-chain (optional soft create if you prefer)
  const market = await db.market.findUnique({ where: { id: marketId } });
    if (!market) {
      return jsonError('Market not found in off-chain DB', 404);
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
    return jsonError(error?.message ?? 'Internal server error', 500);
  }
}
