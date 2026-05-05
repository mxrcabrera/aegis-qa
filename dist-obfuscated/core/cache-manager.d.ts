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
export declare class CacheManager {
    private config;
    private domainCache;
    private fileCache;
    private thermalCache;
    constructor(config?: Partial<CacheManagerConfig>);
    /**
     * Initializes cache manager
     *
     * Creates cache directory and loads existing cache from disk.
     *
     * @returns Promise<void>
     */
    initialize(): Promise<void>;
    /**
     * Calculates SHA-256 hash of file content
     *
     * @param filePath - Path to file
     * @returns Promise<string> - Hash of file content
     */
    calculateFileHash(filePath: string): Promise<string>;
    /**
     * Caches file analysis results
     *
     * @param filePath - Path to file
     * @param data - Analysis results to cache
     * @param fileHash - Hash of file content for invalidation
     * @returns Promise<void>
     */
    setFileAnalysis(filePath: string, data: unknown, fileHash: string): Promise<void>;
    /**
     * Gets cached file analysis results
     *
     * @param filePath - Path to file
     * @param currentFileHash - Current hash of file content for validation
     * @returns Promise<any | null> - Cached data or null if invalid/missing
     */
    getFileAnalysis(filePath: string, currentFileHash: string): Promise<unknown | null>;
    /**
     * Caches domain analysis results
     *
     * @param domainName - Name of domain
     * @param data - Domain analysis results
     * @param schemaHash - Hash of schema for invalidation
     * @returns Promise<void>
     */
    setDomainAnalysis(domainName: string, data: unknown, schemaHash: string): Promise<void>;
    /**
     * Gets cached domain analysis results
     *
     * @param domainName - Name of domain
     * @param currentSchemaHash - Current schema hash for validation
     * @returns Promise<any | null> - Cached data or null if invalid/missing
     */
    getDomainAnalysis(domainName: string, currentSchemaHash: string): Promise<unknown | null>;
    /**
     * Caches thermal data
     *
     * @param key - Cache key
     * @param data - Thermal data to cache
     * @returns Promise<void>
     */
    setThermalData(key: string, data: unknown): Promise<void>;
    /**
     * Gets cached thermal data
     *
     * @param key - Cache key
     * @returns Promise<any | null> - Cached data or null if missing
     */
    getThermalData(key: string): Promise<unknown | null>;
    /**
     * Invalidates cache for a specific file
     *
     * @param filePath - Path to file to invalidate
     * @returns Promise<void>
     */
    invalidateFile(filePath: string): Promise<void>;
    /**
     * Invalidates cache for a specific domain
     *
     * @param domainName - Name of domain to invalidate
     * @returns Promise<void>
     */
    invalidateDomain(domainName: string): Promise<void>;
    /**
     * Clears all cache entries
     *
     * @returns Promise<void>
     */
    clearAll(): Promise<void>;
    /**
     * Gets cache statistics
     *
     * @returns Object with cache statistics
     */
    getStats(): {
        domainEntries: number;
        fileEntries: number;
        thermalEntries: number;
        totalEntries: number;
        enabled: boolean;
    };
    /**
     * Saves cache to disk
     *
     * @private
     * @returns Promise<void>
     */
    private saveCache;
    /**
     * Loads cache from disk
     *
     * @private
     * @returns Promise<void>
     */
    private loadCache;
    /**
     * Gets file cache key
     *
     * @private
     * @param filePath - Path to file
     * @returns string - Cache key
     */
    private getFileCacheKey;
    /**
     * Gets domain cache key
     *
     * @private
     * @param domainName - Name of domain
     * @returns string - Cache key
     */
    private getDomainCacheKey;
    /**
     * Gets cache file path
     *
     * @private
     * @returns string - Path to cache file
     */
    private getCacheFilePath;
    /**
     * Gets current configuration
     *
     * @returns CacheManagerConfig - Current configuration
     */
    getConfig(): CacheManagerConfig;
    /**
     * Updates configuration
     *
     * @param config - Partial configuration to update
     */
    updateConfig(config: Partial<CacheManagerConfig>): void;
}
export {};
//# sourceMappingURL=cache-manager.d.ts.map