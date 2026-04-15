/**
 * Phase 0: Setup - Project Configuration and Initialization
 *
 * Purpose: Initialize project configuration, detect project type, validate
 * dependencies, and set up the environment for QA analysis.
 *
 * Architecture:
 * - Project Detection: Identify project type (Next.js, React, Node, etc.)
 * - Dependency Validation: Check package.json for missing or outdated deps
 * - Configuration Setup: Initialize Aegis QA configuration
 * - Environment Validation: Verify Node.js version, tool availability
 *
 * @module phases/phase-0-setup
 * @since 1.0.0
 */

import * as fs from 'fs';
import * as path from 'path';
import { ThermalController } from '../core/thermal-controller.js';
import { StatePersistence, type ExecutionState } from '../core/state-persistence.js';
import { validatePath, sanitizeError, validateFileSize, censorSecrets } from '../core/security-utils.js';

/**
 * Project type detected
 */
type ProjectType = 'nextjs' | 'react' | 'node' | 'typescript' | 'javascript' | 'unknown';

/**
 * Dependency validation result
 */
interface DependencyValidationResult {
  /** Missing dependencies */
  missing: string[];
  /** Outdated dependencies */
  outdated: string[];
  /** Security vulnerabilities */
  vulnerabilities: string[];
}

/**
 * Phase 0 configuration
 */
interface Phase0Config {
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
 * Phase 0 result
 */
export interface Phase0Result {
  /** Overall success */
  success: boolean;
  /** Detected project type */
  projectType: ProjectType;
  /** Dependency validation result */
  dependencyValidation: DependencyValidationResult;
  /** Node.js version */
  nodeVersion: string;
  /** Package manager detected */
  packageManager: 'npm' | 'yarn' | 'pnpm' | 'unknown';
  /** Configuration initialized */
  configInitialized: boolean;
  /** Findings from setup phase */
  findings: any[];
  /** Execution time in milliseconds */
  executionTimeMs: number;
  /** Error if failed */
  error?: string;
}

/**
 * Phase 0: Setup - Project Configuration and Initialization
 *
 * This phase initializes the project for QA analysis by detecting
 * project type, validating dependencies, and setting up configuration.
 *
 * @class Phase0Setup
 * @example
 * ```typescript
 * const setup = new Phase0Setup(config);
 * const result = await setup.execute();
 * console.log(`Project type: ${result.projectType}`);
 * console.log(`Dependencies: ${result.dependencyValidation.missing.length} missing`);
 * ```
 */
export class Phase0Setup {
  private config: Phase0Config;

  constructor(config: Phase0Config) {
    // Validate projectRoot path to prevent path traversal
    if (!validatePath(config.projectRoot, config.projectRoot)) {
      throw new Error('Invalid project root path');
    }
    this.config = config;
  }

  /**
   * Executes Phase 0: Setup
   *
   * @returns Promise<Phase0Result> - Setup phase result
   */
  async execute(): Promise<Phase0Result> {
    const startTime = Date.now();
    console.log('INFO Phase 0: Setup - Project Configuration and Initialization\n');

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

      // Detect project type
      console.log('INFO Detecting project type...');
      const projectType = await this.detectProjectType();
      console.log(`INFO Project type: ${projectType}\n`);

      // Validate dependencies
      console.log('INFO Validating dependencies...');
      const dependencyValidation = await this.validateDependencies();
      console.log(`INFO Missing dependencies: ${dependencyValidation.missing.length}`);
      console.log(`INFO Outdated dependencies: ${dependencyValidation.outdated.length}`);
      console.log(`INFO Vulnerabilities: ${dependencyValidation.vulnerabilities.length}\n`);

      // Detect Node.js version
      const nodeVersion = process.version;
      console.log(`INFO Node.js version: ${nodeVersion}\n`);

      // Detect package manager
      const packageManager = await this.detectPackageManager();
      console.log(`INFO Package manager: ${packageManager}\n`);

      // Initialize configuration
      console.log('INFO Initializing Aegis QA configuration...');
      const configInitialized = await this.initializeConfiguration();
      console.log(`INFO Configuration initialized: ${configInitialized}\n`);

      // Generate findings
      const findings = this.generateFindings(
        dependencyValidation,
        nodeVersion,
        packageManager
      );

      const executionTimeMs = Date.now() - startTime;

      const result: Phase0Result = {
        success: true,
        projectType,
        dependencyValidation,
        nodeVersion,
        packageManager,
        configInitialized,
        findings,
        executionTimeMs,
      };

      console.log(`SUCCESS Phase 0 Complete in ${executionTimeMs / 1000}s`);
      console.log(`INFO Total findings: ${findings.length}`);

      return result;
    } catch (error) {
      const executionTimeMs = Date.now() - startTime;
      const sanitizedError = sanitizeError(error);

      const result: Phase0Result = {
        success: false,
        projectType: 'unknown',
        dependencyValidation: { missing: [], outdated: [], vulnerabilities: [] },
        nodeVersion: process.version,
        packageManager: 'unknown',
        configInitialized: false,
        findings: [],
        executionTimeMs,
        error: sanitizedError,
      };

      console.error('FAILED Phase 0:', sanitizedError);
      return result;
    }
  }

