/**
 * Deployment Hardening - Phase 10
 *
 * Critical deployment validation based on "Tablero Cerrado" (Closed Panel) principle.
 * Ensures atomic integrity before deployment - if environment is not 100% predictable, Sentinel blocks.
 *
 * @module deployment-hardening
 * @since 2.0.0
 */

import * as fs from 'fs-extra';
import * as path from 'path';

export interface HardeningViolation {
  type: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  rule: string;
  message: string;
  file?: string;
  line?: number;
}

export interface HardeningResult {
  violations: HardeningViolation[];
  readyForAudit: boolean;
}

export class DeploymentHardening {
  private projectRoot: string;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
  }

  /**
   * Run all hardening checks
   */
  async runHardening(): Promise<HardeningResult> {
    const violations: HardeningViolation[] = [];

    // 1. Strict Env Validation
    const envValidation = await this.strictEnvValidation();
    violations.push(...envValidation);

    // 2. Ghost Variable Detection
    const ghostVars = await this.ghostVariableDetection();
    violations.push(...ghostVars);

    // 3. Vercel/CI Alignment
    const ciAlignment = await this.vercelCIAlignment();
    violations.push(...ciAlignment);

    // 4. Lockfile Integrity
    const lockfileIntegrity = await this.lockfileIntegrity();
    violations.push(...lockfileIntegrity);

    const readyForAudit = violations.filter(v => v.type === 'CRITICAL').length === 0;

    return {
      violations,
      readyForAudit
    };
  }

  /**
   * Strict Env Validation - CRITICAL if .env.example is missing
   * "Sin mapa de cables, nadie toca el tablero."
   */
  private async strictEnvValidation(): Promise<HardeningViolation[]> {
    const violations: HardeningViolation[] = [];
    const envExamplePath = path.join(this.projectRoot, '.env.example');

    if (!await fs.pathExists(envExamplePath)) {
      violations.push({
        type: 'CRITICAL',
        rule: 'strict-env-validation',
        message: 'CRITICAL: .env.example is missing. Without wiring diagram, no one touches the panel. Deployment BLOCKED.',
        file: '.env.example'
      });
    }

    return violations;
  }

  /**
   * Ghost Variable Detection
   * Detect variables used in code but not defined in .env.example
   */
  private async ghostVariableDetection(): Promise<HardeningViolation[]> {
    const violations: HardeningViolation[] = [];
    const envExamplePath = path.join(this.projectRoot, '.env.example');

    if (!await fs.pathExists(envExamplePath)) {
      return violations; // Already caught by strict validation
    }

    const envExampleContent = await fs.readFile(envExamplePath, 'utf-8');
    const definedVars = new Set<string>();

    // Extract variable names from .env.example
    const envVarPattern = /^([A-Z_][A-Z0-9_]*)=/gm;
    let match;
    while ((match = envVarPattern.exec(envExampleContent)) !== null) {
      definedVars.add(match[1]);
    }

    // Scan source files for environment variable usage
    const sourceFiles = await this.getSourceFiles();
    const usedVars = new Set<string>();

    for (const file of sourceFiles) {
      const content = await fs.readFile(file, 'utf-8');
      
      // Detect process.env.VAR usage
      const processEnvPattern = /process\.env\.([A-Z_][A-Z0-9_]*)/g;
      while ((match = processEnvPattern.exec(content)) !== null) {
        usedVars.add(match[1]);
      }

      // Detect import.meta.env.VAR usage (Vite)
      const importMetaPattern = /import\.meta\.env\.([A-Z_][A-Z0-9_]*)/g;
      while ((match = importMetaPattern.exec(content)) !== null) {
        usedVars.add(match[1]);
      }
    }

    // Find ghost variables (used but not defined)
    const ghostVars = Array.from(usedVars).filter(v => !definedVars.has(v));

    for (const ghostVar of ghostVars) {
      violations.push({
        type: 'HIGH',
        rule: 'ghost-variable-detection',
        message: `UNCONFIGURED_CIRCUIT: Environment variable '${ghostVar}' is used in code but not defined in .env.example. Risk of system explosion in production.`,
        file: '.env.example'
      });
    }

    return violations;
  }

  /**
   * Vercel/CI Alignment
   * Verify critical variables match deployment environment
   */
  private async vercelCIAlignment(): Promise<HardeningViolation[]> {
    const violations: HardeningViolation[] = [];
    const envExamplePath = path.join(this.projectRoot, '.env.example');

    if (!await fs.pathExists(envExamplePath)) {
      return violations; // Already caught by strict validation
    }

    const envExampleContent = await fs.readFile(envExamplePath, 'utf-8');
    const definedVars = new Set<string>();

    const envVarPattern = /^([A-Z_][A-Z0-9_]*)=/gm;
    let match;
    while ((match = envVarPattern.exec(envExampleContent)) !== null) {
      definedVars.add(match[1]);
    }

    // Check vercel.json
    const vercelJsonPath = path.join(this.projectRoot, 'vercel.json');
    if (await fs.pathExists(vercelJsonPath)) {
      const vercelContent = await fs.readFile(vercelJsonPath, 'utf-8');
      const vercelObj = JSON.parse(vercelContent);

      if (vercelObj.env) {
        for (const varName of Object.keys(vercelObj.env)) {
          if (!definedVars.has(varName)) {
            violations.push({
              type: 'HIGH',
              rule: 'vercel-ci-alignment',
              message: `CI_ALIGNMENT: Variable '${varName}' defined in vercel.json but not in .env.example. Misalignment detected.`,
              file: 'vercel.json'
            });
          }
        }
      }
    }

    // Check .github/workflows
    const workflowsPath = path.join(this.projectRoot, '.github', 'workflows');
    if (await fs.pathExists(workflowsPath)) {
      const workflowFiles = await fs.readdir(workflowsPath);
      
      for (const workflowFile of workflowFiles) {
        const workflowPath = path.join(workflowsPath, workflowFile);
        const workflowContent = await fs.readFile(workflowPath, 'utf-8');
        
        // Extract env variables from workflow
        const workflowEnvPattern = /([A-Z_][A-Z0-9_]*):/g;
        while ((match = workflowEnvPattern.exec(workflowContent)) !== null) {
          if (!definedVars.has(match[1])) {
            violations.push({
              type: 'HIGH',
              rule: 'vercel-ci-alignment',
              message: `CI_ALIGNMENT: Variable '${match[1]}' defined in ${workflowFile} but not in .env.example. Misalignment detected.`,
              file: `.github/workflows/${workflowFile}`
            });
          }
        }
      }
    }

    return violations;
  }

  /**
   * Lockfile Integrity
   * Verify package-lock.json is synchronized with package.json
   */
  private async lockfileIntegrity(): Promise<HardeningViolation[]> {
    const violations: HardeningViolation[] = [];
    const packageJsonPath = path.join(this.projectRoot, 'package.json');
    const packageLockPath = path.join(this.projectRoot, 'package-lock.json');

    if (!await fs.pathExists(packageJsonPath)) {
      violations.push({
        type: 'CRITICAL',
        rule: 'lockfile-integrity',
        message: 'CRITICAL: package.json is missing. Cannot verify lockfile integrity.',
        file: 'package.json'
      });
      return violations;
    }

    if (!await fs.pathExists(packageLockPath)) {
      violations.push({
        type: 'HIGH',
        rule: 'lockfile-integrity',
        message: 'INFRASTRUCTURE_DRIFT: package-lock.json is missing. Run `npm install` to generate lockfile.',
        file: 'package-lock.json'
      });
      return violations;
    }

    const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));
    const packageLock = JSON.parse(await fs.readFile(packageLockPath, 'utf-8'));

    // Check if lockfile version matches package.json version
    if (packageLock.lockfileVersion !== 2 && packageLock.lockfileVersion !== 3) {
      violations.push({
        type: 'HIGH',
        rule: 'lockfile-integrity',
        message: `INFRASTRUCTURE_DRIFT: Unexpected lockfile version ${packageLock.lockfileVersion}. Expected 2 or 3.`,
        file: 'package-lock.json'
      });
    }

    // Check if package name matches
    if (packageLock.name !== packageJson.name) {
      violations.push({
        type: 'HIGH',
        rule: 'lockfile-integrity',
        message: `INFRASTRUCTURE_DRIFT: Lockfile name '${packageLock.name}' does not match package.json name '${packageJson.name}'. Run \`npm install\`.`,
        file: 'package-lock.json'
      });
    }

    // Check if package version matches
    if (packageLock.version !== packageJson.version) {
      violations.push({
        type: 'HIGH',
        rule: 'lockfile-integrity',
        message: `INFRASTRUCTURE_DRIFT: Lockfile version '${packageLock.version}' does not match package.json version '${packageJson.version}'. Run \`npm install\`.`,
        file: 'package-lock.json'
      });
    }

    return violations;
  }

  /**
   * Get all source files to scan for environment variable usage
   */
  private async getSourceFiles(): Promise<string[]> {
    const sourceFiles: string[] = [];
    const extensions = ['.ts', '.tsx', '.js', '.jsx', '.json'];

    const scanDirectory = async (dir: string) => {
      const items = await fs.readdir(dir);
      
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = await fs.stat(fullPath);
        
        if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules' && item !== 'dist') {
          await scanDirectory(fullPath);
        } else if (stat.isFile() && extensions.includes(path.extname(item))) {
          sourceFiles.push(fullPath);
        }
      }
    };

    await scanDirectory(this.projectRoot);
    return sourceFiles;
  }
}

export default DeploymentHardening;
