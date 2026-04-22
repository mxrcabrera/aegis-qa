// eslint-disable @typescript-eslint/no-explicit-any
/**
 * Phase 5: Clean Code & Refactoring
 *
 * Purpose: Evaluate readability, maintainability, and adherence to SOLID/DRY principles.
 * Detect real technical debt, not just style issues.
 *
 * Architecture:
 * - SOLID & Design Patterns: God Objects, Open/Closed violations
 * - Code Smells: Deep Nesting, Magic Numbers, Long Parameter List
 * - Refactoring Suggestions: Low Quality Score + Critical Module
 *
 * @module phases/phase-5-clean-code
 * @since 2.0.0
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { StatePersistence, type ExecutionState } from '../core/state-persistence.js';
import { ThermalController } from '../core/thermal-controller.js';
import { FileFilter } from '../core/file-filter.js';
import { IgnoreHandler } from '../core/ignore-handler.js';

/**
 * Clean code finding
 */
interface CleanCodeFinding {
  /** Unique ID based on file hash + line */
  id: string;
  /** Finding type */
  type: 'god-object' | 'open-closed-violation' | 'deep-nesting' | 'magic-number' | 'long-parameter-list' | 'refactoring-suggestion';
  /** Severity: low, medium, high */
  severity: 'low' | 'medium' | 'high';
  /** File path */
  filePath: string;
  /** Line number */
  line?: number;
  /** Description of the issue */
  description: string;
  /** Suggested fix */
  suggestion?: string;
}

/**
 * Phase 5 configuration
 */
interface Phase5Config {
  /** Project root directory */
  projectRoot: string;
  /** State persistence for storing results */
  statePersistence: StatePersistence;
  /** Current execution state */
  currentState: ExecutionState;
  /** Thermal controller for batch intelligence */
  thermalController?: ThermalController;
  /** File filter for filtering files */
  fileFilter?: FileFilter;
  /** Ignore handler for filtering */
  ignoreHandler?: IgnoreHandler;
}

/**
 * Phase 5 result
 */
export interface Phase5Result {
  /** Overall success */
  success: boolean;
  /** Clean code findings */
  findings: CleanCodeFinding[];
  /** Total high severity findings */
  highSeverityFindings: number;
  /** Total medium severity findings */
  mediumSeverityFindings: number;
  /** Files analyzed */
  filesAnalyzed: number;
  /** Execution time in milliseconds */
  executionTimeMs: number;
  /** Error if failed */
  error?: string;
}

/**
 * Phase 5: Clean Code & Refactoring
 *
 * This phase evaluates readability, maintainability, and adherence to SOLID/DRY principles.
 * Detects real technical debt, not just style issues.
 *
 * @class Phase5CleanCode
 * @example
 * ```typescript
 * const phase5 = new Phase5CleanCode({
 *   projectRoot: '/path/to/project',
 *   statePersistence: new StatePersistence('/path/to/project'),
 *   currentState: executionState,
 * });
 * const result = await phase5.execute();
 * ```
 */
export class Phase5CleanCode {
  private config: Phase5Config;

  constructor(config: Phase5Config) {
    this.config = config;
  }

