/**
 * Phase 16: Fix Strategy Generation - Intelligent Fix Strategy Planning
 *
 * Purpose: Generate intelligent fix strategies for identified issues,
 * implementing Dependency Blast Radius to protect "High-Traffic" files
 * with Safe Level 4 protection.
 *
 * Architecture:
 * - Dependency Analysis: Analyze file dependencies and impact
 * - Blast Radius Calculation: Calculate impact radius for fixes
 * - Safe Level Classification: Classify files by safety level (1-4)
 * - Fix Prioritization: Prioritize fixes by impact and safety
 *
 * @module phases/phase-16-fix-strategy-generation
 * @since 1.0.0
 */

import * as fs from 'fs';
import * as path from 'path';
import { ThermalController } from '../core/thermal-controller.js';
import { StatePersistence, type ExecutionState } from '../core/state-persistence.js';
import { validatePath, sanitizeError, validateFileSize, censorSecrets } from '../core/security-utils.js';

/**
 * File safety level
 */
enum SafetyLevel {
  SAFE_LEVEL_1 = 1, // Low risk, can fix directly
  SAFE_LEVEL_2 = 2, // Medium risk, needs review
  SAFE_LEVEL_3 = 3, // High risk, needs careful review
  SAFE_LEVEL_4 = 4, // Critical, "High-Traffic", maximum protection
}

/**
 * File dependency info
 */
interface FileDependencyInfo {
  /** File path */
  filePath: string;
  /** Safety level */
  safetyLevel: SafetyLevel;
  /** Import count (how many files import this) */
  importCount: number;
  /** Export count (how many files this imports) */
  exportCount: number;
  /** Is high-traffic file */
  isHighTraffic: boolean;
}

/**
 * Fix strategy
 */
export interface FixStrategy {
  /** Finding ID */
  findingId: string;
  /** File to fix */
  filePath: string;
  /** Safety level */
  safetyLevel: SafetyLevel;
  /** Recommended approach */
  approach: 'direct' | 'careful' | 'manual' | 'skip';
  /** Risk assessment */
  risk: 'low' | 'medium' | 'high' | 'critical';
  /** Suggested fix */
  suggestedFix: string;
  /** Blast radius */
  blastRadius: number;
}

/**
 * Phase 16 configuration
 */
interface Phase16Config {
  /** Project root directory */
  projectRoot: string;
  /** Thermal controller for hardware protection */
  thermalController: ThermalController;
  /** State persistence for resume capability */
  statePersistence: StatePersistence;
  /** Current execution state */
  currentState: ExecutionState;
  /** Findings from previous phases */
  findings: any[];
}

/**
 * Phase 16 result
 */
export interface Phase16Result {
  /** Overall success */
  success: boolean;
  /** Fix strategies */
  strategies: FixStrategy[];
  /** High-traffic files protected */
  highTrafficFilesProtected: number;
  /** Safe Level 4 files */
  safeLevel4Files: number;
  /** Execution time in milliseconds */
  executionTimeMs: number;
  /** Error if failed */
  error?: string;
}

/**
 * Phase 16: Fix Strategy Generation - Intelligent Fix Strategy Planning
 *
 * This phase generates intelligent fix strategies for identified issues,
 * implementing Dependency Blast Radius to protect "High-Traffic" files
 * with Safe Level 4 protection.
 *
 * @class Phase16FixStrategyGeneration
 * @example
 * ```typescript
 * const fixStrategyGeneration = new Phase16FixStrategyGeneration(config);
 * const result = await fixStrategyGeneration.execute();
 * console.log(`Strategies generated: ${result.strategies.length}`);
 * console.log(`High-traffic files protected: ${result.highTrafficFilesProtected}`);
 * ```
 */
export class Phase16FixStrategyGeneration {
  private config: Phase16Config;

  constructor(config: Phase16Config) {
    // Validate projectRoot path to prevent path traversal
    if (!validatePath(config.projectRoot, config.projectRoot)) {
      throw new Error('Invalid project root path');
    }
    this.config = config;
  }

