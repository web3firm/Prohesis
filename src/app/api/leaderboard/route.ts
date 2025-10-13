import { NextResponse } from "next/server";
import prisma from "@/lib/offchain/services/dbClient";

export async function GET() {
  try {
    const users = await prisma.users.findMany({
      include: {
        Bets: true,
        Payouts: true,
      },
    });


    type LeaderboardUser = {
      user_id: number;
      total_winnings: number;
      total_staked: number;
    };

    const leaderboardData: LeaderboardUser[] = users.map((u: any) => {
      const totalWinnings = u.Payouts.reduce(
        (sum: number, p: { payout_amount?: number | string }) => sum + Number(p.payout_amount || 0),
        0
      );
      const totalStaked = u.Bets.reduce(
        (sum: number, b: { amount?: number | string }) => sum + Number(b.amount || 0),
        0
      );
      return {
        user_id: u.id,
        total_winnings: totalWinnings,
        total_staked: totalStaked,
      };
    });

    // Sort & rank
    leaderboardData.sort((a: LeaderboardUser, b: LeaderboardUser) => b.total_winnings - a.total_winnings);
    const snapshotDate = new Date();
    await prisma.$transaction(
      leaderboardData.map((u: LeaderboardUser, i: number) =>
        prisma.leaderboards.create({
          data: {
            snapshot_date: snapshotDate,
            position: i + 1,
            user_id: u.user_id,
            total_winnings: u.total_winnings,
            total_staked: u.total_staked,
          },
        })
      )
    );

    return NextResponse.json({ success: true, count: leaderboardData.length });
  } catch (error: any) {
    console.error("Leaderboard snapshot error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
