'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Trophy, 
  TrendingUp, 
  Award, 
  Target, 
  Flame,
  Star,
  Crown,
  Loader2
} from 'lucide-react';

interface ReputationData {
  userId: string;
  totalScore: number;
  accuracy: number;
  volume: number;
  longevity: number;
  marketCreation: number;
  socialImpact: number;
  level: string;
  rank: number | null;
  badges: string[];
  streak: number;
}

interface ReputationCardProps {
  userId: string;
  wallet?: string;
}

export function ReputationCard({ userId, wallet }: ReputationCardProps) {
  const [reputation, setReputation] = useState<ReputationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userId) {
      fetchReputation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const fetchReputation = async () => {
    setLoading(true);
    setError(null);

    try {
      const query = userId ? `userId=${userId}` : `wallet=${wallet}`;
      const res = await fetch(`/api/reputation/calculate?${query}`);

      if (!res.ok) {
        throw new Error('Failed to fetch reputation');
      }

      const data = await res.json();
      setReputation(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load reputation');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Reputation
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (error || !reputation) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Reputation
          </CardTitle>
          <CardDescription>
            {error || 'No reputation data available'}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const getLevelColor = (level: string) => {
    const colors: Record<string, string> = {
      Novice: 'text-gray-400 border-gray-400',
      Apprentice: 'text-green-400 border-green-400',
      Expert: 'text-blue-400 border-blue-400',
      Master: 'text-purple-400 border-purple-400',
      Grandmaster: 'text-yellow-400 border-yellow-400',
      Legend: 'text-red-400 border-red-400',
    };
    return colors[level] || colors.Novice;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Reputation
          </CardTitle>
          <Badge variant="outline" className={getLevelColor(reputation.level)}>
            <Crown className="mr-1 h-3 w-3" />
            {reputation.level}
          </Badge>
        </div>
        <CardDescription>
          {reputation.rank && `Global Rank: #${reputation.rank}`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Total Score */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Overall Score</span>
            <span className="text-2xl font-bold text-yellow-500">
              {Math.round(reputation.totalScore)}
            </span>
          </div>
          <Progress value={reputation.totalScore} className="h-2" />
        </div>

        {/* Score Breakdown */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold">Score Breakdown</h4>
          
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-green-500" />
                <span className="text-muted-foreground">Accuracy</span>
              </div>
              <span className="font-medium">{Math.round(reputation.accuracy)}/100</span>
            </div>
            <Progress value={reputation.accuracy} className="h-1" />
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-500" />
                <span className="text-muted-foreground">Volume</span>
              </div>
              <span className="font-medium">{Math.round(reputation.volume)}/100</span>
            </div>
            <Progress value={reputation.volume} className="h-1" />
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-purple-500" />
                <span className="text-muted-foreground">Longevity</span>
              </div>
              <span className="font-medium">{Math.round(reputation.longevity)}/100</span>
            </div>
            <Progress value={reputation.longevity} className="h-1" />
          </div>
        </div>

        {/* Streak */}
        {reputation.streak > 0 && (
          <div className="rounded-lg border border-orange-500/20 bg-orange-500/10 p-3">
            <div className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-orange-500" />
              <span className="font-semibold text-orange-500">
                {reputation.streak} Win Streak
              </span>
            </div>
          </div>
        )}

        {/* Badges */}
        {reputation.badges.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <Award className="h-4 w-4 text-yellow-500" />
              Achievements
            </h4>
            <div className="flex flex-wrap gap-2">
              {reputation.badges.map((badge, i) => (
                <Badge key={i} variant="secondary" className="text-xs">
                  {badge}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
