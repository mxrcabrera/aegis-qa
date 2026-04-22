// eslint-disable @typescript-eslint/no-explicit-any
/**
 * Phase 15C: Containerization
 *
 * Purpose: Audit Dockerfile and container configurations for security and cost issues.
 *
 * Architecture:
 * - Dockerfile Audit: Detect USER root usage, latest images, secrets in ENV
 * - Cost Efficiency: Detect oversized instances for dev environments
 * - Hardware Guard: Monitor RAM, pause if > 90%
 *
 * @module phases/phase-15c-containerization
 * @since 2.0.0
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { ThermalController } from '../core/thermal-controller.js';
import { StatePersistence, type ExecutionState } from '../core/state-persistence.js';

/**
 * Containerization finding
 */
interface ContainerizationFinding {
  /** Unique ID based on file hash + line */
  id: string;
  /** Finding type */
  type: 'dockerfile-detected' | 'security-issue' | 'cost-inefficiency';
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
  /** The security issue type (for security issues) */
  securityType?: string;
}

/**
 * Containerization audit result
 */
interface ContainerizationAuditResult {
  /** Dockerfile files found */
  dockerfileFiles: string[];
  /** Security issues detected */
  securityIssues: Array<{ path: string; line: number; type: string; value: string }>;
  /** Cost inefficiencies detected */
  costInefficiencies: Array<{ path: string; line: number; type: string; value: string }>;
  /** Total files analyzed */
  totalFilesAnalyzed: number;
}

/**
 * Phase 15C configuration
 */
interface Phase15CConfig {
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
 * Phase 15C result
 */
export interface Phase15CResult {
  /** Overall success */
  success: boolean;
  /** Total files analyzed */
  totalFiles: number;
  /** Containerization findings */
  containerizationFindings: ContainerizationFinding[];
  /** Containerization audit result */
  containerizationAudit: ContainerizationAuditResult;
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
 * Phase 15C: Containerization
 *
 * This phase audits Dockerfile and container configurations for security and cost issues.
 *
 * @class Phase15CContainerization
 */
export class Phase15CContainerization {
  private config: Phase15CConfig;

  constructor(config: Phase15CConfig) {
    this.config = config;
  }

  /**
   * Executes Phase 15C: Containerization
   *
   * @returns Promise<Phase15CResult> - Containerization assessment result
   */
  async execute(): Promise<Phase15CResult> {
    const startTime = Date.now();
    console.log('INFO Phase 15C: Containerization\n');

    // Self-Audit de Infra: Verify Aegis QA's own Dockerfile or deployment configs
    console.log('INFO Running Self-Audit de Infra...');
    const selfAuditResult = this.runSelfAudit();
    if (!selfAuditResult.passed) {
      console.log(`[SELF-AUDIT-FAILED] ${selfAuditResult.reason}`);
    } else {
      console.log('INFO Self-Audit de Infra passed');
    }
    console.log('');

    try {
      // Thermal Verification: Check system resources before analyzing Dockerfiles
      console.log('INFO Verifying system resources...');
      const resourceCheck = await this.config.thermalController.checkSystemResources();
      console.log(`INFO CPU Usage: ${resourceCheck.cpuUsage}%`);
      console.log(`INFO RAM Usage: ${resourceCheck.ramUsage}%`);
      console.log(`INFO RAM Available: ${resourceCheck.ramAvailable} GB\n`);

      if (!resourceCheck.isSafe) {
        console.log(`WARNING System resources not safe (${resourceCheck.category}). Applying cooldown...`);
        await this.config.thermalController.applyAdaptiveCooldown('medium');
      }

      // Perform containerization audit
      const containerizationAudit = await this.performContainerizationAudit();

      // Generate findings from audit
      const allFindings: ContainerizationFinding[] = this.generateFindingsFromAudit(containerizationAudit);

      // Write partial report
      await this.writePartialReport(allFindings, containerizationAudit);

      // Store Phase 15C results in StatePersistence for shared context
      await this.config.statePersistence.storeAnalysisResults(15, {
        containerizationFindings: allFindings,
        containerizationAudit,
        criticalFindings: allFindings.filter(f => f.severity === 'critical').length,
        highSeverityFindings: allFindings.filter(f => f.severity === 'high').length,
      }, this.config.currentState);

      const executionTimeMs = Date.now() - startTime;

      // Final resource check
      const finalResources = await this.config.thermalController.checkSystemResources();
      console.log(`\nSUCCESS Phase 15C Complete`);
      console.log(`INFO Total findings: ${allFindings.length}`);
      console.log(`INFO Critical findings: ${allFindings.filter(f => f.severity === 'critical').length}`);
      console.log(`INFO High severity findings: ${allFindings.filter(f => f.severity === 'high').length}`);
      console.log(`INFO Dockerfiles analyzed: ${containerizationAudit.dockerfileFiles.length}`);
      console.log(`INFO Final CPU Usage: ${finalResources.cpuUsage}%`);
      console.log(`INFO Final RAM Usage: ${finalResources.ramUsage}%\n`);

      return {
        success: true,
        totalFiles: containerizationAudit.totalFilesAnalyzed,
        containerizationFindings: allFindings,
        containerizationAudit,
        criticalFindings: allFindings.filter(f => f.severity === 'critical').length,
        highSeverityFindings: allFindings.filter(f => f.severity === 'high').length,
        executionTimeMs,
      };
    } catch {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`ERROR Phase 15C failed: ${errorMessage}\n`);

      return {
        success: false,
        totalFiles: 0,
        containerizationFindings: [],
        containerizationAudit: {
          dockerfileFiles: [],
          securityIssues: [],
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
   * Performs containerization audit
   *
   * @private
   * @returns Promise<ContainerizationAuditResult> - Containerization audit result
   */
  private async performContainerizationAudit(): Promise<ContainerizationAuditResult> {
    const result: ContainerizationAuditResult = {
      dockerfileFiles: [],
      securityIssues: [],
      costInefficiencies: [],
      totalFilesAnalyzed: 0,
    };

    // Search for Dockerfile files
    const dockerfileFiles = await this.findDockerfiles();
    result.dockerfileFiles = dockerfileFiles;

    // Track previous swap usage to detect active growth
    let previousSwapUsage = 0;
    const initialResourceCheck = await this.config.thermalController.checkSystemResources();
    previousSwapUsage = initialResourceCheck.ramUsage || 0;

    // Analyze each Dockerfile
    for (const dockerfile of result.dockerfileFiles) {
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

      this.analyzeDockerfile(dockerfile, result);
    }

    return result;
  }

  /**
   * Finds Dockerfile files in the repository
   *
   * @private
   * @returns Promise<string[]> - Array of file paths
   */
  private async findDockerfiles(): Promise<string[]> {
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
        } else if (entry.isFile() && (entry.name === 'Dockerfile' || entry.name.toLowerCase().startsWith('dockerfile.'))) {
          files.push(fullPath);
        }
      }
    };

    findFilesRecursive(this.config.projectRoot);
    return files;
  }

