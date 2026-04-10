// eslint-disable @typescript-eslint/no-explicit-any
/**
 * Phase 3C: Secure Development Methodology
 *
 * Purpose: Analyze secure development practices including threat modeling,
 * supply chain security, secrets scanning, and input sanitization beyond Zod.
 *
 * Architecture:
 * - Threat Model Analysis: Check for threat modeling documentation and practices
 * - Supply Chain Security: Analyze dependency vulnerabilities and SBOM
 * - Secrets Scanning: Enhanced secrets detection beyond basic patterns
 * - Input Sanitization: Verify input validation beyond schema validation (Zod)
 *
 * @module phases/phase-3c-secure-dev-methodology
 * @since 2.0.0
 */

import * as fs from 'fs';
import * as path from 'path';
import { ThermalController } from '../core/thermal-controller.js';
import { StatePersistence, type ExecutionState } from '../core/state-persistence.js';
import { validatePath, sanitizeError, validateFileSize } from '../core/security-utils.js';

interface SecureDevFinding {
  id: string;
  type: 'missing-threat-model' | 'supply-chain-risk' | 'exposed-secret' | 'weak-input-sanitization' | 'missing-security-review';
  severity: 'low' | 'medium' | 'high' | 'critical';
  filePath: string;
  line?: number;
  description: string;
  suggestion?: string;
  dependency?: string;
  secretType?: string;
}

interface SecureDevMetrics {
  totalFiles: number;
  missingThreatModels: number;
  supplyChainRisks: number;
  exposedSecrets: number;
  weakInputSanitization: number;
  missingSecurityReviews: number;
}

interface Phase3CConfig {
  projectRoot: string;
  thermalController: ThermalController;
  statePersistence: StatePersistence;
  currentState: ExecutionState;
}

export interface Phase3CResult {
  success: boolean;
  findings: SecureDevFinding[];
  metrics: SecureDevMetrics;
  criticalFindings: number;
  highSeverityFindings: number;
  executionTimeMs: number;
  error?: string;
}

export class Phase3CSecureDevMethodology {
  private config: Phase3CConfig;

  constructor(config: Phase3CConfig) {
    if (!validatePath(config.projectRoot, config.projectRoot)) {
      throw new Error('Invalid project root path');
    }
    this.config = config;
  }

  async execute(): Promise<Phase3CResult> {
    const startTime = Date.now();
    console.log('INFO Phase 3C: Secure Development Methodology\n');

    try {
      console.log('INFO Verifying system resources...');
      const resourceCheck = await this.config.thermalController.checkSystemResources();
      console.log(`INFO CPU Usage: ${resourceCheck.cpuUsage}%`);
      console.log(`INFO RAM Usage: ${resourceCheck.ramUsage}%`);
      console.log(`INFO RAM Available: ${resourceCheck.ramAvailable} GB\n`);

      if (!resourceCheck.isSafe) {
        throw new Error('System resources not safe for operation');
      }

      console.log('INFO Analyzing secure development practices...\n');
      
      const findings: SecureDevFinding[] = [];

      // 1. Check for threat modeling documentation
      console.log('INFO Checking for threat modeling documentation...');
      findings.push(...await this.checkThreatModeling());

      // 2. Analyze supply chain security
      console.log('INFO Analyzing supply chain security...');
      findings.push(...await this.analyzeSupplyChain());

      // 3. Enhanced secrets scanning
      console.log('INFO Performing enhanced secrets scanning...');
      findings.push(...await this.scanSecrets());

      // 4. Check input sanitization beyond Zod
      console.log('INFO Checking input sanitization beyond schema validation...');
      findings.push(...await this.checkInputSanitization());

      // 5. Check for security review process
      console.log('INFO Checking for security review process...');
      findings.push(...await this.checkSecurityReviewProcess());

      console.log(`INFO Total findings: ${findings.length}\n`);

      const metrics = this.calculateMetrics(findings);
      console.log(`INFO Missing threat models: ${metrics.missingThreatModels}`);
      console.log(`INFO Supply chain risks: ${metrics.supplyChainRisks}`);
      console.log(`INFO Exposed secrets: ${metrics.exposedSecrets}`);
      console.log(`INFO Weak input sanitization: ${metrics.weakInputSanitization}\n`);

      const criticalFindings = findings.filter((f) => f.severity === 'critical').length;
      const highSeverityFindings = findings.filter((f) => f.severity === 'high').length;

      const executionTimeMs = Date.now() - startTime;

      const result: Phase3CResult = {
        success: true,
        findings,
        metrics,
        criticalFindings,
        highSeverityFindings,
        executionTimeMs,
      };

      console.log(`SUCCESS Phase 3C Complete in ${executionTimeMs / 1000}s`);
      console.log(`INFO Critical findings: ${criticalFindings}`);
      console.log(`INFO High severity findings: ${highSeverityFindings}`);

      return result;
    } catch (error: unknown) {
      const executionTimeMs = Date.now() - startTime;
      const sanitizedError = sanitizeError(error);

      const result: Phase3CResult = {
        success: false,
        findings: [],
        metrics: {
          totalFiles: 0,
          missingThreatModels: 0,
          supplyChainRisks: 0,
          exposedSecrets: 0,
          weakInputSanitization: 0,
          missingSecurityReviews: 0,
        },
        criticalFindings: 0,
        highSeverityFindings: 0,
        executionTimeMs,
        error: sanitizedError,
      };

      console.error('FAILED Phase 3C:', sanitizedError);
      return result;
    }
  }

