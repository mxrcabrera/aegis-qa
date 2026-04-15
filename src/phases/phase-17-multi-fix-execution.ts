/**
 * Phase 17: Multi-Fix Execution
 *
 * Purpose: Convert AtomicFixer into a mass remediation machine but safe.
 *
 * Architecture:
 * - Batch Execution: Apply multiple fixes in same file if Safe Level < 3
 * - Smart Verification: Incremental verification (eslint --fix, tsc --noEmit, full build conditional)
 * - Parallel Fixes Guard: Limit parallelism based on CPU usage
 * - Hardware Guard (Disk I/O): Monitor write latency, wait 5s if disk saturated
 *
 * @module phases/phase-17-multi-fix-execution
 * @since 2.0.0
 */

import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { ThermalController } from '../core/thermal-controller.js';
import { StatePersistence, type ExecutionState } from '../core/state-persistence.js';

const execAsync = promisify(exec);

/**
 * Multi-fix execution result
 */
interface MultiFixExecutionResult {
  /** Total fixes attempted */
  totalFixesAttempted: number;
  /** Fixes applied */
  fixesApplied: number;
  /** Fixes failed */
  fixesFailed: number;
  /** Files processed in batch */
  batchFiles: number;
  /** Files processed individually */
  individualFiles: number;
  /** Verification time saved (ms) */
  verificationTimeSaved: number;
  /** Disk I/O waits */
  diskIOWaits: number;
}

/**
 * File fix batch
 */
interface FileFixBatch {
  /** File path */
  filePath: string;
  /** Strategies to apply */
  strategies: any[];
  /** Maximum safe level */
  maxSafeLevel: number;
  /** Is Core Path */
  isCorePath: boolean;
  /** Blast radius (import count) */
  blastRadius: number;
}

/**
 * Phase 17 configuration
 */
interface Phase17Config {
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
 * Phase 17 result
 */
export interface Phase17Result {
  /** Overall success */
  success: boolean;
  /** Multi-fix execution result */
  executionResult: MultiFixExecutionResult;
  /** Execution time in milliseconds */
  executionTimeMs: number;
  /** Error if failed */
  error?: string;
}

/**
 * Phase 17: Multi-Fix Execution
 *
 * This phase executes multiple fixes efficiently with safety guards.
 *
 * @class Phase17MultiFixExecution
 */
export class Phase17MultiFixExecution {
  private config: Phase17Config;
  private lastWriteTime: number;
  private diskIOWaitCount: number;

  constructor(config: Phase17Config) {
    this.config = config;
    this.lastWriteTime = 0;
    this.diskIOWaitCount = 0;
  }

