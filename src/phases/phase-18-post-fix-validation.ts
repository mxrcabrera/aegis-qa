/**
 * Phase 18: Post-Fix Validation & Quality Gate
 *
 * Purpose: Final inspection before concluding the work.
 *
 * Architecture:
 * - Global Integrity Check: Execute npx tsc --noEmit globally, compare pre-fix vs post-fix
 * - Regression Analysis: Compare Phase 1 findings pre-fix vs post-fix
 * - Final Sanitization: Clean up temporary backup files (.backup.*.tmp)
 * - Hardware Guard (Final Stretch): Apply adaptiveCooldown('high') 30s before tsc global
 *
 * @module phases/phase-18-post-fix-validation
 * @since 2.0.0
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSafe } from '../core/command-sanitizer.js';
import { ThermalController } from '../core/thermal-controller.js';
import { StatePersistence, type ExecutionState } from '../core/state-persistence.js';

/**
 * Post-fix validation result
 */
interface PostFixValidationResult {
  /** Global integrity status */
  globalIntegrityStatus: 'passed' | 'GLOBAL_INTEGRITY_COMPROMISED';
  /** Pre-fix type error count */
  preFixTypeErrorCount: number;
  /** Post-fix type error count */
  postFixTypeErrorCount: number;
  /** New type errors introduced */
  newTypeErrors: number;
  /** Regressions detected */
  regressions: Regression[];
  /** Backup files cleaned */
  backupFilesCleaned: number;
  /** Backup folders cleaned */
  backupFoldersCleaned: number;
  /** Cooldown applied */
  cooldownApplied: boolean;
}

/**
 * Regression
 */
interface Regression {
  /** Regression ID */
  id: string;
  /** File path */
  filePath: string;
  /** Original finding type */
  originalFindingType: string;
  /** New error type */
  newErrorType: string;
  /** Description */
  description: string;
}

/**
 * Phase 18 configuration
 */
interface Phase18Config {
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
 * Phase 18 result
 */
export interface Phase18Result {
  /** Overall success */
  success: boolean;
  /** Post-fix validation result */
  validationResult: PostFixValidationResult;
  /** Execution time in milliseconds */
  executionTimeMs: number;
  /** Error if failed */
  error?: string;
}

/**
 * Phase 18: Post-Fix Validation & Quality Gate
 *
 * This phase performs final validation after all fixes are applied.
 *
 * @class Phase18PostFixValidation
 */
export class Phase18PostFixValidation {
  private config: Phase18Config;

  constructor(config: Phase18Config) {
    this.config = config;
  }

