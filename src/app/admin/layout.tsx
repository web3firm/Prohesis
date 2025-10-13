"use client";

import Sidebar from "@/components/layout/Sidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        {/* Optional Navbar */}
        <main className="p-6 flex-1">{children}</main>
      </div>
    </div>
  );
}
