// eslint-disable @typescript-eslint/no-explicit-any
/**
 * Phase 15: DevOps Suite - DevOps Infrastructure Analysis
 *
 * Purpose: Analyze DevOps infrastructure including CI/CD, SCA Security,
 * Cloud Infrastructure (IaC), and Containerization (K8s/Docker).
 *
 * Architecture:
 * - CI/CD Analysis: Check CI/CD pipeline completeness
 * - SCA Security: Software Composition Analysis for dependencies
 * - IaC Analysis: Infrastructure as Code best practices
 * - Containerization: Docker and Kubernetes configuration
 *
 * @module phases/phase-15-devops-suite
 * @since 1.0.0
 */

import * as fs from 'fs';
import * as path from 'path';
import { ThermalController } from '../core/thermal-controller.js';
import { StatePersistence, type ExecutionState } from '../core/state-persistence.js';
import { validatePath, sanitizeError, validateFileSize, censorSecrets } from '../core/security-utils.js';

/**
 * DevOps suite finding
 */
interface DevOpsSuiteFinding {
  /** Unique ID */
  id: string;
  /** Finding type */
  type: 'cicd-completeness' | 'sca-security' | 'iac-best-practice' | 'container-security' | 'devops-automation';
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
 * DevOps suite metrics
 */
interface DevOpsSuiteMetrics {
  /** Total files analyzed */
  totalFiles: number;
  /** CI/CD completeness score */
  cicdCompleteness: number;
  /** SCA security issues */
  scaSecurityIssues: number;
  /** IaC best practices */
  iacBestPractices: number;
  /** Container security issues */
  containerSecurityIssues: number;
}

/**
 * Phase 15 configuration
 */
interface Phase15Config {
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
 * Phase 15 result
 */
export interface Phase15Result {
  /** Overall success */
  success: boolean;
  /** DevOps suite findings */
  findings: DevOpsSuiteFinding[];
  /** DevOps suite metrics */
  metrics: DevOpsSuiteMetrics;
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
 * Phase 15: DevOps Suite - DevOps Infrastructure Analysis
 *
 * This phase analyzes DevOps infrastructure including CI/CD, SCA Security,
 * Cloud Infrastructure (IaC), and Containerization (K8s/Docker).
 *
 * @class Phase15DevOpsSuite
 * @example
 * ```typescript
 * const devOpsSuite = new Phase15DevOpsSuite(config);
 * const result = await devOpsSuite.execute();
 * console.log(`CI/CD completeness: ${result.metrics.cicdCompleteness}%`);
 * console.log(`SCA security issues: ${result.metrics.scaSecurityIssues}`);
 * ```
 */
export class Phase15DevOpsSuite {
  private config: Phase15Config;

  constructor(config: Phase15Config) {
    // Validate projectRoot path to prevent path traversal
    if (!validatePath(config.projectRoot, config.projectRoot)) {
      throw new Error('Invalid project root path');
    }
    this.config = config;
  }

  /**
   * Executes Phase 15: DevOps Suite
   *
   * @returns Promise<Phase15Result> - DevOps suite analysis result
   */
  async execute(): Promise<Phase15Result> {
    const startTime = Date.now();
    console.log('INFO Phase 15: DevOps Suite - DevOps Infrastructure Analysis\n');

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

      // Get DevOps files
      console.log('INFO Finding DevOps configuration files...');
      const devOpsFiles = this.getDevOpsFiles(this.config.projectRoot);
      console.log(`INFO DevOps files found: ${devOpsFiles.length}\n`);

      // Analyze DevOps suite
      console.log('INFO Analyzing DevOps infrastructure...');
      const findings = await this.analyzeDevOpsSuite(devOpsFiles);
      console.log(`INFO Findings: ${findings.length}\n`);

      // Calculate metrics
      const metrics = this.calculateMetrics(devOpsFiles, findings);
      console.log(`INFO CI/CD completeness: ${metrics.cicdCompleteness}%`);
      console.log(`INFO SCA security issues: ${metrics.scaSecurityIssues}\n`);

      // Calculate severity counts
      const criticalFindings = findings.filter((f) => f.severity === 'critical').length;
      const highSeverityFindings = findings.filter((f) => f.severity === 'high').length;

      const executionTimeMs = Date.now() - startTime;

      const result: Phase15Result = {
        success: true,
        findings,
        metrics,
        criticalFindings,
        highSeverityFindings,
        executionTimeMs,
      };

      console.log(`SUCCESS Phase 15 Complete in ${executionTimeMs / 1000}s`);
      console.log(`INFO Critical findings: ${criticalFindings}`);
      console.log(`INFO High severity findings: ${highSeverityFindings}`);

      return result;
    } catch (error: unknown) {
      const executionTimeMs = Date.now() - startTime;
      const sanitizedError = sanitizeError(error);

      const result: Phase15Result = {
        success: false,
        findings: [],
        metrics: {
          totalFiles: 0,
          cicdCompleteness: 0,
          scaSecurityIssues: 0,
          iacBestPractices: 0,
          containerSecurityIssues: 0,
        },
        criticalFindings: 0,
        highSeverityFindings: 0,
        executionTimeMs,
        error: sanitizedError,
      };

      console.error('FAILED Phase 15:', sanitizedError);
      return result;
    }
  }

