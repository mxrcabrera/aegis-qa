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
import * as readline from 'readline';

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
  /** Whether to generate patch file after fixes */
  generatePatch?: boolean;
  /** Whether to skip size confirmation (CI mode) */
  skipConfirmation?: boolean;
  /** Maximum size in bytes before warning (default: 5GB) */
  maxSizeBeforeWarning?: number;
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
  private _cleanupHandler?: NodeJS.SignalsListener;

  constructor(config: SandboxConfig) {
    this.config = {
      projectRoot: config.projectRoot,
      enabled: config.enabled ?? true,
      validateSyntax: config.validateSyntax ?? true,
      runTests: config.runTests ?? false,
      sandboxDir: config.sandboxDir ?? path.join(config.projectRoot, '.aegis-tmp'),
      generatePatch: config.generatePatch ?? false,
      skipConfirmation: config.skipConfirmation ?? false,
      maxSizeBeforeWarning: config.maxSizeBeforeWarning ?? (5 * 1024 * 1024 * 1024), // 5GB
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
      // Check repository size before proceeding
      await this.checkRepositorySize();

      // Clean up existing sandbox if it exists
      if (fs.existsSync(this.sandboxDir)) {
        await this.cleanup();
      }

      // Create sandbox directory
      fs.mkdirSync(this.sandboxDir, { recursive: true });

      // Copy project files to sandbox using git archive (respects .gitignore)
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

      // Setup SIGINT handler for cleanup
      this.setupCleanupHandler();
    } catch (error) {
      console.error('[Sandbox] Failed to create sandbox:', error);
      throw new Error(`[Sandbox] Failed to create sandbox: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Checks repository size and warns if too large
   *
   * @private
   * @returns Promise<void>
   */
  private async checkRepositorySize(): Promise<void> {
    try {
      const size = await this.getDirectorySize(this.config.projectRoot);
      const sizeGB = size / (1024 * 1024 * 1024);

      if (size > this.config.maxSizeBeforeWarning) {
        console.log(`[Sandbox] Repository size: ${sizeGB.toFixed(2)}GB`);

        if (!this.config.skipConfirmation) {
          const confirmed = await this.requestConfirmation(
            `Repository is large (${sizeGB.toFixed(2)}GB). Sandbox mode will create a full copy. Continue? (y/N): `
          );

          if (!confirmed) {
            throw new Error('[Sandbox] Sandbox creation cancelled by user');
          }
        } else {
          console.log('[Sandbox] CI mode: Skipping confirmation for large repository');
        }
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('cancelled by user')) {
        throw error;
      }
      console.warn('[Sandbox] Could not check repository size, proceeding anyway');
    }
  }

  /**
   * Gets directory size recursively
   *
   * @private
   * @param dirPath - Directory path
   * @returns Promise<number> - Size in bytes
   */
  private async getDirectorySize(dirPath: string): Promise<number> {
    let totalSize = 0;

    const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);

      if (entry.isDirectory()) {
        // Skip certain directories
        if (['node_modules', '.git', 'dist', 'build'].includes(entry.name)) {
          continue;
        }
        totalSize += await this.getDirectorySize(fullPath);
      } else {
        try {
          const stats = await fs.promises.stat(fullPath);
          totalSize += stats.size;
        } catch {
          // Skip files we can't read
        }
      }
    }

    return totalSize;
  }

  /**
   * Requests user confirmation via stdin
   *
   * @private
   * @param prompt - Prompt message
   * @returns Promise<boolean> - True if confirmed
   */
  private async requestConfirmation(prompt: string): Promise<boolean> {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    try {
      const answer = await new Promise<string>((resolve) => {
        rl.question(prompt, (ans) => {
          resolve(ans.toLowerCase());
        });
      });

      rl.close();
      return answer === 'y' || answer === 'yes';
    } catch {
      rl.close();
      return false;
    }
  }

  /**
   * Sets up SIGINT handler for cleanup
   *
   * @private
   */
  private setupCleanupHandler(): void {
    const handler = async () => {
      console.log('\n[Sandbox] Interrupted, cleaning up sandbox...');
      try {
        await this.cleanup();
      } catch (error) {
        console.error('[Sandbox] Cleanup failed:', error);
      }
      process.exit(130);
    };

    process.on('SIGINT', handler);

    // Store handler reference for later removal
    this._cleanupHandler = handler;
  }

  /**
   * Removes SIGINT handler
   *
   * @private
   */
  private removeCleanupHandler(): void {
    const handler = this._cleanupHandler;
    if (handler) {
      process.removeListener('SIGINT', handler);
      delete this._cleanupHandler;
    }
  }

  /**
   * Copies project files to sandbox using git archive (respects .gitignore)
   *
   * @private
   * @returns Promise<void>
   */
  private async copyProjectToSandbox(): Promise<void> {
    // Try using git archive first (respects .gitignore)
    try {
      console.log('[Sandbox] Using git archive to copy project (respects .gitignore)...');
      await execAsync(`git archive HEAD | tar -x -C "${this.sandboxDir}"`, {
        cwd: this.config.projectRoot,
        timeout: 120000,
      });
      console.log('[Sandbox] Project copied via git archive');
      return;
    } catch (error) {
      console.warn('[Sandbox] git archive failed, falling back to manual copy:', (error as Error).message);
    }

    // Fallback to manual copy with .gitignore respect
    console.log('[Sandbox] Using manual copy with .gitignore filtering...');
    const gitignorePatterns = await this.loadGitignorePatterns();
    await this.copyWithGitignore(gitignorePatterns);
  }

  /**
   * Loads .gitignore patterns
   *
   * @private
   * @returns Promise<string[]> - Array of patterns
   */
  private async loadGitignorePatterns(): Promise<string[]> {
    const gitignorePath = path.join(this.config.projectRoot, '.gitignore');
    if (!fs.existsSync(gitignorePath)) {
      return [];
    }

    const content = await fs.promises.readFile(gitignorePath, 'utf-8');
    return content
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('#'));
  }

  /**
   * Copies directory with .gitignore filtering
   *
   * @private
   * @param patterns - Gitignore patterns
   * @returns Promise<void>
   */
  private async copyWithGitignore(patterns: string[]): Promise<void> {
    const entries = await fs.promises.readdir(this.config.projectRoot, { withFileTypes: true });

    for (const entry of entries) {
      const srcPath = path.join(this.config.projectRoot, entry.name);
      const destPath = path.join(this.sandboxDir, entry.name);

      // Skip if matches gitignore pattern
      if (this.matchesGitignore(entry.name, patterns)) {
        continue;
      }

      // Always skip certain directories
      if (['.git', '.aegis-cache', '.aegis-tmp', 'node_modules', 'dist', 'build'].includes(entry.name)) {
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
   * Checks if a path matches any gitignore pattern
   *
   * @private
   * @param filePath - File path to check
   * @param patterns - Gitignore patterns
   * @returns boolean - True if matches
   */
  private matchesGitignore(filePath: string, patterns: string[]): boolean {
    for (const pattern of patterns) {
      // Simple pattern matching (not full gitignore spec)
      if (pattern.endsWith('/')) {
        if (filePath.startsWith(pattern)) return true;
      } else if (pattern.startsWith('*')) {
        const ext = pattern.slice(1);
        if (filePath.endsWith(ext)) return true;
      } else {
        if (filePath === pattern || filePath.startsWith(pattern + '/')) return true;
      }
    }
    return false;
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
    } catch (error: unknown) {
      const errorMessage = (error as { stderr?: string; message?: string }).stderr || (error as { message?: string }).message || 'Unknown error';
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
    } catch (error: unknown) {
      const errorMessage = (error as { stderr?: string; message?: string }).stderr || (error as { message?: string }).message || 'Unknown error';
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
      const { stderr } = await execAsync('npm test', {
        cwd: this.sandboxDir,
        timeout: 120000,
      });

      if (stderr) {
        console.warn('[Sandbox] Test warnings:', stderr);
      }

      console.log('[Sandbox] Tests passed');
      return { passed: true, errors: [], warnings: stderr.split('\n').filter(line => line.trim()) };
    } catch (error: unknown) {
      const errorMessage = (error as { stderr?: string; message?: string }).stderr || (error as { message?: string }).message || 'Unknown error';
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
      this.removeCleanupHandler();
      console.log('[Sandbox] Sandbox cleaned up successfully');
    } catch (error) {
      console.error('[Sandbox] Failed to cleanup sandbox:', error);
      throw new Error(`[Sandbox] Failed to cleanup sandbox: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Generates unified diff patch against original project
   *
   * @returns Promise<string> - Path to generated patch file
   */
  async generatePatch(): Promise<string> {
    if (!this.isActive) {
      throw new Error('[Sandbox] Sandbox not active, cannot generate patch');
    }

    console.log('[Sandbox] Generating patch file...');

    try {
      // Create .sentinel/patches directory
      const patchesDir = path.join(this.config.projectRoot, '.sentinel', 'patches');
      fs.mkdirSync(patchesDir, { recursive: true });

      // Generate timestamp for patch filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const patchFileName = `aegis-fixes-${timestamp}.patch`;
      const patchFilePath = path.join(patchesDir, patchFileName);

      // Generate diff using diff -ruN (unified format, recursive, new files)
      const diffCommand = process.platform === 'win32'
        ? `diff -ruN "${this.config.projectRoot}" "${this.sandboxDir}" > "${patchFilePath}"`
        : `diff -ruN "${this.config.projectRoot}" "${this.sandboxDir}" > "${patchFilePath}"`;

      try {
        await execAsync(diffCommand, { timeout: 120000 });
      } catch (error: unknown) {
        // diff returns exit code 1 when files differ, which is expected
        if ((error as { code?: number }).code === 1) {
          // Expected - files differ
        } else {
          throw error;
        }
      }

      console.log(`[Sandbox] Patch generated: ${patchFilePath}`);
      console.log(`[Sandbox] To apply fixes: git apply ${patchFilePath}`);

      return patchFilePath;
    } catch (error) {
      console.error('[Sandbox] Failed to generate patch:', error);
      throw new Error(`[Sandbox] Failed to generate patch: ${error instanceof Error ? error.message : String(error)}`);
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
