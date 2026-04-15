/**
 * Phase 11: CI/CD - Continuous Integration and Deployment Analysis
 *
 * Purpose: Analyze CI/CD pipeline configuration, deployment scripts,
 * and automation practices to ensure reliable and efficient deployments.
 *
 * Architecture:
 * - Pipeline Analysis: Check CI/CD configuration files
 * - Deployment Scripts: Analyze deployment automation
 * - Environment Management: Check for proper environment handling
 * - Security Practices: Verify CI/CD security best practices
 *
 * @module phases/phase-11-ci-cd
 * @since 1.0.0
 */

import * as fs from 'fs';
import * as path from 'path';
import { ThermalController } from '../core/thermal-controller.js';
import { StatePersistence, type ExecutionState } from '../core/state-persistence.js';
import { validatePath, sanitizeError, validateFileSize, censorSecrets } from '../core/security-utils.js';

/**
 * CI/CD finding
 */
interface CICDFinding {
  /** Unique ID */
  id: string;
  /** Finding type */
  type: 'pipeline-config' | 'deployment-script' | 'env-management' | 'ci-security' | 'build-optimization' | 'missing-ci';
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
 * CI/CD metrics
 */
interface CICDMetrics {
  /** Total CI/CD files analyzed */
  totalFiles: number;
  /** Pipeline configurations found */
  pipelineConfigs: number;
  /** Deployment scripts found */
  deploymentScripts: number;
  /** Security issues */
  securityIssues: number;
  /** Missing CI/CD */
  missingCICD: number;
}

/**
 * Phase 11 configuration
 */
interface Phase11Config {
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
 * Phase 11 result
 */
export interface Phase11Result {
  /** Overall success */
  success: boolean;
  /** CI/CD findings */
  findings: CICDFinding[];
  /** CI/CD metrics */
  metrics: CICDMetrics;
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
 * Phase 11: CI/CD - Continuous Integration and Deployment Analysis
 *
 * This phase analyzes CI/CD pipeline configuration, deployment scripts,
 * and automation practices to ensure reliable and efficient deployments.
 *
 * @class Phase11CICD
 * @example
 * ```typescript
 * const cicd = new Phase11CICD(config);
 * const result = await cicd.execute();
 * console.log(`Pipeline configs: ${result.metrics.pipelineConfigs}`);
 * console.log(`Security issues: ${result.metrics.securityIssues}`);
 * ```
 */
export class Phase11CICD {
  private config: Phase11Config;

  constructor(config: Phase11Config) {
    // Validate projectRoot path to prevent path traversal
    if (!validatePath(config.projectRoot, config.projectRoot)) {
      throw new Error('Invalid project root path');
    }
    this.config = config;
  }

  /**
   * Executes Phase 11: CI/CD
   *
   * @returns Promise<Phase11Result> - CI/CD analysis result
   */
  async execute(): Promise<Phase11Result> {
    const startTime = Date.now();
    console.log('INFO Phase 11: CI/CD - Continuous Integration and Deployment Analysis\n');

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

      // Get CI/CD files
      console.log('INFO Finding CI/CD files...');
      const cicdFiles = this.getCICDFiles(this.config.projectRoot);
      console.log(`INFO CI/CD files found: ${cicdFiles.length}\n`);

      // Analyze CI/CD
      console.log('INFO Analyzing CI/CD configuration...');
      const findings = await this.analyzeCICD(cicdFiles);
      console.log(`INFO Findings: ${findings.length}\n`);

      // Calculate metrics
      const metrics = this.calculateMetrics(cicdFiles, findings);
      console.log(`INFO Pipeline configs: ${metrics.pipelineConfigs}`);
      console.log(`INFO Security issues: ${metrics.securityIssues}\n`);

      // Calculate severity counts
      const criticalFindings = findings.filter((f) => f.severity === 'critical').length;
      const highSeverityFindings = findings.filter((f) => f.severity === 'high').length;

      const executionTimeMs = Date.now() - startTime;

      const result: Phase11Result = {
        success: true,
        findings,
        metrics,
        criticalFindings,
        highSeverityFindings,
        executionTimeMs,
      };

      console.log(`SUCCESS Phase 11 Complete in ${executionTimeMs / 1000}s`);
      console.log(`INFO Critical findings: ${criticalFindings}`);
      console.log(`INFO High severity findings: ${highSeverityFindings}`);

      return result;
    } catch (error) {
      const executionTimeMs = Date.now() - startTime;
      const sanitizedError = sanitizeError(error);

      const result: Phase11Result = {
        success: false,
        findings: [],
        metrics: {
          totalFiles: 0,
          pipelineConfigs: 0,
          deploymentScripts: 0,
          securityIssues: 0,
          missingCICD: 0,
        },
        criticalFindings: 0,
        highSeverityFindings: 0,
        executionTimeMs,
        error: sanitizedError,
      };

      console.error('FAILED Phase 11:', sanitizedError);
      return result;
    }
  }