  /**
   * Executes Phase 17: Multi-Fix Execution
   *
   * @returns Promise<Phase17Result> - Multi-fix execution result
   */
  async execute(): Promise<Phase17Result> {
    const startTime = Date.now();
    console.log('INFO Phase 17: Multi-Fix Execution\n');

    try {
      // Thermal Verification: Check system resources before execution
      console.log('INFO Verifying system resources...');
      const resourceCheck = await this.config.thermalController.checkSystemResources();
      console.log(`INFO CPU Usage: ${resourceCheck.cpuUsage}%`);
      console.log(`INFO RAM Usage: ${resourceCheck.ramUsage}%`);
      console.log(`INFO RAM Available: ${resourceCheck.ramAvailable} GB\n`);

      if (!resourceCheck.isSafe) {
        console.log(`WARNING System resources not safe (${resourceCheck.category}). Applying cooldown...`);
        await this.config.thermalController.applyAdaptiveCooldown('medium');
      }

      // Execute multi-fix
      const executionResult = await this.executeMultiFixes();

      // Store Phase 17 results in StatePersistence
      await this.config.statePersistence.storeAnalysisResults(17, executionResult, this.config.currentState);

      const executionTimeMs = Date.now() - startTime;

      // Final resource check
      const finalResources = await this.config.thermalController.checkSystemResources();
      console.log(`\nSUCCESS Phase 17 Complete`);
      console.log(`INFO Total fixes attempted: ${executionResult.totalFixesAttempted}`);
      console.log(`INFO Fixes applied: ${executionResult.fixesApplied}`);
      console.log(`INFO Fixes failed: ${executionResult.fixesFailed}`);
      console.log(`INFO Batch files: ${executionResult.batchFiles}`);
      console.log(`INFO Individual files: ${executionResult.individualFiles}`);
      console.log(`INFO Verification time saved: ${executionResult.verificationTimeSaved}ms`);
      console.log(`INFO Disk I/O waits: ${executionResult.diskIOWaits}`);
      console.log(`INFO Final CPU Usage: ${finalResources.cpuUsage}%`);
      console.log(`INFO Final RAM Usage: ${finalResources.ramUsage}%\n`);

      return {
        success: true,
        executionResult,
        executionTimeMs,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`ERROR Phase 17 failed: ${errorMessage}\n`);

      return {
        success: false,
        executionResult: {
          totalFixesAttempted: 0,
          fixesApplied: 0,
          fixesFailed: 0,
          batchFiles: 0,
          individualFiles: 0,
          verificationTimeSaved: 0,
          diskIOWaits: 0,
        },
        executionTimeMs: Date.now() - startTime,
        error: errorMessage,
      };
    }
  }

  /**
   * Executes multi-fixes with batch execution
   *
   * @private
   * @returns Promise<MultiFixExecutionResult> - Multi-fix execution result
   */
  private async executeMultiFixes(): Promise<MultiFixExecutionResult> {
    const result: MultiFixExecutionResult = {
      totalFixesAttempted: 0,
      fixesApplied: 0,
      fixesFailed: 0,
      batchFiles: 0,
      individualFiles: 0,
      verificationTimeSaved: 0,
      diskIOWaits: 0,
    };

    // Get strategies from Phase 16
    const phase16Data = this.config.currentState.analysisResults?.['16'];
    if (!phase16Data || !phase16Data.strategiesByPhase) {
      console.log('INFO No strategies from Phase 16 found');
      return result;
    }

    const allStrategies: any[] = [];
    const strategiesByPhase = phase16Data.strategiesByPhase as Map<number, any[]>;
    for (const strategies of strategiesByPhase.values()) {
      allStrategies.push(...strategies);
    }

    // Group strategies by file
    const fileBatches = this.groupStrategiesByFile(allStrategies);

    // Process each file batch
    for (const batch of fileBatches) {
      result.totalFixesAttempted += batch.strategies.length;

      // Hardware Guard (Disk I/O): Monitor write latency
      await this.checkDiskIO();

      // Batch Execution: Apply multiple fixes if Safe Level < 3
      if (batch.maxSafeLevel < 3) {
        console.log(`INFO Processing ${batch.filePath} in batch mode (max Safe Level: ${batch.maxSafeLevel})`);
        const batchResult = await this.applyBatchFixes(batch);
        result.fixesApplied += batchResult.applied;
        result.fixesFailed += batchResult.failed;
        result.batchFiles++;
        result.verificationTimeSaved += batchResult.timeSaved;
      } else {
        console.log(`INFO Processing ${batch.filePath} individually (Safe Level >= 3: ${batch.maxSafeLevel})`);
        const individualResult = await this.applyIndividualFixes(batch);
        result.fixesApplied += individualResult.applied;
        result.fixesFailed += individualResult.failed;
        result.individualFiles++;
      }
    }

    result.diskIOWaits = this.diskIOWaitCount;

    return result;
  }

