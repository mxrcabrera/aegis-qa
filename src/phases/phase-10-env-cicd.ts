/**
 * Phase 10: Environment & CI/CD
 *
 * Purpose: Audit environment configuration, variables, and pipelines for secure and repeatable deploys.
 * Focus on Environment Health, CI/CD Configuration, Security Checks, and Dependency Health.
 *
 * Architecture:
 * - Environment Health: .env.example presence, Environment Mismatch detection
 * - CI/CD Configuration: GitHub Actions, GitLab CI, Vercel detection
 * - Security Check: Secrets in repo, cross-reference with Phase 3
 * - Dependency Health: Vulnerabilities, Engines Mismatch
 *
 * @module phases/phase-10-env-cicd
 * @since 2.0.0
 */

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';
import { StatePersistence, type ExecutionState } from '../core/state-persistence.js';

/**
 * Environment & CI/CD finding
 */
interface EnvCICDFinding {
  /** Unique ID based on file hash + line */
  id: string;
  /** Finding type */
  type: 'missing-env-example' | 'env-mismatch' | 'missing-cicd' | 'secret-leak' | 'dependency-vulnerability' | 'engines-mismatch' | 'env-cicd-issue' | 'unconfigured-circuit' | 'infrastructure-drift';
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
 * Phase 10 configuration
 */
interface Phase10Config {
  /** Project root directory */
  projectRoot: string;
  /** State persistence for storing results */
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
  /** Environment & CI/CD findings */
  findings: EnvCICDFinding[];
  /** Total critical findings */
  criticalFindings: number;
  /** Total high severity findings */
  highSeverityFindings: number;
  /** Execution time in milliseconds */
  executionTimeMs: number;
  /** Error if failed */
  error?: string;
}

/**
 * Phase 10: Environment & CI/CD
 *
 * This phase audits environment configuration, variables, and pipelines for secure and repeatable deploys.
 * Focuses on Environment Health, CI/CD Configuration, Security Checks, and Dependency Health.
 *
 * @class Phase10EnvCICD
 * @example
 * ```typescript
 * const phase10 = new Phase10EnvCICD({
 *   projectRoot: '/path/to/project',
 *   statePersistence: new StatePersistence('/path/to/project'),
 *   currentState: executionState,
 * });
 * const result = await phase10.execute();
 * ```
 */
export class Phase10EnvCICD {
  private config: Phase10Config;

  constructor(config: Phase10Config) {
    this.config = config;
  }

  /**
   * Executes Phase 10: Environment & CI/CD
   *
   * @returns Promise<Phase10Result> - Environment & CI/CD analysis result
   */
  async execute(): Promise<Phase10Result> {
    const startTime = Date.now();
    console.log('���� Phase 10: Environment & CI/CD\n');

    try {
      // Get Phase 3 results for Security Check cross-reference
      const phase3Results = this.config.statePersistence.getAnalysisResults(3, this.config.currentState);
      const securityFindings = phase3Results?.findings || [];

      console.log(`���� Context: ${securityFindings.length} security findings from Phase 3\n`);

      const findings: EnvCICDFinding[] = [];

      // 1. Environment Health
      const envFindings = this.analyzeEnvironmentHealth();
      findings.push(...envFindings);

      // 2. CI/CD Configuration
      const cicdFindings = this.analyzeCICDConfiguration();
      findings.push(...cicdFindings);

      // 3. Security Check: Cross-reference with Phase 3
      const securityCheckFindings = this.analyzeSecurityCheck(securityFindings);
      findings.push(...securityCheckFindings);

      // 4. Dependency Health
      const depFindings = this.analyzeDependencyHealth();
      findings.push(...depFindings);

      const criticalFindings = findings.filter(f => f.severity === 'critical').length;
      const highSeverityFindings = findings.filter(f => f.severity === 'high').length;

      const result: Phase10Result = {
        success: true,
        findings,
        criticalFindings,
        highSeverityFindings,
        executionTimeMs: Date.now() - startTime,
      };

      await this.config.statePersistence.storeAnalysisResults(10, result, this.config.currentState);
      await this.writePartialReport(result);
      await this.config.statePersistence.saveState(this.config.currentState);

      // Final State Seal: Mark report as READY_FOR_AUDIT
      this.config.currentState.readyForAudit = true;
      await this.config.statePersistence.saveState(this.config.currentState);

      console.log(`ԣ� Phase 10 Complete`);
      console.log(`  ��� READY_FOR_AUDIT: TRUE - Report is ready for audit`);
      console.log(`  ���� Total findings: ${findings.length}`);
      console.log(`  ��ܿ Critical findings: ${criticalFindings}`);
      console.log(`  ��ᴩ�  High severity findings: ${highSeverityFindings}\n`);

      return result;
    } catch {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`��� Phase 10 failed: ${errorMessage}\n`);

      const result: Phase10Result = {
        success: false,
        findings: [],
        criticalFindings: 0,
        highSeverityFindings: 0,
        executionTimeMs: Date.now() - startTime,
        error: errorMessage,
      };

      return result;
    }
  }

