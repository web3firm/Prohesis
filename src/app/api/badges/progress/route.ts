// API Route: Get badge progress
import { NextRequest, NextResponse } from 'next/server';
import { badgeService } from '@/lib/badges/service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const progress = await badgeService.getBadgeProgress(userId);

    return NextResponse.json(progress);
  } catch (error: any) {
    console.error('Get Badge Progress Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get badge progress' },
      { status: 500 }
    );
  }
}
