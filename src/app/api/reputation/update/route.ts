// API Route: Update reputation in database
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const reputation = await request.json();
    
    // Upsert reputation record
    const stored = await db.reputation.upsert({
      where: { userId: reputation.userId },
      update: {
        totalScore: reputation.totalScore,
        accuracy: reputation.accuracy,
        volume: reputation.volume,
        longevity: reputation.longevity,
        marketCreation: reputation.marketCreation,
        socialImpact: reputation.socialImpact,
        level: reputation.level,
        rank: reputation.rank,
        badges: reputation.badges,
        streak: reputation.streak,
        lastUpdated: new Date(),
      },
      create: {
        userId: reputation.userId,
        totalScore: reputation.totalScore,
        accuracy: reputation.accuracy,
        volume: reputation.volume,
        longevity: reputation.longevity,
        marketCreation: reputation.marketCreation,
        socialImpact: reputation.socialImpact,
        level: reputation.level,
        rank: reputation.rank,
        badges: reputation.badges,
        streak: reputation.streak,
        lastUpdated: new Date(),
      },
    });
    
    return NextResponse.json({ success: true, id: stored.id });
  } catch (error: any) {
    console.error('Update Reputation Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update reputation' },
      { status: 500 }
    );
  }
}
