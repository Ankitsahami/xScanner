// In-memory cache implementation
interface CacheEntry<T> {
    data: T;
    expiry: number;
}

class InMemoryCache {
    private cache: Map<string, CacheEntry<unknown>> = new Map();

    set<T>(key: string, data: T, ttlMs: number): void {
        this.cache.set(key, {
            data,
            expiry: Date.now() + ttlMs,
        });
    }

    get<T>(key: string): T | null {
        const entry = this.cache.get(key);
        if (!entry) return null;

        if (Date.now() > entry.expiry) {
            this.cache.delete(key);
            return null;
        }

        return entry.data as T;
    }

    has(key: string): boolean {
        const entry = this.cache.get(key);
        if (!entry) return false;

        if (Date.now() > entry.expiry) {
            this.cache.delete(key);
            return false;
        }

        return true;
    }

    delete(key: string): void {
        this.cache.delete(key);
    }

    clear(): void {
        this.cache.clear();
    }

    // Clean up expired entries
    cleanup(): void {
        const now = Date.now();
        for (const [key, entry] of this.cache.entries()) {
            if (now > entry.expiry) {
                this.cache.delete(key);
            }
        }
    }
}

// Global cache instance
export const cache = new InMemoryCache();

// Cache keys
export const CACHE_KEYS = {
    PNODES: 'pnodes',
    NETWORK_STATS: 'network_stats',
    GEO_PREFIX: 'geo:',
    HISTORY: 'history',
} as const;

// TTL values in milliseconds
export const CACHE_TTL = {
    PNODES: 30 * 1000,           // 30 seconds
    NETWORK_STATS: 30 * 1000,    // 30 seconds
    GEO: 7 * 24 * 60 * 60 * 1000, // 7 days
    HISTORY: 5 * 60 * 1000,      // 5 minutes
} as const;