  /**
   * Analyzes Environment Health
   *
   * @private
   * @returns EnvCICDFinding[] - Environment health findings
   */
  private analyzeEnvironmentHealth(): EnvCICDFinding[] {
    const findings: EnvCICDFinding[] = [];

    // Check for .env.example presence
    const envPath = path.join(this.config.projectRoot, '.env');
    const envExamplePath = path.join(this.config.projectRoot, '.env.example');
    const envLocalExamplePath = path.join(this.config.projectRoot, '.env.local.example');

    const hasEnv = fs.existsSync(envPath);
    const hasEnvExample = fs.existsSync(envExamplePath) || fs.existsSync(envLocalExamplePath);

    // Strict Env Validation: Missing .env.example is CRITICAL (Blocking)
    if (hasEnv && !hasEnvExample) {
      findings.push({
        id: this.generateFindingId('project', undefined, 'missing-env-example'),
        type: 'missing-env-example',
        severity: 'critical',
        filePath: '.env',
        description: '��ܿ CRITICAL: .env exists but .env.example is missing - BLOCKING DEPLOY',
        suggestion: 'Create .env.example to document required environment variables. Without a map of cables, nobody touches the control panel. This is a blocking issue for deployment.',
      });
    }

    // Environment Mismatch: Variables used in code not in .env.example
    if (hasEnvExample) {
      const examplePath = fs.existsSync(envExamplePath) ? envExamplePath : envLocalExamplePath;
      const envExampleContent = fs.readFileSync(examplePath, 'utf-8');
      
      // Extract variables from .env.example
      const envExampleVars = new Set<string>();
      const envVarPattern = /^([A-Z_][A-Z0-9_]*)=/gm;
      let match: RegExpExecArray | null;
      while ((match = envVarPattern.exec(envExampleContent)) !== null) {
        envExampleVars.add(match[1]);
      }

      // Scan source files for process.env usage
      const sourceFiles = this.scanSourceFiles();
      const usedEnvVars = new Set<string>();
      
      for (const file of sourceFiles) {
        try {
          const content = fs.readFileSync(file, 'utf-8');
          const processEnvPattern = /process\.env\.([A-Z_][A-Z0-9_]*)/g;
          let envMatch: RegExpExecArray | null;
          while ((envMatch = processEnvPattern.exec(content)) !== null) {
            usedEnvVars.add(envMatch[1]);
          }
        } catch {
          // Skip files that can't be read
        }
      }

      // Ghost Variable Detection: Variables used in code not in .env.example
      const missingVars = Array.from(usedEnvVars).filter(v => !envExampleVars.has(v));
      if (missingVars.length > 0) {
        findings.push({
          id: this.generateFindingId('project', undefined, 'unconfigured-circuit'),
          type: 'unconfigured-circuit',
          severity: 'high',
          filePath: envExamplePath,
          description: `��ܿ UNCONFIGURED_CIRCUIT: ${missingVars.length} environment variables used in code but not documented in .env.example - RISK OF PRODUCTION EXPLOSION`,
          suggestion: `Add the following variables to .env.example: ${missingVars.slice(0, 5).join(', ')}${missingVars.length > 5 ? '...' : ''}. Ghost variables are a risk that the system will explode in production due to missing definitions.`,
        });
      }
    }

    return findings;
  }

