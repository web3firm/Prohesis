import { createPublicClient, http, getAddress } from "viem";
import { sepolia } from "viem/chains";

const rpcUrl = (process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || process.env.SEPOLIA_RPC_URL) as string | undefined;

export const publicClient = createPublicClient({
  chain: sepolia,
  transport: http(rpcUrl || ""),
});

export const normalize = (addr: string) => getAddress(addr);