  /**
   * Executes Phase 16: Fix Strategy Generation
   *
   * @returns Promise<Phase16Result> - Fix strategy generation result
   */
  async execute(): Promise<Phase16Result> {
    const startTime = Date.now();
    console.log('INFO Phase 16: Fix Strategy Generation - Intelligent Fix Strategy Planning\n');

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

      // Analyze file dependencies
      console.log('INFO Analyzing file dependencies...');
      const fileDependencies = await this.analyzeFileDependencies(sourceFiles);
      console.log(`INFO File dependencies analyzed\n`);

      // Generate fix strategies
      console.log('INFO Generating fix strategies...');
      const strategies = this.generateFixStrategies(fileDependencies);
      console.log(`INFO Strategies generated: ${strategies.length}\n`);

      // Calculate metrics
      const highTrafficFilesProtected = fileDependencies.filter(f => f.isHighTraffic).length;
      const safeLevel4Files = fileDependencies.filter(f => f.safetyLevel === SafetyLevel.SAFE_LEVEL_4).length;

      const executionTimeMs = Date.now() - startTime;

      const result: Phase16Result = {
        success: true,
        strategies,
        highTrafficFilesProtected,
        safeLevel4Files,
        executionTimeMs,
      };

      console.log(`SUCCESS Phase 16 Complete in ${executionTimeMs / 1000}s`);
      console.log(`INFO High-traffic files protected: ${highTrafficFilesProtected}`);
      console.log(`INFO Safe Level 4 files: ${safeLevel4Files}`);

      return result;
    } catch (error) {
      const executionTimeMs = Date.now() - startTime;
      const sanitizedError = sanitizeError(error);

      const result: Phase16Result = {
        success: false,
        strategies: [],
        highTrafficFilesProtected: 0,
        safeLevel4Files: 0,
        executionTimeMs,
        error: sanitizedError,
      };

      console.error('FAILED Phase 16:', sanitizedError);
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

    const extensions = ['.ts', '.tsx', '.js', '.jsx'];
    
    const searchDir = (dir: string) => {
      try {
        const items = fs.readdirSync(dir, { withFileTypes: true });
        
        for (const item of items) {
          const fullPath = path.join(dir, item.name);
          
          if (item.isDirectory()) {
            // Skip node_modules and .aegis directories
            if (item.name !== 'node_modules' && item.name !== '.aegis' && item.name !== '.git') {
              searchDir(fullPath);
            }
          } else if (item.isFile() && extensions.some(ext => item.name.endsWith(ext))) {
            files.push(fullPath);
          }
        }
      } catch {
        // Skip directories we can't read
      }
    };

    searchDir(projectRoot);
    return files;
  }

  /**
   * Analyzes file dependencies
   *
   * @private
   * @param sourceFiles - Source file paths
   * @returns Promise<FileDependencyInfo[]> - File dependency information
   */
  private async analyzeFileDependencies(sourceFiles: string[]): Promise<FileDependencyInfo[]> {
    const fileDependencies: FileDependencyInfo[] = [];
    const importMap = new Map<string, Set<string>>();

    // Build import map
    for (const filePath of sourceFiles) {
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const imports = this.extractImports(filePath, content);
        
        for (const imp of imports) {
          if (!importMap.has(imp)) {
            importMap.set(imp, new Set());
          }
          importMap.get(imp)!.add(filePath);
        }
      } catch (error) {
        // Skip files we can't read
      }
    }

    // Calculate safety levels
    for (const filePath of sourceFiles) {
      const importCount = importMap.get(filePath)?.size || 0;
      const exportCount = this.countExports(filePath);
      
      // Calculate safety level based on import count
      let safetyLevel = SafetyLevel.SAFE_LEVEL_1;
      let isHighTraffic = false;

      if (importCount > 50) {
        safetyLevel = SafetyLevel.SAFE_LEVEL_4;
        isHighTraffic = true;
      } else if (importCount > 20) {
        safetyLevel = SafetyLevel.SAFE_LEVEL_3;
      } else if (importCount > 10) {
        safetyLevel = SafetyLevel.SAFE_LEVEL_2;
      }

      // Check for critical files
      const basename = path.basename(filePath);
      if (basename === 'index.ts' || basename === 'index.js' || basename.includes('core') || basename.includes('main')) {
        safetyLevel = SafetyLevel.SAFE_LEVEL_4;
        isHighTraffic = true;
      }

      fileDependencies.push({
        filePath,
        safetyLevel,
        importCount,
        exportCount,
        isHighTraffic,
      });
    }

