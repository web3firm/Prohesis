import 'dotenv/config';
import fetch from 'node-fetch';
import { expect } from 'chai';
import { PrismaClient } from '@prisma/client';

const BASE = process.env.BASE_URL || 'http://localhost:3000';
const TEST_USER = process.env.TEST_USER || '0x0000000000000000000000000000000000000001';

describe('E2E: claim validation', function() {
  this.timeout(10000);
  let prisma;
  before(async () => {
    prisma = new PrismaClient();
  });
  after(async () => {
    await prisma.$disconnect();
  });

  it('should detect an existing payout as already recorded', async () => {
    const market = await prisma.market.findUnique({ where: { id: 3 } });
    if (!market) throw new Error('Market id 3 not found');

    // ensure user exists
    await prisma.user.upsert({ where: { id: TEST_USER }, update: {}, create: { id: TEST_USER, displayName: 'E2E Tester' } });

    // ensure payout exists
    await prisma.payout.deleteMany({ where: { marketId: market.id, userId: TEST_USER } });
    await prisma.payout.create({ data: { amount: 1.0, marketId: market.id, userId: TEST_USER } });

    const res = await fetch(`${BASE}/api/payouts/validate?marketId=${encodeURIComponent(String(market.id))}&userId=${encodeURIComponent(TEST_USER)}`);
    const json = await res.json();
    expect(json).to.have.property('canClaim').that.is.false;
    expect(json).to.have.property('reason').that.includes('Payout');
  });
});