  /**
   * Detects project type from project structure
   *
   * @private
   * @returns Promise<ProjectType> - Detected project type
   */
  private async detectProjectType(): Promise<ProjectType> {
    const projectRoot = this.config.projectRoot;

    // Check for Next.js
    if (fs.existsSync(path.join(projectRoot, 'next.config.js')) ||
        fs.existsSync(path.join(projectRoot, 'next.config.mjs')) ||
        fs.existsSync(path.join(projectRoot, 'next.config.ts'))) {
      return 'nextjs';
    }

    // Check for React
    if (fs.existsSync(path.join(projectRoot, 'public')) &&
        (fs.existsSync(path.join(projectRoot, 'src')) || fs.existsSync(path.join(projectRoot, 'package.json')))) {
      const packageJson = this.readPackageJson();
      if (packageJson?.dependencies?.react) {
        return 'react';
      }
    }

    // Check for TypeScript
    if (fs.existsSync(path.join(projectRoot, 'tsconfig.json'))) {
      return 'typescript';
    }

    // Check for Node.js
    if (fs.existsSync(path.join(projectRoot, 'package.json'))) {
      return 'node';
    }

    // Default to JavaScript
    if (fs.existsSync(path.join(projectRoot, 'index.js')) ||
        fs.existsSync(path.join(projectRoot, 'app.js'))) {
      return 'javascript';
    }

    return 'unknown';
  }

  /**
   * Validates project dependencies
   *
   * @private
   * @returns Promise<DependencyValidationResult> - Validation result
   */
  private async validateDependencies(): Promise<DependencyValidationResult> {
    const result: DependencyValidationResult = {
      missing: [],
      outdated: [],
      vulnerabilities: [],
    };

    try {
      const packageJson = this.readPackageJson();
      if (!packageJson) {
        return result;
      }

      const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };

      // Check for common missing dependencies based on project type
      const projectType = await this.detectProjectType();
      const commonDeps = this.getCommonDependencies(projectType);

      for (const dep of commonDeps) {
        if (!dependencies[dep]) {
          result.missing.push(dep);
        }
      }

      // Note: In a real implementation, this would run npm audit or similar
      // For now, we'll just check for known vulnerable packages
      const knownVulnerable = ['lodash < 4.17.21', 'axios < 0.21.1', 'node-forge < 1.3.0'];
      for (const dep of knownVulnerable) {
        const [name, version] = dep.split(' < ');
        if (dependencies[name]) {
          const installedVersion = dependencies[name];
          if (this.isVersionLessThan(installedVersion, version)) {
            result.vulnerabilities.push(dep);
          }
        }
      }
    } catch (error) {
      console.warn('Failed to validate dependencies:', error instanceof Error ? error.message : error);
    }

