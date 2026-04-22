/**
 * Phase 7: Testing Strategy
 *
 * Purpose: Evaluate test infrastructure and detect testing blind spots.
 * Focus on Core Path coverage, test quality, and integration vs unit tests.
 *
 * Architecture:
 * - Test Coverage & Presence: Critical Gap Detection for Core Path
 * - Test Quality & Smells: Empty Tests, Logic in Tests, Hardcoded Mocks
 * - Integration vs Unit: Integration tests detection (especially for Fintech)
 *
 * @module phases/phase-7-testing-strategy
 * @since 2.0.0
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { StatePersistence, type ExecutionState } from '../core/state-persistence.js';
import { FileFilter } from '../core/file-filter.js';
import { IgnoreHandler } from '../core/ignore-handler.js';

/**
 * Testing finding
 */
interface TestingFinding {
  /** Unique ID based on file hash + line */
  id: string;
  /** Finding type */
  type: 'missing-test' | 'empty-test' | 'logic-in-test' | 'hardcoded-mock' | 'missing-integration-test' | 'test-quality' | 'fragile-test' | 'lazy-testing' | 'urgent-testing-debt' | 'flaky-test' | 'environment-leak';
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
  /** Test file path (if applicable) */
  testFilePath?: string;
}

/**
 * Phase 7 configuration
 */
interface Phase7Config {
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
 * Phase 7 result
 */
export interface Phase7Result {
  /** Overall success */
  success: boolean;
  /** Testing findings */
  findings: TestingFinding[];
  /** Total critical findings */
  criticalFindings: number;
  /** Total high severity findings */
  highSeverityFindings: number;
  /** Files analyzed */
  filesAnalyzed: number;
  /** Test files found */
  testFilesFound: number;
  /** Execution time in milliseconds */
  executionTimeMs: number;
  /** Error if failed */
  error?: string;
}

/**
 * Phase 7: Testing Strategy
 *
 * This phase evaluates test infrastructure and detects testing blind spots.
 * Focuses on Core Path coverage, test quality, and integration vs unit tests.
 *
 * @class Phase7TestingStrategy
 * @example
 * ```typescript
 * const phase7 = new Phase7TestingStrategy({
 *   projectRoot: '/path/to/project',
 *   statePersistence: new StatePersistence('/path/to/project'),
 *   currentState: executionState,
 * });
 * const result = await phase7.execute();
 * ```
 */
export class Phase7TestingStrategy {
  private config: Phase7Config;

  constructor(config: Phase7Config) {
    this.config = config;
  }