  /**
   * Checks if the project is a production environment
   *
   * @private
   * @returns boolean - Whether project is production
   */
  private isProductionEnvironment(): boolean {
    const packageJsonPath = path.join(this.config.projectRoot, 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
      return false;
    }

    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
      const scripts = packageJson.scripts || {};
      
      // Check for production-related scripts
      const hasProductionScripts = 
        scripts['start:prod'] || 
        scripts['build:prod'] || 
        scripts['deploy'] ||
        scripts['production'];
      
      // Check for production-related dependencies
      const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
      const hasProductionDeps = 
        dependencies['pm2'] || 
        dependencies['nginx'] ||
        dependencies['aws-sdk'];
      
      return hasProductionScripts || hasProductionDeps;
    } catch {
      return false;
    }
  }

  /**
   * Runs Self-Audit de Infra
   * Verifies if Aegis QA's own Dockerfile or deployment configs comply with No Root and No Latest rules
   *
   * @private
   * @returns { passed: boolean; reason?: string } - Self-audit result
   */
  private runSelfAudit(): { passed: boolean; reason?: string } {
    // Check if Aegis QA has a Dockerfile
    const aegisDockerfile = path.join(this.config.projectRoot, 'Dockerfile');
    
    if (!fs.existsSync(aegisDockerfile)) {
      // No Dockerfile to audit, consider as pass
      return { passed: true };
    }

    try {
      const content = fs.readFileSync(aegisDockerfile, 'utf-8');
      const lines = content.split('\n');
      
      let hasRoot = false;
      let hasLatest = false;

      for (const line of lines) {
        const trimmedLine = line.trim();

        // Check for USER root
        if (trimmedLine.toUpperCase().startsWith('USER')) {
          const userValue = trimmedLine.substring(4).trim();
          if (userValue === 'root' || userValue === '0') {
            hasRoot = true;
          }
        }

        // Check for :latest
        if (trimmedLine.toUpperCase().startsWith('FROM')) {
          if (trimmedLine.includes(':latest')) {
            hasLatest = true;
          }
        }
      }

      if (hasRoot) {
        return { passed: false, reason: 'Aegis QA Dockerfile uses USER root' };
      }

      if (hasLatest) {
        return { passed: false, reason: 'Aegis QA Dockerfile uses :latest images' };
      }

      return { passed: true };
    } catch {
      // Failed to read Dockerfile, consider as pass (cannot audit)
      return { passed: true };
    }
  }

