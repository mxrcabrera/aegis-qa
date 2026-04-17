/**
 * Sandbox Manager - Isolated Environment for Safe Fix Execution
 *
 * Purpose: Creates an isolated sandbox environment to apply fixes safely
 * before applying them to the main project, preventing corruption.
 *
 * @module core/sandbox-manager
 * @since 2.0.0
 */

import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Sandbox configuration
 */
export interface SandboxConfig {
  /** Project root directory */
  projectRoot: string;
  /** Whether to enable sandbox mode */
  enabled: boolean;
  /** Whether to run syntax validation in sandbox */
  validateSyntax: boolean;
  /** Whether to run tests in sandbox */
  runTests: boolean;
  /** Sandbox directory path (auto-generated if not provided) */
  sandboxDir?: string;
}

/**
 * Sandbox validation result
 */
export interface SandboxValidationResult {
  /** Whether validation passed */
  passed: boolean;
  /** TypeScript validation result */
  typescriptValid: boolean;
  /** ESLint validation result */
  eslintValid: boolean;
  /** Test validation result */
  testsPassed: boolean;
  /** Error messages if validation failed */
  errors: string[];
  /** Warnings from validation */
  warnings: string[];
}

/**
 * Sandbox Manager - Isolated fix execution environment
 *
 * @class SandboxManager
 */
export class SandboxManager {
  private config: Required<SandboxConfig>;
  private sandboxDir: string;
  private isActive: boolean = false;

  constructor(config: SandboxConfig) {
    this.config = {
      projectRoot: config.projectRoot,
      enabled: config.enabled ?? true,
      validateSyntax: config.validateSyntax ?? true,
      runTests: config.runTests ?? false,
      sandboxDir: config.sandboxDir ?? path.join(config.projectRoot, '.aegis-sandbox'),
    };
    this.sandboxDir = this.config.sandboxDir;
  }