  /**
   * Gets CI/CD files from project
   *
   * @private
   * @param projectRoot - Project root directory
   * @returns string[] - CI/CD file paths
   */
  private getCICDFiles(projectRoot: string): string[] {
    const files: string[] = [];

    const ciCDFiles = [
      '.github/workflows/*.yml',
      '.github/workflows/*.yaml',
      '.gitlab-ci.yml',
      'Jenkinsfile',
      'azure-pipelines.yml',
      'circleci/config.yml',
      'bitbucket-pipelines.yml',
      '.travis.yml',
      'deploy.sh',
      'scripts/deploy.*',
      'Dockerfile',
      'docker-compose.yml',
    ];

    for (const pattern of ciCDFiles) {
      const patternPath = path.join(projectRoot, pattern);
      const dir = path.dirname(patternPath);
      const filePattern = path.basename(patternPath);

      if (fs.existsSync(dir)) {
        try {
          const items = fs.readdirSync(dir);
          for (const item of items) {
            if (item.match(filePattern.replace('*', '.*'))) {
              files.push(path.join(dir, item));
            }
          }
        } catch (error) {
          // Skip directories we can't read
        }
      }
    }

    return files;
  }

  /**
   * Analyzes CI/CD for all files
   *
   * @private
   * @param cicdFiles - CI/CD file paths
   * @returns Promise<CICDFinding[]> - CI/CD findings
   */
  private async analyzeCICD(cicdFiles: string[]): Promise<CICDFinding[]> {
    const findings: CICDFinding[] = [];

    // Check if CI/CD exists
    if (cicdFiles.length === 0) {
      findings.push({
        id: this.generateFindingId('project', 'missing-ci'),
        type: 'missing-ci',
        severity: 'high',
        filePath: 'N/A',
        description: 'No CI/CD configuration found',
        suggestion: 'Set up CI/CD pipeline for automated testing and deployment',
      });
    }

    for (const filePath of cicdFiles) {
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
        
        const fileFindings = this.analyzeCICDFile(filePath, sanitizedContent);
        findings.push(...fileFindings);
      } catch (error) {
        console.warn(`Failed to analyze ${filePath}:`, sanitizeError(error));
      }
    }

    return findings;
  }

  /**
   * Analyzes CI/CD file
   *
   * @private
   * @param filePath - File path
   * @param content - File content
   * @returns CICDFinding[] - CI/CD findings
   */
  private analyzeCICDFile(filePath: string, content: string): CICDFinding[] {
    const findings: CICDFinding[] = [];
    const basename = path.basename(filePath);

    // Check for GitHub Actions
    if (basename.endsWith('.yml') || basename.endsWith('.yaml')) {
      findings.push(...this.checkGitHubActions(filePath, content));
    }

    // Check for Dockerfile
    if (basename === 'Dockerfile') {
      findings.push(...this.checkDockerfile(filePath, content));
    }

    // Check for deployment scripts
    if (basename.endsWith('.sh')) {
      findings.push(...this.checkDeploymentScript(filePath, content));
    }

    return findings;
  }

  /**
   * Checks GitHub Actions configuration
   *
   * @private
   * @param filePath - File path
   * @param content - File content
   * @returns CICDFinding[] - GitHub Actions findings
   */
  private checkGitHubActions(filePath: string, content: string): CICDFinding[] {
    const findings: CICDFinding[] = [];

    // Check for test step
    if (!content.includes('test') && !content.includes('npm test')) {
      findings.push({
        id: this.generateFindingId(filePath, 'pipeline-config'),
        type: 'pipeline-config',
        severity: 'medium',
        filePath,
        description: 'CI/CD pipeline may be missing test step',
        suggestion: 'Add automated tests to CI/CD pipeline',
      });
    }

    // Check for build step
    if (!content.includes('build') && !content.includes('npm run build')) {
      findings.push({
        id: this.generateFindingId(filePath, 'pipeline-config'),
        type: 'pipeline-config',
        severity: 'high',
        filePath,
        description: 'CI/CD pipeline may be missing build step',
        suggestion: 'Add build step to CI/CD pipeline',
      });
    }

    // Check for security scanning
    if (!content.includes('security') && !content.includes('sast') && !content.includes('scan')) {
      findings.push({
        id: this.generateFindingId(filePath, 'ci-security'),
        type: 'ci-security',
        severity: 'medium',
        filePath,
        description: 'CI/CD pipeline may benefit from security scanning',
        suggestion: 'Add security scanning (SAST/DAST) to CI/CD pipeline',
      });
    }

    // Check for caching
    if (!content.includes('cache') && !content.includes('actions/cache')) {
      findings.push({
        id: this.generateFindingId(filePath, 'build-optimization'),
        type: 'build-optimization',
        severity: 'low',
        filePath,
        description: 'CI/CD pipeline may benefit from caching',
        suggestion: 'Add caching for dependencies to speed up builds',
      });
    }

    return findings;
  }

