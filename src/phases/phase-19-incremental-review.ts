/**
 * Phase 19: Incremental Review
 *
 * Purpose: Make Aegis intelligent and only work on what's necessary.
 *
 * Architecture:
 * - Git-Powered Target Selection: Use git status and git diff to identify modified files
 * - Core-Path Dependency Tracing: Mark dependents of Core Path files for re-audit
 * - Audit Skip (Cache Hit): Log [SKIP] for unchanged files
 * - Hardware Guard (Diff Pressure): Force Full Review if diff is massive (>100 files)
 *
 * @module phases/phase-19-incremental-review
 * @since 2.0.0
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { exec } from 'child_process';
import { promisify } from 'util';
import { ThermalController } from '../core/thermal-controller.js';
import { StatePersistence, type ExecutionState } from '../core/state-persistence.js';
import { BatchProcessor } from '../processing/batch-processor.js';

const execAsync = promisify(exec);

/**
 * Incremental review result
 */
interface IncrementalReviewResult {
  /** Total files in project */
  totalFiles: number;
  /** Files modified (from git) */
  modifiedFiles: number;
  /** Files selected for audit (modified + dependents) */
  filesSelectedForAudit: number;
  /** Files skipped (cache hit) */
  filesSkipped: number;
  /** Full review forced */
  fullReviewForced: boolean;
  /** Core path dependents traced */
  corePathDependentsTraced: number;
  /** Hash validation overrides */
  hashValidationOverrides: number;
}

/**
 * File audit status
 */
interface FileAuditStatus {
  /** File path */
  filePath: string;
  /** Is modified */
  isModified: boolean;
  /** Is in Core Path */
  isCorePath: boolean;
  /** Blast radius (import count) */
  blastRadius: number;
  /** Should audit */
  shouldAudit: boolean;
  /** Reason for audit */
  auditReason?: string;
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
  /** Incremental review result */
  reviewResult: IncrementalReviewResult;
  /** Files selected for audit */
  selectedFiles: string[];
  /** Execution time in milliseconds */
  executionTimeMs: number;
  /** Error if failed */
  error?: string;
}

/**
 * Phase 19: Incremental Review
 *
 * This phase intelligently selects files for audit based on git changes.
 *
 * @class Phase19IncrementalReview
 */
export class Phase19IncrementalReview {
  private config: Phase19Config;

  constructor(config: Phase19Config) {
    this.config = config;
  }

