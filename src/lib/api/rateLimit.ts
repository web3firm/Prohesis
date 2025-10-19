type StoreItem = { count: number; exp: number };
const mem = new Map<string, StoreItem>();

export function rateLimit({ windowMs = 60_000, max = 30 }: { windowMs?: number; max?: number }) {
  return (key: string) => {
    const now = Date.now();
    const item = mem.get(key);
    if (!item || item.exp < now) {
      mem.set(key, { count: 1, exp: now + windowMs });
      return { allowed: true, remaining: max - 1 };
    }
    if (item.count >= max) {
      return { allowed: false, remaining: 0 };
    }
    item.count += 1;
    mem.set(key, item);
    return { allowed: true, remaining: max - item.count };
  };
}
