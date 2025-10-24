import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminPostLogin() {
  const session = await auth();
  const isAdmin = (session as any)?.isAdmin;
  
  // Debug logging
  console.log("[post-login] session:", JSON.stringify(session, null, 2));
  console.log("[post-login] isAdmin:", isAdmin);
  
  if (isAdmin) {
    console.log("[post-login] redirecting to /admin/dashboard");
    redirect("/admin/dashboard");
  }
  console.log("[post-login] redirecting to /admin/forbidden");
  redirect("/admin/forbidden");
}