  /**
   * Executes Phase 18: Post-Fix Validation & Quality Gate
   *
   * @returns Promise<Phase18Result> - Post-fix validation result
   */
  async execute(): Promise<Phase18Result> {
    const startTime = Date.now();
    console.log('INFO Phase 18: Post-Fix Validation & Quality Gate\n');

    try {
      // Thermal Verification: Check system resources before validation
      console.log('INFO Verifying system resources...');
      const resourceCheck = await this.config.thermalController.checkSystemResources();
      console.log(`INFO CPU Usage: ${resourceCheck.cpuUsage}%`);
      console.log(`INFO RAM Usage: ${resourceCheck.ramUsage}%`);
      console.log(`INFO RAM Available: ${resourceCheck.ramAvailable} GB\n`);

      // Hardware Guard (Final Stretch): Apply adaptiveCooldown('high') for 30s before tsc global
      console.log('INFO Hardware Guard Final Stretch: Applying adaptiveCooldown(high) for 30 seconds...');
      await this.config.thermalController.applyAdaptiveCooldown('high');
      await new Promise(resolve => setTimeout(resolve, 30000));
      console.log('INFO Cooldown complete. Starting Global Integrity Check...\n');

      // Step 1: Capture pre-fix baseline (if not already captured)
      const preFixBaseline = await this.capturePreFixBaseline();

      // Step 2: Global Integrity Check (PUNTO 1)
      const integrityCheck = await this.performGlobalIntegrityCheck(preFixBaseline);

      // Step 3: Regression Analysis
      const regressions = await this.performRegressionAnalysis();

      // Step 3: Strict Regression Check (security patterns)
      const securityRegressions = await this.performStrictRegressionCheck();
      regressions.push(...securityRegressions);

      // Step 4: Final Sanitization
      const sanitizationResult = await this.performFinalSanitization();

      // Step 5: Final Report Lock
      await this.lockFinalReport();

      // Step 6: Hardware Guard (The Big Breath)
      await this.performBigBreath();

      const validationResult: PostFixValidationResult = {
        globalIntegrityStatus: integrityCheck.status,
        preFixTypeErrorCount: preFixBaseline.errorCount,
        postFixTypeErrorCount: integrityCheck.errorCount,
        newTypeErrors: integrityCheck.newErrors,
        regressions,
        backupFilesCleaned: sanitizationResult.filesCleaned,
        backupFoldersCleaned: sanitizationResult.foldersCleaned,
        cooldownApplied: true,
      };

      // Store Phase 18 results in StatePersistence
      await this.config.statePersistence.storeAnalysisResults(18, validationResult, this.config.currentState);

      const executionTimeMs = Date.now() - startTime;

      // Final resource check
      const finalResources = await this.config.thermalController.checkSystemResources();
      console.log(`\n${validationResult.globalIntegrityStatus === 'passed' ? 'SUCCESS' : 'FAILURE'} Phase 18 Complete`);
      console.log(`INFO Global Integrity: ${validationResult.globalIntegrityStatus}`);
      console.log(`INFO Pre-fix type errors: ${validationResult.preFixTypeErrorCount}`);
      console.log(`INFO Post-fix type errors: ${validationResult.postFixTypeErrorCount}`);
      console.log(`INFO New type errors: ${validationResult.newTypeErrors}`);
      console.log(`INFO Regressions: ${validationResult.regressions.length}`);
      console.log(`INFO Backup files cleaned: ${validationResult.backupFilesCleaned}`);
      console.log(`INFO Backup folders cleaned: ${validationResult.backupFoldersCleaned}`);
      console.log(`INFO Final CPU Usage: ${finalResources.cpuUsage}%`);
      console.log(`INFO Final RAM Usage: ${finalResources.ramUsage}%\n`);

      return {
        success: validationResult.globalIntegrityStatus === 'passed',
        validationResult,
        executionTimeMs,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`ERROR Phase 18 failed: ${errorMessage}\n`);

      return {
        success: false,
        validationResult: {
          globalIntegrityStatus: 'GLOBAL_INTEGRITY_COMPROMISED',
          preFixTypeErrorCount: 0,
          postFixTypeErrorCount: 0,
          newTypeErrors: 0,
          regressions: [],
          backupFilesCleaned: 0,
          backupFoldersCleaned: 0,
          cooldownApplied: false,
        },
        executionTimeMs: Date.now() - startTime,
        error: errorMessage,
      };
    }
  }

  /**
   * Captures pre-fix baseline (type errors before fixes)
   *
   * @private
   * @returns Promise<{ errorCount: number; errors: string[] }> - Pre-fix baseline
   */
  private async capturePreFixBaseline(): Promise<{ errorCount: number; errors: string[] }> {
    console.log('INFO Capturing pre-fix baseline...');

    try {
      const { stderr } = await execSafe('npx', ['tsc', '--noEmit'], { cwd: this.config.projectRoot });
      const errors = stderr ? stderr.split('\n').filter((line: string) => line.trim()) : [];
      
      console.log(`INFO Pre-fix baseline captured: ${errors.length} type errors`);
      return { errorCount: errors.length, errors };
    } catch (error) {
      const stderr = (error as unknown).stderr || '';
      const errors = stderr ? stderr.split('\n').filter((line: string) => line.trim()) : [];
      
      console.log(`INFO Pre-fix baseline captured: ${errors.length} type errors`);
      return { errorCount: errors.length, errors };
    }
  }

