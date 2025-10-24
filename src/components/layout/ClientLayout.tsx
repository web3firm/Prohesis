"use client";

import { usePathname } from "next/navigation";
import Footer from "@/components/layout/Footer";
import UsernameGate from "@/components/ui/UsernameGate";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith("/admin");

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow">
        {children}
        {!isAdminRoute && <UsernameGate />}
      </main>
      {!isAdminRoute && <Footer />}
    </div>
  );
}
