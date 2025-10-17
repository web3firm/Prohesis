import { assertAddress } from "./env";

export const CONTRACT_ADDRESS = assertAddress("NEXT_PUBLIC_MARKET_CONTRACT_ADDRESS");
export const FACTORY = assertAddress("NEXT_PUBLIC_FACTORY_CONTRACT");

export const DEFAULT_CONSTANTS = {
  CONTRACT_ADDRESS,
  FACTORY,
};
