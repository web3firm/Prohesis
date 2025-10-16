#!/usr/bin/env node
import 'dotenv/config';
import fetch from 'node-fetch';
import { PrismaClient } from '@prisma/client';

const BASE = process.env.BASE_URL || 'http://localhost:3000';
const TEST_USER = process.env.TEST_USER || '0x0000000000000000000000000000000000000001';

async function main(){
  const prisma = new PrismaClient();
  try {
    // pick market id 3 if exists
    const market = await prisma.market.findUnique({ where: { id: 3 } });
    if (!market) {
      console.error('Test market id 3 not found. Aborting.');
      process.exit(2);
    }

    // ensure user exists
    await prisma.user.upsert({ where: { id: TEST_USER }, update: {}, create: { id: TEST_USER, displayName: 'E2E Tester' } });

    // ensure payout doesn't exist, then create it
    await prisma.payout.deleteMany({ where: { marketId: market.id, userId: TEST_USER } });
    await prisma.payout.create({ data: { amount: 1.0, marketId: market.id, userId: TEST_USER } });

    // call validate
    const res = await fetch(`${BASE}/api/payouts/validate?marketId=${encodeURIComponent(String(market.id))}&userId=${encodeURIComponent(TEST_USER)}`);
    const json = await res.json();
    console.log('Validate result:', json);
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
