import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/middleware";
import db from "@/lib/offchain/services/dbClient";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status'); // 'active', 'banned'
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    
    if (search) {
      where.OR = [
        { username: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { wallet: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status === 'banned') {
      where.banned = true;
    } else if (status === 'active') {
      where.banned = false;
    }

    // Fetch users with pagination
    const [users, total] = await Promise.all([
      db.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              bets: true,
              markets: true,
              followers: true,
              following: true,
            }
          }
        }
      }),
      db.user.count({ where }),
    ]);

    // Get bet volume for each user
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const betVolume = await db.bet.aggregate({
          where: { userId: user.id },
          _sum: { amount: true }
        });

        return {
          id: user.id,
          username: user.username,
          email: user.email,
          wallet: user.wallet,
          createdAt: user.createdAt,
          banned: (user as any).banned || false,
          stats: {
            bets: user._count.bets,
            marketsCreated: user._count.markets,
            followers: user._count.followers,
            following: user._count.following,
            volume: betVolume._sum.amount || 0,
          }
        };
      })
    );

    return NextResponse.json({
      success: true,
      users: usersWithStats,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      }
    });
  } catch (error: any) {
    console.error("Admin users list error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch users" },
      { status: error.message?.includes("Unauthorized") ? 401 : 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await req.json();
    const { userId, action } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "User ID required" },
        { status: 400 }
      );
    }

    switch (action) {
      case 'ban':
        await db.user.update({
          where: { id: userId },
          data: { banned: true }
        });
        
        // Log audit
        await db.audit.create({
          data: {
            action: 'USER_BANNED',
            actor: admin.email || admin.wallet || 'admin',
            metadata: { userId, adminId: admin.adminId }
          }
        });
        break;

      case 'unban':
        await db.user.update({
          where: { id: userId },
          data: { banned: false }
        });
        
        await db.audit.create({
          data: {
            action: 'USER_UNBANNED',
            actor: admin.email || admin.wallet || 'admin',
            metadata: { userId, adminId: admin.adminId }
          }
        });
        break;

      case 'delete':
        // Soft delete - mark as deleted
        await db.user.update({
          where: { id: userId },
          data: { banned: true }
        });
        
        await db.audit.create({
          data: {
            action: 'USER_DELETED',
            actor: admin.email || admin.wallet || 'admin',
            metadata: { userId, adminId: admin.adminId }
          }
        });
        break;

      default:
        return NextResponse.json(
          { success: false, error: "Invalid action" },
          { status: 400 }
        );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Admin user action error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to perform action" },
      { status: error.message?.includes("Unauthorized") ? 401 : 500 }
    );
  }
}
