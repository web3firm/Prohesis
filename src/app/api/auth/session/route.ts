import { handlers } from "@/lib/auth";

// Delegate to NextAuth's built-in session handler to avoid shadowing.
export const GET = handlers.GET;
