"use client";

export default function AdminStatsPanel({
  stats,
}: {
  stats: { totalFees: number; activeMarkets: number; recentUsers: any[] };
}) {
  return (
    <section className="bg-white border rounded-xl p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-800 mb-3">
        Platform Summary
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <PanelItem label="Active Markets" value={stats.activeMarkets} />
        <PanelItem
          label="Protocol Fees"
          value={`${Number(stats.totalFees).toFixed(3)} ETH`}
        />
        <div>
          <h3 className="text-sm font-medium text-gray-600 mb-1">
            Recent Users
          </h3>
          <ul className="text-sm text-gray-700 space-y-1">
            {stats.recentUsers.map((u) => (
              <li key={u.id}>
                {u.username}{" "}
                <span className="text-gray-400 text-xs">
                  {new Date(u.created_at).toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function PanelItem({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="text-center border rounded-lg p-3">
      <p className="text-xl font-semibold text-blue-600">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}
