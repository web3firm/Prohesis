import { createPublicClient, http, getAddress } from "viem";
import { sepolia } from "viem/chains";

export const publicClient = createPublicClient({
  chain: sepolia,
  transport: http(),
});

export const normalize = (addr: string) => getAddress(addr);
