import { createPublicClient, http, getAddress, fallback } from "viem";
import { baseSepolia } from "viem/chains";

// Prefer Base Sepolia RPCs, falling back to generic/Alchemy URLs if provided.
const primary = (
  process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL ||
  process.env.BASE_SEPOLIA_RPC_URL ||
  process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC ||
  process.env.NEXT_PUBLIC_ALCHEMY_RPC ||
  process.env.RPC_URL ||
  "https://sepolia.base.org"
) as string | undefined;

const secondary = (
  process.env.BASE_SEPOLIA_RPC_URL_BACKUP ||
  process.env.NEXT_PUBLIC_RPC_URL ||
  undefined
) as string | undefined;

const transports = [primary, secondary]
  .filter((u): u is string => Boolean(u))
  .map((u) => http(u, { batch: true, retryCount: 3 }));

export const publicClient = createPublicClient({
  chain: baseSepolia,
  transport:
    transports.length > 1
      ? fallback(transports, { rank: true })
      : http((primary || "https://sepolia.base.org"), { batch: true, retryCount: 3 }),
});

export const normalize = (addr: string) => getAddress(addr);
