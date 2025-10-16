import fs from 'fs';
import path from 'path';

const serverDir = path.resolve('.next/server');
const chunksDir = path.join(serverDir, 'chunks');
const vendorChunksDir = path.join(serverDir, 'vendor-chunks');
const target = path.join(chunksDir, 'vendor-chunks');

try {
  if (!fs.existsSync(serverDir)) {
    console.error('.next/server not found, skipping fix.');
    process.exit(0);
  }

  if (!fs.existsSync(vendorChunksDir)) {
    console.error('vendor-chunks directory not found, skipping fix.');
    process.exit(0);
  }

  if (fs.existsSync(target)) {
    console.log('vendor-chunks symlink already exists.');
    process.exit(0);
  }

  fs.symlinkSync('../vendor-chunks', target, 'dir');
  console.log('Created symlink .next/server/chunks/vendor-chunks -> ../vendor-chunks');
} catch (err) {
  console.error('Failed to create symlink for vendor-chunks:', err);
  process.exit(1);
}
