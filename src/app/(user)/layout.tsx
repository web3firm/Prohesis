"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";
import { useAccount, useDisconnect } from "wagmi";
import { ConnectWalletButton } from "@/components/web3/ConnectWalletButton";
import { Home, BarChart2, User as UserIcon, Settings, PanelLeft, PanelLeftClose, Sun, Moon, LogOut, Wallet, Menu, X } from "lucide-react";

function NavItem({ href, label, icon, collapsed }: { href: string; label: string; icon: React.ReactNode; collapsed: boolean }) {
  const pathname = usePathname();
  const active = pathname === href;
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
        active 
          ? "bg-white/20 text-white shadow-lg scale-105" 
          : "text-white/70 hover:bg-white/10 hover:text-white hover:scale-102"
      } ${collapsed ? "justify-center" : ""}`}
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("userSidebarCollapsed");
    if (stored) setCollapsed(stored === "1");
  }, []);
  useEffect(() => {
    localStorage.setItem("userSidebarCollapsed", collapsed ? "1" : "0");
  }, [collapsed]);

  if (!isConnected) {
    return (
      <div className="min-h-screen grid place-items-center bg-gray-50 dark:bg-gray-900 transition-colors">
        <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-2xl p-8 max-w-md text-center shadow-xl">
          <div className="text-3xl mb-4">🔐</div>
          <div className="text-2xl font-semibold mb-2 text-gray-900 dark:text-white">Connect your wallet</div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">Sign in with your wallet to access your dashboard and bets.</p>
          <ConnectWalletButton />
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-6">
            Or explore markets on the <Link href="/" className="text-blue-600 dark:text-blue-400 hover:underline">main page</Link>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center font-bold text-white text-lg">
            P
          </div>
          <span className="font-bold text-xl text-gray-900 dark:text-white">Prohesis</span>
        </Link>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={`lg:hidden fixed top-0 left-0 h-screen w-72 bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700 dark:from-gray-800 dark:via-gray-900 dark:to-gray-950 text-white shadow-2xl transition-transform duration-300 z-50 ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        } flex flex-col p-6`}
      >
        {/* Mobile Header */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/" className="flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}>
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center font-bold text-lg">
              P
            </div>
            <span className="font-bold text-xl">Prohesis</span>
          </Link>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-2 flex-1" onClick={() => setMobileMenuOpen(false)}>
          <NavItem href="/dashboard" label="Dashboard" icon={<Home size={20} />} collapsed={false} />
          <NavItem href="/analytics" label="Analytics" icon={<BarChart2 size={20} />} collapsed={false} />
          <NavItem href="/portfolio" label="Portfolio" icon={<Wallet size={20} />} collapsed={false} />
          <NavItem href="/profile" label="Profile" icon={<UserIcon size={20} />} collapsed={false} />
          <NavItem href="/settings" label="Settings" icon={<Settings size={20} />} collapsed={false} />
        </nav>

        {/* Footer Actions */}
        <div className="mt-auto pt-6 border-t border-white/20 space-y-2">
          <button
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white/90 hover:bg-white/10 hover:text-white transition-colors"
            onClick={() => {
              setTheme(theme === "dark" ? "light" : "dark");
              setMobileMenuOpen(false);
            }}
          >
            <Sun size={20} className={theme === "dark" ? "hidden" : "block"} />
            <Moon size={20} className={theme === "dark" ? "block" : "hidden"} />
            <span className="text-sm font-medium">Toggle Theme</span>
          </button>
          <button
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-200 hover:bg-red-500/20 hover:text-red-100 transition-colors"
            onClick={() => {
              disconnect();
              setMobileMenuOpen(false);
            }}
          >
            <LogOut size={20} />
            <span className="text-sm font-medium">Disconnect</span>
          </button>
        </div>
      </aside>

      {/* Desktop Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-screen hidden lg:flex flex-col p-6 bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700 dark:from-gray-800 dark:via-gray-900 dark:to-gray-950 text-white shadow-2xl transition-[width] duration-300 z-40 ${collapsed ? "w-20" : "w-72"}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          {!collapsed && (
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center font-bold text-lg group-hover:bg-white/30 transition-colors">
                P
              </div>
              <span className="font-bold text-xl">Prohesis</span>
            </Link>
          )}
          <button
            className={`${collapsed ? "" : "ml-auto"} p-2 rounded-lg hover:bg-white/10 transition-colors`}
            onClick={() => setCollapsed((v) => !v)}
            title={collapsed ? "Expand" : "Collapse"}
            aria-label="Toggle sidebar"
          >
            {collapsed ? <PanelLeft size={20} /> : <PanelLeftClose size={20} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-2 flex-1">
          <NavItem href="/dashboard" label="Dashboard" icon={<Home size={20} />} collapsed={collapsed} />
          <NavItem href="/analytics" label="Analytics" icon={<BarChart2 size={20} />} collapsed={collapsed} />
          <NavItem href="/portfolio" label="Portfolio" icon={<Wallet size={20} />} collapsed={collapsed} />
          <NavItem href="/profile" label="Profile" icon={<UserIcon size={20} />} collapsed={collapsed} />
          <NavItem href="/settings" label="Settings" icon={<Settings size={20} />} collapsed={collapsed} />
        </nav>

        {/* Footer Actions */}
        <div className="mt-auto pt-6 border-t border-white/20 space-y-2">
          <button
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white/90 hover:bg-white/10 hover:text-white transition-colors"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            title="Toggle theme"
          >
            <Sun size={20} className={theme === "dark" ? "hidden" : "block"} />
            <Moon size={20} className={theme === "dark" ? "block" : "hidden"} />
            {!collapsed && <span className="text-sm font-medium">Toggle Theme</span>}
          </button>
          <button
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-200 hover:bg-red-500/20 hover:text-red-100 transition-colors"
            onClick={() => disconnect()}
          >
            <LogOut size={20} />
            {!collapsed && <span className="text-sm font-medium">Disconnect</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`flex-1 flex flex-col transition-[margin] duration-300 ${collapsed ? "lg:ml-20" : "lg:ml-72"} pt-16 lg:pt-0`}>
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
