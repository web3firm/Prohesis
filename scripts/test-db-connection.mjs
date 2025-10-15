#!/usr/bin/env node
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('DATABASE_URL not found in environment. Put it in .env or export it.');
    process.exit(2);
  }

  const prisma = new PrismaClient();
  try {
    console.log('Testing DB connection...');
    const now = await prisma.$queryRaw`SELECT now() as now`;
    console.log('SELECT now() result:', now);

    try {
      // Try to count users table if exists
      const users = await prisma.$queryRaw`SELECT COUNT(*)::int as count FROM "User"`;
      console.log('User count:', users?.[0]);
    } catch (e) {
      // ignore if table doesn't exist
      console.log('No "User" table or unable to query it (this is fine if schema differs).', e?.message ?? e);
    }
  } catch (err) {
    console.error('DB connection test failed:', err);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main();
