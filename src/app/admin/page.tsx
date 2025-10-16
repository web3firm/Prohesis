"use client";

import { motion } from "framer-motion";
import useSWR from "swr";
import { ChartCard } from "@/components/shared/ChartCard";

interface Market {
  id: string;
  title: string;
  status: string;
  total_pool: number;
}

interface AdminOverview {
  totalMarkets: number;
  totalVolume: number;
  totalBets: number;
  resolvedMarkets: number;
  recentMarkets: Market[];
  salesHistory?: { month: string; sales: number }[];
  weeklyRevenue?: number[];
  customerBreakdown?: { label: string; value: number }[];
}

const fetcher = (url: string): Promise<AdminOverview> =>
  fetch(url).then((r) => r.json());

function MetricCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-5">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="text-2xl font-bold mt-2 text-gray-900">{value}</div>
    </div>
  );
}

function DonutChart({ data }: { data: { label: string; value: number }[] }) {
  // lightweight static donut using CSS gradients for simplicity
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  return (
    <div className="bg-white rounded-lg p-4 shadow-sm">
      <h3 className="text-sm font-semibold mb-3">Customer Analytics</h3>
      <div className="flex items-center gap-4">
        <div className="w-36 h-36 rounded-full bg-gradient-to-r from-violet-400 to-indigo-500 flex items-center justify-center text-white font-semibold">
          {total}
        </div>
        <ul className="text-sm space-y-2">
          {data.map((d) => (
            <li key={d.label} className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-500" />
              <span className="text-gray-700">{d.label}</span>
              <span className="ml-2 text-gray-500">{d.value}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function RecentOrders({ orders }: { orders: { id: string; name: string; price: string; status: string }[] }) {
  return (
    <div className="bg-white rounded-lg p-4 shadow-sm">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-semibold">Recent Orders</h3>
        <a className="text-xs text-blue-600">View all</a>
      </div>
      <ul className="space-y-3">
        {orders.map((o) => (
          <li key={o.id} className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">{o.name}</div>
              <div className="text-xs text-gray-400">#{o.id}</div>
            </div>
            <div className="text-right">
              <div className="text-sm font-semibold">{o.price}</div>
              <div className="text-xs text-gray-400">{o.status}</div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function AdminDashboard() {
  const { data, error } = useSWR<AdminOverview>("/api/admin/overview", fetcher);

  if (error) return <div>Error loading analytics.</div>;
  if (!data) return <div>Loading...</div>;

  const salesLabels = (data.salesHistory || []).map((s) => s.month) || ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const salesData = (data.salesHistory || []).map((s) => s.sales) || [12000,18000,15000,20000,25000,22000,30000,28000,32000,35000,37000,42000];
  const weekly = data.weeklyRevenue || [3000,4000,3500,5000,4800,6200,5800];
  const donut = data.customerBreakdown || [{ label: 'New', value: 6000 }, { label: 'Returning', value: 4000 }];

  const recentOrders = data.recentMarkets.slice(0,4).map((m) => ({ id: m.id, name: m.title, price: `$${(m.total_pool||0).toFixed(2)}`, status: m.status }));

  return (
    <div className="space-y-6">
      <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard label="Total Revenue" value={`$${Number(data.totalVolume).toLocaleString()}`} />
        <MetricCard label="Orders" value={data.totalBets} />
        <MetricCard label="Customers" value={Math.round(data.totalMarkets * 4)} />
        <MetricCard label="Products" value={573} />
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <ChartCard title="Sales Overview" labels={salesLabels} data={salesData} color="#6366f1" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ChartCard title="Weekly Revenue" labels={["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]} data={weekly} color="#8b5cf6" />
            <DonutChart data={donut} />
          </div>
        </div>

        <div className="space-y-6">
          <RecentOrders orders={recentOrders} />
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <h3 className="text-sm font-semibold mb-2">Quick Actions</h3>
            <div className="flex flex-col gap-2">
              <button className="px-4 py-2 bg-blue-600 text-white rounded">Create Market</button>
              <button className="px-4 py-2 border rounded">Sync Pools</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
