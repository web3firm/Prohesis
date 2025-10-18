import { decodeEventLog, type Abi, createWalletClient, getContract, http } from "viem";
import { sepolia } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import { publicClient } from "./readFunctions";
import { CONTRACT_ADDRESS } from "@/lib/utils/constants";
import MarketABI from "@/lib/onchain/abis/ProhesisPredictionMarket.json";
import { syncBetToDB } from "@/lib/offchain/sync/syncBet";
import { ABIS, FACTORY } from "./contract";

// Expected event args interface
interface BetPlacedEvent {
  marketId: bigint;
  user: `0x${string}`;
  outcomeIndex: bigint;
  amount: bigint;
}

interface WinningsClaimedEvent {
  user: `0x${string}`;
  amount: bigint;
}

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
      const decoded = decodeEventLog({ abi: MarketABI as unknown as Abi, data: log.data, topics: log.topics }) as unknown as {
        eventName: string;
        args: BetPlacedEvent;
      };

      if (decoded.eventName === "BetPlaced") {
        const { marketId, user, outcomeIndex, amount } = decoded.args;
        parsed = { marketId, user, outcomeIndex, amount };
        break;
      }
    } catch {
      continue; // skip non-matching logs
    }
  }

  if (!parsed) throw new Error("BetPlaced event not found in transaction logs");

  return {
    txHash,
    marketId: Number(parsed.marketId),
    wallet: parsed.user.toLowerCase() as `0x${string}`,
    outcomeIndex: Number(parsed.outcomeIndex),
    amountEth: Number(parsed.amount) / 1e18,
    blockNumber: Number(receipt.blockNumber),
  };
}

// helper: wallet client built from server PRIVATE_KEY
const RPC_URL = process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || process.env.SEPOLIA_RPC_URL || process.env.RPC_URL || "";
function getWalletClient() {
  const pk = process.env.PRIVATE_KEY;
  if (!pk) throw new Error("PRIVATE_KEY not set in server environment");
  const normalized = pk.startsWith("0x") ? pk : `0x${pk}`;
  const account = privateKeyToAccount(normalized as `0x${string}`);
  return createWalletClient({ chain: sepolia, transport: http(RPC_URL), account });
}

export async function handleBetPlaced(txHash: `0x${string}`) {
  const bet = await verifyBetTx(txHash);
  const saved = await syncBetToDB(bet);
  return saved;
}

// Verify a claim tx (client-signed). Decodes WinningsClaimed event and returns normalized info.
export async function verifyClaimTx(txHash: `0x${string}`) {
  const receipt = await publicClient.getTransactionReceipt({ hash: txHash });
  if (!receipt || !receipt.to) throw new Error("No receipt or 'to' address for tx");
  if (receipt.to.toLowerCase() !== CONTRACT_ADDRESS.toLowerCase()) throw new Error("Transaction not to market contract");

  for (const log of receipt.logs) {
    try {
      const decoded = decodeEventLog({ abi: MarketABI as unknown as Abi, data: log.data, topics: log.topics }) as unknown as {
        eventName: string;
        args: WinningsClaimedEvent;
      };
      if (decoded.eventName === "WinningsClaimed" || decoded.eventName === "WinningsClaimed") {
        const { user, amount } = decoded.args;
        return {
          txHash,
          user: user.toLowerCase() as `0x${string}`,
          amountEth: Number(amount) / 1e18,
          blockNumber: Number(receipt.blockNumber),
        };
      }
    } catch {
      continue;
    }
  }

  throw new Error("WinningsClaimed event not found in tx logs");
}

