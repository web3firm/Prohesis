import { createPublicClient, http, getAddress, fallback } from "viem";
import { sepolia } from "viem/chains";

const primary = (process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || process.env.SEPOLIA_RPC_URL) as string | undefined;
const secondary = process.env.SEPOLIA_RPC_URL_BACKUP as string | undefined;

const transports = [primary, secondary].filter(Boolean).map((u) => http(u as string, { batch: true, retryCount: 3 }));

export const publicClient = createPublicClient({
  chain: sepolia,
  transport: transports.length > 1 ? fallback(transports, { rank: true }) : http((primary || ""), { batch: true, retryCount: 3 }),
});

export const normalize = (addr: string) => getAddress(addr);
