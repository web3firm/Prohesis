// API Route: Copy trading stats
import { NextRequest, NextResponse } from 'next/server';
import { copyTradingService } from '@/lib/copytrading/service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const stats = await copyTradingService.getStats(userId);

    return NextResponse.json(stats);
  } catch (err: any) {
    console.error('Get copy trading stats error:', err);
    return NextResponse.json({ error: err.message || 'Failed to get stats' }, { status: 500 });
  }
}
