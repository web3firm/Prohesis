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
        {/* Top header */}
        <header className="border-b bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <nav className="flex items-center gap-4">
                <button className="px-3 py-1 rounded-full border border-black text-sm">Home</button>
                <button className="px-3 py-1 text-sm">Apps</button>
                <button className="px-3 py-1 text-sm">Files</button>
                <button className="px-3 py-1 text-sm">Projects</button>
                <button className="px-3 py-1 text-sm">Learn</button>
              </nav>

              <div className="flex items-center gap-4">
                <button className="px-3 py-1 text-sm border rounded">Install App</button>
                <button className="px-3 py-1 bg-black text-white rounded">+ New Project</button>
                <div className="w-8 h-8 rounded-full bg-gray-200" />
              </div>
            </div>
          </div>
        </header>

        <main className="p-6 flex-1">{children}</main>
      </div>
    </div>
  );
}
