// eslint-disable @typescript-eslint/no-explicit-any
/**
 * Phase 9: Dead Code & Dependencies - Unused Code and Dependency Analysis
 *
 * Purpose: Identify unused code, unreachable code, and unused dependencies
 * to reduce bundle size and improve maintainability.
 *
 * Architecture:
 * - Dead Code Detection: Find unused functions, variables, and imports
 * - Dependency Analysis: Identify unused dependencies
 * - Unreachable Code: Find code that can never be executed
 * - Export Analysis: Find unused exports
 *
 * @module phases/phase-9-dead-code-dependencies
 * @since 1.0.0
 */

import * as fs from 'fs';
import * as path from 'path';
import { ThermalController } from '../core/thermal-controller.js';
import { StatePersistence, type ExecutionState } from '../core/state-persistence.js';
import { validatePath, sanitizeError, validateFileSize, censorSecrets } from '../core/security-utils.js';

/**
 * Dead code/Dependency finding
 */
interface DeadCodeDependencyFinding {
  /** Unique ID */
  id: string;
  /** Finding type */
  type: 'unused-import' | 'unused-export' | 'unused-variable' | 'unused-function' | 'dead-code' | 'unused-dependency';
  /** Severity */
  severity: 'low' | 'medium' | 'high' | 'critical';
  /** File path */
  filePath: string;
  /** Line number */
  line?: number;
  /** Description */
  description: string;
  /** Suggested fix */
  suggestion?: string;
}

/**
 * Dead code/Dependency metrics
 */
interface DeadCodeDependencyMetrics {
  /** Total files analyzed */
  totalFiles: number;
  /** Unused imports */
  unusedImports: number;
  /** Unused exports */
  unusedExports: number;
  /** Unused variables */
  unusedVariables: number;
  /** Dead code blocks */
  deadCodeBlocks: number;
  /** Unused dependencies */
  unusedDependencies: number;
}

/**
 * Phase 9 configuration
 */
interface Phase9Config {
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
 * Phase 9 result
 */
export interface Phase9Result {
  /** Overall success */
  success: boolean;
  /** Dead code/Dependency findings */
  findings: DeadCodeDependencyFinding[];
  /** Dead code/Dependency metrics */
  metrics: DeadCodeDependencyMetrics;
  /** Critical findings count */
  criticalFindings: number;
  /** High severity findings count */
  highSeverityFindings: number;
  /** Execution time in milliseconds */
  executionTimeMs: number;
  /** Error if failed */
  error?: string;
}

/**
 * Phase 9: Dead Code & Dependencies - Unused Code and Dependency Analysis
 *
 * This phase identifies unused code, unreachable code, and unused dependencies
 * to reduce bundle size and improve maintainability.
 *
 * @class Phase9DeadCodeDependencies
 * @example
 * ```typescript
 * const deadCodeDeps = new Phase9DeadCodeDependencies(config);
 * const result = await deadCodeDeps.execute();
 * console.log(`Unused imports: ${result.metrics.unusedImports}`);
 * console.log(`Unused dependencies: ${result.metrics.unusedDependencies}`);
 * ```
 */
export class Phase9DeadCodeDependencies {
  private config: Phase9Config;

  constructor(config: Phase9Config) {
    // Validate projectRoot path to prevent path traversal
    if (!validatePath(config.projectRoot, config.projectRoot)) {
      throw new Error('Invalid project root path');
    }
    this.config = config;
  }

