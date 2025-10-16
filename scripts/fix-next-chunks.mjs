import fs from 'fs';
import path from 'path';

const serverDir = path.resolve('.next/server');
const chunksDir = path.join(serverDir, 'chunks');
const vendorChunksDir = path.join(serverDir, 'vendor-chunks');
const target = path.join(chunksDir, 'vendor-chunks');

function copyChunksToVendor() {
  try {
    if (!fs.existsSync(chunksDir)) return false;
    if (!fs.existsSync(vendorChunksDir)) fs.mkdirSync(vendorChunksDir);
    const files = fs.readdirSync(chunksDir);
    for (const f of files) {
      const src = path.join(chunksDir, f);
      const dest = path.join(vendorChunksDir, f);
      if (fs.lstatSync(src).isFile()) {
        fs.copyFileSync(src, dest);
      }
    }
    console.log('Copied chunk files into .next/server/vendor-chunks');
    return true;
  } catch (e) {
    console.error('Failed to copy chunk files to vendor-chunks:', e);
    return false;
  }
}

try {
  if (!fs.existsSync(serverDir)) {
    console.error('.next/server not found, skipping fix.');
    process.exit(0);
  }

  // If vendor-chunks already present, ensure symlink exists or at least it's available
  if (fs.existsSync(vendorChunksDir)) {
    try {
      if (!fs.existsSync(target)) {
        fs.symlinkSync('../vendor-chunks', target, 'dir');
        console.log('Created symlink .next/server/chunks/vendor-chunks -> ../vendor-chunks');
      } else {
        console.log('vendor-chunks symlink already exists.');
      }
      process.exit(0);
    } catch (err) {
      console.warn('Symlink creation failed, attempting copy fallback.');
      if (copyChunksToVendor()) process.exit(0);
      process.exit(1);
    }
  }

  // vendor-chunks not present: try to create by copying
  if (copyChunksToVendor()) {
    try {
      if (!fs.existsSync(target)) {
        fs.symlinkSync('../vendor-chunks', target, 'dir');
        console.log('Created symlink .next/server/chunks/vendor-chunks -> ../vendor-chunks');
      }
    } catch (e) {
      console.warn('Could not create symlink after copying; continuing with copied files.');
    }
    process.exit(0);
  }

  console.error('vendor-chunks could not be created by copy or symlink; skipping.');
  process.exit(1);
} catch (err) {
  console.error('Unexpected error in fix-next-chunks:', err);
  process.exit(1);
}