  /**
   * Groups strategies by file for batch execution
   *
   * @private
   * @param strategies - All strategies
   * @returns FileFixBatch[] - Array of file batches
   */
  private groupStrategiesByFile(strategies: any[]): FileFixBatch[] {
    const fileMap = new Map<string, any[]>();

    for (const strategy of strategies) {
      if (!strategy.filePath) continue;

      if (!fileMap.has(strategy.filePath)) {
        fileMap.set(strategy.filePath, []);
      }
      fileMap.get(strategy.filePath)!.push(strategy);
    }

    const batches: FileFixBatch[] = [];

    for (const [filePath, fileStrategies] of fileMap.entries()) {
      const maxSafeLevel = Math.max(...fileStrategies.map((s: any) => s.safeLevel || 1));
      const isCorePath = fileStrategies.some((s: any) => s.isCorePath);
      const blastRadius = Math.max(...fileStrategies.map((s: any) => s.dependencies?.length || 0));

      batches.push({
        filePath,
        strategies: fileStrategies,
        maxSafeLevel,
        isCorePath,
        blastRadius,
      });
    }

    return batches;
  }

  /**
   * Applies multiple fixes in batch mode
   *
   * @private
   * @param batch - File fix batch
   * @returns Promise<{ applied: number; failed: number; timeSaved: number }> - Batch result
   */
  private async applyBatchFixes(batch: FileFixBatch): Promise<{
    applied: number;
    failed: number;
    timeSaved: number;
  }> {
    const result = { applied: 0, failed: 0, timeSaved: 0 };
    const filePath = path.join(this.config.projectRoot, batch.filePath);

    try {
      // Atomic Batch Rollback: Read original content for potential rollback
      const originalContent = fs.readFileSync(filePath, 'utf-8');
      let modifiedContent = originalContent;

      // Apply all fixes in batch
      for (const strategy of batch.strategies) {
        if (strategy.conflictStatus === 'conflict-resolved') continue;

        const fixResult = this.applySingleFixToContent(modifiedContent, strategy);
        if (fixResult.success) {
          modifiedContent = fixResult.newContent;
          result.applied++;
        } else {
          result.failed++;
        }
      }

      // Write modified content
      fs.writeFileSync(filePath, modifiedContent, 'utf-8');

      // Linter-Fix Loop: Run eslint --fix up to 3 times
      const linterResult = await this.runLinterFixLoop(batch.filePath);
      if (!linterResult.success) {
        console.log(`WARNING Linter-Fix Loop failed for ${batch.filePath} after 3 attempts. Rolling back...`);
        // Atomic Batch Rollback: Total rollback to pre-batch state
        fs.writeFileSync(filePath, originalContent, 'utf-8');
        result.applied = 0;
        result.failed = batch.strategies.length;
        return result;
      }

      // Smart Verification (PUNTO 2)
      const verificationResult = await this.performSmartVerification(
        batch.filePath,
        batch.isCorePath,
        batch.blastRadius
      );

      if (!verificationResult.passed) {
        // Atomic Batch Rollback: Total rollback to pre-batch state
        console.log(`WARNING Verification failed for ${batch.filePath}. Performing total rollback...`);
        fs.writeFileSync(filePath, originalContent, 'utf-8');
        result.applied = 0;
        result.failed = batch.strategies.length;
      } else {
        result.timeSaved = verificationResult.timeSaved;
      }

      return result;
    } catch (error) {
      console.error(`ERROR Batch fix failed for ${batch.filePath}:`, error instanceof Error ? error.message : error);
      result.failed = batch.strategies.length;
      return result;
    }
  }

