// API Route: Claim referral rewards
import { NextRequest, NextResponse } from 'next/server';
import { referralService } from '@/lib/referrals/service';

export async function POST(request: NextRequest) {
  try {
    const { userId, rewardIds } = await request.json();

    if (!userId || !rewardIds || !Array.isArray(rewardIds)) {
      return NextResponse.json(
        { error: 'userId and rewardIds array are required' },
        { status: 400 }
      );
    }

    const totalAmount = await referralService.claimRewards(userId, rewardIds);

    return NextResponse.json({ success: true, amount: totalAmount });
  } catch (error: any) {
    console.error('Claim Rewards Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to claim rewards' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const rewards = await referralService.getUnclaimedRewards(userId);

    return NextResponse.json(rewards);
  } catch (error: any) {
    console.error('Get Unclaimed Rewards Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get unclaimed rewards' },
      { status: 500 }
    );
  }
}
