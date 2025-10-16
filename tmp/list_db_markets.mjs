#!/usr/bin/env node
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main(){
  const markets = await prisma.market.findMany();
  console.log('DB markets:', JSON.stringify(markets, null, 2));
  await prisma.$disconnect();
}

main().catch(e=>{console.error(e); process.exit(1)});
