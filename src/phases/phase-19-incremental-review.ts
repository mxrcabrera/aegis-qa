/**
 * Phase 19: Incremental Review - Hash-Validation for Incremental Analysis
 *
 * Purpose: Optimize review by using SHA-256 hash validation to ignore
 * files without real changes, enabling efficient incremental analysis.
 *
 * Architecture:
 * - Hash Calculation: Calculate SHA-256 hashes for all files
 * - Change Detection: Compare current hashes with baseline
 * - Incremental Analysis: Only analyze changed files
 * - Cache Validation: Ensure cache integrity with hash checks
 *
 * @module phases/phase-19-incremental-review
 * @since 1.0.0
 */

import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { ThermalController } from '../core/thermal-controller.js';
import { StatePersistence, type ExecutionState } from '../core/state-persistence.js';
import { validatePath, sanitizeError, validateFileSize, censorSecrets } from '../core/security-utils.js';

/**
 * File hash info
 */
interface FileHashInfo {
  /** File path */
  filePath: string;
  /** SHA-256 hash */
  hash: string;
  /** Has changed since baseline */
  hasChanged: boolean;
  /** File size in bytes */
  size: number;
}

/**
 * Phase 19 configuration
 */
interface Phase19Config {
  /** Project root directory */
  projectRoot: string;
  /** Thermal controller for hardware protection */
  thermalController: ThermalController;
  /** State persistence for resume capability */
  statePersistence: StatePersistence;
  /** Current execution state */
  currentState: ExecutionState;
}

/**
 * Phase 19 result
 */
export interface Phase19Result {
  /** Overall success */
  success: boolean;
  /** Total files analyzed */
  totalFiles: number;
  /** Changed files */
  changedFiles: number;
  /** Unchanged files (skipped) */
  unchangedFiles: number;
  /** File hash info */
  fileHashInfo: FileHashInfo[];
  /** Execution time in milliseconds */
  executionTimeMs: number;
  /** Error if failed */
  error?: string;
}

/**
 * Phase 19: Incremental Review - Hash-Validation for Incremental Analysis
 *
 * This phase optimizes review by using SHA-256 hash validation to ignore
 * files without real changes, enabling efficient incremental analysis.
 *
 * @class Phase19IncrementalReview
 * @example
 * ```typescript
 * const incrementalReview = new Phase19IncrementalReview(config);
 * const result = await incrementalReview.execute();
 * console.log(`Changed files: ${result.changedFiles}`);
 * console.log(`Unchanged files (skipped): ${result.unchangedFiles}`);
 * ```
 */
export class Phase19IncrementalReview {
  private config: Phase19Config;

  constructor(config: Phase19Config) {
    // Validate projectRoot path to prevent path traversal
    if (!validatePath(config.projectRoot, config.projectRoot)) {
      throw new Error('Invalid project root path');
    }
    this.config = config;
  }

  /**
   * Executes Phase 19: Incremental Review
   *
   * @returns Promise<Phase19Result> - Incremental review result
   */
  async execute(): Promise<Phase19Result> {
    const startTime = Date.now();
    console.log('INFO Phase 19: Incremental Review - Hash-Validation for Incremental Analysis\n');

    try {
      // Thermal check before starting
      console.log('INFO Verifying system resources...');
      const resourceCheck = await this.config.thermalController.checkSystemResources();
      console.log(`INFO CPU Usage: ${resourceCheck.cpuUsage}%`);
      console.log(`INFO RAM Usage: ${resourceCheck.ramUsage}%`);
      console.log(`INFO RAM Available: ${resourceCheck.ramAvailable} GB\n`);

      if (!resourceCheck.isSafe) {
        throw new Error('System resources not safe for operation');
      }

      // Get source files
      console.log('INFO Finding source files...');
      const sourceFiles = this.getSourceFiles(this.config.projectRoot);
      console.log(`INFO Source files found: ${sourceFiles.length}\n`);

      // Load baseline hashes from state
      console.log('INFO Loading baseline hashes...');
      const baselineHashes = this.loadBaselineHashes();
      console.log(`INFO Baseline hashes loaded: ${Object.keys(baselineHashes).length}\n`);

      // Calculate current hashes
      console.log('INFO Calculating current file hashes...');
      const fileHashInfo = await this.calculateFileHashes(sourceFiles, baselineHashes);
      console.log(`INFO Hashes calculated: ${fileHashInfo.length}\n`);

      // Save new baseline
      console.log('INFO Saving new baseline hashes...');
      this.saveBaselineHashes(fileHashInfo);
      console.log(`INFO Baseline hashes saved\n`);

      // Calculate metrics
      const changedFiles = fileHashInfo.filter(f => f.hasChanged).length;
      const unchangedFiles = fileHashInfo.filter(f => !f.hasChanged).length;

      const executionTimeMs = Date.now() - startTime;

      const result: Phase19Result = {
        success: true,
        totalFiles: sourceFiles.length,
        changedFiles,
        unchangedFiles,
        fileHashInfo,
        executionTimeMs,
      };

      console.log(`SUCCESS Phase 19 Complete in ${executionTimeMs / 1000}s`);
      console.log(`INFO Total files: ${sourceFiles.length}`);
      console.log(`INFO Changed files: ${changedFiles}`);
      console.log(`INFO Unchanged files (skipped): ${unchangedFiles}`);

      return result;
    } catch (error) {
      const executionTimeMs = Date.now() - startTime;
      const sanitizedError = sanitizeError(error);

      const result: Phase19Result = {
        success: false,
        totalFiles: 0,
        changedFiles: 0,
        unchangedFiles: 0,
        fileHashInfo: [],
        executionTimeMs,
        error: sanitizedError,
      };

      console.error('FAILED Phase 19:', sanitizedError);
      return result;
    }
  }

