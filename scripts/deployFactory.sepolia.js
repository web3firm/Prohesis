#!/usr/bin/env node
const fs = require("node:fs");
const hre = require("hardhat");
const { ethers, network } = hre;

async function main() {
  console.log("Network:", network.name);
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  const feeRecipient = process.env.PROTOCOL_FEE_RECIPIENT || deployer.address;
  const feeBps = Number(process.env.PROTOCOL_FEE_BPS || 100); // default 1%
  const minBet = BigInt(process.env.MIN_BET_WEI || 0);

  console.log("Params:", { feeRecipient, feeBps, minBet: minBet.toString() });

  const Factory = await ethers.getContractFactory("MarketFactory");
  const factory = await Factory.deploy(feeRecipient, feeBps, minBet);
  await factory.deployed();
  const addr = factory.address;
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
    `  npx hardhat verify --network ${network.name} ${addr} ${feeRecipient} ${feeBps} ${minBet}`
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
