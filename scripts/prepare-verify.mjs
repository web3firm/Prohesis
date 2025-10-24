#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import "dotenv/config";
import { encodeAbiParameters } from "viem";
import { privateKeyToAccount } from "viem/accounts";

function findBuildInfo() {
  const dir = path.join(process.cwd(), "artifacts", "build-info");
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json"));
  const f = files.find((x) => !x.endsWith(".output.json"));
  if (!f) throw new Error("No build-info file found. Run: npx hardhat compile");
  return JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
}

const contractFqn = "project/contracts/MarketFactory.sol:MarketFactory";
const buildInfo = findBuildInfo();
const compilerVersion = `v${buildInfo.solcVersion}`; // e.g. v0.8.24+commit.e11b9ed9
const sourceCode = JSON.stringify(buildInfo.input, null, 2);

let feeRecipient = process.env.PROTOCOL_FEE_RECIPIENT || process.env.DEPLOYER_ADDRESS;
if (!feeRecipient && process.env.PRIVATE_KEY) {
  const pk = process.env.PRIVATE_KEY;
  const acct = privateKeyToAccount(pk.startsWith("0x") ? pk : `0x${pk}`);
  feeRecipient = acct.address;
}
const feeBps = Number(process.env.PROTOCOL_FEE_BPS || 100);
const minBet = BigInt(process.env.MIN_BET_WEI || 0);

if (!feeRecipient) {
  console.error("Set PROTOCOL_FEE_RECIPIENT or DEPLOYER_ADDRESS in .env to encode constructor args.");
  process.exit(1);
}

const encodedArgs = encodeAbiParameters(
  [
    { type: "address" },
    { type: "uint16" },
    { type: "uint256" }
  ],
  [feeRecipient, feeBps, minBet]
);

const outDir = path.join(process.cwd(), "verify");
fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, "MarketFactory.standard-input.json");
fs.writeFileSync(outPath, sourceCode);

console.log("Prepared verification artifacts:");
console.log(" - Standard JSON input:", outPath);
console.log(" - Compiler version:", compilerVersion);
console.log(" - Contract name:", contractFqn);
console.log(" - Encoded constructor arguments (hex, no 0x):", encodedArgs.slice(2));
