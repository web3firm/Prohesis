// Copy Trading Service
import { db } from '@/lib/db';

export interface FollowData {
  id: number;
  followerId: string;
  followingId: string;
  autoCopy: boolean;
  copyAmount?: number | null;
  copyPercent?: number | null;
  createdAt: Date;
  following?: {
    username: string | null;
    wallet: string | null;
  };
}

export interface CopyTradeStats {
  totalFollowers: number;
  totalFollowing: number;
  totalCopiedBets: number;
  totalCopiedVolume: number;
  topTraders: Array<{
    userId: string;
    username: string | null;
    wallet: string | null;
    followerCount: number;
    totalVolume: number;
  }>;
}

export class CopyTradingService {
  /**
   * Follow a trader
   */
  async followTrader(
    followerId: string,
    followingId: string,
    options?: {
      autoCopy?: boolean;
      copyAmount?: number;
      copyPercent?: number;
    }
  ): Promise<FollowData> {
    if (followerId === followingId) {
      throw new Error('Cannot follow yourself');
    }

    // Check if already following
    const existing = await db.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });

    if (existing) {
      throw new Error('Already following this trader');
    }

    // Create follow relationship
    const follow = await db.follow.create({
      data: {
        followerId,
        followingId,
        autoCopy: options?.autoCopy || false,
        copyAmount: options?.copyAmount || null,
        copyPercent: options?.copyPercent || null,
      },
    });

    return follow;
  }

  /**
   * Unfollow a trader
   */
  async unfollowTrader(followerId: string, followingId: string): Promise<void> {
    const follow = await db.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });

    if (!follow) {
      throw new Error('Not following this trader');
    }

    await db.follow.delete({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });
  }

  /**
   * Update copy-trading settings for a follow
   */
  async updateCopySettings(
    followerId: string,
    followingId: string,
    settings: {
      autoCopy?: boolean;
      copyAmount?: number | null;
      copyPercent?: number | null;
    }
  ): Promise<FollowData> {
    const follow = await db.follow.update({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
      data: settings,
    });

    return follow;
  }

  /**
   * Get all traders a user is following
   */
  async getFollowing(userId: string): Promise<FollowData[]> {
    const follows = await db.follow.findMany({
      where: { followerId: userId },
      include: {
        following: {
          select: {
            username: true,
            wallet: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return follows;
  }

  /**
   * Get all followers of a user
   */
  async getFollowers(userId: string): Promise<FollowData[]> {
    const follows = await db.follow.findMany({
      where: { followingId: userId },
      include: {
        follower: {
          select: {
            username: true,
            wallet: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return follows.map((f) => ({
      ...f,
      following: f.follower,
    }));
  }

  /**
   * Execute a copy trade (called when a leader places a bet)
   * This is a mock implementation for now
   */
  async executeCopyTrade(leaderBetId: number): Promise<void> {
    try {
      // Get the leader bet
      const leaderBet = await db.bet.findUnique({
        where: { id: leaderBetId },
        include: {
          user: true,
        },
      });

      if (!leaderBet || !leaderBet.userId) return;

      // Find all followers with auto-copy enabled
      const followers = await db.follow.findMany({
        where: {
          followingId: leaderBet.userId,
          autoCopy: true,
        },
      });

      // For each follower, create a copied bet (mock mode)
      for (const follow of followers) {
        // Calculate copy amount
        let copyAmount = leaderBet.amount;
        if (follow.copyAmount) {
          copyAmount = follow.copyAmount;
        } else if (follow.copyPercent) {
          // In real mode, this would calculate based on follower's balance
          copyAmount = leaderBet.amount * (follow.copyPercent / 100);
        }

        // In production, this would execute an on-chain bet transaction
        // For now, we just log the intent
        console.log(
          `[Copy Trade] Follower ${follow.followerId} would copy bet ${leaderBetId} with amount ${copyAmount}`
        );

        // Mock: Create a placeholder copied bet record
        // In real mode, this happens after the on-chain transaction confirms
        const copiedBet = await db.bet.create({
          data: {
            marketId: leaderBet.marketId,
            userId: follow.followerId,
            amount: copyAmount,
            outcomeIndex: leaderBet.outcomeIndex,
            walletAddress: follow.followerId,
            walletChainId: leaderBet.walletChainId,
            txHash: `mock-copy-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          },
        });

        // Record the copy trade relationship
        await db.copyTrade.create({
          data: {
            followId: follow.id,
            leaderBetId: leaderBet.id,
            copiedBetId: copiedBet.id,
          },
        });
      }
    } catch (err) {
      console.error('Copy trade execution failed:', err);
    }
  }

  /**
   * Get copy trading stats for a user
   */
  async getStats(userId: string): Promise<CopyTradeStats> {
    const followers = await db.follow.count({
      where: { followingId: userId },
    });

    const following = await db.follow.count({
      where: { followerId: userId },
    });

    const copiedBets = await db.copyTrade.count({
      where: {
        copiedBet: {
          userId,
        },
      },
    });

    const copiedBetsData = await db.bet.findMany({
      where: {
        userId,
        copiedTrades: {
          some: {},
        },
      },
    });

    const totalVolume = copiedBetsData.reduce((sum, bet) => sum + Number(bet.amount), 0);

    // Get top traders by follower count
    const topTraders = await db.follow.groupBy({
      by: ['followingId'],
      _count: {
        followerId: true,
      },
      orderBy: {
        _count: {
          followerId: 'desc',
        },
      },
      take: 10,
    });

    const topTradersData = await Promise.all(
      topTraders.map(async (t) => {
        const user = await db.user.findUnique({
          where: { id: t.followingId },
          select: {
            id: true,
            username: true,
            wallet: true,
            bets: {
              select: {
                amount: true,
              },
            },
          },
        });

        return {
          userId: t.followingId,
          username: user?.username || null,
          wallet: user?.wallet || null,
          followerCount: t._count.followerId,
          totalVolume: user?.bets.reduce((sum, bet) => sum + Number(bet.amount), 0) || 0,
        };
      })
    );

    return {
      totalFollowers: followers,
      totalFollowing: following,
      totalCopiedBets: copiedBets,
      totalCopiedVolume: totalVolume,
      topTraders: topTradersData,
    };
  }

  /**
   * Check if a user is following another
   */
  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    const follow = await db.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });

    return !!follow;
  }
}

export const copyTradingService = new CopyTradingService();
