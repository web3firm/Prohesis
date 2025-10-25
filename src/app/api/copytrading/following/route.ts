// API Route: Get following list
import { NextRequest, NextResponse } from 'next/server';
import { copyTradingService } from '@/lib/copytrading/service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    const following = await copyTradingService.getFollowing(userId);

    return NextResponse.json(following);
  } catch (error: any) {
    console.error('Get Following Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get following list' },
      { status: 500 }
    );
  }
}
