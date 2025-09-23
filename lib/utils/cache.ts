// Simple cache for search results
export class SimpleCache<T> {
  private cache: Map<string, { data: T; expiresAt: number }> = new Map();
  private maxSize: number;
  private ttl: number;

  constructor(maxSize: number = 100, ttl: number = 300000) { // 5 minutes
    this.maxSize = maxSize;
    this.ttl = ttl;
  }

  private generateKey(data: any): string {
    return typeof data === 'string' ? data : JSON.stringify(data);
  }

  set(key: string | any, value: T): void {
    const cacheKey = typeof key === 'string' ? key : this.generateKey(key);

    // If cache is full, remove first entry
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(cacheKey, {
      data: value,
      expiresAt: Date.now() + this.ttl,
    });
  }

  get(key: string | any): T | null {
    const cacheKey = typeof key === 'string' ? key : this.generateKey(key);
    const entry = this.cache.get(cacheKey);

    if (!entry || Date.now() > entry.expiresAt) {
      this.cache.delete(cacheKey);
      return null;
    }

    return entry.data;
  }

  clear(): void {
    this.cache.clear();
  }
}

// Simple global cache instances
export const searchCache = new SimpleCache<any>(50, 300000); // 5 minutes