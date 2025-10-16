import { PrismaClient } from '@prisma/client';
(async function(){
  const p = new PrismaClient();
  try {
    const cols = await p.$queryRaw`SELECT column_name FROM information_schema.columns WHERE table_name = '"Market"' OR table_name = 'market'`;
    console.log(JSON.stringify(cols, null, 2));
  } finally {
    await p.$disconnect();
  }
})();
