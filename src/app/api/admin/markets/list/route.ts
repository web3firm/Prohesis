import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/middleware";
import db from "@/lib/offchain/services/dbClient";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status'); // 'open', 'resolved', 'pending'
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    
    if (search) {
      where.title = { contains: search, mode: 'insensitive' };
    }

    if (status === 'open') {
      where.status = 'open';
    } else if (status === 'resolved') {
      where.status = 'resolved';
    } else if (status === 'pending') {
      where.AND = [
        { endTime: { lt: new Date() } },
        { status: { not: 'resolved' } }
      ];
    }

    // Fetch markets with pagination
    const [markets, total] = await Promise.all([
      db.market.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          creator: {
            select: {
              username: true,
              wallet: true,
            }
          },
          _count: {
            select: {
              bets: true,
            }
          }
        }
      }),
      db.market.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      markets,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      }
    });
  } catch (error: any) {
    console.error("Admin markets list error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch markets" },
      { status: error.message?.includes("Unauthorized") ? 401 : 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await req.json();
    const { marketId, action, data } = body;

    if (!marketId) {
      return NextResponse.json(
        { success: false, error: "Market ID required" },
        { status: 400 }
      );
    }

    switch (action) {
      case 'pause':
        await db.market.update({
          where: { id: marketId },
          data: { status: 'paused' }
        });
        
        await db.audit.create({
          data: {
            action: 'MARKET_PAUSED',
            actor: admin.email || admin.wallet || 'admin',
            metadata: { marketId, adminId: admin.adminId }
          }
        });
        break;

      case 'resume':
        await db.market.update({
          where: { id: marketId },
          data: { status: 'open' }
        });
        
        await db.audit.create({
          data: {
            action: 'MARKET_RESUMED',
            actor: admin.email || admin.wallet || 'admin',
            metadata: { marketId, adminId: admin.adminId }
          }
        });
        break;

      case 'resolve':
        if (data?.winningOutcome === undefined) {
          return NextResponse.json(
            { success: false, error: "Winning outcome required" },
            { status: 400 }
          );
        }

        await db.market.update({
          where: { id: marketId },
          data: { 
            status: 'resolved',
            winningOutcome: data.winningOutcome,
            resolvedAt: new Date(),
          }
        });
        
        await db.audit.create({
          data: {
            action: 'MARKET_RESOLVED',
            actor: admin.email || admin.wallet || 'admin',
            metadata: { 
              marketId, 
              winningOutcome: data.winningOutcome,
              adminId: admin.adminId 
            }
          }
        });
        break;

      case 'update':
        const updates: any = {};
        if (data?.title) updates.title = data.title;
        if (data?.description) updates.description = data.description;
        if (data?.endTime) updates.endTime = new Date(data.endTime);

        await db.market.update({
          where: { id: marketId },
          data: updates
        });
        
        await db.audit.create({
          data: {
            action: 'MARKET_UPDATED',
            actor: admin.email || admin.wallet || 'admin',
            metadata: { marketId, updates, adminId: admin.adminId }
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
    console.error("Admin market action error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to perform action" },
      { status: error.message?.includes("Unauthorized") ? 401 : 500 }
    );
  }
}
