"use client";

import useSWR from "swr";
import { useAccount } from "wagmi";
import { ChartCard } from "@/components/shared/ChartCard";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function UserAnalyticsPage() {
  const { address } = useAccount();
  
  // Real-time analytics data
  const { data, error } = useSWR(
    address ? `/api/user/analytics?wallet=${address}` : null,
    fetcher,
    {
      refreshInterval: 15000,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    }
  );

  if (!address) return (
    <div className="p-6 min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="text-gray-600 dark:text-gray-400">Connect your wallet to see analytics.</div>
    </div>
  );
  
  if (error) return (
    <div className="p-6 min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="text-red-600 dark:text-red-400">Failed to load analytics</div>
    </div>
  );
  
  if (!data) return (
    <div className="p-6 min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="text-gray-600 dark:text-gray-400">Loading analytics…</div>
    </div>
  );

  const months = Object.keys(data.byMonth || {});
  const monthVals = months.map((k) => data.byMonth[k]);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6 min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Your Analytics</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat label="Total Staked" value={data.totals?.totalStaked?.toFixed(2) || 0} />
        <Stat label="Total Won" value={data.totals?.totalWon?.toFixed(2) || 0} />
        <Stat label="Total Lost" value={data.totals?.totalLost?.toFixed(2) || 0} />
        <Stat label="Bets" value={data.totals?.bets || 0} />
      </div>

      <ChartCard title="Stake by Month" labels={months} data={monthVals} color="#2563eb" />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-4 text-center">
      <p className="text-2xl font-semibold text-blue-600 dark:text-blue-400">{value}</p>
      <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
    </div>
  );
}