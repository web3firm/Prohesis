"use client";

import { useState, useMemo } from "react";
import useSWR from "swr";
import { MarketCard } from "@/components/ui/MarketCard";
import SkeletonCard from "@/components/ui/SkeletonCard";
import { TrendingUp, Clock, CheckCircle, XCircle } from "lucide-react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function AllMarketsPage() {
	const { data, error, isLoading } = useSWR<any[]>("/api/markets", fetcher, {
		refreshInterval: 10000, // Real-time updates every 10 seconds
		revalidateOnFocus: true,
		revalidateOnReconnect: true,
	});

	const [activeTab, setActiveTab] = useState<"active" | "ended">("active");

	const { activeMarkets, endedMarkets } = useMemo(() => {
		if (!data) return { activeMarkets: [], endedMarkets: [] };
		
		const now = Date.now();
		const active = data.filter((m) => now < Number(m.endTime));
		const ended = data.filter((m) => now >= Number(m.endTime));
		
		return { activeMarkets: active, endedMarkets: ended };
	}, [data]);

	const displayedMarkets = activeTab === "active" ? activeMarkets : endedMarkets;

	return (
		<div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				{/* Header */}
				<div className="mb-8">
					<h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
						All Markets
					</h1>
					<p className="text-gray-600 dark:text-gray-400">
						Browse all active and ended prediction markets
					</p>
				</div>

				{/* Stats */}
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
					<div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
						<div className="flex items-center gap-3 mb-2">
							<div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
								<TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
							</div>
							<span className="text-sm text-gray-600 dark:text-gray-400">Total Markets</span>
						</div>
						<div className="text-3xl font-bold text-gray-900 dark:text-white">
							{data?.length || 0}
						</div>
					</div>

					<div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
						<div className="flex items-center gap-3 mb-2">
							<div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
								<CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
							</div>
							<span className="text-sm text-gray-600 dark:text-gray-400">Active</span>
						</div>
						<div className="text-3xl font-bold text-gray-900 dark:text-white">
							{activeMarkets.length}
						</div>
					</div>

					<div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
						<div className="flex items-center gap-3 mb-2">
							<div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
								<XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
							</div>
							<span className="text-sm text-gray-600 dark:text-gray-400">Ended</span>
						</div>
						<div className="text-3xl font-bold text-gray-900 dark:text-white">
							{endedMarkets.length}
						</div>
					</div>

					<div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
						<div className="flex items-center gap-3 mb-2">
							<div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
								<Clock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
							</div>
							<span className="text-sm text-gray-600 dark:text-gray-400">This Week</span>
						</div>
						<div className="text-3xl font-bold text-gray-900 dark:text-white">
							{data?.filter((m) => {
								const created = new Date(m.createdAt).getTime();
								const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
								return created > weekAgo;
							}).length || 0}
						</div>
					</div>
				</div>

				{/* Tabs */}
				<div className="flex gap-2 mb-8 border-b border-gray-200 dark:border-gray-700">
					<button
						onClick={() => setActiveTab("active")}
						className={`px-6 py-3 font-medium transition-colors relative ${
							activeTab === "active"
								? "text-blue-600 dark:text-blue-400"
								: "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
						}`}
					>
						Active Markets ({activeMarkets.length})
						{activeTab === "active" && (
							<div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-600 to-purple-600" />
						)}
					</button>
					<button
						onClick={() => setActiveTab("ended")}
						className={`px-6 py-3 font-medium transition-colors relative ${
							activeTab === "ended"
								? "text-blue-600 dark:text-blue-400"
								: "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
						}`}
					>
						Ended Markets ({endedMarkets.length})
						{activeTab === "ended" && (
							<div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-600 to-purple-600" />
						)}
					</button>
				</div>

				{/* Markets Grid */}
				{error && (
					<div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 text-center">
						<p className="text-red-600 dark:text-red-400 font-medium">
							Failed to load markets. Please try again.
						</p>
					</div>
				)}

				{isLoading && (
					<div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
						{[...Array(6)].map((_, i) => (
							<SkeletonCard key={i} />
						))}
					</div>
				)}

				{!isLoading && !error && displayedMarkets.length === 0 && (
					<div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-12 text-center">
						<div className="text-6xl mb-4">
							{activeTab === "active" ? "📊" : "🏁"}
						</div>
						<h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
							No {activeTab} markets
						</h3>
						<p className="text-gray-600 dark:text-gray-400">
							{activeTab === "active"
								? "Check back soon for new prediction markets"
								: "No markets have ended yet"}
						</p>
					</div>
				)}

				{!isLoading && !error && displayedMarkets.length > 0 && (
					<div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
						{displayedMarkets.map((market) => (
							<MarketCard key={market.id} market={market} />
						))}
					</div>
				)}
			</div>
		</div>
	);
}
