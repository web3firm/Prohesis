import db from "@/lib/offchain/services/dbClient";

export async function getAnalytics() {
  const totalMarkets = await db.market.count();
  const totalBets = await db.bet.count();
  const totalUsers = await db.user.count();
  const totalPayouts = await db.payout.count();

  // Calculate total volume from all bets
  const volumeAgg = await db.bet.aggregate({ _sum: { amount: true } });

  // Top 5 markets by pool size
  const topMarkets = await db.market.findMany({
    take: 5,
    orderBy: { totalPool: "desc" },
    select: { id: true, title: true, totalPool: true, endTime: true },
  });

  // Top 5 users by total payout amount
  const topUsers = await db.user.findMany({ take: 5, orderBy: { createdAt: "desc" }, include: { payouts: true } });

  return {
    totalMarkets,
    totalBets,
    totalUsers,
    totalPayouts,
    totalVolume: volumeAgg._sum.amount ?? 0,
    topMarkets,
    topUsers,
  };
}
