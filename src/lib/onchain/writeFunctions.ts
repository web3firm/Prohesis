import { decodeEventLog, type Abi } from "viem";
import { publicClient, CONTRACT_ADDRESS } from "./readFunctions";
import MarketABI from "@/lib/onchain/abis/ProhesisPredictionMarket.json";
import { syncBetToDB } from "@/lib/offchain/sync/syncBet";

// ✅ Define the expected event args interface
interface BetPlacedEvent {
  marketId: bigint;
  user: `0x${string}`;
  outcomeIndex: bigint;
  amount: bigint;
}

// ✅ Verify Bet Transaction and decode BetPlaced event
export async function verifyBetTx(txHash: `0x${string}`) {
  const receipt = await publicClient.getTransactionReceipt({ hash: txHash });

  if (!receipt || !receipt.to) throw new Error("No receipt or 'to' address for tx");

  // Ensure tx was sent to our contract
  if (receipt.to.toLowerCase() !== CONTRACT_ADDRESS.toLowerCase()) {
    throw new Error("Transaction did not target the prediction market contract");
  }

  let parsed: BetPlacedEvent | null = null;

  for (const log of receipt.logs) {
    try {
      // ✅ Properly cast ABI type and decode event
      const decoded = decodeEventLog({
        abi: MarketABI as unknown as Abi,
        data: log.data,
        topics: log.topics,
      }) as unknown as {
        eventName: string;
        args: BetPlacedEvent;
      };

      if (decoded.eventName === "BetPlaced") {
        const { marketId, user, outcomeIndex, amount } = decoded.args;
        parsed = { marketId, user, outcomeIndex, amount };
        break;
      }
    } catch {
      // Skip logs that don't match our ABI
      continue;
    }
  }

  if (!parsed) throw new Error("BetPlaced event not found in transaction logs");

  // ✅ Return normalized output
  return {
    txHash,
    marketId: Number(parsed.marketId),
    wallet: parsed.user.toLowerCase() as `0x${string}`,
    outcomeIndex: Number(parsed.outcomeIndex),
    amountEth: Number(parsed.amount) / 1e18,
    blockNumber: Number(receipt.blockNumber),
  };
}



export async function handleBetPlaced(txHash: `0x${string}`) {
  const bet = await verifyBetTx(txHash);
  const saved = await syncBetToDB(bet);
  return saved;
}