  /**
   * Gets DevOps configuration files from project
   *
   * @private
   * @param projectRoot - Project root directory
   * @returns string[] - DevOps configuration file paths
   */
  private getDevOpsFiles(projectRoot: string): string[] {
    const files: string[] = [];

    const devOpsPatterns = [
      '.github/workflows/*.yml',
      '.github/workflows/*.yaml',
      'terraform/*.tf',
      'terraform/**/*.tf',
      'k8s/*.yml',
      'k8s/*.yaml',
      'kubernetes/*.yml',
      'kubernetes/*.yaml',
      'docker-compose.yml',
      'docker-compose.yaml',
      'Dockerfile',
      'Dockerfile.*',
      '.dockerignore',
      'helm/*.yaml',
      'helm/*.yml',
      'charts/*.yaml',
      'charts/*.yml',
      '.k8s/*.yml',
      '.k8s/*.yaml',
      'deploy/*.yml',
      'deploy/*.yaml',
    ];

    for (const pattern of devOpsPatterns) {
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
        } catch (error: unknown) {
          // Skip directories we can't read
        }
      }
    }

    return files;
  }

  /**
   * Analyzes DevOps suite for all files
   *
   * @private
   * @param devOpsFiles - DevOps configuration file paths
   * @returns Promise<DevOpsSuiteFinding[]> - DevOps suite findings
   */
  private async analyzeDevOpsSuite(devOpsFiles: string[]): Promise<DevOpsSuiteFinding[]> {
    const findings: DevOpsSuiteFinding[] = [];

    // Check if DevOps files exist
    if (devOpsFiles.length === 0) {
      findings.push({
        id: this.generateFindingId('project', 'missing-devops-config'),
        type: 'devops-automation',
        severity: 'medium',
        filePath: 'N/A',
        description: 'No DevOps configuration files found',
        suggestion: 'Consider setting up CI/CD, IaC, and containerization for DevOps automation',
      });
    }

    for (const filePath of devOpsFiles) {
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
        
        const fileFindings = this.analyzeDevOpsFile(filePath, sanitizedContent);
        findings.push(...fileFindings);
      } catch (error: unknown) {
        console.warn(`Failed to analyze ${filePath}:`, sanitizeError(error));
      }
    }

