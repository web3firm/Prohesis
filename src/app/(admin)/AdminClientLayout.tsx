"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import * as Avatar from "@radix-ui/react-avatar";
import { Home, BarChart2, Store, Users, FileText, Settings, PlusCircle, LogOut, User as UserIcon, PanelLeftClose, PanelLeft } from "lucide-react";

function NavItem({ href, label, icon, collapsed }: { href: string; label: string; icon: React.ReactNode; collapsed: boolean }) {
  const pathname = usePathname();
  const active = pathname === href;
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
        active ? "bg-blue-600 text-white" : "text-white/80 hover:bg-white/10 hover:text-white"
      }`}
      title={collapsed ? label : undefined}
    >
      {icon}
      {!collapsed && <span className="text-sm font-medium">{label}</span>}
    </Link>
  );
}

export default function AdminClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [collapsed, setCollapsed] = useState(false);
  
  // Load collapsed state from localStorage on mount
  useEffect(() => {
    const savedState = localStorage.getItem('admin-sidebar-collapsed');
    if (savedState !== null) {
      setCollapsed(savedState === 'true');
    }
  }, []);
  
  // Save collapsed state to localStorage when it changes
  const toggleCollapsed = () => {
    const newState = !collapsed;
    setCollapsed(newState);
    localStorage.setItem('admin-sidebar-collapsed', String(newState));
  };
  
  // Render bare layout for the login route to avoid showing the admin sidebar
  if (pathname.startsWith("/admin/auth/login")) {
    return <div className="min-h-screen">{children}</div>;
  }
  
  return (
    <div className="flex min-h-screen" style={{ backgroundColor: "#EAF2FF" }}>
      {/* Blue sidebar - Fixed position */}
      <aside 
        className={`hidden lg:flex flex-col p-4 text-white fixed left-0 top-0 h-screen transition-all duration-300 ${
          collapsed ? 'w-20' : 'w-64'
        }`} 
        style={{ backgroundColor: "#1D4ED8", zIndex: 40 }}
      >
        <div className="flex items-center justify-between mb-4">
          {!collapsed && <div className="px-3 py-2 font-semibold text-lg text-blue-100">Prohesis Admin</div>}
          <button
            onClick={toggleCollapsed}
            className="p-2 rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition-colors ml-auto"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <PanelLeft size={20} /> : <PanelLeftClose size={20} />}
          </button>
        </div>
        
        <nav className="flex flex-col gap-1">
          <NavItem href="/admin/dashboard" label="Dashboard" icon={<Home size={16} />} collapsed={collapsed} />
          <NavItem href="/admin/analytics" label="Analytics" icon={<BarChart2 size={16} />} collapsed={collapsed} />
          <NavItem href="/admin/markets" label="Markets" icon={<Store size={16} />} collapsed={collapsed} />
          <NavItem href="/admin/users" label="Users" icon={<Users size={16} />} collapsed={collapsed} />
          <NavItem href="/admin/audits" label="Audits" icon={<FileText size={16} />} collapsed={collapsed} />
          <NavItem href="/admin/settings" label="Settings" icon={<Settings size={16} />} collapsed={collapsed} />
        </nav>
        
        <div className="mt-auto pt-4 border-t border-white/20 space-y-2">
          {!collapsed && (
            <Link href="/admin/markets" className="flex items-center gap-3 px-4 py-3 rounded-xl text-white/90 hover:bg-white/10 hover:text-white">
              <PlusCircle size={16} />
              <span className="text-sm font-medium">Add market</span>
            </Link>
          )}
          
          {/* Profile dropdown */}
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl text-white/90 hover:bg-white/10 hover:text-white">
                <div className="flex items-center gap-3">
                  <Avatar.Root className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-white/20">
                    <Avatar.Fallback className="text-white text-sm">
                      {(
                        ((session?.user as any)?.email?.[0]) ||
                        ((session?.user as any)?.wallet?.slice?.(2, 3)) ||
                        "A"
                      ).toUpperCase()}
                    </Avatar.Fallback>
                  </Avatar.Root>
                  {!collapsed && (
                    <div className="text-left">
                      <div className="text-sm font-medium truncate max-w-[120px]">
                        {(session?.user as any)?.email || (session?.user as any)?.wallet || "Admin"}
                      </div>
                      <div className="text-xs text-blue-100">Admin</div>
                    </div>
                  )}
                </div>
                {!collapsed && <UserIcon size={16} />}
              </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content side="top" align="end" className="min-w-[180px] rounded-md bg-white text-gray-800 shadow-lg p-1">
              <DropdownMenu.Item asChild>
                <button
                  className="w-full text-left block px-3 py-2 rounded hover:bg-gray-100 text-sm"
                  onClick={async () => {
                    try {
                      const res = await fetch('/api/admin/me');
                      const json = await res.json();
                      if (json?.success && json?.id) {
                        window.location.href = `/admin/users/${encodeURIComponent(json.id)}`;
                      } else {
                        window.location.href = '/admin/settings';
                      }
                    } catch {
                      window.location.href = '/admin/settings';
                    }
                  }}
                >
                  Profile & settings
                </button>
              </DropdownMenu.Item>
              <DropdownMenu.Separator className="my-1 h-px bg-gray-200" />
              <DropdownMenu.Item asChild>
                <button
                  onClick={() => signOut({ callbackUrl: "/admin/auth/login" })}
                  className="w-full text-left flex items-center gap-2 px-3 py-2 rounded hover:bg-gray-100 text-sm"
                >
                  <LogOut size={14} /> Log out
                </button>
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Root>
        </div>
      </aside>

      {/* Content area - Add margin to account for fixed sidebar */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${collapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
        <main className="p-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
