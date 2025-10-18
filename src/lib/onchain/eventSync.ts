import { createPublicClient, http } from "viem";
import { sepolia } from "viem/chains";
import MarketABI from "@/lib/onchain/abis/ProhesisPredictionMarket.json";
import db from "@/lib/offchain/services/dbClient";

const CONTRACT_ADDRESS = (process.env.NEXT_PUBLIC_MARKET_CONTRACT_ADDRESS || "") as `0x${string}`;
const dbAny: any = db;

// ============================================================
// 🛰  Initialize Public Client
// ============================================================
const publicClient = createPublicClient({
  chain: sepolia,
  transport: http(),
});

// ============================================================
// 🔔 Event Sync Service
// ============================================================
export async function startEventListener() {
  try {
    console.log("🔄 Starting Prohesis event listener...");

    void (MarketABI); // ABI referenced for type hinting; contract created inline with publicClient in watchers

    // --------------------------
    // 🧩 MarketCreated
    // --------------------------
    // NOTE: viem expects 'abi' to be an Abi array; some ABIs are JSON objects with an 'abi' key.
    // Cast to any to satisfy the library types at compile time.
    publicClient.watchContractEvent({
      address: CONTRACT_ADDRESS,
      abi: (MarketABI as any).abi as any,
      eventName: "MarketCreated",
      onLogs: async (logs) => {
        for (const log of logs) {
          const args: any = (log as any).args ?? {};
          console.log("📈 MarketCreated event:", args);
          try {
            await dbAny.market.upsert({
              where: { id: Number(args.marketId) || 0 },
              update: {},
              create: {
                title: args.title ?? "",
                totalPool: 0,
                endTime: new Date(),
              },
            });
          } catch (e) {
            console.warn("market upsert skipped", e);
          }
        }
      },
    });

    // --------------------------
    // 🎯 BetPlaced
    // --------------------------
    publicClient.watchContractEvent({
      address: CONTRACT_ADDRESS,
      abi: (MarketABI as any).abi as any,
      eventName: "BetPlaced",
      onLogs: async (logs) => {
        for (const log of logs) {
          const args: any = (log as any).args ?? {};
          console.log("🎲 BetPlaced event:", args);
          try {
            await dbAny.bet.create({
              data: {
                marketId: Number(args.marketId) || 0,
                walletChainId: sepolia.id,
                walletAddress: (args.user ?? "").toLowerCase(),
                outcomeIndex: Number(args.outcomeIndex) || 0,
                amount: Number(args.amount || 0) / 1e18,
                txHash: log.transactionHash as string,
              },
            });
          } catch (e) {
            console.warn("bet create skipped", e);
          }
        }
      },
    });

    // --------------------------
    // 🏁 MarketResolved
    // --------------------------
    publicClient.watchContractEvent({
      address: CONTRACT_ADDRESS,
      abi: (MarketABI as any).abi as any,
      eventName: "MarketResolved",
      onLogs: async (logs) => {
        for (const log of logs) {
          const args: any = (log as any).args ?? {};
          console.log("✅ MarketResolved event:", args);
        }
      },
    });

    // --------------------------
    // 💰 PayoutClaimed
    // --------------------------
    publicClient.watchContractEvent({
      address: CONTRACT_ADDRESS,
      abi: (MarketABI as any).abi as any,
      eventName: "PayoutClaimed",
      onLogs: async (logs) => {
        for (const log of logs) {
          const args: any = (log as any).args ?? {};
          console.log("💸 PayoutClaimed event:", args);
        }
      },
    });

    console.log("✅ Event listeners ready for all contract events.");
  } catch (err) {
    console.error("❌ Error starting event listener:", err);
  }
}
