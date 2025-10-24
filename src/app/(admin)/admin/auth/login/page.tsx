"use client";

import { signIn } from "next-auth/react";
import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAccount, useSignMessage } from "wagmi";
import { User, Lock, Eye, EyeOff, Shield, Wallet2 } from "lucide-react";
import Link from "next/link";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();

  // Restore remembered username
  useEffect(() => {
    const saved = localStorage.getItem("adminU");
    if (saved) {
      setUsername(saved);
      setRemember(true);
    }
  }, []);

  // --------------------------------------------
  // Admin Login (Env credentials)
  // --------------------------------------------
  async function handleLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg(null);
    setLoading(true);

    console.log("[LOGIN] Starting login process...");

    try {
      console.log("[LOGIN] Calling signIn...");
      const res: any = await signIn("env-credentials", {
        username,
        password,
        redirect: false,
      });

      console.log("[LOGIN] signIn response:", JSON.stringify(res, null, 2));

      if (res?.error) {
        console.log("[LOGIN] Error in response:", res.error);
        setMsg(res.error as string);
        setLoading(false);
        return;
      }
      
      if (res?.ok) {
        console.log("[LOGIN] Login successful! Setting cookie and redirecting...");
        // Set cookie RIGHT before navigation
        document.cookie = "forceAdminDash=1; Max-Age=15; Path=/; SameSite=Lax";
        console.log("[LOGIN] Cookie set, waiting 50ms...");
        // Small delay to ensure cookie is set
        await new Promise(resolve => setTimeout(resolve, 50));
        // Hard navigate to ensure no client/router race conditions
        console.log("[LOGIN] Navigating to /admin/dashboard...");
        window.location.href = "/admin/dashboard";
        return; // prevent clearing msg before navigation
      }

      console.log("[LOGIN] Unexpected response, not redirecting");
      setMsg("Unexpected login response");

      if (remember) localStorage.setItem("adminU", username);
      else localStorage.removeItem("adminU");
    } catch (err: any) {
      setMsg(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  // --------------------------------------------
  // Wallet Login (Signature verification)
  // --------------------------------------------
  async function handleWalletLogin() {
    setMsg(null);
    if (!isConnected || !address) {
      setMsg("Please connect your wallet first.");
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
        redirect: false,
      });
      if (res && typeof res === "object" && "error" in res && res.error) {
        setMsg(res.error as string);
      } else if (res?.ok !== false) {
        // Set cookie RIGHT before navigation
        document.cookie = "forceAdminDash=1; Max-Age=15; Path=/; SameSite=Lax";
        await new Promise(resolve => setTimeout(resolve, 50));
        window.location.href = "/admin/dashboard";
        return;
      }
    } catch (err: any) {
      setMsg(err.message || "Wallet login failed");
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
              <label className="text-sm font-medium text-gray-700">Username</label>
              <div className="mt-1 relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <User size={16} />
                </span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="w-full border rounded-xl pl-10 pr-3 py-2.5 bg-white/70 focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="admin"
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

          {/* Divider */}
          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400">or</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Wallet Login */}
          <button
            onClick={handleWalletLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2.5 border rounded-xl bg-white hover:bg-gray-50 transition-all"
          >
            <Wallet2 size={16} />
            Sign in with Wallet
          </button>

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