  private async checkThreatModeling(): Promise<SecureDevFinding[]> {
    const findings: SecureDevFinding[] = [];
    
    // Check for threat modeling documentation
    const threatModelFiles = [
      'threat-model.md',
      'threats.md',
      'security/threats.md',
      'docs/threat-model.md',
      'docs/security/threats.md',
    ];

    const hasThreatModel = threatModelFiles.some((file) => {
      const filePath = path.join(this.config.projectRoot, file);
      return fs.existsSync(filePath);
    });

    if (!hasThreatModel) {
      findings.push({
        id: `missing-threat-model-${Date.now()}`,
        type: 'missing-threat-model',
        severity: 'medium' as const,
        filePath: this.config.projectRoot,
        description: 'No threat modeling documentation found',
        suggestion: 'Create threat model documentation identifying potential security threats and mitigation strategies',
      });
    }

    // Check for threat modeling in code comments
    const sourceFiles = this.findSourceFiles();
    let hasThreatComments = 0;

    for (const filePath of sourceFiles) {
      try {
        if (!validatePath(filePath, this.config.projectRoot)) {
          continue;
        }

        const stats = fs.statSync(filePath);
        if (!validateFileSize(stats.size, 10)) {
          continue;
        }

        const content = fs.readFileSync(filePath, 'utf-8');
        if (content.toLowerCase().includes('threat') || content.toLowerCase().includes('attack vector')) {
          hasThreatComments++;
        }
      } catch (error: unknown) {
        console.warn(`Failed to analyze ${filePath}:`, sanitizeError(error));
      }
    }

    if (hasThreatComments === 0 && sourceFiles.length > 10) {
      findings.push({
        id: `missing-threat-comments-${Date.now()}`,
        type: 'missing-threat-model',
        severity: 'low' as const,
        filePath: this.config.projectRoot,
        description: 'No threat-related comments found in source code',
        suggestion: 'Add threat modeling comments to critical security-related code sections',
      });
    }

    return findings;
  }

  private async analyzeSupplyChain(): Promise<SecureDevFinding[]> {
    const findings: SecureDevFinding[] = [];
    
    // Check package.json for dependencies
    const packageJsonPath = path.join(this.config.projectRoot, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      try {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
        const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };

        // Check for known vulnerable packages (simplified check)
        Object.entries(dependencies).forEach(([dep, version]) => {
          const depLower = dep.toLowerCase();
          
          // Check for packages with known vulnerabilities
          if (depLower.includes('lodash') && typeof version === 'string' && version.startsWith('4.')) {
            findings.push({
              id: `supply-chain-${Date.now()}-${Math.random()}`,
              type: 'supply-chain-risk',
              severity: 'high' as const,
              filePath: packageJsonPath,
              description: `Dependency ${dep}@${version} may have known vulnerabilities`,
              suggestion: 'Update to latest version and run npm audit',
              dependency: dep,
            });
          }

          // Check for unmaintained packages
          if (depLower.includes('deprecated') || depLower.includes('abandoned')) {
            findings.push({
              id: `supply-chain-${Date.now()}-${Math.random()}`,
              type: 'supply-chain-risk',
              severity: 'medium' as const,
              filePath: packageJsonPath,
              description: `Dependency ${dep} appears to be deprecated or abandoned`,
              suggestion: 'Find an actively maintained alternative',
              dependency: dep,
            });
          }
        });

        // Check if package-lock.json exists for reproducible builds
        const packageLockPath = path.join(this.config.projectRoot, 'package-lock.json');
        if (!fs.existsSync(packageLockPath)) {
          findings.push({
            id: `supply-chain-${Date.now()}`,
            type: 'supply-chain-risk',
            severity: 'medium',
            filePath: this.config.projectRoot,
            description: 'package-lock.json not found - builds may not be reproducible',
            suggestion: 'Commit package-lock.json to ensure reproducible dependency installations',
          });
        }
      } catch (error: unknown) {
        console.warn(`Failed to analyze package.json:`, sanitizeError(error));
      }
    }