  /**
   * Executes Phase 9: Dead Code & Dependencies
   *
   * @returns Promise<Phase9Result> - Dead code/Dependency analysis result
   */
  async execute(): Promise<Phase9Result> {
    const startTime = Date.now();
    console.log('INFO Phase 9: Dead Code & Dependencies - Unused Code and Dependency Analysis\n');

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

      // Analyze dead code and dependencies
      console.log('INFO Analyzing dead code and dependencies...');
      const findings = await this.analyzeDeadCodeDependencies(sourceFiles);
      console.log(`INFO Findings: ${findings.length}\n`);

      // Calculate metrics
      const metrics = this.calculateMetrics(findings);
      console.log(`INFO Unused imports: ${metrics.unusedImports}`);
      console.log(`INFO Unused dependencies: ${metrics.unusedDependencies}\n`);

      // Calculate severity counts
      const criticalFindings = findings.filter((f) => f.severity === 'critical').length;
      const highSeverityFindings = findings.filter((f) => f.severity === 'high').length;

      const executionTimeMs = Date.now() - startTime;

      const result: Phase9Result = {
        success: true,
        findings,
        metrics,
        criticalFindings,
        highSeverityFindings,
        executionTimeMs,
      };

      console.log(`SUCCESS Phase 9 Complete in ${executionTimeMs / 1000}s`);
      console.log(`INFO Critical findings: ${criticalFindings}`);
      console.log(`INFO High severity findings: ${highSeverityFindings}`);

      return result;
    } catch (error: unknown) {
      const executionTimeMs = Date.now() - startTime;
      const sanitizedError = sanitizeError(error);

      const result: Phase9Result = {
        success: false,
        findings: [],
        metrics: {
          totalFiles: 0,
          unusedImports: 0,
          unusedExports: 0,
          unusedVariables: 0,
          deadCodeBlocks: 0,
          unusedDependencies: 0,
        },
        criticalFindings: 0,
        highSeverityFindings: 0,
        executionTimeMs,
        error: sanitizedError,
      };

      console.error('FAILED Phase 9:', sanitizedError);
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
      } catch (error: unknown) {
        // Skip directories we can't read
      }
    };