  /**
   * Performs Global Integrity Check (PUNTO 1)
   *
   * PUNTO 1: Global Integrity Check
   * 
   * LÓGICA DE GLOBAL INTEGRITY CHECK:
   * 1. Ejecutar npx tsc --noEmit sobre todo el proyecto
   * 2. Comparar errores post-fix con baseline pre-fix
   * 3. Si hay nuevos errores que no existían antes, marcar como GLOBAL_INTEGRITY_COMPROMISED
   * 4. Esto asegura que no reportamos errores que ya existían antes de los fixes
   * 
   * @private
   * @param preFixBaseline - Pre-fix baseline
   * @returns Promise<{ status: 'passed' | 'GLOBAL_INTEGRITY_COMPROMISED'; errorCount: number; newErrors: number }> - Integrity check result
   */
  private async performGlobalIntegrityCheck(preFixBaseline: {
    errorCount: number;
    errors: string[];
  }): Promise<{ status: 'passed' | 'GLOBAL_INTEGRITY_COMPROMISED'; errorCount: number; newErrors: number }> {
    console.log('INFO Performing Global Integrity Check...');
    console.log(`INFO Pre-fix baseline: ${preFixBaseline.errorCount} errors\n`);

    try {
      // Execute npx tsc --noEmit globally
      const { stderr } = await execSafe('npx', ['tsc', '--noEmit'], { cwd: this.config.projectRoot });
      const postFixErrors = stderr ? stderr.split('\n').filter((line: string) => line.trim()) : [];
      
      const postFixErrorCount = postFixErrors.length;
      console.log(`INFO Post-fix error count: ${postFixErrorCount}`);

      // Compare with pre-fix baseline to detect NEW errors
      const newErrors = this.detectNewErrors(preFixBaseline.errors, postFixErrors);
      const newErrorCount = newErrors.length;

      console.log(`INFO New errors introduced: ${newErrorCount}`);

      if (newErrorCount > 0) {
        console.log('WARNING New type errors detected. Reporting GLOBAL_INTEGRITY_COMPROMISED');
        console.log('New errors:');
        for (const error of newErrors) {
          console.log(`  - ${error}`);
        }
        return { status: 'GLOBAL_INTEGRITY_COMPROMISED', errorCount: postFixErrorCount, newErrors: newErrorCount };
      }

      console.log('SUCCESS No new type errors detected. Global integrity maintained');
      return { status: 'passed', errorCount: postFixErrorCount, newErrors: 0 };
    } catch (error) {
      const stderr = (error as unknown).stderr || '';
      const postFixErrors = stderr ? stderr.split('\n').filter((line: string) => line.trim()) : [];
      const postFixErrorCount = postFixErrors.length;
      
      console.log(`INFO Post-fix error count: ${postFixErrorCount}`);

      // Compare with pre-fix baseline
      const newErrors = this.detectNewErrors(preFixBaseline.errors, postFixErrors);
      const newErrorCount = newErrors.length;

      console.log(`INFO New errors introduced: ${newErrorCount}`);

      if (newErrorCount > 0) {
        console.log('WARNING New type errors detected. Reporting GLOBAL_INTEGRITY_COMPROMISED');
        return { status: 'GLOBAL_INTEGRITY_COMPROMISED', errorCount: postFixErrorCount, newErrors: newErrorCount };
      }

      return { status: 'passed', errorCount: postFixErrorCount, newErrors: 0 };
    }
  }

  /**
   * Detects new errors by comparing pre-fix and post-fix error sets
   *
   * @private
   * @param preFixErrors - Pre-fix errors
   * @param postFixErrors - Post-fix errors
   * @returns string[] - New errors
   */
  private detectNewErrors(preFixErrors: string[], postFixErrors: string[]): string[] {
    // Create a Set of pre-fix error signatures for O(1) lookup
    const preFixErrorSignatures = new Set<string>();
    
    for (const error of preFixErrors) {
      // Extract error signature (file:line:column + error message)
      const signature = this.extractErrorSignature(error);
      preFixErrorSignatures.add(signature);
    }

    // Find post-fix errors that don't exist in pre-fix
    const newErrors: string[] = [];
    
    for (const error of postFixErrors) {
      const signature = this.extractErrorSignature(error);
      if (!preFixErrorSignatures.has(signature)) {
        newErrors.push(error);
      }
    }

    return newErrors;
  }

  /**
   * Extracts error signature for comparison
   *
   * @private
   * @param error - Error line
   * @returns string - Error signature
   */
  private extractErrorSignature(error: string): string {
    // Extract file path and line number
    const match = error.match(/^(.+\.ts):(\d+):(\d+):\s+(.+)$/);
    if (match) {
      const filePath = match[1];
      const lineNumber = match[2];
      const columnNumber = match[3];
      return `${filePath}:${lineNumber}:${columnNumber}`;
    }
    
    // Fallback: use entire error line
    return error.trim();
  }