  /**
   * Executes Phase 7: Testing Strategy
   *
   * @returns Promise<Phase7Result> - Testing strategy analysis result
   */
  async execute(): Promise<Phase7Result> {
    const startTime = Date.now();
    console.log('���� Phase 7: Testing Strategy\n');

    try {
      // Get BusinessProfile from Phase 2 for domain context and Critical Modules
      const businessProfile = this.config.statePersistence.getAnalysisResults(2, this.config.currentState);
      const domain = businessProfile?.domain || 'General';
      const criticalModules = businessProfile?.corePaths || [];
      const isFintech = domain === 'Fintech';

      console.log(`��Ļ Domain Context: ${domain}${isFintech ? ' (Fintech - Strict Mode for Integration Tests)' : ''}\n`);
      console.log(`��Ļ Context: ${criticalModules.length} Critical Modules from Phase 2\n`);

      // Get Phase 1 results for Cross-Phase Coverage Gap
      const phase1Results = this.config.statePersistence.getAnalysisResults(1, this.config.currentState);
      const complexityScores = phase1Results?.complexityScores || {};

      // Scan for source files and test files
      const sourceFiles = await this.scanSourceFiles();
      const testFiles = await this.scanTestFiles();

      console.log(`���� Analyzing ${sourceFiles.length} source files and ${testFiles.length} test files...\n`);

      const findings: TestingFinding[] = [];

      // 1. Test Coverage & Presence: Critical Gap Detection
      const coverageFindings = this.analyzeTestCoverage(sourceFiles, testFiles, criticalModules);
      findings.push(...coverageFindings);

      // 2. Test Quality & Smells (including Theater Testing checks)
      for (const testFile of testFiles) {
        const qualityFindings = await this.analyzeTestQuality(testFile, criticalModules);
        findings.push(...qualityFindings);
      }

      // 3. Integration vs Unit detection
      const integrationFindings = this.analyzeIntegrationTests(testFiles, isFintech);
      findings.push(...integrationFindings);

      // 4. Cross-Phase Coverage Gap: High Complexity + no unit test = URGENT
      const crossPhaseFindings = this.analyzeCrossPhaseCoverageGap(sourceFiles, testFiles, complexityScores, criticalModules);
      findings.push(...crossPhaseFindings);

      const criticalFindings = findings.filter(f => f.severity === 'critical').length;
      const highSeverityFindings = findings.filter(f => f.severity === 'high').length;

      const result: Phase7Result = {
        success: true,
        findings,
        criticalFindings,
        highSeverityFindings,
        filesAnalyzed: sourceFiles.length,
        testFilesFound: testFiles.length,
        executionTimeMs: Date.now() - startTime,
      };

      await this.config.statePersistence.storeAnalysisResults(7, result, this.config.currentState);
      await this.writePartialReport(result, domain);
      await this.config.statePersistence.saveState(this.config.currentState);

      console.log(`ԣ� Phase 7 Complete`);
      console.log(`  ���� Total findings: ${findings.length}`);
      console.log(`  ��ܿ Critical findings: ${criticalFindings}`);
      console.log(`  ��ᴩ�  High severity findings: ${highSeverityFindings}`);
      console.log(`  ���� Source files: ${sourceFiles.length}, Test files: ${testFiles.length}\n`);

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`��� Phase 7 failed: ${errorMessage}\n`);

      const result: Phase7Result = {
        success: false,
        findings: [],
        criticalFindings: 0,
        highSeverityFindings: 0,
        filesAnalyzed: 0,
        testFilesFound: 0,
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
  private async scanSourceFiles(): Promise<string[]> {
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

        // Skip test files
        if (file.includes('/test/') || 
            file.includes('/tests/') ||
            file.includes('__tests__') ||
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
   * Scans for test files
   *
   * @private
   * @returns Promise<string[]> - Array of test file paths
   */
  private async scanTestFiles(): Promise<string[]> {
    const fileFilter = this.config.fileFilter || new FileFilter();
    const ignoreHandler = this.config.ignoreHandler || new IgnoreHandler({ projectRoot: this.config.projectRoot });

    const patterns = [
      '**/*.test.ts',
      '**/*.test.js',
      '**/*.spec.ts',
      '**/*.spec.js',
      '**/__tests__/**/*.ts',
      '**/__tests__/**/*.js',
      'test/**/*.ts',
      'test/**/*.js',
      'tests/**/*.ts',
      'tests/**/*.js',
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

        const filterResult = fileFilter.shouldAnalyzeFile(file);
        if (filterResult.shouldAnalyze) {
          allFiles.push(file);
        }
      }
    }

    return Array.from(new Set(allFiles));
  }

  /**
   * Analyzes test coverage and detects critical gaps
   *
   * @private
   * @param sourceFiles - Source file paths
   * @param testFiles - Test file paths
   * @param criticalModules - Critical modules from Phase 2
   * @returns TestingFinding[] - Coverage findings
   */
  private analyzeTestCoverage(sourceFiles: string[], testFiles: string[], criticalModules: string[]): TestingFinding[] {
    const findings: TestingFinding[] = [];

    // Create a map of test files for quick lookup
    const testFileMap = new Map<string, string>();
    for (const testFile of testFiles) {
      const baseName = path.basename(testFile).replace(/\.(test|spec)\.(ts|js)$/, '');
      const dirName = path.dirname(testFile);
      testFileMap.set(`${dirName}/${baseName}`, testFile);
    }

    // Check for missing tests in Critical Modules
    for (const sourceFile of sourceFiles) {
      const baseName = path.basename(sourceFile, path.extname(sourceFile));
      const dirName = path.dirname(sourceFile);
      const testKey = `${dirName}/${baseName}`;

      const hasTest = testFileMap.has(testKey) || 
                      testFiles.some(tf => tf.includes(baseName));

      if (!hasTest && criticalModules.includes(sourceFile)) {
        findings.push({
          id: this.generateFindingId(sourceFile, undefined, 'missing-test'),
          type: 'missing-test',
          severity: 'critical',
          filePath: sourceFile,
          description: '��ܿ CRITICAL: Core Path file without associated test',
          suggestion: 'This file is in the Core Path and has no test coverage. Create a test file to ensure critical business logic is shielded.',
        });
      }
    }

    return findings;
  }

  /**
   * Analyzes test quality and detects smells
   *
   * @private
   * @param testFilePath - Test file path
   * @param criticalModules - Critical modules from Phase 2
   * @returns Promise<TestingFinding[]> - Quality findings
   */
  private async analyzeTestQuality(testFilePath: string, criticalModules: string[]): Promise<TestingFinding[]> {
    const findings: TestingFinding[] = [];

    try {
      const content = fs.readFileSync(testFilePath, 'utf-8');
      const fileHash = this.computeHash(content);
      const lines = content.split('\n');

      // 1. Empty Tests: Tests without expect or assert
      const testPattern = /(?:test|it|describe)\s*\(/g;
      let testMatch: RegExpExecArray | null;
      while ((testMatch = testPattern.exec(content)) !== null) {
        const matchIndex = testMatch.index;
        const lineNumber = content.slice(0, matchIndex).split('\n').length;

        // Look ahead to check if there's an expect or assert
        const nextLines = content.slice(matchIndex, matchIndex + 500);
        const hasExpect = /expect\s*\(/.test(nextLines) || /assert\./.test(nextLines);

        if (!hasExpect) {
          findings.push({
            id: this.generateFindingId(fileHash, lineNumber, 'empty-test'),
            type: 'empty-test',
            severity: 'medium',
            filePath: testFilePath,
            line: lineNumber,
            description: 'Empty test detected (no expect or assert)',
            suggestion: 'Add expect/assert statements to verify actual behavior. Tests without assertions give false confidence.',
          });
        }
      }

      // 2. Logic in Tests: Tests with too much logic (ifs, loops)
      const ifPattern = /\bif\s*\(/g;
      const ifCount = (content.match(ifPattern) || []).length;
      const loopPattern = /\b(for|while)\s*\(/g;
      const loopCount = (content.match(loopPattern) || []).length;

      if (ifCount > 3 || loopCount > 1) {
        findings.push({
          id: this.generateFindingId(fileHash, undefined, 'logic-in-test'),
          type: 'logic-in-test',
          severity: 'medium',
          filePath: testFilePath,
          description: `Test contains too much logic (${ifCount} ifs, ${loopCount} loops)`,
          suggestion: 'Tests should be simple and declarative. Extract complex logic into helper functions or fixtures.',
        });
      }

      // 3. Hardcoded Mocks: Giant mocks that could become outdated
      const mockPattern = /mock\(|jest\.fn\(|vi\.fn\(/g;
      const mockCount = (content.match(mockPattern) || []).length;
      
      if (mockCount > 5) {
        findings.push({
          id: this.generateFindingId(fileHash, undefined, 'hardcoded-mock'),
          type: 'hardcoded-mock',
          severity: 'low',
          filePath: testFilePath,
          description: `Test contains many mocks (${mockCount}) that could become outdated`,
          suggestion: 'Consider using factory functions or fixtures to manage mock data. Large hardcoded mocks are maintenance burden.',
        });
      }

      // 4. Mock Fragility Check: More mock lines than execution/expectations
      const mockLines = lines.filter(line => 
        line.includes('mock(') || 
        line.includes('jest.fn(') || 
        line.includes('vi.fn(') ||
        line.includes('mockReturnValue') ||
        line.includes('mockResolvedValue')
      ).length;
      
      const executionLines = lines.filter(line => 
        line.includes('expect(') || 
        line.includes('assert.') ||
        line.includes('it(') ||
        line.includes('test(')
      ).length;

      if (mockLines > executionLines && mockLines > 10) {
        findings.push({
          id: this.generateFindingId(fileHash, undefined, 'fragile-test'),
          type: 'fragile-test',
          severity: 'medium',
          filePath: testFilePath,
          description: `Fragile Test: More mock lines (${mockLines}) than execution/expectations (${executionLines})`,
          suggestion: 'This test depends heavily on mocks and will break with minor changes. Consider using test doubles or real implementations for better stability.',
        });
      }

      // 5. Snapshot Overuse: toMatchSnapshot without validation in Core Path
      const snapshotCount = (content.match(/toMatchSnapshot\(/g) || []).length;
      const hasPropertyValidation = /expect\([^)]+\)\.to(HaveProperty|MatchObject|StrictEqual)/.test(content);
      
      if (snapshotCount > 3 && !hasPropertyValidation) {
        const isCriticalTest = criticalModules.some(cm => testFilePath.includes(cm));
        const severity = isCriticalTest ? 'medium' : 'low';
        
        findings.push({
          id: this.generateFindingId(fileHash, undefined, 'lazy-testing'),
          type: 'lazy-testing',
          severity,
          filePath: testFilePath,
          description: `Lazy Testing: Excessive snapshot usage (${snapshotCount} snapshots) without property validation${isCriticalTest ? ' in Critical Module' : ''}`,
          suggestion: isCriticalTest
            ? 'This is in the Critical Path. Replace snapshots with specific property validations. Snapshots are lazy and can hide regressions.'
            : 'Consider replacing snapshots with specific property validations. Snapshots can hide regressions when they silently update.',
        });
      }

      // 6. Flaky Test Indicators: setTimeout, waitFor with hardcoded times, manual retry
      const hasSetTimeout = /\bsetTimeout\s*\(/.test(content);
      const hasWaitFor = /waitFor\s*\(\s*\d+/.test(content); // waitFor with hardcoded number
      const hasRetry = /retry\s*\(/.test(content) || /retries\s*:\s*\d+/.test(content);

      if (hasSetTimeout || hasWaitFor || hasRetry) {
        findings.push({
          id: this.generateFindingId(fileHash, undefined, 'flaky-test'),
          type: 'flaky-test',
          severity: 'medium',
          filePath: testFilePath,
          description: 'Potential Flakiness: Test uses setTimeout, waitFor with hardcoded times, or manual retry',
          suggestion: 'Avoid hardcoded timeouts and manual retries. Use proper async/await patterns and wait for conditions instead of arbitrary delays.',
        });
      }

      // 7. Environment Leak: Using real .env without mocking
      const hasEnvAccess = /process\.env\./.test(content);
      const hasEnvMock = /mock\(['"`]process\.env['"`]\)/.test(content) || 
                        /jest\.spyOn\(process,\s*['"`]env['"`]\)/.test(content);

      if (hasEnvAccess && !hasEnvMock) {
        findings.push({
          id: this.generateFindingId(fileHash, undefined, 'environment-leak'),
          type: 'environment-leak',
          severity: 'medium',
          filePath: testFilePath,
          description: 'Environment Leak: Test accesses process.env without mocking',
          suggestion: 'Mock environment variables to ensure tests are isolated and deterministic. Use .env.test or setup mocks for process.env.',
        });
      }

      return findings;
    } catch (error) {
      console.warn(`��ᴩ�  Failed to analyze test file ${testFilePath}:`, error instanceof Error ? error.message : error);
      return [];
    }
  }

  /**
   * Analyzes cross-phase coverage gap (High Complexity + no unit test = URGENT)
   *
   * @private
   * @param sourceFiles - Source file paths
   * @param testFiles - Test file paths
   * @param complexityScores - Complexity scores from Phase 1
   * @param criticalModules - Critical modules from Phase 2
   * @returns TestingFinding[] - Cross-phase coverage findings
   */
  private analyzeCrossPhaseCoverageGap(sourceFiles: string[], testFiles: string[], complexityScores: Record<string, number>, criticalModules: string[]): TestingFinding[] {
    const findings: TestingFinding[] = [];

    // Create a map of test files for quick lookup
    const testFileMap = new Map<string, string>();
    for (const testFile of testFiles) {
      const baseName = path.basename(testFile).replace(/\.(test|spec)\.(ts|js)$/, '');
      const dirName = path.dirname(testFile);
      testFileMap.set(`${dirName}/${baseName}`, testFile);
    }

    // Check for high complexity files without tests
    for (const sourceFile of sourceFiles) {
      const complexity = complexityScores[sourceFile] || 0;

      if (complexity > 15 && criticalModules.includes(sourceFile)) {
        const baseName = path.basename(sourceFile, path.extname(sourceFile));
        const dirName = path.dirname(sourceFile);
        const testKey = `${dirName}/${baseName}`;

        const hasTest = testFileMap.has(testKey) || 
                        testFiles.some(tf => tf.includes(baseName));

        if (!hasTest) {
          findings.push({
            id: this.generateFindingId(sourceFile, undefined, 'urgent-testing-debt'),
            type: 'urgent-testing-debt',
            severity: 'critical',
            filePath: sourceFile,
            description: `��ܿ URGENT TESTING DEBT: High complexity (${complexity}) Core Path file without unit test`,
            suggestion: 'This file has high complexity and is in the Core Path. Create comprehensive unit tests to cover all logical branches. High complexity without tests is a ticking time bomb.',
          });
        }
      }
    }

    return findings;
  }

  /**
   * Analyzes integration vs unit tests
   *
   * @private
   * @param testFiles - Test file paths
   * @param isFintech - Whether domain is Fintech
   * @returns TestingFinding[] - Integration test findings
   */
  private analyzeIntegrationTests(testFiles: string[], isFintech: boolean): TestingFinding[] {
    const findings: TestingFinding[] = [];

    let hasIntegrationTests = false;
    let hasUnitTests = false;

    for (const testFile of testFiles) {
      try {
        const content = fs.readFileSync(testFile, 'utf-8');
        
        // Integration tests typically touch DB, API, or external services
        if (content.includes('database') || 
            content.includes('db.') ||
            content.includes('prisma.') ||
            content.includes('mongoose.') ||
            content.includes('axios') ||
            content.includes('fetch') ||
            content.includes('supertest') ||
            content.includes('@testing-library') ||
            content.includes('integration') ||
            content.includes('e2e')) {
          hasIntegrationTests = true;
        } else {
          hasUnitTests = true;
        }
      } catch {
        // Skip files that can't be read
      }
    }

    if (hasUnitTests && !hasIntegrationTests) {
      const severity = isFintech ? 'high' : 'medium';
      findings.push({
        id: this.generateFindingId('project', undefined, 'missing-integration-test'),
        type: 'missing-integration-test',
        severity,
        filePath: 'project',
        description: isFintech 
          ? '��ܿ Fintech domain without integration tests detected'
          : 'No integration tests detected, only unit tests',
        suggestion: isFintech
          ? 'For Fintech, integration tests are critical. Add tests that touch the database and API to ensure data integrity and transaction correctness.'
          : 'Consider adding integration tests to verify that components work together correctly.',
      });
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
   * Writes partial report for Phase 7
   *
   * @private
   * @param result - Phase 7 result
   * @param domain - Business domain
   */
  private async writePartialReport(result: Phase7Result, domain: string): Promise<void> {
    try {
      const reportPath = path.join(this.config.projectRoot, 'qa-report.partial.md');
      const timestamp = new Date().toISOString();

      // Group findings by type
      const findingsByType = new Map<string, TestingFinding[]>();
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
## Phase 7: Testing Strategy - ԣ� PASSED
- **Timestamp:** ${timestamp}
- **Execution Time:** ${result.executionTimeMs}ms
- **Domain:** ${domain}

### Testing Summary
- **Total Findings:** ${result.findings.length}
- **Critical Findings:** ${result.criticalFindings}
- **High Severity Findings:** ${result.highSeverityFindings}
- **Source Files:** ${result.filesAnalyzed}
- **Test Files:** ${result.testFilesFound}

### Findings by Type
${findingsContent || 'No testing issues detected.'}

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


