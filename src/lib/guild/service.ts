// Guild Management Service
import { db } from '@/lib/db';

export interface GuildData {
  id?: number;
  name: string;
  description?: string | null;
  avatarUrl?: string | null;
  bannerUrl?: string | null;
  founderId: string;
  memberCount?: number;
  totalVolume?: number;
  winRate?: number;
}

export interface GuildMemberData {
  id: number;
  guildId: number;
  userId: string;
  role: 'member' | 'moderator' | 'admin';
  joinedAt: Date;
  contribution: number;
  user: {
    username: string | null;
    wallet: string | null;
  };
}

export class GuildService {
  /**
   * Create a new guild
   */
  async createGuild(data: {
    name: string;
    description?: string;
    founderId: string;
  }): Promise<GuildData> {
    // Check if user already has a guild
    const existingGuild = await db.guild.findFirst({
      where: { founderId: data.founderId },
    });

    if (existingGuild) {
      throw new Error('You already founded a guild');
    }

    // Check if guild name is taken
    const nameTaken = await db.guild.findUnique({
      where: { name: data.name },
    });

    if (nameTaken) {
      throw new Error('Guild name already taken');
    }

    // Create guild
    const guild = await db.guild.create({
      data: {
        name: data.name,
        description: data.description,
        founderId: data.founderId,
      },
    });

    // Add founder as admin member
    await db.guildMember.create({
      data: {
        guildId: guild.id,
        userId: data.founderId,
        role: 'admin',
      },
    });

    return guild;
  }

  /**
   * Get guild details with member count and stats
   */
  async getGuild(guildId: number): Promise<GuildData | null> {
    const guild = await db.guild.findUnique({
      where: { id: guildId },
      include: {
        members: {
          include: {
            user: {
              select: {
                username: true,
                wallet: true,
                bets: {
                  select: {
                    amount: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!guild) return null;

    // Calculate guild stats
    const totalVolume = guild.members.reduce((sum, member) => {
      const memberVolume = member.user.bets.reduce(
        (betSum, bet) => betSum + Number(bet.amount),
        0
      );
      return sum + memberVolume;
    }, 0);

    return {
      ...guild,
      memberCount: guild.members.length,
      totalVolume,
      winRate: 0, // TODO: Calculate from resolved bets
    };
  }

  /**
   * Get all guilds with pagination
   */
  async getGuilds(params: {
    limit?: number;
    offset?: number;
    sortBy?: 'members' | 'volume' | 'recent';
  }): Promise<GuildData[]> {
    const { limit = 20, offset = 0, sortBy = 'recent' } = params;

    const guilds = await db.guild.findMany({
      take: limit,
      skip: offset,
      include: {
        members: {
          select: {
            id: true,
          },
        },
      },
      orderBy:
        sortBy === 'recent'
          ? { createdAt: 'desc' }
          : sortBy === 'members'
          ? { members: { _count: 'desc' } }
          : { createdAt: 'desc' },
    });

    return guilds.map((g) => ({
      ...g,
      memberCount: g.members.length,
      totalVolume: 0,
      winRate: 0,
    }));
  }

  /**
   * Join a guild
   */
  async joinGuild(guildId: number, userId: string): Promise<void> {
    // Check if already a member
    const existing = await db.guildMember.findUnique({
      where: {
        guildId_userId: {
          guildId,
          userId,
        },
      },
    });

    if (existing) {
      throw new Error('Already a member of this guild');
    }

    // Check if user is in another guild
    const otherGuild = await db.guildMember.findFirst({
      where: { userId },
    });

    if (otherGuild) {
      throw new Error('Leave your current guild first');
    }

    await db.guildMember.create({
      data: {
        guildId,
        userId,
        role: 'member',
      },
    });
  }

  /**
   * Leave a guild
   */
  async leaveGuild(guildId: number, userId: string): Promise<void> {
    const member = await db.guildMember.findUnique({
      where: {
        guildId_userId: {
          guildId,
          userId,
        },
      },
    });

    if (!member) {
      throw new Error('Not a member of this guild');
    }

    const guild = await db.guild.findUnique({
      where: { id: guildId },
    });

    if (guild?.founderId === userId) {
      throw new Error('Founder cannot leave guild. Transfer ownership first.');
    }

    await db.guildMember.delete({
      where: {
        guildId_userId: {
          guildId,
          userId,
        },
      },
    });
  }

  /**
   * Get guild members
   */
  async getGuildMembers(guildId: number): Promise<GuildMemberData[]> {
    const members = await db.guildMember.findMany({
      where: { guildId },
      include: {
        user: {
          select: {
            username: true,
            wallet: true,
            bets: {
              select: {
                amount: true,
              },
            },
          },
        },
      },
      orderBy: { joinedAt: 'asc' },
    });

    return members.map((m) => ({
      id: m.id,
      guildId: m.guildId,
      userId: m.userId,
      role: m.role as 'member' | 'moderator' | 'admin',
      joinedAt: m.joinedAt,
      contribution: m.user.bets.reduce(
        (sum, bet) => sum + Number(bet.amount),
        0
      ),
      user: {
        username: m.user.username,
        wallet: m.user.wallet,
      },
    }));
  }

  /**
   * Update member role
   */
  async updateMemberRole(
    guildId: number,
    targetUserId: string,
    newRole: 'member' | 'moderator' | 'admin',
    requestorId: string
  ): Promise<void> {
    // Check if requestor has permission
    const requestor = await db.guildMember.findUnique({
      where: {
        guildId_userId: {
          guildId,
          userId: requestorId,
        },
      },
    });

    if (!requestor || requestor.role !== 'admin') {
      throw new Error('Only admins can change member roles');
    }

    await db.guildMember.update({
      where: {
        guildId_userId: {
          guildId,
          userId: targetUserId,
        },
      },
      data: { role: newRole },
    });
  }

  /**
   * Get user's guild
   */
  async getUserGuild(userId: string): Promise<GuildData | null> {
    const membership = await db.guildMember.findFirst({
      where: { userId },
      include: {
        guild: true,
      },
    });

    if (!membership) return null;

    return this.getGuild(membership.guildId);
  }
}

export const guildService = new GuildService();
