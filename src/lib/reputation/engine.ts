// Reputation System - Calculate and manage user reputation scores

import { db } from '@/lib/db';
import { REPUTATION_CONFIG } from '../config/services';

export interface ReputationScore {
  userId: string;
  totalScore: number;
  accuracy: number;
  volume: number;
  longevity: number;
  marketCreation: number;
  socialImpact: number;
  level: string;
  rank: number;
  badges: string[];
  streak: number;
  lastUpdated: Date;
}

export interface UserStats {
  totalBets: number;
  wonBets: number;
  lostBets: number;
  totalVolume: number;
  totalWinnings: number;
  averageOdds: number;
  marketsCreated: number;
  followers: number;
  guildMemberships: number;
  accountAge: number; // days
  longestStreak: number;
  currentStreak: number;
}

export class ReputationEngine {
  
  /**
   * Calculate comprehensive reputation score for a user
   */
  async calculateReputation(userId: string): Promise<ReputationScore> {
    const stats = await this.getUserStats(userId);
    
    // 1. Accuracy Score (0-100)
    const accuracyScore = this.calculateAccuracyScore(stats);
    
    // 2. Volume Score (0-100)
    const volumeScore = this.calculateVolumeScore(stats);
    
    // 3. Longevity Score (0-100)
    const longevityScore = this.calculateLongevityScore(stats);
    
    // 4. Market Creation Score (0-100)
    const marketCreationScore = this.calculateMarketCreationScore(stats);
    
    // 5. Social Impact Score (0-100)
    const socialImpactScore = this.calculateSocialImpactScore(stats);
    
    // Weighted total score
    const totalScore = 
      accuracyScore * REPUTATION_CONFIG.weights.accuracy +
      volumeScore * REPUTATION_CONFIG.weights.volume +
      longevityScore * REPUTATION_CONFIG.weights.longevity +
      marketCreationScore * REPUTATION_CONFIG.weights.marketCreation +
      socialImpactScore * REPUTATION_CONFIG.weights.socialImpact;
    
    // Determine level and badges
    const level = this.getLevel(totalScore);
    const badges = this.getBadges(stats, totalScore);
    const rank = await this.getUserRank(userId, totalScore);
    
    return {
      userId,
      totalScore: Math.round(totalScore),
      accuracy: Math.round(accuracyScore),
      volume: Math.round(volumeScore),
      longevity: Math.round(longevityScore),
      marketCreation: Math.round(marketCreationScore),
      socialImpact: Math.round(socialImpactScore),
      level,
      rank,
      badges,
      streak: stats.currentStreak,
      lastUpdated: new Date(),
    };
  }
  
  /**
   * Get user statistics from database
   */
  private async getUserStats(userId: string): Promise<UserStats> {
    try {
      // Get user bets
      const bets = await db.bet.findMany({
        where: { userId },
        include: { market: true },
      });
      
      // Get user payouts
      const payouts = await db.payout.findMany({
        where: { userId },
      });
      
      const totalBets = bets.length;
      const wonBets = payouts.length; // If user has payout, they won
      const lostBets = bets.filter(b => 
        b.market.status === 'resolved' && 
        !payouts.some(p => p.marketId === b.marketId)
      ).length;
      
      const totalVolume = bets.reduce((sum, b) => sum + Number(b.amount), 0);
      const totalWinnings = payouts.reduce((sum, p) => sum + Number(p.amount), 0);
      
      // Calculate average odds (winnings / bets ratio)
      const avgOdds = totalVolume > 0 ? totalWinnings / totalVolume : 1;
      
      // Get markets created
      const marketsCreated = await db.market.count({
        where: { creatorId: userId },
      });
      
      // Get user profile
      const user = await db.user.findUnique({
        where: { id: userId },
      });
      
      const accountAge = user?.createdAt 
        ? Math.floor((Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24))
        : 0;
      
      // Calculate streaks
      const { currentStreak, longestStreak } = await this.calculateStreaks(userId, bets);
      
      return {
        totalBets,
        wonBets,
        lostBets,
        totalVolume,
        totalWinnings,
        averageOdds: avgOdds,
        marketsCreated,
        followers: 0, // TODO: Implement followers system
        guildMemberships: 0, // TODO: Implement guilds
        accountAge,
        currentStreak,
        longestStreak,
      };
    } catch (error) {
      console.error('Error fetching user stats:', error);
      // Return default stats if error
      return {
        totalBets: 0,
        wonBets: 0,
        lostBets: 0,
        totalVolume: 0,
        totalWinnings: 0,
        averageOdds: 1,
        marketsCreated: 0,
        followers: 0,
        guildMemberships: 0,
        accountAge: 0,
        currentStreak: 0,
        longestStreak: 0,
      };
    }
  }
  