  /**
   * Executes Phase 5: Clean Code
   *
   * @returns Promise<Phase5Result> - Clean code analysis result
   */
  async execute(): Promise<Phase5Result> {
    const startTime = Date.now();
    console.log('Ô£¿ Phase 5: Clean Code & Refactoring\n');

    try {
      // Get BusinessProfile from Phase 2 for Critical Modules
      const businessProfile = this.config.statePersistence.getAnalysisResults(2, this.config.currentState);
      const criticalModules = businessProfile?.corePaths || [];
      
      // Get Phase 1 results for Quality Scores
      const phase1Results = this.config.statePersistence.getAnalysisResults(1, this.config.currentState);
      const qualityScores = phase1Results?.fileScores || {};

      console.log(`­ƒÄ» Context: ${criticalModules.length} Critical Modules from Phase 2\n`);
      console.log(`­ƒôè Context: ${Object.keys(qualityScores).length} Quality Scores from Phase 1\n`);

      // Batch Intelligence: Check if ThermalController is throttled
      let isThrottled = false;
      if (this.config.thermalController) {
        const systemResources = await this.config.thermalController.checkSystemResources();
        isThrottled = systemResources.cpuUsage > 80 || systemResources.ramUsage > 80;
        
        if (isThrottled) {
          console.log(`ÔÜí Batch Intelligence Mode: CPU ${systemResources.cpuUsage}%, RAM ${systemResources.ramUsage}%`);
          console.log(`   Prioritizing Clean Code analysis on files with Phase 1 score < 70\n`);
        }
      }

      // Scan for source files
      const files = await this.scanFiles();

      if (files.length === 0) {
        console.log('ÔÜá´©Å  No source files found for analysis\n');
        
        const result: Phase5Result = {
          success: true,
          findings: [],
          highSeverityFindings: 0,
          mediumSeverityFindings: 0,
          filesAnalyzed: 0,
          executionTimeMs: Date.now() - startTime,
        };

        await this.config.statePersistence.storeAnalysisResults(5, result, this.config.currentState);
        await this.writePartialReport(result);
        await this.config.statePersistence.saveState(this.config.currentState);

        return result;
      }

      // Batch Intelligence: Filter files based on Phase 1 scores if throttled
      let filesToAnalyze = files;
      let liteScanMode = false;
      
      if (isThrottled) {
        // Prioritize files with score < 70
        const lowScoreFiles = files.filter(f => (qualityScores[f] || 100) < 70);
        
        if (lowScoreFiles.length > 0) {
          filesToAnalyze = lowScoreFiles;
          liteScanMode = false;
          console.log(`   Analyzing ${filesToAnalyze.length} low-score files (full scan)\n`);
        } else {
          // If no low-score files, do lite scan on all files
          filesToAnalyze = files;
          liteScanMode = true;
          console.log(`   No low-score files found. Performing lite scan on all ${filesToAnalyze.length} files\n`);
        }
      }

      console.log(`­ƒôé Analyzing ${filesToAnalyze.length} source files${liteScanMode ? ' (Lite Scan Mode)' : ''}...\n`);

      const findings: CleanCodeFinding[] = [];

      for (const file of filesToAnalyze) {
        const fileFindings = await this.analyzeFile(file, criticalModules, qualityScores, liteScanMode);
        findings.push(...fileFindings);
      }

      const highSeverityFindings = findings.filter(f => f.severity === 'high').length;
      const mediumSeverityFindings = findings.filter(f => f.severity === 'medium').length;

      const result: Phase5Result = {
        success: true,
        findings,
        highSeverityFindings,
        mediumSeverityFindings,
        filesAnalyzed: files.length,
        executionTimeMs: Date.now() - startTime,
      };

      await this.config.statePersistence.storeAnalysisResults(5, result, this.config.currentState);
      await this.writePartialReport(result);
      await this.config.statePersistence.saveState(this.config.currentState);

      console.log(`Ô£à Phase 5 Complete`);
      console.log(`  ­ƒöì Total findings: ${findings.length}`);
      console.log(`  ­ƒÜ¿ High severity findings: ${highSeverityFindings}`);
      console.log(`  ÔÜá´©Å  Medium severity findings: ${mediumSeverityFindings}\n`);

      return result;
    } catch {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`ÔØî Phase 5 failed: ${errorMessage}\n`);

      const result: Phase5Result = {
        success: false,
        findings: [],
        highSeverityFindings: 0,
        mediumSeverityFindings: 0,
        filesAnalyzed: 0,
        executionTimeMs: Date.now() - startTime,
        error: errorMessage,
      };

      return result;
    }
  }

  /**
   * Scans for source files
   *
   * @private
   * @returns Promise<string[]> - Array of file paths
   */
  private async scanFiles(): Promise<string[]> {
    const fileFilter = this.config.fileFilter || new FileFilter();
    const ignoreHandler = this.config.ignoreHandler || new IgnoreHandler({ projectRoot: this.config.projectRoot });

    const patterns = [
      'src/**/*.ts',
      'src/**/*.tsx',
      'src/**/*.js',
      'src/**/*.jsx',
      'lib/**/*.ts',
      'lib/**/*.js',
    ];

    const allFiles: string[] = [];

    for (const pattern of patterns) {
      const { glob } = await import('glob');
      const files = await glob(pattern, {
        cwd: this.config.projectRoot,
        absolute: true,
      });

      for (const file of files) {
        if (ignoreHandler.shouldIgnore(file)) {
          continue;
        }

        // Mock & Seed Exclusion: Ignore test files, mocks, seeds
        if (file.includes('/test/') || 
            file.includes('/tests/') ||
            file.includes('/mocks/') || 
            file.includes('/mock/') ||
            file.includes('seed.') ||
            file.endsWith('.test.ts') ||
            file.endsWith('.test.js') ||
            file.endsWith('.spec.ts') ||
            file.endsWith('.spec.js')) {
          continue;
        }

        const filterResult = fileFilter.shouldAnalyzeFile(file);
        if (filterResult.shouldAnalyze) {
          allFiles.push(file);
        }
      }
    }

    return Array.from(new Set(allFiles));
  }

  /**
   * Analyzes a single file for clean code issues
   *
   * @private
   * @param filePath - File path
   * @param criticalModules - Critical modules from Phase 2
   * @param qualityScores - Quality scores from Phase 1
   * @returns Promise<CleanCodeFinding[]> - Clean code findings
   */
  private async analyzeFile(filePath: string, criticalModules: string[], qualityScores: Record<string, number>, liteScanMode: boolean): Promise<CleanCodeFinding[]> {
    const findings: CleanCodeFinding[] = [];

    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const fileHash = this.computeHash(content);

      // Check if file is in critical module
      const isCriticalModule = criticalModules.includes(filePath);
      const qualityScore = qualityScores[filePath] || 0;
      
      // Get Phase 1 complexity for Cyclomatic-Complexity Bridge
      const phase1Results = this.config.statePersistence.getAnalysisResults(1, this.config.currentState);
      const complexity = phase1Results?.complexityScores?.[filePath] || 0;

      // 1. SOLID & Design Patterns (skip in lite scan mode)
      if (!liteScanMode) {
        const solidFindings = this.analyzeSOLID(filePath, content, fileHash, isCriticalModule);
        findings.push(...solidFindings);
      }

      // 2. Code Smells (with Context-Aware Magic Numbers and Cyclomatic-Complexity Bridge)
      const codeSmellFindings = this.analyzeCodeSmells(filePath, content, fileHash, isCriticalModule, complexity);
      findings.push(...codeSmellFindings);

      // 3. Refactoring Suggestions (Low Quality Score + Critical Module)
      if (isCriticalModule && qualityScore < 60) {
        const refactoringSuggestion = {
          id: this.generateFindingId(fileHash, undefined, 'refactoring-suggestion'),
          type: 'refactoring-suggestion' as const,
          severity: 'high' as const,
          filePath,
          description: `Critical Module with low Quality Score (${qualityScore}/100). This file is a maintenance trap.`,
          suggestion: 'Consider refactoring this file to improve maintainability. Break down large functions, reduce complexity, and improve test coverage.',
        };
        findings.push(refactoringSuggestion);
      }

      return findings;
    } catch {
      console.warn(`ÔÜá´©Å  Failed to analyze ${filePath}:`, error instanceof Error ? error.message : error);
      return [];
    }
  }

  /**
   * Computes SHA-1 hash of file content
   *
   * @private
   * @param content - File content
   * @returns string - SHA-1 hash
   */
  private computeHash(content: string): string {
    return crypto.createHash('sha1').update(content).digest('hex');
  }

  /**
   * Generates unique ID for a finding
   *
   * @private
   * @param fileHash - SHA-1 hash of file content
   * @param line - Line number
   * @param type - Finding type
   * @returns string - Unique ID
   */
  private generateFindingId(fileHash: string, line: number | undefined, type: string): string {
    const lineStr = line !== undefined ? line.toString() : '0';
    return `${fileHash.substring(0, 8)}-${lineStr}-${type}`;
  }

  /**
   * Analyzes SOLID principles and design patterns
   *
   * @private
   * @param filePath - File path
   * @param content - File content
   * @param fileHash - File hash
   * @returns CleanCodeFinding[] - SOLID findings
   */
  private analyzeSOLID(filePath: string, content: string, fileHash: string, isCriticalModule: boolean): CleanCodeFinding[] {
    const findings: CleanCodeFinding[] = [];
    const lines = content.split('\n');

    // Single Responsibility: God Objects (based on size and import count)
    const lineCount = lines.length;
    const importCount = (content.match(/^import\s+/gm) || []).length;

    // God Object: Large file with many imports
    if (lineCount > 500 && importCount > 15) {
      // Refactor ROI: God Object in Critical Module = URGENT REFACTOR
      if (isCriticalModule) {
        findings.push({
          id: this.generateFindingId(fileHash, undefined, 'god-object'),
          type: 'god-object',
          severity: 'high',
          filePath,
          description: `­ƒÜ¿ URGENT REFACTOR: God Object in Critical Module - ${lineCount} lines with ${importCount} imports`,
          suggestion: 'This is in the Core Path and does too many things. Immediate refactoring required. Split into smaller, focused components following Single Responsibility Principle.',
        });
      } else {
        findings.push({
          id: this.generateFindingId(fileHash, undefined, 'god-object'),
          type: 'god-object',
          severity: 'high',
          filePath,
          description: `God Object detected: ${lineCount} lines with ${importCount} imports`,
          suggestion: 'This class/function does too many things. Consider splitting into smaller, focused components following Single Responsibility Principle.',
        });
      }
    } else if (lineCount > 300 && importCount > 10) {
      // Refactor ROI: Elevated severity in Critical Module
      const severity = isCriticalModule ? 'high' : 'medium';
      findings.push({
        id: this.generateFindingId(fileHash, undefined, 'god-object'),
        type: 'god-object',
        severity,
        filePath,
        description: `Potential God Object${isCriticalModule ? ' in Critical Module' : ''}: ${lineCount} lines with ${importCount} imports`,
        suggestion: 'Consider if this class/function has too many responsibilities. Split if possible.',
      });
    }

    // Open/Closed: Giant if/else or switch structures
    const ifElsePattern = /if\s*\([^)]+\)\s*\{[^}]*\}\s*else\s+if\s*\([^)]+\)\s*\{[^}]*\}\s*else\s+if\s*\([^)]+\)/g;
    let ifElseMatch: RegExpExecArray | null;
    while ((ifElseMatch = ifElsePattern.exec(content)) !== null) {
      const matchIndex = ifElseMatch.index;
      const lineNumber = content.slice(0, matchIndex).split('\n').length;

      // Check if there are more than 3 if/else chains
      const ifElseCount = (content.slice(matchIndex, matchIndex + 500).match(/else\s+if/g) || []).length;

      if (ifElseCount >= 3) {
        findings.push({
          id: this.generateFindingId(fileHash, lineNumber, 'open-closed-violation'),
          type: 'open-closed-violation',
          severity: 'medium',
          filePath,
          line: lineNumber,
          description: `Open/Closed violation: ${ifElseCount + 1} chained if/else statements detected`,
          suggestion: 'Consider using polymorphism, strategy pattern, or a lookup table instead of chained if/else statements.',
        });
      }
    }

    // Giant switch statements
    const switchPattern = /switch\s*\([^)]+\)\s*\{[^}]{100,}/g;
    let switchMatch: RegExpExecArray | null;
    while ((switchMatch = switchPattern.exec(content)) !== null) {
      const matchIndex = switchMatch.index;
      const lineNumber = content.slice(0, matchIndex).split('\n').length;

      const caseCount = (switchMatch[0].match(/case\s+/g) || []).length;

      if (caseCount > 5) {
        findings.push({
          id: this.generateFindingId(fileHash, lineNumber, 'open-closed-violation'),
          type: 'open-closed-violation',
          severity: 'medium',
          filePath,
          line: lineNumber,
          description: `Open/Closed violation: Giant switch with ${caseCount} cases detected`,
          suggestion: 'Consider using polymorphism or strategy pattern instead of large switch statements.',
        });
      }
    }

    return findings;
  }

  /**
   * Analyzes code smells
   *
   * @private
   * @param filePath - File path
   * @param content - File content
   * @param fileHash - File hash
   * @returns CleanCodeFinding[] - Code smell findings
   */
  private analyzeCodeSmells(filePath: string, content: string, fileHash: string, _isCriticalModule: boolean, complexity: number): CleanCodeFinding[] {
    const findings: CleanCodeFinding[] = [];
    const lines = content.split('\n');

    // Deep Nesting: Functions with more than 3 levels of indentation
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const indentLevel = line.search(/\S|$/);

      if (indentLevel > 12) { // More than 3 levels (4 spaces per level)
        // Cyclomatic-Complexity Bridge: High complexity + Deep Nesting = CRITICAL
        let severity: 'medium' | 'high' = 'medium';
        if (complexity > 10) {
          severity = 'high';
          findings.push({
            id: this.generateFindingId(fileHash, i + 1, 'deep-nesting'),
            type: 'deep-nesting',
            severity,
            filePath,
            line: i + 1,
            description: `­ƒÜ¿ CRITICAL: Deep nesting (${Math.floor(indentLevel / 4)} levels) with high complexity (${complexity}) - Ticking time bomb for bugs`,
            suggestion: 'This is a critical combination. Immediately refactor to reduce nesting and complexity. Extract nested logic into separate functions.',
          });
        } else {
          findings.push({
            id: this.generateFindingId(fileHash, i + 1, 'deep-nesting'),
            type: 'deep-nesting',
            severity,
            filePath,
            line: i + 1,
            description: `Deep nesting detected (${Math.floor(indentLevel / 4)} levels)`,
            suggestion: 'Consider extracting nested logic into separate functions to improve readability.',
          });
        }
      }
    }

    // Context-Aware Magic Numbers: Ignore /styles, /theme, /constants, .config.ts
    // Only care about magic numbers in business logic (services, repositories)
    const isBusinessLogic = filePath.includes('/services/') || 
                          filePath.includes('/repository/') ||
                          filePath.includes('/repositories/');

    if (isBusinessLogic) {
      const magicNumberPattern = /\b(?!0\b|1\b|-1\b|100\b|true|false|null|undefined)\d{2,}\b/g;
      let magicNumberMatch: RegExpExecArray | null;
      while ((magicNumberMatch = magicNumberPattern.exec(content)) !== null) {
        const matchIndex = magicNumberMatch.index;
        const lineNumber = content.slice(0, matchIndex).split('\n').length;

        // Skip if it's in a comment
        const lineContent = lines[lineNumber - 1];
        if (lineContent.trim().startsWith('//') || lineContent.trim().startsWith('*')) {
          continue;
        }

        findings.push({
          id: this.generateFindingId(fileHash, lineNumber, 'magic-number'),
          type: 'magic-number',
          severity: 'low',
          filePath,
          line: lineNumber,
          description: `Magic number detected in business logic: ${magicNumberMatch[0]}`,
          suggestion: 'Extract magic numbers to named constants for better maintainability.',
        });
      }
    }

    // Long Parameter List: Functions with more than 5 parameters
    const functionPattern = /(?:function|const|let|var)\s+(\w+)\s*(?:\([^)]*\)|\([^)]*\)\s*=>)/g;
    let functionMatch: RegExpExecArray | null;
    while ((functionMatch = functionPattern.exec(content)) !== null) {
      const matchIndex = functionMatch.index;
      const lineNumber = content.slice(0, matchIndex).split('\n').length;

      // Extract the function signature
      const signatureMatch = content.slice(matchIndex, matchIndex + 200).match(/\([^)]*\)/);
      if (signatureMatch) {
        const params = signatureMatch[0].split(',').filter(p => p.trim() !== '' && !p.includes('=>'));
        
        if (params.length > 5) {
          findings.push({
            id: this.generateFindingId(fileHash, lineNumber, 'long-parameter-list'),
            type: 'long-parameter-list',
            severity: 'medium',
            filePath,
            line: lineNumber,
            description: `Long parameter list detected: ${params.length} parameters`,
            suggestion: 'Consider using an options object or splitting the function into smaller functions.',
          });
        }
      }
    }

    return findings;
  }

  /**
   * Writes partial report for Phase 5
   *
   * @private
   * @param result - Phase 5 result
   */
  private async writePartialReport(result: Phase5Result): Promise<void> {
    try {
      const reportPath = path.join(this.config.projectRoot, 'qa-report.partial.md');
      const timestamp = new Date().toISOString();

      // Group findings by type
      const findingsByType = new Map<string, CleanCodeFinding[]>();
      for (const finding of result.findings) {
        if (!findingsByType.has((finding as any).type)) {
          findingsByType.set((finding as any).type, []);
        }
        findingsByType.get((finding as any).type)!.push(finding);
      }

      let findingsContent = '';
      for (const [type, findings] of findingsByType) {
        findingsContent += `
### ${type.charAt(0).toUpperCase() + type.slice(1).replace(/-/g, ' ')} (${findings.length})
`;
        for (const finding of findings) {
          findingsContent += `- [${(finding as any).id}] **${(finding as any).severity.toUpperCase()}** ${(finding as any).filePath}`;
          if ((finding as any).line) {
            findingsContent += `:${(finding as any).line}`;
          }
          findingsContent += `\n  - ${(finding as any).description}\n`;
        }
      }

      const reportContent = `
## Phase 5: Clean Code & Refactoring - Ô£à PASSED
- **Timestamp:** ${timestamp}
- **Execution Time:** ${result.executionTimeMs}ms
- **Files Analyzed:** ${result.filesAnalyzed}

### Clean Code Summary
- **Total Findings:** ${result.findings.length}
- **High Severity Findings:** ${result.highSeverityFindings}
- **Medium Severity Findings:** ${result.mediumSeverityFindings}

### Findings by Type
${findingsContent || 'No clean code issues detected.'}

---

`;

      // Append to partial report
      if (fs.existsSync(reportPath)) {
        fs.appendFileSync(reportPath, reportContent, 'utf-8');
      } else {
        // Create new partial report with header
        const header = `# Aegis QA - Partial Report
Generated: ${timestamp}

`;
        fs.writeFileSync(reportPath, header + reportContent, 'utf-8');
      }

      console.log(`­ƒôØ Partial report written: ${reportPath}`);
    } catch {
      console.warn('ÔÜá´©Å  Failed to write partial report:', error instanceof Error ? error.message : error);
    }
  }
}