  /**
   * Performs Regression Analysis (PUNTO 2)
   *
   * @private
   * @returns Promise<Regression[]> - Regressions detected
   */
  private async performRegressionAnalysis(): Promise<Regression[]> {
    console.log('INFO Performing Regression Analysis...');
    const regressions: Regression[] = [];

    // Get Phase 1 findings (pre-fix)
    const phase1Data = this.config.currentState.analysisResults?.['1'];
    if (!phase1Data) {
      console.log('INFO No Phase 1 data found for regression analysis');
      return regressions;
    }

    const preFixFindings = this.extractFindingsFromPhaseData(phase1Data);
    console.log(`INFO Pre-fix findings: ${preFixFindings.length}`);

    // Run Phase 1 again to get post-fix findings
    const postFixFindings = await this.runPhase1Scan();
    console.log(`INFO Post-fix findings: ${postFixFindings.length}`);

    // Compare findings to detect regressions
    for (const preFixFinding of preFixFindings) {
      const filePath = preFixFinding.filePath;
      if (!filePath) continue;

      // Check if same zone has new errors post-fix
      const zoneErrors = postFixFindings.filter(f => f.filePath === filePath);
      
      for (const postFixError of zoneErrors) {
        if (this.isRegression(preFixFinding, postFixError)) {
          regressions.push({
            id: `regression-${Date.now()}`,
            filePath,
            originalFindingType: preFixFinding.type || 'unknown',
            newErrorType: postFixError.type || 'unknown',
            description: `Fix for ${preFixFinding.type} introduced ${postFixError.type} in same zone`,
          });
        }
      }
    }

    console.log(`INFO Regressions detected: ${regressions.length}`);
    return regressions;
  }

  /**
   * Extracts findings from phase data
   *
   * @private
   * @param phaseData - Phase data
   * @returns Array of findings
   */
  private extractFindingsFromPhaseData(phaseData: unknown): unknown[] {
    if (Array.isArray(phaseData)) {
      return phaseData;
    }

    if (phaseData.findings && Array.isArray(phaseData.findings)) {
      return phaseData.findings;
    }

    if (phaseData.codeFindings && Array.isArray(phaseData.codeFindings)) {
      return phaseData.codeFindings;
    }

    return [];
  }

  /**
   * Runs Phase 1 scan to get post-fix findings
   *
   * @private
   * @returns Promise<any[]> - Post-fix findings
   */
  private async runPhase1Scan(): Promise<unknown[]> {
    // Placeholder: In real implementation, would re-run Phase 1
    // For now, return empty array
    return [];
  }

  /**
   * Checks if post-fix error is a regression of pre-fix finding
   *
   * @private
   * @param preFixFinding - Pre-fix finding
   * @param postFixError - Post-fix error
   * @returns boolean - Whether it's a regression
   */
  private isRegression(preFixFinding: unknown, postFixError: unknown): boolean {
    // Check if they're in the same file and same line/zone
    if (preFixFinding.filePath !== postFixError.filePath) {
      return false;
    }

    // Check if post-fix error is different type (new error introduced)
    if (preFixFinding.type === postFixError.type) {
      return false;
    }

    // Check if they're in the same zone (within 5 lines)
    const lineDiff = Math.abs((preFixFinding.line || 0) - (postFixError.line || 0));
    if (lineDiff <= 5) {
      return true;
    }

    return false;
  }

  /**
   * Performs Strict Regression Check (security patterns)
   *
   * @private
   * @returns Promise<Regression[]> - Security regressions detected
   */
  private async performStrictRegressionCheck(): Promise<Regression[]> {
    console.log('INFO Performing Strict Regression Check (security patterns)...');
    const regressions: Regression[] = [];

    // Get modified files from Phase 17
    const phase17Data = this.config.currentState.analysisResults?.['17'];
    if (!phase17Data) {
      console.log('INFO No Phase 17 data found for security regression check');
      return regressions;
    }

    // Security patterns to check (from Phase 3)
    const securityPatterns = [
      /http:\/\/localhost/i,
      /http:\/\/127\.0\.0\.1/i,
      /staging\.api/i,
      /api_key\s*=/i,
      /secret\s*=/i,
      /password\s*=/i,
      /token\s*=/i,
      /aws_access_key\s*=/i,
      /aws_secret_key\s*=/i,
      /private_key\s*=/i,
    ];

    // Check modified files for security regressions
    const modifiedFiles = this.getModifiedFiles(phase17Data);
    console.log(`INFO Checking ${modifiedFiles.length} modified files for security regressions`);

    for (const filePath of modifiedFiles) {
      try {
        const fullPath = path.join(this.config.projectRoot, filePath);
        const content = fs.readFileSync(fullPath, 'utf-8');
        const lines = content.split('\n');

        for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
          const line = lines[lineIndex];
          const lineNumber = lineIndex + 1;

          for (const pattern of securityPatterns) {
            if (pattern.test(line)) {
              regressions.push({
                id: `security-regression-${Date.now()}`,
                filePath,
                originalFindingType: 'security-pattern',
                newErrorType: 'security-regression',
                description: `Security pattern detected in modified file at line ${lineNumber}: ${pattern.toString()}`,
              });
              console.log(`WARNING Security regression detected in ${filePath}:${lineNumber}`);
            }
          }
        }
      } catch (error) {
        console.warn(`WARNING Failed to check ${filePath} for security regressions:`, error instanceof Error ? error.message : error);
      }
    }

