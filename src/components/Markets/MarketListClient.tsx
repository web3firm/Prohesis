"use client";

import useSWR from 'swr';
import { MarketCard } from "@/components/ui/MarketCard";
import DBGuard from '@/components/ui/DBGuard';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function MarketListClient({ initialData }: { initialData: any[] }) {
  const { data, error } = useSWR('/api/markets/list', fetcher, { refreshInterval: 15000, fallbackData: initialData });

  return (
    <>
      <DBGuard error={error} onRetry={() => window.location.reload()} />
      {!data ? (
        <div className="col-span-full text-center text-gray-500 py-12">Loading...</div>
      ) : (
        data.map((m: any) => <MarketCard key={m.id} market={m} />)
      )}
    </>
  );
}
