'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toaster';
import {
  Award,
  Trophy,
  Star,
  TrendingUp,
  Users,
  Target,
  Zap,
  Crown,
  Loader2,
  Share2,
  Copy as CopyIcon,
} from 'lucide-react';

interface ReferralStats {
  totalReferrals: number;
  activeReferrals: number;
  totalRewards: number;
  claimedRewards: number;
  pendingRewards: number;
  referralList: Array<{
    userId: string;
    username: string | null;
    totalBets: number;
    totalVolume: number;
  }>;
}

interface ReferralCardProps {
  userId: string;
}

export default function ReferralCard({ userId }: ReferralCardProps) {
  const { addToast } = useToast();
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [referralCode, setReferralCode] = useState<string>('');
  const [referralLink, setReferralLink] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);

  useEffect(() => {
    if (userId) {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, codeRes] = await Promise.all([
        fetch(`/api/referrals/stats?userId=${userId}`),
        fetch(`/api/referrals/code?userId=${userId}`),
      ]);

      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data);
      }

      if (codeRes.ok) {
        const data = await codeRes.json();
        setReferralCode(data.referralCode);
        setReferralLink(data.link);
      }
    } catch (err) {
      console.error('Failed to fetch referral data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    addToast('✅ Referral link copied!', 'success');
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(referralCode);
    addToast('✅ Referral code copied!', 'success');
  };

  const handleClaimRewards = async () => {
    if (!stats || stats.pendingRewards === 0) return;

    setClaiming(true);
    try {
      const unclaimedRes = await fetch(`/api/referrals/claim?userId=${userId}`);
      if (!unclaimedRes.ok) throw new Error('Failed to fetch unclaimed rewards');
      
      const unclaimed = await unclaimedRes.json();
      const rewardIds = unclaimed.map((r: any) => r.id);

      const claimRes = await fetch('/api/referrals/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, rewardIds }),
      });

      const data = await claimRes.json();

      if (!claimRes.ok) {
        throw new Error(data.error);
      }

      addToast(`✅ Claimed ${data.amount.toFixed(4)} ETH in rewards!`, 'success');
      fetchData();
    } catch (err: any) {
      addToast(err.message || 'Failed to claim rewards', 'error');
    } finally {
      setClaiming(false);
    }
  };

  if (loading) {
    return (
      <Card className="border-yellow-500/20 bg-gradient-to-br from-yellow-500/5 to-orange-500/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-yellow-400" />
            Referral Program
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-yellow-500/20 bg-gradient-to-br from-yellow-500/5 to-orange-500/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-yellow-400" />
          Referral Program
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border bg-background/50 p-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Users className="h-3 w-3" />
              Referrals
            </div>
            <div className="mt-1 text-xl font-bold">{stats?.totalReferrals || 0}</div>
            <div className="text-xs text-muted-foreground">
              {stats?.activeReferrals || 0} active
            </div>
          </div>
          <div className="rounded-lg border bg-background/50 p-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Trophy className="h-3 w-3" />
              Rewards
            </div>
            <div className="mt-1 text-xl font-bold text-green-600">
              {stats?.totalRewards.toFixed(4) || '0.0000'}
            </div>
            <div className="text-xs text-muted-foreground">ETH earned</div>
          </div>
        </div>

        {/* Pending Rewards */}
        {stats && stats.pendingRewards > 0 && (
          <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-4">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-sm font-semibold text-green-600">
                Pending Rewards
              </div>
              <div className="text-lg font-bold text-green-600">
                {stats.pendingRewards.toFixed(4)} ETH
              </div>
            </div>
            <Button
              onClick={handleClaimRewards}
              disabled={claiming}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {claiming ? 'Claiming...' : 'Claim Rewards'}
            </Button>
          </div>
        )}

        {/* Referral Code */}
        <div className="space-y-2">
          <div className="text-sm font-semibold">Your Referral Code</div>
          <div className="flex gap-2">
            <div className="flex-1 rounded-lg border bg-background px-3 py-2 font-mono text-sm">
              {referralCode}
            </div>
            <Button variant="outline" onClick={handleCopyCode} className="px-3">
              <CopyIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Referral Link */}
        <div className="space-y-2">
          <div className="text-sm font-semibold">Referral Link</div>
          <div className="flex gap-2">
            <div className="flex-1 truncate rounded-lg border bg-background px-3 py-2 text-xs">
              {referralLink}
            </div>
            <Button variant="outline" onClick={handleCopyLink} className="px-3">
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Rewards Info */}
        <div className="rounded-lg border bg-muted/30 p-3 text-xs">
          <div className="mb-2 font-semibold">Earn Rewards:</div>
          <ul className="space-y-1 text-muted-foreground">
            <li>• 0.001 ETH per signup</li>
            <li>• 0.005 ETH when they place first bet</li>
            <li>• Bonus at volume milestones (1/10/100 ETH)</li>
          </ul>
        </div>

        {/* Top Referrals */}
        {stats && stats.referralList.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-semibold">
              Top Referrals ({stats.referralList.length})
            </div>
            <div className="space-y-1">
              {stats.referralList.slice(0, 3).map((ref) => (
                <div
                  key={ref.userId}
                  className="flex items-center justify-between rounded-lg border bg-background/50 p-2 text-xs"
                >
                  <div className="font-medium">
                    {ref.username || `User ${ref.userId.slice(0, 6)}`}
                  </div>
                  <div className="text-muted-foreground">
                    {ref.totalBets} bets • {ref.totalVolume.toFixed(2)} ETH
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