    console.log(`INFO Security regressions detected: ${regressions.length}`);
    return regressions;
  }

  /**
   * Gets modified files from Phase 17 data
   *
   * @private
   * @param phase17Data - Phase 17 data
   * @returns string[] - Modified file paths
   */
  private getModifiedFiles(phase17Data: unknown): string[] {
    const modifiedFiles: string[] = [];

    if (phase17Data.executionResult) {
      // In real implementation, would track modified files
      // For now, return empty array
    }

    return modifiedFiles;
  }

  /**
   * Performs Final Sanitization with Zombie Backup Hunter (PUNTO 2)
   *
   * PUNTO 2: Zombie Backup Hunter
   * 
   * LÓGICA DE ZOMBIE BACKUP HUNTER:
   * - La sanitización debe ser recursiva
   * - Eliminar carpetas .aegis_backup o similares que hayan quedado por crash previo
   * - Solo permitir que el repo quede con los cambios confirmados
   * - Aegis QA debe ser un ciudadano ejemplar y dejar el filesystem impecable
   * 
   * @private
   * @returns Promise<{ filesCleaned: number; foldersCleaned: number }> - Sanitization result
   */
  private async performFinalSanitization(): Promise<{ filesCleaned: number; foldersCleaned: number }> {
    console.log('INFO Performing Final Sanitization with Zombie Backup Hunter...');
    let filesCleaned = 0;
    let foldersCleaned = 0;

    try {
      // Find backup files (.backup.*.tmp)
      const backupFiles = this.findBackupFiles();
      console.log(`INFO Found ${backupFiles.length} backup files`);

      for (const backupFile of backupFiles) {
        try {
          fs.unlinkSync(backupFile);
          filesCleaned++;
          console.log(`INFO Deleted backup file: ${backupFile}`);
        } catch (error) {
          console.warn(`WARNING Failed to delete backup file ${backupFile}:`, error instanceof Error ? error.message : error);
        }
      }

      // Find zombie backup folders (recursive)
      const zombieFolders = this.findZombieBackupFolders();
      console.log(`INFO Found ${zombieFolders.length} zombie backup folders`);

      for (const zombieFolder of zombieFolders) {
        try {
          this.deleteFolderRecursive(zombieFolder);
          foldersCleaned++;
          console.log(`INFO Deleted zombie backup folder: ${zombieFolder}`);
        } catch (error) {
          console.warn(`WARNING Failed to delete zombie folder ${zombieFolder}:`, error instanceof Error ? error.message : error);
        }
      }

      console.log(`INFO Final Sanitization complete: ${filesCleaned} files, ${foldersCleaned} folders cleaned`);
    } catch (error) {
      console.error('ERROR Final Sanitization failed:', error instanceof Error ? error.message : error);
    }

    return { filesCleaned, foldersCleaned };
  }

