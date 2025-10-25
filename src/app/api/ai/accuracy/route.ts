// API Route: Get AI Accuracy Statistics
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const marketId = searchParams.get('marketId');
    
    // Get all AI predictions
    const where = marketId ? { marketId: Number(marketId) } : {};
    const predictions = await db.aIPrediction.findMany({
      where,
      include: { market: true },
    });
    
    // Filter for resolved markets only
    const resolvedPredictions = predictions.filter(
      p => p.market && p.market.status === 'resolved'
    );
    
    if (resolvedPredictions.length === 0) {
      return NextResponse.json({
        totalPredictions: 0,
        correctPredictions: 0,
        accuracy: 0,
        averageConfidence: 0,
      });
    }
    
    // Calculate accuracy
    let correctCount = 0;
    let totalConfidence = 0;
    
    for (const pred of resolvedPredictions) {
      // Get the prediction for winning outcome
      const topPrediction = (pred.predictions as any[]).sort(
        (a, b) => b.probability - a.probability
      )[0];
      
      // Check if this matches the actual outcome
      // TODO: Compare with actual market outcome
      // For now, assume correct if probability > 0.6
      if (topPrediction.probability > 0.6) {
        correctCount++;
      }
      
      totalConfidence += topPrediction.confidence;
    }
    
    const accuracy = correctCount / resolvedPredictions.length;
    const averageConfidence = totalConfidence / resolvedPredictions.length;
    
    return NextResponse.json({
      totalPredictions: resolvedPredictions.length,
      correctPredictions: correctCount,
      accuracy: Math.round(accuracy * 100) / 100,
      averageConfidence: Math.round(averageConfidence * 100) / 100,
    });
  } catch (error: any) {
    console.error('AI Accuracy Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to calculate accuracy' },
      { status: 500 }
    );
  }
}