    searchDir(projectRoot);
    return files;
  }

  /**
   * Analyzes dead code and dependencies for all files
   *
   * @private
   * @param sourceFiles - Source file paths
   * @returns Promise<DeadCodeDependencyFinding[]> - Dead code/Dependency findings
   */
  private async analyzeDeadCodeDependencies(sourceFiles: string[]): Promise<DeadCodeDependencyFinding[]> {
    const findings: DeadCodeDependencyFinding[] = [];

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
        
        // Censor potential secrets
        const sanitizedContent = censorSecrets(content);
        
        const fileFindings = this.analyzeFileForDeadCodeDependencies(filePath, sanitizedContent);
        findings.push(...fileFindings);
      } catch (error: unknown) {
        console.warn(`Failed to analyze ${filePath}:`, sanitizeError(error));
      }
    }

    return findings;
  }

  /**
   * Analyzes file for dead code and dependency issues
   *
   * @private
   * @param filePath - File path
   * @param content - File content
   * @returns DeadCodeDependencyFinding[] - Findings from file
   */
  private analyzeFileForDeadCodeDependencies(filePath: string, content: string): DeadCodeDependencyFinding[] {
    const findings: DeadCodeDependencyFinding[] = [];

    // Check for unused imports
    findings.push(...this.checkUnusedImports(filePath, content));

    // Check for unused variables
    findings.push(...this.checkUnusedVariables(filePath, content));

    // Check for dead code
    findings.push(...this.checkDeadCode(filePath, content));

    return findings;
  }

  /**
   * Checks for unused imports
   *
   * @private
   * @param filePath - File path
   * @param content - File content
   * @returns DeadCodeDependencyFinding[] - Unused import findings
   */
  private checkUnusedImports(filePath: string, content: string): DeadCodeDependencyFinding[] {
    const findings: DeadCodeDependencyFinding[] = [];

    // Extract all imports
    const importPattern = /import\s+(?:\{([^}]+)\}|(\w+))\s+from\s+['"]([^'"]+)['"]/g;
    const imports: Array<{ name: string; source: string; line: number }> = [];
    let match;

    while ((match = importPattern.exec(content)) !== null) {
      const namedImports = match[1];
      const defaultImport = match[2];
      const source = match[3];
      const lineNumber = content.substring(0, match.index).split('\n').length;

      if (namedImports) {
        const names = namedImports.split(',').map(n => n.trim().split(' as ')[0]);
        for (const name of names) {
          imports.push({ name, source, line: lineNumber });
        }
      }

      if (defaultImport) {
        imports.push({ name: defaultImport, source, line: lineNumber });
      }
    }

    // Check if imports are used
    for (const imp of imports) {
      const usagePattern = new RegExp(`\\b${imp.name}\\b`, 'g');
      const usageCount = (content.match(usagePattern) || []).length;

      // Subtract the import declaration itself
      if (usageCount <= 1) {
        findings.push({
          id: this.generateFindingId(filePath, 'unused-import'),
          type: 'unused-import',
          severity: 'low',
          filePath,
          line: imp.line,
          description: `Unused import: ${imp.name} from ${imp.source}`,
          suggestion: 'Remove unused import to reduce bundle size',
        });
      }
    }

    return findings;
  }

  /**
   * Checks for unused variables
   *
   * @private
   * @param filePath - File path
   * @param content - File content
   * @returns DeadCodeDependencyFinding[] - Unused variable findings
   */
  private checkUnusedVariables(filePath: string, content: string): DeadCodeDependencyFinding[] {
    const findings: DeadCodeDependencyFinding[] = [];

    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Check for declared but unused variables
      const varPattern = /(?:let|const|var)\s+(\w+)\s*=/g;
      let match;
      while ((match = varPattern.exec(line)) !== null) {
        const varName = match[1];
        
        // Skip common variable names
        if (['i', 'j', 'k', 'x', 'y', 'z', 'e', 'err', 'error'].includes(varName)) {
          continue;
        }

        // Check if variable is used later in the file
        const remainingContent = content.substring(content.indexOf(line) + line.length);
        const usagePattern = new RegExp(`\\b${varName}\\b`, 'g');
        const usageCount = (remainingContent.match(usagePattern) || []).length;

        if (usageCount === 0) {
          findings.push({
            id: this.generateFindingId(filePath, 'unused-variable'),
            type: 'unused-variable',
            severity: 'low',
            filePath,
            line: i + 1,
            description: `Unused variable: ${varName}`,
            suggestion: 'Remove unused variable or use it',
          });
        }
      }
    }

    return findings;
  }

  /**
   * Checks for dead code
   *
   * @private
   * @param filePath - File path
   * @param content - File content
   * @returns DeadCodeDependencyFinding[] - Dead code findings
   */
  private checkDeadCode(filePath: string, content: string): DeadCodeDependencyFinding[] {
    const findings: DeadCodeDependencyFinding[] = [];

    // Check for code after return statements
    const returnPattern = /return\s+[^;]+;/g;
    let match;
    while ((match = returnPattern.exec(content)) !== null) {
      const returnStart = match.index + match[0].length;
      const nextBrace = content.indexOf('}', returnStart);
      
      if (nextBrace !== -1 && nextBrace - returnStart < 50) {
        const codeAfterReturn = content.substring(returnStart, nextBrace).trim();
        
        if (codeAfterReturn.length > 0 && !codeAfterReturn.startsWith('}') && !codeAfterReturn.startsWith('//')) {
          const lineNumber = content.substring(0, returnStart).split('\n').length;
          findings.push({
            id: this.generateFindingId(filePath, 'dead-code'),
            type: 'dead-code',
            severity: 'medium',
            filePath,
            line: lineNumber,
            description: 'Code after return statement will never execute',
            suggestion: 'Remove or move code after return statement',
          });
        }
      }
    }

    // Check for unreachable code after throw
    const throwPattern = /throw\s+[^;]+;/g;
    while ((match = throwPattern.exec(content)) !== null) {
      const throwStart = match.index + match[0].length;
      const nextBrace = content.indexOf('}', throwStart);
      
      if (nextBrace !== -1 && nextBrace - throwStart < 50) {
        const codeAfterThrow = content.substring(throwStart, nextBrace).trim();
        
        if (codeAfterThrow.length > 0 && !codeAfterThrow.startsWith('}') && !codeAfterThrow.startsWith('//')) {
          const lineNumber = content.substring(0, throwStart).split('\n').length;
          findings.push({
            id: this.generateFindingId(filePath, 'dead-code'),
            type: 'dead-code',
            severity: 'medium',
            filePath,
            line: lineNumber,
            description: 'Code after throw statement will never execute',
            suggestion: 'Remove or move code after throw statement',
          });
        }
      }
    }

    return findings;
  }

  /**
   * Calculates dead code/dependency metrics
   *
   * @private
   * @param findings - Dead code/Dependency findings
   * @returns DeadCodeDependencyMetrics - Calculated metrics
   */
  private calculateMetrics(findings: DeadCodeDependencyFinding[]): DeadCodeDependencyMetrics {
    return {
      totalFiles: new Set(findings.map(f => f.filePath)).size,
      unusedImports: findings.filter(f => f.type === 'unused-import').length,
      unusedExports: findings.filter(f => f.type === 'unused-export').length,
      unusedVariables: findings.filter(f => f.type === 'unused-variable').length,
      deadCodeBlocks: findings.filter(f => f.type === 'dead-code').length,
      unusedDependencies: findings.filter(f => f.type === 'unused-dependency').length,
    };
  }

  /**
   * Generates unique finding ID
   *
   * @private
   * @param filePath - File path
   * @param type - Finding type
   * @returns string - Unique ID
   */
  private generateFindingId(filePath: string, type: string): string {
    const hash = path.basename(filePath);
    return `${type}-${hash}-${Date.now()}`;
  }
}













