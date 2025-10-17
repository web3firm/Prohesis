"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useAccount, useSignMessage } from "wagmi";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const [msg, setMsg] = useState<string | null>(null);

  async function emailLogin(e: any) {
    e.preventDefault();
    setMsg(null);
    try {
      const res = await signIn("email-credentials", { email, password: (window as any).adminInvite || "", redirect: true, callbackUrl: "/admin" });
      if ((res as any)?.error) setMsg((res as any).error);
    } catch (e: any) {
      setMsg(e.message);
    }
  }

  async function walletLogin() {
    setMsg(null);
    if (!isConnected || !address) {
      setMsg("Connect wallet first");
      return;
    }
    const message = `Prohesis Admin Login\nts=${Date.now()}`;
    try {
      const signature = await signMessageAsync({ message });
  const res: any = await signIn("wallet-credentials", {
        wallet: address,
        message,
        signature,
        redirect: true,
        callbackUrl: "/admin",
      });
  if (res && (res as any).error) setMsg((res as any).error);
    } catch (e: any) {
      setMsg(e.message || "Failed to sign");
    }
  }

  return (
    <div className="min-h-screen grid place-items-center p-6" style={{ backgroundColor: "#EDE4FF" }}>
      <div className="w-full max-w-md bg-white rounded-2xl border p-6 space-y-6">
        <h1 className="text-xl font-semibold">Admin Sign In</h1>
        {msg && <div className="text-sm text-blue-600">{msg}</div>}

        <form onSubmit={emailLogin} className="space-y-3">
          <label className="text-sm text-gray-600">Email</label>
          <input
            type="email"
            className="w-full border rounded-md px-3 py-2"
            placeholder="admin@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button type="submit" className="w-full py-2 rounded-md bg-[#7E3AF2] text-white">Sign in with email</button>
        </form>

        <div className="text-center text-sm text-gray-500">or</div>

        <button onClick={walletLogin} className="w-full py-2 rounded-md border">Sign in with wallet</button>
      </div>
    </div>
  );
}
