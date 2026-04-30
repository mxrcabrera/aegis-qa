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
 * Finding for fix strategy
 */
interface Finding {
  /** Finding ID */
  id: string;
  /** File path */
  filePath: string;
  /** Line number */
  line?: number;
  /** Severity level */
  severity: 'critical' | 'high' | 'medium' | 'low';
  /** Confidence score (0-1) */
  confidence: number;
  /** Risk level */
  riskLevel: 'safe' | 'moderate' | 'risky';
  /** Description */
  description: string;
  /** Original content */
  originalContent: string;
  /** Proposed content */
  proposedContent: string;
  /** Fix type */
  type: 'i18n' | 'a11y' | 'environment' | 'clean-code';
  /** Fix category */
  category: 'atomic' | 'refactoring';
  /** Whether fix is in core path */
  isCorePath: boolean;
}

/**
 * Fix strategy - compatible with AtomicFixer Fix interface
 */
export interface FixStrategy {
  /** Finding ID */
  id: string;
  /** Violation ID for traceability */
  violationId?: string;
  /** Fix type */
  type: 'i18n' | 'a11y' | 'environment' | 'clean-code';
  /** Fix category */
  category: 'atomic' | 'refactoring';
  /** Severity level */
  severity: 'critical' | 'high' | 'medium' | 'low';
  /** File to fix */
  file: string;
  /** Line number */
  line?: number;
  /** Description */
  description: string;
  /** Original content */
  originalContent: string;
  /** Proposed content */
  proposedContent: string;
  /** Whether fix can be auto-applied */
  autoApply: boolean;
  /** Whether fix requires confirmation */
  requiresConfirmation: boolean;
  /** Whether fix is in core path */
  isCorePath: boolean;
  /** Confidence score (0-1) */
  confidence: number;
  /** Risk level */
  riskLevel: 'safe' | 'moderate' | 'risky';
  /** Safety level from dependency analysis */
  safetyLevel: SafetyLevel;
  /** Recommended approach */
  approach: 'direct' | 'careful' | 'manual' | 'skip';
  /** Blast radius (number of dependents) */
  blastRadius: number;
  /** Priority score for ordering */
  priorityScore: number;
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
  findings: Finding[];
  /** Minimum confidence threshold (0-1) */
  minConfidence?: number;
  /** Maximum risk level allowed */
  maxRisk?: 'safe' | 'moderate' | 'risky';
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
    } catch (error: unknown) {
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
      } catch {
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
    } catch (error: unknown) {
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
      // Filter by minConfidence
      if (this.config.minConfidence !== undefined && finding.confidence < this.config.minConfidence) {
        continue;
      }

      // Filter by maxRisk
      if (this.config.maxRisk !== undefined) {
        const riskOrder: Record<string, number> = { safe: 0, moderate: 1, risky: 2 };
        const maxRiskOrder = riskOrder[this.config.maxRisk];
        const findingRiskOrder = riskOrder[finding.riskLevel];
        if (findingRiskOrder > maxRiskOrder) {
          continue;
        }
      }

      const filePath = finding.filePath;
      const fileDep = fileDependencies.find(f => f.filePath === filePath);

      if (!fileDep) {
        continue;
      }

      const strategy: FixStrategy = {
        id: finding.id,
        type: finding.type,
        category: finding.category,
        severity: finding.severity,
        file: filePath,
        line: finding.line,
        description: finding.description,
        originalContent: finding.originalContent,
        proposedContent: finding.proposedContent,
        autoApply: finding.category === 'atomic' && finding.riskLevel === 'safe',
        requiresConfirmation: finding.riskLevel !== 'safe',
        isCorePath: finding.isCorePath,
        confidence: finding.confidence,
        riskLevel: finding.riskLevel,
        safetyLevel: fileDep.safetyLevel,
        approach: this.determineApproach(fileDep),
        blastRadius: fileDep.importCount,
        priorityScore: this.calculatePriorityScore(finding, fileDep),
      };

      strategies.push(strategy);
    }

    // Sort by priority score (descending)
    strategies.sort((a, b) => b.priorityScore - a.priorityScore);

    // Group by file
    const groupedByFile = this.groupByFile(strategies);

    // Flatten grouped strategies (maintaining priority order within each file)
    const flattened: FixStrategy[] = [];
    for (const fileStrategies of Object.values(groupedByFile)) {
      flattened.push(...fileStrategies);
    }

    return flattened;
  }

  /**
   * Groups strategies by file
   *
   * @private
   * @param strategies - Fix strategies
   * @returns Record<string, FixStrategy[]> - Strategies grouped by file
   */
  private groupByFile(strategies: FixStrategy[]): Record<string, FixStrategy[]> {
    const grouped: Record<string, FixStrategy[]> = {};

    for (const strategy of strategies) {
      if (!grouped[strategy.file]) {
        grouped[strategy.file] = [];
      }
      grouped[strategy.file].push(strategy);
    }

    return grouped;
  }

  /**
   * Determines fix approach based on safety level
   *
   * @private
   * @param fileDep - File dependency info
   * @returns Approach type
   */
  private determineApproach(fileDep: FileDependencyInfo): 'direct' | 'careful' | 'manual' | 'skip' {
    if (fileDep.safetyLevel === SafetyLevel.SAFE_LEVEL_4) {
      return 'skip';
    }
    if (fileDep.safetyLevel === SafetyLevel.SAFE_LEVEL_3) {
      return 'manual';
    }
    if (fileDep.safetyLevel === SafetyLevel.SAFE_LEVEL_2) {
      return 'careful';
    }
    return 'direct';
  }

  /**
   * Calculates priority score for a fix
   *
   * Higher score = higher priority
   * Factors: severity (weight 3), confidence (weight 2), risk level (weight 2), blast radius (weight 1)
   *
   * @private
   * @param finding - Finding with metadata
   * @param fileDep - File dependency info
   * @returns Priority score (0-100)
   */
  private calculatePriorityScore(finding: Finding, fileDep: FileDependencyInfo): number {
    let score = 0;

    // Severity weight: 3
    const severityWeight = 3;
    const severityScores: Record<string, number> = {
      critical: 100,
      high: 75,
      medium: 50,
      low: 25,
    };
    score += (severityScores[finding.severity] || 0) * severityWeight;

    // Confidence weight: 2 (higher confidence = higher priority)
    const confidenceWeight = 2;
    score += finding.confidence * 100 * confidenceWeight;

    // Risk level weight: 2 (safer = higher priority)
    const riskWeight = 2;
    const riskScores: Record<string, number> = {
      safe: 100,
      moderate: 50,
      risky: 0,
    };
    score += (riskScores[finding.riskLevel] || 0) * riskWeight;

    // Blast radius weight: 1 (lower blast radius = higher priority for high-traffic files)
    const blastRadiusWeight = 1;
    // Invert blast radius: fewer dependents = higher priority
    const blastRadiusScore = Math.max(0, 100 - (fileDep.importCount * 2));
    score += blastRadiusScore * blastRadiusWeight;

    // Normalize to 0-100
    return Math.min(100, Math.max(0, score / 8));
  }
}














