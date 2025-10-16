#!/usr/bin/env node
import dotenv from 'dotenv';
import fs from 'fs';
import { ethers } from 'ethers';
import factoryJson from '../src/lib/onchain/abis/MarketFactory.json';
import marketJson from '../src/lib/onchain/abis/ProhesisPredictionMarket.json';
import { PrismaClient } from '@prisma/client';

dotenv.config({ path: new URL('../.env', import.meta.url) });
const prisma = new PrismaClient();
const RPC = process.env.SEPOLIA_RPC_URL || process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL;
const FACTORY = process.env.NEXT_PUBLIC_FACTORY_CONTRACT;

if (!RPC || !FACTORY) {
  console.error('Missing RPC or FACTORY in .env');
  process.exit(1);
}

const provider = new ethers.providers.JsonRpcProvider(RPC);
const factory = new ethers.Contract(FACTORY, factoryJson.abi, provider);

async function main() {
  let addrs = [];
  try {
    addrs = await factory.getAllMarkets();
  } catch (e) {
    const total = (await factory.totalMarkets()).toNumber();
    for (let i = 0; i < total; i++) {
      addrs.push(await factory.allMarkets(i));
    }
  }

  for (const addr of addrs) {
    try {
      const m = new ethers.Contract(addr, marketJson.abi, provider);
      const title = await m.title();
      const endTime = (await m.endTime()).toNumber();
      const pools = await m.getPoolTotals();
      const totalPool = pools[0].add(pools[1]).toString();
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
