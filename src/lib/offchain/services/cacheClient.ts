// Upstash is optional; we avoid a hard import to keep the package optional in prod.
type Redis = any;

type CacheDriver = {
	get<T>(key: string): Promise<T | null>;
	set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;
};

class MemoryCache implements CacheDriver {
	private store = new Map<string, { v: unknown; exp?: number }>();
	async get<T>(key: string): Promise<T | null> {
		const hit = this.store.get(key);
		if (!hit) return null;
		if (hit.exp && hit.exp < Date.now()) {
			this.store.delete(key);
			return null;
		}
		return hit.v as T;
	}
	async set<T>(key: string, value: T, ttlSeconds?: number) {
		const exp = ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined;
		this.store.set(key, { v: value, exp });
	}
}

class UpstashCache implements CacheDriver {
	constructor(private redis: Redis) {}
	async get<T>(key: string): Promise<T | null> {
		try {
			const raw = await (this.redis as any).get(key);
			if (!raw) return null;
			return JSON.parse(raw) as T;
		} catch {
			return null;
		}
	}
	async set<T>(key: string, value: T, ttlSeconds?: number) {
		try {
			const payload = JSON.stringify(value);
			if (ttlSeconds && ttlSeconds > 0) await (this.redis as any).set(key, payload, { ex: ttlSeconds });
			else await (this.redis as any).set(key, payload);
		} catch {
			// no-op
		}
	}
}

let client: CacheDriver | null = null;

export function getCache(): CacheDriver {
	if (client) return client;
	const url = process.env.UPSTASH_REDIS_REST_URL;
	const token = process.env.UPSTASH_REDIS_REST_TOKEN;
		if (url && token) {
			try {
				// Avoid static require to keep '@upstash/redis' optional
				// eslint-disable-next-line no-new-func
				const req = Function('return require')() as (m: string) => any;
				const mod = req('@upstash/redis');
				const RedisCtor = (mod.Redis ?? mod.default) as any;
				client = new UpstashCache(new RedisCtor({ url, token }));
			} catch {
				client = new MemoryCache();
			}
	} else {
		client = new MemoryCache();
	}
	return client;
}

export async function cacheGet<T>(key: string): Promise<T | null> {
	return getCache().get<T>(key);
}

export async function cacheSet<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
	return getCache().set<T>(key, value, ttlSeconds);
}
