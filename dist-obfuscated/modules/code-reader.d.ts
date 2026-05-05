/**
 * CodeReader - Route and File Analysis Module
 *
 * Purpose: Analyzes Next.js App Router structure, detects routes, server actions,
 * and marks files according to critical business paths from DomainMap.
 *
 * Features:
 * - Scans app directory for Next.js App Router files
 * - Detects Server Actions by "use server" directive
 * - Marks files based on CriticalPath from DomainMap
 * - Hardware protection via ThermalController before processing batches
 * - Type-safe results using Aegis QA audit types
 *
 * @module modules/code-reader
 * @since 1.0.0
 */
import type { RouteAnalysisResult, FileMetadata } from '../types/audit.js';
import type { DomainMap } from '../types/domain.js';
import type { ThermalController } from '../core/thermal-controller.js';
/**
 * Route file type classification
 */
export type RouteFileType = 'page' | 'layout' | 'route' | 'loading' | 'error' | 'not-found' | 'server-action';
/**
 * Route node in the app directory
 */
export interface RouteNode {
    /** Route path (e.g., /dashboard/users) */
    path: string;
    /** Type of route file */
    type: RouteFileType;
    /** Absolute file path */
    filePath: string;
    /** File metadata with critical path information */
    metadata: FileMetadata;
    /** Server actions in this file (if any) */
    serverActions?: string[];
    /** Whether this file has server actions */
    hasServerAction: boolean;
    /** Associated critical path (if any) */
    criticalPath?: string;
}
/**
 * CodeReader configuration
 */
export interface CodeReaderConfig {
    /** Root directory of the project */
    projectRoot: string;
    /** App directory name (default: 'app') */
    appDir?: string;
    /** Domain map for critical path context */
    domainMap?: DomainMap;
    /** Thermal controller for hardware protection */
    thermalController?: ThermalController;
    /** Maximum files to process per batch (default: 50) */
    maxFilesPerBatch?: number;
    /** Cooldown between batches in ms (default: 5000) */
    batchCooldownMs?: number;
}
/**
 * CodeReader - Route and file analysis
 *
 * This class analyzes the Next.js App Router structure, detects routes and
 * server actions, and marks files according to critical business paths.
 *
 * @class CodeReader
 * @example
 * ```typescript
 * const reader = new CodeReader({
 *   projectRoot: '/path/to/project',
 *   domainMap: domainMap,
 *   thermalController: thermalController
 * });
 *
 * const result = await reader.analyze();
 * console.log(result.totalRoutes);
 * ```
 */
export declare class CodeReader {
    private config;
    private routeTree;
    private currentBatchSize;
    private originalBatchSize;
    private criticalPathsByDirectory;
    /**
     * Creates a new CodeReader instance
     *
     * @param config - Configuration for code reading
     */
    constructor(config: CodeReaderConfig);
    /**
     * Analyzes the project's app directory structure
     *
     * This method scans the app directory, detects all route files, identifies
     * server actions, and marks files according to critical paths from the
     * DomainMap. It uses the ThermalController to check temperature before
     * processing batches.
     *
     * @returns Promise<RouteAnalysisResult> - Route analysis results
     *
     * @example
     * ```typescript
     * const result = await reader.analyze();
     * console.log(`Found ${result.totalRoutes} routes`);
     * ```
     */
    analyze(): Promise<RouteAnalysisResult>;
    /**
     * Finds all route files in the app directory
     *
     * @private
     * @param appPath - Path to app directory
     * @returns Promise<string[][]> - Array of file batches
     */
    private findRouteFiles;
    /**
     * Processes a batch of files
     *
     * @private
     * @param files - Files to process
     * @param appPath - App directory path
     * @returns Promise<RouteNode[]> - Route nodes for processed files
     */
    private processBatch;
    /**
     * Detects the type of route file
     *
     * @private
     * @param fileName - File name
     * @returns RouteFileType - Type of route file
     */
    private detectFileType;
    /**
     * Converts directory path to Next.js route path
     *
     * @private
     * @param dirPath - Directory path relative to app
     * @returns string - Route path
     */
    private dirPathToRoutePath;
    /**
     * Detects server actions in a file
     *
     * @private
     * @param filePath - File path
     * @returns Promise<string[]> - Array of server action names
     */
    private detectServerActions;
    /**
     * Gets file metadata including critical path information
     *
     * @private
     * @param filePath - File path
     * @returns FileMetadata - File metadata
     */
    private getFileMetadata;
    /**
     * Counts lines in a file
     *
     * @private
     * @param filePath - File path
     * @returns number - Number of lines
     */
    private countLines;
    /**
     * Determines if a file belongs to a critical path
     *
     * This method uses the DomainMap to check if a file's route path
     * matches any of the defined critical paths (e.g., auth, booking, payment).
     *
     * @private
     * @param filePath - File path
     * @returns string | undefined - Critical path name if file is in critical path
     */
    private determineCriticalPath;
    /**
     * Stores critical path information for directory inheritance
     *
     * @private
     * @param filePath - File path of the page
     * @param criticalPath - Critical path name
     */
    private storeCriticalPathForInheritance;
    /**
     * Inherits criticality from local component imports
     *
     * Deep Path Tracking: If a page is in a critical path, all locally
     * imported components (in the same folder) should inherit that criticality.
     *
     * @private
     * @param filePath - File path
     * @returns string | undefined - Inherited critical path name
     */
    private inheritCriticalityFromLocalImports;
    /**
     * Applies inheritance to component files in a second pass
     *
     * This method ensures that component files inherit criticality from
     * pages in the same directory, even if they were processed before the page.
     *
     * @private
     * @param nodes - All route nodes
     * @returns RouteNode[] - Nodes with inheritance applied
     */
    private applyInheritanceToComponents;
    /**
     * Builds the analysis result from route nodes
     *
     * @private
     * @param nodes - Route nodes
     * @returns RouteAnalysisResult - Analysis result
     */
    private buildAnalysisResult;
    /**
     * Gets the route tree
     *
     * @returns RouteNode[] - Route tree nodes
     */
    getRouteTree(): RouteNode[];
    /**
     * Gets files in a specific critical path
     *
     * @param criticalPathName - Name of the critical path
     * @returns RouteNode[] - Files in the critical path
     */
    getFilesInCriticalPath(criticalPathName: string): RouteNode[];
    /**
     * Exports the route tree as JSON
     *
     * @returns string - JSON string of route tree
     */
    exportRouteTree(): string;
}
//# sourceMappingURL=code-reader.d.ts.map