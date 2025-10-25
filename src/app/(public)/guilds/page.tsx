'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/Button';
import { 
  Users, 
  TrendingUp, 
  Shield, 
  Plus,
  Search,
  Star,
  Loader2
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

export default function GuildsPage() {
  const [guilds, setGuilds] = useState<Guild[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'members' | 'volume'>('members');

  useEffect(() => {
    fetchGuilds();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortBy]);

  const fetchGuilds = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/guilds?sortBy=${sortBy}&limit=50`);
      if (res.ok) {
        const data = await res.json();
        setGuilds(data);
      }
    } catch (err) {
      console.error('Failed to fetch guilds:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredGuilds = guilds.filter((guild) =>
    guild.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    guild.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="mb-2 text-4xl font-bold">Guilds</h1>
          <p className="text-muted-foreground">
            Join a guild to collaborate with other predictors
          </p>
        </div>
        <Link href="/guilds/create">
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create Guild
          </Button>
        </Link>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search guilds..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-input bg-background pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={sortBy === 'members' ? 'default' : 'outline'}
            onClick={() => setSortBy('members')}
            className="text-sm"
          >
            <Users className="mr-2 h-4 w-4" />
            Members
          </Button>
          <Button
            variant={sortBy === 'volume' ? 'default' : 'outline'}
            onClick={() => setSortBy('volume')}
            className="text-sm"
          >
            <TrendingUp className="mr-2 h-4 w-4" />
            Volume
          </Button>
          <Button
            variant={sortBy === 'recent' ? 'default' : 'outline'}
            onClick={() => setSortBy('recent')}
            className="text-sm"
          >
            <Star className="mr-2 h-4 w-4" />
            Recent
          </Button>
        </div>
      </div>

      {/* Guilds Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredGuilds.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {searchQuery ? 'No guilds found matching your search' : 'No guilds available yet'}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredGuilds.map((guild) => (
            <Link key={guild.id} href={`/guilds/${guild.id}`}>
              <Card className="h-full transition-all hover:shadow-lg hover:border-primary">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                          {guild.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">{guild.name}</CardTitle>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Users className="h-3 w-3" />
                          {guild.memberCount || 0} members
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {guild.description && (
                    <p className="line-clamp-2 text-sm text-muted-foreground">
                      {guild.description}
                    </p>
                  )}
                  
                  <div className="grid grid-cols-2 gap-4 rounded-lg border bg-muted/50 p-3">
                    <div>
                      <div className="text-xs text-muted-foreground">Total Volume</div>
                      <div className="font-semibold">
                        {guild.totalVolume?.toFixed(2) || '0.00'} ETH
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Win Rate</div>
                      <div className="font-semibold text-green-600">
                        {guild.winRate?.toFixed(1) || '0.0'}%
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      <Shield className="mr-1 h-3 w-3" />
                      Active
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