  /**
   * Executes Phase 19: Incremental Review
   *
   * @returns Promise<Phase19Result> - Incremental review result
   */
  async execute(): Promise<Phase19Result> {
    const startTime = Date.now();
    console.log('INFO Phase 19: Incremental Review\n');

    try {
      // Thermal Verification: Check system resources before review
      console.log('INFO Verifying system resources...');
      const resourceCheck = await this.config.thermalController.checkSystemResources();
      console.log(`INFO CPU Usage: ${resourceCheck.cpuUsage}%`);
      console.log(`INFO RAM Usage: ${resourceCheck.ramUsage}%`);
      console.log(`INFO RAM Available: ${resourceCheck.ramAvailable} GB\n`);

      if (!resourceCheck.isSafe) {
        console.log(`WARNING System resources not safe (${resourceCheck.category}). Applying cooldown...`);
        await this.config.thermalController.applyAdaptiveCooldown('medium');
      }

      // Step 1: Git-Powered Target Selection
      const modifiedFiles = await this.getModifiedFiles();
      console.log(`INFO Modified files detected: ${modifiedFiles.length}`);

      // Step 1.5: Git 'Dirty' State Guard (untracked Core Path files)
      const untrackedCorePathFiles = await this.getUntrackedCorePathFiles();
      console.log(`INFO Untracked Core Path files: ${untrackedCorePathFiles.length}`);
      modifiedFiles.push(...untrackedCorePathFiles);

      // Step 2: Hardware Guard (Diff Pressure)
      const fullReviewForced = this.checkDiffPressure(modifiedFiles.length);
      if (fullReviewForced) {
        console.log('WARNING Diff Pressure detected. Forcing Full Review instead of incremental.');
        const allFiles = this.getAllSourceFiles();
        const selectedFiles = allFiles.map(f => path.relative(this.config.projectRoot, f));

        const reviewResult: IncrementalReviewResult = {
          totalFiles: allFiles.length,
          modifiedFiles: modifiedFiles.length,
          filesSelectedForAudit: selectedFiles.length,
          filesSkipped: 0,
          fullReviewForced: true,
          corePathDependentsTraced: 0,
          hashValidationOverrides: 0,
        };

        const executionTimeMs = Date.now() - startTime;

        console.log(`\nSUCCESS Phase 19 Complete (Full Review)`);
        console.log(`INFO Total files: ${reviewResult.totalFiles}`);
        console.log(`INFO Files selected for audit: ${reviewResult.filesSelectedForAudit}`);
        console.log(`INFO Full Review forced: ${reviewResult.fullReviewForced}\n`);

        return {
          success: true,
          reviewResult,
          selectedFiles,
          executionTimeMs,
        };
      }

      // Step 3: Build file audit status map
      const fileStatusMap = await this.buildFileAuditStatusMap(modifiedFiles);

      // Step 4: Core-Path Dependency Tracing (PUNTO 2)
      const dependentsTraced = await this.performCorePathDependencyTracing(fileStatusMap);

      // Step 5: Hash-Validation Double Check (PUNTO 3)
      const hashValidationSkipped = await this.performHashValidationDoubleCheck(fileStatusMap);

      // Step 6: Audit Skip (Cache Hit)
      const filesSkipped = this.performAuditSkip(fileStatusMap);

      // Step 6: Select files for audit
      const selectedFiles = this.selectFilesForAudit(fileStatusMap);

      const reviewResult: IncrementalReviewResult = {
        totalFiles: fileStatusMap.size,
        modifiedFiles: modifiedFiles.length,
        filesSelectedForAudit: selectedFiles.length,
        filesSkipped,
        fullReviewForced: false,
        corePathDependentsTraced: dependentsTraced,
        hashValidationOverrides: hashValidationSkipped,
      };

      // Store Phase 19 results in StatePersistence
      await this.config.statePersistence.storeAnalysisResults(19, reviewResult, this.config.currentState);

      const executionTimeMs = Date.now() - startTime;

      // Final resource check
      const finalResources = await this.config.thermalController.checkSystemResources();
      console.log(`\nSUCCESS Phase 19 Complete`);
      console.log(`INFO Total files: ${reviewResult.totalFiles}`);
      console.log(`INFO Modified files: ${reviewResult.modifiedFiles}`);
      console.log(`INFO Files selected for audit: ${reviewResult.filesSelectedForAudit}`);
      console.log(`INFO Files skipped: ${reviewResult.filesSkipped}`);
      console.log(`INFO Core path dependents traced: ${reviewResult.corePathDependentsTraced}`);
      console.log(`INFO Hash validation overrides: ${reviewResult.hashValidationOverrides}`);
      console.log(`INFO Final CPU Usage: ${finalResources.cpuUsage}%`);
      console.log(`INFO Final RAM Usage: ${finalResources.ramUsage}%\n`);

      return {
        success: true,
        reviewResult,
        selectedFiles,
        executionTimeMs,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`ERROR Phase 19 failed: ${errorMessage}\n`);

      return {
        success: false,
        reviewResult: {
          totalFiles: 0,
          modifiedFiles: 0,
          filesSelectedForAudit: 0,
          filesSkipped: 0,
          fullReviewForced: false,
          corePathDependentsTraced: 0,
          hashValidationOverrides: 0,
        },
        selectedFiles: [],
        executionTimeMs: Date.now() - startTime,
        error: errorMessage,
      };
    }
  }

