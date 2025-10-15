'use strict';

// Usage: VERCEL_TOKEN=... VERCEL_PROJECT_ID=... node scripts/upsert-vercel-env.mjs
// Reads .env in repository root and upserts each entry into Vercel project envs (production + preview).

import fs from 'fs';
import path from 'path';
import {fileURLToPath} from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ENV_FILE = path.resolve(__dirname, '../.env');

function parseEnv(content){
  const lines = content.split(/\r?\n/);
  const map = new Map();
  for (let line of lines){
    line = line.trim();
    if (!line) continue;
    if (line.startsWith('#')) continue;
    const idx = line.indexOf('=');
    if (idx === -1) continue;
    const key = line.substring(0, idx).trim();
    let value = line.substring(idx+1);
    value = value.replace(/^\"|\"$/g, '');
    map.set(key, value);
  }
  return map;
}

async function fetchJson(url, opts){
  const res = await fetch(url, opts);
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch (e) { throw new Error(`Invalid JSON from ${url}: ${text.slice(0,300)}`); }
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${JSON.stringify(json)}`);
  return json;
}

async function main(){
  const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
  const VERCEL_PROJECT_ID = process.env.VERCEL_PROJECT_ID;
  if (!VERCEL_TOKEN || !VERCEL_PROJECT_ID){
    console.error('Please set VERCEL_TOKEN and VERCEL_PROJECT_ID environment variables.');
    process.exit(2);
  }

  if (!fs.existsSync(ENV_FILE)){
    console.error('.env file not found at', ENV_FILE);
    process.exit(1);
  }
  const content = fs.readFileSync(ENV_FILE, 'utf8');
  const envMap = parseEnv(content);
  if (envMap.size === 0){
    console.log('.env parsed but no entries found.');
    return;
  }

  const listUrl = `https://api.vercel.com/v9/projects/${VERCEL_PROJECT_ID}/env`;
  const existing = await fetchJson(listUrl, { headers: { 'Authorization': `Bearer ${VERCEL_TOKEN}` } });

  for (const [key, value] of envMap.entries()){
    const target = ['production','preview'];
    const type = key.startsWith('NEXT_PUBLIC_') ? 'plain' : 'encrypted';
    const found = (existing.env || []).find(e => e.key === key);
    if (found){
      const id = found.id;
      console.log(`Patching ${key} (id: ${id})`);
      const patchUrl = `https://api.vercel.com/v9/projects/${VERCEL_PROJECT_ID}/env/${id}`;
      const payload = { value, target, type };
      try{
        const res = await fetchJson(patchUrl, { method: 'PATCH', headers: { 'Authorization': `Bearer ${VERCEL_TOKEN}`, 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        console.log({ key: res.key, id: res.id, target: res.target });
      }catch(e){
        console.error('Failed to patch', key, e.message);
      }
    } else {
      console.log(`Creating ${key}`);
      const createUrl = `https://api.vercel.com/v9/projects/${VERCEL_PROJECT_ID}/env`;
      const payload = { key, value, target, type };
      try{
        const res = await fetchJson(createUrl, { method: 'POST', headers: { 'Authorization': `Bearer ${VERCEL_TOKEN}`, 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        console.log({ key: res.key, id: res.id, target: res.target });
        // update local existing list so newly created keys are considered
        existing.env = existing.env || [];
        existing.env.push(res);
      }catch(e){
          console.error('Failed to create', key, e.message);
          // If the env already exists (race or paginated list), try to re-fetch and patch the existing entry
          try{
            const refreshed = await fetchJson(listUrl, { headers: { 'Authorization': `Bearer ${VERCEL_TOKEN}` } });
            const foundNow = (refreshed.env || []).find(e => e.key === key);
            if (foundNow){
              const idNow = foundNow.id;
              console.log(`Detected existing ${key} after create failure; patching id ${idNow}`);
              const patchUrlNow = `https://api.vercel.com/v9/projects/${VERCEL_PROJECT_ID}/env/${idNow}`;
              const payloadNow = { value, target, type };
              const patched = await fetchJson(patchUrlNow, { method: 'PATCH', headers: { 'Authorization': `Bearer ${VERCEL_TOKEN}`, 'Content-Type': 'application/json' }, body: JSON.stringify(payloadNow) });
              console.log({ key: patched.key, id: patched.id, target: patched.target });
              existing.env = existing.env || [];
              existing.env.push(patched);
            }
          }catch(e2){
            console.error('Secondary patch attempt failed for', key, e2.message);
          }
      }
    }
  }
}

main().catch(err => { console.error(err); process.exit(1); });
