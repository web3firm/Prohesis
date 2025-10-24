"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAccount, useDisconnect } from "wagmi";
import { useEffect, useState } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useTheme } from "next-themes";
import { User, LogOut, Settings, BarChart2, Wallet, Sun, Moon, Search } from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { theme, setTheme } = useTheme();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [searchFilter, setSearchFilter] = useState<"all" | "active" | "ended">("all");
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // Check if user exists in DB
  useEffect(() => {
    if (!address) {
      setUserProfile(null);
      return;
    }
    
    setLoading(true);
    fetch(`/api/users/profile?wallet=${address}`)
      .then((res) => res.json())
      .then((data) => {
        setUserProfile(data.user || null);
      })
      .catch(() => setUserProfile(null))
      .finally(() => setLoading(false));
  }, [address]);

  const isAdmin = pathname?.startsWith("/admin");

  if (isAdmin) return null; // Don't show on admin pages

  const getInitials = () => {
    if (userProfile?.username) {
      return userProfile.username.charAt(0).toUpperCase();
    }
    if (address) {
      return address.slice(2, 3).toUpperCase();
    }
    return "?";
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      const params = new URLSearchParams();
      params.set('search', searchQuery);
      if (searchFilter !== 'all') {
        params.set('filter', searchFilter);
      }
      window.location.href = `/?${params.toString()}`;
    }
  };

  return (
    <nav className="sticky top-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm backdrop-blur-lg bg-opacity-90 dark:bg-opacity-90">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
              Prohesis
            </div>
          </Link>

          {/* Search Bar - Desktop with Filters */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="relative w-full group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 z-10" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setShowFilters(true)}
                onBlur={() => setTimeout(() => setShowFilters(false), 200)}
                placeholder="Search markets..."
                className="w-full pl-10 pr-24 py-2 text-sm border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 focus:border-transparent transition-all"
              />
              {/* Filter Dropdown */}
              <div className="absolute right-2 top-1/2 -translate-y-1/2 z-10">
                <select
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value as any)}
                  className="text-xs px-2 py-1 bg-transparent border-none text-gray-600 dark:text-gray-400 focus:outline-none cursor-pointer"
                >
                  <option value="all">All</option>
                  <option value="active">Active</option>
                  <option value="ended">Ended</option>
                </select>
              </div>
              {/* Quick Filters */}
              {showFilters && searchQuery && (
                <div className="absolute top-full mt-2 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-2 space-y-1">
                  <div className="text-xs text-gray-500 dark:text-gray-400 px-2 py-1">Quick filters:</div>
                  {['all', 'active', 'ended'].map((filter) => (
                    <button
                      key={filter}
                      type="button"
                      onClick={() => setSearchFilter(filter as any)}
                      className={`w-full text-left px-2 py-1 text-sm rounded ${
                        searchFilter === filter
                          ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {filter.charAt(0).toUpperCase() + filter.slice(1)} markets
                    </button>
                  ))}
                </div>
              )}
            </div>
          </form>

          {/* Navigation Links */}
          <div className="hidden lg:flex items-center gap-6">
            <Link
              href="/"
              className={`text-sm font-medium transition-colors ${
                pathname === "/"
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
              }`}
            >
              Markets
            </Link>
            {isConnected && userProfile && (
              <>
                <Link
                  href="/dashboard"
                  className={`text-sm font-medium transition-colors ${
                    pathname === "/dashboard"
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
                  }`}
                >
                  Dashboard
                </Link>
                <Link
                  href="/analytics"
                  className={`text-sm font-medium transition-colors ${
                    pathname === "/analytics"
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
                  }`}
                >
                  Analytics
                </Link>
              </>
            )}
          </div>

          {/* Right Section: Theme + Auth */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            {mounted && (
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Toggle theme"
              >
                {theme === "dark" ? (
                  <Sun className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                ) : (
                  <Moon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                )}
              </button>
            )}

            {!isConnected ? (
              <div className="flex items-center gap-2">
                <ConnectButton.Custom>
                  {({ openConnectModal }) => (
                    <>
                      <button
                        onClick={openConnectModal}
                        className="hidden sm:block px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                      >
                        Login
                      </button>
                      <button
                        onClick={openConnectModal}
                        className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg shadow-sm transition-all"
                      >
                        Sign Up
                      </button>
                    </>
                  )}
                </ConnectButton.Custom>
              </div>
            ) : loading ? (
              <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
            ) : userProfile ? (
              // Existing user with profile
              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 dark:from-blue-500 dark:to-purple-500 flex items-center justify-center text-white font-bold shadow-md">
                    {getInitials()}
                  </div>
                  <div className="hidden sm:block text-left">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {userProfile.username || `${address?.slice(0, 6)}...${address?.slice(-4)}`}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {userProfile.email || "No email"}
                    </div>
                  </div>
                </button>

                {showMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowMenu(false)}
                    />
                    <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-50 overflow-hidden">
                      <Link
                        href="/profile"
                        onClick={() => setShowMenu(false)}
                        className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        <User size={16} />
                        Profile
                      </Link>
                      <Link
                        href="/portfolio"
                        onClick={() => setShowMenu(false)}
                        className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        <Wallet size={16} />
                        Portfolio
                      </Link>
                      <Link
                        href="/analytics"
                        onClick={() => setShowMenu(false)}
                        className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        <BarChart2 size={16} />
                        Analytics
                      </Link>
                      <Link
                        href="/settings"
                        onClick={() => setShowMenu(false)}
                        className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        <Settings size={16} />
                        Settings
                      </Link>
                      <div className="border-t border-gray-200 dark:border-gray-700">
                        <button
                          onClick={() => {
                            disconnect();
                            setShowMenu(false);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                          <LogOut size={16} />
                          Disconnect
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              // Connected but no profile - redirect to signup
              <Link
                href="/signup"
                className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-lg shadow-sm transition-all"
              >
                Complete Signup
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