  /**
   * Analyzes CI/CD Configuration
   *
   * @private
   * @returns EnvCICDFinding[] - CI/CD configuration findings
   */
  private analyzeCICDConfiguration(): EnvCICDFinding[] {
    const findings: EnvCICDFinding[] = [];

    // Check for CI/CD configuration files
    const githubWorkflowsPath = path.join(this.config.projectRoot, '.github', 'workflows');
    const gitlabCiPath = path.join(this.config.projectRoot, '.gitlab-ci.yml');
    const vercelPath = path.join(this.config.projectRoot, 'vercel.json');

    const hasGitHubWorkflows = fs.existsSync(githubWorkflowsPath);
    const hasGitLabCI = fs.existsSync(gitlabCiPath);
    const hasVercel = fs.existsSync(vercelPath);

    if (!hasGitHubWorkflows && !hasGitLabCI && !hasVercel) {
      findings.push({
        id: this.generateFindingId('project', undefined, 'missing-cicd'),
        type: 'missing-cicd',
        severity: 'medium',
        filePath: 'project',
        description: 'No CI/CD configuration detected (GitHub Actions, GitLab CI, or Vercel)',
        suggestion: 'Consider setting up CI/CD pipelines for automated testing and deployment. This ensures consistent deploys and catches issues early.',
      });
    }

    // Vercel/CI Alignment: Verify critical variables in deployment files
    const criticalVars = this.getCriticalEnvVars();
    if (criticalVars.length > 0 && (hasVercel || hasGitHubWorkflows)) {
      const deploymentFiles: string[] = [];
      if (hasVercel) deploymentFiles.push(vercelPath);
      if (hasGitHubWorkflows) {
        const workflowFiles = this.scanDirectory(githubWorkflowsPath, ['*.yml', '*.yaml']);
        deploymentFiles.push(...workflowFiles);
      }

      for (const deployFile of deploymentFiles) {
        try {
          const content = fs.readFileSync(deployFile, 'utf-8');
          const missingInDeploy = criticalVars.filter((v: string) => !content.includes(v));

          if (missingInDeploy.length > 0) {
            findings.push({
              id: this.generateFindingId(deployFile, undefined, 'env-cicd-issue'),
              type: 'env-cicd-issue',
              severity: 'high',
              filePath: deployFile,
              description: `Vercel/CI Alignment: ${missingInDeploy.length} critical environment variables not configured in deployment file`,
              suggestion: `Add the following variables to deployment configuration: ${missingInDeploy.slice(0, 5).join(', ')}${missingInDeploy.length > 5 ? '...' : ''}. Critical variables must be configured in deployment environment.`,
            });
          }
        } catch {
          // Skip files that can't be read
        }
      }
    }

    return findings;
  }

  /**
   * Analyzes Security Check (cross-reference with Phase 3)
   *
   * @private
   * @param securityFindings - Security findings from Phase 3
   * @returns EnvCICDFinding[] - Security check findings
   */
  private analyzeSecurityCheck(securityFindings: unknown[]): EnvCICDFinding[] {
    const findings: EnvCICDFinding[] = [];

    // Check for secrets or private keys in repo (cross-reference with Phase 3)
    const secretFindings = securityFindings.filter((f: unknown) => 
      f.type === 'secret-leak' || f.type === 'api-key-exposure' || f.type === 'hardcoded-secret'
    );

    if (secretFindings.length > 0) {
      findings.push({
        id: this.generateFindingId('project', undefined, 'secret-leak'),
        type: 'secret-leak',
        severity: 'critical',
        filePath: 'project',
        description: `��ܿ CRITICAL: ${secretFindings.length} secrets or private keys detected in repository (from Phase 3)`,
        suggestion: 'Remove secrets from the repository immediately. Use environment variables and secret management services. Secrets in git are a critical security vulnerability.',
      });
    }

    return findings;
  }

