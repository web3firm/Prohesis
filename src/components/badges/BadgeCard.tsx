'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
} from 'lucide-react';

interface UserBadge {
  id: number;
  badgeType: string;
  badgeTier: string;
  badgeName: string;
  description: string | null;
  earnedAt: Date;
}

interface BadgeCardProps {
  userId: string;
}

const getTierColor = (tier: string) => {
  switch (tier) {
    case 'diamond': return 'from-cyan-400 to-blue-600';
    case 'platinum': return 'from-gray-300 to-gray-500';
    case 'gold': return 'from-yellow-400 to-yellow-600';
    case 'silver': return 'from-gray-400 to-gray-600';
    case 'bronze': return 'from-amber-600 to-amber-800';
    default: return 'from-gray-400 to-gray-600';
  }
};

const getTierIcon = (tier: string) => {
  switch (tier) {
    case 'diamond': return Crown;
    case 'platinum': return Star;
    case 'gold': return Trophy;
    case 'silver': return Award;
    case 'bronze': return Target;
    default: return Award;
  }
};

export default function BadgeCard({ userId }: BadgeCardProps) {
  const [badges, setBadges] = useState<UserBadge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      fetchBadges();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const fetchBadges = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/badges?userId=${userId}`);
      if (res.ok) {
        const data = await res.json();
        setBadges(data);
      }
    } catch (err) {
      console.error('Failed to fetch badges:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-pink-500/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-purple-400" />
            Achievements
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const diamondBadges = badges.filter((b) => b.badgeTier === 'diamond');
  const platinumBadges = badges.filter((b) => b.badgeTier === 'platinum');
  const goldBadges = badges.filter((b) => b.badgeTier === 'gold');

  return (
    <Card className="border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-pink-500/5">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-purple-400" />
            Achievements
          </CardTitle>
          <Badge variant="secondary" className="text-lg font-bold">
            {badges.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-lg border bg-gradient-to-br from-cyan-500/10 to-blue-500/10 p-2 text-center">
            <div className="flex justify-center">
              <Crown className="h-4 w-4 text-cyan-400" />
            </div>
            <div className="mt-1 text-xl font-bold">{diamondBadges.length}</div>
            <div className="text-xs text-muted-foreground">Diamond</div>
          </div>
          <div className="rounded-lg border bg-gradient-to-br from-gray-300/10 to-gray-500/10 p-2 text-center">
            <div className="flex justify-center">
              <Star className="h-4 w-4 text-gray-400" />
            </div>
            <div className="mt-1 text-xl font-bold">{platinumBadges.length}</div>
            <div className="text-xs text-muted-foreground">Platinum</div>
          </div>
          <div className="rounded-lg border bg-gradient-to-br from-yellow-400/10 to-yellow-600/10 p-2 text-center">
            <div className="flex justify-center">
              <Trophy className="h-4 w-4 text-yellow-500" />
            </div>
            <div className="mt-1 text-xl font-bold">{goldBadges.length}</div>
            <div className="text-xs text-muted-foreground">Gold</div>
          </div>
        </div>

        {/* Badge List */}
        {badges.length > 0 ? (
          <div className="space-y-2">
            <div className="text-sm font-semibold">Recent Badges</div>
            <div className="max-h-64 space-y-2 overflow-y-auto">
              {badges.slice(0, 10).map((badge) => {
                const Icon = getTierIcon(badge.badgeTier);
                const tierColor = getTierColor(badge.badgeTier);
                
                return (
                  <div
                    key={badge.id}
                    className="flex items-center gap-3 rounded-lg border bg-background/50 p-3"
                  >
                    <div className={`rounded-lg bg-gradient-to-br ${tierColor} p-2`}>
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm truncate">{badge.badgeName}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {badge.description}
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-xs capitalize">
                      {badge.badgeTier}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed p-6 text-center">
            <Trophy className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No badges earned yet
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Start predicting to unlock achievements!
            </p>
          </div>
        )}

        {/* Info */}
        <div className="rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground">
          <div className="mb-1 font-semibold text-foreground">Earn badges by:</div>
          <ul className="space-y-0.5">
            <li>• Making accurate predictions</li>
            <li>• Trading high volumes</li>
            <li>• Building win streaks</li>
            <li>• Growing your followers</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