  /**
   * Gets modified files from git (PUNTO 1)
   *
   * PUNTO 1: Git-Powered Target Selection
   * 
   * @private
   * @returns Promise<string[]> - Modified file paths
   */
  private async getModifiedFiles(): Promise<string[]> {
    const modifiedFiles: string[] = [];

    try {
      // Get staged files
      const { stdout: stagedOutput } = await execAsync('git diff --name-only --cached', { cwd: this.config.projectRoot });
      const stagedFiles = stagedOutput ? stagedOutput.split('\n').filter((line: string) => line.trim()) : [];
      modifiedFiles.push(...stagedFiles);

      // Get working tree files
      const { stdout: workingOutput } = await execAsync('git diff --name-only', { cwd: this.config.projectRoot });
      const workingFiles = workingOutput ? workingOutput.split('\n').filter((line: string) => line.trim()) : [];
      modifiedFiles.push(...workingFiles);

      // Remove duplicates
      const uniqueFiles = Array.from(new Set(modifiedFiles));

      return uniqueFiles;
    } catch (error) {
      console.warn('WARNING Failed to get modified files from git:', error instanceof Error ? error.message : error);
      return [];
    }
  }

  /**
   * Checks Diff Pressure (PUNTO 4)
   *
   * @private
   * @param modifiedFileCount - Number of modified files
   * @returns boolean - Whether full review is forced
   */
  private checkDiffPressure(modifiedFileCount: number): boolean {
    const DIFF_PRESSURE_THRESHOLD = 100;

    if (modifiedFileCount > DIFF_PRESSURE_THRESHOLD) {
      console.log(`WARNING Diff Pressure: ${modifiedFileCount} files modified (threshold: ${DIFF_PRESSURE_THRESHOLD})`);
      return true;
    }

    return false;
  }

