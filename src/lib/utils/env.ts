export function assertAddress(name: string): `0x${string}` {
  const val = process.env[name];
  if (!val) {
    throw new Error(`Environment variable ${name} is required but not set`);
  }
  // basic Ethereum address check (0x followed by 40 hex chars)
  if (!/^0x[0-9a-fA-F]{40}$/.test(val)) {
    throw new Error(`Environment variable ${name} is not a valid Ethereum address: ${val}`);
  }
  return val as `0x${string}`;
}

export function getString(name: string, fallback?: string): string {
  const val = process.env[name];
  if (val !== undefined) return val;
  if (fallback !== undefined) return fallback;
  throw new Error(`Environment variable ${name} is required but not set`);
}
