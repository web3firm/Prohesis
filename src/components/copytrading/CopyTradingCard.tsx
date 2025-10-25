'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/Button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Users, TrendingUp, Copy, Settings } from 'lucide-react';

interface CopyTradingStats {
  totalFollowers: number;
  totalFollowing: number;
  totalCopiedBets: number;
  totalCopiedVolume: number;
}

interface FollowData {
  id: number;
  followingId: string;
  autoCopy: boolean;
  following?: {
    username: string | null;
    wallet: string | null;
  };
}

export default function CopyTradingCard({ userId }: { userId: string }) {
  const [stats, setStats] = useState<CopyTradingStats | null>(null);
  const [following, setFollowing] = useState<FollowData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const fetchData = async () => {
    try {
      const [statsRes, followingRes] = await Promise.all([
        fetch(`/api/copytrading/stats?userId=${userId}`),
        fetch(`/api/copytrading/list?userId=${userId}&type=following`),
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      if (followingRes.ok) {
        const followingData = await followingRes.json();
        setFollowing(followingData);
      }
    } catch (err) {
      console.error('Failed to fetch copy trading data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          Loading copy trading stats...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats Overview */}
      <Card className="border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-cyan-500/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Copy className="h-5 w-5 text-blue-400" />
            Copy Trading
          </CardTitle>
          <CardDescription>Follow top traders and auto-copy their bets</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-lg border bg-background/60 p-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Users className="h-3 w-3" />
                Followers
              </div>
              <div className="mt-1 text-2xl font-bold">{stats?.totalFollowers || 0}</div>
            </div>
            <div className="rounded-lg border bg-background/60 p-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Users className="h-3 w-3" />
                Following
              </div>
              <div className="mt-1 text-2xl font-bold">{stats?.totalFollowing || 0}</div>
            </div>
            <div className="rounded-lg border bg-background/60 p-3">
              <div className="text-xs text-muted-foreground">Copied Bets</div>
              <div className="mt-1 text-2xl font-bold">{stats?.totalCopiedBets || 0}</div>
            </div>
            <div className="rounded-lg border bg-background/60 p-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <TrendingUp className="h-3 w-3" />
                Volume
              </div>
              <div className="mt-1 text-2xl font-bold">
                {stats?.totalCopiedVolume.toFixed(2) || '0.00'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Following List */}
      {following.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Following ({following.length})</CardTitle>
            <CardDescription>Traders you are currently following</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {following.map((f) => (
                <div
                  key={f.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>
                        {f.following?.username?.[0]?.toUpperCase() || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">
                        {f.following?.username ||
                          `${f.following?.wallet?.slice(0, 6)}...${f.following?.wallet?.slice(-4)}`}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {f.autoCopy ? (
                          <Badge variant="default" className="text-xs">
                            Auto-Copy ON
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">
                            Auto-Copy OFF
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button variant="outline" className="p-2">
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
