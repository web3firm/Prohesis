// Achievement & Badge System Service
import { db } from '@/lib/db';

export interface BadgeDefinition {
  type: string;
  tier: string;
  name: string;
  description: string;
  iconUrl?: string;
  requirement: number;
  category: 'accuracy' | 'volume' | 'streak' | 'social' | 'milestone';
}

export interface UserAchievement {
  id: number;
  badgeType: string;
  badgeTier: string;
  badgeName: string;
  description: string | null;
  iconUrl: string | null;
  earnedAt: Date;
  progress: number;
  target: number;
}

// Badge Definitions
export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  // Accuracy Badges (Perfect Predictions)
  { type: 'accuracy', tier: 'bronze', name: 'Perfect 10', description: '10 perfect predictions', requirement: 10, category: 'accuracy' },
  { type: 'accuracy', tier: 'silver', name: 'Perfect 50', description: '50 perfect predictions', requirement: 50, category: 'accuracy' },
  { type: 'accuracy', tier: 'gold', name: 'Perfect 100', description: '100 perfect predictions', requirement: 100, category: 'accuracy' },
  { type: 'accuracy', tier: 'platinum', name: 'Perfect 500', description: '500 perfect predictions', requirement: 500, category: 'accuracy' },
  { type: 'accuracy', tier: 'diamond', name: 'Perfect 1000', description: '1000 perfect predictions', requirement: 1000, category: 'accuracy' },
  
  // Volume Badges
  { type: 'volume', tier: 'bronze', name: 'Trader', description: '1 ETH total volume', requirement: 1, category: 'volume' },
  { type: 'volume', tier: 'silver', name: 'High Roller', description: '10 ETH total volume', requirement: 10, category: 'volume' },
  { type: 'volume', tier: 'gold', name: 'Whale', description: '100 ETH total volume', requirement: 100, category: 'volume' },
  { type: 'volume', tier: 'platinum', name: 'Mega Whale', description: '1000 ETH total volume', requirement: 1000, category: 'volume' },
  { type: 'volume', tier: 'diamond', name: 'Volume Lord', description: '10000 ETH total volume', requirement: 10000, category: 'volume' },
  
  // Streak Badges
  { type: 'streak', tier: 'bronze', name: 'Hot Start', description: '5-day prediction streak', requirement: 5, category: 'streak' },
  { type: 'streak', tier: 'silver', name: 'On Fire', description: '10-day prediction streak', requirement: 10, category: 'streak' },
  { type: 'streak', tier: 'gold', name: 'Unstoppable', description: '30-day prediction streak', requirement: 30, category: 'streak' },
  { type: 'streak', tier: 'platinum', name: 'Legendary Streak', description: '100-day prediction streak', requirement: 100, category: 'streak' },
  { type: 'streak', tier: 'diamond', name: 'Eternal Flame', description: '365-day prediction streak', requirement: 365, category: 'streak' },
  
  // Win Streak Badges
  { type: 'winstreak', tier: 'bronze', name: 'Lucky 3', description: '3 wins in a row', requirement: 3, category: 'streak' },
  { type: 'winstreak', tier: 'silver', name: 'Lucky 5', description: '5 wins in a row', requirement: 5, category: 'streak' },
  { type: 'winstreak', tier: 'gold', name: 'Lucky 10', description: '10 wins in a row', requirement: 10, category: 'streak' },
  { type: 'winstreak', tier: 'platinum', name: 'Lucky 20', description: '20 wins in a row', requirement: 20, category: 'streak' },
  { type: 'winstreak', tier: 'diamond', name: 'Godlike', description: '50 wins in a row', requirement: 50, category: 'streak' },
  
  // Social Badges
  { type: 'social', tier: 'bronze', name: 'Influencer', description: '10 followers', requirement: 10, category: 'social' },
  { type: 'social', tier: 'silver', name: 'Popular', description: '50 followers', requirement: 50, category: 'social' },
  { type: 'social', tier: 'gold', name: 'Celebrity', description: '100 followers', requirement: 100, category: 'social' },
  { type: 'social', tier: 'platinum', name: 'Icon', description: '500 followers', requirement: 500, category: 'social' },
  { type: 'social', tier: 'diamond', name: 'Legend', description: '1000 followers', requirement: 1000, category: 'social' },
  
  // Referral Badges
  { type: 'referral', tier: 'bronze', name: 'Recruiter', description: 'Referred 5 users', requirement: 5, category: 'social' },
  { type: 'referral', tier: 'silver', name: 'Ambassador', description: 'Referred 20 users', requirement: 20, category: 'social' },
  { type: 'referral', tier: 'gold', name: 'Evangelist', description: 'Referred 50 users', requirement: 50, category: 'social' },
  { type: 'referral', tier: 'platinum', name: 'Growth Master', description: 'Referred 100 users', requirement: 100, category: 'social' },
  { type: 'referral', tier: 'diamond', name: 'Prohesis Prophet', description: 'Referred 500 users', requirement: 500, category: 'social' },
  
  // Market Creation Badges
  { type: 'creator', tier: 'bronze', name: 'Question Asker', description: 'Created 5 markets', requirement: 5, category: 'milestone' },
  { type: 'creator', tier: 'silver', name: 'Market Maker', description: 'Created 20 markets', requirement: 20, category: 'milestone' },
  { type: 'creator', tier: 'gold', name: 'Curator', description: 'Created 50 markets', requirement: 50, category: 'milestone' },
  { type: 'creator', tier: 'platinum', name: 'Thought Leader', description: 'Created 100 markets', requirement: 100, category: 'milestone' },
  { type: 'creator', tier: 'diamond', name: 'Oracle Creator', description: 'Created 500 markets', requirement: 500, category: 'milestone' },
  
  // Participation Badges
  { type: 'participation', tier: 'bronze', name: 'Newbie', description: 'Placed 10 bets', requirement: 10, category: 'milestone' },
  { type: 'participation', tier: 'silver', name: 'Regular', description: 'Placed 50 bets', requirement: 50, category: 'milestone' },
  { type: 'participation', tier: 'gold', name: 'Veteran', description: 'Placed 100 bets', requirement: 100, category: 'milestone' },
  { type: 'participation', tier: 'platinum', name: 'Master', description: 'Placed 500 bets', requirement: 500, category: 'milestone' },
  { type: 'participation', tier: 'diamond', name: 'Grandmaster', description: 'Placed 1000 bets', requirement: 1000, category: 'milestone' },
];

