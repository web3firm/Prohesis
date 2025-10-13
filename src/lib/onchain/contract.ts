import { publicClient } from "./provider";
import factoryAbi from "@/lib/onchain/abis/MarketFactory.json";
import marketAbi from "@/lib/onchain/abis/ProhesisPredictionMarket.json";

export const ABIS = {
  factory: factoryAbi as any,
  market: marketAbi as any,
};

export const FACTORY = process.env.NEXT_PUBLIC_FACTORY_CONTRACT as `0x${string}`;
export const client = publicClient;