  /**
   * Checks Dockerfile
   *
   * @private
   * @param filePath - File path
   * @param content - File content
   * @returns CICDFinding[] - Dockerfile findings
   */
  private checkDockerfile(filePath: string, content: string): CICDFinding[] {
    const findings: CICDFinding[] = [];

    // Check for multi-stage build
    if (!content.includes('AS')) {
      findings.push({
        id: this.generateFindingId(filePath, 'build-optimization'),
        type: 'build-optimization',
        severity: 'medium',
        filePath,
        description: 'Dockerfile may benefit from multi-stage build',
        suggestion: 'Use multi-stage builds to reduce final image size',
      });
    }

    // Check for latest tag
    if (content.includes('FROM') && content.includes(':latest')) {
      const lineNumber = content.split('\n').findIndex(line => line.includes(':latest')) + 1;
      findings.push({
        id: this.generateFindingId(filePath, 'ci-security'),
        type: 'ci-security',
        severity: 'high',
        filePath,
        line: lineNumber,
        description: 'Dockerfile uses latest tag which may cause unexpected updates',
        suggestion: 'Use specific version tags for reproducible builds',
      });
    }

    // Check for non-root user
    if (!content.includes('USER')) {
      findings.push({
        id: this.generateFindingId(filePath, 'ci-security'),
        type: 'ci-security',
        severity: 'medium',
        filePath,
        description: 'Dockerfile may not run as non-root user',
        suggestion: 'Add USER instruction to run as non-root for security',
      });
    }

    return findings;
  }

  /**
   * Checks deployment script
   *
   * @private
   * @param filePath - File path
   * @param content - File content
   * @returns CICDFinding[] - Deployment script findings
   */
  private checkDeploymentScript(filePath: string, content: string): CICDFinding[] {
    const findings: CICDFinding[] = [];

    // Check for error handling
    if (!content.includes('set -e') && !content.includes('set -o pipefail')) {
      findings.push({
        id: this.generateFindingId(filePath, 'deployment-script'),
        type: 'deployment-script',
        severity: 'medium',
        filePath,
        description: 'Deployment script may not have proper error handling',
        suggestion: 'Add "set -e" and "set -o pipefail" for proper error handling',
      });
    }

    // Check for environment variable handling
    if (!content.includes('.env') && !content.includes('environment')) {
      findings.push({
        id: this.generateFindingId(filePath, 'env-management'),
        type: 'env-management',
        severity: 'medium',
        filePath,
        description: 'Deployment script may not handle environment variables properly',
        suggestion: 'Ensure environment variables are properly loaded and validated',
      });
    }

    // Check for rollback mechanism
    if (!content.includes('rollback') && !content.includes('revert')) {
      findings.push({
        id: this.generateFindingId(filePath, 'deployment-script'),
        type: 'deployment-script',
        severity: 'high',
        filePath,
        description: 'Deployment script may not have rollback mechanism',
        suggestion: 'Add rollback mechanism for failed deployments',
      });
    }

    return findings;
  }

  /**
   * Calculates CI/CD metrics
   *
   * @private
   * @param cicdFiles - CI/CD file paths
   * @param findings - CI/CD findings
   * @returns CICDMetrics - Calculated metrics
   */
  private calculateMetrics(cicdFiles: string[], findings: CICDFinding[]): CICDMetrics {
    const pipelineConfigs = cicdFiles.filter(f => 
      f.includes('.github') || f.includes('.gitlab') || f.includes('Jenkinsfile') || f.includes('azure-pipelines')
    ).length;
    
    const deploymentScripts = cicdFiles.filter(f => 
      f.endsWith('.sh') || f.includes('deploy')
    ).length;

    return {
      totalFiles: cicdFiles.length,
      pipelineConfigs,
      deploymentScripts,
      securityIssues: findings.filter(f => f.type === 'ci-security').length,
      missingCICD: findings.filter(f => f.type === 'missing-ci').length,
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