  /**
   * Applies fixes individually (isolated)
   *
   * @private
   * @param batch - File fix batch
   * @returns Promise<{ applied: number; failed: number }> - Individual result
   */
  private async applyIndividualFixes(batch: FileFixBatch): Promise<{
    applied: number;
    failed: number;
  }> {
    const result = { applied: 0, failed: 0 };
    const filePath = path.join(this.config.projectRoot, batch.filePath);

    for (const strategy of batch.strategies) {
      if (strategy.conflictStatus === 'conflict-resolved') continue;

      // Hardware Guard (Disk I/O): Monitor write latency
      await this.checkDiskIO();

      try {
        const originalContent = fs.readFileSync(filePath, 'utf-8');

        const fixResult = this.applySingleFixToContent(originalContent, strategy);
        if (!fixResult.success) {
          result.failed++;
          continue;
        }

        // Write modified content
        fs.writeFileSync(filePath, fixResult.newContent, 'utf-8');

        // Smart Verification (PUNTO 2)
        const verificationResult = await this.performSmartVerification(
          batch.filePath,
          batch.isCorePath,
          batch.blastRadius
        );

        if (verificationResult.passed) {
          result.applied++;
        } else {
          // Rollback
          fs.writeFileSync(filePath, originalContent, 'utf-8');
          result.failed++;
        }
      } catch (error) {
        console.error(`ERROR Individual fix failed for ${strategy.strategyId}:`, error instanceof Error ? error.message : error);
        result.failed++;
      }
    }

    return result;
  }

  /**
   * Applies a single fix to content
   *
   * @private
   * @param content - Original content
   * @param strategy - Fix strategy
   * @returns { success: boolean; newContent: string } - Fix result
   */
  private applySingleFixToContent(content: string, strategy: any): {
    success: boolean;
    newContent: string;
  } {
    try {
      // Apply fix based on strategy type
      switch (strategy.findingType) {
        case 'hardcoded-string':
          return this.fixHardcodedString(content, strategy);
        case 'unused-var':
          return this.fixUnusedVariable(content, strategy);
        case 'user-root':
          return this.fixUserRoot(content, strategy);
        case 'latest-image':
          return this.fixLatestImage(content, strategy);
        default:
          // Generic fix: replace line if line number is specified
          if (strategy.line) {
            const lines = content.split('\n');
            if (strategy.line > 0 && strategy.line <= lines.length) {
              lines[strategy.line - 1] = strategy.suggestedAction;
              return { success: true, newContent: lines.join('\n') };
            }
          }
          return { success: false, newContent: content };
      }
    } catch {
      return { success: false, newContent: content };
    }
  }

  /**
   * Fixes hardcoded string
   *
   * @private
   * @param content - Content
   * @param strategy - Strategy
   * @returns Fix result
   */
  private fixHardcodedString(content: string, strategy: any): {
    success: boolean;
    newContent: string;
  } {
    // Placeholder implementation
    return { success: false, newContent: content };
  }

  /**
   * Fixes unused variable
   *
   * @private
   * @param content - Content
   * @param strategy - Strategy
   * @returns Fix result
   */
  private fixUnusedVariable(content: string, strategy: any): {
    success: boolean;
    newContent: string;
  } {
    // Placeholder implementation
    return { success: false, newContent: content };
  }

  /**
   * Fixes USER root in Dockerfile
   *
   * @private
   * @param content - Content
   * @param strategy - Strategy
   * @returns Fix result
   */
  private fixUserRoot(content: string, strategy: any): {
    success: boolean;
    newContent: string;
  } {
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const trimmed = lines[i].trim();
      if (trimmed.toUpperCase().startsWith('USER')) {
        const userValue = trimmed.substring(4).trim();
        if (userValue === 'root' || userValue === '0') {
          lines[i] = lines[i].replace(/root|0/gi, 'node');
          return { success: true, newContent: lines.join('\n') };
        }
      }
    }
    return { success: false, newContent: content };
  }

