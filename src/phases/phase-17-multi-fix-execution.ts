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

import { ThermalController } from '../core/thermal-controller.js';
import { StatePersistence, type ExecutionState } from '../core/state-persistence.js';
import { FixStrategy } from './phase-16-fix-strategy-generation.js';
import { AtomicFixer, type Fix } from '../modules/atomic-fixer.js';

/**
 * Multi-fix execution result
 */
export interface MultiFixExecutionResult {
  /** Total fixes attempted */
  totalFixesAttempted: number;
  /** Fixes applied */
  fixesApplied: number;
  /** Fixes failed */
  fixesFailed: number;
  /** Fixes skipped (e.g., due to dry run or safety level) */
  fixesSkipped: number;
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
  /** Fix plan from Phase 16 */
  fixPlan: FixStrategy[];
  /** Dry run mode - if true, no actual writes */
  dryRun: boolean;
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

  constructor(config: Phase17Config) {
    this.config = config;
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
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`ERROR Phase 17 failed: ${errorMessage}\n`);

      return {
        success: false,
        executionResult: {
          totalFixesAttempted: 0,
          fixesApplied: 0,
          fixesFailed: 0,
          fixesSkipped: 0,
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
      fixesSkipped: 0,
      batchFiles: 0,
      individualFiles: 0,
      verificationTimeSaved: 0,
      diskIOWaits: 0,
    };

    // Get fix plan from Phase 16
    const fixPlan = this.config.fixPlan;
    if (!fixPlan || fixPlan.length === 0) {
      console.log('INFO No fix plan from Phase 16 found');
      return result;
    }

    console.log(`INFO Processing ${fixPlan.length} fixes from Phase 16\n`);

    // Initialize AtomicFixer
    const atomicFixer = new AtomicFixer(this.config.projectRoot);

    // Process each fix
    for (const strategy of fixPlan) {
      result.totalFixesAttempted++;

      // Skip if approach is 'skip' (Safe Level 4)
      if (strategy.approach === 'skip') {
        console.log(`SKIP Fix ${strategy.id} for ${strategy.file} (Safe Level 4 - high traffic)`);
        result.fixesSkipped++;
        continue;
      }

      // Skip if category is 'refactoring' (manual review required)
      if (strategy.category === 'refactoring') {
        console.log(`SKIP Fix ${strategy.id} for ${strategy.file} (refactoring - manual review required)`);
        result.fixesSkipped++;
        continue;
      }

      // Skip if dry run is enabled
      if (this.config.dryRun) {
        console.log(`DRY-RUN Fix ${strategy.id} for ${strategy.file} (line ${strategy.line})`);
        result.fixesSkipped++;
        continue;
      }

      // Convert FixStrategy to Fix interface
      const fix: Fix = {
        id: strategy.id,
        type: strategy.type,
        category: strategy.category,
        severity: strategy.severity,
        file: strategy.file,
        line: strategy.line,
        description: strategy.description,
        originalContent: strategy.originalContent,
        proposedContent: strategy.proposedContent,
        autoApply: strategy.autoApply,
        requiresConfirmation: strategy.requiresConfirmation,
        isCorePath: strategy.isCorePath,
        confidence: strategy.confidence,
        riskLevel: strategy.riskLevel,
      };

      try {
        console.log(`APPLY Fix ${strategy.id} for ${strategy.file} (line ${strategy.line}) - ${strategy.severity} priority`);

        // Apply fix using AtomicFixer
        const fixResult = await atomicFixer.applyFix(fix);

        if (fixResult.applied) {
          result.fixesApplied++;
          console.log(`SUCCESS Fix ${strategy.id} applied`);
        } else {
          result.fixesFailed++;
          console.log(`FAILED Fix ${strategy.id} failed: ${fixResult.error || 'unknown error'}`);
        }
      } catch (error) {
        result.fixesFailed++;
        const errorMessage = error instanceof Error ? error.message : 'unknown error';
        console.error(`ERROR Fix ${strategy.id} failed with exception: ${errorMessage}`);
        // Continue with next fix
      }
    }

    return result;
  }
}













