// API Route: Check and award new badges
import { NextRequest, NextResponse } from 'next/server';
import { badgeService } from '@/lib/badges/service';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const newBadges = await badgeService.checkAndAwardBadges(userId);

    return NextResponse.json({ newBadges, count: newBadges.length });
  } catch (error: any) {
    console.error('Award Badges Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to award badges' },
      { status: 500 }
    );
  }
}
