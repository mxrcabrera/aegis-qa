/**
 * Phase 8: Performance & Scalability
 *
 * Purpose: Detect bottlenecks, memory leaks, and patterns that impede scaling.
 * Focus on resource leaks, computational waste, and scalability patterns.
 *
 * Architecture:
 * - Resource Leaks: useEffect cleanup, eventListeners, subscriptions, DB connections
 * - Computational Waste: Heavy Computations, Re-render Hell
 * - Scalability Patterns: Blocking Sync, Caching
 *
 * @module phases/phase-8-performance
 * @since 2.0.0
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { StatePersistence, type ExecutionState } from '../core/state-persistence.js';
import { FileFilter } from '../core/file-filter.js';
import { IgnoreHandler } from '../core/ignore-handler.js';

/**
 * Performance finding
 */
interface PerformanceFinding {
  /** Unique ID based on file hash + line */
  id: string;
  /** Finding type */
  type: 'resource-leak' | 'heavy-computation' | 're-render-hell' | 'blocking-sync' | 'missing-cache' | 'performance-issue';
  /** Severity: low, medium, high, critical */
  severity: 'low' | 'medium' | 'high' | 'critical';
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
 * Phase 8 configuration
 */
interface Phase8Config {
  /** Project root directory */
  projectRoot: string;
  /** State persistence for storing results */
  statePersistence: StatePersistence;
  /** Current execution state */
  currentState: ExecutionState;
  /** File filter for filtering files */
  fileFilter?: FileFilter;
  /** Ignore handler for filtering */
  ignoreHandler?: IgnoreHandler;
}

/**
 * Phase 8 result
 */
export interface Phase8Result {
  /** Overall success */
  success: boolean;
  /** Performance findings */
  findings: PerformanceFinding[];
  /** Total critical findings */
  criticalFindings: number;
  /** Total high severity findings */
  highSeverityFindings: number;
  /** Files analyzed */
  filesAnalyzed: number;
  /** Execution time in milliseconds */
  executionTimeMs: number;
  /** Error if failed */
  error?: string;
}

/**
 * Phase 8: Performance & Scalability
 *
 * This phase detects bottlenecks, memory leaks, and patterns that impede scaling.
 * Focuses on resource leaks, computational waste, and scalability patterns.
 *
 * @class Phase8Performance
 * @example
 * ```typescript
 * const phase8 = new Phase8Performance({
 *   projectRoot: '/path/to/project',
 *   statePersistence: new StatePersistence('/path/to/project'),
 *   currentState: executionState,
 * });
 * const result = await phase8.execute();
 * ```
 */
export class Phase8Performance {
  private config: Phase8Config;

  constructor(config: Phase8Config) {
    this.config = config;
  }

