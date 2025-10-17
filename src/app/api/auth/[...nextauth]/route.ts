import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth/options";

const handler: any = NextAuth(authOptions);
const GET: any = handler;
const POST: any = handler;
export { GET, POST };
