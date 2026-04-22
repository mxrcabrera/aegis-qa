/**
 * Phase 15: CI/CD & DevOps
 *
 * Purpose: Audit automation and environments including CI workflows, deployment scripts,
 * and infrastructure configuration files.
 *
 * Architecture:
 * - Workflow Audit: Detect .github/workflows/, GitLab CI, CircleCI config files
 * - Health Check de CI: Verify workflows run test and build steps
 * - Deployment Leak Prevention: Search for hardcoded URLs/credentials in deployment scripts
 * - Infrastructure Hardening: Verify environment config files exist (vercel.json, docker-compose.yml)
 * - Thermal Verification: Mandatory resource check before analyzing YAML/JSON
 *
 * @module phases/phase-15-cicd-devops
 * @since 2.0.0
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { ThermalController } from '../core/thermal-controller.js';
import { StatePersistence, type ExecutionState } from '../core/state-persistence.js';

/**
 * CI/CD finding
 */
interface CICDFinding {
  /** Unique ID based on file hash + line */
  id: string;
  /** Finding type */
  type: 'workflow-detected' | 'ci-health-check' | 'deployment-leak' | 'missing-infra-config';
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
  /** The leaked credential type (for deployment leaks) */
  leakType?: string;
}

/**
 * CI/CD audit result
 */
interface CICDAuditResult {
  /** CI platform detected */
  ciPlatform: 'github' | 'gitlab' | 'circleci' | 'none';
  /** Workflow files found */
  workflowFiles: string[];
  /** Workflows with only checkout (Low severity) */
  checkoutOnlyWorkflows: string[];
  /** Workflows with test/build steps */
  healthyWorkflows: string[];
  /** Deployment leaks detected */
  deploymentLeaks: Array<{ path: string; line: number; type: string; value: string }>;
  /** Infrastructure config files found */
  infraConfigFiles: string[];
  /** Missing infrastructure config */
  missingInfraConfig: string[];
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
  /** Total files analyzed */
  totalFiles: number;
  /** CI/CD findings */
  cicdFindings: CICDFinding[];
  /** CI/CD audit result */
  cicdAudit: CICDAuditResult;
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
 * Phase 15: CI/CD & DevOps
 *
 * This phase audits CI/CD workflows, deployment scripts, and infrastructure configuration.
 *
 * @class Phase15CICDDevOps
 */
export class Phase15CICDDevOps {
  private config: Phase15Config;

  constructor(config: Phase15Config) {
    this.config = config;
  }

  /**
   * Executes Phase 15: CI/CD & DevOps
   *
   * @returns Promise<Phase15Result> - CI/CD assessment result
   */
  async execute(): Promise<Phase15Result> {
    const startTime = Date.now();
    console.log('INFO Phase 15: CI/CD & DevOps\n');

    try {
      // Thermal Verification: Check system resources before analyzing YAML/JSON
      console.log('INFO Verifying system resources...');
      const resourceCheck = await this.config.thermalController.checkSystemResources();
      console.log(`INFO CPU Usage: ${resourceCheck.cpuUsage}%`);
      console.log(`INFO RAM Usage: ${resourceCheck.ramUsage}%`);
      console.log(`INFO RAM Available: ${resourceCheck.ramAvailable} GB\n`);

      if (!resourceCheck.isSafe) {
        console.log(`WARNING System resources not safe (${resourceCheck.category}). Applying cooldown...`);
        await this.config.thermalController.applyAdaptiveCooldown('medium');
      }

      // Perform CI/CD audit
      const cicdAudit = await this.performCICDAudit();

      // Generate findings from audit
      const allFindings: CICDFinding[] = this.generateFindingsFromAudit(cicdAudit);

      // Write partial report
      await this.writePartialReport(allFindings, cicdAudit);

      // Store Phase 15 results in StatePersistence for shared context
      await this.config.statePersistence.storeAnalysisResults(15, {
        cicdFindings: allFindings,
        cicdAudit,
        criticalFindings: allFindings.filter(f => f.severity === 'critical').length,
        highSeverityFindings: allFindings.filter(f => f.severity === 'high').length,
      }, this.config.currentState);

      const executionTimeMs = Date.now() - startTime;

      // Final resource check
      const finalResources = await this.config.thermalController.checkSystemResources();
      console.log(`\nSUCCESS Phase 15 Complete`);
      console.log(`INFO Total findings: ${allFindings.length}`);
      console.log(`INFO Critical findings: ${allFindings.filter(f => f.severity === 'critical').length}`);
      console.log(`INFO High severity findings: ${allFindings.filter(f => f.severity === 'high').length}`);
      console.log(`INFO CI Platform: ${cicdAudit.ciPlatform}`);
      console.log(`INFO Final CPU Usage: ${finalResources.cpuUsage}%`);
      console.log(`INFO Final RAM Usage: ${finalResources.ramUsage}%\n`);

      return {
        success: true,
        totalFiles: cicdAudit.workflowFiles.length,
        cicdFindings: allFindings,
        cicdAudit,
        criticalFindings: allFindings.filter(f => f.severity === 'critical').length,
        highSeverityFindings: allFindings.filter(f => f.severity === 'high').length,
        executionTimeMs,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`ERROR Phase 15 failed: ${errorMessage}\n`);

      return {
        success: false,
        totalFiles: 0,
        cicdFindings: [],
        cicdAudit: {
          ciPlatform: 'none',
          workflowFiles: [],
          checkoutOnlyWorkflows: [],
          healthyWorkflows: [],
          deploymentLeaks: [],
          infraConfigFiles: [],
          missingInfraConfig: [],
        },
        criticalFindings: 0,
        highSeverityFindings: 0,
        executionTimeMs: Date.now() - startTime,
        error: errorMessage,
      };
    }
  }

