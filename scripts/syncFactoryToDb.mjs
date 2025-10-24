#!/usr/bin/env node
import dotenv from 'dotenv';
import fs from 'fs';
import { ethers } from 'ethers';
import { PrismaClient } from '@prisma/client';

// Prefer .env.local for local dev, fallback to .env
const localEnvPath = new URL('../.env.local', import.meta.url);
const envPath = fs.existsSync(localEnvPath) ? localEnvPath : new URL('../.env', import.meta.url);
dotenv.config({ path: envPath });

// Load JSON ABIs using fs to avoid Node import assertion requirements
const factoryJson = JSON.parse(fs.readFileSync(new URL('../src/lib/onchain/abis/MarketFactory.json', import.meta.url), 'utf8'));
const marketJson = JSON.parse(fs.readFileSync(new URL('../src/lib/onchain/abis/ProhesisPredictionMarket.json', import.meta.url), 'utf8'));
const prisma = new PrismaClient();
// Prefer Base Sepolia now; fallback to generic/public RPC if needed
const RPC =
  process.env.BASE_SEPOLIA_RPC_URL ||
  process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL ||
  process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC ||
  process.env.NEXT_PUBLIC_ALCHEMY_RPC ||
  process.env.RPC_URL ||
  process.env.SEPOLIA_RPC_URL ||
  process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL;
const FACTORY = process.env.NEXT_PUBLIC_FACTORY_CONTRACT;

if (!RPC || !FACTORY) {
  console.error('Missing RPC or FACTORY in .env');
  process.exit(1);
}

// Ethers v6: JsonRpcProvider moved to top-level export
const provider = new ethers.JsonRpcProvider(RPC);
const factory = new ethers.Contract(FACTORY, factoryJson.abi, provider);

async function main() {
  let addrs = [];
  try {
    addrs = await factory.getAllMarkets();
  } catch (e) {
    const total = Number(await factory.totalMarkets());
    for (let i = 0; i < total; i++) {
      addrs.push(await factory.allMarkets(i));
    }
  }

  for (const addr of addrs) {
    try {
      const m = new ethers.Contract(addr, marketJson.abi, provider);
      const title = await m.title();
      const endTime = Number(await m.endTime());
      const pools = await m.getPoolTotals(); // likely returns bigint[] in v6
      const totalPool = (pools[0] + pools[1]).toString();
      await prisma.market.upsert({
        where: { onchainAddr: addr },
        update: { title, endTime: new Date(endTime * 1000), totalPool: Number(totalPool) / 1e18 },
        create: { title, endTime: new Date(endTime * 1000), onchainAddr: addr, totalPool: Number(totalPool) / 1e18 },
      });
      console.log('Upserted', addr);
    } catch (e) {
      console.warn('Skipping', addr, e.message || e);
    }
  }

  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); prisma.$disconnect(); process.exit(1); });
