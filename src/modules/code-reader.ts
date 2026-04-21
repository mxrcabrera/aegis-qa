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

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';
import { filterValidPaths } from '../core/filesystem-safety.js';
import type {
  RouteAnalysisResult,
  FileMetadata,
} from '../types/audit.js';
import type { DomainMap } from '../types/domain.js';
import type { ThermalController } from '../core/thermal-controller.js';

/**
 * Route file type classification
 */
export type RouteFileType =
  | 'page'
  | 'layout'
  | 'route'
  | 'loading'
  | 'error'
  | 'not-found'
  | 'server-action';

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
export class CodeReader {
  private config: Required<Omit<CodeReaderConfig, 'domainMap' | 'thermalController'>> & {
    domainMap?: DomainMap;
    thermalController?: ThermalController;
  };
  private routeTree: RouteNode[] = [];
  private currentBatchSize: number;
  private originalBatchSize: number;
  private criticalPathsByDirectory: Map<string, string> = new Map();

  /**
   * Creates a new CodeReader instance
   *
   * @param config - Configuration for code reading
   */
  constructor(config: CodeReaderConfig) {
    const batchSize = config.maxFilesPerBatch || 50;
    this.config = {
      projectRoot: config.projectRoot,
      appDir: config.appDir || 'app',
      maxFilesPerBatch: batchSize,
      batchCooldownMs: config.batchCooldownMs || 5000,
      domainMap: config.domainMap,
      thermalController: config.thermalController,
    };
    this.currentBatchSize = batchSize;
    this.originalBatchSize = batchSize;
  }

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
  async analyze(): Promise<RouteAnalysisResult> {
    const appPath = path.join(this.config.projectRoot, this.config.appDir);

    if (!fs.existsSync(appPath)) {
      console.log(`[CodeReader] App directory not found: ${appPath}`);
      return {
        totalRoutes: 0,
        routesByType: {
          pages: 0,
          layouts: 0,
          routes: 0,
          loading: 0,
          error: 0,
          notFound: 0,
          serverActions: 0,
        },
        routes: [],
      };
    }

    // Check thermal status before processing
    if (this.config.thermalController) {
      const tempReading = await this.config.thermalController.checkTemperature();

      // Smart Throttling: Adjust batch size based on thermal status
      if (!tempReading.isSafe) {
        // Reduce batch size by half if not safe
        if (tempReading.category === 'warning' && this.currentBatchSize > this.originalBatchSize / 2) {
          this.currentBatchSize = Math.max(1, Math.floor(this.currentBatchSize / 2));
          console.warn(
            `[CodeReader] Thermal WARNING: Reducing batch size to ${this.currentBatchSize} (from ${this.originalBatchSize})`
          );
        } else if (tempReading.category === 'critical' && this.currentBatchSize > 1) {
          this.currentBatchSize = 1;
          console.warn('[CodeReader] Thermal CRITICAL: Reducing batch size to 1');
        }

        // Apply cooldown
        console.warn(`[CodeReader] GPU temperature ${tempReading.category} (${tempReading.current}°C), applying cooldown`);
        await this.config.thermalController.applyCooldown(this.config.batchCooldownMs);
      } else if (tempReading.category === 'safe' && this.currentBatchSize !== this.originalBatchSize) {
        // Restore original batch size if safe
        console.log(`[CodeReader] Thermal SAFE: Restoring batch size to ${this.originalBatchSize}`);
        this.currentBatchSize = this.originalBatchSize;
      }
    }

    // Find all route files
    const fileBatches = await this.findRouteFiles(appPath);

    // Process files in batches
    const allNodes: RouteNode[] = [];
    for (const batch of fileBatches) {
      const nodes = await this.processBatch(batch, appPath);
      allNodes.push(...nodes);

      // Check thermal status between batches and adjust if needed
      if (this.config.thermalController && batch !== fileBatches[fileBatches.length - 1]) {
        const tempReading = await this.config.thermalController.checkTemperature();

        // Smart Throttling between batches
        if (!tempReading.isSafe) {
          if (tempReading.category === 'warning' && this.currentBatchSize > this.originalBatchSize / 2) {
            this.currentBatchSize = Math.max(1, Math.floor(this.currentBatchSize / 2));
            console.warn(
              `[CodeReader] Thermal WARNING between batches: Reducing batch size to ${this.currentBatchSize}`
            );
          } else if (tempReading.category === 'critical' && this.currentBatchSize > 1) {
            this.currentBatchSize = 1;
            console.warn('[CodeReader] Thermal CRITICAL between batches: Reducing batch size to 1');
          }
        } else if (tempReading.category === 'safe' && this.currentBatchSize !== this.originalBatchSize) {
          console.log(`[CodeReader] Thermal SAFE between batches: Restoring batch size to ${this.originalBatchSize}`);
          this.currentBatchSize = this.originalBatchSize;
        }

        await this.config.thermalController.applyCooldown(this.config.batchCooldownMs);
      }
    }

    // Second pass: Apply inheritance to component files
    const nodesWithInheritance = this.applyInheritanceToComponents(allNodes);

    this.routeTree = nodesWithInheritance;

    // Build result
    const result = this.buildAnalysisResult(nodesWithInheritance);

    return result;
  }

