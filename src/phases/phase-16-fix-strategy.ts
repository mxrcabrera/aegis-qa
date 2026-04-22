// eslint-disable @typescript-eslint/no-explicit-any
/**
 * Phase 16: Fix Strategy Generation
 *
 * Purpose: Transform findings from phases 1-15 into precise instructions for AtomicFixer.
 *
 * Architecture:
 * - Mapeo de Soluciones: Dictionary of resolution strategies by error type
 * - Análisis de Dependencias de Fix: Verify if changes affect other files
 * - Detección de Conflictos: Prioritize by severity (Security > Business Logic > Style)
 * - Hardening de Propuesta: Safe Level (1-5), level 5 requires human intervention
 * - Hardware Guard: Monitor RAM < 15%, flush strategy cache if needed
 *
 * @module phases/phase-16-fix-strategy
 * @since 2.0.0
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { ThermalController } from '../core/thermal-controller.js';
import { StatePersistence, type ExecutionState } from '../core/state-persistence.js';

/**
 * Fix strategy
 */
interface FixStrategy {
  /** Strategy ID */
  strategyId: string;
  /** Original finding ID */
  findingId: string;
  /** Finding type */
  findingType: string;
  /** File path */
  filePath: string;
  /** Line number */
  line?: number;
  /** Strategy description */
  description: string;
  /** Suggested action */
  suggestedAction: string;
  /** Safe level (1-5, 5 = very risky) */
  safeLevel: number;
  /** Whether requires human intervention */
  requiresHumanIntervention: boolean;
  /** Phase source */
  phaseSource: number;
  /** Severity */
  severity: 'critical' | 'high' | 'medium' | 'low';
  /** Dependencies (files affected) */
  dependencies: string[];
  /** Conflict status */
  conflictStatus?: 'no-conflict' | 'conflict-resolved' | 'conflict-unresolved';
  /** Conflicting strategies */
  conflictingStrategies: string[];
}

/**
 * Fix strategy generation result
 */
interface FixStrategyGenerationResult {
  /** Total strategies generated */
  totalStrategies: number;
  /** Strategies by phase */
  strategiesByPhase: Map<number, FixStrategy[]>;
  /** Conflicts detected */
  conflictsDetected: number;
  /** Conflicts resolved */
  conflictsResolved: number;
  /** Strategies requiring human intervention */
  humanInterventionRequired: number;
  /** Strategy cache flushes */
  cacheFlushes: number;
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
}

/**
 * Phase 16 result
 */
export interface Phase16Result {
  /** Overall success */
  success: boolean;
  /** Fix strategy generation result */
  strategyResult: FixStrategyGenerationResult;
  /** Execution time in milliseconds */
  executionTimeMs: number;
  /** Error if failed */
  error?: string;
}

/**
 * Phase 16: Fix Strategy Generation
 *
 * This phase transforms findings from previous phases into precise fix instructions.
 *
 * @class Phase16FixStrategyGeneration
 */
export class Phase16FixStrategyGeneration {
  private config: Phase16Config;
  private strategyCache: Map<string, FixStrategy>;
  private cacheFlushCount: number;

  constructor(config: Phase16Config) {
    this.config = config;
    this.strategyCache = new Map();
    this.cacheFlushCount = 0;
  }

