import { assertAddress } from "./env";

// Only the Factory address is required for a multi-contract (one market per contract) deployment.
export const FACTORY = assertAddress("NEXT_PUBLIC_FACTORY_CONTRACT");

export const DEFAULT_CONSTANTS = {
  FACTORY,
};
