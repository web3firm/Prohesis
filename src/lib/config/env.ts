export function getFactoryAddress(): `0x${string}` | undefined {
  // Prefer the canonical key, but accept the legacy/back-compat key if present
  const candidates = [
    process.env.NEXT_PUBLIC_FACTORY_CONTRACT,
    process.env.NEXT_PUBLIC_FACTORY_ADDRESS,
  ] as Array<string | undefined>;
  const raw = candidates.find((v) => typeof v === "string" && v.startsWith("0x"));
  return raw as `0x${string}` | undefined;
}
