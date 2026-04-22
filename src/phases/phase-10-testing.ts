/**
 * Phase 10: Testing - Test Coverage and Quality Analysis
 *
 * Purpose: Analyze test coverage, test quality, and testing patterns
 * to ensure adequate testing practices and identify gaps.
 *
 * Architecture:
 * - Test Coverage: Check for test coverage percentage
 * - Test Quality: Analyze test patterns and best practices
 * - Missing Tests: Identify untested critical code
 * - Test Organization: Check for proper test structure
 *
 * @module phases/phase-10-testing
 * @since 1.0.0
 */

import * as fs from 'fs';
import * as path from 'path';
import { ThermalController } from '../core/thermal-controller.js';
import { StatePersistence, type ExecutionState } from '../core/state-persistence.js';
import { validatePath, sanitizeError, validateFileSize, censorSecrets } from '../core/security-utils.js';

/**
 * Testing finding
 */
interface TestingFinding {
  /** Unique ID */
  id: string;
  /** Finding type */
  type: 'missing-test' | 'test-coverage' | 'test-quality' | 'test-organization' | 'no-mocks' | 'no-integration-tests';
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
 * Testing metrics
 */
interface TestingMetrics {
  /** Total source files */
  totalSourceFiles: number;
  /** Total test files */
  totalTestFiles: number;
  /** Test coverage percentage */
  testCoverage: number;
  /** Missing tests */
  missingTests: number;
  /** Test quality issues */
  testQualityIssues: number;
}

/**
 * Phase 10 configuration
 */
interface Phase10Config {
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
 * Phase 10 result
 */
export interface Phase10Result {
  /** Overall success */
  success: boolean;
  /** Testing findings */
  findings: TestingFinding[];
  /** Testing metrics */
  metrics: TestingMetrics;
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
 * Phase 10: Testing - Test Coverage and Quality Analysis
 *
 * This phase analyzes test coverage, test quality, and testing patterns
 * to ensure adequate testing practices and identify gaps.
 *
 * @class Phase10Testing
 * @example
 * ```typescript
 * const testing = new Phase10Testing(config);
 * const result = await testing.execute();
 * console.log(`Test coverage: ${result.metrics.testCoverage}%`);
 * console.log(`Missing tests: ${result.metrics.missingTests}`);
 * ```
 */
export class Phase10Testing {
  private config: Phase10Config;

  constructor(config: Phase10Config) {
    // Validate projectRoot path to prevent path traversal
    if (!validatePath(config.projectRoot, config.projectRoot)) {
      throw new Error('Invalid project root path');
    }
    this.config = config;
  }