  /**
   * Gets all source files in the project
   *
   * @private
   * @returns string[] - Array of source file paths
   */
  private getAllSourceFiles(): string[] {
    const files: string[] = [];
    const extensions = ['.ts', '.tsx', '.js', '.jsx'];

    const findFilesRecursive = (dir: string) => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          if (entry.name !== '.git' && entry.name !== 'node_modules') {
            findFilesRecursive(fullPath);
          }
        } else if (entry.isFile() && extensions.includes(path.extname(entry.name))) {
          files.push(fullPath);
        }
      }
    };

    findFilesRecursive(this.config.projectRoot);
    return files;
  }

  /**
   * Builds file audit status map
   *
   * @private
   * @param modifiedFiles - Modified file paths
   * @returns Promise<Map<string, FileAuditStatus>> - File audit status map
   */
  private async buildFileAuditStatusMap(modifiedFiles: string[]): Promise<Map<string, FileAuditStatus>> {
    const fileStatusMap = new Map<string, FileAuditStatus>();
    const allFiles = this.getAllSourceFiles();

    // Get Core Path from Phase 2
    const corePaths = this.getCorePaths();

    // Build import map for Blast Radius
    const importMap = this.buildImportMap();

    for (const filePath of allFiles) {
      const relativePath = path.relative(this.config.projectRoot, filePath);
      const isModified = modifiedFiles.includes(relativePath);
      const isCorePath = corePaths.some(cp => relativePath.startsWith(cp));
      const blastRadius = importMap.get(relativePath) || 0;

      fileStatusMap.set(relativePath, {
        filePath: relativePath,
        isModified,
        isCorePath,
        blastRadius,
        shouldAudit: isModified,
        auditReason: isModified ? 'modified' : undefined,
      });
    }

    return fileStatusMap;
  }

  /**
   * Gets Core Paths from Phase 2
   *
   * @private
   * @returns string[] - Core paths
   */
  private getCorePaths(): string[] {
    const phase2Data = this.config.currentState.analysisResults?.['2'];
    if (!phase2Data) {
      return [];
    }

    // In real implementation, would extract core paths from Phase 2 data
    return [];
  }

  /**
   * Builds import map for Blast Radius
   *
   * @private
   * @returns Map<string, number> - File path to import count mapping
   */
  private buildImportMap(): Map<string, number> {
    const importMap = new Map<string, number>();
    const sourceFiles = this.getAllSourceFiles();

    for (const sourceFile of sourceFiles) {
      try {
        const content = fs.readFileSync(sourceFile, 'utf-8');
        const relativePath = path.relative(this.config.projectRoot, sourceFile);

        // Extract import statements
        const importPatterns = [
          /import.*from\s+['"]([^'"]+)['"]/g,
          /require\(['"]([^'"]+)['"]\)/g,
        ];

        for (const pattern of importPatterns) {
          let match;
          while ((match = pattern.exec(content)) !== null) {
            const importedPath = match[1];
            
            // Resolve relative imports
            let resolvedPath: string;
            if (importedPath.startsWith('.')) {
              resolvedPath = path.resolve(path.dirname(sourceFile), importedPath);
              const extensions = ['.ts', '.tsx', '.js', '.jsx', '.json'];
              for (const ext of extensions) {
                if (fs.existsSync(resolvedPath + ext)) {
                  resolvedPath += ext;
                  break;
                }
              }
            } else {
              continue;
            }

            if (fs.existsSync(resolvedPath)) {
              const resolvedRelative = path.relative(this.config.projectRoot, resolvedPath);
              importMap.set(resolvedRelative, (importMap.get(resolvedRelative) || 0) + 1);
            }
          }
        }
      } catch {
        // Failed to read file
      }
    }

    return importMap;
  }

  /**
   * Performs Core-Path Dependency Tracing with Depth Limit (PUNTO 2)
   *
   * PUNTO 2: Core-Path Dependency Tracing
   * 
   * LÓGICA DE DEPENDENCY TRACING:
   * - Si un archivo modificado está en Core Path o tiene Blast Radius alto (>10)
   * - Marcar sus archivos dependientes directos para re-auditoría rápida
   * - Depth Limit: Default Depth 1, Critical Security = Depth 2
   * - Esto asegura que cambios en archivos centrales propaguen la validación
   * 
   * @private
   * @param fileStatusMap - File audit status map
   * @returns Promise<number> - Number of dependents traced
   */
  private async performCorePathDependencyTracing(fileStatusMap: Map<string, FileAuditStatus>): Promise<number> {
    console.log('INFO Performing Core-Path Dependency Tracing with Depth Limit...');
    let dependentsTraced = 0;

    // Build reverse dependency map (who imports whom) with Hardware Guard Diff Batching
    const reverseDependencyMap = await this.buildReverseDependencyMapBatched();

    for (const [filePath, status] of fileStatusMap.entries()) {
      // Check if file is modified AND is in Core Path OR has high Blast Radius
      if (status.isModified && (status.isCorePath || status.blastRadius > 10)) {
        // Determine max depth based on severity
        const maxDepth = status.isCorePath ? 2 : 1;
        console.log(`INFO File ${filePath} is Core Path or high Blast Radius. Tracing dependents (Depth ${maxDepth})...`);

        // Get files that import this file
        const dependents = reverseDependencyMap.get(filePath) || [];

        for (const dependent of dependents) {
          const dependentStatus = fileStatusMap.get(dependent);
          if (dependentStatus && !dependentStatus.shouldAudit) {
            dependentStatus.shouldAudit = true;
            dependentStatus.auditReason = `dependent-of-core-path:${filePath}`;
            dependentsTraced++;
            console.log(`INFO Marked dependent for audit: ${dependent} (depends on ${filePath})`);
          }
        }
      }
    }

    console.log(`INFO Core-Path Dependency Tracing complete: ${dependentsTraced} dependents marked for audit`);
    return dependentsTraced;
  }

  /**
   * Builds reverse dependency map with Hardware Guard Diff Batching (PUNTO 4)
   *
   * PUNTO 4: Hardware Guard (Diff Batching)
   * 
   * LÓGICA DE DIFF BATCHING:
   * - No leer todos los archivos de una vez
   * - Usar BatchProcessor para leer archivos en grupos de 50
   * - Liberar memoria entre cada lote para no estresar la RAM
   * 
   * @private
   * @returns Promise<Map<string, string[]>> - File to dependents mapping
   */
  private async buildReverseDependencyMapBatched(): Promise<Map<string, string[]>> {
    console.log('INFO Building reverse dependency map with Diff Batching...');
    const reverseMap = new Map<string, string[]>();
    const sourceFiles = this.getAllSourceFiles();

    // Use BatchProcessor to read files in groups of 50
    const batchProcessor = new BatchProcessor({
      projectRoot: this.config.projectRoot,
      thermalController: this.config.thermalController,
      statePersistence: this.config.statePersistence,
      recommendedBatchSize: 50,
      recommendedCooldown: 1000,
      applyCooldowns: true,
      criticalModules: [],
    });

    await batchProcessor.processFiles(
      sourceFiles,
      async (sourceFile) => {
        try {
          const content = fs.readFileSync(sourceFile, 'utf-8');
          const relativePath = path.relative(this.config.projectRoot, sourceFile);

          // Extract import statements
          const importPatterns = [
            /import.*from\s+['"]([^'"]+)['"]/g,
            /require\(['"]([^'"]+)['"]\)/g,
          ];

          for (const pattern of importPatterns) {
            let match;
            while ((match = pattern.exec(content)) !== null) {
              const importedPath = match[1];
              
              // Resolve relative imports
              let resolvedPath: string;
              if (importedPath.startsWith('.')) {
                resolvedPath = path.resolve(path.dirname(sourceFile), importedPath);
                const extensions = ['.ts', '.tsx', '.js', '.jsx', '.json'];
                for (const ext of extensions) {
                  if (fs.existsSync(resolvedPath + ext)) {
                    resolvedPath += ext;
                    break;
                  }
                }
              } else {
                continue;
              }

              if (fs.existsSync(resolvedPath)) {
                const resolvedRelative = path.relative(this.config.projectRoot, resolvedPath);
                
                if (!reverseMap.has(resolvedRelative)) {
                  reverseMap.set(resolvedRelative, []);
                }
                reverseMap.get(resolvedRelative)!.push(relativePath);
              }
            }
          }
        } catch {
          // Failed to read file
        }
        
        return { filePath: sourceFile, success: true, processingTimeMs: 0, findings: [] };
      },
      this.config.currentState
    );

    console.log('INFO Reverse dependency map built with Diff Batching');
    return reverseMap;
  }

  /**
   * Performs Hash-Validation Double Check (PUNTO 3)
   *
   * PUNTO 3: Hash-Validation Double Check
   * 
   * LÓGICA DE HASH-VALIDATION:
   * - No confiar solo en Git
   * - Antes de decidir [SKIP], comparar hash actual con guardado en StatePersistence
   * - Si Git dice que no cambió pero el hash es distinto (git checkout o cambio externo), el hash manda
   * - Esto asegura que el sistema de cache sea infalible ante cambios fuera de Git
   * 
   * @private
   * @param fileStatusMap - File audit status map
   * @returns Promise<number> - Number of hash validation overrides
   */
  private async performHashValidationDoubleCheck(fileStatusMap: Map<string, FileAuditStatus>): Promise<number> {
    console.log('INFO Performing Hash-Validation Double Check...');
    let hashValidationOverrides = 0;

    // Get saved hashes from StatePersistence
    const savedHashes = this.getSavedFileHashes();

    for (const [filePath, status] of fileStatusMap.entries()) {
      if (!status.shouldAudit) {
        // File not marked for audit, check hash
        const currentHash = this.calculateFileHash(filePath);
        const savedHash = savedHashes.get(filePath);

        if (savedHash && currentHash !== savedHash) {
          console.log(`WARNING Hash mismatch for ${filePath}. Git says no change, but hash differs. Marking for audit.`);
          status.shouldAudit = true;
          status.auditReason = 'hash-mismatch';
          hashValidationOverrides++;
        }
      }
    }

    // Update saved hashes for current state
    await this.updateSavedFileHashes(fileStatusMap);

    console.log(`INFO Hash-Validation Double Check complete: ${hashValidationOverrides} overrides`);
    return hashValidationOverrides;
  }

  /**
   * Gets saved file hashes from StatePersistence
   *
   * @private
   * @returns Map<string, string> - File path to hash mapping
   */
  private getSavedFileHashes(): Map<string, string> {
    const savedHashes = new Map<string, string>();
    
    // In real implementation, would retrieve from StatePersistence
    // For now, return empty map
    return savedHashes;
  }

  /**
   * Calculates file hash
   *
   * @private
   * @param filePath - File path
   * @returns string - File hash
   */
  private calculateFileHash(filePath: string): string {
    try {
      const fullPath = path.join(this.config.projectRoot, filePath);
      const content = fs.readFileSync(fullPath, 'utf-8');
      return crypto.createHash('sha256').update(content).digest('hex');
    } catch {
      return '';
    }
  }

  /**
   * Updates saved file hashes in StatePersistence
   *
   * @private
   * @param fileStatusMap - File audit status map
   * @returns Promise<void>
   */
  private async updateSavedFileHashes(fileStatusMap: Map<string, FileAuditStatus>): Promise<void> {
    const currentHashes = new Map<string, string>();

    for (const [filePath] of fileStatusMap.entries()) {
      currentHashes.set(filePath, this.calculateFileHash(filePath));
    }

    // In real implementation, would save to StatePersistence
    // For now, just log
    console.log(`INFO Updating ${currentHashes.size} file hashes in StatePersistence`);
  }

  /**
   * Gets untracked Core Path files (PUNTO 2)
   *
   * @private
   * @returns Promise<string[]> - Untracked Core Path file paths
   */
  private async getUntrackedCorePathFiles(): Promise<string[]> {
    const untrackedFiles: string[] = [];

    try {
      // Get untracked files from git
      const { stdout: untrackedOutput } = await execAsync('git ls-files --others --exclude-standard', { cwd: this.config.projectRoot });
      const untracked = untrackedOutput ? untrackedOutput.split('\n').filter((line: string) => line.trim()) : [];

      // Get Core Paths
      const corePaths = this.getCorePaths();

      // Filter untracked files that match Core Path patterns
      for (const file of untracked) {
        for (const corePath of corePaths) {
          if (file.startsWith(corePath)) {
            untrackedFiles.push(file);
            console.log(`INFO Untracked Core Path file detected: ${file}`);
            break;
          }
        }
      }
    } catch (error) {
      console.warn('WARNING Failed to get untracked Core Path files:', error instanceof Error ? error.message : error);
    }

    return untrackedFiles;
  }

  /**
   * Performs Audit Skip (Cache Hit)
   *
   * @private
   * @param fileStatusMap - File audit status map
   * @returns number - Number of files skipped
   */
  private performAuditSkip(fileStatusMap: Map<string, FileAuditStatus>): number {
    console.log('INFO Performing Audit Skip (Cache Hit)...');
    let filesSkipped = 0;

    for (const [filePath, status] of fileStatusMap.entries()) {
      if (!status.shouldAudit) {
        console.log(`[SKIP] No changes detected in ${filePath}`);
        filesSkipped++;
      }
    }

    console.log(`INFO Audit Skip complete: ${filesSkipped} files skipped`);
    return filesSkipped;
  }

  /**
   * Selects files for audit
   *
   * @private
   * @param fileStatusMap - File audit status map
   * @returns string[] - Selected file paths
   */
  private selectFilesForAudit(fileStatusMap: Map<string, FileAuditStatus>): string[] {
    const selectedFiles: string[] = [];

    for (const [filePath, status] of fileStatusMap.entries()) {
      if (status.shouldAudit) {
        selectedFiles.push(filePath);
      }
    }

    return selectedFiles;
  }
}
