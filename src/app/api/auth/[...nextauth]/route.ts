import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth/options";

const auth = NextAuth(authOptions as any);
export const GET: any = auth.handlers.GET;
export const POST: any = auth.handlers.POST;
