interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export class CacheManager {
  private static instance: CacheManager;
  private cache = new Map<string, CacheEntry<any>>();
  private maxSize = 100;
  
  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  set<T>(key: string, data: T, ttlSeconds: number = 300): void {
    // Prüfe Cache-Größe
    if (this.cache.size >= this.maxSize) {
      this.evictOldest();
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlSeconds * 1000
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) return null;
    
    // Prüfe ob abgelaufen
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  // Statistiken
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Redis-ähnliche API für Browser
export class BrowserStorage {
  private static prefix = 'batmap_';
  
  static set(key: string, value: any, ttlSeconds?: number): void {
    const data = {
      value,
      timestamp: Date.now(),
      ttl: ttlSeconds ? ttlSeconds * 1000 : null
    };
    
    localStorage.setItem(this.prefix + key, JSON.stringify(data));
  }

  static get<T>(key: string): T | null {
    const item = localStorage.getItem(this.prefix + key);
    if (!item) return null;
    
    try {
      const data = JSON.parse(item);
      
      // Prüfe TTL
      if (data.ttl && Date.now() - data.timestamp > data.ttl) {
        localStorage.removeItem(this.prefix + key);
        return null;
      }
      
      return data.value;
    } catch {
      return null;
    }
  }

  static delete(key: string): void {
    localStorage.removeItem(this.prefix + key);
  }

  static clear(): void {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(this.prefix)) {
        localStorage.removeItem(key);
      }
    });
  }
}

// Query Cache für API-Anfragen
export class QueryCache {
  private static cache = CacheManager.getInstance();
  
  static async getCachedOrFetch<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttlSeconds: number = 300
  ): Promise<T> {
    // Prüfe Cache
    const cached = this.cache.get<T>(key);
    if (cached) return cached;
    
    // Fetche und cache
    const data = await fetchFn();
    this.cache.set(key, data, ttlSeconds);
    
    return data;
  }

  static invalidate(pattern: string): void {
    const stats = this.cache.getStats();
    stats.keys.forEach(key => {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    });
  }
}

// Hook für cached API calls
export function useCachedQuery<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttlSeconds: number = 300
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    QueryCache.getCachedOrFetch(key, fetchFn, ttlSeconds)
      .then(result => {
        setData(result);
        setError(null);
      })
      .catch(err => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [key]);

  return { data, loading, error };
}

// Background refresh für kritische Daten
export class BackgroundRefresh {
  private static intervals = new Map<string, NodeJS.Timeout>();
  
  static start(
    key: string,
    fetchFn: () => Promise<any>,
    intervalSeconds: number = 60
  ): void {
    const interval = setInterval(async () => {
      try {
        const data = await fetchFn();
        CacheManager.getInstance().set(key, data, intervalSeconds * 2);
      } catch (error) {
        console.error(`Background refresh failed for ${key}:`, error);
      }
    }, intervalSeconds * 1000);
    
    this.intervals.set(key, interval);
  }
  
  static stop(key: string): void {
    const interval = this.intervals.get(key);
    if (interval) {
      clearInterval(interval);
      this.intervals.delete(key);
    }
  }
  
  static stopAll(): void {
    this.intervals.forEach(interval => clearInterval(interval));
    this.intervals.clear();
  }
}

// Import für useState Hook
import { useState, useEffect } from 'react';