  /**
   * Executes Phase 10: Testing
   *
   * @returns Promise<Phase10Result> - Testing analysis result
   */
  async execute(): Promise<Phase10Result> {
    const startTime = Date.now();
    console.log('INFO Phase 10: Testing - Test Coverage and Quality Analysis\n');

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

      // Get source and test files
      console.log('INFO Finding source and test files...');
      const sourceFiles = this.getSourceFiles(this.config.projectRoot);
      const testFiles = this.getTestFiles(this.config.projectRoot);
      console.log(`INFO Source files: ${sourceFiles.length}`);
      console.log(`INFO Test files: ${testFiles.length}\n`);

      // Analyze testing
      console.log('INFO Analyzing test coverage and quality...');
      const findings = await this.analyzeTesting(sourceFiles, testFiles);
      console.log(`INFO Findings: ${findings.length}\n`);

      // Calculate metrics
      const metrics = this.calculateMetrics(sourceFiles, testFiles, findings);
      console.log(`INFO Test coverage: ${metrics.testCoverage.toFixed(2)}%`);
      console.log(`INFO Missing tests: ${metrics.missingTests}\n`);

      // Calculate severity counts
      const criticalFindings = findings.filter((f) => f.severity === 'critical').length;
      const highSeverityFindings = findings.filter((f) => f.severity === 'high').length;

      const executionTimeMs = Date.now() - startTime;

      const result: Phase10Result = {
        success: true,
        findings,
        metrics,
        criticalFindings,
        highSeverityFindings,
        executionTimeMs,
      };

      console.log(`SUCCESS Phase 10 Complete in ${executionTimeMs / 1000}s`);
      console.log(`INFO Critical findings: ${criticalFindings}`);
      console.log(`INFO High severity findings: ${highSeverityFindings}`);

      return result;
    } catch (error) {
      const executionTimeMs = Date.now() - startTime;
      const sanitizedError = sanitizeError(error);

      const result: Phase10Result = {
        success: false,
        findings: [],
        metrics: {
          totalSourceFiles: 0,
          totalTestFiles: 0,
          testCoverage: 0,
          missingTests: 0,
          testQualityIssues: 0,
        },
        criticalFindings: 0,
        highSeverityFindings: 0,
        executionTimeMs,
        error: sanitizedError,
      };

      console.error('FAILED Phase 10:', sanitizedError);
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
            // Skip node_modules, .aegis, and test directories
            if (item.name !== 'node_modules' && item.name !== '.aegis' && item.name !== '.git' && !item.name.includes('test') && !item.name.includes('__tests__')) {
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
   * Gets test files from project
   *
   * @private
   * @param projectRoot - Project root directory
   * @returns string[] - Test file paths
   */
  private getTestFiles(projectRoot: string): string[] {
    const files: string[] = [];

    const extensions = ['.test.ts', '.test.tsx', '.test.js', '.test.jsx', '.spec.ts', '.spec.tsx', '.spec.js', '.spec.jsx'];
    
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
   * Analyzes testing for source and test files
   *
   * @private
   * @param sourceFiles - Source file paths
   * @param testFiles - Test file paths
   * @returns Promise<TestingFinding[]> - Testing findings
   */
  private async analyzeTesting(sourceFiles: string[], testFiles: string[]): Promise<TestingFinding[]> {
    const findings: TestingFinding[] = [];

    // Check for missing tests
    findings.push(...this.checkMissingTests(sourceFiles, testFiles));

    // Analyze test quality
    findings.push(...await this.analyzeTestQualityFiles(testFiles));

    return findings;
  }

  /**
   * Analyzes test quality from files
   *
   * @private
   * @param testFiles - Test file paths
   * @returns Promise<TestingFinding[]> - Test quality findings
   */
  private async analyzeTestQualityFiles(testFiles: string[]): Promise<TestingFinding[]> {
    const findings: TestingFinding[] = [];

    for (const filePath of testFiles) {
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
        
        const fileFindings = this.analyzeTestQuality(filePath, sanitizedContent);
        findings.push(...fileFindings);
      } catch (error) {
        console.warn(`Failed to analyze ${filePath}:`, sanitizeError(error));
      }
    }

    return findings;
  }

  /**
   * Checks for missing tests
   *
   * @private
   * @param sourceFiles - Source file paths
   * @param testFiles - Test file paths
   * @returns TestingFinding[] - Missing test findings
   */
  private checkMissingTests(sourceFiles: string[], testFiles: string[]): TestingFinding[] {
    const findings: TestingFinding[] = [];

    // Create set of test file basenames
    const testBasenames = new Set(
      testFiles.map(f => {
        const basename = path.basename(f).replace(/\.(test|spec)\.(ts|tsx|js|jsx)$/, '');
        return basename;
      })
    );

    // Check for source files without corresponding tests
    for (const sourceFile of sourceFiles) {
      const basename = path.basename(sourceFile).replace(/\.(ts|tsx|js|jsx)$/, '');
      
      if (!testBasenames.has(basename) && !basename.includes('index') && !basename.includes('types')) {
        findings.push({
          id: this.generateFindingId(sourceFile, 'missing-test'),
          type: 'missing-test',
          severity: 'medium',
          filePath: sourceFile,
          description: `Source file has no corresponding test file`,
          suggestion: 'Add test file to ensure code quality',
        });
      }
    }

    return findings;
  }

  /**
   * Analyzes test file quality
   *
   * @private
   * @param filePath - Test file path
   * @param content - Test file content
   * @returns TestingFinding[] - Test quality findings
   */
  private analyzeTestQuality(filePath: string, content: string): TestingFinding[] {
    const findings: TestingFinding[] = [];

    // Check for test assertions
    const assertionPatterns = [/expect\(/, /assert\./, /to\.equal\(/, /to\.be\(/];
    const hasAssertions = assertionPatterns.some(pattern => pattern.test(content));

    if (!hasAssertions) {
      findings.push({
        id: this.generateFindingId(filePath, 'test-quality'),
        type: 'test-quality',
        severity: 'high',
        filePath,
        description: 'Test file has no assertions',
        suggestion: 'Add test assertions to verify expected behavior',
      });
    }

    // Check for test descriptions
    const testPattern = /(?:test|it)\s*\(\s*['"]([^'"]+)['"]/g;
    let match;
    let hasDescription = false;
    while ((match = testPattern.exec(content)) !== null) {
      if (match[1].length > 5) {
        hasDescription = true;
        break;
      }
    }

    if (!hasDescription) {
      findings.push({
        id: this.generateFindingId(filePath, 'test-quality'),
        type: 'test-quality',
        severity: 'low',
        filePath,
        description: 'Tests may lack descriptive names',
        suggestion: 'Use descriptive test names that explain what is being tested',
      });
    }

    // Check for async/await handling
    const asyncPattern = /async\s*\(\s*\)\s*=>\s*\{/g;
    if (asyncPattern.test(content) && !content.includes('await')) {
      findings.push({
        id: this.generateFindingId(filePath, 'test-quality'),
        type: 'test-quality',
        severity: 'medium',
        filePath,
        description: 'Async test may be missing await',
        suggestion: 'Ensure async operations are properly awaited',
      });
    }

    // Check for test mocks
    const mockPattern = /jest\.mock\(|vi\.mock\(/g;
    const hasMocks = mockPattern.test(content);

    if (!hasMocks && content.includes('fetch') || content.includes('axios')) {
      findings.push({
        id: this.generateFindingId(filePath, 'no-mocks'),
        type: 'no-mocks',
        severity: 'low',
        filePath,
        description: 'Test may benefit from mocking external dependencies',
        suggestion: 'Consider mocking external API calls for isolated testing',
      });
    }

    return findings;
  }

  /**
   * Calculates testing metrics
   *
   * @private
   * @param sourceFiles - Source file paths
   * @param testFiles - Test file paths
   * @param findings - Testing findings
   * @returns TestingMetrics - Calculated metrics
   */
  private calculateMetrics(sourceFiles: string[], testFiles: string[], findings: TestingFinding[]): TestingMetrics {
    const testCoverage = sourceFiles.length > 0 ? (testFiles.length / sourceFiles.length) * 100 : 0;

    return {
      totalSourceFiles: sourceFiles.length,
      totalTestFiles: testFiles.length,
      testCoverage,
      missingTests: findings.filter(f => f.type === 'missing-test').length,
      testQualityIssues: findings.filter(f => f.type === 'test-quality').length,
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

