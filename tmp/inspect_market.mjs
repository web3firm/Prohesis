import { PrismaClient } from '@prisma/client';
(async function(){
  const p = new PrismaClient();
  try {
    const m = await p.market.findUnique({ where: { id: 3 }, select: { id:true, title:true, endTime:true, onchainAddr:true, totalPool:true, status:true, winningOutcome:true, winning:true, resolved_outcome_index:true } });
    console.log(JSON.stringify(m, null, 2));
  } finally {
    await p.$disconnect();
  }
})();
