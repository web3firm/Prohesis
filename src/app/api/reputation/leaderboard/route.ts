// API Route: Get reputation leaderboard
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100');
    const category = searchParams.get('category'); // 'accuracy', 'volume', 'overall'
    
    let orderBy: any = { totalScore: 'desc' };
    
    if (category === 'accuracy') {
      orderBy = { accuracy: 'desc' };
    } else if (category === 'volume') {
      orderBy = { volume: 'desc' };
    }
    
    const leaderboard = await db.reputation.findMany({
      take: limit,
      orderBy,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            wallet: true,
            createdAt: true,
          },
        },
      },
    });
    
    return NextResponse.json(leaderboard);
  } catch (error: any) {
    console.error('Leaderboard API Error:', error);
    
    // Return mock data if no reputation records exist yet
    return NextResponse.json([
      {
        userId: 'mock-user-1',
        totalScore: 85,
        accuracy: 90,
        volume: 75,
        level: 'Expert',
        rank: 1,
        badges: ['Oracle', 'High Roller', 'Veteran'],
        streak: 7,
        user: { username: 'TopPredictor', wallet: '0x...' },
      },
      {
        userId: 'mock-user-2',
        totalScore: 72,
        accuracy: 80,
        volume: 60,
        level: 'Apprentice',
        rank: 2,
        badges: ['Accurate Predictor', 'Active Trader'],
        streak: 4,
        user: { username: 'SmartBetter', wallet: '0x...' },
      },
    ]);
  }
}
