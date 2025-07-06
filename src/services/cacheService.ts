import type { AdvancedSentimentResult } from './advancedNLP';

export interface CachedLyrics {
  trackId: string;
  trackName: string;
  artist: string;
  lyrics: string;
  geniusUrl?: string;
  timestamp: number;
  source: 'genius' | 'mock' | 'cache';
}

export interface CachedSentiment {
  trackId: string;
  sentiment: AdvancedSentimentResult;
  timestamp: number;
  version: string; // For cache invalidation when algorithm changes
}

export interface CacheStats {
  lyricsCount: number;
  sentimentCount: number;
  totalSize: number;
  oldestEntry: number;
  newestEntry: number;
  hitRate: number;
  missRate: number;
}

class CacheService {
  private readonly LYRICS_KEY = 'vibelines_lyrics_cache';
  private readonly SENTIMENT_KEY = 'vibelines_sentiment_cache';
  private readonly STATS_KEY = 'vibelines_cache_stats';
  private readonly VERSION = '1.0.0';
  private readonly MAX_CACHE_SIZE = 50 * 1024 * 1024; // 50MB
  private readonly MAX_ENTRIES = 10000;
  private readonly CACHE_EXPIRY = 30 * 24 * 60 * 60 * 1000; // 30 days

  private stats = {
    hits: 0,
    misses: 0,
    totalRequests: 0
  };

  constructor() {
    this.loadStats();
    this.cleanupExpiredEntries();
  }

  // Lyrics caching
  async cacheLyrics(trackId: string, trackName: string, artist: string, lyrics: string, geniusUrl?: string, source: 'genius' | 'mock' | 'cache' = 'mock'): Promise<void> {
    try {
      const cache = this.getLyricsCache();
      const entry: CachedLyrics = {
        trackId,
        trackName,
        artist,
        lyrics,
        geniusUrl,
        timestamp: Date.now(),
        source
      };

      cache[trackId] = entry;
      
      // Check cache size and cleanup if necessary
      await this.enforceStorageLimits(cache);
      
      localStorage.setItem(this.LYRICS_KEY, JSON.stringify(cache));
    } catch (error) {
      console.warn('Failed to cache lyrics:', error);
    }
  }

  getCachedLyrics(trackId: string): CachedLyrics | null {
    try {
      const cache = this.getLyricsCache();
      const entry = cache[trackId];
      
      if (!entry) {
        this.recordMiss();
        return null;
      }

      // Check if entry is expired
      if (Date.now() - entry.timestamp > this.CACHE_EXPIRY) {
        delete cache[trackId];
        localStorage.setItem(this.LYRICS_KEY, JSON.stringify(cache));
        this.recordMiss();
        return null;
      }

      this.recordHit();
      return entry;
    } catch (error) {
      console.warn('Failed to get cached lyrics:', error);
      this.recordMiss();
      return null;
    }
  }

  // Sentiment caching
  async cacheSentiment(trackId: string, sentiment: AdvancedSentimentResult): Promise<void> {
    try {
      const cache = this.getSentimentCache();
      const entry: CachedSentiment = {
        trackId,
        sentiment,
        timestamp: Date.now(),
        version: this.VERSION
      };

      cache[trackId] = entry;
      
      // Check cache size and cleanup if necessary
      await this.enforceStorageLimits(cache);
      
      localStorage.setItem(this.SENTIMENT_KEY, JSON.stringify(cache));
    } catch (error) {
      console.warn('Failed to cache sentiment:', error);
    }
  }

  getCachedSentiment(trackId: string): AdvancedSentimentResult | null {
    try {
      const cache = this.getSentimentCache();
      const entry = cache[trackId];
      
      if (!entry) {
        this.recordMiss();
        return null;
      }

      // Check if entry is expired or version mismatch
      if (Date.now() - entry.timestamp > this.CACHE_EXPIRY || entry.version !== this.VERSION) {
        delete cache[trackId];
        localStorage.setItem(this.SENTIMENT_KEY, JSON.stringify(cache));
        this.recordMiss();
        return null;
      }

      this.recordHit();
      return entry.sentiment;
    } catch (error) {
      console.warn('Failed to get cached sentiment:', error);
      this.recordMiss();
      return null;
    }
  }

  // Cache management
  private getLyricsCache(): Record<string, CachedLyrics> {
    try {
      const cached = localStorage.getItem(this.LYRICS_KEY);
      return cached ? JSON.parse(cached) : {};
    } catch (error) {
      console.warn('Failed to parse lyrics cache:', error);
      return {};
    }
  }

  private getSentimentCache(): Record<string, CachedSentiment> {
    try {
      const cached = localStorage.getItem(this.SENTIMENT_KEY);
      return cached ? JSON.parse(cached) : {};
    } catch (error) {
      console.warn('Failed to parse sentiment cache:', error);
      return {};
    }
  }

  private async enforceStorageLimits(cache: Record<string, any>): Promise<void> {
    const entries = Object.values(cache);
    
    // Remove entries if we exceed max count
    if (entries.length > this.MAX_ENTRIES) {
      const sortedEntries = entries.sort((a, b) => a.timestamp - b.timestamp);
      const toRemove = sortedEntries.slice(0, entries.length - this.MAX_ENTRIES);
      
      toRemove.forEach(entry => {
        delete cache[entry.trackId];
      });
    }

    // Check storage size
    const cacheSize = new Blob([JSON.stringify(cache)]).size;
    if (cacheSize > this.MAX_CACHE_SIZE) {
      await this.cleanupOldEntries(cache, 0.3); // Remove 30% of oldest entries
    }
  }

