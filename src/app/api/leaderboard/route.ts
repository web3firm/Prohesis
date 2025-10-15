import { NextResponse } from "next/server";
import prisma from "@/lib/offchain/services/dbClient";
import { jsonError } from '@/lib/api/errorResponse';

export async function GET() {
  try {
    // Use schema relation names: bets, payouts
    const users = await prisma.users.findMany({
      include: {
        bets: true,
        payouts: true,
      },
    });


    type LeaderboardUser = {
      user_id: number;
      total_winnings: number;
      total_staked: number;
    };

    const leaderboardData: LeaderboardUser[] = users.map((u: any) => {
      const totalWinnings = u.payouts.reduce(
        (sum: number, p: { payout_amount?: number | string }) => sum + Number(p.payout_amount || 0),
        0
      );
      const totalStaked = u.bets.reduce(
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
    // If a leaderboard model/table exists, persist snapshot. Be defensive
    // and avoid calling an undefined create method on the runtime alias.
    if (prisma.leaderboards && typeof prisma.leaderboards.create === "function") {
      try {
        for (let i = 0; i < leaderboardData.length; i++) {
          const u = leaderboardData[i];
            try {
              // call via optional chaining on the leaderboards object itself
              await prisma.leaderboards?.create({
                data: {
                  snapshot_date: snapshotDate,
                  position: i + 1,
                  user_id: u.user_id,
                  total_winnings: u.total_winnings,
                  total_staked: u.total_staked,
                },
              });
          } catch (e) {
            console.warn("Failed to persist leaderboard row", e);
            // continue with others
          }
        }
      } catch (e) {
        console.warn("Leaderboard persist failed:", e);
      }
    } else {
      // no leaderboard persistence available in schema
      console.warn("Leaderboard model not found; skipping snapshot persist");
    }

    return NextResponse.json({ success: true, count: leaderboardData.length });
  } catch (error: any) {
    console.error("Leaderboard snapshot error:", error);
    return jsonError(error?.message ?? 'Internal server error', 500);
  }
}
