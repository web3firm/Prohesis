"use client";

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default function DashboardPage() {
  const { address } = useAccount();
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<any[]>([]);
  const [pending, setPending] = useState<any[]>([]);
  const [past, setPast] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      if (!address) return;
      setLoading(true);
      const res = await fetch(`/api/user/bets?wallet=${address}`);
      const data = await res.json();
      setActive(data.activeBets || []);
      setPending(data.pendingClaims || []);
      setPast(data.pastBets || []);
      setLoading(false);
    })();
  }, [address]);

  return (
    <main className="max-w-6xl mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      <Section title="Active Bets" loading={loading} empty="No active bets yet.">
        <Table rows={active} />
      </Section>

      <Section title="Pending Claims" loading={loading} empty="No pending claims.">
        <Table rows={pending} />
      </Section>

      <Section title="Past Bets" loading={loading} empty="No past bets.">
        <Table rows={past} />
      </Section>

      <div className="pt-2">
        <Link href="/user/Markets" className="text-blue-600 hover:underline">Browse markets →</Link>
      </div>
    </main>
  );
}

function Section({ title, loading, empty, children }: any) {
  return (
    <section className="bg-white border rounded-xl p-4">
      <h2 className="text-lg font-semibold mb-3">{title}</h2>
      {loading ? <div className="text-gray-500">Loading…</div> : children ?? <div className="text-sm text-gray-500">{empty}</div>}
    </section>
  );
}

function Table({ rows }: { rows: any[] }) {
  if (!rows || rows.length === 0) return <div className="text-sm text-gray-500">Nothing here</div>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="text-gray-500">
          <tr>
            <th className="text-left py-2">Market</th>
            <th className="text-left py-2">Amount</th>
            <th className="text-left py-2">Won</th>
            <th className="text-left py-2">Lost</th>
            <th className="text-left py-2">Tx</th>
            <th className="text-left py-2">End</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={`${r.betId}-${r.marketId}`} className="border-t">
              <td className="py-2"><Link className="text-blue-600 hover:underline" href={`/user/Markets/${r.marketId}`}>{r.marketTitle}</Link></td>
              <td className="py-2">{r.amount}</td>
              <td className="py-2">{r.resolved && r.winningOutcome === r.outcomeIndex ? r.paidAmount : 0}</td>
              <td className="py-2">{r.resolved && r.winningOutcome !== r.outcomeIndex ? r.amount : 0}</td>
              <td className="py-2 font-mono">{r.txHash?.slice(0,8)}…{r.txHash?.slice(-6)}</td>
              <td className="py-2">{r.endTime ? new Date(r.endTime).toLocaleString() : '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
