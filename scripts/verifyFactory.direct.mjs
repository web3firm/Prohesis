#!/usr/bin/env node
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { createPublicClient, http, encodeAbiParameters } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia, sepolia } from "viem/chains";

async function findBuildInfoFor(contractFqn) {
  const buildInfoDir = path.join(process.cwd(), "artifacts", "build-info");
  const files = fs.readdirSync(buildInfoDir).filter((f) => f.endsWith(".json"));
  for (const f of files) {
    const p = path.join(buildInfoDir, f);
    const json = JSON.parse(fs.readFileSync(p, "utf8"));
    const { output } = json;
    const [, contractName] = contractFqn.split(":");
    const filesWithContracts = output?.contracts ? Object.keys(output.contracts) : [];
    for (const sp of filesWithContracts) {
      if (output.contracts[sp]?.[contractName]) {
        return json;
      }
    }
  }
  throw new Error(`Build info not found for ${contractFqn}`);
}

async function main() {
  const networkName = process.argv.includes("--network")
    ? process.argv[process.argv.indexOf("--network") + 1]
    : process.env.HARDHAT_NETWORK || process.env.NETWORK || "baseSepolia";
  const chain = networkName === "baseSepolia" ? baseSepolia : sepolia;
  const rpcUrl = networkName === "baseSepolia"
    ? (process.env.BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org")
    : process.env.SEPOLIA_RPC_URL;

  const address = process.env.NEXT_PUBLIC_FACTORY_CONTRACT || process.argv[2];
  if (!address) throw new Error("Factory address not provided. Set NEXT_PUBLIC_FACTORY_CONTRACT or pass as first arg.");

  const apiKey = process.env.BASESCAN_API_KEY;
  if (!apiKey) throw new Error("BASESCAN_API_KEY not set.");

  const feeBps = Number(process.env.PROTOCOL_FEE_BPS || 100);
  const minBet = BigInt(process.env.MIN_BET_WEI || 0);
  let feeRecipient = process.env.PROTOCOL_FEE_RECIPIENT;
  if (!feeRecipient) {
    const pk = process.env.PRIVATE_KEY;
    if (!pk) throw new Error("Set PROTOCOL_FEE_RECIPIENT or provide PRIVATE_KEY to derive deployer address.");
    const account = privateKeyToAccount(pk.startsWith("0x") ? pk : `0x${pk}`);
    feeRecipient = account.address;
  }

  const contractFqn = "project/contracts/MarketFactory.sol:MarketFactory";
  const info = await findBuildInfoFor(contractFqn);
  const solcLong = info.solcLongVersion || `v${info.solcVersion}`;
  const compilerVersion = solcLong.startsWith("v") ? solcLong : `v${solcLong}`;
  const sourceCode = JSON.stringify(info.input);

  const publicClient = createPublicClient({ chain, transport: http(rpcUrl) });
  const code = await publicClient.getBytecode({ address });
  if (!code) throw new Error(`No bytecode at ${address} on ${networkName}.`);

  // Encode constructor args
  const encodedArgs = encodeAbiParameters(
    [
      { name: "_feeRecipient", type: "address" },
      { name: "_feeBps", type: "uint16" },
      { name: "_minBet", type: "uint256" },
    ],
    [feeRecipient, BigInt(feeBps), minBet]
  ).slice(2);

  const baseApi = networkName === "baseSepolia" ? "https://api-sepolia.basescan.org/api" : "https://api.basescan.org/api";

  const body = {
    module: "contract",
    action: "verifysourcecode",
    contractAddress: address,
    codeFormat: "solidity-standard-json-input",
    contractName: contractFqn,
    compilerVersion: compilerVersion,
    constructorArguments: encodedArgs,
    sourceCode,
  };

  console.log("Submitting verification to Basescan (v2 JSON)...");
  const res = await fetch(baseApi, { method: "POST", headers: { "content-type": "application/json", "X-API-Key": apiKey }, body: JSON.stringify(body) });
  const json = await res.json();
  if (json.status !== "1") {
    console.error("Submit failed:", json);
    process.exit(1);
  }
  const guid = json.result || json.message || json.guid;
  console.log("Submitted. GUID:", guid);

  // Poll for status
  for (let i = 0; i < 20; i++) {
    await new Promise((r) => setTimeout(r, 3000));
  const statusBody = { module: "contract", action: "checkverifystatus", guid };
  const r2 = await fetch(baseApi, { method: "POST", headers: { "content-type": "application/json", "X-API-Key": apiKey }, body: JSON.stringify(statusBody) });
  const j2 = await r2.json();
    console.log(`Status [${i + 1}]:`, j2.message, j2.result || "");
    if (j2.status === "1") {
      console.log("Verification successful.");
      return;
    }
    if (j2.result && typeof j2.result === "string" && j2.result.includes("Already Verified")) {
      console.log("Contract already verified.");
      return;
    }
  }
  console.log("Verification pending. Please check Basescan later.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