  /**
   * Creates sandbox environment
   *
   * @returns Promise<void>
   */
  async create(): Promise<void> {
    if (!this.config.enabled) {
      console.log('[Sandbox] Sandbox mode disabled, using direct execution');
      return;
    }

    console.log(`[Sandbox] Creating sandbox at ${this.sandboxDir}`);

    try {
      // Clean up existing sandbox if it exists
      if (fs.existsSync(this.sandboxDir)) {
        await this.cleanup();
      }

      // Create sandbox directory
      fs.mkdirSync(this.sandboxDir, { recursive: true });

      // Copy project files to sandbox
      await this.copyProjectToSandbox();

      // Copy node_modules if exists (for syntax validation)
      const nodeModulesPath = path.join(this.config.projectRoot, 'node_modules');
      if (fs.existsSync(nodeModulesPath)) {
        console.log('[Sandbox] Copying node_modules to sandbox...');
        const sandboxNodeModules = path.join(this.sandboxDir, 'node_modules');
        this.copyDirectorySync(nodeModulesPath, sandboxNodeModules);
      }

      this.isActive = true;
      console.log('[Sandbox] Sandbox created successfully');
    } catch (error) {
      console.error('[Sandbox] Failed to create sandbox:', error);
      throw new Error(`[Sandbox] Failed to create sandbox: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Copies project files to sandbox
   *
   * @private
   * @returns Promise<void>
   */
  private async copyProjectToSandbox(): Promise<void> {
    const entries = await fs.promises.readdir(this.config.projectRoot, { withFileTypes: true });

    for (const entry of entries) {
      const srcPath = path.join(this.config.projectRoot, entry.name);
      const destPath = path.join(this.sandboxDir, entry.name);

      // Skip certain directories
      if (['.git', '.aegis-cache', '.aegis-sandbox', 'node_modules', 'dist', 'build'].includes(entry.name)) {
        continue;
      }

      if (entry.isDirectory()) {
        fs.mkdirSync(destPath, { recursive: true });
        this.copyDirectorySync(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }

  /**
   * Copies a directory synchronously
   *
   * @private
   * @param src - Source directory
   * @param dest - Destination directory
   */
  private copyDirectorySync(src: string, dest: string): void {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }

    const entries = fs.readdirSync(src, { withFileTypes: true });

    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);

      if (entry.isDirectory()) {
        this.copyDirectorySync(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }

  /**
   * Gets the sandbox path for a project file
   *
   * @param projectFilePath - Path relative to project root
   * @returns string - Path in sandbox
   */
  getSandboxPath(projectFilePath: string): string {
    if (!this.isActive) {
      return path.join(this.config.projectRoot, projectFilePath);
    }
    return path.join(this.sandboxDir, projectFilePath);
  }

  /**
   * Validates sandbox environment after fixes
   *
   * @returns Promise<SandboxValidationResult> - Validation result
   */
  async validate(): Promise<SandboxValidationResult> {
    const result: SandboxValidationResult = {
      passed: true,
      typescriptValid: true,
      eslintValid: true,
      testsPassed: true,
      errors: [],
      warnings: [],
    };

    if (!this.isActive) {
      console.log('[Sandbox] Sandbox not active, skipping validation');
      return result;
    }

    console.log('[Sandbox] Validating sandbox environment...');

    // TypeScript validation
    if (this.config.validateSyntax) {
      const tsResult = await this.validateTypeScript();
      result.typescriptValid = tsResult.passed;
      if (!tsResult.passed) {
        result.errors.push(...tsResult.errors);
        result.passed = false;
      }
      result.warnings.push(...tsResult.warnings);
    }

    // ESLint validation
    if (this.config.validateSyntax) {
      const eslintResult = await this.validateESLint();
      result.eslintValid = eslintResult.passed;
      if (!eslintResult.passed) {
        result.errors.push(...eslintResult.errors);
        result.passed = false;
      }
      result.warnings.push(...eslintResult.warnings);
    }

    // Test validation
    if (this.config.runTests) {
      const testResult = await this.runTests();
      result.testsPassed = testResult.passed;
      if (!testResult.passed) {
        result.errors.push(...testResult.errors);
        result.passed = false;
      }
      result.warnings.push(...testResult.warnings);
    }

    return result;
  }

  /**
   * Validates TypeScript using tsc
   *
   * @private
   * @returns Promise<{ passed: boolean; errors: string[]; warnings: string[] }>
   */
  private async validateTypeScript(): Promise<{ passed: boolean; errors: string[]; warnings: string[] }> {
    console.log('[Sandbox] Running TypeScript validation...');

    try {
      await execAsync('npx tsc --noEmit', {
        cwd: this.sandboxDir,
        timeout: 60000,
      });

      console.log('[Sandbox] TypeScript validation passed');
      return { passed: true, errors: [], warnings: [] };
    } catch (error: any) {
      const errorMessage = error.stderr || error.message || 'Unknown error';
      console.error('[Sandbox] TypeScript validation failed:', errorMessage);

      return {
        passed: false,
        errors: [errorMessage],
        warnings: [],
      };
    }
  }

  /**
   * Validates code style using ESLint
   *
   * @private
   * @returns Promise<{ passed: boolean; errors: string[]; warnings: string[] }>
   */
  private async validateESLint(): Promise<{ passed: boolean; errors: string[]; warnings: string[] }> {
    console.log('[Sandbox] Running ESLint validation...');

    try {
      await execAsync('npx eslint . --ext .ts,.tsx,.js,.jsx --max-warnings 0', {
        cwd: this.sandboxDir,
        timeout: 60000,
      });

      console.log('[Sandbox] ESLint validation passed');
      return { passed: true, errors: [], warnings: [] };
    } catch (error: any) {
      const errorMessage = error.stderr || error.message || 'Unknown error';
      console.error('[Sandbox] ESLint validation failed:', errorMessage);

      return {
        passed: false,
        errors: [errorMessage],
        warnings: [],
      };
    }
  }

  /**
   * Runs tests in sandbox
   *
   * @private
   * @returns Promise<{ passed: boolean; errors: string[]; warnings: string[] }>
   */
  private async runTests(): Promise<{ passed: boolean; errors: string[]; warnings: string[] }> {
    console.log('[Sandbox] Running tests...');

    try {
      const { stdout, stderr } = await execAsync('npm test', {
        cwd: this.sandboxDir,
        timeout: 120000,
      });

      if (stderr) {
        console.warn('[Sandbox] Test warnings:', stderr);
      }

      console.log('[Sandbox] Tests passed');
      return { passed: true, errors: [], warnings: stderr.split('\n').filter(line => line.trim()) };
    } catch (error: any) {
      const errorMessage = error.stderr || error.message || 'Unknown error';
      console.error('[Sandbox] Tests failed:', errorMessage);

      return {
        passed: false,
        errors: [errorMessage],
        warnings: [],
      };
    }
  }

  /**
   * Copies validated files from sandbox to project
   *
   * @param filePaths - Array of file paths to copy (relative to project root)
   * @returns Promise<void>
   */
  async copyToProject(filePaths: string[]): Promise<void> {
    if (!this.isActive) {
      console.log('[Sandbox] Sandbox not active, files already in project');
      return;
    }

    console.log(`[Sandbox] Copying ${filePaths.length} validated files to project...`);

    for (const filePath of filePaths) {
      const sandboxPath = path.join(this.sandboxDir, filePath);
      const projectPath = path.join(this.config.projectRoot, filePath);

      if (fs.existsSync(sandboxPath)) {
        fs.copyFileSync(sandboxPath, projectPath);
        console.log(`[Sandbox] Copied ${filePath} to project`);
      }
    }

    console.log('[Sandbox] All files copied successfully');
  }

  /**
   * Cleans up sandbox directory
   *
   * @returns Promise<void>
   */
  async cleanup(): Promise<void> {
    if (!fs.existsSync(this.sandboxDir)) {
      return;
    }

    console.log('[Sandbox] Cleaning up sandbox...');

    try {
      fs.rmSync(this.sandboxDir, { recursive: true, force: true });
      this.isActive = false;
      console.log('[Sandbox] Sandbox cleaned up successfully');
    } catch (error) {
      console.error('[Sandbox] Failed to cleanup sandbox:', error);
      throw new Error(`[Sandbox] Failed to cleanup sandbox: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Gets sandbox status
   *
   * @returns Object with sandbox status
   */
  getStatus(): {
    active: boolean;
    enabled: boolean;
    sandboxDir: string;
  } {
    return {
      active: this.isActive,
      enabled: this.config.enabled,
      sandboxDir: this.sandboxDir,
    };
  }
}
