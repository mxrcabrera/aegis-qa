/**
 * Phase 15B: Cloud Infrastructure
 *
 * Purpose: Audit Infrastructure as Code (IaC) files for security and cost issues.
 *
 * Architecture:
 * - Cloud Infrastructure Audit: Detect Terraform .tf and CloudFormation .yaml files
 * - Permission Audit: Detect overly permissive settings (0.0.0.0/0, S3 public access)
 * - Cost Efficiency: Detect oversized instances for dev environments
 * - Hardware Guard: Monitor RAM swap, pause if > 500MB
 *
 * @module phases/phase-15b-cloud-infra
 * @since 2.0.0
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { ThermalController } from '../core/thermal-controller.js';
import { StatePersistence, type ExecutionState } from '../core/state-persistence.js';

/**
 * Cloud infrastructure finding
 */
interface CloudInfraFinding {
  /** Unique ID based on file hash + line */
  id: string;
  /** Finding type */
  type: 'iac-detected' | 'permission-issue' | 'cost-inefficiency';
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
  /** Whether in Core Path */
  isCorePath?: boolean;
  /** The permission type (for permission issues) */
  permissionType?: string;
}

/**
 * Cloud infrastructure audit result
 */
interface CloudInfraAuditResult {
  /** IaC platform detected */
  iacPlatform: 'terraform' | 'cloudformation' | 'none';
  /** IaC files found */
  iacFiles: string[];
  /** Permission issues detected */
  permissionIssues: Array<{ path: string; line: number; type: string; value: string }>;
  /** Cost inefficiencies detected */
  costInefficiencies: Array<{ path: string; line: number; type: string; value: string }>;
  /** Total IaC files analyzed */
  totalFilesAnalyzed: number;
}

/**
 * Phase 15B configuration
 */
interface Phase15BConfig {
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
 * Phase 15B result
 */
export interface Phase15BResult {
  /** Overall success */
  success: boolean;
  /** Total files analyzed */
  totalFiles: number;
  /** Cloud infrastructure findings */
  cloudInfraFindings: CloudInfraFinding[];
  /** Cloud infrastructure audit result */
  cloudInfraAudit: CloudInfraAuditResult;
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
 * Phase 15B: Cloud Infrastructure
 *
 * This phase audits IaC files for security and cost issues.
 *
 * @class Phase15BCloudInfra
 */
export class Phase15BCloudInfra {
  private config: Phase15BConfig;

  constructor(config: Phase15BConfig) {
    this.config = config;
  }

  /**
   * Executes Phase 15B: Cloud Infrastructure
   *
   * @returns Promise<Phase15BResult> - Cloud infrastructure assessment result
   */
  async execute(): Promise<Phase15BResult> {
    const startTime = Date.now();
    console.log('INFO Phase 15B: Cloud Infrastructure\n');

    try {
      // Thermal Verification: Check system resources before analyzing IaC files
      console.log('INFO Verifying system resources...');
      const resourceCheck = await this.config.thermalController.checkSystemResources();
      console.log(`INFO CPU Usage: ${resourceCheck.cpuUsage}%`);
      console.log(`INFO RAM Usage: ${resourceCheck.ramUsage}%`);
      console.log(`INFO RAM Available: ${resourceCheck.ramAvailable} GB\n`);

      if (!resourceCheck.isSafe) {
        console.log(`WARNING System resources not safe (${resourceCheck.category}). Applying cooldown...`);
        await this.config.thermalController.applyAdaptiveCooldown('medium');
      }

      // Perform cloud infrastructure audit
      const cloudInfraAudit = await this.performCloudInfraAudit();

      // Generate findings from audit
      const allFindings: CloudInfraFinding[] = this.generateFindingsFromAudit(cloudInfraAudit);

      // Write partial report
      await this.writePartialReport(allFindings, cloudInfraAudit);

      // Store Phase 15B results in StatePersistence for shared context
      await this.config.statePersistence.storeAnalysisResults(15, {
        cloudInfraFindings: allFindings,
        cloudInfraAudit,
        criticalFindings: allFindings.filter(f => f.severity === 'critical').length,
        highSeverityFindings: allFindings.filter(f => f.severity === 'high').length,
      }, this.config.currentState);

      const executionTimeMs = Date.now() - startTime;

      // Final resource check
      const finalResources = await this.config.thermalController.checkSystemResources();
      console.log(`\nSUCCESS Phase 15B Complete`);
      console.log(`INFO Total findings: ${allFindings.length}`);
      console.log(`INFO Critical findings: ${allFindings.filter(f => f.severity === 'critical').length}`);
      console.log(`INFO High severity findings: ${allFindings.filter(f => f.severity === 'high').length}`);
      console.log(`INFO IaC Platform: ${cloudInfraAudit.iacPlatform}`);
      console.log(`INFO Final CPU Usage: ${finalResources.cpuUsage}%`);
      console.log(`INFO Final RAM Usage: ${finalResources.ramUsage}%\n`);

      return {
        success: true,
        totalFiles: cloudInfraAudit.totalFilesAnalyzed,
        cloudInfraFindings: allFindings,
        cloudInfraAudit,
        criticalFindings: allFindings.filter(f => f.severity === 'critical').length,
        highSeverityFindings: allFindings.filter(f => f.severity === 'high').length,
        executionTimeMs,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`ERROR Phase 15B failed: ${errorMessage}\n`);

      return {
        success: false,
        totalFiles: 0,
        cloudInfraFindings: [],
        cloudInfraAudit: {
          iacPlatform: 'none',
          iacFiles: [],
          permissionIssues: [],
          costInefficiencies: [],
          totalFilesAnalyzed: 0,
        },
        criticalFindings: 0,
        highSeverityFindings: 0,
        executionTimeMs: Date.now() - startTime,
        error: errorMessage,
      };
    }
  }