  /**
   * Calculate accuracy score (0-100)
   */
  private calculateAccuracyScore(stats: UserStats): number {
    if (stats.totalBets === 0) return 0;
    
    const winRate = stats.wonBets / stats.totalBets;
    const resolvedBets = stats.wonBets + stats.lostBets;
    
    if (resolvedBets === 0) return 0;
    
    // Base score from win rate
    let score = winRate * 100;
    
    // Bonus for high volume (up to +20 points)
    const volumeBonus = Math.min(20, (stats.totalBets / 100) * 10);
    
    // Bonus for profit margin (up to +15 points)
    const profitMargin = stats.totalVolume > 0 
      ? (stats.totalWinnings - stats.totalVolume) / stats.totalVolume 
      : 0;
    const profitBonus = Math.min(15, Math.max(-15, profitMargin * 50));
    
    score = score + volumeBonus + profitBonus;
    
    return Math.max(0, Math.min(100, score));
  }
  
  /**
   * Calculate volume score (0-100)
   */
  private calculateVolumeScore(stats: UserStats): number {
    // Logarithmic scale - 0.1 ETH = 20 points, 1 ETH = 50 points, 10 ETH = 80 points, 100 ETH = 100 points
    if (stats.totalVolume === 0) return 0;
    
    const score = 20 * Math.log10(stats.totalVolume * 10 + 1);
    return Math.max(0, Math.min(100, score));
  }
  
  /**
   * Calculate longevity score (0-100)
   */
  private calculateLongevityScore(stats: UserStats): number {
    // Account age in days
    const ageScore = Math.min(50, (stats.accountAge / 365) * 50); // Max 50 points for 1 year
    
    // Consistency (bets per day on average)
    const consistency = stats.accountAge > 0 
      ? (stats.totalBets / stats.accountAge) * 100
      : 0;
    const consistencyScore = Math.min(30, consistency);
    
    // Streak bonus
    const streakScore = Math.min(20, stats.longestStreak * 2);
    
    return Math.min(100, ageScore + consistencyScore + streakScore);
  }
  
  /**
   * Calculate market creation score (0-100)
   */
  private calculateMarketCreationScore(stats: UserStats): number {
    if (stats.marketsCreated === 0) return 0;
    
    // Points per market created
    const baseScore = Math.min(80, stats.marketsCreated * 10);
    
    // TODO: Add quality metrics (participation, volume, resolution speed)
    
    return baseScore;
  }
  
  /**
   * Calculate social impact score (0-100)
   */
  private calculateSocialImpactScore(stats: UserStats): number {
    const followerScore = Math.min(40, stats.followers * 2);
    const guildScore = Math.min(30, stats.guildMemberships * 10);
    const referralScore = 0; // TODO: Add referral system
    
    return followerScore + guildScore + referralScore;
  }
  