export class BadgeService {
  /**
   * Check and award badges for a user based on their stats
   */
  async checkAndAwardBadges(userId: string): Promise<UserAchievement[]> {
    const newBadges: UserAchievement[] = [];
    
    // Get user stats
    const user = await db.user.findUnique({
      where: { id: userId },
      include: {
        bets: {
          select: {
            amount: true,
            outcomeIndex: true,
          },
        },
        markets: true,
        followers: true,
        achievements: true,
      } as any,
    });

    if (!user) return [];

    // Cast to any to bypass type checking issues with Prisma client cache
    const userWithRelations = user as any;

    // Calculate stats
    const totalBets = userWithRelations.bets?.length || 0;
    const totalVolume = userWithRelations.bets?.reduce((sum: number, bet: any) => sum + Number(bet.amount), 0) || 0;
    const totalMarkets = userWithRelations.markets?.length || 0;
    const totalFollowers = userWithRelations.followers?.length || 0;
    const totalReferrals = userWithRelations.referrals?.length || 0;

    // Get won bets from payouts
    const payouts = await db.payout.findMany({
      where: { userId },
    });
    const wonBets = payouts.length;

    // Check each badge definition
    for (const badge of BADGE_DEFINITIONS) {
      // Skip if already earned
      const existing = userWithRelations.achievements?.find(
        (a: any) => a.badgeType === badge.type && a.badgeTier === badge.tier
      );
      if (existing) continue;

      let currentProgress = 0;
      let shouldAward = false;

      // Determine progress based on badge type
      switch (badge.type) {
        case 'accuracy':
          currentProgress = wonBets;
          shouldAward = wonBets >= badge.requirement;
          break;
        case 'volume':
          currentProgress = totalVolume;
          shouldAward = totalVolume >= badge.requirement;
          break;
        case 'social':
          currentProgress = totalFollowers;
          shouldAward = totalFollowers >= badge.requirement;
          break;
        case 'referral':
          currentProgress = totalReferrals;
          shouldAward = totalReferrals >= badge.requirement;
          break;
        case 'creator':
          currentProgress = totalMarkets;
          shouldAward = totalMarkets >= badge.requirement;
          break;
        case 'participation':
          currentProgress = totalBets;
          shouldAward = totalBets >= badge.requirement;
          break;
        case 'streak':
        case 'winstreak':
          // TODO: Implement streak calculation from bet history
          currentProgress = 0;
          shouldAward = false;
          break;
      }

      if (shouldAward) {
        // Award the badge
        // Award the achievement
        const achievement = await (db as any).achievement.create({
          data: {
            userId,
            badgeType: badge.type,
            badgeTier: badge.tier,
            badgeName: badge.name,
            description: badge.description,
            iconUrl: badge.iconUrl || null,
            progress: currentProgress,
            target: badge.requirement,
          },
        });
        newBadges.push(achievement);
      }
    }

    return newBadges;
  }

