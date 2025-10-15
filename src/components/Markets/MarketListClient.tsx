"use client";

import useSWR from 'swr';
import { MarketCard } from "@/components/ui/MarketCard";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function MarketListClient({ initialData }: { initialData: any[] }) {
  const { data, error } = useSWR('/api/markets/list', fetcher, { refreshInterval: 15000, fallbackData: initialData });

  if (error) return <div className="col-span-full text-center text-red-500 py-12">Failed to load markets</div>;
  if (!data) return <div className="col-span-full text-center text-gray-500 py-12">Loading...</div>;

  return (
    <>
      {data.map((m: any) => (
        <MarketCard key={m.id} market={m} />
      ))}
    </>
  );
}
