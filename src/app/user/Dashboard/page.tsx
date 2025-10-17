"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarIcon, AppWindow, User, Mail } from "lucide-react";
import { useAccount } from "wagmi";

export const dynamic = "force-dynamic";

export default function DashboardPage() {
  const { address } = useAccount();
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<any[]>([]);
  const [pending, setPending] = useState<any[]>([]);
  const [past, setPast] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      if (!address) return setLoading(false);
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
    <div className="space-y-6">
      {/* What's new */}
      <h1 className="text-2xl font-semibold text-gray-900">What's new</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <HeroCard title="Employee Happiness Conference 2023" subtitle="Registration is on" />
        <HeroCard title="New well-being packages" subtitle="" className="md:col-span-2" />
        <HeroCard title="Bring your dog to the office day is back!" subtitle="" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Events */}
        <Card>
          <SectionHeader title="Events" />
          <div className="flex items-center gap-3 text-blue-700 font-medium">
            <CalendarIcon size={18} /> July 2023
          </div>
          <CalendarStub />
        </Card>

        {/* Applications */}
        <Card className="md:col-span-1">
          <SectionHeader title="Applications" />
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "My profile" },
              { label: "Safe Ag" },
              { label: "Jira" },
              { label: "Wall" },
              { label: "HR Portal" },
              { label: "Payroll" },
            ].map((app) => (
              <div key={app.label} className="flex flex-col items-center gap-2 py-3 rounded-md hover:bg-blue-50 cursor-pointer">
                <div className="w-10 h-10 rounded-md bg-blue-600 text-white grid place-items-center">
                  <AppWindow size={18} />
                </div>
                <div className="text-xs text-gray-700 text-center">{app.label}</div>
              </div>
            ))}
          </div>
        </Card>

        {/* Contacts */}
        <Card>
          <SectionHeader title="Contacts" />
          <div className="space-y-3">
            {[
              { name: "Martin Coles", phone: "+000 111 222 333" },
              { name: "Adrien Wilson", phone: "+000 111 222 333" },
              { name: "Jane D", phone: "+000 111 222 333" },
            ].map((c) => (
              <div key={c.name} className="flex items-center justify-between p-2 rounded-md hover:bg-blue-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 grid place-items-center text-blue-700">
                    <User size={18} />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{c.name}</div>
                    <div className="text-xs text-gray-500">{c.phone}</div>
                  </div>
                </div>
                <button className="p-2 rounded-md border hover:bg-blue-50" title="Message">
                  <Mail size={16} />
                </button>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Link to markets */}
      <div className="pt-2">
        <Link href="/user/Markets" className="text-blue-600 hover:underline">Browse markets →</Link>
      </div>

      {/* Hidden bet sections still available if needed for future tabs */}
      <div className="hidden">
        <pre className="text-xs text-gray-500">Active: {active.length} | Pending: {pending.length} | Past: {past.length}</pre>
      </div>
    </div>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`bg-white border rounded-xl p-4 ${className}`}>{children}</section>;
}

function SectionHeader({ title }: { title: string }) {
  return <h2 className="text-lg font-semibold mb-3 text-gray-900">{title}</h2>;
}

function HeroCard({ title, subtitle = "", className = "" }: { title: string; subtitle?: string; className?: string }) {
  return (
    <div className={`relative rounded-xl overflow-hidden min-h-[160px] bg-[url('/hero-pattern.svg')] bg-cover bg-center ${className}`}>
      <div className="absolute inset-0 bg-gradient-to-tr from-blue-700/90 to-blue-500/70" />
      <div className="relative p-4 text-white">
        <div className="text-lg font-semibold max-w-xs">{title}</div>
        {subtitle && <div className="text-sm opacity-90 mt-1">{subtitle}</div>}
      </div>
    </div>
  );
}

function CalendarStub() {
  // Minimal static calendar grid to match the look
  const days = ["S","M","T","W","T","F","S"];
  const cells = Array.from({ length: 35 }, (_, i) => i + 1);
  return (
    <div className="mt-3">
      <div className="grid grid-cols-7 text-center text-xs text-gray-500">
        {days.map((d) => (
          <div key={d} className="py-1">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {cells.map((n) => (
          <div key={n} className={`py-2 text-xs rounded-md ${n === 12 ? "bg-blue-600 text-white" : "hover:bg-blue-50 text-gray-700"}`}>{n}</div>
        ))}
      </div>
    </div>
  );
}
