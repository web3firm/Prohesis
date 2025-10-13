import { createPublicClient, getContract, http } from "viem";
import { sepolia } from "viem/chains";
import MarketABI from "@/lib/onchain/abis/ProhesisPredictionMarket.json";
import { prisma } from "@/lib/offchain/services/dbClient"
;

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_MARKET_CONTRACT_ADDRESS;

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

    const contract = getContract({
      address: CONTRACT_ADDRESS,
      abi: MarketABI,
      client: publicClient,
    });

    // --------------------------
    // 🧩 MarketCreated
    // --------------------------
    publicClient.watchContractEvent({
      address: CONTRACT_ADDRESS,
      abi: MarketABI,
      eventName: "MarketCreated",
      onLogs: async (logs) => {
        for (const log of logs) {
          const { marketId, question, outcomes, endTime, creator } = log.args;
          console.log("📈 MarketCreated:", question);

          await prisma.markets.upsert({
            where: { onchain_market_id: Number(marketId) },
            update: {},
            create: {
              onchain_market_id: Number(marketId),
              creator_id: 0,
              creator_address: creator.toLowerCase(),
              title: question.slice(0, 50),
              question,
              description: "",
              outcome_count: outcomes.length,
              outcomes,
              collateral_token_address: "0x0000000000000000000000000000000000000000",
              status: "open",
              created_at: new Date(),
              updated_at: new Date(),
            },
          });

          await prisma.events.create({
            data: {
              market_id: Number(marketId),
              event_name: "MarketCreated",
              tx_hash: log.transactionHash,
              block_number: Number(log.blockNumber),
              data: log.args,
              created_at: new Date(),
            },
          });
        }
      },
    });

    // --------------------------
    // 🎯 BetPlaced
    // --------------------------
    publicClient.watchContractEvent({
      address: CONTRACT_ADDRESS,
      abi: MarketABI,
      eventName: "BetPlaced",
      onLogs: async (logs) => {
        for (const log of logs) {
          const { marketId, user, outcomeIndex, amount } = log.args;
          console.log("🎲 BetPlaced:", { marketId, user, outcomeIndex, amount });

          await prisma.bets.create({
            data: {
              market_id: Number(marketId),
              wallet_chain_id: sepolia.id,
              wallet_address: user.toLowerCase(),
              user_id: 0,
              outcome_index: Number(outcomeIndex),
              amount: Number(amount) / 1e18,
              tx_hash: log.transactionHash,
              block_number: Number(log.blockNumber),
              created_at: new Date(),
            },
          });

          await prisma.events.create({
            data: {
              market_id: Number(marketId),
              event_name: "BetPlaced",
              tx_hash: log.transactionHash,
              block_number: Number(log.blockNumber),
              data: log.args,
              created_at: new Date(),
            },
          });

          // Update MarketPools table
          const pool = await prisma.marketPools.findUnique({
            where: { market_id: Number(marketId) },
          });

          const total_pool = (pool?.total_pool || 0) + Number(amount) / 1e18;
          await prisma.marketPools.upsert({
            where: { market_id: Number(marketId) },
            update: { total_pool, last_updated: new Date() },
            create: {
              market_id: Number(marketId),
              total_pool,
              last_updated: new Date(),
            },
          });
        }
      },
    });

    // --------------------------
    // 🏁 MarketResolved
    // --------------------------
    publicClient.watchContractEvent({
      address: CONTRACT_ADDRESS,
      abi: MarketABI,
      eventName: "MarketResolved",
      onLogs: async (logs) => {
        for (const log of logs) {
          const { marketId, winningOutcome } = log.args;
          console.log("✅ MarketResolved:", { marketId, winningOutcome });

          await prisma.markets.update({
            where: { onchain_market_id: Number(marketId) },
            data: {
              status: "resolved",
              resolved_outcome_index: Number(winningOutcome),
              resolution_tx_hash: log.transactionHash,
              updated_at: new Date(),
            },
          });

          await prisma.events.create({
            data: {
              market_id: Number(marketId),
              event_name: "MarketResolved",
              tx_hash: log.transactionHash,
              block_number: Number(log.blockNumber),
              data: log.args,
              created_at: new Date(),
            },
          });
        }
      },
    });

    // --------------------------
    // 💰 PayoutClaimed
    // --------------------------
    publicClient.watchContractEvent({
      address: CONTRACT_ADDRESS,
      abi: MarketABI,
      eventName: "PayoutClaimed",
      onLogs: async (logs) => {
        for (const log of logs) {
          const { marketId, user, amount } = log.args;
          console.log("💸 PayoutClaimed:", { marketId, user, amount });

          await prisma.payouts.create({
            data: {
              market_id: Number(marketId),
              wallet_chain_id: sepolia.id,
              wallet_address: user.toLowerCase(),
              user_id: 0,
              stake_amount: 0,
              payout_amount: Number(amount) / 1e18,
              claimed: true,
              claim_tx_hash: log.transactionHash,
              created_at: new Date(),
            },
          });

          await prisma.events.create({
            data: {
              market_id: Number(marketId),
              event_name: "PayoutClaimed",
              tx_hash: log.transactionHash,
              block_number: Number(log.blockNumber),
              data: log.args,
              created_at: new Date(),
            },
          });
        }
      },
    });

    console.log("✅ Event listeners ready for all contract events.");
  } catch (err) {
    console.error("❌ Error starting event listener:", err);
  }
}
