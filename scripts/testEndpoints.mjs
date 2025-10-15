import fetch from 'node-fetch';

const HOST = process.env.HOST || 'http://localhost:3000';

async function checkList() {
  const url = `${HOST}/api/markets/list`;
  console.log('Checking', url);
  const res = await fetch(url);
  const body = await res.text();
  console.log('Status:', res.status);
  try {
    console.log('JSON:', JSON.parse(body));
  } catch (e) {
    console.log('Body:', body);
  }
}

async function tryCreate() {
  const url = `${HOST}/api/markets/create`;
  console.log('\nAttempting create (this will fail if PRIVATE_KEY not set) ->', url);
  const payload = {
    question: 'Smoke test create',
    outcomes: ['Yes', 'No'],
    endTime: Date.now() + 1000 * 60 * 60 * 24, // 24h
    creatorAddress: process.env.TEST_CREATOR || '0x0000000000000000000000000000000000000000',
    userId: process.env.TEST_CREATOR || '0x0000000000000000000000000000000000000000',
  };
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
  const json = await res.text();
  console.log('Status:', res.status);
  try {
    console.log('JSON:', JSON.parse(json));
  } catch (e) {
    console.log('Body:', json);
  }
}

(async () => {
  try {
    await checkList();
    await tryCreate();
  } catch (e) {
    console.error('Error running smoke tests:', e);
    process.exit(1);
  }
})();
