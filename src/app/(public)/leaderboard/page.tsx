'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Trophy, 
  Medal, 
  TrendingUp, 
  Target, 
  Crown,
  Loader2
} from 'lucide-react';
import Link from 'next/link';

interface LeaderboardEntry {
  userId: string;
  totalScore: number;
  accuracy: number;
  volume: number;
  level: string;
  rank: number | null;
  badges: string[];
  streak: number;
  user: {
    id: string;
    username: string | null;
    wallet: string | null;
  };
}

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('overall');

  useEffect(() => {
    fetchLeaderboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchLeaderboard = async () => {
    setLoading(true);

    try {
      const res = await fetch(`/api/reputation/leaderboard?category=${category}&limit=50`);
      
      if (res.ok) {
        const data = await res.json();
        setLeaderboard(data);
      }
    } catch (err) {
      console.error('Failed to fetch leaderboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (index: number) => {
    if (index === 0) return <Trophy className="h-5 w-5 text-yellow-500" />;
    if (index === 1) return <Medal className="h-5 w-5 text-gray-400" />;
    if (index === 2) return <Medal className="h-5 w-5 text-orange-600" />;
    return <span className="text-sm font-semibold text-muted-foreground">#{index + 1}</span>;
  };

  const getLevelColor = (level: string) => {
    const colors: Record<string, string> = {
      Novice: 'text-gray-400',
      Apprentice: 'text-green-400',
      Expert: 'text-blue-400',
      Master: 'text-purple-400',
      Grandmaster: 'text-yellow-400',
      Legend: 'text-red-400',
    };
    return colors[level] || colors.Novice;
  };

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8">
        <h1 className="mb-2 text-4xl font-bold">Leaderboard</h1>
        <p className="text-muted-foreground">
          Top predictors ranked by reputation score
        </p>
      </div>

      <Tabs value={category} onValueChange={setCategory} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overall">
            <Trophy className="mr-2 h-4 w-4" />
            Overall
          </TabsTrigger>
          <TabsTrigger value="accuracy">
            <Target className="mr-2 h-4 w-4" />
            Accuracy
          </TabsTrigger>
          <TabsTrigger value="volume">
            <TrendingUp className="mr-2 h-4 w-4" />
            Volume
          </TabsTrigger>
        </TabsList>

        <TabsContent value={category} className="space-y-4">
          {loading ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </CardContent>
            </Card>
          ) : leaderboard.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                No leaderboard data available yet
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {leaderboard.map((entry, index) => (
                <Card 
                  key={entry.userId}
                  className={index < 3 ? 'border-yellow-500/20 bg-gradient-to-r from-yellow-500/5 to-transparent' : ''}
                >
                  <CardContent className="flex items-center gap-4 p-4">
                    {/* Rank */}
                    <div className="flex w-12 items-center justify-center">
                      {getRankIcon(index)}
                    </div>

                    {/* Avatar */}
                    <Avatar className="h-12 w-12">
                      <AvatarFallback>
                        {entry.user.username?.[0]?.toUpperCase() || '?'}
                      </AvatarFallback>
                    </Avatar>

                    {/* User Info */}
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <Link 
                          href={`/profile/${entry.user.wallet || entry.userId}`}
                          className="font-semibold hover:underline"
                        >
                          {entry.user.username || `${entry.user.wallet?.slice(0, 6)}...${entry.user.wallet?.slice(-4)}`}
                        </Link>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${getLevelColor(entry.level)}`}
                        >
                          <Crown className="mr-1 h-3 w-3" />
                          {entry.level}
                        </Badge>
                      </div>
                      
                      {entry.badges.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {entry.badges.slice(0, 3).map((badge, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {badge}
                            </Badge>
                          ))}
                          {entry.badges.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{entry.badges.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Stats */}
                    <div className="text-right space-y-1">
                      <div className="text-2xl font-bold text-yellow-500">
                        {Math.round(category === 'overall' ? entry.totalScore : 
                           category === 'accuracy' ? entry.accuracy : entry.volume)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {category === 'overall' && 'Total Score'}
                        {category === 'accuracy' && 'Accuracy'}
                        {category === 'volume' && 'Volume'}
                      </div>
                    </div>

                    {/* Streak */}
                    {entry.streak > 0 && (
                      <Badge variant="outline" className="border-orange-500/50 text-orange-500">
                        🔥 {entry.streak}
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
