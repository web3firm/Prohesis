import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/middleware";
import db from "@/lib/offchain/services/dbClient";

export async function GET(req: Request) {
  try {
    await requireAdmin();

    // Get comprehensive dashboard stats
    const [
      totalUsers,
      totalMarkets,
      totalBets,
      totalVolume,
      activeMarkets,
      resolvedMarkets,
      pendingMarkets,
      todayUsers,
      todayMarkets,
      todayBets,
      todayVolume,
      recentUsers,
      recentMarkets,
      recentBets,
      recentAudits,
    ] = await Promise.all([
      // Total counts
      db.user.count(),
      db.market.count(),
      db.bet.count(),
      db.bet.aggregate({ _sum: { amount: true } }).then(r => r._sum.amount || 0),
      
      // Market status counts
      db.market.count({ where: { status: 'open' } }),
      db.market.count({ where: { status: 'resolved' } }),
      db.market.count({ where: { 
        endTime: { lt: new Date() },
        status: { not: 'resolved' }
      }}),
      
      // Today's stats (last 24 hours)
      db.user.count({ 
        where: { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }
      }),
      db.market.count({ 
        where: { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }
      }),
      db.bet.count({ 
        where: { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }
      }),
      db.bet.aggregate({ 
        where: { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
        _sum: { amount: true }
      }).then(r => r._sum.amount || 0),
      
      // Recent activity
      db.user.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          username: true,
          email: true,
          wallet: true,
          createdAt: true,
        } as any
      }),
      db.market.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          status: true,
          createdAt: true,
          yesPool: true,
          noPool: true,
        }
      }),
      db.bet.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { username: true, wallet: true } as any },
          market: { select: { title: true } }
        }
      }),
      db.audit.findMany({
        take: 20,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    // Calculate growth rates
    const weekAgoUsers = await db.user.count({
      where: { createdAt: { lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }
    });
    const userGrowthRate = weekAgoUsers > 0 
      ? ((totalUsers - weekAgoUsers) / weekAgoUsers * 100).toFixed(1)
      : '0';

    const weekAgoMarkets = await db.market.count({
      where: { createdAt: { lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }
    });
    const marketGrowthRate = weekAgoMarkets > 0
      ? ((totalMarkets - weekAgoMarkets) / weekAgoMarkets * 100).toFixed(1)
      : '0';

    return NextResponse.json({
      success: true,
      stats: {
        total: {
          users: totalUsers,
          markets: totalMarkets,
          bets: totalBets,
          volume: totalVolume,
        },
        markets: {
          active: activeMarkets,
          resolved: resolvedMarkets,
          pending: pendingMarkets,
        },
        today: {
          users: todayUsers,
          markets: todayMarkets,
          bets: todayBets,
          volume: todayVolume,
        },
        growth: {
          users: userGrowthRate,
          markets: marketGrowthRate,
        },
        recent: {
          users: recentUsers,
          markets: recentMarkets,
          bets: recentBets,
          audits: recentAudits,
        }
      }
    });
  } catch (error: any) {
    console.error("Admin dashboard error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch dashboard data" },
      { status: error.message?.includes("Unauthorized") ? 401 : 500 }
    );
  }
}