  /**
   * Performs CI/CD audit
   *
   * @private
   * @returns Promise<CICDAuditResult> - CI/CD audit result
   */
  private async performCICDAudit(): Promise<CICDAuditResult> {
    const result: CICDAuditResult = {
      ciPlatform: 'none',
      workflowFiles: [],
      checkoutOnlyWorkflows: [],
      healthyWorkflows: [],
      deploymentLeaks: [],
      infraConfigFiles: [],
      missingInfraConfig: [],
    };

    // Workflow Audit: Detect CI configuration files
    const githubWorkflowsPath = path.join(this.config.projectRoot, '.github', 'workflows');
    const gitlabCiPath = path.join(this.config.projectRoot, '.gitlab-ci.yml');
    const circleCiPath = path.join(this.config.projectRoot, '.circleci', 'config.yml');

    // Detect GitHub Actions
    if (fs.existsSync(githubWorkflowsPath)) {
      result.ciPlatform = 'github';
      const workflowFiles = fs.readdirSync(githubWorkflowsPath);
      for (const workflowFile of workflowFiles) {
        const fullPath = path.join(githubWorkflowsPath, workflowFile);
        if (fs.statSync(fullPath).isFile()) {
          result.workflowFiles.push(fullPath);
          this.analyzeGitHubWorkflow(fullPath, result);
        }
      }
    }

    // Detect GitLab CI
    if (fs.existsSync(gitlabCiPath)) {
      result.ciPlatform = 'gitlab';
      result.workflowFiles.push(gitlabCiPath);
      this.analyzeGitLabCI(gitlabCiPath, result);
    }

    // Detect CircleCI
    if (fs.existsSync(circleCiPath)) {
      result.ciPlatform = 'circleci';
      result.workflowFiles.push(circleCiPath);
      this.analyzeCircleCI(circleCiPath, result);
    }

    // Deployment Leak Prevention: Search for hardcoded URLs/credentials
    for (const workflowFile of result.workflowFiles) {
      const leaks = this.detectDeploymentLeaks(workflowFile);
      result.deploymentLeaks.push(...leaks);
    }

    // Infrastructure Hardening: Check for config files
    const packageJsonPath = path.join(this.config.projectRoot, 'package.json');
    let isNextJs = false;
    
    if (fs.existsSync(packageJsonPath)) {
      try {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
        const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
        isNextJs = !!dependencies['next'];
      } catch {
        // Invalid package.json
      }
    }

    // Check for infrastructure config files
    const vercelJsonPath = path.join(this.config.projectRoot, 'vercel.json');
    const dockerComposePath = path.join(this.config.projectRoot, 'docker-compose.yml');
    const dockerfilePath = path.join(this.config.projectRoot, 'Dockerfile');

    if (fs.existsSync(vercelJsonPath)) {
      result.infraConfigFiles.push('vercel.json');
    } else if (isNextJs) {
      result.missingInfraConfig.push('vercel.json');
    }

    if (fs.existsSync(dockerComposePath)) {
      result.infraConfigFiles.push('docker-compose.yml');
    }

    if (fs.existsSync(dockerfilePath)) {
      result.infraConfigFiles.push('Dockerfile');
    }

    return result;
  }

