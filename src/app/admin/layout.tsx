"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BarChart2, Store, Users, FileText, Settings, PlusCircle, LogOut } from "lucide-react";

function NavItem({ href, label, icon }: { href: string; label: string; icon: React.ReactNode }) {
  const pathname = usePathname();
  const active = pathname === href;
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
        active ? "bg-[#9b6bff] text-white" : "text-white/80 hover:bg-white/10 hover:text-white"
      }`}
    >
      {icon}
      <span className="text-sm font-medium">{label}</span>
    </Link>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen" style={{ backgroundColor: "#EDE4FF" }}>
      {/* Purple sidebar */}
      <aside className="hidden lg:flex w-64 flex-col p-4 text-white" style={{ backgroundColor: "#7E3AF2" }}>
        <div className="px-3 py-2 mb-4 font-semibold text-lg">Prohesis Admin</div>
        <nav className="flex flex-col gap-1">
          <NavItem href="/admin" label="Dashboard" icon={<Home size={16} />} />
          <NavItem href="/admin/analytics" label="Analytics" icon={<BarChart2 size={16} />} />
          <NavItem href="/admin/Markets" label="Markets" icon={<Store size={16} />} />
          <NavItem href="/admin/users" label="Users" icon={<Users size={16} />} />
          <NavItem href="/admin/audits" label="Audits" icon={<FileText size={16} />} />
          <NavItem href="/admin/settings" label="Settings" icon={<Settings size={16} />} />
        </nav>
        <div className="mt-auto pt-4 border-t border-white/20 space-y-2">
          <Link href="/admin/Markets" className="flex items-center gap-3 px-4 py-3 rounded-xl text-white/90 hover:bg-white/10 hover:text-white">
            <PlusCircle size={16} />
            <span className="text-sm font-medium">Add market</span>
          </Link>
          <button className="flex items-center gap-3 px-4 py-3 rounded-xl text-white/80 hover:bg-white/10 hover:text-white">
            <LogOut size={16} />
            <span className="text-sm font-medium">Log out</span>
          </button>
        </div>
      </aside>

      {/* Content area */}
      <div className="flex-1 flex flex-col">
        <main className="p-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
