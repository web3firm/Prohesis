/**
 * Prohesis · NextAuth v5 Minimal Admin-Only Configuration
 * -------------------------------------------------------
 * - Single credentials provider for admin sign-in
 * - Deterministic server-side redirect via callbackUrl (no redirect callback)
 * - JWT session with explicit isAdmin flag
 */

import Credentials from "next-auth/providers/credentials";
import type { NextAuthConfig, User, Session } from "next-auth";
import type { AdapterUser } from "next-auth/adapters";
import type { JWT } from "next-auth/jwt";

import prisma from "@/lib/offchain/services/dbClient";

const LOGIN_PAGE = "/admin/auth/login";

async function emailIsInAdminTable(email?: string | null) {
  const e = email?.toLowerCase();
  if (!e) return false;
  const admin = await prisma.admin.findFirst({ where: { email: e }, select: { id: true } });
  return Boolean(admin);
}

type JwtArgs = { token: JWT; user?: User | AdapterUser | null };
type SessionArgs = { session: Session; token: JWT };

export const authOptions: NextAuthConfig = {
  secret: process.env.NEXTAUTH_SECRET,

  pages: {
    signIn: LOGIN_PAGE,
    error: LOGIN_PAGE,
  },

  providers: [
    Credentials({
      id: "admin-credentials",
      name: "Admin",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = String(credentials?.email || "").toLowerCase();
        const password = String(credentials?.password || "");
        if (!email || !password) return null;

        // Allow either the seeded admin email or the env user, protected by ADMIN_PASS
        const adminExists = await emailIsInAdminTable(email);
        const envEmail = (process.env.ADMIN_USER || "").toLowerCase();
        const pass = process.env.ADMIN_PASS || "";

        // Constant-time-ish comparison guardrails
        const emailAllowed = adminExists || (envEmail && email === envEmail);
        const passAllowed = pass && password === pass;
        if (!emailAllowed || !passAllowed) return null;

        return { id: email, email, name: "Admin" } satisfies User;
      },
    }),
  ],

  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60,
    updateAge: 10 * 60,
  },

  jwt: { maxAge: 24 * 60 * 60 },

  callbacks: {
    async jwt({ token, user }: JwtArgs) {
      if (user?.email) {
        token.email = user.email;
        // Mark as admin directly on sign-in; also re-check on refresh
        const envEmail = (process.env.ADMIN_USER || "").toLowerCase();
        token.isAdmin = user.email.toLowerCase() === envEmail || (await emailIsInAdminTable(user.email));
      } else if (token?.email) {
        const envEmail = (process.env.ADMIN_USER || "").toLowerCase();
        token.isAdmin = String(token.email).toLowerCase() === envEmail || (await emailIsInAdminTable(String(token.email)));
      }
      return token;
    },
    async session({ session, token }: SessionArgs) {
      session.user = session.user || ({} as Session["user"]);
      (session.user as any).email = token.email;
      (session.user as any).isAdmin = Boolean((token as any)?.isAdmin);
      (session as any).isAdmin = Boolean((token as any)?.isAdmin);
      return session;
    },
  },
};