  /**
   * Analyzes GitHub Actions workflow file
   *
   * @private
   * @param filePath - Workflow file path
   * @param result - CI/CD audit result
   */
  private analyzeGitHubWorkflow(filePath: string, result: CICDAuditResult): void {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');
      
      let hasCheckout = false;
      let hasTest = false;
      let hasBuild = false;

      for (const line of lines) {
        const lowerLine = line.toLowerCase();
        
        if (lowerLine.includes('uses: actions/checkout')) {
          hasCheckout = true;
        }
        if (lowerLine.includes('npm test') || lowerLine.includes('yarn test') || lowerLine.includes('jest') || lowerLine.includes('vitest')) {
          hasTest = true;
        }
        if (lowerLine.includes('npm run build') || lowerLine.includes('yarn build') || lowerLine.includes('next build')) {
          hasBuild = true;
        }
      }

      // Health Check: If only checkout, report as Low
      if (hasCheckout && !hasTest && !hasBuild) {
        result.checkoutOnlyWorkflows.push(filePath);
      } else if (hasTest || hasBuild) {
        result.healthyWorkflows.push(filePath);
      }
    } catch {
      // Failed to read workflow file
    }
  }

  /**
   * Analyzes GitLab CI configuration
   *
   * @private
   * @param filePath - GitLab CI file path
   * @param result - CI/CD audit result
   */
  private analyzeGitLabCI(filePath: string, result: CICDAuditResult): void {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');
      
      let hasTest = false;
      let hasBuild = false;

      for (const line of lines) {
        const lowerLine = line.toLowerCase();
        
        if (lowerLine.includes('test') || lowerLine.includes('jest') || lowerLine.includes('vitest')) {
          hasTest = true;
        }
        if (lowerLine.includes('build') || lowerLine.includes('compile')) {
          hasBuild = true;
        }
      }

      if (hasTest || hasBuild) {
        result.healthyWorkflows.push(filePath);
      } else {
        result.checkoutOnlyWorkflows.push(filePath);
      }
    } catch {
      // Failed to read GitLab CI file
    }
  }

  /**
   * Analyzes CircleCI configuration
   *
   * @private
   * @param filePath - CircleCI file path
   * @param result - CI/CD audit result
   */
  private analyzeCircleCI(filePath: string, result: CICDAuditResult): void {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');
      
      let hasTest = false;
      let hasBuild = false;

      for (const line of lines) {
        const lowerLine = line.toLowerCase();
        
        if (lowerLine.includes('test') || lowerLine.includes('jest') || lowerLine.includes('vitest')) {
          hasTest = true;
        }
        if (lowerLine.includes('build') || lowerLine.includes('compile')) {
          hasBuild = true;
        }
      }

      if (hasTest || hasBuild) {
        result.healthyWorkflows.push(filePath);
      } else {
        result.checkoutOnlyWorkflows.push(filePath);
      }
    } catch {
      // Failed to read CircleCI file
    }
  }

  /**
   * Detects deployment leaks (hardcoded URLs, credentials)
   *
   * LÓGICA PARA PUNTO 3 (Deployment Leak Prevention):
   * 
   * 1. Busca patrones de URLs de producción/staging:
   *    - https://api.production.com
   *    - https://staging.example.com
   *    - https://prod.example.com
   *    - *.production.*, *.staging.*, *.prod.*
   * 
   * 2. Busca credenciales hardcodeadas:
   *    - AWS: AWS_ACCESS_KEY_ID=, AWS_SECRET_ACCESS_KEY=, AKIAIOSFODNN7EXAMPLE
   *    - Vercel: VERCEL_TOKEN=, VERCEL_API_KEY=
   *    - Generic: API_KEY=, SECRET_KEY=, PRIVATE_KEY=
   *    - Database: DATABASE_URL=, MONGODB_URI=
   * 
   * 3. Busca tokens JWT hardcodeados (patrón eyJhbGciOiJIUzI1NiIs...)
   * 
   * 4. Busca passwords hardcodeados (PASSWORD=, PASS=, pwd=)
   * 
   * @private
   * @param filePath - File path to analyze
   * @returns Array<{ path: string; line: number; type: string; value: string }> - Detected leaks
   */
  private detectDeploymentLeaks(filePath: string): Array<{ path: string; line: number; type: string; value: string }> {
    const leaks: Array<{ path: string; line: number; type: string; value: string }> = [];
    
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');

      // Patterns for detection
      const patterns = {
        productionUrl: /https?:\/\/(www\.)?(prod|production|api\.prod|api\.production)\.[a-z0-9-]+\.[a-z]{2,}/gi,
        stagingUrl: /https?:\/\/(www\.)?(staging|stage|api\.staging|api\.stage)\.[a-z0-9-]+\.[a-z]{2,}/gi,
        awsAccessKey: /AWS_ACCESS_KEY_ID\s*[:=]\s*["']?([A-Z0-9]{20})["']?/gi,
        awsSecretKey: /AWS_SECRET_ACCESS_KEY\s*[:=]\s*["']?([a-zA-Z0-9+/]{40})["']?/gi,
        awsKeyPattern: /AKIA[0-9A-Z]{16}/g,
        vercelToken: /VERCEL_TOKEN\s*[:=]\s*["']?([a-zA-Z0-9_-]+)["']?/gi,
        apiKey: /API_KEY\s*[:=]\s*["']?([a-zA-Z0-9_-]+)["']?/gi,
        secretKey: /SECRET_KEY\s*[:=]\s*["']?([a-zA-Z0-9_-]+)["']?/gi,
        privateKey: /PRIVATE_KEY\s*[:=]\s*["']?([a-zA-Z0-9_-]+)["']?/gi,
        databaseUrl: /DATABASE_URL\s*[:=]\s*["']?([a-zA-Z0-9:/@._-]+)["']?/gi,
        mongodbUri: /MONGODB_URI\s*[:=]\s*["']?([a-zA-Z0-9:/@._-]+)["']?/gi,
        jwtToken: /eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g,
        password: /PASSWORD\s*[:=]\s*["']?([a-zA-Z0-9_-]+)["']?/gi,
        pass: /PASS\s*[:=]\s*["']?([a-zA-Z0-9_-]+)["']?/gi,
      };

      for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
        const line = lines[lineIndex];
        const lineNumber = lineIndex + 1;

        // Check each pattern
        for (const [patternName, pattern] of Object.entries(patterns)) {
          const matches = line.match(pattern);
          if (matches) {
            for (const match of matches) {
              // Skip if it's a reference to a variable (e.g., ${{ secrets.AWS_KEY }})
              if (match.includes('${') || match.includes('$(') || match.includes('{{')) {
                continue;
              }
              
              // Skip if it's a placeholder (e.g., YOUR_API_KEY_HERE)
              if (match.includes('YOUR_') || match.includes('PLACEHOLDER') || match.includes('REPLACE_WITH')) {
                continue;
              }

              leaks.push({
                path: path.relative(this.config.projectRoot, filePath),
                line: lineNumber,
                type: patternName,
                value: this.sanitizeCredential(match),
              });
            }
          }
        }
      }
    } catch {
      // Failed to read file
    }

    return leaks;
  }

  /**
   * Sanitizes credential value for reporting
   *
   * @private
   * @param value - Credential value
   * @returns string - Sanitized value
   */
  private sanitizeCredential(value: string): string {
    if (value.length <= 8) {
      return '****';
    }
    return value.substring(0, 4) + '****' + value.substring(value.length - 4);
  }

  /**
   * Generates findings from CI/CD audit
   *
   * @private
   * @param audit - CI/CD audit result
   * @returns CICDFinding[] - Array of findings
   */
  private generateFindingsFromAudit(audit: CICDAuditResult): CICDFinding[] {
    const findings: CICDFinding[] = [];

    // Checkout-only workflows (Low severity)
    for (const workflowFile of audit.checkoutOnlyWorkflows) {
      findings.push({
        id: this.generateFindingId(workflowFile, 1, 'ci-health-check'),
        type: 'ci-health-check',
        severity: 'low',
        filePath: path.relative(this.config.projectRoot, workflowFile),
        line: 1,
        description: 'CI workflow only has checkout step, missing test/build steps',
        suggestion: 'Add test and build steps to the CI workflow',
        isCorePath: false,
      });
    }

    // Deployment leaks (Critical)
    for (const leak of audit.deploymentLeaks) {
      findings.push({
        id: this.generateFindingId(leak.path, leak.line, 'deployment-leak'),
        type: 'deployment-leak',
        severity: 'critical',
        filePath: leak.path,
        line: leak.line,
        description: `Deployment leak detected: ${leak.type}`,
        suggestion: 'Remove hardcoded credentials/URLs and use environment variables or secrets',
        isCorePath: false,
        leakType: leak.type,
      });
    }

    // Missing infrastructure config
    for (const missingConfig of audit.missingInfraConfig) {
      findings.push({
        id: this.generateFindingId(missingConfig, 1, 'missing-infra-config'),
        type: 'missing-infra-config',
        severity: 'medium',
        filePath: missingConfig,
        line: 1,
        description: `Missing infrastructure configuration file: ${missingConfig}`,
        suggestion: `Create ${missingConfig} for proper deployment configuration`,
        isCorePath: true,
      });
    }

    return findings;
  }

  /**
   * Writes partial report for Phase 15
   *
   * @private
   * @param findings - CI/CD findings
   * @param audit - CI/CD audit result
   */
  private async writePartialReport(findings: CICDFinding[], audit: CICDAuditResult): Promise<void> {
    try {
      const reportPath = path.join(this.config.projectRoot, 'qa-report.partial.md');
      const timestamp = new Date().toISOString();

      let reportContent = `
## Phase 15: CI/CD & DevOps - COMPLETED
- **Timestamp:** ${timestamp}

### Summary
- **Total Findings:** ${findings.length}
- **Critical Findings:** ${findings.filter(f => f.severity === 'critical').length}
- **High Severity Findings:** ${findings.filter(f => f.severity === 'high').length}
- **CI Platform:** ${audit.ciPlatform}
- **Workflow Files:** ${audit.workflowFiles.length}
- **Healthy Workflows:** ${audit.healthyWorkflows.length}
- **Checkout-Only Workflows:** ${audit.checkoutOnlyWorkflows.length}
- **Deployment Leaks:** ${audit.deploymentLeaks.length}
- **Infrastructure Config Files:** ${audit.infraConfigFiles.length}
- **Missing Infrastructure Config:** ${audit.missingInfraConfig.length}

### Workflow Audit
`;
      if (audit.workflowFiles.length > 0) {
        reportContent += `- **CI Platform:** ${audit.ciPlatform}\n`;
        reportContent += `- **Workflow files found:** ${audit.workflowFiles.length}\n`;
        for (const workflowFile of audit.workflowFiles) {
          reportContent += `  - ${path.relative(this.config.projectRoot, workflowFile)}\n`;
        }
      } else {
        reportContent += `- **No CI configuration detected**\n`;
      }

      reportContent += `
### Health Check de CI
- **Healthy workflows (with test/build):** ${audit.healthyWorkflows.length}
- **Checkout-only workflows:** ${audit.checkoutOnlyWorkflows.length}
`;

      if (audit.checkoutOnlyWorkflows.length > 0) {
        reportContent += `**Checkout-only workflows:**\n`;
        for (const workflowFile of audit.checkoutOnlyWorkflows) {
          reportContent += `- ${path.relative(this.config.projectRoot, workflowFile)}\n`;
        }
      }

      reportContent += `
### Deployment Leak Prevention
- **Leaks detected:** ${audit.deploymentLeaks.length}
`;

      if (audit.deploymentLeaks.length > 0) {
        reportContent += `**Deployment leaks:**\n`;
        for (const leak of audit.deploymentLeaks) {
          reportContent += `- ${leak.path}:${leak.line} - ${leak.type} (value: ${leak.value})\n`;
        }
      }

      reportContent += `
### Infrastructure Hardening
- **Config files found:** ${audit.infraConfigFiles.length}
- **Missing config:** ${audit.missingInfraConfig.length}
`;

      if (audit.infraConfigFiles.length > 0) {
        reportContent += `**Infrastructure config files:**\n`;
        for (const configFile of audit.infraConfigFiles) {
          reportContent += `- ${configFile}\n`;
        }
      }

      if (audit.missingInfraConfig.length > 0) {
        reportContent += `**Missing infrastructure config:**\n`;
        for (const missingConfig of audit.missingInfraConfig) {
          reportContent += `- ${missingConfig}\n`;
        }
      }

      reportContent += `
### CI/CD Findings
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
