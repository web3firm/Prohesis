"use client";

import { signIn } from "next-auth/react";
import { useEffect, useState } from "react";
import { useAccount, useSignMessage } from "wagmi";
import { User, Lock, Eye, EyeOff, Shield } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();

  useEffect(() => {
    const u = localStorage.getItem("adminU");
    if (u) {
      setUsername(u);
      setRemember(true);
    }
  }, []);

  async function adminLogin(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setLoading(true);
    try {
      const res: any = await signIn("credentials", {
        username,
        password,
        redirect: true,
        callbackUrl: "/admin",
      });
      if (res && res.error) setMsg(res.error);
      if (remember) localStorage.setItem("adminU", username);
      else localStorage.removeItem("adminU");
    } catch (e: any) {
      setMsg(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function walletLogin() {
    setMsg(null);
    if (!isConnected || !address) {
      setMsg("Connect wallet first");
      return;
    }
    setLoading(true);
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
      if (res && res.error) setMsg(res.error);
    } catch (e: any) {
      setMsg(e.message || "Failed to sign");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 items-stretch bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Left: Form */}
      <div className="w-full flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 text-blue-700 font-semibold">
              <Shield size={18} /> Prohesis Admin
            </div>
            <h1 className="mt-3 text-3xl font-bold text-gray-900">Welcome back</h1>
            <p className="text-gray-500">Sign in to manage markets, resolve outcomes, and review analytics.</p>
          </div>

          {msg && (
            <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 px-3 py-2 text-sm">
              {msg}
            </div>
          )}

          <form onSubmit={adminLogin} className="space-y-4">
            <div>
              <label className="text-sm text-gray-700">Username</label>
              <div className="mt-1 relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <User size={16} />
                </span>
                <input
                  type="text"
                  className="w-full border rounded-xl pl-10 pr-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="admin"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-sm text-gray-700">Password</label>
              <div className="mt-1 relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <Lock size={16} />
                </span>
                <input
                  type={showPass ? "text" : "password"}
                  className="w-full border rounded-xl pl-10 pr-10 py-2 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowPass((s) => !s)}
                  aria-label={showPass ? "Hide password" : "Show password"}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="inline-flex items-center gap-2 text-gray-600">
                <input type="checkbox" className="rounded border-gray-300" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
                Remember me
              </label>
              <Link href="/docs" className="text-blue-700 hover:underline">Forgot password?</Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium shadow hover:opacity-95 disabled:opacity-60"
            >
              {loading ? "Signing in…" : "Login"}
            </button>
          </form>

          <div className="mt-4 text-center">
            <button
              onClick={walletLogin}
              className="inline-flex items-center justify-center w-full py-2.5 rounded-xl border bg-white hover:bg-gray-50"
              disabled={loading}
            >
              Sign in with wallet
            </button>
          </div>

          <p className="mt-6 text-xs text-gray-500 text-center">
            By signing in you agree to our <Link href="/terms" className="text-blue-700 hover:underline">Terms</Link> and <Link href="/privacy" className="text-blue-700 hover:underline">Privacy Policy</Link>.
          </p>
        </div>
      </div>

      {/* Right: Decorative panel */}
      <div className="relative hidden lg:block overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-indigo-600" />
        <div className="absolute -left-24 -bottom-24 w-[140%] h-[140%] rounded-tl-[120px] rounded-bl-[120px] bg-white/5 blur-2xl" />
        {/* Simple "laptop" illustration */}
        <div className="relative h-full w-full grid place-items-center p-10">
          <div className="relative w-[520px] max-w-[80%]">
            <div className="absolute -bottom-10 left-4 right-4 h-6 bg-black/20 blur-xl rounded-full" />
            <div className="relative bg-white rounded-2xl shadow-2xl p-8">
              <div className="h-36 rounded-xl bg-gradient-to-tr from-blue-200 via-indigo-100 to-sky-100" />
              <div className="mt-4 grid grid-cols-3 gap-2">
                <div className="h-10 rounded-md bg-gradient-to-tr from-blue-100 to-white" />
                <div className="h-10 rounded-md bg-gradient-to-tr from-indigo-100 to-white" />
                <div className="h-10 rounded-md bg-gradient-to-tr from-sky-100 to-white" />
              </div>
            </div>
            <div className="absolute -right-6 -top-6 w-24 h-24 rounded-3xl bg-white/20 rotate-12" />
            <div className="absolute -left-10 top-10 w-20 h-20 rounded-3xl bg-white/10 -rotate-6" />
          </div>
        </div>
      </div>
    </div>
  );
}
