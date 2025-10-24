import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth/options";

// Delegate to NextAuth's built-in session handler to avoid shadowing.
const auth = NextAuth(authOptions as any);
export const GET: any = auth.handlers.GET;