    return fileDependencies;
  }

  /**
   * Extracts imports from file
   *
   * @private
   * @param filePath - File path
   * @param content - File content
   * @returns string[] - Imported file paths
   */
  private extractImports(filePath: string, content: string): string[] {
    const imports: string[] = [];
    const dir = path.dirname(filePath);

    const importPattern = /import\s+(?:\{[^}]+\}|\w+)\s+from\s+['"]([^'"]+)['"]/g;
    let match;

    while ((match = importPattern.exec(content)) !== null) {
      const importPath = match[1];
      
      // Resolve relative imports
      if (importPath.startsWith('.') || importPath.startsWith('..')) {
        const resolvedPath = path.resolve(dir, importPath);
        const extensions = ['.ts', '.tsx', '.js', '.jsx'];
        
        for (const ext of extensions) {
          const fullPath = resolvedPath + ext;
          if (fs.existsSync(fullPath)) {
            imports.push(fullPath);
            break;
          }
        }
      }
    }

    return imports;
  }

  /**
   * Extracts exports from file
   *
   * @private
   * @param filePath - File path
   * @returns number - Export count
   */
  private countExports(filePath: string): number {
    try {
      // Validate path
      if (!validatePath(filePath, this.config.projectRoot)) {
        console.warn(`Invalid path: ${filePath}`);
        return 0;
      }

      const stats = fs.statSync(filePath);
      
      // Validate file size (max 10MB)
      if (!validateFileSize(stats.size, 10)) {
        console.warn(`File too large: ${filePath}`);
        return 0;
      }

      const content = fs.readFileSync(filePath, 'utf-8');
      
      // Censor potential secrets
      const sanitizedContent = censorSecrets(content);
      
      const exportPattern = /export\s+(?:default|const|let|var|function|class|interface|type)/g;
      const matches = sanitizedContent.match(exportPattern);
      return matches ? matches.length : 0;
    } catch (error) {
      console.warn(`Failed to count exports for ${filePath}:`, sanitizeError(error));
      return 0;
    }
  }

  /**
   * Generates fix strategies
   *
   * @private
   * @param fileDependencies - File dependency information
   * @returns FixStrategy[] - Fix strategies
   */
  private generateFixStrategies(fileDependencies: FileDependencyInfo[]): FixStrategy[] {
    const strategies: FixStrategy[] = [];

    for (const finding of this.config.findings) {
      const filePath = finding.filePath;
      const fileDep = fileDependencies.find(f => f.filePath === filePath);

      if (!fileDep) {
        continue;
      }

      const strategy: FixStrategy = {
        findingId: finding.id,
        filePath,
        safetyLevel: fileDep.safetyLevel,
        approach: this.determineApproach(fileDep),
        risk: this.determineRisk(fileDep),
        suggestedFix: finding.suggestion || 'Review and fix issue',
        blastRadius: fileDep.importCount,
      };

      strategies.push(strategy);
    }

    return strategies;
  }

  /**
   * Determines fix approach based on safety level
   *
   * @private
   * @param fileDep - File dependency info
   * @returns Fix approach
   */
  private determineApproach(fileDep: FileDependencyInfo): 'direct' | 'careful' | 'manual' | 'skip' {
    switch (fileDep.safetyLevel) {
      case SafetyLevel.SAFE_LEVEL_1:
        return 'direct';
      case SafetyLevel.SAFE_LEVEL_2:
        return 'careful';
      case SafetyLevel.SAFE_LEVEL_3:
        return 'manual';
      case SafetyLevel.SAFE_LEVEL_4:
        return 'skip';
      default:
        return 'manual';
    }
  }

  /**
   * Determines risk based on safety level
   *
   * @private
   * @param fileDep - File dependency info
   * @returns Risk level
   */
  private determineRisk(fileDep: FileDependencyInfo): 'low' | 'medium' | 'high' | 'critical' {
    switch (fileDep.safetyLevel) {
      case SafetyLevel.SAFE_LEVEL_1:
        return 'low';
      case SafetyLevel.SAFE_LEVEL_2:
        return 'medium';
      case SafetyLevel.SAFE_LEVEL_3:
        return 'high';
      case SafetyLevel.SAFE_LEVEL_4:
        return 'critical';
      default:
        return 'medium';
    }
  }
}