  /**
   * Performs cloud infrastructure audit
   *
   * @private
   * @returns Promise<CloudInfraAuditResult> - Cloud infrastructure audit result
   */
  private async performCloudInfraAudit(): Promise<CloudInfraAuditResult> {
    const result: CloudInfraAuditResult = {
      iacPlatform: 'none',
      iacFiles: [],
      permissionIssues: [],
      costInefficiencies: [],
      totalFilesAnalyzed: 0,
    };

    // Search for Terraform files
    const terraformFiles = await this.findIaCFiles('.tf');
    if (terraformFiles.length > 0) {
      result.iacPlatform = 'terraform';
      result.iacFiles.push(...terraformFiles);
    }

    // Search for CloudFormation files
    const cloudFormationFiles = await this.findIaCFiles('.yaml');
    if (cloudFormationFiles.length > 0 && result.iacPlatform === 'none') {
      result.iacPlatform = 'cloudformation';
      result.iacFiles.push(...cloudFormationFiles);
    } else if (cloudFormationFiles.length > 0) {
      result.iacFiles.push(...cloudFormationFiles);
    }

    // Track previous swap usage to detect active growth
    let previousSwapUsage = 0;
    const initialResourceCheck = await this.config.thermalController.checkSystemResources();
    previousSwapUsage = initialResourceCheck.ramUsage || 0;

    // Analyze each IaC file
    for (const iacFile of result.iacFiles) {
      result.totalFilesAnalyzed++;
      
      // Swap & Pressure Guard: Check if Swap is actively growing
      const resourceCheck = await this.config.thermalController.checkSystemResources();
      const currentSwapUsage = resourceCheck.ramUsage || 0;
      
      // If Swap is growing by more than 5%, suspend and flush buffers
      if (currentSwapUsage > previousSwapUsage && (currentSwapUsage - previousSwapUsage) > 5) {
        console.log(`WARNING Swap actively growing (${previousSwapUsage}% -> ${currentSwapUsage}%). Suspending for 60 seconds and flushing buffers...`);
        await new Promise(resolve => setTimeout(resolve, 60000));
        
        // Flush buffers by forcing garbage collection if available
        if (typeof global.gc === 'function') {
          global.gc();
          console.log('INFO Buffers flushed (global.gc())');
        }
        
        // Re-check resources after pause
        const postPauseCheck = await this.config.thermalController.checkSystemResources();
        previousSwapUsage = postPauseCheck.ramUsage || 0;
      } else {
        previousSwapUsage = currentSwapUsage;
      }

      // Also check if RAM > 90% (existing guard)
      if (resourceCheck.ramUsage > 90) {
        console.log(`WARNING RAM usage high (${resourceCheck.ramUsage}%). Pausing for 45 seconds...`);
        await new Promise(resolve => setTimeout(resolve, 45000));
      }

      if (iacFile.endsWith('.tf') || iacFile.endsWith('.tfvars')) {
        this.analyzeTerraformFile(iacFile, result);
      } else if (iacFile.endsWith('.yaml') || iacFile.endsWith('.yml')) {
        this.analyzeCloudFormationFile(iacFile, result);
      }
    }

    return result;
  }

