#!/usr/bin/env node
import { spawnSync } from 'node:child_process';

function run(cmd, args = []) {
  const res = spawnSync(cmd, args, { stdio: 'inherit' });
  if (res.status !== 0) process.exit(res.status ?? 1);
}

run('node', ['scripts/cleanDb.mjs']);
run('node', ['scripts/syncFactoryToDb.mjs']);
run('node', ['scripts/syncPools.mjs']);
