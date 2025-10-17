#!/usr/bin/env node
import hardhat from "hardhat";
const { ethers } = hardhat;

async function main() {
  const feeRecipient = process.env.PROTOCOL_FEE_RECIPIENT || ethers.ZeroAddress;
  const feeBps = Number(process.env.PROTOCOL_FEE_BPS || 0);
  const minBet = BigInt(process.env.MIN_BET_WEI || 0);

  const Factory = await ethers.getContractFactory("MarketFactory");
  const factory = await Factory.deploy(feeRecipient, feeBps, minBet);
  await factory.waitForDeployment();
  const addr = await factory.getAddress();
  console.log("MarketFactory deployed:", addr);
  console.log("Set NEXT_PUBLIC_FACTORY_ADDRESS to", addr);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
