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
import bcrypt from "bcryptjs";

import prisma from "@/lib/offchain/services/dbClient";

const LOGIN_PAGE = "/admin/auth/login";

async function emailIsInAdminTable(email?: string | null) {
  const e = email?.toLowerCase();
  if (!e) return false;
  const admin = await prisma.admin.findFirst({ where: { email: e }, select: { id: true } });
  return Boolean(admin);
}

async function authenticateAdmin(identity: string, password: string): Promise<{ email: string; name?: string } | null> {
  const identityLower = identity.toLowerCase();
  
  // Try to find admin in database first
  const admin = await prisma.admin.findFirst({
    where: {
      OR: [
        { email: identityLower },
        { wallet: identityLower },
      ],
      isActive: true, // Only allow active admins
    },
    select: {
      email: true,
      wallet: true,
      passwordHash: true,
      name: true,
    }
  });

  if (admin) {
    // If admin has a password hash, verify it
    if (admin.passwordHash) {
      const passwordMatch = await bcrypt.compare(password, admin.passwordHash);
      if (passwordMatch) {
        return { 
          email: admin.email || admin.wallet || identityLower, 
          name: admin.name || "Admin" 
        };
      }
    }
    // If no password hash, check against env variable (fallback for migration)
    const envPass = process.env.ADMIN_PASS || "";
    if (envPass && password === envPass) {
      return { 
        email: admin.email || admin.wallet || identityLower, 
        name: admin.name || "Admin" 
      };
    }
  }

  // Fallback to environment variable authentication (for initial setup)
  const envEmail = (process.env.ADMIN_USER || "").toLowerCase();
  const envUsername = (process.env.ADMIN_USERNAME || "").toLowerCase();
  const envPass = process.env.ADMIN_PASS || "";

  if (!envPass || password !== envPass) {
    return null;
  }

  // Check if identity matches env credentials
  if (identity.includes("@")) {
    if (envEmail && identityLower === envEmail) {
      return { email: identityLower };
    }
  } else {
    if (envUsername && identityLower === envUsername) {
      return { email: envEmail && envEmail.includes("@") ? envEmail : `${envUsername}@local` };
    }
    if (envEmail && !envEmail.includes("@") && identityLower === envEmail) {
      return { email: `${envEmail}@local` };
    }
  }

  return null;
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
        identity: { label: "Email or Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const identityRaw = String(credentials?.identity || "").trim();
        const password = String(credentials?.password || "");
        if (!identityRaw || !password) return null;

        const result = await authenticateAdmin(identityRaw, password);
        if (!result) return null;

        return { 
          id: result.email, 
          email: result.email, 
          name: result.name || "Admin", 
          isAdmin: true 
        } as unknown as User;
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
      const prev = Boolean((token as any)?.isAdmin);
      if (user?.email) {
        token.email = user.email;
        // Mark as admin directly on sign-in; also re-check on refresh
        const envUser = (process.env.ADMIN_USER || "").toLowerCase();
        const envUsername = (process.env.ADMIN_USERNAME || "").toLowerCase();
        const userEmail = user.email.toLowerCase();
        
        // Admin if:
        // - explicitly marked by authorize
        // - email matches ADMIN_USER (if it contains @)
        // - email is synthesized from ADMIN_USER or ADMIN_USERNAME (@local)
        // - email exists in Admin table
        const isEnvAdmin = 
          (envUser.includes("@") && userEmail === envUser) ||
          (envUser && !envUser.includes("@") && userEmail === `${envUser}@local`) ||
          (envUsername && userEmail === `${envUsername}@local`);
        
        token.isAdmin = prev || (user as any).isAdmin === true || isEnvAdmin || (await emailIsInAdminTable(user.email));
      } else if (token?.email) {
        const envUser = (process.env.ADMIN_USER || "").toLowerCase();
        const envUsername = (process.env.ADMIN_USERNAME || "").toLowerCase();
        const tokenEmail = String(token.email).toLowerCase();
        
        const isEnvAdmin = 
          (envUser.includes("@") && tokenEmail === envUser) ||
          (envUser && !envUser.includes("@") && tokenEmail === `${envUser}@local`) ||
          (envUsername && tokenEmail === `${envUsername}@local`);
        
        token.isAdmin = prev || isEnvAdmin || (await emailIsInAdminTable(String(token.email)));
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
