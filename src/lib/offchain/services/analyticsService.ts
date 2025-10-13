import prisma from "@/lib/offchain/services/dbClient";

export async function getAnalytics() {
  const totalMarkets = await prisma.market.count();
  const totalBets = await prisma.bet.count();
  const totalUsers = await prisma.user.count();
  const totalPayouts = await prisma.payout.count();

  // Calculate total volume from all bets
  const volumeAgg = await prisma.bet.aggregate({
    _sum: { amount: true },
  });

  // Top 5 markets by pool size
  const topMarkets = await prisma.market.findMany({
    take: 5,
    orderBy: { totalPool: "desc" },
    select: {
      id: true,
      title: true,
      totalPool: true,
      endTime: true,
    },
  });

  // Top 5 users by total payout amount
  const topUsers = await prisma.user.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    include: {
      payouts: true,
    },
  });

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
