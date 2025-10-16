import db from '../src/lib/offchain/services/dbClient.js';
(async function(){
  try{
    const m1 = await db.market.findUnique({ where: { id: 3 } });
    console.log('findUnique id 3 ->', m1);
    const m2 = await db.market.findFirst({ where: { onchainAddr: '0x41682293Fc903997a66125eF70f44965f6dD5125' } });
    console.log('findFirst onchainAddr ->', m2);
  }catch(e){console.error(e);} finally { if(db?.$disconnect) await db.$disconnect(); }
})();
