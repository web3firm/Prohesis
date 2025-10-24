#!/usr/bin/env node
import "dotenv/config";
import hre from "hardhat";
import fs from "node:fs";
import path from "node:path";
import { createPublicClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia, sepolia } from "viem/chains";

// Ensure the verify plugin is registered
import "@nomicfoundation/hardhat-verify";

async function main() {
  const idx = process.argv.indexOf("--network");
  const networkName = idx !== -1 ? (process.argv[idx + 1] || "sepolia") : (process.env.HARDHAT_NETWORK || process.env.NETWORK || "sepolia");
  const chain = networkName === "baseSepolia" ? baseSepolia : sepolia;
  const rpcUrl = networkName === "baseSepolia"
    ? (process.env.BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org")
    : process.env.SEPOLIA_RPC_URL;

  const address = process.env.NEXT_PUBLIC_FACTORY_CONTRACT;
  if (!address) throw new Error("NEXT_PUBLIC_FACTORY_CONTRACT not found in env.");

  let feeRecipient = process.env.PROTOCOL_FEE_RECIPIENT;
  if (!feeRecipient) {
    const pk = process.env.PRIVATE_KEY;
    if (!pk) throw new Error("Set PROTOCOL_FEE_RECIPIENT or provide PRIVATE_KEY to derive deployer address.");
    const account = privateKeyToAccount(pk.startsWith("0x") ? pk : `0x${pk}`);
    feeRecipient = account.address;
  }
  const feeBps = Number(process.env.PROTOCOL_FEE_BPS || 100);
  const minBet = BigInt(process.env.MIN_BET_WEI || 0);

  // Optionally wait until contract code is available on chain/explorer
  const publicClient = createPublicClient({ chain, transport: http(rpcUrl) });
  const code = await publicClient.getBytecode({ address });
  if (!code) throw new Error(`No bytecode found at ${address} on ${networkName}. Did deployment finish?`);

  // If feeRecipient isn't set, we can attempt verification without it to let plugin prompt; better to require it.
  const constructorArguments = [feeRecipient, feeBps, minBet].filter((v) => v !== undefined);
  if (constructorArguments.length !== 3) {
    throw new Error("Missing constructor args. Set PROTOCOL_FEE_BPS and MIN_BET_WEI (fee recipient can be derived from PRIVATE_KEY). ");
  }

  const contract = "contracts/MarketFactory.sol:MarketFactory";

  console.log("Verifying:", { networkName, address, constructorArguments, contract });

  await hre.run("verify:verify", {
    address,
    constructorArguments,
    contract,
  });

  console.log("Verification submitted.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
