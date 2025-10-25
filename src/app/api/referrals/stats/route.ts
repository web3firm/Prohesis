// API Route: Get referral stats
import { NextRequest, NextResponse } from 'next/server';
import { referralService } from '@/lib/referrals/service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const stats = await referralService.getReferralStats(userId);

    return NextResponse.json(stats);
  } catch (error: any) {
    console.error('Get Referral Stats Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get referral stats' },
      { status: 500 }
    );
  }
}
