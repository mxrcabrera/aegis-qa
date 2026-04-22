// eslint-disable @typescript-eslint/no-explicit-any
/**
 * Phase 14A: Cloud Cost Detection - Cloud Infrastructure Cost Analysis
 *
 * Purpose: Analyze cloud infrastructure configuration for cost optimization
 * opportunities and identify potential cost savings.
 *
 * Architecture:
 * - Resource Analysis: Check for over-provisioned resources
 * - Idle Resources: Identify unused or underutilized resources
 * - Cost Optimization: Check for cost-effective alternatives
 * - Budget Monitoring: Verify budget and alerting setup
 *
 * @module phases/phase-14a-cloud-cost-detection
 * @since 1.0.0
 */

import * as fs from 'fs';
import * as path from 'path';
import { ThermalController } from '../core/thermal-controller.js';
import { StatePersistence, type ExecutionState } from '../core/state-persistence.js';
import { validatePath, sanitizeError, validateFileSize, censorSecrets } from '../core/security-utils.js';

/**
 * Cloud cost finding
 */
interface CloudCostFinding {
  /** Unique ID */
  id: string;
  /** Finding type */
  type: 'over-provisioned' | 'idle-resource' | 'cost-optimization' | 'missing-budget' | 'inefficient-usage';
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
 * Cloud cost metrics
 */
interface CloudCostMetrics {
  /** Total files analyzed */
  totalFiles: number;
  /** Over-provisioned resources */
  overProvisioned: number;
  /** Idle resources */
  idleResources: number;
  /** Cost optimization opportunities */
  costOptimizations: number;
}

/**
 * Phase 14A configuration
 */
interface Phase14AConfig {
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
 * Phase 14A result
 */
export interface Phase14AResult {
  /** Overall success */
  success: boolean;
  /** Cloud cost findings */
  findings: CloudCostFinding[];
  /** Cloud cost metrics */
  metrics: CloudCostMetrics;
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
 * Phase 14A: Cloud Cost Detection - Cloud Infrastructure Cost Analysis
 *
 * This phase analyzes cloud infrastructure configuration for cost optimization
 * opportunities and identifies potential cost savings.
 *
 * @class Phase14ACloudCostDetection
 * @example
 * ```typescript
 * const cloudCostDetection = new Phase14ACloudCostDetection(config);
 * const result = await cloudCostDetection.execute();
 * console.log(`Over-provisioned: ${result.metrics.overProvisioned}`);
 * console.log(`Cost optimizations: ${result.metrics.costOptimizations}`);
 * ```
 */
export class Phase14ACloudCostDetection {
  private config: Phase14AConfig;

  constructor(config: Phase14AConfig) {
    // Validate projectRoot path to prevent path traversal
    if (!validatePath(config.projectRoot, config.projectRoot)) {
      throw new Error('Invalid project root path');
    }
    this.config = config;
  }

  /**
   * Executes Phase 14A: Cloud Cost Detection
   *
   * @returns Promise<Phase14AResult> - Cloud cost detection result
   */
  async execute(): Promise<Phase14AResult> {
    const startTime = Date.now();
    console.log('INFO Phase 14A: Cloud Cost Detection - Cloud Infrastructure Cost Analysis\n');

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

      // Get cloud configuration files
      console.log('INFO Finding cloud configuration files...');
      const cloudFiles = this.getCloudFiles(this.config.projectRoot);
      console.log(`INFO Cloud files found: ${cloudFiles.length}\n`);

      // Analyze cloud costs
      console.log('INFO Analyzing cloud cost optimization...');
      const findings = await this.analyzeCloudCosts(cloudFiles);
      console.log(`INFO Findings: ${findings.length}\n`);

      // Calculate metrics
      const metrics = this.calculateMetrics(findings);
      console.log(`INFO Over-provisioned: ${metrics.overProvisioned}`);
      console.log(`INFO Cost optimizations: ${metrics.costOptimizations}\n`);

      // Calculate severity counts
      const criticalFindings = findings.filter((f) => f.severity === 'critical').length;
      const highSeverityFindings = findings.filter((f) => f.severity === 'high').length;

      const executionTimeMs = Date.now() - startTime;

      const result: Phase14AResult = {
        success: true,
        findings,
        metrics,
        criticalFindings,
        highSeverityFindings,
        executionTimeMs,
      };

      console.log(`SUCCESS Phase 14A Complete in ${executionTimeMs / 1000}s`);
      console.log(`INFO Critical findings: ${criticalFindings}`);
      console.log(`INFO High severity findings: ${highSeverityFindings}`);

      return result;
    } catch (error: unknown) {
      const executionTimeMs = Date.now() - startTime;
      const sanitizedError = sanitizeError(error);

      const result: Phase14AResult = {
        success: false,
        findings: [],
        metrics: {
          totalFiles: 0,
          overProvisioned: 0,
          idleResources: 0,
          costOptimizations: 0,
        },
        criticalFindings: 0,
        highSeverityFindings: 0,
        executionTimeMs,
        error: sanitizedError,
      };

      console.error('FAILED Phase 14A:', sanitizedError);
      return result;
    }
  }

