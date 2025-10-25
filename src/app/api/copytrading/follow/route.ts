// API Route: Follow/unfollow traders
import { NextRequest, NextResponse } from 'next/server';
import { copyTradingService } from '@/lib/copytrading/service';

export async function POST(request: NextRequest) {
  try {
    const { followerId, followingId, autoCopy, copyAmount, copyPercent } = await request.json();

    if (!followerId || !followingId) {
      return NextResponse.json({ error: 'followerId and followingId are required' }, { status: 400 });
    }

    const follow = await copyTradingService.followTrader(followerId, followingId, {
      autoCopy,
      copyAmount,
      copyPercent,
    });

    return NextResponse.json(follow);
  } catch (err: any) {
    console.error('Follow trader error:', err);
    return NextResponse.json({ error: err.message || 'Failed to follow trader' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { followerId, followingId } = await request.json();

    if (!followerId || !followingId) {
      return NextResponse.json({ error: 'followerId and followingId are required' }, { status: 400 });
    }

    await copyTradingService.unfollowTrader(followerId, followingId);

    return NextResponse.json({ success: true, message: 'Unfollowed successfully' });
  } catch (err: any) {
    console.error('Unfollow trader error:', err);
    return NextResponse.json({ error: err.message || 'Failed to unfollow trader' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { followerId, followingId, autoCopy, copyAmount, copyPercent } = await request.json();

    if (!followerId || !followingId) {
      return NextResponse.json({ error: 'followerId and followingId are required' }, { status: 400 });
    }

    const follow = await copyTradingService.updateCopySettings(followerId, followingId, {
      autoCopy,
      copyAmount,
      copyPercent,
    });

    return NextResponse.json(follow);
  } catch (err: any) {
    console.error('Update copy settings error:', err);
    return NextResponse.json({ error: err.message || 'Failed to update copy settings' }, { status: 500 });
  }
}
