// API Route: Store AI Predictions
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const prediction = await request.json();
    
    // Store prediction in database
    const stored = await db.aIPrediction.create({
      data: {
        marketId: prediction.marketId,
        model: prediction.model,
        predictions: prediction.predictions,
        analysis: prediction.analysis,
        dataPoints: prediction.dataPoints,
        timestamp: new Date(prediction.timestamp),
      },
    });
    
    return NextResponse.json({ success: true, id: stored.id });
  } catch (error: any) {
    console.error('Store Prediction Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to store prediction' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const marketId = searchParams.get('marketId');
    const limit = parseInt(searchParams.get('limit') || '10');
    
    const where = marketId ? { marketId: Number(marketId) } : {};
    
    const predictions = await db.aIPrediction.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: limit,
    });
    
    return NextResponse.json(predictions);
  } catch (error: any) {
    console.error('Get Predictions Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch predictions' },
      { status: 500 }
    );
  }
}
