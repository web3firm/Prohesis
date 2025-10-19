"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

const links = [
  { href: "/admin/dashboard", label: "🏠 Dashboard" },
  { href: "/admin/analytics", label: "📊 Analytics" },
  { href: "/admin/Markets", label: "🎯 Markets" },
  { href: "/admin/users", label: "👥 Users" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex flex-col w-56 bg-white border-r min-h-screen shadow-sm">
      {/* Brand */}
      <div className="px-5 py-4 border-b">
        <h2 className="text-lg font-semibold text-blue-600 tracking-tight">
          Prohesis Admin
        </h2>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 flex flex-col mt-4 px-2 space-y-1">
        {links.map((link) => {
          const active = pathname === link.href;
          return (
            <motion.div
              key={link.href}
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.1 }}
            >
              <Link
                href={link.href}
                className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  active
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-700 hover:bg-gray-50 hover:text-blue-600"
                }`}
              >
                {link.label}
              </Link>
            </motion.div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="mt-auto px-4 py-3 border-t text-xs text-gray-400">
        © {new Date().getFullYear()} Prohesis
      </div>
    </aside>
  );
}