    return result;
  }

  /**
   * Detects package manager being used
   *
   * @private
   * @returns Promise<'npm' | 'yarn' | 'pnpm' | 'unknown'> - Detected package manager
   */
  private async detectPackageManager(): Promise<'npm' | 'yarn' | 'pnpm' | 'unknown'> {
    const projectRoot = this.config.projectRoot;

    if (fs.existsSync(path.join(projectRoot, 'yarn.lock'))) {
      return 'yarn';
    }

    if (fs.existsSync(path.join(projectRoot, 'pnpm-lock.yaml'))) {
      return 'pnpm';
    }

    if (fs.existsSync(path.join(projectRoot, 'package-lock.json'))) {
      return 'npm';
    }

    return 'unknown';
  }

  /**
   * Initializes Aegis QA configuration
   *
   * @private
   * @returns Promise<boolean> - True if configuration initialized successfully
   */
  private async initializeConfiguration(): Promise<boolean> {
    try {
      const aegisDir = path.join(this.config.projectRoot, '.aegis');
      
      // Create .aegis directory if it doesn't exist
      if (!fs.existsSync(aegisDir)) {
        fs.mkdirSync(aegisDir, { recursive: true });
      }

      // Create subdirectories
      const subdirs = ['cache', 'state', 'logs', 'reports'];
      for (const subdir of subdirs) {
        const dirPath = path.join(aegisDir, subdir);
        if (!fs.existsSync(dirPath)) {
          fs.mkdirSync(dirPath, { recursive: true });
        }
      }

      // Create default config file
      const configPath = path.join(aegisDir, 'config.json');
      if (!fs.existsSync(configPath)) {
        const defaultConfig = {
          thermalProtection: true,
          resourceMonitoring: true,
          caching: true,
          maxBatchSize: 50,
          cooldownDuration: 5000,
        };
        fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2), 'utf-8');
      }

      return true;
    } catch (error) {
      console.warn('Failed to initialize configuration:', error instanceof Error ? error.message : error);
      return false;
    }
  }

  /**
   * Generates findings from setup phase
   *
   * @private
   * @param dependencyValidation - Dependency validation result
   * @param nodeVersion - Node.js version
   * @param packageManager - Package manager
   * @returns any[] - Array of findings
   */
  private generateFindings(
    dependencyValidation: DependencyValidationResult,
    nodeVersion: string,
    packageManager: string
  ): any[] {
    const findings: any[] = [];

    // Add missing dependency findings
    for (const dep of dependencyValidation.missing) {
      findings.push({
        id: this.generateFindingId(dep, 'missing-dep'),
        type: 'missing-dependency',
        severity: 'high',
        description: `Missing recommended dependency: ${dep}`,
        suggestion: `Install ${dep} using ${packageManager}`,
      });
    }

    // Add vulnerability findings
    for (const vuln of dependencyValidation.vulnerabilities) {
      findings.push({
        id: this.generateFindingId(vuln, 'vulnerability'),
        type: 'security-vulnerability',
        severity: 'critical',
        description: `Security vulnerability detected: ${vuln}`,
        suggestion: 'Update to latest version to fix vulnerability',
      });
    }

    // Add Node.js version finding if outdated
    const majorVersion = parseInt(nodeVersion.replace('v', '').split('.')[0], 10);
    if (majorVersion < 18) {
      findings.push({
        id: this.generateFindingId('node-version', 'outdated'),
        type: 'outdated-runtime',
        severity: 'medium',
        description: `Node.js version ${nodeVersion} is outdated`,
        suggestion: 'Upgrade to Node.js 18 or later for better performance and security',
      });
    }

    return findings;
  }

  /**
   * Reads package.json file
   *
   * @private
   * @returns any | null - Parsed package.json or null
   */
  private readPackageJson(): any | null {
    try {
      const packageJsonPath = path.join(this.config.projectRoot, 'package.json');
      
      // Validate path
      if (!validatePath(packageJsonPath, this.config.projectRoot)) {
        console.warn('Invalid package.json path');
        return null;
      }
      
      if (!fs.existsSync(packageJsonPath)) {
        return null;
      }

      const stats = fs.statSync(packageJsonPath);
      
      // Validate file size (max 1MB for package.json)
      if (!validateFileSize(stats.size, 1)) {
        console.warn('package.json too large, skipping');
        return null;
      }

      const content = fs.readFileSync(packageJsonPath, 'utf-8');
      
      // Censor potential secrets in content before parsing
      const sanitizedContent = censorSecrets(content);
      
      return JSON.parse(sanitizedContent);
    } catch (error) {
      console.warn('Failed to read package.json:', sanitizeError(error));
      return null;
    }
  }

  /**
   * Gets common dependencies for project type
   *
   * @private
   * @param projectType - Project type
   * @returns string[] - Common dependencies
   */
  private getCommonDependencies(projectType: ProjectType): string[] {
    const commonDeps: Record<ProjectType, string[]> = {
      nextjs: ['next', 'react', 'react-dom', '@types/react', '@types/node'],
      react: ['react', 'react-dom', '@types/react', '@types/react-dom'],
      node: ['@types/node'],
      typescript: ['typescript', '@types/node'],
      javascript: [],
      unknown: [],
    };

    return commonDeps[projectType] || [];
  }

  /**
   * Compares version strings
   *
   * @private
   * @param version1 - First version
   * @param version2 - Second version
   * @returns boolean - True if version1 < version2
   */
  private isVersionLessThan(version1: string, version2: string): boolean {
    const v1 = version1.replace('^', '').replace('~', '').split('.').map(Number);
    const v2 = version2.split('.').map(Number);

    for (let i = 0; i < Math.max(v1.length, v2.length); i++) {
      const num1 = v1[i] || 0;
      const num2 = v2[i] || 0;
      if (num1 < num2) return true;
      if (num1 > num2) return false;
    }

    return false;
  }

  /**
   * Generates unique finding ID
   *
   * @private
   * @param identifier - Identifier for the finding
   * @param type - Type of finding
   * @returns string - Unique ID
   */
  private generateFindingId(identifier: string, type: string): string {
    return `${type}-${identifier}-${Date.now()}`;
  }
}