  /**
   * Finds IaC files in the repository
   *
   * @private
   * @param extension - File extension to search for
   * @returns Promise<string[]> - Array of file paths
   */
  private async findIaCFiles(extension: string): Promise<string[]> {
    const files: string[] = [];

    const findFilesRecursive = (dir: string) => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          // Skip .git and node_modules directories
          if (entry.name !== '.git' && entry.name !== 'node_modules') {
            findFilesRecursive(fullPath);
          }
        } else if (entry.isFile() && fullPath.endsWith(extension)) {
          files.push(fullPath);
        }
      }
    };

    findFilesRecursive(this.config.projectRoot);
    return files;
  }

  /**
   * Checks if a file is in .gitignore
   *
   * @private
   * @param filePath - File path to check
   * @returns boolean - Whether file is in .gitignore
   */
  private isFileInGitignore(filePath: string): boolean {
    const gitignorePath = path.join(this.config.projectRoot, '.gitignore');
    if (!fs.existsSync(gitignorePath)) {
      return false;
    }

    const gitignoreContent = fs.readFileSync(gitignorePath, 'utf-8');
    const relativePath = path.relative(this.config.projectRoot, filePath);
    const fileName = path.basename(filePath);
    const dirName = path.dirname(relativePath);

    const patterns = gitignoreContent.split('\n').filter(line => line.trim() && !line.trim().startsWith('#'));

    for (const pattern of patterns) {
      const trimmedPattern = pattern.trim();
      
      // Check if pattern matches the file
      if (trimmedPattern === fileName || trimmedPattern === relativePath) {
        return true;
      }
      
      // Check for directory patterns
      if (trimmedPattern.endsWith('/') && dirName.startsWith(trimmedPattern)) {
        return true;
      }
      
      // Check for wildcard patterns
      if (trimmedPattern.includes('*')) {
        const regexPattern = trimmedPattern.replace(/\./g, '\\.').replace(/\//g, '\\/').replace(/\*/g, '.*');
        try {
          const regex = new RegExp(regexPattern);
          if (regex.test(relativePath) || regex.test(fileName)) {
            return true;
          }
        } catch {
          // Invalid regex pattern, skip
        }
      }
    }

    return false;
  }

  /**
   * Analyzes Terraform file
   *
   * @private
   * @param filePath - Terraform file path
   * @param result - Cloud infrastructure audit result
   */
  private analyzeTerraformFile(filePath: string, result: CloudInfraAuditResult): void {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');
      const isTfvars = filePath.endsWith('.tfvars');
      const isGitIgnored = this.isFileInGitignore(filePath);

      for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
        const line = lines[lineIndex];
        const lineNumber = lineIndex + 1;

        // Check for 0.0.0.0/0 in Security Groups
        if (line.includes('0.0.0.0/0') || line.includes('0.0.0.0/0')) {
          result.permissionIssues.push({
            path: path.relative(this.config.projectRoot, filePath),
            line: lineNumber,
            type: 'open-cidr',
            value: '0.0.0.0/0',
          });
        }

        // Check for S3 public access
        if (line.toLowerCase().includes('acl') && line.toLowerCase().includes('public')) {
          result.permissionIssues.push({
            path: path.relative(this.config.projectRoot, filePath),
            line: lineNumber,
            type: 's3-public-access',
            value: line.trim(),
          });
        }

        // Check for oversized instances in dev environment
        if (line.toLowerCase().includes('dev') && (line.includes('t3.xlarge') || line.includes('t3.2xlarge') || line.includes('m5.large'))) {
          result.costInefficiencies.push({
            path: path.relative(this.config.projectRoot, filePath),
            line: lineNumber,
            type: 'oversized-instance',
            value: line.trim(),
          });
        }

        // Secret Leak Detection in Terraform (.tf and .tfvars)
        // Check for access_key, secret_key patterns
        const secretPatterns = [
          /access_key\s*=\s*["']([^"']{10,})["']/gi,
          /secret_key\s*=\s*["']([^"']{20,})["']/gi,
          /private_key\s*=\s*["']([^"']{20,})["']/gi,
          /api_key\s*=\s*["']([^"']{10,})["']/gi,
          /token\s*=\s*["']([^"']{10,})["']/gi,
        ];

        for (const pattern of secretPatterns) {
          const matches = line.match(pattern);
          if (matches) {
            // If file is .tfvars and NOT in .gitignore, escalate to BLOCKER
            if (isTfvars && !isGitIgnored) {
              result.permissionIssues.push({
                path: path.relative(this.config.projectRoot, filePath),
                line: lineNumber,
                type: 'secret-leak-blocker',
                value: 'Secret in .tfvars not in .gitignore',
              });
            } else if (!isGitIgnored) {
              result.permissionIssues.push({
                path: path.relative(this.config.projectRoot, filePath),
                line: lineNumber,
                type: 'secret-leak',
                value: 'Secret in .tf file not in .gitignore',
              });
            }
          }
        }
      }
    } catch {
      // Failed to read Terraform file
    }
  }

  /**
   * Analyzes CloudFormation file
   *
   * @private
   * @param filePath - CloudFormation file path
   * @param result - Cloud infrastructure audit result
   */
  private analyzeCloudFormationFile(filePath: string, result: CloudInfraAuditResult): void {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');

      for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
        const line = lines[lineIndex];
        const lineNumber = lineIndex + 1;

        // Check for 0.0.0.0/0 in Security Groups
        if (line.includes('0.0.0.0/0')) {
          result.permissionIssues.push({
            path: path.relative(this.config.projectRoot, filePath),
            line: lineNumber,
            type: 'open-cidr',
            value: '0.0.0.0/0',
          });
        }

        // Check for S3 public access
        if (line.toLowerCase().includes('publicaccessblockconfiguration') && line.toLowerCase().includes('false')) {
          result.permissionIssues.push({
            path: path.relative(this.config.projectRoot, filePath),
            line: lineNumber,
            type: 's3-public-access',
            value: line.trim(),
          });
        }

        // Check for oversized instances in dev environment
        if (line.toLowerCase().includes('dev') && (line.includes('t3.xlarge') || line.includes('t3.2xlarge') || line.includes('m5.large'))) {
          result.costInefficiencies.push({
            path: path.relative(this.config.projectRoot, filePath),
            line: lineNumber,
            type: 'oversized-instance',
            value: line.trim(),
          });
        }
      }
    } catch {
      // Failed to read CloudFormation file
    }
  }

  /**
   * Generates findings from cloud infrastructure audit
   *
   * @private
   * @param audit - Cloud infrastructure audit result
   * @returns CloudInfraFinding[] - Array of findings
   */
  private generateFindingsFromAudit(audit: CloudInfraAuditResult): CloudInfraFinding[] {
    const findings: CloudInfraFinding[] = [];

    // Permission issues (Critical)
    for (const issue of audit.permissionIssues) {
      let severity: 'low' | 'medium' | 'high' | 'critical' = 'critical';
      
      // Secret leak in .tfvars not in .gitignore = BLOCKER (critical)
      if (issue.type === 'secret-leak-blocker') {
        severity = 'critical';
      }
      
      findings.push({
        id: this.generateFindingId(issue.path, issue.line, 'permission-issue'),
        type: 'permission-issue',
        severity,
        filePath: issue.path,
        line: issue.line,
        description: `Overly permissive configuration detected: ${issue.type}`,
        suggestion: issue.type === 'secret-leak-blocker' 
          ? 'BLOCKER: Add .tfvars file to .gitignore immediately to prevent secret leak'
          : 'Restrict access to specific IP ranges or use security best practices',
        isCorePath: false,
        permissionType: issue.type,
      });
    }

    // Cost inefficiencies (Low)
    for (const inefficiency of audit.costInefficiencies) {
      findings.push({
        id: this.generateFindingId(inefficiency.path, inefficiency.line, 'cost-inefficiency'),
        type: 'cost-inefficiency',
        severity: 'low',
        filePath: inefficiency.path,
        line: inefficiency.line,
        description: `Oversized instance for dev environment detected`,
        suggestion: 'Use smaller instance types for development to reduce costs',
        isCorePath: false,
      });
    }

    return findings;
  }

  /**
   * Writes partial report for Phase 15B
   *
   * @private
   * @param findings - Cloud infrastructure findings
   * @param audit - Cloud infrastructure audit result
   */
  private async writePartialReport(findings: CloudInfraFinding[], audit: CloudInfraAuditResult): Promise<void> {
    try {
      const reportPath = path.join(this.config.projectRoot, 'qa-report.partial.md');
      const timestamp = new Date().toISOString();

      let reportContent = `
## Phase 15B: Cloud Infrastructure - COMPLETED
- **Timestamp:** ${timestamp}

### Summary
- **Total Findings:** ${findings.length}
- **Critical Findings:** ${findings.filter(f => f.severity === 'critical').length}
- **High Severity Findings:** ${findings.filter(f => f.severity === 'high').length}
- **IaC Platform:** ${audit.iacPlatform}
- **IaC Files:** ${audit.iacFiles.length}
- **Permission Issues:** ${audit.permissionIssues.length}
- **Cost Inefficiencies:** ${audit.costInefficiencies.length}
- **Total Files Analyzed:** ${audit.totalFilesAnalyzed}

### IaC Files Found
`;
      if (audit.iacFiles.length > 0) {
        for (const iacFile of audit.iacFiles) {
          reportContent += `- ${path.relative(this.config.projectRoot, iacFile)}\n`;
        }
      } else {
        reportContent += `- No IaC files detected\n`;
      }

      reportContent += `
### Permission Issues
- **Issues detected:** ${audit.permissionIssues.length}
`;

      if (audit.permissionIssues.length > 0) {
        reportContent += `**Permission issues:**\n`;
        for (const issue of audit.permissionIssues) {
          reportContent += `- ${issue.path}:${issue.line} - ${issue.type} (value: ${issue.value})\n`;
        }
      }

      reportContent += `
### Cost Inefficiencies
- **Inefficiencies detected:** ${audit.costInefficiencies.length}
`;

      if (audit.costInefficiencies.length > 0) {
        reportContent += `**Cost inefficiencies:**\n`;
        for (const inefficiency of audit.costInefficiencies) {
          reportContent += `- ${inefficiency.path}:${inefficiency.line} - ${inefficiency.type} (value: ${inefficiency.value})\n`;
        }
      }

      reportContent += `
### Cloud Infrastructure Findings
`;

      for (const finding of findings) {
        const severityIcon = finding.severity === 'critical' ? 'CRITICAL' : finding.severity === 'high' ? 'HIGH' : finding.severity === 'medium' ? 'MEDIUM' : 'LOW';
        reportContent += `- [${severityIcon}] **${finding.type}** ${finding.filePath}`;
        if (finding.line) {
          reportContent += `:${finding.line}`;
        }
        reportContent += `\n`;
        reportContent += `  - ${finding.description}\n`;
        if (finding.suggestion) {
          reportContent += `  - Suggestion: ${finding.suggestion}\n`;
        }
        if (finding.isCorePath) {
          reportContent += `  - CORE PATH FILE\n`;
        }
        reportContent += `\n`;
      }

      reportContent += `

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

      console.log(`INFO Partial report written: ${reportPath}`);
    } catch (error) {
      console.warn('WARNING Failed to write partial report:', error instanceof Error ? error.message : error);
    }
  }

  /**
   * Generates a unique finding ID
   *
   * @private
   * @param filePath - File path
   * @param line - Line number
   * @param type - Finding type
   * @returns string - Unique finding ID
   */
  private generateFindingId(filePath: string, line: number, type: string): string {
    const hash = crypto.createHash('sha1').update(filePath + line + type).digest('hex');
    return hash.substring(0, 12);
  }
}