  /**
   * Executes Phase 16: Fix Strategy Generation
   *
   * @returns Promise<Phase16Result> - Fix strategy generation result
   */
  async execute(): Promise<Phase16Result> {
    const startTime = Date.now();
    console.log('INFO Phase 16: Fix Strategy Generation\n');

    try {
      // Thermal Verification: Check system resources before strategy generation
      console.log('INFO Verifying system resources...');
      const resourceCheck = await this.config.thermalController.checkSystemResources();
      console.log(`INFO CPU Usage: ${resourceCheck.cpuUsage}%`);
      console.log(`INFO RAM Usage: ${resourceCheck.ramUsage}%`);
      console.log(`INFO RAM Available: ${resourceCheck.ramAvailable} GB\n`);

      if (!resourceCheck.isSafe) {
        console.log(`WARNING System resources not safe (${resourceCheck.category}). Applying cooldown...`);
        await this.config.thermalController.applyAdaptiveCooldown('medium');
      }

      // Generate fix strategies
      const strategyResult = await this.generateFixStrategies();

      // Store Phase 16 results in StatePersistence
      await this.config.statePersistence.storeAnalysisResults(16, strategyResult, this.config.currentState);

      const executionTimeMs = Date.now() - startTime;

      // Final resource check
      const finalResources = await this.config.thermalController.checkSystemResources();
      console.log(`\nSUCCESS Phase 16 Complete`);
      console.log(`INFO Total strategies: ${strategyResult.totalStrategies}`);
      console.log(`INFO Conflicts detected: ${strategyResult.conflictsDetected}`);
      console.log(`INFO Conflicts resolved: ${strategyResult.conflictsResolved}`);
      console.log(`INFO Human intervention required: ${strategyResult.humanInterventionRequired}`);
      console.log(`INFO Cache flushes: ${strategyResult.cacheFlushes}`);
      console.log(`INFO Final CPU Usage: ${finalResources.cpuUsage}%`);
      console.log(`INFO Final RAM Usage: ${finalResources.ramUsage}%\n`);

      return {
        success: true,
        strategyResult,
        executionTimeMs,
      };
    } catch {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`ERROR Phase 16 failed: ${errorMessage}\n`);

      return {
        success: false,
        strategyResult: {
          totalStrategies: 0,
          strategiesByPhase: new Map(),
          conflictsDetected: 0,
          conflictsResolved: 0,
          humanInterventionRequired: 0,
          cacheFlushes: 0,
        },
        executionTimeMs: Date.now() - startTime,
        error: errorMessage,
      };
    }
  }

  /**
   * Generates fix strategies from findings
   *
   * @private
   * @returns Promise<FixStrategyGenerationResult> - Fix strategy generation result
   */
  private async generateFixStrategies(): Promise<FixStrategyGenerationResult> {
    const result: FixStrategyGenerationResult = {
      totalStrategies: 0,
      strategiesByPhase: new Map(),
      conflictsDetected: 0,
      conflictsResolved: 0,
      humanInterventionRequired: 0,
      cacheFlushes: 0,
    };

    // Get analysis results from previous phases
    const analysisResults = this.config.currentState.analysisResults || {};

    // Generate strategies for each phase
    for (const [phaseNumber, phaseData] of Object.entries(analysisResults)) {
      const phaseNum = parseInt(phaseNumber, 10);
      if (phaseNum < 1 || phaseNum > 15) continue;

      const phaseStrategies: FixStrategy[] = [];
      const findings = this.extractFindingsFromPhaseData(phaseData);

      for (const finding of findings) {
        // AST-Preflight Check: Verify file has no syntax errors before generating strategy
        if ((finding as any).filePath) {
          const preflightCheck = this.performASTPreflightCheck((finding as any).filePath);
          if (!preflightCheck.passed) {
            console.log(`WARNING AST-Preflight Check failed for ${(finding as any).filePath}. Manual Fix First required.`);
            continue; // Skip this finding, refuse to propose automatic fixes
          }
        }

        // Hardware Guard OOM Prevention: Monitor RAM < 10%
        const resourceCheck = await this.config.thermalController.checkSystemResources();
        if (resourceCheck.ramAvailable < 10) {
          console.log(`CRITICAL RAM available very low (${resourceCheck.ramAvailable} GB). Serializing strategies to disk...`);
          await this.serializeStrategiesToDisk(result);
          this.flushStrategyCache();
          result.cacheFlushes++;
        } else if (resourceCheck.ramAvailable < 15) {
          console.log(`WARNING RAM available low (${resourceCheck.ramAvailable} GB). Flushing strategy cache...`);
          this.flushStrategyCache();
          result.cacheFlushes++;
        }

        const strategy = this.generateStrategyForFinding(finding, phaseNum);
        if (strategy) {
          phaseStrategies.push(strategy);
          this.strategyCache.set((strategy as any).strategyId, strategy);
        }
      }

      result.strategiesByPhase.set(phaseNum, phaseStrategies);
      result.totalStrategies += phaseStrategies.length;
    }

    // Detect and resolve conflicts
    const conflictResolution = this.detectAndResolveConflicts(result.strategiesByPhase);
    result.conflictsDetected = conflictResolution.totalConflicts;
    result.conflictsResolved = conflictResolution.resolvedConflicts;

    // Detect circular fixes
    const circularFixDetection = this.detectCircularFixes(result.strategiesByPhase);
    result.humanInterventionRequired += circularFixDetection.circularFixCount;

    // Apply Dependency Blast Radius
    this.applyDependencyBlastRadius(result.strategiesByPhase);

    // Count strategies requiring human intervention
    for (const strategies of result.strategiesByPhase.values()) {
      for (const strategy of strategies) {
        if ((strategy as any).requiresHumanIntervention) {
          result.humanInterventionRequired++;
        }
      }
    }

    return result;
  }

  /**
   * Extracts findings from phase data
   *
   * @private
   * @param phaseData - Phase data
   * @returns Array of findings
   */
  private extractFindingsFromPhaseData(phaseData: any): unknown[] {
    const findings: unknown[] = [];

    // Handle different phase data structures
    if (Array.isArray(phaseData)) {
      return phaseData;
    }

    if ((phaseData as any).findings && Array.isArray((phaseData as any).findings)) {
      return (phaseData as any).findings;
    }

    if ((phaseData as any).codeFindings && Array.isArray((phaseData as any).codeFindings)) {
      return (phaseData as any).codeFindings;
    }

    if ((phaseData as any).securityFindings && Array.isArray((phaseData as any).securityFindings)) {
      return (phaseData as any).securityFindings;
    }

    if ((phaseData as any).gitHygieneFindings && Array.isArray((phaseData as any).gitHygieneFindings)) {
      return (phaseData as any).gitHygieneFindings;
    }

    if ((phaseData as any).cicdFindings && Array.isArray((phaseData as any).cicdFindings)) {
      return (phaseData as any).cicdFindings;
    }

    if ((phaseData as any).cloudInfraFindings && Array.isArray((phaseData as any).cloudInfraFindings)) {
      return (phaseData as any).cloudInfraFindings;
    }

    if ((phaseData as any).containerizationFindings && Array.isArray((phaseData as any).containerizationFindings)) {
      return (phaseData as any).containerizationFindings;
    }

    return findings;
  }

  /**
   * Generates strategy for a finding
   *
   * @private
   * @param finding - Finding object
   * @param phaseSource - Phase number
   * @returns FixStrategy | null - Generated strategy
   */
  private generateStrategyForFinding(finding: unknown, phaseSource: number): FixStrategy | null {
    const strategyId = crypto.createHash('sha1').update(
      `${(finding as any).id || (finding as any).type}${(finding as any).filePath || ''}${(finding as any).line || 0}`
    ).digest('hex').substring(0, 12);

    const findingType = (finding as any).type || 'unknown';
    const strategyMapping = this.getStrategyMapping(findingType);

    if (!strategyMapping) {
      return null;
    }

    // Analyze dependencies
    const dependencies = this.analyzeDependencies(finding);

    const strategy: FixStrategy = {
      strategyId,
      findingId: (finding as any).id || strategyId,
      findingType,
      filePath: (finding as any).filePath || '',
      line: (finding as any).line,
      description: strategyMapping.description,
      suggestedAction: strategyMapping.action,
      safeLevel: strategyMapping.safeLevel,
      requiresHumanIntervention: strategyMapping.safeLevel === 5,
      phaseSource,
      severity: (finding as any).severity || 'medium',
      dependencies,
      conflictStatus: 'no-conflict',
      conflictingStrategies: [],
    };

    return strategy;
  }

  /**
   * Gets strategy mapping for finding type
   *
   * @private
   * @param findingType - Finding type
   * @returns Strategy mapping or null
   */
  private getStrategyMapping(findingType: string): { description: string; action: string; safeLevel: number } | null {
    const strategyMappings: Record<string, { description: string; action: string; safeLevel: number }> = {
      'hardcoded-string': {
        description: 'Extract hardcoded string to i18n wrapper',
        action: 'Replace hardcoded string with i18n.t() call',
        safeLevel: 2,
      },
      'unused-var': {
        description: 'Remove unused variable',
        action: 'Safely remove unused variable declaration',
        safeLevel: 3,
      },
      'security-issue': {
        description: 'Fix security vulnerability',
        action: 'Apply security fix (sanitization, validation, or encryption)',
        safeLevel: 4,
      },
      'permission-issue': {
        description: 'Restrict overly permissive configuration',
        action: 'Update configuration to use least-privilege principle',
        safeLevel: 4,
      },
      'user-root': {
        description: 'Remove USER root from Dockerfile',
        action: 'Change to non-root user (e.g., USER node or create dedicated user)',
        safeLevel: 3,
      },
      'latest-image': {
        description: 'Use specific version instead of :latest',
        action: 'Replace :latest with specific version tag (e.g., node:18-alpine)',
        safeLevel: 2,
      },
      'secret-env': {
        description: 'Remove hardcoded secrets from Dockerfile',
        action: 'Remove ENV with secrets, use Docker Secrets or runtime env vars',
        safeLevel: 5,
      },
      'leaked-env-file': {
        description: 'Remove .env file from git tracking',
        action: 'Add .env to .gitignore and remove from git history',
        safeLevel: 4,
      },
      'git-tracked-sensitive': {
        description: 'Remove sensitive file from git tracking',
        action: 'Add to .gitignore and remove from git history using BFG Repo-Cleaner',
        safeLevel: 5,
      },
      'no-multi-stage': {
        description: 'Implement multi-stage build for Dockerfile',
        action: 'Add multi-stage build to optimize image size and security',
        safeLevel: 3,
      },
      'secret-leak-blocker': {
        description: 'Remove secrets from .tfvars file',
        action: 'Add .tfvars to .gitignore and remove from git history',
        safeLevel: 5,
      },
      'missing-readme': {
        description: 'Create README.md with project documentation',
        action: 'Generate README.md with project overview, setup, and usage instructions',
        safeLevel: 1,
      },
      'missing-build-instructions': {
        description: 'Add build instructions to README',
        action: 'Document build process in README.md',
        safeLevel: 1,
      },
    };

    return strategyMappings[findingType] || null;
  }

  /**
   * Analyzes dependencies for a fix
   *
   * @private
   * @param finding - Finding object
   * @returns string[] - List of dependent files
   */
  private analyzeDependencies(finding: any): string[] {
    const dependencies: string[] = [];

    if (!(finding as any).filePath) {
      return dependencies;
    }

    try {
      const filePath = (finding as any).filePath;
      const fileExtension = path.extname(filePath);

      // For TypeScript/JavaScript files, analyze variable/function references
      if (['.ts', '.tsx', '.js', '.jsx'].includes(fileExtension)) {
        const content = fs.readFileSync(path.join(this.config.projectRoot, filePath), 'utf-8');
        
        // Extract variable/function names from the finding
        const variablePattern = /\b([a-zA-Z_$][a-zA-Z0-9_$]*)\b/g;
        const matches = content.match(variablePattern);
        
        if (matches) {
          // Search for references in other files
          const sourceFiles = this.findSourceFiles();
          
          for (const sourceFile of sourceFiles) {
            if (sourceFile === filePath) continue;
            
            try {
              const sourceContent = fs.readFileSync(sourceFile, 'utf-8');
              
              for (const match of matches) {
                if (sourceContent.includes(match)) {
                  dependencies.push(path.relative(this.config.projectRoot, sourceFile));
                  break;
                }
              }
            } catch {
              // Failed to read source file
            }
          }
        }
      }
    } catch {
      // Failed to analyze dependencies
    }

    return dependencies;
  }

  /**
   * Finds source files in the project
   *
   * @private
   * @returns string[] - Array of source file paths
   */
  private findSourceFiles(): string[] {
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
   * Detects and resolves conflicts between strategies
   *
   * PUNTO 3: Detección de Conflictos
   * 
   * LÓGICA:
   * 1. Agrupar estrategias por (filePath, line)
   * 2. Si hay múltiples estrategias para la misma línea, detectar conflicto
   * 3. Priorizar por severidad: Security > Business Logic > Style
   * 4. Marcar estrategias de menor prioridad como conflict-resolved
   * 
   * @private
   * @param strategiesByPhase - Strategies grouped by phase
   * @returns Conflict resolution result
   */
  private detectAndResolveConflicts(strategiesByPhase: Map<number, FixStrategy[]>): {
    totalConflicts: number;
    resolvedConflicts: number;
  } {
    const lineMap = new Map<string, FixStrategy[]>();
    let totalConflicts = 0;
    let resolvedConflicts = 0;

    // Group strategies by (filePath, line)
    for (const strategies of strategiesByPhase.values()) {
      for (const strategy of strategies) {
        if (!(strategy as any).filePath || (strategy as any).line === undefined) continue;

        const key = `${(strategy as any).filePath}:${(strategy as any).line}`;
        if (!lineMap.has(key)) {
          lineMap.set(key, []);
        }
        lineMap.get(key)!.push(strategy);
      }
    }

    // Detect conflicts
    for (const [, strategies] of lineMap.entries()) {
      if (strategies.length > 1) {
        totalConflicts++;
        
        // Sort by severity priority
        const severityPriority: Record<string, number> = {
          'critical': 4,
          'high': 3,
          'medium': 2,
          'low': 1,
        };

        strategies.sort((a, b) => {
          const priorityA = severityPriority[a.severity] || 0;
          const priorityB = severityPriority[b.severity] || 0;
          
          // If same severity, prioritize by phase (lower phase number = higher priority)
          if (priorityA === priorityB) {
            return a.phaseSource - b.phaseSource;
          }
          
          return priorityB - priorityA;
        });

        // Keep highest priority strategy, mark others as conflict-resolved
        const highestPriority = strategies[0];
        const conflicting = strategies.slice(1);
        
        for (const conflict of conflicting) {
          conflict.conflictStatus = 'conflict-resolved';
          conflict.conflictingStrategies.push(highestPriority.strategyId);
          resolvedConflicts++;
        }
      }
    }

    return { totalConflicts, resolvedConflicts };
  }

  /**
   * Detects circular fixes (strategies that cancel each other)
   *
   * @private
   * @param strategiesByPhase - Strategies grouped by phase
   * @returns Circular fix detection result
   */
  private detectCircularFixes(strategiesByPhase: Map<number, FixStrategy[]>): {
    circularFixCount: number;
  } {
    const allStrategies: FixStrategy[] = [];
    let circularFixCount = 0;

    // Flatten all strategies
    for (const strategies of strategiesByPhase.values()) {
      allStrategies.push(...strategies);
    }

    // Detect circular patterns
    for (let i = 0; i < allStrategies.length; i++) {
      for (let j = i + 1; j < allStrategies.length; j++) {
        const strategyA = allStrategies[i];
        const strategyB = allStrategies[j];

        // Check if strategies are in the same file
        if (strategyA.filePath !== strategyB.filePath) continue;

        // Check for circular patterns (add vs remove)
        const isCircular = this.checkCircularPattern(strategyA, strategyB);
        
        if (isCircular) {
          console.log(`WARNING Circular fix detected between ${strategyA.strategyId} and ${strategyB.strategyId}`);
          strategyA.safeLevel = 5;
          strategyB.safeLevel = 5;
          strategyA.requiresHumanIntervention = true;
          strategyB.requiresHumanIntervention = true;
          circularFixCount++;
        }
      }
    }

    return { circularFixCount };
  }

  /**
   * Checks if two strategies form a circular pattern
   *
   * @private
   * @param strategyA - First strategy
   * @param strategyB - Second strategy
   * @returns boolean - Whether circular pattern detected
   */
  private checkCircularPattern(strategyA: FixStrategy, strategyB: FixStrategy): boolean {
    // Check for add vs remove patterns
    const addAction = ['add', 'create', 'insert', 'append'];
    const removeAction = ['remove', 'delete', 'clear', 'eliminate'];

    const actionA = strategyA.suggestedAction.toLowerCase();
    const actionB = strategyB.suggestedAction.toLowerCase();

    const isAddA = addAction.some(word => actionA.includes(word));
    const isRemoveA = removeAction.some(word => actionA.includes(word));
    const isAddB = addAction.some(word => actionB.includes(word));
    const isRemoveB = removeAction.some(word => actionB.includes(word));

    // If one adds and the other removes, it's potentially circular
    if ((isAddA && isRemoveB) || (isRemoveA && isAddB)) {
      // Check if they target the same element (e.g., same variable, same import)
      return strategyA.findingType === strategyB.findingType;
    }

    return false;
  }

  /**
   * Applies Dependency Blast Radius to protect high-traffic files
   *
   * PUNTO 3: Dependency Blast Radius
   * 
   * LÓGICA:
   * 1. Para cada estrategia, contar cuántos archivos importan el archivo afectado
   * 2. Si un archivo es importado por >10 archivos (High-Traffic File), elevar Safe Level a 4
   * 3. Esto protege archivos centrales del sistema de cambios automáticos arriesgados
   * 
   * @private
   * @param strategiesByPhase - Strategies grouped by phase
   */
  private applyDependencyBlastRadius(strategiesByPhase: Map<number, FixStrategy[]>): void {
    const importMap = this.buildImportMap();

    for (const strategies of strategiesByPhase.values()) {
      for (const strategy of strategies) {
        if (!(strategy as any).filePath) continue;

        const importCount = importMap.get((strategy as any).filePath) || 0;
        
        // If file is imported by >10 files, elevate Safe Level to 4
        if (importCount > 10) {
          console.log(`INFO High-Traffic File detected: ${(strategy as any).filePath} (${importCount} imports). Elevating Safe Level to 4.`);
          (strategy as any).safeLevel = Math.max((strategy as any).safeLevel, 4);
          if ((strategy as any).safeLevel === 5) {
            (strategy as any).requiresHumanIntervention = true;
          }
        }
      }
    }
  }

  /**
   * Builds a map of file import counts (Dependency Blast Radius)
   *
   * @private
   * @returns Map<string, number> - File path to import count mapping
   */
  private buildImportMap(): Map<string, number> {
    const importMap = new Map<string, number>();
    const sourceFiles = this.findSourceFiles();

    for (const sourceFile of sourceFiles) {
      try {
        const content = fs.readFileSync(sourceFile, 'utf-8');
        

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
              // Try to find the actual file (with extensions)
              const extensions = ['.ts', '.tsx', '.js', '.jsx', '.json'];
              for (const ext of extensions) {
                if (fs.existsSync(resolvedPath + ext)) {
                  resolvedPath += ext;
                  break;
                }
              }
            } else {
              // Node modules or absolute import, skip
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
   * Performs AST-Preflight Check to verify file has no syntax errors
   *
   * @private
   * @param filePath - File path to check
   * @returns { passed: boolean; error?: string } - Preflight check result
   */
  private performASTPreflightCheck(filePath: string): { passed: boolean; error?: string } {
    try {
      const fullPath = path.join(this.config.projectRoot, filePath);
      const content = fs.readFileSync(fullPath, 'utf-8');
      const ext = path.extname(filePath).toLowerCase();

      // Basic syntax validation for TypeScript/JavaScript files
      if (['.ts', '.tsx', '.js', '.jsx'].includes(ext)) {
        const stack: string[] = [];
        const pairs = { '(': ')', '[': ']', '{': '}' };
        
        for (const char of content) {
          if (char in pairs) {
            stack.push(char);
          } else if (Object.values(pairs).includes(char)) {
            const last = stack.pop();
            if (last && pairs[last as keyof typeof pairs] !== char) {
              return { passed: false, error: 'Unmatched brackets/braces detected' };
            }
          }
        }
        
        if (stack.length !== 0) {
          return { passed: false, error: 'Unmatched brackets/braces detected' };
        }
      }

      return { passed: true };
    } catch {
      return { passed: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Serializes strategies to disk for OOM prevention
   *
   * @private
   * @param result - Fix strategy generation result
   * @returns Promise<void>
   */
  private async serializeStrategiesToDisk(result: FixStrategyGenerationResult): Promise<void> {
    try {
      const tempDir = path.join(this.config.projectRoot, '.sentinel', 'temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      const tempFile = path.join(tempDir, `strategies-${Date.now()}.json`);
      const serialized = JSON.stringify(result, null, 2);
      fs.writeFileSync(tempFile, serialized, 'utf-8');
      
      console.log(`INFO Strategies serialized to disk: ${tempFile}`);
    } catch {
      console.warn('WARNING Failed to serialize strategies to disk:', error instanceof Error ? error.message : error);
    }
  }

  /**
   * Flushes the strategy cache to free memory
   *
   * @private
   */
  private flushStrategyCache(): void {
    this.strategyCache.clear();
    this.cacheFlushCount++;
    console.log('INFO Strategy cache flushed');
  }
}











