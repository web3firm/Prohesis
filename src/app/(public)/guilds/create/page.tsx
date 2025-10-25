'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toaster';
import { Users, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function CreateGuildPage() {
  const router = useRouter();
  const { address } = useAccount();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!address) {
      addToast('Please connect your wallet', 'error');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/guilds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          founderId: address,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create guild');
      }

      addToast('✅ Guild created successfully!', 'success');
      router.push(`/guilds/${data.id}`);
    } catch (err: any) {
      addToast(err.message || 'Failed to create guild', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <Link
        href="/guilds"
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Guilds
      </Link>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-3">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle>Create a Guild</CardTitle>
              <CardDescription>
                Start your own prediction team and collaborate with others
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="space-y-6">
            <div>
              <label className="mb-2 block text-sm font-medium">
                Guild Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter guild name"
                required
                minLength={3}
                maxLength={50}
                className="w-full rounded-lg border border-input bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                3-50 characters, must be unique
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your guild's purpose and goals"
                rows={4}
                maxLength={500}
                className="w-full rounded-lg border border-input bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Optional, up to 500 characters
              </p>
            </div>

            <div className="rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20 p-4">
              <h4 className="mb-2 font-semibold text-blue-900 dark:text-blue-100">
                As a guild founder, you will:
              </h4>
              <ul className="space-y-1 text-sm text-blue-800 dark:text-blue-200">
                <li>• Have admin permissions for your guild</li>
                <li>• Be able to invite and manage members</li>
                <li>• Access guild analytics and leaderboards</li>
                <li>• Cannot leave until transferring ownership</li>
              </ul>
            </div>

            <div className="flex gap-4">
              <Button
                type="submit"
                disabled={loading || !name.trim()}
                className="flex-1"
              >
                {loading ? 'Creating...' : 'Create Guild'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/guilds')}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
