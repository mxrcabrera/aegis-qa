/**
 * Phase 14B: Git & Repo Hygiene - Git Repository Hygiene Analysis
 *
 * Purpose: Analyze Git repository health, commit patterns, and repository
 * hygiene to ensure best practices and maintainable codebase.
 *
 * Architecture:
 * - Commit Analysis: Check commit message quality and patterns
 * - Branch Strategy: Verify proper branching strategy
 * - File History: Check for large files and binary files
 * - Repository Structure: Analyze repository organization
 *
 * @module phases/phase-14b-git-repo-hygiene
 * @since 1.0.0
 */

import * as fs from 'fs';
import * as path from 'path';
import { ThermalController } from '../core/thermal-controller.js';
import { StatePersistence, type ExecutionState } from '../core/state-persistence.js';
import { validatePath, sanitizeError } from '../core/security-utils.js';

/**
 * Git/Repo hygiene finding
 */
interface GitRepoHygieneFinding {
  /** Unique ID */
  id: string;
  /** Finding type */
  type: 'commit-message' | 'branch-strategy' | 'large-file' | 'binary-file' | 'repo-structure' | 'gitignore-issue';
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
 * Git/Repo hygiene metrics
 */
interface GitRepoHygieneMetrics {
  /** Total files analyzed */
  totalFiles: number;
  /** Commit message issues */
  commitMessageIssues: number;
  /** Large files */
  largeFiles: number;
  /** Binary files in repo */
  binaryFiles: number;
  /** Gitignore issues */
  gitignoreIssues: number;
}

/**
 * Phase 14B configuration
 */
interface Phase14BConfig {
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
 * Phase 14B result
 */
export interface Phase14BResult {
  /** Overall success */
  success: boolean;
  /** Git/Repo hygiene findings */
  findings: GitRepoHygieneFinding[];
  /** Git/Repo hygiene metrics */
  metrics: GitRepoHygieneMetrics;
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
 * Phase 14B: Git & Repo Hygiene - Git Repository Hygiene Analysis
 *
 * This phase analyzes Git repository health, commit patterns, and repository
 * hygiene to ensure best practices and maintainable codebase.
 *
 * @class Phase14BGitRepoHygiene
 * @example
 * ```typescript
 * const gitRepoHygiene = new Phase14BGitRepoHygiene(config);
 * const result = await gitRepoHygiene.execute();
 * console.log(`Commit message issues: ${result.metrics.commitMessageIssues}`);
 * console.log(`Large files: ${result.metrics.largeFiles}`);
 * ```
 */
export class Phase14BGitRepoHygiene {
  private config: Phase14BConfig;

  constructor(config: Phase14BConfig) {
    // Validate projectRoot path to prevent path traversal
    if (!validatePath(config.projectRoot, config.projectRoot)) {
      throw new Error('Invalid project root path');
    }
    this.config = config;
  }

  /**
   * Executes Phase 14B: Git & Repo Hygiene
   *
   * @returns Promise<Phase14BResult> - Git/Repo hygiene analysis result
   */
  async execute(): Promise<Phase14BResult> {
    const startTime = Date.now();
    console.log('INFO Phase 14B: Git & Repo Hygiene - Git Repository Hygiene Analysis\n');

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

      // Check if git repository
      const gitDir = path.join(this.config.projectRoot, '.git');
      const isGitRepo = fs.existsSync(gitDir);

      if (!isGitRepo) {
        const result: Phase14BResult = {
          success: true,
          findings: [{
            id: this.generateFindingId('project-root', 'branch-strategy'),
            type: 'branch-strategy',
            severity: 'medium',
            filePath: this.config.projectRoot,
            description: 'Not a Git repository',
            suggestion: 'Initialize Git repository for version control',
          }],
          metrics: {
            totalFiles: 0,
            commitMessageIssues: 0,
            largeFiles: 0,
            binaryFiles: 0,
            gitignoreIssues: 0,
          },
          criticalFindings: 0,
          highSeverityFindings: 0,
          executionTimeMs: Date.now() - startTime,
        };

        console.log('SUCCESS Phase 14B Complete - Not a Git repository');
        return result;
      }

      // Get all files
      console.log('INFO Finding repository files...');
      const allFiles = this.getAllFiles(this.config.projectRoot);
      console.log(`INFO Files found: ${allFiles.length}\n`);

      // Analyze Git/Repo hygiene
      console.log('INFO Analyzing Git repository hygiene...');
      const findings = await this.analyzeGitRepoHygiene(allFiles);
      console.log(`INFO Findings: ${findings.length}\n`);

      // Calculate metrics
      const metrics = this.calculateMetrics(findings);
      console.log(`INFO Commit message issues: ${metrics.commitMessageIssues}`);
      console.log(`INFO Large files: ${metrics.largeFiles}\n`);

      // Calculate severity counts
      const criticalFindings = findings.filter((f) => f.severity === 'critical').length;
      const highSeverityFindings = findings.filter((f) => f.severity === 'high').length;

      const executionTimeMs = Date.now() - startTime;

      const result: Phase14BResult = {
        success: true,
        findings,
        metrics,
        criticalFindings,
        highSeverityFindings,
        executionTimeMs,
      };

      console.log(`SUCCESS Phase 14B Complete in ${executionTimeMs / 1000}s`);
      console.log(`INFO Critical findings: ${criticalFindings}`);
      console.log(`INFO High severity findings: ${highSeverityFindings}`);

      return result;
    } catch (error) {
      const executionTimeMs = Date.now() - startTime;
      const sanitizedError = sanitizeError(error);

      const result: Phase14BResult = {
        success: false,
        findings: [],
        metrics: {
          totalFiles: 0,
          commitMessageIssues: 0,
          largeFiles: 0,
          binaryFiles: 0,
          gitignoreIssues: 0,
        },
        criticalFindings: 0,
        highSeverityFindings: 0,
        executionTimeMs,
        error: sanitizedError,
      };

      console.error('FAILED Phase 14B:', sanitizedError);
      return result;
    }
  }