  /**
   * Finds all route files in the app directory
   *
   * @private
   * @param appPath - Path to app directory
   * @returns Promise<string[][]> - Array of file batches
   */
  private async findRouteFiles(appPath: string): Promise<string[][]> {
    const patterns = [
      '**/page.tsx',
      '**/page.ts',
      '**/layout.tsx',
      '**/layout.ts',
      '**/route.ts',
      '**/route.tsx',
      '**/loading.tsx',
      '**/error.tsx',
      '**/not-found.tsx',
    ];

    const allFiles: string[] = [];
    for (const pattern of patterns) {
      const files = await glob(pattern, { cwd: appPath });
      allFiles.push(...files);
    }

    // Symlink Protection: Filter out invalid paths
    const safeFiles = filterValidPaths(allFiles, this.config.projectRoot);

    // Split into batches using currentBatchSize (for Smart Throttling)
    const batches: string[][] = [];
    const batchSize = this.currentBatchSize;

    for (let i = 0; i < safeFiles.length; i += batchSize) {
      batches.push(safeFiles.slice(i, i + batchSize));
    }

    return batches;
  }

  /**
   * Processes a batch of files
   *
   * @private
   * @param files - Files to process
   * @param appPath - App directory path
   * @returns Promise<RouteNode[]> - Route nodes for processed files
   */
  private async processBatch(files: string[], appPath: string): Promise<RouteNode[]> {
    const nodes: RouteNode[] = [];

    for (const file of files) {
      const fullPath = path.join(appPath, file);
      const fileType = this.detectFileType(file);
      const routePath = this.dirPathToRoutePath(path.dirname(file));

      // Detect server actions
      const serverActions = await this.detectServerActions(fullPath);

      // Get file metadata
      const metadata = this.getFileMetadata(fullPath);

      // Determine critical path
      const criticalPath = this.determineCriticalPath(fullPath);

      // Update metadata critical path info
      if (criticalPath) {
        metadata.inCriticalPath = true;
        metadata.criticalPathName = criticalPath;
      }

      // Deep Path Tracking: If this is a page in a critical path, store it for component inheritance
      let inheritedCriticalPath = criticalPath;
      if (criticalPath && fileType === 'page') {
        // Store this page's critical path for local component inheritance
        this.storeCriticalPathForInheritance(fullPath, criticalPath);
      } else if (!criticalPath) {
        // If not in critical path, check if it should inherit from a local page
        inheritedCriticalPath = this.inheritCriticalityFromLocalImports(fullPath);
      }

      const node: RouteNode = {
        path: routePath,
        type: fileType,
        filePath: fullPath,
        metadata,
        serverActions,
        hasServerAction: serverActions.length > 0,
        criticalPath: inheritedCriticalPath || criticalPath,
      };

      nodes.push(node);
    }

    return nodes;
  }

  /**
   * Detects the type of route file
   *
   * @private
   * @param fileName - File name
   * @returns RouteFileType - Type of route file
   */
  private detectFileType(fileName: string): RouteFileType {
    const baseName = path.basename(fileName, path.extname(fileName));

    switch (baseName) {
      case 'page':
        return 'page';
      case 'layout':
        return 'layout';
      case 'route':
        return 'route';
      case 'loading':
        return 'loading';
      case 'error':
        return 'error';
      case 'not-found':
        return 'not-found';
      default:
        return 'page'; // Default to page
    }
  }

  /**
   * Converts directory path to Next.js route path
   *
   * @private
   * @param dirPath - Directory path relative to app
   * @returns string - Route path
   */
  private dirPathToRoutePath(dirPath: string): string {
    if (dirPath === '.' || dirPath === '') return '/';
    return '/' + dirPath.replace(/\\/g, '/');
  }

  /**
   * Detects server actions in a file
   *
   * @private
   * @param filePath - File path
   * @returns Promise<string[]> - Array of server action names
   */
  private async detectServerActions(filePath: string): Promise<string[]> {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');
      const actions: string[] = [];
      let inServerAction = false;

      for (const line of lines) {
        // Detect "use server" directive
        if (line.includes('use server')) {
          inServerAction = true;
        }

        // Detect exported functions
        if (inServerAction && line.match(/export\s+(async\s+)?function/)) {
          const match = line.match(/export\s+(?:async\s+)?function\s+(\w+)/);
          if (match) {
            actions.push(match[1]);
          }
        }

        // Detect exported arrow functions
        if (inServerAction && line.match(/export\s+(?:async\s+)?const\s+(\w+)\s*=/)) {
          const match = line.match(/export\s+(?:async\s+)?const\s+(\w+)\s*=/);
          if (match) {
            actions.push(match[1]);
          }
        }

        // Detect end of function
        if (inServerAction && line.match(/^}$/)) {
          inServerAction = false;
        }
      }

