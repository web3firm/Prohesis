#!/usr/bin/env node
import dotenv from 'dotenv';
import { ethers } from 'ethers';
import fs from 'fs';

const factoryJson = JSON.parse(fs.readFileSync(new URL('../src/lib/onchain/abis/MarketFactory.json', import.meta.url)));
const marketJson = JSON.parse(fs.readFileSync(new URL('../src/lib/onchain/abis/ProhesisPredictionMarket.json', import.meta.url)));

dotenv.config({ path: new URL('../.env', import.meta.url) });

const RPC =
  process.env.BASE_SEPOLIA_RPC_URL ||
  process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL ||
  process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC ||
  process.env.NEXT_PUBLIC_ALCHEMY_RPC ||
  process.env.RPC_URL ||
  process.env.SEPOLIA_RPC_URL ||
  process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL;
const FACTORY = process.env.NEXT_PUBLIC_FACTORY_CONTRACT;

if (!RPC) throw new Error('RPC URL missing (try BASE_SEPOLIA_RPC_URL or NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL)');
if (!FACTORY) throw new Error('NEXT_PUBLIC_FACTORY_CONTRACT missing in .env');

// Ethers v6 provider
const provider = new ethers.JsonRpcProvider(RPC);
const factory = new ethers.Contract(FACTORY, factoryJson.abi, provider);

async function main() {
  console.log('Fetching markets from factory', FACTORY);
  let addrs = [];
  try {
    addrs = await factory.getAllMarkets();
  } catch (e) {
    try {
      const total = Number(await factory.totalMarkets());
      for (let i = 0; i < total; i++) {
        const a = await factory.allMarkets(i);
        addrs.push(a);
      }
    } catch (ee) {
      console.error('Failed to enumerate markets', ee);
      process.exit(1);
    }
  }

  const out = [];
  for (const addr of addrs) {
    const market = new ethers.Contract(addr, marketJson.abi, provider);
    try {
      const title = await market.title();
      const endTime = Number(await market.endTime());
      const resolved = await market.resolved();
      const [yes, no] = await market.getPoolTotals();
      out.push({ address: addr, title, endTime, resolved, yes: yes.toString(), no: no.toString() });
    } catch (e) {
      out.push({ address: addr, error: String(e) });
    }
  }

  console.log(JSON.stringify(out, null, 2));
}

main().catch((e) => { console.error(e); process.exit(1); });