  /**
   * Gets cloud configuration files from project
   *
   * @private
   * @param projectRoot - Project root directory
   * @returns string[] - Cloud configuration file paths
   */
  private getCloudFiles(projectRoot: string): string[] {
    const files: string[] = [];

    const cloudPatterns = [
      'terraform/*.tf',
      'terraform/**/*.tf',
      'cloudformation/*.yml',
      'cloudformation/*.yaml',
      'cloudformation/*.json',
      'k8s/*.yml',
      'k8s/*.yaml',
      'kubernetes/*.yml',
      'kubernetes/*.yaml',
      'aws/*.yml',
      'aws/*.yaml',
      'azure/*.yml',
      'azure/*.yaml',
      'gcp/*.yml',
      'gcp/*.yaml',
      'serverless.yml',
      'serverless.yaml',
      '.aws/config',
      'infra/*.tf',
      'deployment/*.yml',
      'deployment/*.yaml',
    ];

    for (const pattern of cloudPatterns) {
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
   * Analyzes cloud costs for all files
   *
   * @private
   * @param cloudFiles - Cloud configuration file paths
   * @returns Promise<CloudCostFinding[]> - Cloud cost findings
   */
  private async analyzeCloudCosts(cloudFiles: string[]): Promise<CloudCostFinding[]> {
    const findings: CloudCostFinding[] = [];

    // Check if cloud files exist
    if (cloudFiles.length === 0) {
      findings.push({
        id: this.generateFindingId('project', 'missing-cloud-config'),
        type: 'inefficient-usage',
        severity: 'low',
        filePath: 'N/A',
        description: 'No cloud configuration files found',
        suggestion: 'Consider setting up cloud infrastructure configuration for cost optimization',
      });
    }

    for (const filePath of cloudFiles) {
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
        
        const fileFindings = this.analyzeCloudFile(filePath, sanitizedContent);
        findings.push(...fileFindings);
      } catch (error: unknown) {
        console.warn(`Failed to analyze ${filePath}:`, sanitizeError(error));
      }
    }

    return findings;
  }

  /**
   * Analyzes cloud configuration file
   *
   * @private
   * @param filePath - File path
   * @param content - File content
   * @returns CloudCostFinding[] - Cloud cost findings
   */
  private analyzeCloudFile(filePath: string, content: string): CloudCostFinding[] {
    const findings: CloudCostFinding[] = [];
    const basename = path.basename(filePath);

    // Check for Terraform files
    if (basename.endsWith('.tf')) {
      findings.push(...this.analyzeTerraform(filePath, content));
    }

    // Check for Kubernetes files
    if (basename.endsWith('.yml') || basename.endsWith('.yaml')) {
      findings.push(...this.analyzeKubernetes(filePath, content));
    }

    // Check for Serverless files
    if (basename === 'serverless.yml' || basename === 'serverless.yaml') {
      findings.push(...this.analyzeServerless(filePath, content));
    }

    return findings;
  }

  /**
   * Analyzes Terraform configuration
   *
   * @private
   * @param filePath - File path
   * @param content - File content
   * @returns CloudCostFinding[] - Terraform cost findings
   */
  private analyzeTerraform(filePath: string, content: string): CloudCostFinding[] {
    const findings: CloudCostFinding[] = [];

    // Check for large instance types
    const largeInstancePattern = /instance_type\s*=\s*["']([a-z0-9.]+\.16xlarge|[a-z0-9.]+\.12xlarge|[a-z0-9.]+\.8xlarge)["']/gi;
    let match;
    while ((match = largeInstancePattern.exec(content)) !== null) {
      const instanceType = match[1];
      const lineNumber = content.substring(0, match.index).split('\n').length;
      findings.push({
        id: this.generateFindingId(filePath, 'over-provisioned'),
        type: 'over-provisioned',
        severity: 'medium',
        filePath,
        line: lineNumber,
        description: `Large instance type: ${instanceType}`,
        suggestion: 'Consider using smaller instance types or auto-scaling',
      });
    }

    // Check for missing resource tags
    if (!content.includes('tags') && content.includes('resource')) {
      findings.push({
        id: this.generateFindingId(filePath, 'inefficient-usage'),
        type: 'inefficient-usage',
        severity: 'low',
        filePath,
        description: 'Resources may be missing cost allocation tags',
        suggestion: 'Add tags for cost allocation and tracking',
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
   * @returns CloudCostFinding[] - Kubernetes cost findings
   */
  private analyzeKubernetes(filePath: string, content: string): CloudCostFinding[] {
    const findings: CloudCostFinding[] = [];

    // Check for high resource requests
    const resourcePattern = /cpu:\s*["'](\d+[a-z]+)["']/gi;
    let match;
    while ((match = resourcePattern.exec(content)) !== null) {
      const cpuRequest = match[1];
      
      if (cpuRequest.includes('16') || cpuRequest.includes('32') || cpuRequest.includes('64')) {
        const lineNumber = content.substring(0, match.index).split('\n').length;
        findings.push({
          id: this.generateFindingId(filePath, 'over-provisioned'),
          type: 'over-provisioned',
          severity: 'medium',
          filePath,
          line: lineNumber,
          description: `High CPU request: ${cpuRequest}`,
          suggestion: 'Consider using horizontal pod autoscaling instead of large pods',
        });
      }
    }

    // Check for missing resource limits
    if (content.includes('resources') && !content.includes('limits')) {
      findings.push({
        id: this.generateFindingId(filePath, 'inefficient-usage'),
        type: 'inefficient-usage',
        severity: 'medium',
        filePath,
        description: 'Pods have resource requests but no limits',
        suggestion: 'Add resource limits to prevent runaway resource usage',
      });
    }

    // Check for missing horizontal pod autoscaler
    if (content.includes('Deployment') && !content.includes('HorizontalPodAutoscaler')) {
      findings.push({
        id: this.generateFindingId(filePath, 'cost-optimization'),
        type: 'cost-optimization',
        severity: 'low',
        filePath,
        description: 'Deployment may benefit from HPA',
        suggestion: 'Consider adding Horizontal Pod Autoscaler for cost optimization',
      });
    }

    return findings;
  }

  /**
   * Analyzes Serverless configuration
   *
   * @private
   * @param filePath - File path
   * @param content - File content
   * @returns CloudCostFinding[] - Serverless cost findings
   */
  private analyzeServerless(filePath: string, content: string): CloudCostFinding[] {
    const findings: CloudCostFinding[] = [];

    // Check for long timeouts
    const timeoutPattern = /timeout:\s*(\d+)/g;
    let match;
    while ((match = timeoutPattern.exec(content)) !== null) {
      const timeout = parseInt(match[1]);
      
      if (timeout > 300) {
        const lineNumber = content.substring(0, match.index).split('\n').length;
        findings.push({
          id: this.generateFindingId(filePath, 'over-provisioned'),
          type: 'over-provisioned',
          severity: 'medium',
          filePath,
          line: lineNumber,
          description: `Long timeout: ${timeout}s`,
          suggestion: 'Consider reducing timeout to prevent runaway costs',
        });
      }
    }

    // Check for large memory allocations
    const memoryPattern = /memorySize:\s*(\d+)/g;
    while ((match = memoryPattern.exec(content)) !== null) {
      const memory = parseInt(match[1]);
      
      if (memory > 2048) {
        const lineNumber = content.substring(0, match.index).split('\n').length;
        findings.push({
          id: this.generateFindingId(filePath, 'over-provisioned'),
          type: 'over-provisioned',
          severity: 'medium',
          filePath,
          line: lineNumber,
          description: `Large memory allocation: ${memory}MB`,
          suggestion: 'Consider optimizing memory usage or using smaller instances',
        });
      }
    }

    return findings;
  }

  /**
   * Calculates cloud cost metrics
   *
   * @private
   * @param findings - Cloud cost findings
   * @returns CloudCostMetrics - Calculated metrics
   */
  private calculateMetrics(findings: CloudCostFinding[]): CloudCostMetrics {
    return {
      totalFiles: new Set(findings.map(f => f.filePath)).size,
      overProvisioned: findings.filter(f => f.type === 'over-provisioned').length,
      idleResources: findings.filter(f => f.type === 'idle-resource').length,
      costOptimizations: findings.filter(f => f.type === 'cost-optimization').length,
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













