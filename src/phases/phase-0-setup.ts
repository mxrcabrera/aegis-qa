// eslint-disable @typescript-eslint/no-explicit-any
/**
 * Phase 0: Setup - Hotel Check-in
 *
 * Purpose: Initial validation and setup before starting the QA process.
 * This is the "check-in" phase - if the project doesn't have a reservation
 * (required files) or the client is "crazy" (syntax errors), they don't enter.
 *
 * Architecture:
 * - Dependencies: Check node_modules existence and lockfile consistency
 * - Critical Files: Detect tsconfig.json, .gitignore, package.json
 * - Syntax Check: Quick scan for basic syntax errors
 * - Hardware Lock: Run self-diagnostic to determine session limits
 *
 * @module phases/phase-0-setup
 * @since 2.0.0
 */

import * as fs from 'fs';
import * as path from 'path';
import { ThermalController } from '../core/thermal-controller.js';
import { StatePersistence, type ExecutionState } from '../core/state-persistence.js';
import { FileFilter } from '../core/file-filter.js';
import { IgnoreHandler } from '../core/ignore-handler.js';

/**
 * Setup phase configuration
 */
interface Phase0Config {
  /** Project root directory */
  projectRoot: string;
  /** Thermal controller for hardware lock */
  thermalController: ThermalController;
  /** State persistence for saving setup results */
  statePersistence: StatePersistence;
  /** Current execution state */
  currentState: ExecutionState;
  /** File filter for syntax check */
  fileFilter?: FileFilter;
  /** Ignore handler for filtering */
  ignoreHandler?: IgnoreHandler;
}

/**
 * Dependency check result
 */
interface DependencyCheckResult {
  /** Whether dependencies are valid */
  valid: boolean;
  /** Whether node_modules exists */
  hasNodeModules: boolean;
  /** Lockfile type (npm, yarn, pnpm, bun) */
  lockfileType?: 'npm' | 'yarn' | 'pnpm' | 'bun' | 'none';
  /** Warnings */
  warnings: string[];
}

/**
 * Critical files check result
 */
interface CriticalFilesResult {
  /** Whether all critical files exist */
  complete: boolean;
  /** Missing files */
  missing: string[];
  /** Present files */
  present: string[];
}

/**
 * Syntax check result
 */
interface SyntaxCheckResult {
  /** Whether syntax is valid */
  valid: boolean;
  /** Files with syntax errors */
  errorFiles: { path: string; error: string }[];
  /** Files checked */
  filesChecked: number;
}

/**
 * Hardware lock result
 */
interface HardwareLockResult {
  /** Whether hardware check passed */
  passed: boolean;
  /** Temperature rise rate */
  temperatureRiseRate: number;
  /** Whether thresholds were adjusted */
  thresholdsAdjusted: boolean;
  /** Hardware profile */
  hardwareProfile: {
    hasGPU: boolean;
    gpuModel?: string;
    gpuVRAM?: number;
    cpuCores: number;
    ramTotal: number;
  };
  /** Recommended batch size based on hardware */
  recommendedBatchSize?: number;
  /** Recommended cooldown based on hardware */
  recommendedCooldown?: number;
}

/**
 * Complete Phase 0 result
 */
export interface Phase0Result {
  /** Overall success */
  success: boolean;
  /** Dependency check */
  dependencies: DependencyCheckResult;
  /** Critical files check */
  criticalFiles: CriticalFilesResult;
  /** Syntax check */
  syntax: SyntaxCheckResult;
  /** Hardware lock */
  hardware: HardwareLockResult;
  /** Total execution time */
  executionTimeMs: number;
  /** Error if failed */
  error?: string;
}

/**
 * Phase 0: Setup - Hotel Check-in
 *
 * This phase performs initial validation before starting the QA process.
 * If any critical check fails, the process stops immediately.
 *
 * @class Phase0Setup
 * @example
 * ```typescript
 * const phase0 = new Phase0Setup({
 *   projectRoot: '/path/to/project',
 *   thermalController: new ThermalController(),
 * });
 * const result = await phase0.execute();
 * if (!result.success) {
 *   console.error('Setup failed:', result.error);
 *   process.exit(1);
 * }
 * ```
 */
