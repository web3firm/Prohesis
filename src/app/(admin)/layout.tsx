import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import AdminClientLayout from "./AdminClientLayout";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Bypass server-side guard for the public login route (marked by middleware)
  const h = await headers();
  const isPublicLogin = h.get("x-admin-login-route") === "1";
  const isPublicForbidden = h.get("x-admin-forbidden-route") === "1";
  const isPublicPostLogin = h.get("x-admin-post-login-route") === "1";
  if (isPublicLogin || isPublicForbidden || isPublicPostLogin) {
    return <AdminClientLayout>{children}</AdminClientLayout>;
  }

  const session = await auth();
  if (!(session as any)?.isAdmin) {
    redirect("/admin/forbidden");
  }
  return <AdminClientLayout>{children}</AdminClientLayout>;
}