  /**
   * Fixes latest image in Dockerfile
   *
   * @private
   * @param content - Content
   * @param strategy - Strategy
   * @returns Fix result
   */
  private fixLatestImage(content: string, strategy: any): {
    success: boolean;
    newContent: string;
  } {
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const trimmed = lines[i].trim();
      if (trimmed.toUpperCase().startsWith('FROM')) {
        if (trimmed.includes(':latest')) {
          lines[i] = lines[i].replace(/:latest/gi, ':18-alpine');
          return { success: true, newContent: lines.join('\n') };
        }
      }
    }
    return { success: false, newContent: content };
  }

  /**
   * Performs Smart Verification (PUNTO 2)
   *
   * LÓGICA DE SMART VERIFICATION:
   * 
   * Paso 1: npx eslint --fix (solo en el archivo afectado)
   * Paso 2: npx tsc --noEmit (solo si el archivo es TypeScript)
   * Paso 3: Solo si el archivo es Core Path o tiene Blast Radius > 10, disparar el build completo
   * 
   * Esto ahorra ciclos de CPU sin comprometer la integridad del código
   * 
   * @private
   * @param filePath - File path
   * @param isCorePath - Whether file is in Core Path
   * @param blastRadius - Import count (Blast Radius)
   * @returns Promise<{ passed: boolean; timeSaved: number }> - Verification result
   */
  private async performSmartVerification(
    filePath: string,
    isCorePath: boolean,
    blastRadius: number
  ): Promise<{ passed: boolean; timeSaved: number }> {
    const startTime = Date.now();
    const fullPath = path.join(this.config.projectRoot, filePath);
    const ext = path.extname(filePath).toLowerCase();

    try {
      // Paso 1: npx eslint --fix (solo en el archivo afectado)
      try {
        console.log(`INFO Running eslint --fix on ${filePath}`);
        await execAsync(`npx eslint --fix "${fullPath}"`, { cwd: this.config.projectRoot });
      } catch (error) {
        console.warn(`WARNING eslint --fix failed for ${filePath}:`, error instanceof Error ? error.message : error);
      }

      // Paso 2: npx tsc --noEmit (solo si el archivo es TypeScript)
      if (['.ts', '.tsx'].includes(ext)) {
        try {
          console.log(`INFO Running tsc --noEmit on ${filePath}`);
          await execAsync(`npx tsc --noEmit "${fullPath}"`, { cwd: this.config.projectRoot });
        } catch (error) {
          console.warn(`WARNING tsc --noEmit failed for ${filePath}:`, error instanceof Error ? error.message : error);
          return { passed: false, timeSaved: 0 };
        }
      }

      // Paso 3: Solo si el archivo es Core Path o tiene Blast Radius > 10, disparar el build completo
      if (isCorePath || blastRadius > 10) {
        console.log(`INFO File is Core Path or has high Blast Radius (${blastRadius}). Running full build...`);
        try {
          await execAsync('npm run build', { cwd: this.config.projectRoot });
        } catch (error) {
          console.warn(`WARNING Full build failed:`, error instanceof Error ? error.message : error);
          return { passed: false, timeSaved: 0 };
        }
      }

      const verificationTime = Date.now() - startTime;
      const timeSaved = isCorePath || blastRadius > 10 ? 0 : 30000 - verificationTime; // Assume full build takes 30s

      return { passed: true, timeSaved: Math.max(0, timeSaved) };
    } catch (error) {
      console.error(`ERROR Smart verification failed for ${filePath}:`, error instanceof Error ? error.message : error);
      return { passed: false, timeSaved: 0 };
    }
  }

  /**
   * Checks Disk I/O and waits if saturated
   *
   * @private
   * @returns Promise<void>
   */
  private async checkDiskIO(): Promise<void> {
    const now = Date.now();
    const timeSinceLastWrite = now - this.lastWriteTime;

    // If less than 100ms since last write, disk might be saturated
    if (timeSinceLastWrite < 100) {
      console.log('WARNING Disk I/O potentially saturated. Waiting 5 seconds...');
      await new Promise(resolve => setTimeout(resolve, 5000));
      this.diskIOWaitCount++;
    }

    this.lastWriteTime = now;
  }

  /**
   * Runs Linter-Fix Loop (PUNTO 2)
   *
   * LÓGICA DE LINTER-FIX LOOP:
   * - Ejecutar eslint --fix hasta 3 veces consecutivas
   * - Si falla 3 veces, marcar como FORMAT_ERROR y rollback
   * - Evitamos dejar código "sucio" aunque sea funcional
   * 
   * @private
   * @param filePath - File path
   * @returns Promise<{ success: boolean }> - Linter result
   */
  private async runLinterFixLoop(filePath: string): Promise<{ success: boolean }> {
    const fullPath = path.join(this.config.projectRoot, filePath);
    const maxAttempts = 3;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        console.log(`INFO Linter-Fix Loop attempt ${attempt}/${maxAttempts} for ${filePath}`);
        await execAsync(`npx eslint --fix "${fullPath}"`, { cwd: this.config.projectRoot });
        
        // Check if linter succeeded (no output or no errors)
        // If eslint --fix succeeds, it returns exit code 0
        return { success: true };
      } catch (error) {
        console.warn(`WARNING Linter-Fix Loop attempt ${attempt} failed for ${filePath}`);
        if (attempt === maxAttempts) {
          return { success: false };
        }
        // Wait before next attempt
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    return { success: false };
  }

  /**
   * Executes parallel fixes with dynamic thermal throttle (PUNTO 3)
   *
   * PUNTO 3: Concurrency Throttle Dinámico
   * 
   * LÓGICA DE THROTTLE DINÁMICO:
   * - CPU < 40%: 4 archivos en paralelo
   * - CPU 40-70%: 2 archivos en paralelo
   * - CPU > 70%: 1 archivo a la vez con pausa de 2s entre archivos
   * 
   * Esto permite que Aegis QA adapte su velocidad al estrés térmico del sistema
   * 
   * @private
   * @param batches - File fix batches
   * @returns Promise<void>
   */
  private async executeParallelFixes(batches: FileFixBatch[]): Promise<void> {
    let filesProcessed = 0;

    for (let i = 0; i < batches.length; i++) {
      // Concurrency Throttle Dinámico: Check CPU
      const resourceCheck = await this.config.thermalController.checkSystemResources();
      
      let maxParallel = 4;
      let pauseBetweenFiles = 0;
      
      if (resourceCheck.cpuUsage > 70) {
        maxParallel = 1;
        pauseBetweenFiles = 2000;
        console.log(`INFO CPU high (${resourceCheck.cpuUsage}%). Throttling to 1 file with 2s pause`);
      } else if (resourceCheck.cpuUsage >= 40) {
        maxParallel = 2;
        console.log(`INFO CPU moderate (${resourceCheck.cpuUsage}%). Throttling to 2 files`);
      } else {
        console.log(`INFO CPU low (${resourceCheck.cpuUsage}%). Using 4 files parallel`);
      }

      // Process next batch of files
      const endIndex = Math.min(i + maxParallel, batches.length);
      const chunk = batches.slice(i, endIndex);

      await Promise.all(
        chunk.map(batch => this.applyBatchFixes(batch))
      );

      filesProcessed += chunk.length;

      // Hardware Guard (I/O Flush): After batch of 20 files, force fs.sync or wait 3s
      if (filesProcessed % 20 === 0) {
        console.log(`INFO I/O Flush: Processed ${filesProcessed} files. Forcing filesystem sync...`);
        try {
          fs.openSync(path.join(this.config.projectRoot, '.sentinel'), 'r');
          fs.fdatasyncSync(1); // Force filesystem sync
        } catch {
          // If fsync fails, wait 3 seconds instead
          console.log('INFO fsync not available, waiting 3 seconds for I/O flush...');
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      }

      // Pause between files if throttled
      if (pauseBetweenFiles > 0 && i + maxParallel < batches.length) {
        console.log(`INFO Pausing ${pauseBetweenFiles}ms between files...`);
        await new Promise(resolve => setTimeout(resolve, pauseBetweenFiles));
      }

      // Skip ahead based on maxParallel
      i += maxParallel - 1;
    }
  }
}