  /**
   * Gets source files from project
   *
   * @private
   * @param projectRoot - Project root directory
   * @returns string[] - Source file paths
   */
  private getSourceFiles(projectRoot: string): string[] {
    const files: string[] = [];

    const extensions = ['.ts', '.tsx', '.js', '.jsx', '.json', '.md'];
    
    const searchDir = (dir: string) => {
      try {
        const items = fs.readdirSync(dir, { withFileTypes: true });
        
        for (const item of items) {
          const fullPath = path.join(dir, item.name);
          
          if (item.isDirectory()) {
            // Skip node_modules, .aegis, and .git directories
            if (item.name !== 'node_modules' && item.name !== '.aegis' && item.name !== '.git') {
              searchDir(fullPath);
            }
          } else if (item.isFile() && extensions.some(ext => item.name.endsWith(ext))) {
            files.push(fullPath);
          }
        }
      } catch (error) {
        // Skip directories we can't read
      }
    };

    searchDir(projectRoot);
    return files;
  }

  /**
   * Loads baseline hashes from state
   *
   * @private
   * @returns Record<string, string> - Baseline hashes map
   */
  private loadBaselineHashes(): Record<string, string> {
    const hashCachePath = path.join(this.config.projectRoot, '.aegis', 'hash-cache.json');
    
    if (fs.existsSync(hashCachePath)) {
      try {
        const content = fs.readFileSync(hashCachePath, 'utf-8');
        return JSON.parse(content);
      } catch (error) {
        console.warn('Failed to load baseline hashes, starting fresh:', sanitizeError(error));
        return {};
      }
    }

    return {};
  }

  /**
   * Saves baseline hashes to state
   *
   * @private
   * @param fileHashInfo - File hash information
   */
  private saveBaselineHashes(fileHashInfo: FileHashInfo[]): void {
    const hashCachePath = path.join(this.config.projectRoot, '.aegis', 'hash-cache.json');
    const hashCacheDir = path.dirname(hashCachePath);

    // Create directory if it doesn't exist
    if (!fs.existsSync(hashCacheDir)) {
      fs.mkdirSync(hashCacheDir, { recursive: true });
    }

    const hashMap: Record<string, string> = {};
    for (const info of fileHashInfo) {
      hashMap[info.filePath] = info.hash;
    }

    try {
      fs.writeFileSync(hashCachePath, JSON.stringify(hashMap, null, 2));
    } catch (error) {
      console.warn('Failed to save baseline hashes:', sanitizeError(error));
    }
  }

  /**
   * Calculates SHA-256 hashes for files
   *
   * @private
   * @param sourceFiles - Source file paths
   * @param baselineHashes - Baseline hashes map
   * @returns Promise<FileHashInfo[]> - File hash information
   */
  private async calculateFileHashes(sourceFiles: string[], baselineHashes: Record<string, string>): Promise<FileHashInfo[]> {
    const fileHashInfo: FileHashInfo[] = [];

    for (const filePath of sourceFiles) {
      try {
        // Validate path
        if (!validatePath(filePath, this.config.projectRoot)) {
          console.warn(`Invalid path: ${filePath}`);
          continue;
        }

        const stats = fs.statSync(filePath);
        
        // Validate file size (max 10MB)
        if (!validateFileSize(stats.size, 10)) {
          console.warn(`File too large: ${filePath}`);
          continue;
        }

        const content = fs.readFileSync(filePath, 'utf-8');
        
        // Censor potential secrets before hashing
        const sanitizedContent = censorSecrets(content);
        
        const hash = crypto.createHash('sha256').update(sanitizedContent).digest('hex');
        
        const baselineHash = baselineHashes[filePath];
        const hasChanged = baselineHash !== hash;
        
        fileHashInfo.push({
          filePath,
          hash,
          hasChanged,
          size: stats.size,
        });
      } catch (error) {
        console.warn(`Failed to hash ${filePath}:`, sanitizeError(error));
      }
    }

    return fileHashInfo;
  }
}