    return findings;
  }

  /**
   * Analyzes DevOps configuration file
   *
   * @private
   * @param filePath - File path
   * @param content - File content
   * @returns DevOpsSuiteFinding[] - DevOps suite findings
   */
  private analyzeDevOpsFile(filePath: string, content: string): DevOpsSuiteFinding[] {
    const findings: DevOpsSuiteFinding[] = [];
    const basename = path.basename(filePath);

    // Check for CI/CD files
    if (basename.endsWith('.yml') || basename.endsWith('.yaml')) {
      if (filePath.includes('.github')) {
        findings.push(...this.analyzeCIConfig(filePath, content));
      }
      if (filePath.includes('k8s') || filePath.includes('kubernetes') || filePath.includes('helm')) {
        findings.push(...this.analyzeKubernetesConfig(filePath, content));
      }
    }

    // Check for Docker files
    if (basename === 'Dockerfile' || basename.startsWith('Dockerfile.')) {
      findings.push(...this.analyzeDockerfile(filePath, content));
    }

    // Check for Terraform files
    if (basename.endsWith('.tf')) {
      findings.push(...this.analyzeTerraform(filePath, content));
    }

    return findings;
  }

  /**
   * Analyzes CI/CD configuration
   *
   * @private
   * @param filePath - File path
   * @param content - File content
   * @returns DevOpsSuiteFinding[] - CI/CD findings
   */
  private analyzeCIConfig(filePath: string, content: string): DevOpsSuiteFinding[] {
    const findings: DevOpsSuiteFinding[] = [];

    // Check for SCA security scanning
    if (!content.includes('safety') && !content.includes('snyk') && !content.includes('audit')) {
      findings.push({
        id: this.generateFindingId(filePath, 'sca-security'),
        type: 'sca-security',
        severity: 'medium',
        filePath,
        description: 'CI/CD pipeline may be missing SCA security scanning',
        suggestion: 'Add SCA security scanning (Snyk, Safety, npm audit) to detect vulnerable dependencies',
      });
    }

    // Check for deployment automation
    if (!content.includes('deploy') && !content.includes('release')) {
      findings.push({
        id: this.generateFindingId(filePath, 'cicd-completeness'),
        type: 'cicd-completeness',
        severity: 'low',
        filePath,
        description: 'CI/CD pipeline may be missing deployment automation',
        suggestion: 'Add automated deployment steps for continuous delivery',
      });
    }

    return findings;
  }

  /**
   * Analyzes Kubernetes configuration
   *
   * @private
   * @param filePath - File path
   * @param content - File content
   * @returns DevOpsSuiteFinding[] - Kubernetes findings
   */
  private analyzeKubernetesConfig(filePath: string, content: string): DevOpsSuiteFinding[] {
    const findings: DevOpsSuiteFinding[] = [];

    // Check for security context
    if (!content.includes('securityContext') && content.includes('Deployment')) {
      findings.push({
        id: this.generateFindingId(filePath, 'container-security'),
        type: 'container-security',
        severity: 'medium',
        filePath,
        description: 'Deployment may be missing security context',
        suggestion: 'Add securityContext to run containers as non-root and with proper permissions',
      });
    }

    // Check for resource limits
    if (content.includes('resources') && !content.includes('limits')) {
      findings.push({
        id: this.generateFindingId(filePath, 'iac-best-practice'),
        type: 'iac-best-practice',
        severity: 'medium',
        filePath,
        description: 'Kubernetes resources may be missing limits',
        suggestion: 'Add resource limits to prevent resource exhaustion',
      });
    }

    // Check for namespace
    if (!content.includes('namespace')) {
      findings.push({
        id: this.generateFindingId(filePath, 'iac-best-practice'),
        type: 'iac-best-practice',
        severity: 'low',
        filePath,
        description: 'Kubernetes resource may be missing namespace',
        suggestion: 'Specify namespace for proper resource isolation',
      });
    }

    return findings;
  }

  /**
   * Analyzes Dockerfile
   *
   * @private
   * @param filePath - File path
   * @param content - File content
   * @returns DevOpsSuiteFinding[] - Dockerfile findings
   */
  private analyzeDockerfile(filePath: string, content: string): DevOpsSuiteFinding[] {
    const findings: DevOpsSuiteFinding[] = [];

    // Check for multi-stage build
    if (!content.includes('AS ')) {
      findings.push({
        id: this.generateFindingId(filePath, 'container-security'),
        type: 'container-security',
        severity: 'medium',
        filePath,
        description: 'Dockerfile may benefit from multi-stage build',
        suggestion: 'Use multi-stage builds to reduce final image size and attack surface',
      });
    }

    // Check for non-root user
    if (!content.includes('USER')) {
      findings.push({
        id: this.generateFindingId(filePath, 'container-security'),
        type: 'container-security',
        severity: 'high',
        filePath,
        description: 'Dockerfile may run as root user',
        suggestion: 'Add USER instruction to run as non-root for security',
      });
    }

    // Check for specific version tags
    if (content.includes(':latest')) {
      const lineNumber = content.split('\n').findIndex(line => line.includes(':latest')) + 1;
      findings.push({
        id: this.generateFindingId(filePath, 'container-security'),
        type: 'container-security',
        severity: 'high',
        filePath,
        line: lineNumber,
        description: 'Dockerfile uses latest tag which may cause unexpected updates',
        suggestion: 'Use specific version tags for reproducible builds',
      });
    }

    return findings;
  }

  /**
   * Analyzes Terraform configuration
   *
   * @private
   * @param filePath - File path
   * @param content - File content
   * @returns DevOpsSuiteFinding[] - Terraform findings
   */
  private analyzeTerraform(filePath: string, content: string): DevOpsSuiteFinding[] {
    const findings: DevOpsSuiteFinding[] = [];

    // Check for state management
    if (!content.includes('backend') && content.includes('terraform')) {
      findings.push({
        id: this.generateFindingId(filePath, 'iac-best-practice'),
        type: 'iac-best-practice',
        severity: 'high',
        filePath,
        description: 'Terraform configuration may be missing remote state backend',
        suggestion: 'Configure remote state backend for team collaboration and state management',
      });
    }

    // Check for resource tagging
    if (!content.includes('tags') && content.includes('resource')) {
      findings.push({
        id: this.generateFindingId(filePath, 'iac-best-practice'),
        type: 'iac-best-practice',
        severity: 'medium',
        filePath,
        description: 'Terraform resources may be missing tags',
        suggestion: 'Add tags for cost allocation and resource identification',
      });
    }

    return findings;
  }

  /**
   * Calculates DevOps suite metrics
   *
   * @private
   * @param devOpsFiles - DevOps file paths
   * @param findings - DevOps suite findings
   * @returns DevOpsSuiteMetrics - Calculated metrics
   */
  private calculateMetrics(devOpsFiles: string[], findings: DevOpsSuiteFinding[]): DevOpsSuiteMetrics {
    const cicdFiles = devOpsFiles.filter(f => f.includes('.github') || f.includes('gitlab'));
    const cicdCompleteness = cicdFiles.length > 0 ? 50 : 0;

    return {
      totalFiles: devOpsFiles.length,
      cicdCompleteness,
      scaSecurityIssues: findings.filter(f => f.type === 'sca-security').length,
      iacBestPractices: findings.filter(f => f.type === 'iac-best-practice').length,
      containerSecurityIssues: findings.filter(f => f.type === 'container-security').length,
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













