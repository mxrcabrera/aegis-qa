/**
 * CacheManager - Domain and File Analysis Caching
 *
 * Purpose: Cache domain analysis and file results to avoid redundant processing,
 * improving performance and reducing resource consumption.
 *
 * Architecture: This manager provides hash-based caching with automatic invalidation
 * when source files or schemas change, ensuring cache consistency.
 *
 * Cache Types:
 * - Domain analysis: Invalidates if schema changes
 * - File analysis: Hash-based, invalidates if file changes
 * - Thermal history: Historical thermal data for pattern analysis
 *
 * @module core/cache-manager
 * @since 1.0.0
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

/**
 * Cache entry metadata
 */
interface CacheEntry<T> {
  /** Cached data */
  data: T;
  /** Hash of source content for invalidation */
  contentHash: string;
  /** Timestamp when cache was created */
  createdAt: number;
  /** Timestamp when cache was last accessed */
  lastAccessedAt: number;
  /** Number of times cache was accessed */
  accessCount: number;
}

/**
 * Domain analysis cache entry
 */
interface DomainAnalysisCacheEntry extends CacheEntry<unknown> {
  /** Schema hash for invalidation */
  schemaHash: string;
  /** Domain name */
  domainName: string;
}

/**
 * File analysis cache entry
 */
interface FileAnalysisCacheEntry extends CacheEntry<unknown> {
  /** File path */
  filePath: string;
  /** File size in bytes */
  fileSize: number;
}

/**
 * CacheManager configuration
 */
interface CacheManagerConfig {
  /** Directory for cache storage */
  cacheDir: string;
  /** Maximum cache age in milliseconds (default: 24 hours) */
  maxCacheAgeMs: number;
  /** Maximum cache size in MB (default: 100MB) */
  maxCacheSizeMB: number;
  /** Whether to enable cache */
  enabled: boolean;
}

/**
 * CacheManager - Domain and file analysis caching
 *
 * This class provides hash-based caching with automatic invalidation when
 * source files or schemas change, ensuring cache consistency while improving
 * performance.
 *
 * @class CacheManager
 * @example
 * ```typescript
 * const cache = new CacheManager({ cacheDir: '.aegis/cache' });
 * await cache.initialize();
 * 
 * // Cache file analysis
 * const fileHash = cache.calculateFileHash('src/index.ts');
 * await cache.setFileAnalysis('src/index.ts', { findings: [...] }, fileHash);
 * const cached = await cache.getFileAnalysis('src/index.ts', fileHash);
 * 
 * // Cache domain analysis
 * await cache.setDomainAnalysis('user-domain', { entities: [...] }, schemaHash);
 * const domain = await cache.getDomainAnalysis('user-domain', schemaHash);
 * ```
 */
export class CacheManager {
  private config: CacheManagerConfig;
  private domainCache: Map<string, DomainAnalysisCacheEntry> = new Map();
  private fileCache: Map<string, FileAnalysisCacheEntry> = new Map();
  private thermalCache: Map<string, CacheEntry<unknown>> = new Map();

  constructor(config?: Partial<CacheManagerConfig>) {
    this.config = {
      cacheDir: '.aegis/cache',
      maxCacheAgeMs: 86400000, // 24 hours
      maxCacheSizeMB: 100,
      enabled: true,
      ...config,
    };
  }

  /**
   * Initializes cache manager
   *
   * Creates cache directory and loads existing cache from disk.
   *
   * @returns Promise<void>
   */
  async initialize(): Promise<void> {
    if (!this.config.enabled) {
      console.log('[CacheManager] Cache disabled');
      return;
    }

    // Create cache directory if it doesn't exist
    if (!fs.existsSync(this.config.cacheDir)) {
      fs.mkdirSync(this.config.cacheDir, { recursive: true });
    }

    // Load existing cache from disk
    await this.loadCache();

    console.log('[CacheManager] Cache initialized');
  }

