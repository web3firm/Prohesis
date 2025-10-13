import { NextResponse } from "next/server";
import prisma from "@/lib/offchain/services/dbClient";
import { z } from "zod";

const querySchema = z.object({
  userId: z.string().regex(/^\d+$/),
});

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const parseResult = querySchema.safeParse({ userId: searchParams.get("userId") });
    if (!parseResult.success) {
      return NextResponse.json({ error: "userId query required and must be a number" }, { status: 400 });
    }
    const userId = Number(parseResult.data.userId);

    const user = await prisma.users.findUnique({
      where: { id: userId },
      include: {
        Wallets: true,
        Bets: { include: { Markets: true } },
        Payouts: true,
      },
    });

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const totalWinnings = user.Payouts.reduce(
      (sum: number, p: { payout_amount?: number | string }) => sum + Number(p.payout_amount || 0),
      0
    );
    const totalStaked = user.Bets.reduce(
      (sum: number, b: { amount?: number | string }) => sum + Number(b.amount || 0),
      0
    );

    return NextResponse.json({
      ...user,
      stats: {
        totalWinnings,
        totalStaked,
        winRate:
          user.Payouts.length && user.Bets.length
            ? ((user.Payouts.length / user.Bets.length) * 100).toFixed(2)
            : "0",
      },
    });
  } catch (error: any) {
    console.error("Profile error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
