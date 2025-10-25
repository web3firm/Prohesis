// API Route: Calculate and return user reputation
import { NextRequest, NextResponse } from 'next/server';
import { reputationEngine } from '@/lib/reputation/engine';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const wallet = searchParams.get('wallet');
    
    const targetId = userId || wallet;
    
    if (!targetId) {
      return NextResponse.json(
        { error: 'User ID or wallet is required' },
        { status: 400 }
      );
    }
    
    // Calculate reputation
    const reputation = await reputationEngine.calculateReputation(targetId);
    
    return NextResponse.json(reputation);
  } catch (error: any) {
    console.error('Reputation API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to calculate reputation' },
      { status: 500 }
    );
  }
}