export class Phase0Setup {
  private config: Phase0Config;

  constructor(config: Phase0Config) {
    this.config = config;
  }

  /**
   * Executes Phase 0: Setup
   *
   * @returns Promise<Phase0Result> - Setup result
   */
  async execute(): Promise<Phase0Result> {
    const startTime = Date.now();
    console.log('��ſ Phase 0: Setup - Hotel Check-in\n');

    try {
      // 1. Hardware Lock - Run self-diagnostic first
      console.log('���� Hardware Lock...');
      const hardwareResult = await this.checkHardware();
      if (!hardwareResult.passed) {
        return {
          success: false,
          dependencies: { valid: false, hasNodeModules: false, warnings: [] },
          criticalFiles: { complete: false, missing: [], present: [] },
          syntax: { valid: false, errorFiles: [], filesChecked: 0 },
          hardware: hardwareResult,
          executionTimeMs: Date.now() - startTime,
          error: 'Hardware diagnostic failed',
        };
      }
      console.log('ԣ� Hardware lock passed\n');

      // 2. Dependencies Check
      console.log('��� Dependencies Check...');
      const depsResult = await this.checkDependencies();
      if (!depsResult.valid) {
        return {
          success: false,
          dependencies: depsResult,
          criticalFiles: { complete: false, missing: [], present: [] },
          syntax: { valid: false, errorFiles: [], filesChecked: 0 },
          hardware: hardwareResult,
          executionTimeMs: Date.now() - startTime,
          error: 'Dependencies check failed',
        };
      }
      console.log('ԣ� Dependencies valid\n');

      // 3. Critical Files Check
      console.log('���� Critical Files Check...');
      const criticalFilesResult = this.checkCriticalFiles();
      if (!criticalFilesResult.complete) {
        return {
          success: false,
          dependencies: depsResult,
          criticalFiles: criticalFilesResult,
          syntax: { valid: false, errorFiles: [], filesChecked: 0 },
          hardware: hardwareResult,
          executionTimeMs: Date.now() - startTime,
          error: `Missing critical files: ${criticalFilesResult.missing.join(', ')}`,
        };
      }
      console.log('ԣ� Critical files present\n');

      // 4. Project Type Detection
      console.log('���� Project Type Detection...');
      const projectType = this.detectProjectType();
      this.config.currentState.projectType = projectType;
      console.log(`ԣ� Project type detected: ${projectType}\n`);

      // 5. Syntax Check
      console.log('���� Syntax Check...');
      const syntaxResult = await this.checkSyntax();

      // If any check fails, halt the process
      if (!depsResult.valid || !criticalFilesResult.complete || !syntaxResult.valid) {
        console.error('\n��� Phase 0 Setup failed. Project is not ready for QA analysis.');
        
        if (!depsResult.valid) {
          console.error('  - Dependency check failed');
          for (const warning of depsResult.warnings) {
            console.error(`    ${warning}`);
          }
        }
        
        if (!criticalFilesResult.complete) {
          console.error('  - Critical files missing:', criticalFilesResult.missing.join(', '));
        }
        
        if (!syntaxResult.valid) {
          console.error('  - Syntax errors found in', syntaxResult.errorFiles.length, 'files');
        }

        // Save failed setup results in StatePersistence
        const setupResults = {
          success: false,
          dependencies: depsResult,
          criticalFiles: criticalFilesResult,
          syntax: syntaxResult,
          hardware: hardwareResult,
          executionTimeMs: Date.now() - startTime,
        };
        await this.config.statePersistence.storeAnalysisResults(0, setupResults, this.config.currentState);

        return setupResults;
      }

      const executionTimeMs = Date.now() - startTime;

      const setupResults = {
        success: true,
        dependencies: depsResult,
        criticalFiles: criticalFilesResult,
        syntax: syntaxResult,
        hardware: hardwareResult,
        executionTimeMs,
      };

      // Save setup results in StatePersistence
      await this.config.statePersistence.storeAnalysisResults(0, setupResults, this.config.currentState);

      // Write partial report for Phase 0
      await this.writePartialReport(setupResults);

      return setupResults;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        dependencies: { valid: false, hasNodeModules: false, warnings: [] },
        criticalFiles: { complete: false, missing: [], present: [] },
        syntax: { valid: false, errorFiles: [], filesChecked: 0 },
        hardware: {
          passed: false,
          temperatureRiseRate: 0,
          thresholdsAdjusted: false,
          hardwareProfile: {
            hasGPU: false,
            cpuCores: 0,
            ramTotal: 0,
          },
        },
        executionTimeMs: 0,
        error: errorMessage,
      };
    }
  }

  /**
   * Writes partial report for Phase 0
   *
   * @private
   * @param setupResults - Setup phase results
   */
  private async writePartialReport(setupResults: Phase0Result): Promise<void> {
    try {
      const reportPath = path.join(this.config.projectRoot, 'qa-report.partial.md');
      const timestamp = new Date().toISOString();

      const reportContent = `
## Phase 0: Setup - PASSED
- **Timestamp:** ${timestamp}
- **Execution Time:** ${setupResults.executionTimeMs}ms

### Environment Validation
- **Project Type:** ${this.config.currentState.projectType || 'unknown'}
- **Dependencies:** ${setupResults.dependencies.valid ? ' Valid' : ' Invalid'}
  - node_modules: ${setupResults.dependencies.hasNodeModules ? ' Present' : ' Missing'}
  - Lockfile: ${setupResults.dependencies.lockfileType || 'none'}
  - Warnings: ${setupResults.dependencies.warnings.length}
- **Critical Files:** ${setupResults.criticalFiles.complete ? ' Complete' : ' Incomplete'}
  - Present: ${setupResults.criticalFiles.present.join(', ')}
  - Missing: ${setupResults.criticalFiles.missing.join(', ') || 'None'}
- **Syntax Check:** ${setupResults.syntax.valid ? ' Valid' : ' Errors found'}
  - Files Checked: ${setupResults.syntax.filesChecked}
  - Error Files: ${setupResults.syntax.errorFiles.length}

### Hardware Diagnostic
- **Status:** ${setupResults.hardware.passed ? ' Passed' : ' Failed'}
- **Temperature Rise Rate:** ${setupResults.hardware.temperatureRiseRate}-°C/min

### Hardware Profile
- **Recommended Batch Size:** ${setupResults.hardware.recommendedBatchSize || 20}
- **Recommended Cooldown:** ${setupResults.hardware.recommendedCooldown || 15000}ms

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

      console.log(` Partial report written: ${reportPath}`);
    } catch (error) {
      console.warn(' Failed to write partial report:', error instanceof Error ? error.message : error);
    }
  }

  /**
   * Checks dependencies (node_modules and lockfile)
   *
   * @private
   * @returns Promise<DependencyCheckResult>
   */
  private async checkDependencies(): Promise<DependencyCheckResult> {
    const warnings: string[] = [];
    const projectRoot = this.config.projectRoot;

    // Check node_modules
    const nodeModulesPath = path.join(projectRoot, 'node_modules');
    const hasNodeModules = fs.existsSync(nodeModulesPath);

    if (!hasNodeModules) {
      warnings.push('node_modules not found - run npm install first');
    }

    // Detect lockfile type
    const lockfileType = this.detectLockfileType(projectRoot);

    if (lockfileType === 'none') {
      warnings.push('No lockfile found (package-lock.json, yarn.lock, pnpm-lock.yaml, bun.lockb)');
    }

    // Check lockfile consistency (basic check)
    if (hasNodeModules && lockfileType !== 'none') {
      const lockfileConsistent = await this.checkLockfileConsistency(lockfileType, projectRoot);
      if (!lockfileConsistent) {
        warnings.push('Lockfile may be inconsistent with node_modules');
      }
    }

    return {
      valid: hasNodeModules && lockfileType !== 'none',
      hasNodeModules,
      lockfileType,
      warnings,
    };
  }

  /**
   * Detects lockfile type
   *
   * @private
   * @param projectRoot - Project root directory
   * @returns Lockfile type
   */
  private detectLockfileType(projectRoot: string): 'npm' | 'yarn' | 'pnpm' | 'bun' | 'none' {
    if (fs.existsSync(path.join(projectRoot, 'package-lock.json'))) {
      return 'npm';
    }
    if (fs.existsSync(path.join(projectRoot, 'yarn.lock'))) {
      return 'yarn';
    }
    if (fs.existsSync(path.join(projectRoot, 'pnpm-lock.yaml'))) {
      return 'pnpm';
    }
    if (fs.existsSync(path.join(projectRoot, 'bun.lockb'))) {
      return 'bun';
    }
    return 'none';
  }

  /**
   * Checks lockfile consistency (basic check)
   *
   * @private
   * @param _lockfileType - Lockfile type (unused in basic check)
   * @param projectRoot - Project root directory
   * @returns Promise<boolean> - Whether lockfile is consistent
   */
  private async checkLockfileConsistency(
    _lockfileType: 'npm' | 'yarn' | 'pnpm' | 'bun',
    projectRoot: string
  ): Promise<boolean> {
    // This is a basic check - in a real implementation, you'd parse the lockfile
    // and compare with package.json dependencies
    try {
      const packageJsonPath = path.join(projectRoot, 'package.json');
      if (!fs.existsSync(packageJsonPath)) {
        return false;
      }

      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
      const hasDependencies = packageJson.dependencies || packageJson.devDependencies;

      return !!hasDependencies;
    } catch {
      return false;
    }
  }

  /**
   * Checks for critical files
   *
   * @private
   * @returns CriticalFilesResult
   */
  private checkCriticalFiles(): CriticalFilesResult {
    const projectRoot = this.config.projectRoot;
    const requiredFiles = ['package.json', 'tsconfig.json', '.gitignore'];
    const missing: string[] = [];
    const present: string[] = [];

    for (const file of requiredFiles) {
      const filePath = path.join(projectRoot, file);
      if (fs.existsSync(filePath)) {
        present.push(file);
      } else {
        missing.push(file);
      }
    }

    return {
      complete: missing.length === 0,
      missing,
      present,
    };
  }

  /**
   * Detects project type based on configuration files
   *
   * @private
   * @returns Project type: 'typescript' | 'javascript' | 'mixed'
   */
  private detectProjectType(): 'typescript' | 'javascript' | 'mixed' {
    const projectRoot = this.config.projectRoot;
    const hasTsConfig = fs.existsSync(path.join(projectRoot, 'tsconfig.json'));
    const hasJsConfig = fs.existsSync(path.join(projectRoot, 'jsconfig.json'));

    if (hasTsConfig && hasJsConfig) {
      return 'mixed';
    } else if (hasTsConfig) {
      return 'typescript';
    } else if (hasJsConfig) {
      return 'javascript';
    } else {
      return 'javascript';
    }
  }

  /**
   * Performs syntax check on project files
   *
   * @private
   * @returns Promise<SyntaxCheckResult>
   */
  private async checkSyntax(): Promise<SyntaxCheckResult> {
    const projectRoot = this.config.projectRoot;
    const errorFiles: { path: string; error: string }[] = [];
    let filesChecked = 0;

    try {
      // Use tsc --noEmit for accurate syntax checking
      const { exec } = await import('child_process');
      const { promisify } = await import('util');
      const execAsync = promisify(exec);

      const { stderr } = await execAsync('npx tsc --noEmit', {
        cwd: projectRoot,
        env: { ...process.env },
      });

      // If tsc --noEmit succeeded, syntax is valid
      if (!stderr) {
        // Count TypeScript files for reporting
        const fileFilter = this.config.fileFilter || new FileFilter();
        const ignoreHandler = this.config.ignoreHandler || new IgnoreHandler({ projectRoot });
        const patterns = ['src/**/*.ts', 'src/**/*.tsx', 'src/**/*.js', 'src/**/*.jsx', 'app/**/*.ts', 'app/**/*.tsx'];

        for (const pattern of patterns) {
          const { glob } = await import('glob');
          const files = await glob(pattern, {
            cwd: projectRoot,
            absolute: true,
          });

          for (const file of files) {
            if (!ignoreHandler.shouldIgnore(file)) {
              const filterResult = fileFilter.shouldAnalyzeFile(file);
              if (filterResult.shouldAnalyze) {
                filesChecked++;
              }
            }
          }
        }

        return {
          valid: true,
          errorFiles: [],
          filesChecked,
        };
      }

      // Parse tsc errors
      const errorLines = stderr.split('\n').filter(line => line.trim());
      for (const line of errorLines) {
        const match = line.match(/^(.+?\.ts(?:x)?)(\(\d+,\d+\))?:\s+(.+)$/);
        if (match) {
          errorFiles.push({ path: match[1], error: match[3] });
          filesChecked++;
        }
      }
    } catch {
      // If tsc is not available, fall back to basic check
      console.warn('tsc not available, falling back to basic syntax check');
      return this.basicSyntaxCheckFallback();
    }

    return {
      valid: errorFiles.length === 0,
      errorFiles,
      filesChecked,
    };
  }

  /**
   * Fallback basic syntax check when tsc is not available
   *
   * @private
   * @returns Promise<SyntaxCheckResult>
   */
  private async basicSyntaxCheckFallback(): Promise<SyntaxCheckResult> {
    const projectRoot = this.config.projectRoot;
    const errorFiles: { path: string; error: string }[] = [];
    let filesChecked = 0;

    const fileFilter = this.config.fileFilter || new FileFilter();
    const ignoreHandler = this.config.ignoreHandler || new IgnoreHandler({ projectRoot });
    const patterns = ['src/**/*.ts', 'src/**/*.tsx', 'src/**/*.js', 'src/**/*.jsx', 'app/**/*.ts', 'app/**/*.tsx'];

    for (const pattern of patterns) {
      const { glob } = await import('glob');
      const files = await glob(pattern, {
        cwd: projectRoot,
        absolute: true,
      });

      for (const file of files) {
        if (ignoreHandler.shouldIgnore(file)) {
          continue;
        }

        const filterResult = fileFilter.shouldAnalyzeFile(file);
        if (!filterResult.shouldAnalyze) {
          continue;
        }

        filesChecked++;

        try {
          const content = fs.readFileSync(file, 'utf-8');
          if (file.endsWith('.ts') || file.endsWith('.tsx')) {
            if (!this.basicSyntaxCheck(content)) {
              errorFiles.push({ path: file, error: 'Basic syntax check failed' });
            }
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          errorFiles.push({ path: file, error: errorMessage });
        }

        if (filesChecked >= 20) {
          break;
        }
      }

      if (filesChecked >= 20) {
        break;
      }
    }

    return {
      valid: errorFiles.length === 0,
      errorFiles,
      filesChecked,
    };
  }

  /**
   * Basic syntax check (simplified)
   *
   * @private
   * @param content - File content
   * @returns boolean - Whether syntax is valid
   */
  private basicSyntaxCheck(content: string): boolean {
    // Check for unbalanced braces
    let braceCount = 0;
    let parenCount = 0;
    let bracketCount = 0;

    for (let i = 0; i < content.length; i++) {
      const char = content[i];
      
      switch (char) {
        case '{':
          braceCount++;
          break;
        case '}':
          braceCount--;
          break;
        case '(':
          parenCount++;
          break;
        case ')':
          parenCount--;
          break;
        case '[':
          bracketCount++;
          break;
        case ']':
          bracketCount--;
          break;
      }
    }

    return braceCount === 0 && parenCount === 0 && bracketCount === 0;
  }

  /**
   * Runs hardware diagnostic and locks hardware limits
   *
   * @private
   * @returns Promise<HardwareLockResult>
   */
  private async checkHardware(): Promise<HardwareLockResult> {
    const diagnosticResult = await this.config.thermalController.runSelfDiagnostic(5000);
    const hardwareProfile = await this.config.thermalController.detectHardwareCapabilities();

    return {
      passed: diagnosticResult.pass,
      temperatureRiseRate: diagnosticResult.temperatureRiseRate,
      thresholdsAdjusted: diagnosticResult.adjustedThresholds,
      hardwareProfile: {
        hasGPU: hardwareProfile.hasGPU,
        gpuModel: hardwareProfile.gpuModel,
        gpuVRAM: hardwareProfile.gpuVRAM,
        cpuCores: hardwareProfile.cpuCores,
        ramTotal: hardwareProfile.ramTotal,
      },
    };
  }
}
















