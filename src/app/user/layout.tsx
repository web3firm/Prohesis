"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { useAccount, useDisconnect } from "wagmi";
import { Home, Users, Newspaper, Briefcase, Grid, FileText, Heart, Sun, Moon, LogOut, Search, Bell, Settings } from "lucide-react";

const tabs = [
  { href: "/user/Dashboard", label: "Home" },
  { href: "/user/contacts", label: "Contacts" },
  { href: "/user/news", label: "News" },
  { href: "/user/employees", label: "For employees" },
  { href: "/user/apps", label: "Applications" },
  { href: "/user/docs", label: "Documents" },
];

function IconRail() {
  return (
    <aside className="hidden md:flex w-16 shrink-0 flex-col items-center gap-4 border-r bg-white/90 backdrop-blur py-4">
      <div className="w-8 h-8 rounded-full bg-blue-600 text-white grid place-items-center font-bold">P</div>
      <NavIcon icon={<Home size={18} />} href="/user/Dashboard" title="Home" />
      <NavIcon icon={<Users size={18} />} href="/user/contacts" title="Contacts" />
      <NavIcon icon={<Newspaper size={18} />} href="/user/news" title="News" />
      <NavIcon icon={<Briefcase size={18} />} href="/user/employees" title="For employees" />
      <NavIcon icon={<Grid size={18} />} href="/user/apps" title="Applications" />
      <NavIcon icon={<FileText size={18} />} href="/user/docs" title="Documents" />
      <div className="mt-auto pb-2">
        <NavIcon icon={<Heart size={18} />} href="#" title="Favorites" />
      </div>
    </aside>
  );
}

function NavIcon({ icon, href, title }: { icon: React.ReactNode; href: string; title: string }) {
  const pathname = usePathname();
  const active = pathname === href;
  return (
    <Link
      href={href}
      className={`p-2 rounded-lg transition-colors ${active ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-blue-50"}`}
      title={title}
    >
      {icon}
    </Link>
  );
}

export default function UserLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { isConnected } = useAccount();
  const { disconnect } = useDisconnect();

  return (
    <div className="min-h-screen flex bg-gradient-to-b from-blue-50 to-white">
      {/* Left icon rail */}
      <IconRail />

      {/* Main area */}
      <div className="flex-1 min-w-0">
        {/* Top navigation */}
        <div className="sticky top-0 z-20 bg-white/80 backdrop-blur border-b">
          <div className="mx-auto max-w-7xl px-4 py-3 flex items-center gap-4">
            {/* Brand */}
            <div className="hidden md:block text-xl font-semibold text-blue-700">Prohesis</div>

            {/* Tabs */}
            <nav className="hidden md:flex items-center gap-1">
              {tabs.map((t) => {
                const active = pathname === t.href;
                return (
                  <Link
                    key={t.href}
                    href={t.href}
                    className={`px-3 py-2 rounded-md text-sm transition-colors ${active ? "bg-blue-600 text-white" : "text-gray-700 hover:bg-blue-50"}`}
                  >
                    {t.label}
                  </Link>
                );
              })}
            </nav>

            {/* Search */}
            <div className="ml-auto flex-1 max-w-xl relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                placeholder="Search"
                className="w-full rounded-full border pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Theme + Notifications + Settings + Session */}
            <div className="flex items-center gap-2 ml-2">
              <button className="p-2 rounded-md border hover:bg-blue-50" title="Notifications">
                <Bell size={18} />
              </button>
              <button className="p-2 rounded-md border hover:bg-blue-50" title="Settings">
                <Settings size={18} />
              </button>
              <button
                className="p-2 rounded-md border hover:bg-blue-50"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                title="Toggle theme"
                aria-label="Toggle theme"
              >
                {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              {/* Avatar placeholder */}
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white grid place-items-center text-xs font-semibold" title="Profile">PR</div>
              {isConnected && (
                <button className="p-2 rounded-md border text-red-600 hover:bg-red-50" onClick={() => disconnect()} title="Disconnect">
                  <LogOut size={18} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <main className="max-w-7xl mx-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
