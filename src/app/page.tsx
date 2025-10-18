"use client";
import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, Wallet, ChartBar, Lock, CheckCircle, Percent } from "lucide-react";

export default function HomePage() {
  const [tab, setTab] = useState<"traders" | "creators">("traders");

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-white to-blue-50">
      {/* Lightweight landing navbar */}
      <header className="sticky top-0 z-30 border-b bg-white/80 backdrop-blur">
        <div className="max-w-7xl mx-auto h-16 px-4 flex items-center justify-between">
          <Link href="/" className="text-lg font-semibold text-blue-700">Prohesis</Link>
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <Link href="/docs" className="text-gray-700 hover:text-blue-700">Docs</Link>
            <Link href="/about" className="text-gray-700 hover:text-blue-700">About</Link>
            <Link href="/terms" className="text-gray-700 hover:text-blue-700">Terms</Link>
            <Link
              href="/app"
              className="ml-2 inline-flex items-center gap-2 rounded-full bg-gray-900 text-white px-4 py-2 hover:bg-black transition-colors"
              title="Go to App"
            >
              Go to App
            </Link>
          </nav>
          {/* Mobile menu minimal: only CTA */}
          <div className="md:hidden">
            <Link href="/app" className="inline-flex items-center rounded-full bg-gray-900 text-white px-4 py-2 hover:bg-black">Go to App</Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 pt-16 pb-12 text-center">
        <span className="inline-block text-xs font-semibold tracking-wider text-blue-700 bg-blue-100 px-3 py-1 rounded-full mb-4">On-chain prediction markets</span>
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-gray-900">
          Predict the future. <span className="text-blue-700">On-chain.</span>
        </h1>
        <p className="mt-4 text-gray-600 text-lg max-w-2xl mx-auto">
          Create and trade markets with transparent odds, low fees, and trustless settlements on Ethereum.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link href="/app" className="inline-flex items-center rounded-xl bg-gray-900 text-white px-5 py-3 hover:bg-black">
            Go to App
          </Link>
          <Link href="/docs" className="inline-flex items-center rounded-xl border border-gray-300 bg-white text-gray-900 px-5 py-3 hover:bg-gray-50">
            View Docs
          </Link>
        </div>
      </section>

      {/* Slides (tabs) */}
      <section className="max-w-6xl mx-auto px-4 mt-6">
        <div className="mx-auto w-fit bg-white border rounded-full p-1 flex gap-1">
          <button
            className={`px-4 py-1.5 rounded-full text-sm ${tab === "traders" ? "bg-blue-600 text-white" : "text-gray-700 hover:bg-gray-50"}`}
            onClick={() => setTab("traders")}
          >
            For Traders
          </button>
          <button
            className={`px-4 py-1.5 rounded-full text-sm ${tab === "creators" ? "bg-blue-600 text-white" : "text-gray-700 hover:bg-gray-50"}`}
            onClick={() => setTab("creators")}
          >
            For Market Creators
          </button>
        </div>

        <div className="relative mt-6 overflow-hidden rounded-2xl border bg-white">
          <AnimatePresence mode="wait">
            {tab === "traders" ? (
              <motion.div
                key="traders"
                initial={{ x: 40, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -40, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="grid md:grid-cols-3 gap-6 p-6"
              >
                <FeatureCard icon={<ChartBar className="text-blue-600" />} title="Transparent odds" desc="Live implied odds from on-chain pools." />
                <FeatureCard icon={<Percent className="text-green-600" />} title="Low fees" desc="Efficient fee model designed for frequent trading." />
                <FeatureCard icon={<ShieldCheck className="text-blue-600" />} title="Trustless settlement" desc="Smart contracts handle resolution and payouts." />
              </motion.div>
            ) : (
              <motion.div
                key="creators"
                initial={{ x: 40, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -40, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="grid md:grid-cols-3 gap-6 p-6"
              >
                <FeatureCard icon={<Wallet className="text-blue-600" />} title="Quick deploy" desc="Create a market from the admin in seconds." />
                <FeatureCard icon={<Lock className="text-blue-600" />} title="Controlled resolution" desc="Resolve markets with on-chain finality and audits." />
                <FeatureCard icon={<CheckCircle className="text-emerald-600" />} title="Analytics" desc="Track pools, volume, and performance over time." />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      


      {/* Final CTA */}
      <section className="max-w-7xl mx-auto px-4 pb-16 text-center">
        <div className="rounded-2xl bg-gray-900 text-white p-8 md:p-12">
          <h3 className="text-2xl md:text-3xl font-bold">Ready to predict the future?</h3>
          <p className="mt-2 text-gray-300">Jump into live markets or read the docs to build your own.</p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <Link href="/app" className="inline-flex items-center rounded-xl bg-white text-gray-900 px-5 py-3 hover:bg-gray-100">Go to App</Link>
            <Link href="/docs" className="inline-flex items-center rounded-xl border border-white/30 px-5 py-3 hover:bg-white/10">Docs</Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="p-5 rounded-xl border bg-white/70">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-blue-50">{icon}</div>
        <div className="font-semibold text-gray-900">{title}</div>
      </div>
      <p className="mt-2 text-sm text-gray-600">{desc}</p>
    </div>
  );
}

// Removed unused HighlightCard to satisfy ESLint