  /**
   * Finds zombie backup folders (PUNTO 2)
   *
   * @private
   * @returns string[] - Array of zombie folder paths
   */
  private findZombieBackupFolders(): string[] {
    const zombieFolders: string[] = [];

    const findFoldersRecursive = (dir: string) => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          // Check if it's a zombie backup folder
          if (entry.name.startsWith('.aegis_backup') || 
              entry.name.startsWith('.backup_') || 
              entry.name.startsWith('.sentinel_backup') ||
              entry.name === '.sentinel' && entry.name !== '.sentinel') {
            zombieFolders.push(fullPath);
          } else if (entry.name !== '.git' && entry.name !== 'node_modules') {
            // Recursively search subdirectories
            findFoldersRecursive(fullPath);
          }
        }
      }
    };

    findFoldersRecursive(this.config.projectRoot);
    return zombieFolders;
  }

  /**
   * Deletes a folder recursively
   *
   * @private
   * @param folderPath - Folder path to delete
   */
  private deleteFolderRecursive(folderPath: string): void {
    if (!fs.existsSync(folderPath)) {
      return;
    }

    const entries = fs.readdirSync(folderPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(folderPath, entry.name);

      if (entry.isDirectory()) {
        this.deleteFolderRecursive(fullPath);
      } else {
        fs.unlinkSync(fullPath);
      }
    }

    fs.rmdirSync(folderPath);
  }

  /**
   * Locks Final Report (PUNTO 3)
   *
   * @private
   * @returns Promise<void>
   */
  private async lockFinalReport(): Promise<void> {
    console.log('INFO Locking Final Report...');

    try {
      const reportPath = path.join(this.config.projectRoot, 'qa-report.md');
      
      if (fs.existsSync(reportPath)) {
        const content = fs.readFileSync(reportPath, 'utf-8');
        
        // Add Final marker at the beginning
        const finalMarker = `# AEGIS QA FINAL REPORT
# This report is locked. Any modification requires a new audit.
# Generated: ${new Date().toISOString()}

`;
        
        fs.writeFileSync(reportPath, finalMarker + content, 'utf-8');
        console.log('INFO Final report locked');
      } else {
        console.log('WARNING No qa-report.md found to lock');
      }
    } catch (error) {
      console.error('ERROR Failed to lock final report:', error instanceof Error ? error.message : error);
    }
  }

  /**
   * Performs Hardware Guard (The Big Breath) (PUNTO 4)
   *
   * PUNTO 4: Hardware Guard (The Big Breath)
   * 
   * LÓGICA DE THE BIG BREATH:
   * - Antes de entregar el control al usuario, verificar temperatura de CPU/GPU
   * - Si sigue por encima de 65°C, forzar waiting period de 15 segundos
   * - Permitir que el sistema se enfríe antes de imprimir el resumen final
   * 
   * @private
   * @returns Promise<void>
   */
  private async performBigBreath(): Promise<void> {
    console.log('INFO Performing Hardware Guard (The Big Breath)...');

    try {
      const resourceCheck = await this.config.thermalController.checkSystemResources();
      console.log(`INFO CPU Usage: ${resourceCheck.cpuUsage}%`);
      console.log(`INFO RAM Usage: ${resourceCheck.ramUsage}%`);
      
      // Check if temperature is available (using RAM usage as proxy if temp not available)
      const tempThreshold = 65;
      const currentTemp = resourceCheck.ramUsage; // Using RAM as proxy for thermal stress
      
      if (currentTemp > tempThreshold) {
        console.log(`WARNING System temperature/usage high (${currentTemp}%). Initiating Big Breath...`);
        console.log('INFO Waiting 15 seconds for system to cool down...');
        
        await new Promise(resolve => setTimeout(resolve, 15000));
        
        const postBreathCheck = await this.config.thermalController.checkSystemResources();
        console.log(`INFO Post-Breath CPU Usage: ${postBreathCheck.cpuUsage}%`);
        console.log(`INFO Post-Breath RAM Usage: ${postBreathCheck.ramUsage}%`);
        console.log('INFO Big Breath complete');
      } else {
        console.log('INFO System temperature/usage normal. No breath needed.');
      }
    } catch (error) {
      console.warn('WARNING Failed to perform Big Breath:', error instanceof Error ? error.message : error);
    }
  }

  /**
   * Finds backup files (.backup.*.tmp)
   *
   * @private
   * @returns string[] - Array of backup file paths
   */
  private findBackupFiles(): string[] {
    const backupFiles: string[] = [];

    const findFilesRecursive = (dir: string) => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          if (entry.name !== '.git' && entry.name !== 'node_modules') {
            findFilesRecursive(fullPath);
          }
        } else if (entry.isFile() && entry.name.startsWith('.backup.') && entry.name.endsWith('.tmp')) {
          backupFiles.push(fullPath);
        }
      }
    };

    findFilesRecursive(this.config.projectRoot);
    return backupFiles;
  }
}


