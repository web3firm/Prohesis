#!/usr/bin/env node
import { readFile } from 'fs/promises'

const ENV_PATH = `${process.cwd()}/.env`

function parseDotenv(src) {
  const lines = src.split(/\r?\n/)
  const out = []
  for (let line of lines) {
    line = line.trim()
    if (!line || line.startsWith('#')) continue
    const idx = line.indexOf('=')
    if (idx === -1) continue
    const key = line.slice(0, idx).trim()
    let value = line.slice(idx + 1)
    // remove surrounding quotes
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    out.push({ key, value })
  }
  return out
}

async function fetchJson(url, opts = {}) {
  const res = await fetch(url, opts)
  const text = await res.text()
  try {
    return { status: res.status, body: JSON.parse(text) }
  } catch (e) {
    return { status: res.status, body: text }
  }
}

async function main() {
  const token = process.env.VERCEL_TOKEN
  const projectId = process.env.VERCEL_PROJECT_ID
  if (!token || !projectId) {
    console.error('Missing VERCEL_TOKEN or VERCEL_PROJECT_ID in environment')
    process.exit(1)
  }

  let src
  try {
    src = await readFile(ENV_PATH, 'utf8')
  } catch (e) {
    console.error('Could not read .env file in repo root:', ENV_PATH)
    process.exit(1)
  }

  const entries = parseDotenv(src)
  if (!entries.length) {
    console.log('No env entries found in .env')
    return
  }

  const listUrl = `https://api.vercel.com/v9/projects/${projectId}/env?limit=1000`
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }

  // fetch existing list
  const listRes = await fetchJson(listUrl, { headers })
  // Vercel may return `envs` or `env` depending on API shape; handle both
  const existing = (listRes.body && (listRes.body.envs || listRes.body.env)) || []

  for (const { key, value } of entries) {
    const type = key.startsWith('NEXT_PUBLIC_') ? 'plain' : 'encrypted'
    const found = existing.find(e => e.key === key)
    if (found) {
      const id = found.id
      const patchUrl = `https://api.vercel.com/v9/projects/${projectId}/env/${id}`
      const payload = { value, target: ['production', 'preview'], type }
      const res = await fetchJson(patchUrl, { method: 'PATCH', headers, body: JSON.stringify(payload) })
      if (res.status >= 200 && res.status < 300) {
        console.log(JSON.stringify({ key, action: 'patched', id }))
      } else {
        console.log(JSON.stringify({ key, action: 'patch_failed', status: res.status, body: res.body }))
      }
    } else {
      const payload = { key, value, target: ['production', 'preview'], type }
      const res = await fetchJson(listUrl, { method: 'POST', headers, body: JSON.stringify(payload) })
      if (res.status >= 200 && res.status < 300) {
        const id = res.body && res.body.id
        console.log(JSON.stringify({ key, action: 'created', id }))
        // update existing list so subsequent runs can find it
        existing.push({ key, id })
  } else if (res.status === 409 || res.status === 403 || (res.body && res.body.error && res.body.error.code === 'ENV_ALREADY_EXISTS')) {
        // race: env already exists, fetch again and patch
  const refresh = await fetchJson(listUrl, { headers })
        const refreshed = (refresh.body && refresh.body.env) || []
        const foundNow = refreshed.find(e => e.key === key)
        if (foundNow) {
          const id = foundNow.id
          const patchUrl = `https://api.vercel.com/v9/projects/${projectId}/env/${id}`
          const payload2 = { value, target: ['production', 'preview'], type }
          const r2 = await fetchJson(patchUrl, { method: 'PATCH', headers, body: JSON.stringify(payload2) })
          if (r2.status >= 200 && r2.status < 300) {
            console.log(JSON.stringify({ key, action: 'patched_after_conflict', id }))
          } else {
            console.log(JSON.stringify({ key, action: 'patch_after_conflict_failed', status: r2.status, body: r2.body }))
          }
        } else {
          console.log(JSON.stringify({ key, action: 'create_conflict_no_id', status: res.status, body: res.body }))
        }
      } else {
        console.log(JSON.stringify({ key, action: 'create_failed', status: res.status, body: res.body }))
      }
    }
  }
}

main().catch(err => {
  console.error('Unhandled error:', err)
  process.exit(1)
})