    return findings;
  }

  private async scanSecrets(): Promise<SecureDevFinding[]> {
    const findings: SecureDevFinding[] = [];
    const sourceFiles = this.findSourceFiles();

    // Enhanced secret patterns beyond basic checks
    const secretPatterns = [
      { pattern: /sk-[a-zA-Z0-9]{48}/, type: 'openai-api-key', severity: 'critical' },
      { pattern: /AKIA[0-9A-Z]{16}/, type: 'aws-access-key', severity: 'critical' },
      { pattern: /xoxb-[0-9]{10}-[0-9]{10}-[0-9A-Za-z]{24}/, type: 'slack-bot-token', severity: 'high' },
      { pattern: /ghp_[a-zA-Z0-9]{36}/, type: 'github-pat', severity: 'critical' },
      { pattern: /xoxp-[0-9]{12}-[0-9]{12}-[0-9A-Za-z]{24}/, type: 'slack-user-token', severity: 'high' },
      { pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}:[a-zA-Z0-9]{8,}/, type: 'email-password', severity: 'critical' },
      { pattern: /Bearer\s+[a-zA-Z0-9_-]{20,}/, type: 'bearer-token', severity: 'high' },
      { pattern: /password\s*=\s*['"`][^'"`]{8,}['"`]/, type: 'hardcoded-password', severity: 'high' },
      { pattern: /api[_-]?secret\s*=\s*['"`][^'"`]{8,}['"`]/, type: 'api-secret', severity: 'critical' },
      { pattern: /private[_-]?key\s*=\s*['"`][^'"`]{20,}['"`]/, type: 'private-key', severity: 'critical' },
    ];

    for (const filePath of sourceFiles) {
      try {
        if (!validatePath(filePath, this.config.projectRoot)) {
          continue;
        }

        const stats = fs.statSync(filePath);
        if (!validateFileSize(stats.size, 10)) {
          continue;
        }

        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.split('\n');

        lines.forEach((line, index) => {
          secretPatterns.forEach(({ pattern, type, severity }) => {
            if (pattern.test(line)) {
              findings.push({
                id: `secret-${Date.now()}-${Math.random()}`,
                type: 'exposed-secret',
                severity: severity as 'low' | 'medium' | 'high' | 'critical',
                filePath,
                line: index + 1,
                description: `Potential ${type} exposure detected`,
                suggestion: 'Remove hardcoded secrets and use environment variables or secret management',
                secretType: type,
              });
            }
          });
        });
      } catch (error: unknown) {
        console.warn(`Failed to analyze ${filePath}:`, sanitizeError(error));
      }
    }

    return findings;
  }

  private async checkInputSanitization(): Promise<SecureDevFinding[]> {
    const findings: SecureDevFinding[] = [];
    const sourceFiles = this.findSourceFiles();

    for (const filePath of sourceFiles) {
      try {
        if (!validatePath(filePath, this.config.projectRoot)) {
          continue;
        }

        const stats = fs.statSync(filePath);
        if (!validateFileSize(stats.size, 10)) {
          continue;
        }

        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.split('\n');

        lines.forEach((line, index) => {
          // Check for direct use of user input without sanitization
          const patterns = [
            { pattern: /req\.body\./, check: /(sanitize|validate|escape|strip)/, message: 'Direct use of request body without sanitization' },
            { pattern: /req\.query\./, check: /(sanitize|validate|escape|strip)/, message: 'Direct use of query params without sanitization' },
            { pattern: /req\.params\./, check: /(sanitize|validate|escape|strip)/, message: 'Direct use of route params without sanitization' },
            { pattern: /userInput/, check: /(sanitize|validate|escape|strip)/, message: 'Direct use of userInput without sanitization' },
            { pattern: /input\./, check: /(sanitize|validate|escape|strip)/, message: 'Direct use of input without sanitization' },
          ];

          patterns.forEach(({ pattern, check, message }) => {
            if (pattern.test(line) && !check.test(line)) {
              findings.push({
                id: `weak-sanitization-${Date.now()}-${Math.random()}`,
                type: 'weak-input-sanitization',
                severity: 'high' as const,
                filePath,
                line: index + 1,
                description: message,
                suggestion: 'Always sanitize and validate user input before use. Use libraries like DOMPurify, validator.js, or custom sanitization functions',
              });
            }
          });

          // Check for Zod usage without additional sanitization
          if (line.includes('zod') && line.includes('parse')) {
            const nextLine = lines[index + 1] || '';
            if (!nextLine.includes('sanitize') && !nextLine.includes('escape') && !nextLine.includes('strip')) {
              findings.push({
                id: `weak-sanitization-${Date.now()}-${Math.random()}`,
                type: 'weak-input-sanitization',
                severity: 'medium' as const,
                filePath,
                line: index + 1,
                description: 'Zod schema validation used without additional input sanitization',
                suggestion: 'Schema validation is not enough for security. Add input sanitization for XSS, SQL injection, and other injection attacks',
              });
            }
          }
        });
      } catch (error: unknown) {
        console.warn(`Failed to analyze ${filePath}:`, sanitizeError(error));
      }
    }

    return findings;
  }

  private async checkSecurityReviewProcess(): Promise<SecureDevFinding[]> {
    const findings: SecureDevFinding[] = [];

    // Check for security review documentation
    const securityDocFiles = [
      'SECURITY.md',
      'security.md',
      'docs/security.md',
      'SECURITY_REVIEW.md',
      'docs/security-review.md',
    ];

    const hasSecurityDoc = securityDocFiles.some((file) => {
      const filePath = path.join(this.config.projectRoot, file);
      return fs.existsSync(filePath);
    });

    if (!hasSecurityDoc) {
      findings.push({
        id: `missing-security-doc-${Date.now()}`,
        type: 'missing-security-review',
        severity: 'medium' as const,
        filePath: this.config.projectRoot,
        description: 'No security documentation or security review process documented',
        suggestion: 'Create SECURITY.md documenting security practices, vulnerability disclosure, and security review process',
      });
    }

    // Check for GitHub Actions security workflows
    const workflowsPath = path.join(this.config.projectRoot, '.github', 'workflows');
    if (fs.existsSync(workflowsPath)) {
      const workflowFiles = fs.readdirSync(workflowsPath).filter((f) => f.endsWith('.yml') || f.endsWith('.yaml'));
      
      const hasSecurityWorkflow = workflowFiles.some((file) => {
        const filePath = path.join(workflowsPath, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        return content.toLowerCase().includes('security') || content.toLowerCase().includes('audit') || content.toLowerCase().includes('sast');
      });

      if (!hasSecurityWorkflow && workflowFiles.length > 0) {
        findings.push({
          id: `missing-security-workflow-${Date.now()}`,
          type: 'missing-security-review',
          severity: 'low' as const,
          filePath: workflowsPath,
          description: 'No security scanning workflow found in GitHub Actions',
          suggestion: 'Add security scanning (SAST, dependency scanning) to CI/CD pipeline',
        });
      }
    }

    return findings;
  }

  private findSourceFiles(): string[] {
    const extensions = ['.ts', '.tsx', '.js', '.jsx', '.py'];
    const sourceFiles: string[] = [];

    const scanDirectory = (dir: string) => {
      try {
        const items = fs.readdirSync(dir);
        for (const item of items) {
          const fullPath = path.join(dir, item);
          const stat = fs.statSync(fullPath);

          if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules' && item !== '.next') {
            scanDirectory(fullPath);
          } else if (stat.isFile() && extensions.some((ext) => item.endsWith(ext))) {
            sourceFiles.push(fullPath);
          }
        }
      } catch (error: unknown) {
        console.warn(`Failed to scan directory ${dir}:`, sanitizeError(error));
      }
    };

    scanDirectory(this.config.projectRoot);
    return sourceFiles;
  }

  private calculateMetrics(findings: SecureDevFinding[]): SecureDevMetrics {
    return {
      totalFiles: findings.length > 0 ? new Set(findings.map((f) => f.filePath)).size : 0,
      missingThreatModels: findings.filter((f) => f.type === 'missing-threat-model').length,
      supplyChainRisks: findings.filter((f) => f.type === 'supply-chain-risk').length,
      exposedSecrets: findings.filter((f) => f.type === 'exposed-secret').length,
      weakInputSanitization: findings.filter((f) => f.type === 'weak-input-sanitization').length,
      missingSecurityReviews: findings.filter((f) => f.type === 'missing-security-review').length,
    };
  }
}