  /**
   * Executes Phase 8: Performance & Scalability
   *
   * @returns Promise<Phase8Result> - Performance analysis result
   */
  async execute(): Promise<Phase8Result> {
    const startTime = Date.now();
    console.log('��� Phase 8: Performance & Scalability\n');

    try {
      // Get Phase 2 results for Critical Modules and Domain context
      const businessProfile = this.config.statePersistence.getAnalysisResults(2, this.config.currentState);
      const criticalModules = businessProfile?.corePaths || [];
      const domain = businessProfile?.domain || 'General';
      const isFintech = domain === 'Fintech';

      // Get Phase 1 results for complexity scores
      const phase1Results = this.config.statePersistence.getAnalysisResults(1, this.config.currentState);
      const complexityScores = phase1Results?.complexityScores || {};

      // Get Phase 4 results for Caching context
      const phase4Results = this.config.statePersistence.getAnalysisResults(4, this.config.currentState);
      const databaseFindings = phase4Results?.findings || [];

      console.log(`��Ļ Domain Context: ${domain}${isFintech ? ' (Fintech - Strict Mode for Performance)' : ''}\n`);
      console.log(`��Ļ Context: ${criticalModules.length} Critical Modules from Phase 2\n`);
      console.log(`���� Context: ${Object.keys(complexityScores).length} complexity scores from Phase 1\n`);
      console.log(`���� Context: ${databaseFindings.length} database findings from Phase 4\n`);

      // Scan for source files
      const files = await this.scanFiles();

      if (files.length === 0) {
        console.log('��ᴩ�  No source files found for analysis\n');
        
        const result: Phase8Result = {
          success: true,
          findings: [],
          criticalFindings: 0,
          highSeverityFindings: 0,
          filesAnalyzed: 0,
          executionTimeMs: Date.now() - startTime,
        };

        await this.config.statePersistence.storeAnalysisResults(8, result, this.config.currentState);
        await this.writePartialReport(result);
        await this.config.statePersistence.saveState(this.config.currentState);

        return result;
      }

      console.log(`���� Analyzing ${files.length} source files...\n`);

      const findings: PerformanceFinding[] = [];

      for (const file of files) {
        const fileFindings = await this.analyzeFile(file, databaseFindings, criticalModules, complexityScores, isFintech);
        findings.push(...fileFindings);
      }

      const criticalFindings = findings.filter(f => f.severity === 'critical').length;
      const highSeverityFindings = findings.filter(f => f.severity === 'high').length;

      const result: Phase8Result = {
        success: true,
        findings,
        criticalFindings,
        highSeverityFindings,
        filesAnalyzed: files.length,
        executionTimeMs: Date.now() - startTime,
      };

      await this.config.statePersistence.storeAnalysisResults(8, result, this.config.currentState);
      await this.writePartialReport(result);
      await this.config.statePersistence.saveState(this.config.currentState);

      console.log(`ԣ� Phase 8 Complete`);
      console.log(`  ���� Total findings: ${findings.length}`);
      console.log(`  ��ܿ Critical findings: ${criticalFindings}`);
      console.log(`  ��ᴩ�  High severity findings: ${highSeverityFindings}\n`);

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`��� Phase 8 failed: ${errorMessage}\n`);

      const result: Phase8Result = {
        success: false,
        findings: [],
        criticalFindings: 0,
        highSeverityFindings: 0,
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

        // Skip test files, mocks, seeds
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
   * Analyzes a single file for performance issues
   *
   * @private
   * @param filePath - File path
   * @param databaseFindings - Database findings from Phase 4
   * @param criticalModules - Critical modules from Phase 2
   * @param complexityScores - Complexity scores from Phase 1
   * @param isFintech - Whether domain is Fintech
   * @returns Promise<PerformanceFinding[]> - Performance findings
   */
  private async analyzeFile(filePath: string, databaseFindings: unknown[], criticalModules: string[], complexityScores: Record<string, number>, isFintech: boolean): Promise<PerformanceFinding[]> {
    const findings: PerformanceFinding[] = [];

    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const fileHash = this.computeHash(content);

      // 1. Resource Leaks
      const leakFindings = this.analyzeResourceLeaks(filePath, content, fileHash, criticalModules, isFintech);
      findings.push(...leakFindings);

      // 2. Computational Waste
      const wasteFindings = this.analyzeComputationalWaste(filePath, content, fileHash, criticalModules, complexityScores);
      findings.push(...wasteFindings);

      // 3. Scalability Patterns
      const scalabilityFindings = this.analyzeScalabilityPatterns(filePath, content, fileHash, databaseFindings, criticalModules, isFintech);
      findings.push(...scalabilityFindings);

      return findings;
    } catch (error) {
      console.warn(`��ᴩ�  Failed to analyze ${filePath}:`, error instanceof Error ? error.message : error);
      return [];
    }
  }

  /**
   * Analyzes resource leaks (useEffect cleanup, eventListeners, subscriptions, DB connections)
   *
   * @private
   * @param filePath - File path
   * @param content - File content
   * @param fileHash - File hash
   * @param criticalModules - Critical modules from Phase 2
   * @param isFintech - Whether domain is Fintech
   * @returns PerformanceFinding[] - Resource leak findings
   */
  private analyzeResourceLeaks(filePath: string, content: string, fileHash: string, criticalModules: string[], isFintech: boolean): PerformanceFinding[] {
    const findings: PerformanceFinding[] = [];
    const isCriticalModule = criticalModules.includes(filePath);

    // React useEffect cleanup
    const useEffectPattern = /useEffect\s*\(\s*\([^)]*\)\s*,\s*\[\s*\]\s*\)/g;
    let useEffectMatch: RegExpExecArray | null;
    while ((useEffectMatch = useEffectPattern.exec(content)) !== null) {
      const matchIndex = useEffectMatch.index;
      const nextLines = content.slice(matchIndex, matchIndex + 500);
      
      // Check if there's a return statement for cleanup
      const hasCleanup = /return\s+/.test(nextLines);

      // Check if effect has event listeners or subscriptions
      const hasEventListeners = /addEventListener|subscribe|on\(/.test(nextLines);

      if (hasEventListeners && !hasCleanup) {
        const lineNumber = content.slice(0, matchIndex).split('\n').length;
        // Context-aware severity: Critical Module or Fintech = higher severity
        const severity = (isCriticalModule || isFintech) ? 'critical' : 'high';
        
        findings.push({
          id: this.generateFindingId(fileHash, lineNumber, 'resource-leak'),
          type: 'resource-leak',
          severity,
          filePath,
          line: lineNumber,
          description: isCriticalModule 
            ? `��ܿ CRITICAL: useEffect with eventListeners/subscriptions missing cleanup in Critical Module`
            : 'useEffect with eventListeners/subscriptions missing cleanup function',
          suggestion: isCriticalModule
            ? 'This is in the Critical Path. Add a cleanup function immediately. Missing cleanup causes memory leaks that will crash production.'
            : 'Add a cleanup function to useEffect to remove event listeners and unsubscribe from observables. Missing cleanup causes memory leaks.',
        });
      }
    }

    // Event listeners without cleanup
    const addEventListenerPattern = /addEventListener\s*\(/g;
    let addEventListenerMatch: RegExpExecArray | null;
    while ((addEventListenerMatch = addEventListenerPattern.exec(content)) !== null) {
      const matchIndex = addEventListenerMatch.index;
      const lineNumber = content.slice(0, matchIndex).split('\n').length;

      // Look for removeEventListener in the same scope
      const nextLines = content.slice(matchIndex, matchIndex + 200);
      const hasRemove = /removeEventListener/.test(nextLines);

      if (!hasRemove) {
        const severity = (isCriticalModule || isFintech) ? 'critical' : 'high';
        findings.push({
          id: this.generateFindingId(fileHash, lineNumber, 'resource-leak'),
          type: 'resource-leak',
          severity,
          filePath,
          line: lineNumber,
          description: isCriticalModule
            ? `��ܿ CRITICAL: addEventListener without corresponding removeEventListener in Critical Module`
            : 'addEventListener without corresponding removeEventListener',
          suggestion: isCriticalModule
            ? 'This is in the Critical Path. Always remove event listeners to prevent memory leaks that will crash production.'
            : 'Always remove event listeners when they are no longer needed to prevent memory leaks.',
        });
      }
    }

    // DB connections without close
    const dbConnectionPattern = /connect\(|createConnection\(|open\(/g;
    let dbConnectionMatch: RegExpExecArray | null;
    while ((dbConnectionMatch = dbConnectionPattern.exec(content)) !== null) {
      const matchIndex = dbConnectionMatch.index;
      const lineNumber = content.slice(0, matchIndex).split('\n').length;

      // Look for close in the same scope
      const nextLines = content.slice(matchIndex, matchIndex + 200);
      const hasClose = /close\(|disconnect\(|end\(/.test(nextLines);

      if (!hasClose) {
        // DB connection leaks are always critical, especially in Fintech or Critical Module
        findings.push({
          id: this.generateFindingId(fileHash, lineNumber, 'resource-leak'),
          type: 'resource-leak',
          severity: 'critical',
          filePath,
          line: lineNumber,
          description: isFintech
            ? `��ܿ CRITICAL: Database connection without close/disconnect in Fintech domain`
            : 'Database connection without corresponding close/disconnect',
          suggestion: isFintech
            ? 'Fintech requires strict resource management. Always close database connections to prevent connection pool exhaustion. This will crash production under load.'
            : 'Always close database connections to prevent connection pool exhaustion. Use try-finally or cleanup functions.',
        });
      }
    }

    return findings;
  }

  /**
   * Analyzes computational waste (Heavy Computations, Re-render Hell)
   *
   * @private
   * @param filePath - File path
   * @param content - File content
   * @param fileHash - File hash
   * @param criticalModules - Critical modules from Phase 2
   * @param complexityScores - Complexity scores from Phase 1
   * @returns PerformanceFinding[] - Computational waste findings
   */
  private analyzeComputationalWaste(filePath: string, content: string, fileHash: string, criticalModules: string[], complexityScores: Record<string, number>): PerformanceFinding[] {
    const findings: PerformanceFinding[] = [];
    const isCriticalModule = criticalModules.includes(filePath);
    const complexity = complexityScores[filePath] || 0;

    // Heavy Computations: Large loops or data transformations on main thread
    const forPattern = /\bfor\s*\(/g;
    const forCount = (content.match(forPattern) || []).length;
    const whilePattern = /\bwhile\s*\(/g;
    const whileCount = (content.match(whilePattern) || []).length;
    const mapPattern = /\.map\s*\(/g;
    const mapCount = (content.match(mapPattern) || []).length;
    const filterPattern = /\.filter\s*\(/g;
    const filterCount = (content.match(filterPattern) || []).length;
    const reducePattern = /\.reduce\s*\(/g;
    const reduceCount = (content.match(reducePattern) || []).length;

    const totalTransformations = mapCount + filterCount + reduceCount;

    // Critical Path Focus: Only report if it will actually freeze the app under load
    // Thresholds: More loops/transformations or high complexity
    if (forCount > 5 || whileCount > 3 || totalTransformations > 10) {
      // Context-aware severity: High complexity + Critical Module = CRITICAL
      let severity: 'low' | 'medium' | 'high' | 'critical' = 'medium';
      let description = `Heavy computation detected (${forCount} for loops, ${whileCount} while loops, ${totalTransformations} transformations)`;
      let suggestion = 'Consider moving heavy computations to Web Workers or background processes. Avoid blocking the main thread.';

      if (complexity > 15 && isCriticalModule) {
        severity = 'critical';
        description = `��ܿ CRITICAL: Heavy computation in High Complexity (${complexity}) Critical Module - This will freeze the app under load`;
        suggestion = 'This file has high complexity AND is in the Critical Path. Heavy computations here will freeze the entire application under load. Move to Web Workers immediately.';
      } else if (complexity > 10 || isCriticalModule) {
        severity = 'high';
        description = `Heavy computation detected${isCriticalModule ? ' in Critical Module' : ''}${complexity > 10 ? ` with high complexity (${complexity})` : ''}`;
        suggestion = isCriticalModule 
          ? 'This is in the Critical Path. Heavy computations here will block the main thread. Consider moving to Web Workers or background processes.'
          : 'File has high complexity. Heavy computations here risk blocking the main thread. Consider moving to Web Workers.';
      }

      findings.push({
        id: this.generateFindingId(fileHash, undefined, 'heavy-computation'),
        type: 'heavy-computation',
        severity,
        filePath,
        description,
        suggestion,
      });
    }

    // Re-render Hell: React components without memo/useMemo/useCallback for large lists
    const isReactFile = filePath.endsWith('.tsx') || filePath.endsWith('.jsx');
    if (isReactFile) {
      const hasComponent = /function\s+\w+\s*\(|const\s+\w+\s*=\s*\([^)]*\)\s*=>/.test(content);
      const hasListHandling = /\.map\s*\(/.test(content) || content.includes('Array');
      const hasMemo = /memo\(|useMemo\(|useCallback\(/.test(content);

      if (hasComponent && hasListHandling && !hasMemo) {
        const severity = isCriticalModule ? 'high' : 'medium';
        findings.push({
          id: this.generateFindingId(fileHash, undefined, 're-render-hell'),
          type: 're-render-hell',
          severity,
          filePath,
          description: isCriticalModule
            ? `Re-render Hell in Critical Module: React component handling lists without memo/useMemo/useCallback`
            : 'React component handling lists without memo/useMemo/useCallback',
          suggestion: isCriticalModule
            ? 'This is in the Critical Path. Unnecessary re-renders here will kill performance. Use memo, useMemo, or useCallback immediately.'
            : 'Use memo, useMemo, or useCallback to prevent unnecessary re-renders when handling large lists.',
        });
      }
    }

    return findings;
  }

  /**
   * Analyzes scalability patterns (Blocking Sync, Caching)
   *
   * @private
   * @param filePath - File path
   * @param content - File content
   * @param fileHash - File hash
   * @param databaseFindings - Database findings from Phase 4
   * @param criticalModules - Critical modules from Phase 2
   * @param isFintech - Whether domain is Fintech
   * @returns PerformanceFinding[] - Scalability pattern findings
   */
  private analyzeScalabilityPatterns(filePath: string, content: string, fileHash: string, databaseFindings: unknown[], criticalModules: string[], isFintech: boolean): PerformanceFinding[] {
    const findings: PerformanceFinding[] = [];
    const isCriticalModule = criticalModules.includes(filePath);

    // Blocking Synchronization: readFileSync instead of readFile
    const syncPattern = /readFileSync|writeFileSync|existsSync|mkdirSync/g;
    let syncMatch: RegExpExecArray | null;
    while ((syncMatch = syncPattern.exec(content)) !== null) {
      const matchIndex = syncMatch.index;
      const lineNumber = content.slice(0, matchIndex).split('\n').length;

      // Context-aware severity: Critical Module or Fintech = CRITICAL
      const severity = (isCriticalModule || isFintech) ? 'critical' : 'high';
      
      findings.push({
        id: this.generateFindingId(fileHash, lineNumber, 'blocking-sync'),
        type: 'blocking-sync',
        severity,
        filePath,
        line: lineNumber,
        description: isFintech
          ? `��ܿ CRITICAL: Blocking synchronous file operation in Fintech domain`
          : isCriticalModule
          ? `��ܿ CRITICAL: Blocking synchronous file operation in Critical Module`
          : 'Blocking synchronous file operation detected',
        suggestion: isFintech
          ? 'Fintech requires strict non-blocking I/O. Use async file operations (readFile, writeFile) immediately. Blocking operations will crash production under load.'
          : isCriticalModule
          ? 'This is in the Critical Path. Use async file operations (readFile, writeFile) instead of synchronous versions to avoid blocking the event loop.'
          : 'Use async file operations (readFile, writeFile) instead of synchronous versions to avoid blocking the event loop.',
      });
    }

    // Missing Caching in heavy endpoints or recurring queries
    if (databaseFindings.length > 0) {
      const hasQuery = /query\(|findMany\(|findAll\(|select\(/.test(content);
      const hasCache = /cache|Cache|memoize|lru-cache/.test(content);

      if (hasQuery && !hasCache) {
        const severity = isCriticalModule ? 'high' : 'medium';
        findings.push({
          id: this.generateFindingId(fileHash, undefined, 'missing-cache'),
          type: 'missing-cache',
          severity,
          filePath,
          description: isCriticalModule
            ? 'Database query without caching mechanism in Critical Module'
            : 'Database query without caching mechanism',
          suggestion: isCriticalModule
            ? 'This is in the Critical Path. Implement caching for recurring database queries to reduce load and improve response times. Missing cache here will kill performance under load.'
            : 'Consider implementing caching for recurring database queries to reduce load and improve response times.',
        });
      }
    }

    return findings;
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
   * Writes partial report for Phase 8
   *
   * @private
   * @param result - Phase 8 result
   */
  private async writePartialReport(result: Phase8Result): Promise<void> {
    try {
      const reportPath = path.join(this.config.projectRoot, 'qa-report.partial.md');
      const timestamp = new Date().toISOString();

      // Group findings by type
      const findingsByType = new Map<string, PerformanceFinding[]>();
      for (const finding of result.findings) {
        if (!findingsByType.has(finding.type)) {
          findingsByType.set(finding.type, []);
        }
        findingsByType.get(finding.type)!.push(finding);
      }

      let findingsContent = '';
      for (const [type, findings] of findingsByType) {
        findingsContent += `
### ${type.charAt(0).toUpperCase() + type.slice(1).replace(/-/g, ' ')} (${findings.length})
`;
        for (const finding of findings) {
          findingsContent += `- [${finding.id}] **${finding.severity.toUpperCase()}** ${finding.filePath}`;
          if (finding.line) {
            findingsContent += `:${finding.line}`;
          }
          findingsContent += `\n  - ${finding.description}\n`;
        }
      }

      const reportContent = `
## Phase 8: Performance & Scalability - ԣ� PASSED
- **Timestamp:** ${timestamp}
- **Execution Time:** ${result.executionTimeMs}ms

### Performance Summary
- **Total Findings:** ${result.findings.length}
- **Critical Findings:** ${result.criticalFindings}
- **High Severity Findings:** ${result.highSeverityFindings}

### Findings by Type
${findingsContent || 'No performance issues detected.'}

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

      console.log(`���� Partial report written: ${reportPath}`);
    } catch (error) {
      console.warn('��ᴩ�  Failed to write partial report:', error instanceof Error ? error.message : error);
    }
  }
}


