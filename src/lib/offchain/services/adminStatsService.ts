import prisma from "@/lib/offchain/services/dbClient";

export async function getAdminStats() {
  // Aggregate data that actually exists in your schema
  const [totalMarkets, totalBets, totalPayouts, recentUsers] = await Promise.all([
    prisma.market.count(),
    prisma.bet.count(),
    prisma.payout.count(),
    prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        displayName: true,
        email: true,
        createdAt: true,
      },
    }),
  ]);

  return {
    totalMarkets,
    totalBets,
    totalPayouts,
    recentUsers,
  };
}