  private async cleanupOldEntries(cache: Record<string, any>, percentage: number): Promise<void> {
    const entries = Object.values(cache);
    const sortedEntries = entries.sort((a, b) => a.timestamp - b.timestamp);
    const toRemove = sortedEntries.slice(0, Math.floor(entries.length * percentage));
    
    toRemove.forEach(entry => {
      delete cache[entry.trackId];
    });
  }

  private cleanupExpiredEntries(): void {
    try {
      const now = Date.now();
      
      // Cleanup lyrics cache
      const lyricsCache = this.getLyricsCache();
      let lyricsChanged = false;
      Object.keys(lyricsCache).forEach(trackId => {
        if (now - lyricsCache[trackId].timestamp > this.CACHE_EXPIRY) {
          delete lyricsCache[trackId];
          lyricsChanged = true;
        }
      });
      if (lyricsChanged) {
        localStorage.setItem(this.LYRICS_KEY, JSON.stringify(lyricsCache));
      }

      // Cleanup sentiment cache
      const sentimentCache = this.getSentimentCache();
      let sentimentChanged = false;
      Object.keys(sentimentCache).forEach(trackId => {
        if (now - sentimentCache[trackId].timestamp > this.CACHE_EXPIRY || 
            sentimentCache[trackId].version !== this.VERSION) {
          delete sentimentCache[trackId];
          sentimentChanged = true;
        }
      });
      if (sentimentChanged) {
        localStorage.setItem(this.SENTIMENT_KEY, JSON.stringify(sentimentCache));
      }
    } catch (error) {
      console.warn('Failed to cleanup expired entries:', error);
    }
  }

  // Statistics
  private recordHit(): void {
    this.stats.hits++;
    this.stats.totalRequests++;
    this.saveStats();
  }

  private recordMiss(): void {
    this.stats.misses++;
    this.stats.totalRequests++;
    this.saveStats();
  }

  private loadStats(): void {
    try {
      const saved = localStorage.getItem(this.STATS_KEY);
      if (saved) {
        this.stats = { ...this.stats, ...JSON.parse(saved) };
      }
    } catch (error) {
      console.warn('Failed to load cache stats:', error);
    }
  }

  private saveStats(): void {
    try {
      localStorage.setItem(this.STATS_KEY, JSON.stringify(this.stats));
    } catch (error) {
      console.warn('Failed to save cache stats:', error);
    }
  }

  getCacheStats(): CacheStats {
    const lyricsCache = this.getLyricsCache();
    const sentimentCache = this.getSentimentCache();
    
    const lyricsEntries = Object.values(lyricsCache);
    const sentimentEntries = Object.values(sentimentCache);
    
    const allTimestamps = [
      ...lyricsEntries.map(e => e.timestamp),
      ...sentimentEntries.map(e => e.timestamp)
    ];

    const totalSize = new Blob([
      JSON.stringify(lyricsCache),
      JSON.stringify(sentimentCache)
    ]).size;

    return {
      lyricsCount: lyricsEntries.length,
      sentimentCount: sentimentEntries.length,
      totalSize,
      oldestEntry: allTimestamps.length > 0 ? Math.min(...allTimestamps) : 0,
      newestEntry: allTimestamps.length > 0 ? Math.max(...allTimestamps) : 0,
      hitRate: this.stats.totalRequests > 0 ? this.stats.hits / this.stats.totalRequests : 0,
      missRate: this.stats.totalRequests > 0 ? this.stats.misses / this.stats.totalRequests : 0
    };
  }

  clearCache(): void {
    try {
      localStorage.removeItem(this.LYRICS_KEY);
      localStorage.removeItem(this.SENTIMENT_KEY);
      localStorage.removeItem(this.STATS_KEY);
      this.stats = { hits: 0, misses: 0, totalRequests: 0 };
    } catch (error) {
      console.warn('Failed to clear cache:', error);
    }
  }

  // Export/Import for backup
  exportCache(): string {
    return JSON.stringify({
      lyrics: this.getLyricsCache(),
      sentiment: this.getSentimentCache(),
      stats: this.stats,
      version: this.VERSION,
      exportDate: new Date().toISOString()
    });
  }

  importCache(data: string): boolean {
    try {
      const parsed = JSON.parse(data);
      
      if (parsed.lyrics) {
        localStorage.setItem(this.LYRICS_KEY, JSON.stringify(parsed.lyrics));
      }
      
      if (parsed.sentiment) {
        localStorage.setItem(this.SENTIMENT_KEY, JSON.stringify(parsed.sentiment));
      }
      
      if (parsed.stats) {
        this.stats = parsed.stats;
        this.saveStats();
      }
      
      return true;
    } catch (error) {
      console.error('Failed to import cache:', error);
      return false;
    }
  }

  // Check storage availability and quota
  async getStorageInfo(): Promise<{
    available: boolean;
    quota?: number;
    usage?: number;
    percentage?: number;
  }> {
    try {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        return {
          available: true,
          quota: estimate.quota,
          usage: estimate.usage,
          percentage: estimate.quota ? (estimate.usage! / estimate.quota) * 100 : 0
        };
      }
      
      return { available: true }; // Basic localStorage available
    } catch (error) {
      return { available: false };
    }
  }
}

// Singleton instance
export const cacheService = new CacheService();

