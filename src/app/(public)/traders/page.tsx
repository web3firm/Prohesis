'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/Button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/components/ui/Toaster';
import {
  TrendingUp,
  Users,
  Award,
  UserPlus,
  UserMinus,
  Loader2,
  Target,
} from 'lucide-react';

interface TopTrader {
  userId: string;
  username: string | null;
  wallet: string | null;
  followerCount: number;
  totalVolume: number;
}

export default function TopTradersPage() {
  const { address } = useAccount();
  const { addToast } = useToast();
  const [traders, setTraders] = useState<TopTrader[]>([]);
  const [following, setFollowing] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address]);

  const fetchData = async () => {
    try {
      // Get top traders
      const statsRes = await fetch(`/api/copytrading/stats?userId=${address || 'guest'}`);
      if (statsRes.ok) {
        const data = await statsRes.json();
        setTraders(data.topTraders || []);
      }

      // Get user's current following list
      if (address) {
        const followingRes = await fetch(`/api/copytrading/list?userId=${address}&type=following`);
        if (followingRes.ok) {
          const followingData = await followingRes.json();
          setFollowing(followingData.map((f: any) => f.followingId));
        }
      }
    } catch (err) {
      console.error('Failed to fetch traders:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async (traderId: string) => {
    if (!address) {
      addToast('Please connect your wallet', 'error');
      return;
    }

    setActionLoading(traderId);

    try {
      const res = await fetch('/api/copytrading/follow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          followerId: address,
          followingId: traderId,
          autoCopy: false, // Default to manual; user can enable auto-copy later
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error);
      }

      addToast('✅ Now following this trader!', 'success');
      setFollowing([...following, traderId]);
    } catch (err: any) {
      addToast(err.message || 'Failed to follow trader', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnfollow = async (traderId: string) => {
    if (!address) return;

    setActionLoading(traderId);

    try {
      const res = await fetch('/api/copytrading/follow', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          followerId: address,
          followingId: traderId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error);
      }

      addToast('Unfollowed successfully', 'success');
      setFollowing(following.filter((id) => id !== traderId));
    } catch (err: any) {
      addToast(err.message || 'Failed to unfollow trader', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6">
        <h1 className="mb-2 text-3xl font-bold">Top Traders</h1>
        <p className="text-muted-foreground">
          Follow successful traders and auto-copy their bets
        </p>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-pink-500/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-purple-500/10 p-3">
                <Target className="h-6 w-6 text-purple-400" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Copy Trading</div>
                <div className="text-xl font-bold">Auto-Follow</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-cyan-500/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-500/10 p-3">
                <Users className="h-6 w-6 text-blue-400" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Your Following</div>
                <div className="text-xl font-bold">{following.length}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-500/20 bg-gradient-to-br from-green-500/5 to-emerald-500/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-500/10 p-3">
                <Award className="h-6 w-6 text-green-400" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Top Traders</div>
                <div className="text-xl font-bold">{traders.length}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Leaderboard</CardTitle>
          <CardDescription>Most followed traders on Prohesis</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {traders.map((trader, index) => (
              <div
                key={trader.userId}
                className="flex items-center justify-between rounded-lg border bg-muted/30 p-4"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-sm font-bold text-white">
                    #{index + 1}
                  </div>
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                      {trader.username?.[0]?.toUpperCase() || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold">
                      {trader.username ||
                        `${trader.wallet?.slice(0, 6)}...${trader.wallet?.slice(-4)}`}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {trader.followerCount} followers
                      </span>
                      <span className="flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        {trader.totalVolume.toFixed(2)} ETH volume
                      </span>
                    </div>
                  </div>
                </div>

                {address && address !== trader.userId && (
                  <div>
                    {following.includes(trader.userId) ? (
                      <Button
                        variant="outline"
                        onClick={() => handleUnfollow(trader.userId)}
                        disabled={actionLoading === trader.userId}
                        className="flex items-center gap-2 px-3 py-1.5 text-xs"
                      >
                        <UserMinus className="h-4 w-4" />
                        {actionLoading === trader.userId ? 'Unfollowing...' : 'Unfollow'}
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handleFollow(trader.userId)}
                        disabled={actionLoading === trader.userId}
                        className="flex items-center gap-2 px-3 py-1.5 text-xs"
                      >
                        <UserPlus className="h-4 w-4" />
                        {actionLoading === trader.userId ? 'Following...' : 'Follow'}
                      </Button>
                    )}
                  </div>
                )}

                {address === trader.userId && (
                  <Badge variant="default">You</Badge>
                )}
              </div>
            ))}

            {traders.length === 0 && (
              <div className="py-12 text-center text-muted-foreground">
                No traders found. Start betting to appear on the leaderboard!
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
