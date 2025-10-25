// API Route: Get user's following/followers
import { NextRequest, NextResponse } from 'next/server';
import { copyTradingService } from '@/lib/copytrading/service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const type = searchParams.get('type') || 'following'; // 'following' or 'followers'

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    if (type === 'followers') {
      const followers = await copyTradingService.getFollowers(userId);
      return NextResponse.json(followers);
    } else {
      const following = await copyTradingService.getFollowing(userId);
      return NextResponse.json(following);
    }
  } catch (err: any) {
    console.error('Get follows error:', err);
    return NextResponse.json({ error: err.message || 'Failed to get follows' }, { status: 500 });
  }
}
