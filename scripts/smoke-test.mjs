#!/usr/bin/env node
import fetch from 'node-fetch';

const BASE = process.env.HOST || 'http://localhost:3000';
const HAS_DB = !!process.env.DATABASE_URL;

async function check(url, opts = {}) {
  const res = await fetch(url, opts);
  const txt = await res.text();
  return { status: res.status, body: txt };
}

async function main() {
  console.log('Running smoke tests against', BASE);

  // Always check the root and robots; these shouldn't need DB
  const home = await check(`${BASE}/`);
  console.log('/', home.status);
  if (home.status !== 200) throw new Error('home page failed');

  const robots = await check(`${BASE}/robots.txt`);
  console.log('/robots.txt', robots.status);
  if (robots.status !== 200) throw new Error('robots.txt failed');

  if (HAS_DB) {
    const list = await check(`${BASE}/api/markets/list`);
    console.log('/api/markets/list', list.status);
    if (list.status !== 200) throw new Error('markets list failed');

    const details = await check(`${BASE}/api/markets/details/1`);
    console.log('/api/markets/details/1', details.status);
    if (details.status !== 200 && details.status !== 404) throw new Error('market details endpoint failed');
  } else {
    console.log('DATABASE_URL not set; skipping DB-dependent API checks');
  }

  console.log('Smoke tests passed');
}

main().catch((e) => { console.error(e); process.exit(1); });
