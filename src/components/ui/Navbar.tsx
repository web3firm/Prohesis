"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { useAccount, useDisconnect } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b bg-white/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex items-center justify-between h-16 px-4">
        <Link href="/user" className="text-lg font-semibold text-blue-600">
          Prohesis
        </Link>

        <input
          placeholder="Search markets..."
          className="hidden md:block w-80 h-10 rounded-full border px-4 text-sm focus:ring-2 focus:ring-blue-500"
        />

        <div className="flex items-center gap-3 relative">
          {!isConnected ? (
            <ConnectButton
              label="Connect Wallet"
              accountStatus="address"
              showBalance={false}
              chainStatus="icon"
            />
          ) : (
            <div className="relative">
              <button
                onClick={() => setOpen((o) => !o)}
                className="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 border px-3 py-1.5 rounded-full transition"
              >
                <span className="text-sm font-medium text-blue-700">
                  {address?.slice(0, 6)}...{address?.slice(-4)}
                </span>
                <svg
                  className={`w-4 h-4 transition-transform ${
                    open ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              <AnimatePresence>
                {open && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-44 rounded-xl border bg-white shadow-lg z-50 overflow-hidden"
                  >
                    <button
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50"
                      onClick={() => {
                        router.push("/user/profile");
                        setOpen(false);
                      }}
                    >
                      👤 Profile
                    </button>
                    <button
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50"
                      onClick={() => {
                        router.push("/user/Dashboard");
                        setOpen(false);
                      }}
                    >
                      📊 Dashboard
                    </button>
                    <div className="border-t my-1" />
                    <button
                      className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                      onClick={() => {
                        disconnect();
                        setOpen(false);
                      }}
                    >
                      🔌 Disconnect
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Hamburger menu */}
          <div className="relative">
            <button
              onClick={() => setMenu((m) => !m)}
              className="h-9 w-9 grid place-items-center rounded-full border bg-white hover:bg-gray-50"
            >
              ☰
            </button>
            <AnimatePresence>
              {menu && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-44 rounded-xl border bg-white shadow-lg overflow-hidden z-40"
                >
                  <Link
                    href="/user/leaderboard"
                    className="block px-4 py-2 text-sm hover:bg-gray-50"
                    onClick={() => setMenu(false)}
                  >
                    🏆 Leaderboard
                  </Link>
                  <Link
                    href="/user/Markets"
                    className="block px-4 py-2 text-sm hover:bg-gray-50"
                    onClick={() => setMenu(false)}
                  >
                    🎯 Markets
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
}
