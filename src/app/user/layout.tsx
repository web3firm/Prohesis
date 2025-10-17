"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { useAccount, useDisconnect } from "wagmi";

export default function UserLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { isConnected } = useAccount();
  const { disconnect } = useDisconnect();

  const Item = ({ href, label }: { href: string; label: string }) => {
    const active = pathname === href;
    return (
      <Link href={href} className={`px-3 py-2 rounded-lg text-sm ${active ? "bg-blue-600 text-white" : "text-gray-800 hover:bg-blue-50"}`}>
        {label}
      </Link>
    );
  };

  return (
    <div className="min-h-screen flex" data-theme={theme}>
      {/* Sidebar */}
      <aside className="hidden md:flex w-60 flex-col gap-2 border-r bg-white p-4">
        <div className="text-lg font-semibold text-blue-600 mb-2">Prohesis</div>
        <nav className="flex flex-col gap-1">
          <Item href="/user/Dashboard" label="Dashboard" />
          <Item href="/user/profile" label="Profile" />
          <Item href="/user/Settings" label="Settings" />
          <Item href="/user/analytics" label="Analytics" />
        </nav>
        <div className="mt-auto space-y-2">
          <button
            className="w-full px-3 py-2 rounded-lg border text-sm"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            title="Toggle theme"
          >
            {theme === "dark" ? "Light mode" : "Dark mode"}
          </button>
          {isConnected && (
            <button className="w-full px-3 py-2 rounded-lg border text-sm text-red-600" onClick={() => disconnect()}>
              Disconnect
            </button>
          )}
        </div>
      </aside>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Top bar with search */}
        <div className="sticky top-0 z-10 bg-white/70 backdrop-blur border-b">
          <div className="max-w-7xl mx-auto flex items-center gap-3 p-3">
            <input
              placeholder="Search markets..."
              className="w-full md:w-2/3 border rounded-full px-4 py-2 text-sm"
            />
          </div>
        </div>
        <main className="max-w-7xl mx-auto p-4">{children}</main>
      </div>
    </div>
  );
}
