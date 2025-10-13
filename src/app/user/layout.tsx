"use client";

import Navbar from "@/components/ui/Navbar";

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-blue-50">
      <Navbar />
      <main className="max-w-7xl mx-auto p-4">{children}</main>
    </div>
  );
}