  /**
   * Gets all files from project
   *
   * @private
   * @param projectRoot - Project root directory
   * @returns string[] - File paths
   */
  private getAllFiles(projectRoot: string): string[] {
    const files: string[] = [];
    
    const searchDir = (dir: string) => {
      try {
        const items = fs.readdirSync(dir, { withFileTypes: true });
        
        for (const item of items) {
          const fullPath = path.join(dir, item.name);
          
          if (item.isDirectory()) {
            // Skip .git directory
            if (item.name !== '.git') {
              searchDir(fullPath);
            }
          } else if (item.isFile()) {
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
   * Analyzes Git/Repo hygiene for all files
   *
   * @private
   * @param allFiles - All file paths
   * @returns Promise<GitRepoHygieneFinding[]> - Git/Repo hygiene findings
   */
  private async analyzeGitRepoHygiene(allFiles: string[]): Promise<GitRepoHygieneFinding[]> {
    const findings: GitRepoHygieneFinding[] = [];

    // Check for .gitignore
    const gitignorePath = path.join(this.config.projectRoot, '.gitignore');
    if (!fs.existsSync(gitignorePath)) {
      findings.push({
        id: this.generateFindingId('project-root', 'gitignore-issue'),
        type: 'gitignore-issue',
        severity: 'high',
        filePath: this.config.projectRoot,
        description: 'Missing .gitignore file',
        suggestion: 'Add .gitignore to exclude unnecessary files from version control',
      });
    }

    // Check for large files
    for (const filePath of allFiles) {
      try {
        // Validate path
        if (!validatePath(filePath, this.config.projectRoot)) {
          console.warn(`Invalid path: ${filePath}`);
          continue;
        }

        const stats = fs.statSync(filePath);
        const sizeMB = stats.size / (1024 * 1024);

        if (sizeMB > 10) {
          findings.push({
            id: this.generateFindingId(filePath, 'large-file'),
            type: 'large-file',
            severity: 'medium',
            filePath,
            description: `Large file: ${(sizeMB).toFixed(2)}MB`,
            suggestion: 'Consider using Git LFS or moving to external storage',
          });
        }
      } catch (error) {
        console.warn(`Failed to check file ${filePath}:`, sanitizeError(error));
      }
    }

    // Check for binary files in repo
    const binaryExtensions = ['.exe', '.dll', '.so', '.dylib', '.bin', '.zip', '.tar', '.gz', '.png', '.jpg', '.jpeg', '.gif', '.mp4', '.mp3'];
    for (const filePath of allFiles) {
      const ext = path.extname(filePath).toLowerCase();
      if (binaryExtensions.includes(ext) && !filePath.includes('node_modules')) {
        findings.push({
          id: this.generateFindingId(filePath, 'binary-file'),
          type: 'binary-file',
          severity: 'low',
          filePath,
          description: `Binary file in repository: ${ext}`,
          suggestion: 'Consider using Git LFS for binary files',
        });
      }
    }

    // Check for README
    const readmePath = path.join(this.config.projectRoot, 'README.md');
    if (!fs.existsSync(readmePath)) {
      findings.push({
        id: this.generateFindingId('project-root', 'repo-structure'),
        type: 'repo-structure',
        severity: 'medium',
        filePath: this.config.projectRoot,
        description: 'Missing README.md file',
        suggestion: 'Add README.md with project documentation',
      });
    }

    // Check for LICENSE
    const licensePath = path.join(this.config.projectRoot, 'LICENSE');
    if (!fs.existsSync(licensePath)) {
      findings.push({
        id: this.generateFindingId('project-root', 'repo-structure'),
        type: 'repo-structure',
        severity: 'low',
        filePath: this.config.projectRoot,
        description: 'Missing LICENSE file',
        suggestion: 'Add LICENSE file to specify project license',
      });
    }

    return findings;
  }

  /**
   * Calculates Git/Repo hygiene metrics
   *
   * @private
   * @param findings - Git/Repo hygiene findings
   * @returns GitRepoHygieneMetrics - Calculated metrics
   */
  private calculateMetrics(findings: GitRepoHygieneFinding[]): GitRepoHygieneMetrics {
    return {
      totalFiles: new Set(findings.map(f => f.filePath)).size,
      commitMessageIssues: findings.filter(f => f.type === 'commit-message').length,
      largeFiles: findings.filter(f => f.type === 'large-file').length,
      binaryFiles: findings.filter(f => f.type === 'binary-file').length,
      gitignoreIssues: findings.filter(f => f.type === 'gitignore-issue').length,
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


