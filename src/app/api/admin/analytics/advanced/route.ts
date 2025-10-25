import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/middleware";
import db from "@/lib/offchain/services/dbClient";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period') || '30d'; // 7d, 30d, 90d, 1y
    const metric = searchParams.get('metric'); // users, markets, bets, volume

    // Calculate date range
    const now = new Date();
    const startDate = new Date();
    let groupBy = 'day';

    switch (period) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        groupBy = 'day';
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        groupBy = 'day';
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        groupBy = 'week';
        break;
      case '1y':
        startDate.setFullYear(now.getFullYear() - 1);
        groupBy = 'month';
        break;
      default:
        startDate.setDate(now.getDate() - 30);
    }

    // Get time-series data
    const timeSeriesData = await getTimeSeriesData(startDate, groupBy, metric);
    
    // Get top performers
    const [topMarketsByVolume, topMarketsByBets, topUsersByVolume, topUsersByBets] = await Promise.all([
      db.market.findMany({
        take: 10,
        orderBy: [
          { yesPool: 'desc' },
          { noPool: 'desc' }
        ],
        select: {
          id: true,
          title: true,
          yesPool: true,
          noPool: true,
          _count: { select: { bets: true } }
        }
      }).then(markets => markets.map(m => ({
        ...m,
        totalVolume: (Number(m.yesPool) + Number(m.noPool)).toFixed(4)
      }))),

      db.market.findMany({
        take: 10,
        select: {
          id: true,
          title: true,
          _count: { select: { bets: true } }
        },
        orderBy: {
          bets: { _count: 'desc' }
        }
      }),

      getUsersByVolume(),
      getUsersByBetCount(),
    ]);

    // Get category breakdown
    const categoryStats = await getCategoryStats();

    // Get conversion funnel
    const funnelData = await getFunnelData();

    return NextResponse.json({
      success: true,
      timeSeries: timeSeriesData,
      topPerformers: {
        marketsByVolume: topMarketsByVolume,
        marketsByBets: topMarketsByBets,
        usersByVolume: topUsersByVolume,
        usersByBets: topUsersByBets,
      },
      categories: categoryStats,
      funnel: funnelData,
    });
  } catch (error: any) {
    console.error("Admin analytics error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch analytics" },
      { status: error.message?.includes("Unauthorized") ? 401 : 500 }
    );
  }
}

async function getTimeSeriesData(startDate: Date, groupBy: string, metric?: string | null) {
  // Generate date buckets
  const buckets: { date: Date; users: number; markets: number; bets: number; volume: number }[] = [];
  const now = new Date();
  let currentDate = new Date(startDate);

  while (currentDate <= now) {
    const nextDate = new Date(currentDate);
    if (groupBy === 'day') {
      nextDate.setDate(nextDate.getDate() + 1);
    } else if (groupBy === 'week') {
      nextDate.setDate(nextDate.getDate() + 7);
    } else if (groupBy === 'month') {
      nextDate.setMonth(nextDate.getMonth() + 1);
    }

    const [users, markets, bets, volume] = await Promise.all([
      db.user.count({
        where: {
          createdAt: {
            gte: currentDate,
            lt: nextDate,
          }
        }
      }),
      db.market.count({
        where: {
          createdAt: {
            gte: currentDate,
            lt: nextDate,
          }
        }
      }),
      db.bet.count({
        where: {
          createdAt: {
            gte: currentDate,
            lt: nextDate,
          }
        }
      }),
      db.bet.aggregate({
        where: {
          createdAt: {
            gte: currentDate,
            lt: nextDate,
          }
        },
        _sum: { amount: true }
      }).then(r => r._sum.amount || 0),
    ]);

    buckets.push({
      date: new Date(currentDate),
      users,
      markets,
      bets,
      volume: Number(volume),
    });

    currentDate = nextDate;
  }

  return buckets;
}

async function getUsersByVolume() {
  const users = await db.user.findMany({
    take: 10,
    select: {
      id: true,
      username: true,
      wallet: true,
    }
  });

  const usersWithVolume = await Promise.all(
    users.map(async (user) => {
      const volume = await db.bet.aggregate({
        where: { userId: user.id },
        _sum: { amount: true }
      });

      return {
        ...user,
        volume: volume._sum.amount || 0,
      };
    })
  );

  return usersWithVolume
    .sort((a, b) => Number(b.volume) - Number(a.volume))
    .slice(0, 10);
}

async function getUsersByBetCount() {
  return db.user.findMany({
    take: 10,
    select: {
      id: true,
      username: true,
      wallet: true,
      _count: { select: { bets: true } }
    },
    orderBy: {
      bets: { _count: 'desc' }
    }
  });
}

async function getCategoryStats() {
  // Mock data - in production, you'd have categories in the market model
  return {
    crypto: 45,
    sports: 30,
    politics: 15,
    entertainment: 10,
  };
}

async function getFunnelData() {
  const [totalVisitors, totalSignups, totalBettors, totalCreators] = await Promise.all([
    db.user.count(), // Proxy for visitors
    db.user.count(),
    db.user.count({
      where: {
        bets: {
          some: {}
        }
      }
    }),
    db.user.count({
      where: {
        markets: {
          some: {}
        }
      }
    }),
  ]);

  return {
    visitors: totalVisitors * 10, // Assume 10x visitors to signups
    signups: totalSignups,
    bettors: totalBettors,
    creators: totalCreators,
  };
}