  /**
   * Analyzes Dockerfile for security and cost issues
   *
   * LÓGICA PARA PUNTO 2 (Dockerfile Audit):
   * 
   * 1. Detección de USER root:
   *    - Busca líneas con "USER root" o "USER 0"
   *    - Reporta como 'high' severity (riesgo de seguridad alto)
   * 
   * 2. Detección de imágenes base sin versión específica:
   *    - Busca "FROM" seguido de ":latest" o sin tag
   *    - Ejemplos: FROM node:latest, FROM ubuntu, FROM python
   *    - Reporta como 'medium' severity (riesgo de reproducibilidad)
   * 
   * 3. Detección de secrets inyectados vía ENV:
   *    - Busca ENV con patrones de credenciales: API_KEY, SECRET_KEY, PASSWORD, DATABASE_URL
   *    - Reporta como 'critical' severity (fuga de secretos)
   *    - Sugerencia: Usar Docker Secrets o env vars en runtime
   * 
   * 4. Dockerfile Multi-Stage Check:
   *    - Cuenta el número de instrucciones FROM
   *    - Si es producción y solo tiene un FROM con imagen pesada, reporta como 'low'
   *    - Sugerencia: Usar multi-stage builds para optimizar tamaño/seguridad
   *
   * @private
   * @param filePath - Dockerfile path
   * @param result - Containerization audit result
   */
  private analyzeDockerfile(filePath: string, result: ContainerizationAuditResult): void {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');
      
      // Multi-Stage Check variables
      let fromCount = 0;
      const isProduction = this.isProductionEnvironment();
      const heavyBaseImages = ['node', 'python', 'java', 'openjdk', 'ubuntu', 'debian'];
      let hasHeavyBaseImage = false;

      for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
        const line = lines[lineIndex];
        const lineNumber = lineIndex + 1;
        const trimmedLine = line.trim();

        // Check for USER root or USER 0
        if (trimmedLine.toUpperCase().startsWith('USER')) {
          const userValue = trimmedLine.substring(4).trim();
          if (userValue === 'root' || userValue === '0') {
            result.securityIssues.push({
              path: path.relative(this.config.projectRoot, filePath),
              line: lineNumber,
              type: 'user-root',
              value: trimmedLine,
            });
          }
        }

        // Check for base images without specific version (latest or no tag)
        if (trimmedLine.toUpperCase().startsWith('FROM')) {
          const fromValue = trimmedLine.substring(4).trim();
          fromCount++;
          
          // Check if it's a heavy base image
          for (const heavyImage of heavyBaseImages) {
            if (fromValue.toLowerCase().startsWith(heavyImage)) {
              hasHeavyBaseImage = true;
              break;
            }
          }
          
          // Check for :latest
          if (fromValue.includes(':latest')) {
            result.securityIssues.push({
              path: path.relative(this.config.projectRoot, filePath),
              line: lineNumber,
              type: 'latest-image',
              value: fromValue,
            });
          }
          // Check for images without tag (e.g., FROM node, FROM ubuntu)
          else if (!fromValue.includes(':') || fromValue.split(':')[1].split(' ')[0].trim() === '') {
            result.securityIssues.push({
              path: path.relative(this.config.projectRoot, filePath),
              line: lineNumber,
              type: 'no-version',
              value: fromValue,
            });
          }
        }

        // Check for secrets injected via ENV
        if (trimmedLine.toUpperCase().startsWith('ENV')) {
          const envValue = trimmedLine.substring(3).trim();
          const envKey = envValue.split('=')[0].toUpperCase();
          
          // Patterns for secret keys
          const secretPatterns = [
            'API_KEY', 'SECRET_KEY', 'PRIVATE_KEY', 'PASSWORD', 'PASS',
            'DATABASE_URL', 'MONGODB_URI', 'REDIS_URL', 'AWS_ACCESS_KEY',
            'AWS_SECRET_KEY', 'TOKEN', 'AUTH_TOKEN', 'JWT_SECRET',
          ];
          
          for (const pattern of secretPatterns) {
            if (envKey.includes(pattern)) {
              result.securityIssues.push({
                path: path.relative(this.config.projectRoot, filePath),
                line: lineNumber,
                type: 'secret-env',
                value: envValue,
              });
              break;
            }
          }
        }
      }
      