  /**
   * Calculates SHA-256 hash of file content
   *
   * @param filePath - Path to file
   * @returns Promise<string> - Hash of file content
   */
  async calculateFileHash(filePath: string): Promise<string> {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const hash = crypto.createHash('sha256').update(content).digest('hex');
      return hash;
    } catch (error) {
      console.warn(`Failed to calculate hash for ${filePath}:`, error instanceof Error ? error.message : error);
      return '';
    }
  }

  /**
   * Caches file analysis results
   *
   * @param filePath - Path to file
   * @param data - Analysis results to cache
   * @param fileHash - Hash of file content for invalidation
   * @returns Promise<void>
   */
  async setFileAnalysis(filePath: string, data: unknown, fileHash: string): Promise<void> {
    if (!this.config.enabled) {
      return;
    }

    try {
      const stats = fs.statSync(filePath);
      const entry: FileAnalysisCacheEntry = {
        data,
        contentHash: fileHash,
        createdAt: Date.now(),
        lastAccessedAt: Date.now(),
        accessCount: 1,
        filePath,
        fileSize: stats.size,
      };

      const cacheKey = this.getFileCacheKey(filePath);
      this.fileCache.set(cacheKey, entry);

      await this.saveCache();
    } catch (error) {
      console.warn(`Failed to cache file analysis for ${filePath}:`, error instanceof Error ? error.message : error);
    }
  }

  /**
   * Gets cached file analysis results
   *
   * @param filePath - Path to file
   * @param currentFileHash - Current hash of file content for validation
   * @returns Promise<any | null> - Cached data or null if invalid/missing
   */
  async getFileAnalysis(filePath: string, currentFileHash: string): Promise<unknown | null> {
    if (!this.config.enabled) {
      return null;
    }

    const cacheKey = this.getFileCacheKey(filePath);
    const entry = this.fileCache.get(cacheKey);

    if (!entry) {
      return null;
    }

    // Validate hash
    if (entry.contentHash !== currentFileHash) {
      // File changed, invalidate cache
      this.fileCache.delete(cacheKey);
      return null;
    }

    // Check age
    const age = Date.now() - entry.createdAt;
    if (age > this.config.maxCacheAgeMs) {
      this.fileCache.delete(cacheKey);
      return null;
    }

    // Update access stats
    entry.lastAccessedAt = Date.now();
    entry.accessCount++;

    return entry.data;
  }

  /**
   * Caches domain analysis results
   *
   * @param domainName - Name of domain
   * @param data - Domain analysis results
   * @param schemaHash - Hash of schema for invalidation
   * @returns Promise<void>
   */
  async setDomainAnalysis(domainName: string, data: unknown, schemaHash: string): Promise<void> {
    if (!this.config.enabled) {
      return;
    }

    try {
      const entry: DomainAnalysisCacheEntry = {
        data,
        contentHash: schemaHash,
        createdAt: Date.now(),
        lastAccessedAt: Date.now(),
        accessCount: 1,
        schemaHash,
        domainName,
      };

      const cacheKey = this.getDomainCacheKey(domainName);
      this.domainCache.set(cacheKey, entry);

      await this.saveCache();
    } catch (error) {
      console.warn(`Failed to cache domain analysis for ${domainName}:`, error instanceof Error ? error.message : error);
    }
  }

  /**
   * Gets cached domain analysis results
   *
   * @param domainName - Name of domain
   * @param currentSchemaHash - Current schema hash for validation
   * @returns Promise<any | null> - Cached data or null if invalid/missing
   */
  async getDomainAnalysis(domainName: string, currentSchemaHash: string): Promise<unknown | null> {
    if (!this.config.enabled) {
      return null;
    }

    const cacheKey = this.getDomainCacheKey(domainName);
    const entry = this.domainCache.get(cacheKey);

    if (!entry) {
      return null;
    }

    // Validate schema hash
    if (entry.schemaHash !== currentSchemaHash) {
      // Schema changed, invalidate cache
      this.domainCache.delete(cacheKey);
      return null;
    }

    // Check age
    const age = Date.now() - entry.createdAt;
    if (age > this.config.maxCacheAgeMs) {
      this.domainCache.delete(cacheKey);
      return null;
    }

    // Update access stats
    entry.lastAccessedAt = Date.now();
    entry.accessCount++;

    return entry.data;
  }

  /**
   * Caches thermal data
   *
   * @param key - Cache key
   * @param data - Thermal data to cache
   * @returns Promise<void>
   */
  async setThermalData(key: string, data: unknown): Promise<void> {
    if (!this.config.enabled) {
      return;
    }

    try {
      const entry: CacheEntry<unknown> = {
        data,
        contentHash: crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex'),
        createdAt: Date.now(),
        lastAccessedAt: Date.now(),
        accessCount: 1,
      };

      this.thermalCache.set(key, entry);
      await this.saveCache();
    } catch (error) {
      console.warn(`Failed to cache thermal data for ${key}:`, error instanceof Error ? error.message : error);
    }
  }

  /**
   * Gets cached thermal data
   *
   * @param key - Cache key
   * @returns Promise<any | null> - Cached data or null if missing
   */
  async getThermalData(key: string): Promise<unknown | null> {
    if (!this.config.enabled) {
      return null;
    }

    const entry = this.thermalCache.get(key);

    if (!entry) {
      return null;
    }

    // Check age
    const age = Date.now() - entry.createdAt;
    if (age > this.config.maxCacheAgeMs) {
      this.thermalCache.delete(key);
      return null;
    }

    // Update access stats
    entry.lastAccessedAt = Date.now();
    entry.accessCount++;

    return entry.data;
  }

  /**
   * Invalidates cache for a specific file
   *
   * @param filePath - Path to file to invalidate
   * @returns Promise<void>
   */
  async invalidateFile(filePath: string): Promise<void> {
    const cacheKey = this.getFileCacheKey(filePath);
    this.fileCache.delete(cacheKey);
    await this.saveCache();
  }

  /**
   * Invalidates cache for a specific domain
   *
   * @param domainName - Name of domain to invalidate
   * @returns Promise<void>
   */
  async invalidateDomain(domainName: string): Promise<void> {
    const cacheKey = this.getDomainCacheKey(domainName);
    this.domainCache.delete(cacheKey);
    await this.saveCache();
  }

  /**
   * Clears all cache entries
   *
   * @returns Promise<void>
   */
  async clearAll(): Promise<void> {
    this.domainCache.clear();
    this.fileCache.clear();
    this.thermalCache.clear();
    await this.saveCache();
    console.log('[CacheManager] All cache cleared');
  }

  /**
   * Gets cache statistics
   *
   * @returns Object with cache statistics
   */
  getStats() {
    return {
      domainEntries: this.domainCache.size,
      fileEntries: this.fileCache.size,
      thermalEntries: this.thermalCache.size,
      totalEntries: this.domainCache.size + this.fileCache.size + this.thermalCache.size,
      enabled: this.config.enabled,
    };
  }

  /**
   * Saves cache to disk
   *
   * @private
   * @returns Promise<void>
   */
  private async saveCache(): Promise<void> {
    try {
      const cacheData = {
        domain: Array.from(this.domainCache.entries()),
        file: Array.from(this.fileCache.entries()),
        thermal: Array.from(this.thermalCache.entries()),
      };

      const cacheFilePath = this.getCacheFilePath();
      const content = JSON.stringify(cacheData, null, 2);
      fs.writeFileSync(cacheFilePath, content, 'utf-8');
    } catch (error) {
      console.error('Failed to save cache:', error instanceof Error ? error.message : error);
    }
  }

  /**
   * Loads cache from disk
   *
   * @private
   * @returns Promise<void>
   */
  private async loadCache(): Promise<void> {
    try {
      const cacheFilePath = this.getCacheFilePath();
      if (!fs.existsSync(cacheFilePath)) {
        return;
      }

      const content = fs.readFileSync(cacheFilePath, 'utf-8');
      const cacheData = JSON.parse(content);

      this.domainCache = new Map(cacheData.domain || []);
      this.fileCache = new Map(cacheData.file || []);
      this.thermalCache = new Map(cacheData.thermal || []);

      console.log(`[CacheManager] Loaded cache: ${this.domainCache.size} domain, ${this.fileCache.size} file, ${this.thermalCache.size} thermal entries`);
    } catch (error) {
      console.warn('Failed to load cache:', error instanceof Error ? error.message : error);
    }
  }

  /**
   * Gets file cache key
   *
   * @private
   * @param filePath - Path to file
   * @returns string - Cache key
   */
  private getFileCacheKey(filePath: string): string {
    return `file:${filePath}`;
  }

  /**
   * Gets domain cache key
   *
   * @private
   * @param domainName - Name of domain
   * @returns string - Cache key
   */
  private getDomainCacheKey(domainName: string): string {
    return `domain:${domainName}`;
  }

  /**
   * Gets cache file path
   *
   * @private
   * @returns string - Path to cache file
   */
  private getCacheFilePath(): string {
    return path.join(this.config.cacheDir, 'cache.json');
  }

  /**
   * Gets current configuration
   *
   * @returns CacheManagerConfig - Current configuration
   */
  getConfig(): CacheManagerConfig {
    return { ...this.config };
  }

  /**
   * Updates configuration
   *
   * @param config - Partial configuration to update
   */
  updateConfig(config: Partial<CacheManagerConfig>): void {
    this.config = {
      ...this.config,
      ...config,
    };
  }
}
