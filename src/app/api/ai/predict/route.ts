// API Route: Get AI Prediction for a market
import { NextRequest, NextResponse } from 'next/server';
import { aiPredictor } from '@/lib/ai/predictor';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { marketId } = await request.json();
    
    if (!marketId) {
      return NextResponse.json(
        { error: 'Market ID is required' },
        { status: 400 }
      );
    }
    
    // Fetch market details
    const market = await db.market.findUnique({
      where: { id: Number(marketId) },
    });
    
    if (!market) {
      return NextResponse.json(
        { error: 'Market not found' },
        { status: 404 }
      );
    }
    
    // Get AI prediction
    const prediction = await aiPredictor.getPrediction({
      marketId: market.id,
      title: market.title,
      description: market.description || undefined,
      endTime: market.endTime,
      category: market.category || undefined,
      outcomes: ['Yes', 'No'], // TODO: Get from market metadata
      currentPools: [Number(market.yesPool || 0), Number(market.noPool || 0)],
    });
    
    // Store prediction
    await aiPredictor.storePrediction(prediction);
    
    return NextResponse.json(prediction);
  } catch (error: any) {
    console.error('AI Prediction API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate prediction' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const marketId = searchParams.get('marketId');
    
    if (!marketId) {
      return NextResponse.json(
        { error: 'Market ID is required' },
        { status: 400 }
      );
    }
    
    // Check if we have a recent prediction (within last hour)
    const recentPrediction = await db.aIPrediction.findFirst({
      where: {
        marketId: Number(marketId),
        timestamp: {
          gte: new Date(Date.now() - 60 * 60 * 1000), // Last hour
        },
      },
      orderBy: { timestamp: 'desc' },
    });
    
    if (recentPrediction) {
      return NextResponse.json(recentPrediction);
    }
    
    return NextResponse.json(
      { error: 'No recent prediction found. Request a new one.' },
      { status: 404 }
    );
  } catch (error: any) {
    console.error('Get AI Prediction Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch prediction' },
      { status: 500 }
    );
  }
}
