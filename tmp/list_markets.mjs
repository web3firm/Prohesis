import { PrismaClient } from '@prisma/client';
(async function(){
  const p = new PrismaClient();
  try {
    const ms = await p.market.findMany({ select: { id: true, onchainAddr: true, title: true } });
    console.log(JSON.stringify(ms, null, 2));
  } finally {
    await p.$disconnect();
  }
})();
