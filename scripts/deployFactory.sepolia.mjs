#!/usr/bin/env node
import hardhat from "hardhat";
import fs from "node:fs";
const { ethers, network } = hardhat;

async function main() {
  console.log("Network:", network.name);
  const feeRecipient = process.env.PROTOCOL_FEE_RECIPIENT || ethers.ZeroAddress;
  const feeBps = Number(process.env.PROTOCOL_FEE_BPS || 100); // default 1%
  const minBet = BigInt(process.env.MIN_BET_WEI || 0);

  const Factory = await ethers.getContractFactory("MarketFactory");
  const factory = await Factory.deploy(feeRecipient, feeBps, minBet);
  await factory.waitForDeployment();
  const addr = await factory.getAddress();
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
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