  /**
   * Calculate winning/losing streaks
   */
  private async calculateStreaks(userId: string, bets: any[]): Promise<{
    currentStreak: number;
    longestStreak: number;
  }> {
    // Sort bets by date
    const sortedBets = bets
      .filter(b => b.market.status === 'resolved')
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    
    for (const bet of sortedBets) {
      const won = bet.payout && Number(bet.payout) > 0;
      
      if (won) {
        tempStreak++;
        if (tempStreak > longestStreak) {
          longestStreak = tempStreak;
        }
        if (currentStreak >= 0) {
          currentStreak++;
        }
      } else {
        if (tempStreak > 0) {
          tempStreak = 0;
        }
        if (currentStreak <= 0) {
          currentStreak--;
        } else {
          currentStreak = -1;
        }
      }
    }
    
    return { currentStreak: Math.abs(currentStreak), longestStreak };
  }
  
  /**
   * Get reputation level based on score
   */
  private getLevel(score: number): string {
    if (score >= REPUTATION_CONFIG.badges.legend) return 'Legend';
    if (score >= REPUTATION_CONFIG.badges.grandmaster) return 'Grandmaster';
    if (score >= REPUTATION_CONFIG.badges.master) return 'Master';
    if (score >= REPUTATION_CONFIG.badges.expert) return 'Expert';
    if (score >= REPUTATION_CONFIG.badges.apprentice) return 'Apprentice';
    return 'Novice';
  }
  
  /**
   * Get earned badges
   * totalScore is available for potential future badge criteria
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private getBadges(stats: UserStats, totalScore: number): string[] {
    const badges: string[] = [];
    
    // Accuracy badges
    const winRate = stats.totalBets > 0 ? stats.wonBets / stats.totalBets : 0;
    if (winRate >= 0.7 && stats.totalBets >= 10) badges.push('Accurate Predictor');
    if (winRate >= 0.8 && stats.totalBets >= 25) badges.push('Oracle');
    if (winRate >= 0.9 && stats.totalBets >= 50) badges.push('Prophet');
    
    // Volume badges
    if (stats.totalVolume >= 1) badges.push('Active Trader');
    if (stats.totalVolume >= 10) badges.push('High Roller');
    if (stats.totalVolume >= 100) badges.push('Whale');
    
    // Streak badges
    if (stats.currentStreak >= 5) badges.push('On Fire');
    if (stats.currentStreak >= 10) badges.push('Unstoppable');
    if (stats.longestStreak >= 15) badges.push('Legendary Streak');
    
    // Longevity badges
    if (stats.accountAge >= 30) badges.push('Veteran');
    if (stats.accountAge >= 90) badges.push('OG Predictor');
    if (stats.accountAge >= 365) badges.push('Year One');
    
    // Market creation badges
    if (stats.marketsCreated >= 1) badges.push('Market Creator');
    if (stats.marketsCreated >= 5) badges.push('Market Maker');
    if (stats.marketsCreated >= 10) badges.push('Market Architect');
    
    // Special achievements
    if (stats.totalBets >= 100) badges.push('Century Club');
    if (stats.totalBets >= 500) badges.push('Prediction Master');
    if (stats.totalBets >= 1000) badges.push('Elite Forecaster');
    
    // AI competition badges
    // TODO: Compare with AI accuracy
    
    return badges;
  }
  
  /**
   * Get user's global rank
   */
  private async getUserRank(userId: string, score: number): Promise<number> {
    try {
      // In production, this would query a reputation table
      // For now, return mock rank based on score
      const mockRank = Math.max(1, Math.floor((100 - score) * 10));
      return mockRank;
    } catch (err) {
      console.error('Failed to get user rank:', err);
      return 999;
    }
  }
  
  /**
   * Store reputation in database
   */
  async storeReputation(reputation: ReputationScore): Promise<void> {
    try {
      await fetch('/api/reputation/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reputation),
      });
    } catch (err) {
      console.error('Failed to store reputation:', err);
    }
  }
  
  /**
   * Get leaderboard
   */
  async getLeaderboard(limit: number = 100): Promise<ReputationScore[]> {
    try {
      const res = await fetch(`/api/reputation/leaderboard?limit=${limit}`);
      return await res.json();
    } catch (err) {
      console.error('Failed to get leaderboard:', err);
      return [];
    }
  }
}

// Singleton instance
export const reputationEngine = new ReputationEngine();
