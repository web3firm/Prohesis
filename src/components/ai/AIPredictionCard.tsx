'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Loader2, TrendingUp, Brain, Sparkles } from 'lucide-react';

interface AIPrediction {
  id?: number;
  marketId: number;
  predictions: Array<{
    outcome: string;
    probability: number;
    confidence: number;
    reasoning: string;
  }>;
  analysis: string;
  dataPoints: string[];
  model: string;
  timestamp: string;
}

interface AIPredictionCardProps {
  marketId: number;
  autoFetch?: boolean;
}

export function AIPredictionCard({ marketId, autoFetch = true }: AIPredictionCardProps) {
  const [prediction, setPrediction] = useState<AIPrediction | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (autoFetch) {
      fetchPrediction();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [marketId, autoFetch]);

  const fetchPrediction = async () => {
    setLoading(true);
    setError(null);

    try {
      // First try to get existing prediction
      const getRes = await fetch(`/api/ai/predict?marketId=${marketId}`);
      
      if (getRes.ok) {
        const data = await getRes.json();
        setPrediction(data);
        setLoading(false);
        return;
      }

      // If no recent prediction, generate new one
      const postRes = await fetch('/api/ai/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ marketId }),
      });

      if (!postRes.ok) {
        throw new Error('Failed to generate prediction');
      }

      const data = await postRes.json();
      setPrediction(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load AI prediction');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-pink-500/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-400" />
            AI Prediction
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
        </CardContent>
      </Card>
    );
  }

  if (error || !prediction) {
    return (
      <Card className="border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-pink-500/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-400" />
            AI Prediction
          </CardTitle>
          <CardDescription>
            {error || 'No prediction available'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <button
            onClick={fetchPrediction}
            className="w-full rounded-lg bg-purple-500 px-4 py-2 text-sm font-medium text-white hover:bg-purple-600 transition-colors"
          >
            Generate AI Prediction
          </button>
        </CardContent>
      </Card>
    );
  }

  const topPrediction = [...prediction.predictions].sort(
    (a, b) => b.probability - a.probability
  )[0];

  return (
    <Card className="border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-pink-500/5">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-400" />
            AI Prediction
          </CardTitle>
          <Badge variant="outline" className="border-purple-500/50 text-purple-400">
            <Sparkles className="mr-1 h-3 w-3" />
            {prediction.model}
          </Badge>
        </div>
        <CardDescription>
          Analyzed {prediction.dataPoints.length} data points
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Top Prediction */}
        <div className="rounded-lg border border-purple-500/20 bg-purple-500/10 p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="font-semibold text-purple-400">
              {topPrediction.outcome}
            </span>
            <span className="text-2xl font-bold text-purple-400">
              {Math.round(topPrediction.probability * 100)}%
            </span>
          </div>
          <Progress 
            value={topPrediction.probability * 100} 
            className="h-2 bg-purple-950/50"
          />
          <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
            <TrendingUp className="h-4 w-4" />
            {Math.round(topPrediction.confidence * 100)}% confidence
          </div>
        </div>

        {/* All Predictions */}
        <div className="space-y-2">
          {prediction.predictions.map((pred, i) => (
            <div key={i} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{pred.outcome}</span>
                <span className="font-medium">{Math.round(pred.probability * 100)}%</span>
              </div>
              <Progress value={pred.probability * 100} className="h-1" />
            </div>
          ))}
        </div>

        {/* Analysis */}
        <div className="space-y-2 rounded-lg border border-border/50 bg-background/50 p-3">
          <h4 className="text-sm font-semibold">Analysis</h4>
          <p className="text-sm text-muted-foreground">{prediction.analysis}</p>
        </div>

        {/* Reasoning */}
        <div className="space-y-2 rounded-lg border border-border/50 bg-background/50 p-3">
          <h4 className="text-sm font-semibold">Reasoning</h4>
          <p className="text-sm text-muted-foreground">{topPrediction.reasoning}</p>
        </div>

        <div className="pt-2 text-xs text-muted-foreground text-center">
          Updated {new Date(prediction.timestamp).toLocaleString()}
        </div>
      </CardContent>
    </Card>
  );
}