  /**
   * Get all badges for a user
   */
  async getUserBadges(userId: string): Promise<UserAchievement[]> {
    const achievements = await (db as any).achievement.findMany({
      where: { userId },
      orderBy: [
        { badgeTier: 'desc' },
        { earnedAt: 'desc' },
      ],
    });

    return achievements;
  }

  /**
   * Get badge progress for a user (next badges to unlock)
   */
  async getBadgeProgress(userId: string): Promise<Array<{
    badge: BadgeDefinition;
    progress: number;
    percentage: number;
  }>> {
    const user = await db.user.findUnique({
      where: { id: userId },
      include: {
        bets: true,
        markets: true,
        followers: true,
        achievements: true,
      } as any,
    });

    if (!user) return [];

    // Cast to any to bypass type checking issues
    const userWithRelations = user as any;

    const totalBets = userWithRelations.bets?.length || 0;
    const totalVolume = userWithRelations.bets?.reduce((sum: number, bet: any) => sum + Number(bet.amount), 0) || 0;
    const totalMarkets = userWithRelations.markets?.length || 0;
    const totalFollowers = userWithRelations.followers?.length || 0;
    const totalReferrals = userWithRelations.referrals?.length || 0;

    const payouts = await db.payout.findMany({ where: { userId } });
    const wonBets = payouts.length;

    const progress: Array<{
      badge: BadgeDefinition;
      progress: number;
      percentage: number;
    }> = [];

    for (const badge of BADGE_DEFINITIONS) {
      const hasEarned = userWithRelations.achievements?.some(
        (a: any) => a.badgeType === badge.type && a.badgeTier === badge.tier
      );
      if (hasEarned) continue;

      let currentProgress = 0;
      switch (badge.type) {
        case 'accuracy': currentProgress = wonBets; break;
        case 'volume': currentProgress = totalVolume; break;
        case 'social': currentProgress = totalFollowers; break;
        case 'referral': currentProgress = totalReferrals; break;
        case 'creator': currentProgress = totalMarkets; break;
        case 'participation': currentProgress = totalBets; break;
      }

      if (currentProgress > 0 && currentProgress < badge.requirement) {
        progress.push({
          badge,
          progress: currentProgress,
          percentage: Math.min(100, (currentProgress / badge.requirement) * 100),
        });
      }
    }

    // Sort by closest to completion
    return progress.sort((a, b) => b.percentage - a.percentage).slice(0, 10);
  }

  /**
   * Get leaderboard by badge count
   */
  async getBadgeLeaderboard(limit: number = 100): Promise<Array<{
    userId: string;
    username: string | null;
    wallet: string | null;
    badgeCount: number;
    diamondCount: number;
    platinumCount: number;
  }>> {
    const topUsers = await (db as any).achievement.groupBy({
      by: ['userId'],
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
      take: limit,
    });

    const leaderboard = await Promise.all(
      topUsers.map(async (item: any) => {
        const user = await db.user.findUnique({
          where: { id: item.userId },
          select: { username: true, wallet: true },
        });

        const achievements = await (db as any).achievement.findMany({
          where: { userId: item.userId },
        });

        return {
          userId: item.userId,
          username: user?.username || null,
          wallet: user?.wallet || null,
          badgeCount: item._count.id,
          diamondCount: achievements.filter((a: any) => a.badgeTier === 'diamond').length,
          platinumCount: achievements.filter((a: any) => a.badgeTier === 'platinum').length,
        };
      })
    );

    return leaderboard;
  }
}

export const badgeService = new BadgeService();