      // Dockerfile Multi-Stage Check
      // If production, only one FROM, and heavy base image, report as 'low'
      if (isProduction && fromCount === 1 && hasHeavyBaseImage) {
        result.costInefficiencies.push({
          path: path.relative(this.config.projectRoot, filePath),
          line: 1,
          type: 'no-multi-stage',
          value: `Single-stage build with heavy base image (${fromCount} FROM instruction)`,
        });
      }
    } catch {
      // Failed to read Dockerfile
    }
  }

  /**
   * Generates findings from containerization audit
   *
   * @private
   * @param audit - Containerization audit result
   * @returns ContainerizationFinding[] - Array of findings
   */
  private generateFindingsFromAudit(audit: ContainerizationAuditResult): ContainerizationFinding[] {
    const findings: ContainerizationFinding[] = [];

    // Security issues
    for (const issue of audit.securityIssues) {
      let severity: 'low' | 'medium' | 'high' | 'critical' = 'medium';
      
      if (issue.type === 'user-root') {
        severity = 'high';
      } else if (issue.type === 'secret-env') {
        severity = 'critical';
      } else if (issue.type === 'latest-image' || issue.type === 'no-version') {
        severity = 'medium';
      }

      findings.push({
        id: this.generateFindingId(issue.path, issue.line, 'security-issue'),
        type: 'security-issue',
        severity,
        filePath: issue.path,
        line: issue.line,
        description: `Dockerfile security issue detected: ${issue.type}`,
        suggestion: this.getSecuritySuggestion(issue.type),
        isCorePath: false,
        securityType: issue.type,
      });
    }

    // Cost inefficiencies
    for (const inefficiency of audit.costInefficiencies) {
      findings.push({
        id: this.generateFindingId(inefficiency.path, inefficiency.line, 'cost-inefficiency'),
        type: 'cost-inefficiency',
        severity: 'low',
        filePath: inefficiency.path,
        line: inefficiency.line,
        description: `Cost inefficiency detected in Dockerfile`,
        suggestion: 'Optimize Dockerfile for smaller image size and faster builds',
        isCorePath: false,
      });
    }

    return findings;
  }

  /**
   * Gets security suggestion based on issue type
   *
   * @private
   * @param type - Security issue type
   * @returns string - Suggestion
   */
  private getSecuritySuggestion(type: string): string {
    switch (type) {
      case 'user-root':
        return 'Use a non-root user (e.g., USER node or create a dedicated user)';
      case 'latest-image':
        return 'Use specific version tag (e.g., FROM node:18-alpine) for reproducibility';
      case 'no-version':
        return 'Use specific version tag (e.g., FROM node:18-alpine) for reproducibility';
      case 'secret-env':
        return 'Remove secrets from Dockerfile. Use Docker Secrets or environment variables at runtime';
      default:
        return 'Review and fix the security issue';
    }
  }

  /**
   * Writes partial report for Phase 15C
   *
   * @private
   * @param findings - Containerization findings
   * @param audit - Containerization audit result
   */
  private async writePartialReport(findings: ContainerizationFinding[], audit: ContainerizationAuditResult): Promise<void> {
    try {
      const reportPath = path.join(this.config.projectRoot, 'qa-report.partial.md');
      const timestamp = new Date().toISOString();

      let reportContent = `
## Phase 15C: Containerization - COMPLETED
- **Timestamp:** ${timestamp}

### Summary
- **Total Findings:** ${findings.length}
- **Critical Findings:** ${findings.filter(f => f.severity === 'critical').length}
- **High Severity Findings:** ${findings.filter(f => f.severity === 'high').length}
- **Dockerfiles:** ${audit.dockerfileFiles.length}
- **Security Issues:** ${audit.securityIssues.length}
- **Cost Inefficiencies:** ${audit.costInefficiencies.length}
- **Total Files Analyzed:** ${audit.totalFilesAnalyzed}

### Dockerfiles Found
`;
      if (audit.dockerfileFiles.length > 0) {
        for (const dockerfile of audit.dockerfileFiles) {
          reportContent += `- ${path.relative(this.config.projectRoot, dockerfile)}\n`;
        }
      } else {
        reportContent += `- No Dockerfiles detected\n`;
      }

      reportContent += `
### Security Issues
- **Issues detected:** ${audit.securityIssues.length}
`;

      if (audit.securityIssues.length > 0) {
        reportContent += `**Security issues:**\n`;
        for (const issue of audit.securityIssues) {
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
### Containerization Findings
`;

      for (const finding of findings) {
        const severityIcon = (finding as any).severity === 'critical' ? 'CRITICAL' : (finding as any).severity === 'high' ? 'HIGH' : (finding as any).severity === 'medium' ? 'MEDIUM' : 'LOW';
        reportContent += `- [${severityIcon}] **${(finding as any).type}** ${(finding as any).filePath}`;
        if ((finding as any).line) {
          reportContent += `:${(finding as any).line}`;
        }
        reportContent += `\n`;
        reportContent += `  - ${(finding as any).description}\n`;
        if ((finding as any).suggestion) {
          reportContent += `  - Suggestion: ${(finding as any).suggestion}\n`;
        }
        if ((finding as any).isCorePath) {
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
    } catch {
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











