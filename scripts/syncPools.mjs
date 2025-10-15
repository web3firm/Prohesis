#!/usr/bin/env node
import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

const BASE = process.env.NEXT_PUBLIC_BASE_URL || process.env.BASE_URL || 'http://localhost:3000';
const URL = `${BASE.replace(/\/$/, '')}/api/markets/syncPools`;

console.log(`Calling pool sync endpoint: ${URL}`);

(async () => {
  try {
    const res = await fetch(URL);
    const json = await res.text();
    console.log('Status:', res.status);
    try {
      console.log('Response:', JSON.parse(json));
    } catch (e) {
      console.log('Body:', json);
    }
  } catch (e) {
    console.error('Sync failed:', e.message || e);
    process.exit(1);
  }
})();
