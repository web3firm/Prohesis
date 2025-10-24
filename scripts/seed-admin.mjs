#!/usr/bin/env node
import 'dotenv/config';
import prisma from '../src/lib/offchain/services/dbClient.ts';

async function main() {
  const email = process.env.ADMIN_USER?.toLowerCase();
  if (!email) {
    console.error('ADMIN_USER missing');
    process.exit(1);
  }
  try {
    const admin = await prisma.admin.upsert({
      where: { email },
      update: {},
      create: { email },
    });
    console.log('Seeded admin:', admin.email);
    process.exit(0);
  } catch (e) {
    console.error('Failed to seed admin:', e?.message || e);
    process.exit(1);
  }
}

main();
