'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toaster';
import {
  Users,
  TrendingUp,
  Crown,
  Shield,
  ArrowLeft,
  Loader2,
  UserPlus,
  LogOut,
} from 'lucide-react';
import Link from 'next/link';

interface Guild {
  id: number;
  name: string;
  description?: string;
  memberCount?: number;
  totalVolume?: number;
  winRate?: number;
  founderId: string;
}

interface Member {
  id: number;
  userId: string;
  role: string;
  joinedAt: string;
  contribution: number;
  user: {
    username: string | null;
    wallet: string | null;
  };
}

export default function GuildDetailPage() {
  const params = useParams<{ id: string }>();
  const { address } = useAccount();
  const { addToast } = useToast();
  const [guild, setGuild] = useState<Guild | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const guildId = parseInt(params.id);
  const isMember = members.some((m) => m.userId === address);
  const isFounder = guild?.founderId === address;

  const fetchGuildData = async () => {
    setLoading(true);
    try {
      const [guildRes, membersRes] = await Promise.all([
        fetch(`/api/guilds/${guildId}`),
        fetch(`/api/guilds/${guildId}/members`),
      ]);

      if (guildRes.ok) {
        const guildData = await guildRes.json();
        setGuild(guildData);
      }

      if (membersRes.ok) {
        const membersData = await membersRes.json();
        setMembers(membersData);
      }
    } catch (err) {
      console.error('Failed to fetch guild:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGuildData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guildId]);

  const handleJoin = async () => {
    if (!address) {
      addToast('Please connect your wallet', 'error');
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch(`/api/guilds/${guildId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: address, action: 'join' }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error);
      }

      addToast('✅ Successfully joined guild!', 'success');
      fetchGuildData();
    } catch (err: any) {
      addToast(err.message || 'Failed to join guild', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleLeave = async () => {
    if (!address) return;

    if (!confirm('Are you sure you want to leave this guild?')) return;

    setActionLoading(true);
    try {
      const res = await fetch(`/api/guilds/${guildId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: address, action: 'leave' }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error);
      }

      addToast('Left guild successfully', 'success');
      fetchGuildData();
    } catch (err: any) {
      addToast(err.message || 'Failed to leave guild', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const getRoleIcon = (role: string) => {
    if (role === 'admin') return <Crown className="h-4 w-4 text-yellow-500" />;
    if (role === 'moderator') return <Shield className="h-4 w-4 text-blue-500" />;
    return null;
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!guild) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Guild not found
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <Link
        href="/guilds"
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Guilds
      </Link>

      {/* Guild Header */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-2xl text-white">
                  {guild.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-3xl">{guild.name}</CardTitle>
                <CardDescription className="mt-1">
                  {guild.description || 'No description provided'}
                </CardDescription>
              </div>
            </div>

            {!isMember && !isFounder && (
              <Button
                onClick={handleJoin}
                disabled={actionLoading}
                className="flex items-center gap-2"
              >
                <UserPlus className="h-4 w-4" />
                {actionLoading ? 'Joining...' : 'Join Guild'}
              </Button>
            )}

            {isMember && !isFounder && (
              <Button
                onClick={handleLeave}
                disabled={actionLoading}
                variant="outline"
                className="flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                {actionLoading ? 'Leaving...' : 'Leave Guild'}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-lg border bg-muted/50 p-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="h-4 w-4" />
                <span className="text-sm">Members</span>
              </div>
              <div className="mt-2 text-2xl font-bold">{guild.memberCount || 0}</div>
            </div>
            <div className="rounded-lg border bg-muted/50 p-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <TrendingUp className="h-4 w-4" />
                <span className="text-sm">Total Volume</span>
              </div>
              <div className="mt-2 text-2xl font-bold">
                {guild.totalVolume?.toFixed(2) || '0.00'} ETH
              </div>
            </div>
            <div className="rounded-lg border bg-muted/50 p-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Shield className="h-4 w-4" />
                <span className="text-sm">Win Rate</span>
              </div>
              <div className="mt-2 text-2xl font-bold text-green-600">
                {guild.winRate?.toFixed(1) || '0.0'}%
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Members List */}
      <Card>
        <CardHeader>
          <CardTitle>Members ({members.length})</CardTitle>
          <CardDescription>All members of this guild</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between rounded-lg border p-4"
              >
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>
                      {member.user.username?.[0]?.toUpperCase() || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {member.user.username ||
                          `${member.user.wallet?.slice(0, 6)}...${member.user.wallet?.slice(-4)}`}
                      </span>
                      {getRoleIcon(member.role)}
                      <Badge variant="secondary" className="text-xs">
                        {member.role}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Joined {new Date(member.joinedAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">
                    {member.contribution.toFixed(4)} ETH
                  </div>
                  <div className="text-xs text-muted-foreground">Contribution</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
