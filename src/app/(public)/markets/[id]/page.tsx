"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useToast } from '@/components/ui/Toaster';
import { useParams, useRouter } from "next/navigation";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseEther } from "viem";
import { Clock, Users, DollarSign, CheckCircle, XCircle, ArrowLeft } from "lucide-react";
import MarketABI from "@/lib/onchain/abis/ProhesisPredictionMarket.json";
import { getImpliedOddsFromPools, getOutcomesForMarket, getPoolsForMarket } from "@/lib/onchain/readFunctions";
import { recordBet } from "@/lib/offchain/api/bets";
import DBGuard from '@/components/ui/DBGuard';
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function MarketDetailPage() {
	const params = useParams<{ id: string }>();
	const router = useRouter();
	const marketId = Number(params.id);

	const { isConnected, address } = useAccount();
	const [outcomes, setOutcomes] = useState<string[]>([]);
	const [pools, setPools] = useState<number[]>([]);
	const [isEligibleToClaim, setIsEligibleToClaim] = useState<boolean | null>(null);
	const [claimReason, setClaimReason] = useState<string | null>(null);
	const { addToast } = useToast();
	const odds = useMemo(() => getImpliedOddsFromPools(pools), [pools]);
	const [onchainAddr, setOnchainAddr] = useState<`0x${string}` | null>(null);
	
	const [amount, setAmount] = useState<string>("");
	const [selected, setSelected] = useState<number>(0);

	const { data: hash, writeContract, isPending } = useWriteContract();
	const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

	const { data: claimHash, writeContract: writeClaimContract, isPending: isClaimPending } = useWriteContract();
	const { isLoading: isClaimConfirming, isSuccess: isClaimConfirmed } = useWaitForTransactionReceipt({ hash: claimHash });

	// Use SWR for real-time market data
	const { data: marketData, error: fetchError, mutate } = useSWR(
		`/api/markets/details/${marketId}`,
		fetcher,
		{
			refreshInterval: 10000, // Refresh every 10 seconds
			revalidateOnFocus: true,
			onError: (err) => {
				// Handle 429 rate limit errors gracefully
				if (err?.status === 429) {
					console.warn('Rate limited, will retry automatically');
				}
			}
		}
	);

	const marketEnded = marketData ? Date.now() >= Number(marketData.endTime) : false;
	const totalPool = pools.reduce((sum, p) => sum + p, 0);

	// Load on-chain data when market data changes
	const loadOnChainData = useCallback(async () => {
		if (!marketData?.onchainAddr) return;
		
		setOnchainAddr(marketData.onchainAddr);
		
		try {
			const [o, p] = await Promise.all([
				getOutcomesForMarket(marketData.onchainAddr),
				getPoolsForMarket(marketData.onchainAddr)
			]);
			setOutcomes(o.length ? o : ["Yes", "No"]);
			setPools(p);
		} catch {
			setOutcomes(["Yes", "No"]);
			setPools([0, 0]);
		}
	}, [marketData]);

	useEffect(() => {
		loadOnChainData();
	}, [loadOnChainData]);

	// Check claim eligibility with debouncing
	useEffect(() => {
		if (!address || !marketId) return;
		
		const timer = setTimeout(() => {
			fetch(`/api/payouts/validate?marketId=${marketId}&userId=${address}`)
				.then(res => {
					if (res.status === 429) {
						console.warn('Rate limited on claim check');
						return null;
					}
					return res.json();
				})
				.then(data => {
					if (data) {
						setIsEligibleToClaim(Boolean(data?.canClaim));
						setClaimReason(data?.reason || null);
					}
				})
				.catch(err => {
					console.error('Claim eligibility check failed:', err);
				});
		}, 500); // Debounce by 500ms

		return () => clearTimeout(timer);
	}, [marketId, address, isClaimConfirmed]);

	async function handleBet() {
		if (!isConnected) return addToast("Connect your wallet first", 'error');
		const val = Number(amount);
		if (!val || val <= 0) return addToast("Enter a valid amount", "error");

		try {
			if (!onchainAddr) return addToast("Market address not available", 'error');
			
			writeContract({
				address: onchainAddr,
				abi: MarketABI.abi,
				functionName: "placeBet",
				args: [selected === 0],
				value: parseEther(amount),
			});
			addToast("⏳ Confirm transaction in your wallet", 'loading');
		} catch (e: any) {
			addToast(`❌ ${e?.message ?? String(e)}`, 'error');
		}
	}

	async function handleClaim() {
		if (!onchainAddr) return addToast("Market address not available", 'error');
		try {
			writeClaimContract({
				address: onchainAddr,
				abi: MarketABI.abi,
				functionName: "claimPayout",
				args: [],
			});
			addToast("⏳ Claiming winnings...", 'loading');
		} catch (e: any) {
			addToast(`❌ ${e?.message ?? String(e)}`, 'error');
		}
	}

	// Handle bet confirmation with reduced API calls
	useEffect(() => {
		if (!isConfirmed || !hash || !address || !onchainAddr) return;
		
		(async () => {
			try {
				await recordBet({ txHash: hash, userId: address });
				
				// Update pools from on-chain
				const p = await getPoolsForMarket(onchainAddr);
				setPools(p);
				
				// Revalidate market data
				mutate();
				
				addToast("✅ Bet recorded!", 'success');
				setAmount("");
			} catch (e: any) {
				// Don't show error for 429 rate limits
				if (e?.message?.includes('429') || e?.message?.includes('Too Many Requests')) {
					console.warn('Rate limited, bet may still be recorded');
				} else {
					addToast(`⚠️ ${e?.message ?? String(e)}`, 'error');
				}
			}
		})();
	}, [isConfirmed, hash, address, onchainAddr, mutate, addToast]);

	// Handle claim confirmation
	useEffect(() => {
		if (!isClaimConfirmed || !claimHash || !onchainAddr) return;
		
		(async () => {
			try {
				const p = await getPoolsForMarket(onchainAddr);
				setPools(p);
				mutate();
				addToast("✅ Winnings claimed!", 'success');
			} catch (e: any) {
				addToast(`❌ ${e?.message ?? String(e)}`, 'error');
			}
		})();
	}, [isClaimConfirmed, claimHash, onchainAddr, mutate, addToast]);

	if (fetchError) {
		return (
			<div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
				<DBGuard error={fetchError} onRetry={() => window.location.reload()} />
			</div>
		);
	}

	if (!marketData) {
		return (
			<div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
				<div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
			</div>
		);
	}

	const potentialReturn = (() => {
		if (!amount || Number(amount) <= 0 || pools[selected] === 0) return 0;
		const bet = Number(amount);
		const currentPool = pools[selected];
		const newPool = currentPool + bet;
		const share = bet / newPool;
		return totalPool * share;
	})();

	return (
		<div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
			<div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
				{/* Back Button */}
				<button
					onClick={() => router.push("/")}
					className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 mb-6 transition-colors"
				>
					<ArrowLeft size={20} />
					<span className="text-sm font-medium">Back to Markets</span>
				</button>

				{/* Market Header */}
				<div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8 mb-6">
					<div className="flex items-start justify-between mb-6">
						<div className="flex-1">
							<h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
								{marketData.title}
							</h1>
							{marketEnded && (
								<span className="inline-flex items-center gap-2 px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 rounded-lg text-sm font-medium">
									<XCircle size={16} />
									Market Ended
								</span>
							)}
							{!marketEnded && (
								<span className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-lg text-sm font-medium">
									<CheckCircle size={16} />
									Active
								</span>
							)}
						</div>
					</div>

					{/* Market Stats */}
					<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
						<div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
							<div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
								<DollarSign className="w-5 h-5 text-blue-600 dark:text-blue-400" />
							</div>
							<div>
								<div className="text-xs text-gray-500 dark:text-gray-400">Total Pool</div>
								<div className="text-lg font-semibold text-gray-900 dark:text-white">
									{totalPool.toFixed(4)} ETH
								</div>
							</div>
						</div>

						<div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
							<div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
								<Clock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
							</div>
							<div>
								<div className="text-xs text-gray-500 dark:text-gray-400">Ends</div>
								<div className="text-sm font-semibold text-gray-900 dark:text-white">
									{new Date(Number(marketData.endTime)).toLocaleDateString()}
								</div>
							</div>
						</div>

						<div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
							<div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
								<Users className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
							</div>
							<div>
								<div className="text-xs text-gray-500 dark:text-gray-400">Participants</div>
								<div className="text-lg font-semibold text-gray-900 dark:text-white">
									{marketData._count?.bets || 0}
								</div>
							</div>
						</div>
					</div>
				</div>

				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
					{/* Outcomes */}
					<div className="lg:col-span-2">
						<div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6">
							<h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Place Your Bet</h2>
							
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
								{outcomes.map((label, i) => {
									const active = selected === i;
									const odd = odds[i] || 0;
									return (
										<button
											key={i}
											onClick={() => setSelected(i)}
											disabled={marketEnded}
											className={`p-6 rounded-xl border-2 transition-all ${
												active
													? "border-blue-600 dark:border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg scale-105"
													: "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
											} ${marketEnded ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
										>
											<div className="flex items-center justify-between mb-4">
												<span className="text-lg font-bold text-gray-900 dark:text-white">{label}</span>
												{active && <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
											</div>
											<div className="flex items-center justify-between">
												<div>
													<div className="text-xs text-gray-500 dark:text-gray-400">Probability</div>
													<div className="text-2xl font-bold text-gray-900 dark:text-white">{odd.toFixed(1)}%</div>
												</div>
												<div className="text-right">
													<div className="text-xs text-gray-500 dark:text-gray-400">Pool</div>
													<div className="text-sm font-semibold text-gray-700 dark:text-gray-300">{pools[i]?.toFixed(4) || "0.0000"} ETH</div>
												</div>
											</div>
										</button>
									);
								})}
							</div>

							{/* Bet Input */}
							<div className="space-y-4">
								<div>
									<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
										Bet Amount (ETH)
									</label>
									<input
										type="number"
										min="0"
										step="0.001"
										value={amount}
										onChange={(e) => setAmount(e.target.value)}
										placeholder="0.01"
										disabled={marketEnded}
										className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 focus:border-transparent disabled:opacity-60"
									/>
								</div>

								<div className="flex gap-2">
									{[0.01, 0.05, 0.1, 0.5].map((v) => (
										<button
											key={v}
											onClick={() => setAmount(String(v))}
											disabled={marketEnded}
											className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-60"
										>
											{v} ETH
										</button>
									))}
								</div>

								{potentialReturn > 0 && (
									<div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
										<div className="flex items-center justify-between">
											<span className="text-sm text-gray-700 dark:text-gray-300">Potential Return</span>
											<span className="text-lg font-bold text-blue-600 dark:text-blue-400">
												{potentialReturn.toFixed(4)} ETH
											</span>
										</div>
										<div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
											{((potentialReturn / Number(amount) - 1) * 100).toFixed(1)}% profit
										</div>
									</div>
								)}

								<button
									onClick={handleBet}
									disabled={marketEnded || isPending || isConfirming || !isConnected}
									className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-lg shadow-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed"
								>
									{!isConnected
										? "Connect Wallet"
										: isPending
										? "Confirm in wallet..."
										: isConfirming
										? "Confirming..."
										: "Place Bet"}
								</button>

								{hash && (
									<p className="text-xs text-center text-gray-500 dark:text-gray-400 break-all">
										TX: {hash}
									</p>
								)}
							</div>
						</div>
					</div>

					{/* Claim Section */}
					<div className="lg:col-span-1">
						{isEligibleToClaim && (
							<div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl border-2 border-green-200 dark:border-green-800 p-6 mb-6">
								<div className="text-center">
									<CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400 mx-auto mb-3" />
									<h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
										You Won!
									</h3>
									<p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
										Claim your winnings now
									</p>
									<button
										onClick={handleClaim}
										disabled={isClaimPending || isClaimConfirming}
										className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold rounded-lg shadow-lg transition-all disabled:opacity-60"
									>
										{isClaimPending
											? "Confirm in wallet..."
											: isClaimConfirming
											? "Claiming..."
											: "Claim Winnings"}
									</button>
								</div>
							</div>
						)}

						{claimReason && !isEligibleToClaim && (
							<div className="bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 mb-6">
								<p className="text-sm text-gray-600 dark:text-gray-400 text-center">
									{claimReason}
								</p>
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