  /**
   * Analyzes Dependency Health
   *
   * @private
   * @returns EnvCICDFinding[] - Dependency health findings
   */
  private analyzeDependencyHealth(): EnvCICDFinding[] {
    const findings: EnvCICDFinding[] = [];

    // Check package.json for engines field
    const packageJsonPath = path.join(this.config.projectRoot, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      try {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
        
        if (!packageJson.engines) {
          findings.push({
            id: this.generateFindingId(packageJsonPath, undefined, 'engines-mismatch'),
            type: 'engines-mismatch',
            severity: 'medium',
            filePath: packageJsonPath,
            description: 'package.json missing "engines" field',
            suggestion: 'Add "engines" field to package.json to specify required Node.js and npm versions. This ensures consistent behavior across environments.',
          });
        }
      } catch {
        // Invalid package.json, skip
      }
    }

    // Lockfile Integrity: Verify package-lock.json is synchronized with package.json
    const packageLockPath = path.join(this.config.projectRoot, 'package-lock.json');
    if (fs.existsSync(packageLockPath) && fs.existsSync(packageJsonPath)) {
      try {
        const packageLock = JSON.parse(fs.readFileSync(packageLockPath, 'utf-8'));
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

        // Check if lockfile version matches package.json version
        const lockVersion = packageLock.lockfileVersion;
        const expectedLockVersion = 2; // npm uses lockfileVersion 2 by default

        if (lockVersion && lockVersion !== expectedLockVersion) {
          findings.push({
            id: this.generateFindingId(packageLockPath, undefined, 'infrastructure-drift'),
            type: 'infrastructure-drift',
            severity: 'high',
            filePath: packageLockPath,
            description: '��ܿ INFRASTRUCTURE_DRIFT: package-lock.json lockfileVersion mismatch - potential synchronization issue',
            suggestion: 'Run "npm install" to regenerate package-lock.json with correct version. Lockfile drift can cause inconsistent dependency resolution across environments.',
          });
        }

        // Check if package.json dependencies are present in lockfile
        const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
        const lockDeps = packageLock.packages ? Object.keys(packageLock.packages) : [];
        const missingInLock = Object.keys(deps).filter(dep => !lockDeps.some(ld => ld.includes(`node_modules/${dep}`)));

        if (missingInLock.length > 0) {
          findings.push({
            id: this.generateFindingId(packageLockPath, undefined, 'infrastructure-drift'),
            type: 'infrastructure-drift',
            severity: 'high',
            filePath: packageLockPath,
            description: `��ܿ INFRASTRUCTURE_DRIFT: ${missingInLock.length} dependencies in package.json not found in package-lock.json - RUN NPM INSTALL`,
            suggestion: `Run "npm install" to synchronize package-lock.json with package.json. Missing dependencies in lockfile will cause installation failures in production.`,
          });
        }
      } catch {
        // Invalid lockfile, mark as infrastructure drift
        findings.push({
          id: this.generateFindingId(packageLockPath, undefined, 'infrastructure-drift'),
          type: 'infrastructure-drift',
          severity: 'high',
          filePath: packageLockPath,
          description: '��ܿ INFRASTRUCTURE_DRIFT: package-lock.json is invalid or corrupted - RUN NPM INSTALL',
          suggestion: 'Delete package-lock.json and run "npm install" to regenerate. Corrupted lockfiles cause unpredictable dependency resolution.',
        });
      }
    } else if (fs.existsSync(packageJsonPath) && !fs.existsSync(packageLockPath)) {
      // package.json exists but no lockfile
      findings.push({
        id: this.generateFindingId(packageJsonPath, undefined, 'infrastructure-drift'),
        type: 'infrastructure-drift',
        severity: 'medium',
        filePath: packageJsonPath,
        description: 'package.json exists but package-lock.json is missing',
        suggestion: 'Run "npm install" to generate package-lock.json. Lockfiles ensure reproducible builds across environments.',
      });
    }

    return findings;
  }