export async function createMarket(input: {
  question: string;
  outcomes: string[];
  endTime: number;
  creatorAddress: string;
  userId: string;
}): Promise<{ success: boolean; txHash?: `0x${string}`; marketAddress?: `0x${string}`; error?: string }> {
  if (!FACTORY) return { success: false, error: "Factory address not configured" };
  try {
    const walletClient = getWalletClient();
    const factory = getContract({ address: FACTORY as `0x${string}`, abi: (ABIS.factory as any).abi ?? ABIS.factory, client: publicClient });
    let fee = 0n;
    try {
      fee = (await factory.read.creationFee([] as any)) as bigint;
    } catch {}

    const title = input.question;
    const end = input.endTime > 1e12 ? BigInt(Math.floor(input.endTime / 1000)) : BigInt(input.endTime);
    const tx = await walletClient.writeContract({
      address: FACTORY as `0x${string}`,
      abi: (ABIS.factory as any).abi ?? ABIS.factory,
      functionName: "createMarket",
      args: [title, end],
      value: fee,
    } as any);

    const receipt = await publicClient.waitForTransactionReceipt({ hash: tx });
    // Try to decode MarketCreated event to extract new market address
    let marketAddress: `0x${string}` | undefined = undefined;
    try {
      for (const log of receipt.logs) {
        try {
          const decoded: any = decodeEventLog({ abi: (ABIS.factory as any).abi ?? ABIS.factory, data: log.data, topics: log.topics } as any);
          if (decoded && decoded.eventName === 'MarketCreated') {
            const args: any = decoded.args as any;
            marketAddress = (args?.market || args?.[0]) as `0x${string}`;
            break;
          }
        } catch {}
      }
    } catch {}

    return { success: true, txHash: tx, marketAddress };
  } catch (e: any) {
    return { success: false, error: e?.message ?? String(e) };
  }
}

export async function resolveMarket(input: { marketAddress?: `0x${string}`; marketId?: number; winningOutcome?: number }): Promise<{ success: boolean; txHash?: `0x${string}`; error?: string }> {
  try {
    let addr = input.marketAddress as string | undefined;
    if (!addr && typeof input.marketId === "number") {
      try {
        const db = await import("@/lib/offchain/services/dbClient");
        const m = await db.default.market.findUnique({ where: { id: input.marketId } });
        addr = m?.onchainAddr as string | undefined;
      } catch {
        addr = undefined;
      }
    }
    if (!addr) return { success: false, error: "marketAddress not provided and not found in DB" };
    const outcome = Number(input.winningOutcome ?? 0);
    const walletClient = getWalletClient();
    const tx = await walletClient.writeContract({ address: addr as `0x${string}`, abi: (ABIS.market as any).abi ?? ABIS.market, functionName: "resolve", args: [BigInt(outcome)] } as any);
    await publicClient.waitForTransactionReceipt({ hash: tx });
    return { success: true, txHash: tx };
  } catch (e: any) {
    return { success: false, error: e?.message ?? String(e) };
  }
}

export async function claimPayout(input: { marketAddress?: `0x${string}`; marketId?: number }): Promise<{ success: boolean; txHash?: `0x${string}`; error?: string }> {
  try {
    let addr = input.marketAddress as string | undefined;
    if (!addr && typeof input.marketId === "number") {
      try {
        const db = await import("@/lib/offchain/services/dbClient");
        const m = await db.default.market.findUnique({ where: { id: input.marketId } });
        addr = m?.onchainAddr as string | undefined;
      } catch {}
    }
    if (!addr) return { success: false, error: "marketAddress not provided and not found in DB" };
    const pk = process.env.PRIVATE_KEY;
    if (!pk) return { success: false, error: "PRIVATE_KEY not set on server; client must claim from wallet" };
    const walletClient = getWalletClient();
    const tx = await walletClient.writeContract({ address: addr as `0x${string}`, abi: (ABIS.market as any).abi ?? ABIS.market, functionName: "claimWinnings", args: [] as any } as any);
    await publicClient.waitForTransactionReceipt({ hash: tx });
    return { success: true, txHash: tx };
  } catch (e: any) {
    return { success: false, error: e?.message ?? String(e) };
  }
}
