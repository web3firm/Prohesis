#!/usr/bin/env node
import 'dotenv/config';
import fetch from 'node-fetch';
import { PrismaClient } from '@prisma/client';

const BASE = process.env.BASE_URL || 'http://localhost:3000';
const testUser = process.env.TEST_USER || '0x0000000000000000000000000000000000000001';

async function ok(name, p) {
  try {
    const res = await p;
    console.log(name, res.status, '->', await res.text().then(t => t.slice(0,200)));
  } catch (e) {
    console.error(name, 'failed', e.message || e);
    process.exit(2);
  }
}

(async function main(){
  console.log('Integration smoke test against', BASE);

  // 1) List markets
  await ok('/api/markets/list', fetch(`${BASE}/api/markets/list`));

  // 2) Profile for seeded user
  await ok('/api/profile', fetch(`${BASE}/api/profile?userId=${encodeURIComponent(testUser)}`));

  // 3) pick a market and validate payout
  const marketsRes = await fetch(`${BASE}/api/markets/list`);
  if (!marketsRes.ok) {
    console.error('Could not fetch markets list');
    process.exit(3);
  }
  const markets = await marketsRes.json();
  const first = markets?.[0];
  const mid = first?.id ?? first?.onchainAddr ?? 1;

  // Prepare a resolved market and a winning bet for the seeded user so we can exercise a positive claim path.
  try {
    const prisma = new PrismaClient();
    // If mid is numeric id, use it; if onchainAddr, try to resolve by onchainAddr
    let marketRecord = null;
    if (/^\d+$/.test(String(mid))) {
      marketRecord = await prisma.market.findUnique({ where: { id: Number(mid) } });
    } else {
      marketRecord = await prisma.market.findFirst({ where: { onchainAddr: String(mid) } });
    }

    if (marketRecord) {
      // mark resolved with winning outcome = 0
      await prisma.market.update({ where: { id: marketRecord.id }, data: { status: 'resolved', winningOutcome: 0 } }).catch(()=>{});

      // ensure the test user exists
      const user = await prisma.user.upsert({ where: { id: testUser }, update: {}, create: { id: testUser, displayName: 'Test User 1', email: `${testUser}@seed.local` } });

      // create a winning bet for this user (outcomeIndex = 0)
      const tx = '0x' + Math.random().toString(16).slice(2).padEnd(64,'0').slice(0,64);
      await prisma.bet.createMany({ data: [{ txHash: tx, marketId: marketRecord.id, userId: user.id, walletChainId: 11155111, outcomeIndex: 0, amount: 1.0, walletAddress: testUser }], skipDuplicates: true });

      // ensure no payout exists yet for this user/market
      await prisma.payout.deleteMany({ where: { marketId: marketRecord.id, userId: user.id } }).catch(()=>{});
    }

    await prisma.$disconnect();
  } catch (e) {
    console.warn('Could not prepare resolved market via Prisma (maybe running remote DB). Continuing anyway.', e.message || e);
  }

  await ok('/api/payouts/validate', fetch(`${BASE}/api/payouts/validate?marketId=${encodeURIComponent(mid)}&userId=${encodeURIComponent(testUser)}`));

  console.log('Integration smoke test complete');
})();
