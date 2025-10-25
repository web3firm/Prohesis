// Referral System Service
import { db } from '@/lib/db';

export interface ReferralStats {
  totalReferrals: number;
  activeReferrals: number; // Referrals who have placed at least 1 bet
  totalRewards: number;
  claimedRewards: number;
  pendingRewards: number;
  referralList: Array<{
    userId: string;
    username: string | null;
    wallet: string | null;
    joinedAt: Date;
    totalBets: number;
    totalVolume: number;
  }>;
}

export interface ReferralReward {
  id: number;
  referredId: string;
  rewardType: string;
  amount: number;
  claimed: boolean;
  createdAt: Date;
}

// Reward Configuration
export const REFERRAL_REWARDS = {
  SIGNUP: 0.001, // 0.001 ETH for each signup
  FIRST_BET: 0.005, // 0.005 ETH when referral places first bet
  VOLUME_MILESTONE_1: { threshold: 1, reward: 0.01 }, // 1 ETH volume
  VOLUME_MILESTONE_10: { threshold: 10, reward: 0.05 }, // 10 ETH volume
  VOLUME_MILESTONE_100: { threshold: 100, reward: 0.5 }, // 100 ETH volume
};

export class ReferralService {
  /**
   * Generate referral code for a user
   */
  generateReferralCode(userId: string): string {
    // Create a simple referral code based on user ID
    const hash = Buffer.from(userId).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);
    return hash.toUpperCase();
  }

  /**
   * Apply referral code during signup
   */
  async applyReferralCode(newUserId: string, referralCode: string): Promise<boolean> {
    try {
      // Find the referrer by decoding the referral code
      // In production, you'd store referral codes in a separate table
      // For now, we'll search by wallet/username patterns
      const allUsers = await db.user.findMany({
        select: { id: true },
      });

      let referrerId: string | null = null;
      for (const user of allUsers) {
        if (this.generateReferralCode(user.id) === referralCode) {
          referrerId = user.id;
          break;
        }
      }

      if (!referrerId || referrerId === newUserId) {
        return false;
      }

      // Update new user with referrer
      await db.user.update({
        where: { id: newUserId },
        data: { referredBy: referrerId } as any,
      });

      // Create signup reward for referrer
      await (db as any).referralReward.create({
        data: {
          userId: referrerId,
          referredId: newUserId,
          rewardType: 'signup',
          amount: REFERRAL_REWARDS.SIGNUP,
          claimed: false,
        },
      });

      return true;
    } catch (err) {
      console.error('Failed to apply referral code:', err);
      return false;
    }
  }

  /**
   * Track referral milestones (called when user places bets)
   */
  async trackReferralMilestone(userId: string): Promise<void> {
    try {
      const user = await db.user.findUnique({
        where: { id: userId },
        select: { referredBy: true } as any,
      });

      if (!user?.referredBy) return;

      const referrerId = (user as any).referredBy;

      // Check if this is their first bet
      const betCount = await db.bet.count({
        where: { userId },
      });

      if (betCount === 1) {
        // Award first bet reward
        const existingReward = await (db as any).referralReward.findFirst({
          where: {
            userId: referrerId,
            referredId: userId,
            rewardType: 'first_bet',
          },
        });

        if (!existingReward) {
          await (db as any).referralReward.create({
            data: {
              userId: referrerId,
              referredId: userId,
              rewardType: 'first_bet',
              amount: REFERRAL_REWARDS.FIRST_BET,
              claimed: false,
            },
          });
        }
      }

      // Check volume milestones
      const bets = await db.bet.findMany({
        where: { userId },
        select: { amount: true },
      });

      const totalVolume = bets.reduce((sum: number, bet: any) => sum + Number(bet.amount), 0);

      // Check each milestone
      const milestones = [
        { name: 'volume_1', config: REFERRAL_REWARDS.VOLUME_MILESTONE_1 },
        { name: 'volume_10', config: REFERRAL_REWARDS.VOLUME_MILESTONE_10 },
        { name: 'volume_100', config: REFERRAL_REWARDS.VOLUME_MILESTONE_100 },
      ];

      for (const milestone of milestones) {
        if (totalVolume >= milestone.config.threshold) {
          const existingReward = await (db as any).referralReward.findFirst({
            where: {
              userId: referrerId,
              referredId: userId,
              rewardType: `volume_milestone_${milestone.config.threshold}`,
            },
          });

          if (!existingReward) {
            await (db as any).referralReward.create({
              data: {
                userId: referrerId,
                referredId: userId,
                rewardType: `volume_milestone_${milestone.config.threshold}`,
                amount: milestone.config.reward,
                claimed: false,
              },
            });
          }
        }
      }
    } catch (err) {
      console.error('Failed to track referral milestone:', err);
    }
  }

  /**
   * Get referral stats for a user
   */
  async getReferralStats(userId: string): Promise<ReferralStats> {
    const referrals = await db.user.findMany({
      where: { referredBy: userId } as any,
      include: {
        bets: {
          select: {
            amount: true,
          },
        },
      },
    });

    const rewards = await (db as any).referralReward.findMany({
      where: { userId },
    });

    const totalRewards = rewards.reduce((sum: number, r: any) => sum + r.amount, 0);
    const claimedRewards = rewards.filter((r: any) => r.claimed).reduce((sum: number, r: any) => sum + r.amount, 0);
    const pendingRewards = totalRewards - claimedRewards;

    const referralList = referrals.map((ref: any) => ({
      userId: ref.id,
      username: ref.username,
      wallet: ref.wallet,
      joinedAt: ref.createdAt,
      totalBets: ref.bets?.length || 0,
      totalVolume: ref.bets?.reduce((sum: number, bet: any) => sum + Number(bet.amount), 0) || 0,
    }));

    return {
      totalReferrals: referrals.length,
      activeReferrals: referrals.filter((r: any) => r.bets && r.bets.length > 0).length,
      totalRewards,
      claimedRewards,
      pendingRewards,
      referralList,
    };
  }

  /**
   * Get unclaimed rewards for a user
   */
  async getUnclaimedRewards(userId: string): Promise<ReferralReward[]> {
    const rewards = await (db as any).referralReward.findMany({
      where: {
        userId,
        claimed: false,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return rewards;
  }

  /**
   * Claim rewards (mock mode - in production would execute on-chain transfer)
   */
  async claimRewards(userId: string, rewardIds: number[]): Promise<number> {
    const rewards = await (db as any).referralReward.findMany({
      where: {
        userId,
        id: { in: rewardIds },
        claimed: false,
      },
    });

    if (rewards.length === 0) {
      throw new Error('No rewards to claim');
    }

    const totalAmount = rewards.reduce((sum: number, r: any) => sum + r.amount, 0);

    // Mark as claimed
    await (db as any).referralReward.updateMany({
      where: {
        id: { in: rewardIds },
      },
      data: {
        claimed: true,
      },
    });

    // In production, execute on-chain transfer here
    console.log(`[Mock] Claiming ${totalAmount} ETH for user ${userId}`);

    return totalAmount;
  }

  /**
   * Get top referrers leaderboard
   */
  async getTopReferrers(limit: number = 100): Promise<Array<{
    userId: string;
    username: string | null;
    wallet: string | null;
    totalReferrals: number;
    activeReferrals: number;
    totalRewards: number;
  }>> {
    const users = await db.user.findMany({
      where: {
        id: { not: undefined }, // Fetch all users, filter later
      } as any,
      include: {
        referralRewards: true,
      } as any,
    });

    const leaderboard = users.map((user: any) => ({
      userId: user.id,
      username: user.username,
      wallet: user.wallet,
      totalReferrals: user.referrals?.length || 0,
      activeReferrals: user.referrals?.filter((r: any) => r.bets && r.bets.length > 0).length || 0,
      totalRewards: user.referralRewards?.reduce((sum: number, r: any) => sum + r.amount, 0) || 0,
    }));

    return leaderboard
      .sort((a, b) => b.totalReferrals - a.totalReferrals)
      .slice(0, limit);
  }
}

export const referralService = new ReferralService();
