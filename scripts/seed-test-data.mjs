#!/usr/bin/env node
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

function txHashFrom(seed) {
  return '0x' + crypto.createHash('sha256').update(seed).digest('hex').slice(0, 64);
}

async function main() {
  const args = process.argv.slice(2);
  const doDelete = args.includes('--delete') || args.includes('-d');
  if (doDelete) {
    console.log('Running in DELETE mode: removing test users, bets, and payouts...');
  } else {
    console.log('Seeding test users, bets, and payouts...');
  }

  // Use canonical wallet-like addresses as user ids for consistency
  const user1Id = '0x0000000000000000000000000000000000000001';
  const user2Id = '0x0000000000000000000000000000000000000002';

  await prisma.user.upsert({
    where: { id: user1Id },
    update: { displayName: 'Test User 1' },
    create: { id: user1Id, displayName: 'Test User 1', email: `${user1Id}@seed.local` },
  });

  await prisma.user.upsert({
    where: { id: user2Id },
    update: { displayName: 'Test User 2' },
    create: { id: user2Id, displayName: 'Test User 2', email: `${user2Id}@seed.local` },
  });

  const markets = await prisma.market.findMany({ take: 3, orderBy: { id: 'asc' } });
  console.log('Found markets:', markets.map((m) => ({ id: m.id, onchain: m.onchainAddr })));

  let betCount = 0;
  let payoutCount = 0;

  for (const m of markets) {
    // create two bets per market if they don't exist
    const tx1 = txHashFrom(`bet-${m.id}-1`);
    const tx2 = txHashFrom(`bet-${m.id}-2`);
    if (doDelete) {
      // delete bets with these txHashes if exist
      const del1 = await prisma.bet.deleteMany({ where: { txHash: tx1 } });
      const del2 = await prisma.bet.deleteMany({ where: { txHash: tx2 } });
      betCount += del1.count + del2.count;
      // delete payouts for test_user_1 on this market
      const pd = await prisma.payout.deleteMany({ where: { marketId: m.id, userId: user1Id } });
      payoutCount += pd.count;
    } else {
      try {
        await prisma.bet.create({
          data: {
            amount: 1.5 + m.id,
            marketId: m.id,
            userId: user1Id,
            txHash: tx1,
            walletChainId: 11155111,
            outcomeIndex: 0,
            walletAddress: '0x0000000000000000000000000000000000000001',
          },
        });
        betCount++;
      } catch (e) {
        // ignore unique constraint
      }

      try {
        await prisma.bet.create({
          data: {
            amount: 0.7 + m.id,
            marketId: m.id,
            userId: user2Id,
            txHash: tx2,
            walletChainId: 11155111,
            outcomeIndex: 1,
            walletAddress: '0x0000000000000000000000000000000000000002',
          },
        });
        betCount++;
      } catch (e) {
        // ignore unique constraint
      }

      // For first market, insert a payout for user1
      if (m.id === markets[0].id) {
        try {
          await prisma.payout.create({ data: { amount: 2.5 + m.id, marketId: m.id, userId: user1Id } });
          payoutCount++;
        } catch (e) {}
      }
    }
  }

  if (doDelete) {
    console.log(`Deleted ${betCount} bets and ${payoutCount} payouts.`);
  } else {
    console.log(`Inserted ${betCount} bets and ${payoutCount} payouts (new).`);
  }

  const totals = await Promise.all([
    prisma.user.count(),
    prisma.bet.count(),
    prisma.payout.count(),
    prisma.market.count(),
  ]);

  console.log({ users: totals[0], bets: totals[1], payouts: totals[2], markets: totals[3] });

  if (doDelete) {
    // Optionally remove test users
  await prisma.user.deleteMany({ where: { id: { in: [user1Id, user2Id] } } });
    console.log('Deleted test users');
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
