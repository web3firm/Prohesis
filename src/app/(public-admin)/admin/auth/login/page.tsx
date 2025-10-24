"use client";

import { signIn } from "next-auth/react";
import { useState, useEffect, FormEvent } from "react";
import { motion } from "framer-motion";
import { User, Lock, Eye, EyeOff, Shield } from "lucide-react";
import Link from "next/link";

export default function AdminLoginPage() {
  const [identity, setIdentity] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // Restore remembered username
  useEffect(() => {
    const saved = localStorage.getItem("adminIdentity");
    if (saved) {
      setIdentity(saved);
      setRemember(true);
    }
  }, []);

  // --------------------------------------------
  // Admin Login (credentials)
  // --------------------------------------------
  async function handleLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg(null);
    setLoading(true);

    try {
      const res = await signIn("admin-credentials", {
        identity,
        password,
        redirect: true,
        callbackUrl: "/admin/post-login",
      });
      // When redirect: true, control should not reach here normally.
      if (remember) localStorage.setItem("adminIdentity", identity);
      else localStorage.removeItem("adminIdentity");
      // If it does, show a generic message.
      setMsg((res as any)?.error || "Redirecting...");
    } catch (err: any) {
      setMsg(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  // --------------------------------------------
  // UI
  // --------------------------------------------
  return (
    <div className="min-h-screen flex bg-gradient-to-br from-blue-50 via-white to-indigo-50 text-gray-900">
      {/* Left Pane — Login Form */}
      <motion.div
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-1 items-center justify-center p-8"
      >
        <div className="w-full max-w-md space-y-6 bg-white/70 backdrop-blur-xl shadow-card rounded-2xl p-8 border border-white/50">
          {/* Header */}
          <div className="text-center mb-4">
            <div className="inline-flex items-center gap-2 text-blue-700 font-semibold">
              <Shield size={18} /> Prohesis Admin
            </div>
            <h1 className="mt-2 text-3xl font-bold">Welcome back</h1>
            <p className="text-gray-500 text-sm">
              Sign in to manage markets, verify outcomes, and oversee analytics.
            </p>
          </div>

          {/* Error message */}
          {msg && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-lg border border-red-200 bg-red-50 text-red-700 px-3 py-2 text-sm text-center"
            >
              {msg}
            </motion.div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Email or Username</label>
              <div className="mt-1 relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <User size={16} />
                </span>
                <input
                  type="text"
                  value={identity}
                  onChange={(e) => setIdentity(e.target.value)}
                  required
                  className="w-full border rounded-xl pl-10 pr-3 py-2.5 bg-white/70 focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="admin or admin@example.com"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Password</label>
              <div className="mt-1 relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <Lock size={16} />
                </span>
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full border rounded-xl pl-10 pr-10 py-2.5 bg-white/70 focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="inline-flex items-center gap-2 text-gray-600">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="rounded border-gray-300"
                />
                Remember me
              </label>
              <Link
                href="/docs"
                className="text-blue-700 hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium shadow hover:opacity-95 disabled:opacity-60 transition-all"
            >
              {loading ? "Signing in…" : "Login"}
            </button>
          </form>

          <p className="text-xs text-gray-500 text-center mt-4">
            By signing in, you agree to our{" "}
            <Link href="/terms" className="text-blue-700 hover:underline">
              Terms
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="text-blue-700 hover:underline">
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </motion.div>

      {/* Right Pane — Illustration */}
      <motion.div
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="hidden lg:flex flex-1 items-center justify-center relative overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-800"
      >
        <div className="absolute inset-0 bg-[url('/hero-pattern.svg')] opacity-20" />
        <div className="relative text-white text-center px-10">
          <h2 className="text-4xl font-bold mb-4 drop-shadow-md">
            Prohesis Admin Portal
          </h2>
          <p className="text-blue-100 max-w-md mx-auto mb-8">
            Securely manage prediction markets, users, and analytics — all in one
            sleek dashboard.
          </p>
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ repeat: Infinity, duration: 3 }}
            className="mx-auto w-80 h-48 rounded-2xl bg-white/10 backdrop-blur-md shadow-2xl border border-white/10"
          />
        </div>
      </motion.div>
    </div>
  );
}