  /**
   * Gets critical environment variables used in code
   *
   * @private
   * @returns string[] - Array of critical variable names
   */
  private getCriticalEnvVars(): string[] {
    const sourceFiles = this.scanSourceFiles();
    const criticalVars = new Set<string>();

    for (const file of sourceFiles) {
      try {
        const content = fs.readFileSync(file, 'utf-8');
        const processEnvPattern = /process\.env\.([A-Z_][A-Z0-9_]*)/g;
        let match: RegExpExecArray | null;
        while ((match = processEnvPattern.exec(content)) !== null) {
          criticalVars.add(match[1]);
        }
      } catch {
        // Skip files that can't be read
      }
    }

    return Array.from(criticalVars);
  }

  /**
   * Scans a directory for files matching patterns
   *
   * @private
   * @param dir - Directory path
   * @param patterns - File patterns (e.g., ['*.yml', '*.yaml'])
   * @returns string[] - Array of file paths
   */
  private scanDirectory(dir: string, patterns: string[]): string[] {
    const files: string[] = [];

    if (!fs.existsSync(dir)) {
      return files;
    }

    for (const pattern of patterns) {
      try {
        // glob is imported at the top
        const patternPath = path.join(dir, pattern);
        const matchedFiles = glob.sync(patternPath, {
          absolute: true,
        });
        files.push(...matchedFiles);
      } catch {
        // glob not available, skip
      }
    }

    return Array.from(new Set(files));
  }

  /**
   * Scans for source files
   *
   * @private
   * @returns string[] - Array of file paths
   */
  private scanSourceFiles(): string[] {
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
      try {
        // glob is imported at the top
        const files = glob.sync(pattern, {
          cwd: this.config.projectRoot,
          absolute: true,
        });
        allFiles.push(...files);
      } catch {
        // glob not available, skip
      }
    }

    return Array.from(new Set(allFiles));
  }

  /**
   * Generates unique ID for a finding
   *
   * @private
   * @param fileHash - SHA-1 hash of file content or identifier
   * @param line - Line number
   * @param type - Finding type
   * @returns string - Unique ID
   */
  private generateFindingId(fileHash: string, line: number | undefined, type: string): string {
    const lineStr = line !== undefined ? line.toString() : '0';
    return `${fileHash.substring(0, 8)}-${lineStr}-${type}`;
  }

  /**
   * Writes partial report for Phase 10
   *
   * @private
   * @param result - Phase 10 result
   */
  private async writePartialReport(result: Phase10Result): Promise<void> {
    try {
      const reportPath = path.join(this.config.projectRoot, 'qa-report.partial.md');
      const timestamp = new Date().toISOString();

      // Group findings by type
      const findingsByType = new Map<string, EnvCICDFinding[]>();
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
## Phase 10: Environment & CI/CD - ԣ� PASSED
- **Timestamp:** ${timestamp}
- **Execution Time:** ${result.executionTimeMs}ms

### Environment & CI/CD Summary
- **Total Findings:** ${result.findings.length}
- **Critical Findings:** ${result.criticalFindings}
- **High Severity Findings:** ${result.highSeverityFindings}

### Findings by Type
${findingsContent || 'No Environment & CI/CD issues detected.'}

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
    } catch {
      console.warn('��ᴩ�  Failed to write partial report:', error instanceof Error ? error.message : error);
    }
  }
}




