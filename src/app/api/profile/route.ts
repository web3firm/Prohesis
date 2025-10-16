import { NextResponse } from "next/server";
import db from "@/lib/offchain/services/dbClient";
import { z } from "zod";
import { jsonError } from '@/lib/api/errorResponse';

// Accept either numeric DB id or string wallet address
const querySchema = z.object({
  userId: z.string().min(1),
});

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const parseResult = querySchema.safeParse({ userId: searchParams.get("userId") });
    if (!parseResult.success) {
      return jsonError('userId query required', 400, parseResult.error.issues);
    }
    const userIdRaw = parseResult.data.userId;

    // Find by id first (id may be a DB id or a wallet-address string),
    // otherwise fall back to displayName / other identifying fields.
    let user: any = await db.user.findUnique({
      where: { id: userIdRaw },
      include: { bets: { include: { market: true } }, payouts: true },
    });

    if (!user) {
      // lookup by displayName or other non-id identifier
      user = await db.user.findFirst({
        where: { OR: [{ id: userIdRaw }, { displayName: userIdRaw }] },
        include: { bets: { include: { market: true } }, payouts: true },
      });
    }

  if (!user) return jsonError('User not found', 404);

    const totalWinnings = (user.payouts || []).reduce(
      (sum: number, p: { amount?: number | string }) => sum + Number(p.amount || 0),
      0
    );
    const totalStaked = (user.bets || []).reduce(
      (sum: number, b: { amount?: number | string }) => sum + Number(b.amount || 0),
      0
    );

    return NextResponse.json({
      ...user,
      stats: {
        totalWinnings,
        totalStaked,
        winRate:
          (user.payouts?.length || 0) && (user.bets?.length || 0)
            ? ((user.payouts.length / user.bets.length) * 100).toFixed(2)
            : "0",
      },
    });
  } catch (error: any) {
    console.error("Profile error:", error);
    return jsonError(error?.message ?? 'Internal server error', 500);
  }
}
