#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { createWalletClient, createPublicClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia, sepolia } from "viem/chains";

async function main() {
  const idx = process.argv.indexOf("--network");
  const networkName = idx !== -1 ? (process.argv[idx + 1] || "sepolia") : (process.env.HARDHAT_NETWORK || process.env.NETWORK || "sepolia");
  console.log("Network:", networkName);

  const chain = networkName === "baseSepolia" ? baseSepolia : sepolia;
  const rpcUrl = networkName === "baseSepolia"
    ? (process.env.BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org")
    : process.env.SEPOLIA_RPC_URL;

  const pk = process.env.PRIVATE_KEY;
  if (!pk) {
    throw new Error("No PRIVATE_KEY found in env. Set a funded deployer private key for the target network.");
  }
  const account = privateKeyToAccount(pk.startsWith("0x") ? pk : `0x${pk}`);
  const wallet = createWalletClient({ account, chain, transport: http(rpcUrl) });
  const publicClient = createPublicClient({ chain, transport: http(rpcUrl) });
  const deployerAddress = account.address;
  console.log("Deployer:", deployerAddress);

  const feeRecipient = process.env.PROTOCOL_FEE_RECIPIENT || deployerAddress;
  const feeBps = Number(process.env.PROTOCOL_FEE_BPS || 100); // default 1%
  const minBet = BigInt(process.env.MIN_BET_WEI || 0);

  console.log("Params:", { feeRecipient, feeBps, minBet: minBet.toString() });

  // Read compiled artifact produced by Hardhat
  const artifactPath = path.join(process.cwd(), "artifacts", "contracts", "MarketFactory.sol", "MarketFactory.json");
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
  const { abi, bytecode } = artifact;

  const hash = await wallet.deployContract({ abi, bytecode, args: [feeRecipient, feeBps, minBet] });
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  const addr = receipt.contractAddress;
  console.log("MarketFactory deployed:", addr);

  // Update .env.local and .env with NEXT_PUBLIC_FACTORY_CONTRACT
  const updateEnvFile = (envPath) => {
    let env = "";
    try { env = fs.readFileSync(envPath, "utf8"); } catch {}
    const line = `NEXT_PUBLIC_FACTORY_CONTRACT=${addr}`;
    if (env.includes("NEXT_PUBLIC_FACTORY_CONTRACT=")) {
      env = env.replace(/NEXT_PUBLIC_FACTORY_CONTRACT=.*/g, line);
    } else if (env) {
      env += (env.endsWith("\n") ? "" : "\n") + line + "\n";
    } else {
      env = line + "\n";
    }
    fs.writeFileSync(envPath, env);
    console.log("Updated", envPath);
  };
  updateEnvFile(".env.local");
  if (fs.existsSync(".env")) updateEnvFile(".env");

  console.log("To verify:");
  console.log(
    `  npx hardhat verify --network ${networkName} ${addr} ${feeRecipient} ${feeBps} ${minBet}`
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