      return actions;
    } catch (error) {
      console.warn(`[CodeReader] Failed to read file: ${filePath}`);
      return [];
    }
  }

  /**
   * Gets file metadata including critical path information
   *
   * @private
   * @param filePath - File path
   * @returns FileMetadata - File metadata
   */
  private getFileMetadata(filePath: string): FileMetadata {
    const stats = fs.statSync(filePath);
    const extension = path.extname(filePath);

    return {
      path: path.relative(this.config.projectRoot, filePath),
      extension,
      lineCount: this.countLines(filePath),
      inCriticalPath: false, // Will be updated by determineCriticalPath
      criticalPathName: undefined,
      lastModified: stats.mtime,
    };
  }

  /**
   * Counts lines in a file
   *
   * @private
   * @param filePath - File path
   * @returns number - Number of lines
   */
  private countLines(filePath: string): number {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      return content.split('\n').length;
    } catch (error) {
      return 0;
    }
  }

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
  private determineCriticalPath(filePath: string): string | undefined {
    if (!this.config.domainMap || !this.config.domainMap.criticalPaths) {
      return undefined;
    }

    const fileName = path.basename(filePath, path.extname(filePath)).toLowerCase();
    // Normalize path to use forward slashes
    const normalizedPath = filePath.replace(/\\/g, '/');
    const dirName = path.dirname(normalizedPath).toLowerCase();
    const dirSegments = dirName.split('/');

    for (const criticalPath of this.config.domainMap.criticalPaths) {
      // Check if file path matches critical path entities
      for (const entity of criticalPath.entities) {
        const entityLower = entity.toLowerCase();
        // Match if the last directory segment exactly matches the entity
        const lastDirSegment = dirSegments[dirSegments.length - 1];
        if (lastDirSegment === entityLower || lastDirSegment === entityLower + 's') {
          return criticalPath.name;
        }
        // Also check if file name matches entity
        if (fileName === entityLower || fileName === entityLower + 's') {
          return criticalPath.name;
        }
      }

      // Check if file name matches critical path actions
      for (const action of criticalPath.actions) {
        const actionLower = action.toLowerCase();
        if (fileName.includes(actionLower)) {
          return criticalPath.name;
        }
      }
    }

    return undefined;
  }

  /**
   * Stores critical path information for directory inheritance
   *
   * @private
   * @param filePath - File path of the page
   * @param criticalPath - Critical path name
   */
  private storeCriticalPathForInheritance(filePath: string, criticalPath: string): void {
    const dirPath = path.dirname(filePath);
    this.criticalPathsByDirectory.set(dirPath, criticalPath);
  }

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
  private inheritCriticalityFromLocalImports(filePath: string): string | undefined {
    try {
      const fileDir = path.dirname(filePath);

      // Check if the directory has a critical path stored
      if (this.criticalPathsByDirectory.has(fileDir)) {
        return this.criticalPathsByDirectory.get(fileDir);
      }

      return undefined;
    } catch (error) {
      console.warn(`[CodeReader] Failed to analyze imports: ${filePath}`);
      return undefined;
    }
  }

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
  private applyInheritanceToComponents(nodes: RouteNode[]): RouteNode[] {
    return nodes.map((node) => {
      // If the node doesn't have a critical path, check if it should inherit one
      if (!node.criticalPath) {
        const inheritedPath = this.inheritCriticalityFromLocalImports(node.filePath);
        if (inheritedPath) {
          node.criticalPath = inheritedPath;
          node.metadata.inCriticalPath = true;
          node.metadata.criticalPathName = inheritedPath;
        }
      }
      return node;
    });
  }

  /**
   * Builds the analysis result from route nodes
   *
   * @private
   * @param nodes - Route nodes
   * @returns RouteAnalysisResult - Analysis result
   */
  private buildAnalysisResult(nodes: RouteNode[]): RouteAnalysisResult {
    const routes = nodes.map((node) => ({
      path: node.path,
      type: node.type,
      file: node.metadata.path,
    }));

    const routesByType = {
      pages: nodes.filter((n) => n.type === 'page').length,
      layouts: nodes.filter((n) => n.type === 'layout').length,
      routes: nodes.filter((n) => n.type === 'route').length,
      loading: nodes.filter((n) => n.type === 'loading').length,
      error: nodes.filter((n) => n.type === 'error').length,
      notFound: nodes.filter((n) => n.type === 'not-found').length,
      serverActions: nodes.filter((n) => n.hasServerAction).length,
    };

    return {
      totalRoutes: nodes.length,
      routesByType,
      routes,
    };
  }

  /**
   * Gets the route tree
   *
   * @returns RouteNode[] - Route tree nodes
   */
  getRouteTree(): RouteNode[] {
    return this.routeTree;
  }

  /**
   * Gets files in a specific critical path
   *
   * @param criticalPathName - Name of the critical path
   * @returns RouteNode[] - Files in the critical path
   */
  getFilesInCriticalPath(criticalPathName: string): RouteNode[] {
    return this.routeTree.filter((node) => node.criticalPath === criticalPathName);
  }

  /**
   * Exports the route tree as JSON
   *
   * @returns string - JSON string of route tree
   */
  exportRouteTree(): string {
    return JSON.stringify(this.routeTree, null, 2);
  }
}
