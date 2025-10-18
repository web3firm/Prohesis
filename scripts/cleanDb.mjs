#!/usr/bin/env node
import dotenv from 'dotenv';
import fs from 'fs';
import { PrismaClient } from '@prisma/client';
import { ethers } from 'ethers';

dotenv.config();
const prisma = new PrismaClient();

async function getFactoryAddrs() {
  try {
    const factory = process.env.NEXT_PUBLIC_FACTORY_CONTRACT;
    if (!factory) return [];
    // We don't need to RPC here; DB will be filtered by onchainAddr and the configured factory map.
    // Keeping it simple: return placeholder; list route filters dynamically anyway.
    return [factory.toLowerCase()];
  } catch (e) {
    return [];
  }
}

async function main() {
  const factories = new Set((await getFactoryAddrs()).map((a) => a.toLowerCase()));
  // Delete markets not matching configured factory address (by onchainAddr)
  const toDelete = await prisma.market.findMany({ where: { NOT: { onchainAddr: { in: Array.from(factories) } } } });
  for (const m of toDelete) {
    await prisma.bet.deleteMany({ where: { marketId: m.id } });
    await prisma.payout.deleteMany({ where: { marketId: m.id } });
    await prisma.market.delete({ where: { id: m.id } });
    console.log('Deleted market', m.id, m.onchainAddr);
  }
  await prisma.$disconnect();
}

main().catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
