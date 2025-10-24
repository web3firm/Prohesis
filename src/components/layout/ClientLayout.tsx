"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/ui/Navbar";
import FooterGate from "@/components/ui/FooterGate";
import UsernameGate from "@/components/ui/UsernameGate";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminRoute = pathname.startsWith("/admin");

  return (
    <div className="flex flex-col min-h-screen">
      {!isAdminRoute && <Navbar />}
      <main className="flex-grow">
        {children}
        <UsernameGate />
      </main>
      <FooterGate />
    </div>
  );
}
