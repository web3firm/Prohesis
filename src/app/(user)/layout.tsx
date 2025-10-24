"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";
import { useAccount, useDisconnect } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Home, BarChart2, User as UserIcon, Settings, ChevronLeft, ChevronRight, Sun, Moon, LogOut, Wallet } from "lucide-react";

function NavItem({ href, label, icon, collapsed }: { href: string; label: string; icon: React.ReactNode; collapsed: boolean }) {
  const pathname = usePathname();
  const active = pathname === href;
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
        active ? "bg-blue-600 text-white" : "text-white/80 hover:bg-white/10 hover:text-white"
      }`}
      title={label}
    >
      {icon}
      {!collapsed && <span className="text-sm font-medium">{label}</span>}
    </Link>
  );
}

export default function UserLayout({ children }: { children: React.ReactNode }) {
  const { theme, setTheme } = useTheme();
  const { isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("userSidebarCollapsed");
    if (stored) setCollapsed(stored === "1");
  }, []);
  useEffect(() => {
    localStorage.setItem("userSidebarCollapsed", collapsed ? "1" : "0");
  }, [collapsed]);

  if (!isConnected) {
    return (
      <div className="min-h-screen grid place-items-center" style={{ backgroundColor: "#EAF2FF" }}>
        <div className="bg-white/80 backdrop-blur border rounded-2xl p-8 max-w-md text-center shadow-sm">
          <div className="text-2xl font-semibold mb-2 text-blue-700">Connect your wallet</div>
          <p className="text-sm text-gray-600 mb-4">Sign in with your wallet to access your dashboard and bets.</p>
          <div className="inline-block"><ConnectButton /></div>
          <p className="text-xs text-gray-400 mt-4">Or explore markets on the <Link href="/" className="text-blue-600 hover:underline">main page</Link>.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: "#EAF2FF" }}>
      <aside
        className={`hidden lg:flex flex-col p-4 text-white transition-[width] duration-200 ${collapsed ? "w-20" : "w-64"}`}
        style={{ backgroundColor: "#1D4ED8" }}
      >
        <div className="flex items-center justify-between mb-4">
          {!collapsed && <div className="px-3 py-2 font-semibold text-lg text-blue-200"><Link href="/" className="logo">Prohesis</Link></div>}
          <button
            className="ml-auto p-2 rounded-lg hover:bg-white/10"
            onClick={() => setCollapsed((v) => !v)}
            title={collapsed ? "Expand" : "Collapse"}
            aria-label="Toggle sidebar"
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>
        <nav className="flex flex-col gap-1">
          <NavItem href="/dashboard" label="Dashboard" icon={<Home size={16} />} collapsed={collapsed} />
          <NavItem href="/analytics" label="Analytics" icon={<BarChart2 size={16} />} collapsed={collapsed} />
          <NavItem href="/portfolio" label="Portfolio" icon={<Wallet size={16} />} collapsed={collapsed} />
          <NavItem href="/profile" label="Profile" icon={<UserIcon size={16} />} collapsed={collapsed} />
          <NavItem href="/settings" label="Settings" icon={<Settings size={16} />} collapsed={collapsed} />
        </nav>
        <div className="mt-auto pt-4 border-t border-white/20 space-y-2">
          <button
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-white/80 hover:bg-white/10 hover:text-white"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            title="Toggle theme"
          >
            {<Sun size={16} className={theme === "dark" ? "hidden" : "block"} />}
            {<Moon size={16} className={theme === "dark" ? "block" : "hidden"} />}
            {!collapsed && <span className="text-sm font-medium">Theme</span>}
          </button>
          <button
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-white/80 hover:bg-white/10 hover:text-white"
            onClick={() => disconnect()}
          >
            <LogOut size={16} />
            {!collapsed && <span className="text-sm font-medium">Disconnect</span>}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col">
        <main className="p-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
