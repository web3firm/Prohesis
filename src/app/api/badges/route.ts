// API Route: Get user badges
import { NextRequest, NextResponse } from 'next/server';
import { badgeService } from '@/lib/badges/service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const badges = await badgeService.getUserBadges(userId);

    return NextResponse.json(badges);
  } catch (error: any) {
    console.error('Get Badges Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get badges' },
      { status: 500 }
    );
  }
}
