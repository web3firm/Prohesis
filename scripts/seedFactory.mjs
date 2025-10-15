import { PrismaClient } from '@prisma/client';
import { createPublicClient, getContract, http } from 'viem';
import { sepolia } from 'viem/chains';
import fs from 'fs/promises';
const factoryJson = JSON.parse(await fs.readFile(new URL('../src/lib/onchain/abis/MarketFactory.json', import.meta.url)));
const marketJson = JSON.parse(await fs.readFile(new URL('../src/lib/onchain/abis/ProhesisPredictionMarket.json', import.meta.url)));

const prisma = new PrismaClient();

const rpcUrl = process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || process.env.SEPOLIA_RPC_URL;
const factoryAddr = process.env.NEXT_PUBLIC_FACTORY_CONTRACT;

if (!factoryAddr) {
  console.error('FACTORY address not set in env');
  process.exit(1);
}

const client = createPublicClient({ chain: sepolia, transport: http(rpcUrl || '') });
const factory = getContract({ address: factoryAddr, abi: factoryJson.abi, client });

async function listMarkets() {
  try {
    const res = await factory.read.getAllMarkets([]);
    return res || [];
  } catch (e) {
    // fallback
    try {
      const total = Number(await factory.read.totalMarkets([]));
      const out = [];
      for (let i = 0; i < total; i++) {
        const addr = await factory.read.allMarkets([BigInt(i)]);
        if (addr) out.push(addr);
      }
      return out;
    } catch (err) {
      console.error('Failed to enumerate markets', err);
      return [];
    }
  }
}

async function readMarket(addr) {
  try {
    const market = getContract({ address: addr, abi: marketJson.abi, client });
    const title = await market.read.title([]).catch(() => `Market ${addr.slice(0,8)}`);
    // try getPoolTotals, fallback to totalYesPool/totalNoPool
    let pools = [];
    try {
      const res = await market.read.getPoolTotals([]);
      pools = res.map((b) => Number(b) / 1e18);
    } catch (e) {
      try {
        const y = await market.read.totalYesPool([]);
        const n = await market.read.totalNoPool([]);
        pools = [Number(y) / 1e18, Number(n) / 1e18];
      } catch (err) {
        pools = [0, 0];
      }
    }
    return { title: String(title || `Market ${addr.slice(0,8)}`), pools };
  } catch (e) {
    console.warn('readMarket failed for', addr, e.message || e);
    return null;
  }
}

async function main() {
  const addrs = await listMarkets();
  if (!addrs || addrs.length === 0) {
    console.log('No markets found on factory');
    return;
  }
  console.log('Found markets:', addrs);
  for (const addr of addrs) {
    const info = await readMarket(addr);
    if (!info) continue;
    const totalPool = info.pools.reduce((s) => s, 0);
    const title = info.title;
    const now = new Date();
    await prisma.market.upsert({
      where: { onchainAddr: addr },
      update: { totalPool, title },
      create: { title, endTime: new Date(Date.now() + 86400000), onchainAddr: addr, totalPool },
    });
    console.log('Upserted', addr, title);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
