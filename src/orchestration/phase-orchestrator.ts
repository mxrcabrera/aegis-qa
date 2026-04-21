/**
 * PhaseOrchestrator - QA Phase Orchestration Engine
 *
 * Purpose: Orchestrate the 20 phases of the qa-orchestrator review process,
 * ensuring hardware protection and intelligent phase execution.
 *
 * Architecture: This orchestrator manages the complete review lifecycle from
 * setup through fixes, with thermal checks between each phase and adaptive
 * batch processing based on hardware capabilities.
 *
 * @module orchestration/phase-orchestrator
 * @since 2.0.0
 */

import { ThermalController } from '../core/thermal-controller.js';
import { DomainAnalyzer } from '../inference/domain-analyzer.js';
import { ReportAggregator } from '../core/reporter.js';
import { SecretSanitizer } from '../core/secret-sanitizer.js';
import { GitCheckpointManager } from '../core/git-checkpoint-manager.js';
import { ErrorBaseline } from '../core/error-baseline.js';
import { ThermalLock } from '../core/thermal-lock.js';
import { Phase0Setup } from '../phases/phase-0-setup.js';
import { Phase1CodeQuality } from '../phases/phase-1-code-quality.js';
import { Phase2BusinessLogic } from '../phases/phase-2-business-logic.js';
import { Phase3Security } from '../phases/phase-3-security.js';
import { Phase4Database } from '../phases/phase-4-database.js';
import { Phase5CleanCode } from '../phases/phase-5-clean-code.js';
import { Phase6APIContracts } from '../phases/phase-6-api-contracts.js';
import { Phase7TestingStrategy } from '../phases/phase-7-testing-strategy.js';
import { Phase8Performance } from '../phases/phase-8-performance.js';
import { Phase9I18nA11y } from '../phases/phase-9-i18n-a11y.js';
import { Phase10EnvCICD } from '../phases/phase-10-env-cicd.js';
import { Phase11AtomicFixes } from '../phases/phase-11-atomic-fixes.js';
import { Phase12ErrorHandling } from '../phases/phase-12-error-handling.js';
import { Phase13I18nL10n } from '../phases/phase-13a-i18n-l10n.js';
import { Phase14GitHygiene } from '../phases/phase-14b-git-hygiene.js';
import { Phase15CICDDevOps } from '../phases/phase-15a-cicd-devops.js';
import { Phase15BCloudInfra } from '../phases/phase-15c-cloud-infra.js';
import { Phase15CContainerization } from '../phases/phase-15d-containerization.js';
import { FileFilter } from '../core/file-filter.js';
import { IgnoreHandler } from '../core/ignore-handler.js';
import { StatePersistence, type ExecutionState } from '../core/state-persistence.js';
import { MemoryMonitor } from '../core/memory-monitor.js';
import * as fs from 'fs';
import type { DomainMap } from '../types/domain.js';

/**
 * Phase execution result
 */
interface PhaseResult {
  /** Phase number */
  phase: number;
  /** Phase name */
  phaseName: string;
  /** Whether phase completed successfully */
  success: boolean;
  /** Number of findings from this phase */
  findingsCount: number;
  /** Execution time in milliseconds */
  executionTimeMs: number;
  /** Error message if phase failed */
  error?: string;
}

/**
 * Full review result
 */
interface ReviewResult {
  /** Overall success status */
  success: boolean;
  /** Total execution time in milliseconds */
  totalExecutionTimeMs: number;
  /** Results for each phase */
  phaseResults: PhaseResult[];
  /** Total findings across all phases */
  totalFindings: number;
  /** Domain map from analysis */
  domainMap?: DomainMap;
}

/**
 * Fix execution result
 */
interface FixResult {
  /** Overall success status */
  success: boolean;
  /** Total findings attempted to fix */
  totalFindings: number;
  /** Successfully fixed findings */
  fixedCount: number;
  /** Findings requiring human review */
  needsHumanReview: number;
  /** Failed fixes */
  failedCount: number;
  /** Execution time in milliseconds */
  executionTimeMs: number;
}

/**
 * PhaseOrchestrator configuration
 */
interface PhaseOrchestratorConfig {
  /** Root directory of the project to analyze */
  projectRoot: string;
  /** Thermal controller for hardware protection */
  thermalController: ThermalController;
  /** Domain analyzer for business context */
  domainAnalyzer: DomainAnalyzer;
  /** Report aggregator for centralized violations */
  reportAggregator: ReportAggregator;
  /** State persistence for resume capability */
  statePersistence: StatePersistence;
  /** Current execution state */
  currentState: ExecutionState;
  /** Business profile from Phase 2 */
  businessProfile?: any;
  /** Whether to run all phases or specific phases */
  runAllPhases?: boolean;
  /** Specific phases to run (if not running all) */
  phasesToRun?: number[];
  /** Whether to apply cooldowns between phases */
  applyCooldowns?: boolean;
  /** Phase timeout in milliseconds (default: 300000 = 5 minutes) */
  phaseTimeoutMs?: number;
  /** Whether to force memory flush after heavy phases */
  enableMemoryFlush?: boolean;
  /** Whether to write partial reports after each phase */
  enablePartialReports?: boolean;
  /** Whether to run in dry-run mode (no fixes applied) */
  dryRunMode?: boolean;
  /** Whether to skip confirmation prompts (for CI/CD) */
  yesMode?: boolean;
  /** Whether to enable verbose logging for debugging */
  verboseMode?: boolean;
  /** Whether to run in safe-only mode (report only, no modifications) */
  safeOnly?: boolean;
  /** Whether to show batch diff preview before applying fixes */
  previewDiffs?: boolean;
  /** Whether to enable audit-only mode for compliance */
  auditOnly?: boolean;
  /** Whether to enable per-fix interactive approval */
  interactiveFix?: boolean;
}

/**
 * PhaseOrchestrator - QA Phase Orchestration
 *
 * This class orchestrates the 20 phases of the qa-orchestrator review process,
 * ensuring hardware protection and intelligent phase execution.
 *
 * @class PhaseOrchestrator
 * @example
 * ```typescript
 * const orchestrator = new PhaseOrchestrator({
 *   projectRoot: '/path/to/project',
 *   thermalController: new ThermalController(),
 *   domainAnalyzer: new DomainAnalyzer({...}, secretManager),
 *   reportAggregator: new ReportAggregator(),
 * });
 *
 * const result = await orchestrator.runFullReview();
 * console.log(`Total findings: ${result.totalFindings}`);
 * ```
 */
export class PhaseOrchestrator {
  private config: PhaseOrchestratorConfig;
  private gitCheckpointManager: GitCheckpointManager;
  private errorBaseline: ErrorBaseline;
  private thermalLock: ThermalLock;
  private memoryMonitor: MemoryMonitor;
  private gcAvailable: boolean;
  private memoryThreshold: number = 1.5 * 1024 * 1024 * 1024; // 1.5GB
  private dryRunMode: boolean;
  private yesMode: boolean;
  // @ts-expect-error TODO: integrate verbose mode
  private _verboseMode: boolean;
  private activeTimeouts: Set<NodeJS.Timeout> = new Set();
  // @ts-expect-error TODO: integrate active process tracking
  private _activeProcesses: Set<number> = new Set();

  constructor(config: PhaseOrchestratorConfig) {
    this.config = config;
    this.dryRunMode = config.dryRunMode ?? true; // Default to dry-run
    this.yesMode = config.yesMode ?? false; // Default to require confirmation
    this._verboseMode = config.verboseMode ?? false; // Default to non-verbose
    this.gitCheckpointManager = new GitCheckpointManager(config.projectRoot);
    this.errorBaseline = new ErrorBaseline(config.projectRoot);
    this.thermalLock = new ThermalLock();
    this.memoryMonitor = new MemoryMonitor({ maxMemoryBytes: this.memoryThreshold });
    this.gcAvailable = typeof (global as any).gc === 'function';

    // Install global log middleware for GDPR/CCPA/SOC2 compliance
    SecretSanitizer.installGlobalMiddleware();

    if (this.gcAvailable) {
      console.log('[PhaseOrchestrator] Manual GC available (--expose-gc detected)');
    } else {
      console.log('[PhaseOrchestrator] Manual GC not available (run with --expose-gc to enable)');
    }

    // Enforce dry-run at construction time
    this.enforceDryRun();
  }

  /**
   * Enforces dry-run mode to prevent bypass
   *
   * @private
   * @throws {Error} If dry-run is being bypassed
   */
  private enforceDryRun(): void {
    if (this.dryRunMode) {
      console.log('[Security] Dry-run mode enabled. No changes will be applied.');
      console.log('[Security] Use --apply flag to disable dry-run mode and apply changes.');
    }
  }

  /**
   * Validates that dry-run is respected before any file operation
   *
   * @private
   * @param operation - Description of the operation
   * @throws {Error} If attempting to modify files in dry-run mode
   */
  private validateDryRunForOperation(operation: string): void {
    if (this.dryRunMode) {
      const errorMsg = `[Security] Attempted to perform write operation in dry-run mode: ${operation}`;
      console.error(errorMsg);
      console.error('[Security] Write operations are not allowed in dry-run mode.');
      console.error('[Security] This is a safety measure to prevent unintended modifications.');
      throw new Error(errorMsg);
    }
  }

  /**
   * Triggers garbage collection if available and checks memory usage
   *
   * @private
   * @param phaseName - Name of the phase that just completed
   * @returns Promise<void>
   */
  private async triggerGarbageCollection(phaseName: string): Promise<void> {
    // Check memory using MemoryMonitor
    this.memoryMonitor.checkMemory();
    this.memoryMonitor.logMemoryUsage(phaseName);

    if (!this.gcAvailable) {
      return;
    }

    try {
      // Get memory before GC
      const beforeGC = process.memoryUsage();

      // Trigger GC
      (global as any).gc();

      // Get memory after GC
      const afterGC = process.memoryUsage();
      const heapUsed = afterGC.heapUsed;
      const heapUsedMB = heapUsed / (1024 * 1024);

      console.log(`[PhaseOrchestrator] GC triggered after ${phaseName}`);
      console.log(`   Heap before: ${(beforeGC.heapUsed / 1024 / 1024).toFixed(2)} MB`);
      console.log(`   Heap after:  ${heapUsedMB.toFixed(2)} MB`);
      console.log(`   Freed:      ${((beforeGC.heapUsed - afterGC.heapUsed) / 1024 / 1024).toFixed(2)} MB`);

      // Check if memory is still above threshold
      if (heapUsed > this.memoryThreshold) {
        const thresholdMB = this.memoryThreshold / (1024 * 1024);
        console.warn(`⚠️ Memory Guard: Heap usage ${heapUsedMB.toFixed(2)} MB exceeds threshold ${thresholdMB} MB`);
        console.warn(`⚠️ Pausing for 5 seconds to let OS breathe...`);

        // Pause for 5 seconds
        await new Promise(resolve => setTimeout(resolve, 5000));

        // Check memory again after pause
        const afterPause = process.memoryUsage();
        const afterPauseMB = afterPause.heapUsed / (1024 * 1024);
        console.log(`   Heap after pause: ${afterPauseMB.toFixed(2)} MB`);

        if (afterPause.heapUsed > this.memoryThreshold) {
          console.warn(`⚠️ Memory still above threshold after pause. Monitor closely.`);
        } else {
          console.log(`✅ Memory reduced below threshold after pause.`);
        }
      }
    } catch (error) {
      console.warn('[PhaseOrchestrator] Failed to trigger GC:', error instanceof Error ? error.message : String(error));
    }
  }

  /**
   * Checks thermal status and acquires lock if critical
   *
   * @private
   * @returns Promise<void>
   */
  private async checkThermalLock(): Promise<void> {
    try {
      const tempReading = await this.config.thermalController.checkTemperature();
      const resourceReading = await this.config.thermalController.checkSystemResources();
      
      const isCritical = !tempReading.isSafe || !resourceReading.isSafe;
      
      if (isCritical) {
        console.log('🔥 Thermal status is CRITICAL - Acquiring thermal lock...');
        console.log(`   Temperature: ${tempReading.current}°C (${tempReading.category})`);
        console.log(`   CPU: ${resourceReading.cpuUsage}%, RAM: ${resourceReading.ramUsage}%`);
        
        await this.thermalLock.acquire();
        console.log('🔒 Thermal lock acquired - Pausing operations until thermal conditions improve');
        
        // Wait for thermal conditions to improve
        let attempts = 0;
        const maxAttempts = 60; // 5 minutes max wait (60 * 5 seconds)
        
        while (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
          
          const currentTemp = await this.config.thermalController.checkTemperature();
          const currentResources = await this.config.thermalController.checkSystemResources();
          const nowSafe = currentTemp.isSafe && currentResources.isSafe;
          
          if (nowSafe) {
            console.log(`✅ Thermal conditions improved - Releasing lock`);
            console.log(`   Temperature: ${currentTemp.current}°C (${currentTemp.category})`);
            console.log(`   CPU: ${currentResources.cpuUsage}%, RAM: ${currentResources.ramUsage}%`);
            this.thermalLock.release();
            return;
          }
          
          attempts++;
          if (attempts % 12 === 0) { // Log every minute
            console.log(`⏳ Still waiting for thermal conditions to improve... (${attempts / 12} minute(s))`);
          }
        }
        
        // If still critical after max attempts, force release and warn
        console.warn('⚠️ Thermal conditions did not improve after 5 minutes - Forcing lock release');
        console.warn('⚠️ Continuing operations at risk - Monitor hardware closely');
        this.thermalLock.forceRelease();
      }
    } catch (error) {
      console.warn('[PhaseOrchestrator] Failed to check thermal status, proceeding without lock');
      console.warn('Error:', error instanceof Error ? error.message : String(error));
    }
  }

  /**
   * Runs the full review (phases 0-15)
   *
   * @returns Promise<ReviewResult> - Complete review results
   */
  async runFullReview(): Promise<ReviewResult> {
    console.log('­ƒøí´©Å  Aegis QA - Full Review Mode');
    console.log(`­ƒôé Project Root: ${this.config.projectRoot}\n`);

    const startTime = Date.now();
    const phaseResults: PhaseResult[] = [];
    let totalFindings = 0;
    let domainMap: DomainMap | undefined;

    // Check initial memory usage
    this.memoryMonitor.logMemoryUsage('Initial');

    // Phase 0: Setup - Hotel Check-in
    console.log('­ƒÅ¿ Phase 0: Setup - Hotel Check-in');
    const phase0StartTime = Date.now();
    
    try {
      const fileFilter = new FileFilter();
      const ignoreHandler = new IgnoreHandler({ projectRoot: this.config.projectRoot });
      
      const phase0Setup = new Phase0Setup({
        projectRoot: this.config.projectRoot,
        thermalController: this.config.thermalController,
        statePersistence: this.config.statePersistence,
        currentState: this.config.currentState,
        fileFilter,
        ignoreHandler,
      });

      const timeoutMs = this.config.phaseTimeoutMs || 300000; // 5 min default
      const phase0Result = await this.runWithTimeout(
        () => phase0Setup.execute(),
        timeoutMs,
        'Phase 0: Setup'
      );

      if (!phase0Result.success) {
        console.error(`ÔØî Phase 0 failed: ${phase0Result.error}`);
        console.error('Setup failed - project cannot proceed. Fix the issues above and try again.');
        
        if (this.config.enablePartialReports) {
          await this.writePartialReport(
            0,
            'Setup',
            0,
            Date.now() - phase0StartTime,
            phase0Result.error
          );
        }
        
        return {
          success: false,
          totalExecutionTimeMs: Date.now() - startTime,
          phaseResults: [{
            phase: 0,
            phaseName: 'Setup',
            success: false,
            findingsCount: 0,
            executionTimeMs: Date.now() - phase0StartTime,
            error: phase0Result.error,
          }],
          totalFindings: 0,
        };
      }

      console.log('Ô£à Phase 0: Setup passed\n');
      
      if (this.config.enablePartialReports) {
        await this.writePartialReport(
          0,
          'Setup',
          0,
          phase0Result.executionTimeMs
        );
      }
      
      // Atomic state sync after Phase 0
      await this.config.statePersistence.saveState(this.config.currentState);
      
      phaseResults.push({
        phase: 0,
        phaseName: 'Setup',
        success: true,
        findingsCount: 0,
        executionTimeMs: phase0Result.executionTimeMs,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`ÔØî Phase 0 failed with exception: ${errorMessage}`);
      
      if (this.config.enablePartialReports) {
        await this.writePartialReport(
          0,
          'Setup',
          0,
          Date.now() - phase0StartTime,
          errorMessage
        );
      }
      
      return {
        success: false,
        totalExecutionTimeMs: Date.now() - startTime,
        phaseResults: [{
          phase: 0,
          phaseName: 'Setup',
          success: false,
          findingsCount: 0,
          executionTimeMs: Date.now() - phase0StartTime,
          error: errorMessage,
        }],
        totalFindings: 0,
      };
    }

    // Phase 1: Code Quality
    console.log('­ƒöì Phase 1: Code Quality - Technical Health Assessment');
    const phase1StartTime = Date.now();
    
    try {
      const fileFilter = new FileFilter();
      const ignoreHandler = new IgnoreHandler({ projectRoot: this.config.projectRoot });
      
      const phase1CodeQuality = new Phase1CodeQuality({
        projectRoot: this.config.projectRoot,
        thermalController: this.config.thermalController,
        statePersistence: this.config.statePersistence,
        fileFilter,
        ignoreHandler,
        currentState: this.config.currentState,
      });

      const timeoutMs = this.config.phaseTimeoutMs || 300000; // 5 min default
      const phase1Result = await this.runWithTimeout(
        () => phase1CodeQuality.execute(),
        timeoutMs,
        'Phase 1: Code Quality'
      );

      if (!phase1Result.success) {
        console.error(`ÔØî Phase 1 failed: ${phase1Result.error}`);
        console.error(`ÔÜá´©Å  Continuing to next phase (system resilience)`);
        
        if (this.config.enablePartialReports) {
          await this.writePartialReport(
            1,
            'Code Quality',
            0,
            Date.now() - phase1StartTime,
            phase1Result.error
          );
        }
        
        phaseResults.push({
          phase: 1,
          phaseName: 'Code Quality',
          success: false,
          findingsCount: 0,
          executionTimeMs: Date.now() - phase1StartTime,
          error: phase1Result.error,
        });
      } else {
        console.log(`Ô£à Phase 1: Code Quality passed`);
        console.log(`  ­ƒôè Files analyzed: ${phase1Result.totalFiles}`);
        console.log(`  ­ƒöì Total findings: ${phase1Result.totalFindings}`);
        console.log(`  ÔÜá´©Å  Critical files: ${phase1Result.criticalFiles.length}`);
        console.log(`  ­ƒôê Average quality score: ${phase1Result.averageScore.toFixed(1)}/100\n`);
        
        if (this.config.enablePartialReports) {
          await this.writePartialReport(
            1,
            'Code Quality',
            phase1Result.totalFindings,
            phase1Result.executionTimeMs
          );
        }
        
        if (this.config.enableMemoryFlush && this.isHeavyPhase(1)) {
          await this.flushMemory();
        }
        
        await this.config.statePersistence.saveState(this.config.currentState);
        
        phaseResults.push({
          phase: 1,
          phaseName: 'Code Quality',
          success: true,
          findingsCount: phase1Result.totalFindings,
          executionTimeMs: phase1Result.executionTimeMs,
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`ÔØî Phase 1 failed with exception: ${errorMessage}`);
      console.error(`ÔÜá´©Å  Continuing to next phase (system resilience)`);
      
      if (this.config.enablePartialReports) {
        await this.writePartialReport(
          1,
          'Code Quality',
          0,
          Date.now() - phase1StartTime,
          errorMessage
        );
      }
      
      phaseResults.push({
        phase: 1,
        phaseName: 'Code Quality',
        success: false,
        findingsCount: 0,
        executionTimeMs: Date.now() - phase1StartTime,
        error: errorMessage,
      });
    }

    // Phase 2: Business Logic (MOST IMPORTANT)
    console.log('­ƒÄ» Phase 2: Business Logic - Business Semantics & Core Path Detection');
    const phase2StartTime = Date.now();
    
    try {
      const phase2BusinessLogic = new Phase2BusinessLogic({
        projectRoot: this.config.projectRoot,
        statePersistence: this.config.statePersistence,
        currentState: this.config.currentState,
      });

      const timeoutMs = this.config.phaseTimeoutMs || 300000; // 5 min default
      const phase2Result = await this.runWithTimeout(
        () => phase2BusinessLogic.execute(),
        timeoutMs,
        'Phase 2: Business Logic'
      );

      if (!phase2Result.success) {
        console.error(`ÔØî Phase 2 failed: ${phase2Result.error}`);
        console.error(`ÔÜá´©Å  Continuing to next phase (system resilience)`);
        
        if (this.config.enablePartialReports) {
          await this.writePartialReport(
            2,
            'Business Logic',
            0,
            Date.now() - phase2StartTime,
            phase2Result.error
          );
        }
        
        phaseResults.push({
          phase: 2,
          phaseName: 'Business Logic',
          success: false,
          findingsCount: 0,
          executionTimeMs: Date.now() - phase2StartTime,
          error: phase2Result.error,
        });
      } else {
        console.log(`Ô£à Phase 2: Business Logic passed`);
        console.log(`  ­ƒÄ» Domain: ${phase2Result.businessProfile.domain}`);
        console.log(`  ­ƒôè Confidence: ${phase2Result.businessProfile.confidence}%`);
        console.log(`  ­ƒöÆ Critical modules: ${phase2Result.businessProfile.criticalModules.length}`);
        console.log(`  ÔÜá´©Å  Risk findings: ${phase2Result.businessProfile.riskFindings.length}\n`);
        
        if (this.config.enablePartialReports) {
          await this.writePartialReport(
            2,
            'Business Logic',
            phase2Result.businessProfile.riskFindings.length,
            phase2Result.executionTimeMs
          );
        }
        
        if (this.config.enableMemoryFlush && this.isHeavyPhase(2)) {
          await this.flushMemory();
        }
        
        // Update ReportAggregator with business risk findings for risk-driven reporting
        this.config.reportAggregator.setBusinessRiskFindings(phase2Result.businessProfile.riskFindings);
        
        // Atomic state sync after Phase 2
        await this.config.statePersistence.saveState(this.config.currentState);
        
        // Memory Guard: Trigger GC after heavy phase
        await this.triggerGarbageCollection('Phase 2: Business Logic');
        
        phaseResults.push({
          phase: 2,
          phaseName: 'Business Logic',
          success: true,
          findingsCount: phase2Result.businessProfile.riskFindings.length,
          executionTimeMs: phase2Result.executionTimeMs,
        });

        // Run DomainAnalyzer if Phase 2 succeeded
        const analysisResult = await this.config.domainAnalyzer.analyze();
        domainMap = analysisResult.domainMap;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`ÔØî Phase 2 failed with exception: ${errorMessage}`);
      console.error(`ÔÜá´©Å  Continuing to next phase (system resilience)`);
      
      if (this.config.enablePartialReports) {
        await this.writePartialReport(
          2,
          'Business Logic',
          0,
          Date.now() - phase2StartTime,
          errorMessage
        );
      }
      
      phaseResults.push({
        phase: 2,
        phaseName: 'Business Logic',
        success: false,
        findingsCount: 0,
        executionTimeMs: Date.now() - phase2StartTime,
        error: errorMessage,
      });
    }

    // Phase 3: Security
    console.log('­ƒöÆ Phase 3: Security - Vulnerability & Secret Detection');
    const phase3StartTime = Date.now();
    
    try {
      const phase3Security = new Phase3Security({
        projectRoot: this.config.projectRoot,
        statePersistence: this.config.statePersistence,
        currentState: this.config.currentState,
      });

      const timeoutMs = this.config.phaseTimeoutMs || 300000; // 5 min default
      const phase3Result = await this.runWithTimeout(
        () => phase3Security.execute(),
        timeoutMs,
        'Phase 3: Security'
      );

      if (!phase3Result.success) {
        console.error(`ÔØî Phase 3 failed: ${phase3Result.error}`);
        console.error(`ÔÜá´©Å  Continuing to next phase (system resilience)`);
        
        if (this.config.enablePartialReports) {
          await this.writePartialReport(
            3,
            'Security',
            0,
            Date.now() - phase3StartTime,
            phase3Result.error
          );
        }
        
        phaseResults.push({
          phase: 3,
          phaseName: 'Security',
          success: false,
          findingsCount: 0,
          executionTimeMs: Date.now() - phase3StartTime,
          error: phase3Result.error,
        });
      } else {
        console.log(`Ô£à Phase 3: Security passed`);
        console.log(`  ­ƒöì Total findings: ${phase3Result.findings.length}`);
        console.log(`  ­ƒÜ¿ Critical findings: ${phase3Result.criticalFindings}`);
        console.log(`  ÔÜá´©Å  High severity findings: ${phase3Result.highSeverityFindings}\n`);
        
        if (this.config.enablePartialReports) {
          await this.writePartialReport(
            3,
            'Security',
            phase3Result.findings.length,
            phase3Result.executionTimeMs
          );
        }
        
        if (this.config.enableMemoryFlush && this.isHeavyPhase(3)) {
          await this.flushMemory();
        }
        
        // Check for highRiskBlocker flag
        if (this.config.currentState.highRiskBlocker) {
          console.error(`­ƒÜ¿­ƒÜ¿­ƒÜ¿ HIGH RISK BLOCKER ACTIVE ­ƒÜ¿­ƒÜ¿­ƒÜ¿`);
          console.error(`CRITICAL security findings detected. Commits should be blocked until resolved.`);
          console.error(`This is a security risk that must be addressed before deployment.\n`);
        }
        
        // Atomic state sync after Phase 3
        await this.config.statePersistence.saveState(this.config.currentState);
        
        phaseResults.push({
          phase: 3,
          phaseName: 'Security',
          success: true,
          findingsCount: phase3Result.findings.length,
          executionTimeMs: phase3Result.executionTimeMs,
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`ÔØî Phase 3 failed with exception: ${errorMessage}`);
      console.error(`ÔÜá´©Å  Continuing to next phase (system resilience)`);
      
      if (this.config.enablePartialReports) {
        await this.writePartialReport(
          3,
          'Security',
          0,
          Date.now() - phase3StartTime,
          errorMessage
        );
      }
      
      phaseResults.push({
        phase: 3,
        phaseName: 'Security',
        success: false,
        findingsCount: 0,
        executionTimeMs: Date.now() - phase3StartTime,
        error: errorMessage,
      });
    }

    // Phase 4: Database
    console.log('­ƒùä´©Å  Phase 4: Database - Schema & Query Audit');
    const phase4StartTime = Date.now();
    
    try {
      const phase4Database = new Phase4Database({
        projectRoot: this.config.projectRoot,
        statePersistence: this.config.statePersistence,
        currentState: this.config.currentState,
        thermalController: this.config.thermalController,
      });

      const timeoutMs = this.config.phaseTimeoutMs || 300000; // 5 min default
      const phase4Result = await this.runWithTimeout(
        () => phase4Database.execute(),
        timeoutMs,
        'Phase 4: Database'
      );

      if (!phase4Result.success) {
        console.error(`ÔØî Phase 4 failed: ${phase4Result.error}`);
        console.error(`ÔÜá´©Å  Continuing to next phase (system resilience)`);
        
        if (this.config.enablePartialReports) {
          await this.writePartialReport(
            4,
            'Database',
            0,
            Date.now() - phase4StartTime,
            phase4Result.error
          );
        }
        
        phaseResults.push({
          phase: 4,
          phaseName: 'Database',
          success: false,
          findingsCount: 0,
          executionTimeMs: Date.now() - phase4StartTime,
          error: phase4Result.error,
        });
      } else {
        console.log(`Ô£à Phase 4: Database passed`);
        console.log(`  ­ƒöì Total findings: ${phase4Result.findings.length}`);
        console.log(`  ­ƒÜ¿ Critical findings: ${phase4Result.criticalFindings}`);
        console.log(`  ÔÜá´©Å  High severity findings: ${phase4Result.highSeverityFindings}`);
        console.log(`  ­ƒôª Detected ORM: ${phase4Result.ormType}\n`);
        
        if (this.config.enablePartialReports) {
          await this.writePartialReport(
            4,
            'Database',
            phase4Result.findings.length,
            phase4Result.executionTimeMs
          );
        }
        
        if (this.config.enableMemoryFlush && this.isHeavyPhase(4)) {
          await this.flushMemory();
        }
        
        // Atomic state sync after Phase 4
        await this.config.statePersistence.saveState(this.config.currentState);
        
        phaseResults.push({
          phase: 4,
          phaseName: 'Database',
          success: true,
          findingsCount: phase4Result.findings.length,
          executionTimeMs: phase4Result.executionTimeMs,
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`ÔØî Phase 4 failed with exception: ${errorMessage}`);
      console.error(`ÔÜá´©Å  Continuing to next phase (system resilience)`);
      
      if (this.config.enablePartialReports) {
        await this.writePartialReport(
          4,
          'Database',
          0,
          Date.now() - phase4StartTime,
          errorMessage
        );
      }
      
      phaseResults.push({
        phase: 4,
        phaseName: 'Database',
        success: false,
        findingsCount: 0,
        executionTimeMs: Date.now() - phase4StartTime,
        error: errorMessage,
      });
    }

    // Phase 5: Clean Code
    console.log('Ô£¿ Phase 5: Clean Code & Refactoring');
    const phase5StartTime = Date.now();
    
    try {
      const phase5CleanCode = new Phase5CleanCode({
        projectRoot: this.config.projectRoot,
        statePersistence: this.config.statePersistence,
        currentState: this.config.currentState,
        thermalController: this.config.thermalController,
      });

      const timeoutMs = this.config.phaseTimeoutMs || 300000; // 5 min default
      const phase5Result = await this.runWithTimeout(
        () => phase5CleanCode.execute(),
        timeoutMs,
        'Phase 5: Clean Code'
      );

      if (!phase5Result.success) {
        console.error(`ÔØî Phase 5 failed: ${phase5Result.error}`);
        console.error(`ÔÜá´©Å  Continuing to next phase (system resilience)`);
        
        if (this.config.enablePartialReports) {
          await this.writePartialReport(
            5,
            'Clean Code',
            0,
            Date.now() - phase5StartTime,
            phase5Result.error
          );
        }
        
        phaseResults.push({
          phase: 5,
          phaseName: 'Clean Code',
          success: false,
          findingsCount: 0,
          executionTimeMs: Date.now() - phase5StartTime,
          error: phase5Result.error,
        });
      } else {
        console.log(`Ô£à Phase 5: Clean Code passed`);
        console.log(`  ­ƒöì Total findings: ${phase5Result.findings.length}`);
        console.log(`  ­ƒÜ¿ High severity findings: ${phase5Result.highSeverityFindings}`);
        console.log(`  ÔÜá´©Å  Medium severity findings: ${phase5Result.mediumSeverityFindings}`);
        console.log(`  ­ƒôè Files analyzed: ${phase5Result.filesAnalyzed}\n`);
        
        if (this.config.enablePartialReports) {
          await this.writePartialReport(
            5,
            'Clean Code',
            phase5Result.findings.length,
            phase5Result.executionTimeMs
          );
        }
        
        if (this.config.enableMemoryFlush && this.isHeavyPhase(5)) {
          await this.flushMemory();
        }
        
        await this.config.statePersistence.saveState(this.config.currentState);
        
        phaseResults.push({
          phase: 5,
          phaseName: 'Clean Code',
          success: true,
          findingsCount: phase5Result.findings.length,
          executionTimeMs: phase5Result.executionTimeMs,
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`ÔØî Phase 5 failed with exception: ${errorMessage}`);
      console.error(`ÔÜá´©Å  Continuing to next phase (system resilience)`);
      
      if (this.config.enablePartialReports) {
        await this.writePartialReport(
          5,
          'Clean Code',
          0,
          Date.now() - phase5StartTime,
          errorMessage
        );
      }
      
      phaseResults.push({
        phase: 5,
        phaseName: 'Clean Code',
        success: false,
        findingsCount: 0,
        executionTimeMs: Date.now() - phase5StartTime,
        error: errorMessage,
      });
    }

    // Phase 6: API & Contracts
    console.log('­ƒîÉ Phase 6: API & Contracts');
    const phase6StartTime = Date.now();
    
    try {
      const phase6APIContracts = new Phase6APIContracts({
        projectRoot: this.config.projectRoot,
        statePersistence: this.config.statePersistence,
        currentState: this.config.currentState,
      });

      const timeoutMs = this.config.phaseTimeoutMs || 300000; // 5 min default
      const phase6Result = await this.runWithTimeout(
        () => phase6APIContracts.execute(),
        timeoutMs,
        'Phase 6: API & Contracts'
      );

      if (!phase6Result.success) {
        console.error(`ÔØî Phase 6 failed: ${phase6Result.error}`);
        console.error(`ÔÜá´©Å  Continuing to next phase (system resilience)`);
        
        if (this.config.enablePartialReports) {
          await this.writePartialReport(
            6,
            'API & Contracts',
            0,
            Date.now() - phase6StartTime,
            phase6Result.error
          );
        }
        
        phaseResults.push({
          phase: 6,
          phaseName: 'API & Contracts',
          success: false,
          findingsCount: 0,
          executionTimeMs: Date.now() - phase6StartTime,
          error: phase6Result.error,
        });
      } else {
        console.log(`Ô£à Phase 6: API & Contracts passed`);
        console.log(`  ­ƒöì Total findings: ${phase6Result.findings.length}`);
        console.log(`  ­ƒÜ¿ Critical findings: ${phase6Result.criticalFindings}`);
        console.log(`  ÔÜá´©Å  High severity findings: ${phase6Result.highSeverityFindings}`);
        console.log(`  ­ƒôè Files analyzed: ${phase6Result.filesAnalyzed}\n`);
        
        if (this.config.enablePartialReports) {
          await this.writePartialReport(
            6,
            'API & Contracts',
            phase6Result.findings.length,
            phase6Result.executionTimeMs
          );
        }
        
        if (this.config.enableMemoryFlush && this.isHeavyPhase(6)) {
          await this.flushMemory();
        }
        
        await this.config.statePersistence.saveState(this.config.currentState);
        
        phaseResults.push({
          phase: 6,
          phaseName: 'API & Contracts',
          success: true,
          findingsCount: phase6Result.findings.length,
          executionTimeMs: phase6Result.executionTimeMs,
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`ÔØî Phase 6 failed with exception: ${errorMessage}`);
      console.error(`ÔÜá´©Å  Continuing to next phase (system resilience)`);
      
      if (this.config.enablePartialReports) {
        await this.writePartialReport(
          6,
          'API & Contracts',
          0,
          Date.now() - phase6StartTime,
          errorMessage
        );
      }
      
      phaseResults.push({
        phase: 6,
        phaseName: 'API & Contracts',
        success: false,
        findingsCount: 0,
        executionTimeMs: Date.now() - phase6StartTime,
        error: errorMessage,
      });
    }

    // Phase 7: Testing Strategy
    console.log('­ƒº¬ Phase 7: Testing Strategy');
    const phase7StartTime = Date.now();
    
    try {
      const phase7TestingStrategy = new Phase7TestingStrategy({
        projectRoot: this.config.projectRoot,
        statePersistence: this.config.statePersistence,
        currentState: this.config.currentState,
      });

      const timeoutMs = this.config.phaseTimeoutMs || 300000; // 5 min default
      const phase7Result = await this.runWithTimeout(
        () => phase7TestingStrategy.execute(),
        timeoutMs,
        'Phase 7: Testing Strategy'
      );

      if (!phase7Result.success) {
        console.error(`ÔØî Phase 7 failed: ${phase7Result.error}`);
        console.error(`ÔÜá´©Å  Continuing to next phase (system resilience)`);
        
        if (this.config.enablePartialReports) {
          await this.writePartialReport(
            7,
            'Testing Strategy',
            0,
            Date.now() - phase7StartTime,
            phase7Result.error
          );
        }
        
        phaseResults.push({
          phase: 7,
          phaseName: 'Testing Strategy',
          success: false,
          findingsCount: 0,
          executionTimeMs: Date.now() - phase7StartTime,
          error: phase7Result.error,
        });
      } else {
        console.log(`Ô£à Phase 7: Testing Strategy passed`);
        console.log(`  ­ƒöì Total findings: ${phase7Result.findings.length}`);
        console.log(`  ­ƒÜ¿ Critical findings: ${phase7Result.criticalFindings}`);
        console.log(`  ÔÜá´©Å  High severity findings: ${phase7Result.highSeverityFindings}`);
        console.log(`  ­ƒôè Source files: ${phase7Result.filesAnalyzed}, Test files: ${phase7Result.testFilesFound}\n`);
        
        if (this.config.enablePartialReports) {
          await this.writePartialReport(
            7,
            'Testing Strategy',
            phase7Result.findings.length,
            phase7Result.executionTimeMs
          );
        }
        
        if (this.config.enableMemoryFlush && this.isHeavyPhase(7)) {
          await this.flushMemory();
        }
        
        await this.config.statePersistence.saveState(this.config.currentState);
        
        phaseResults.push({
          phase: 7,
          phaseName: 'Testing Strategy',
          success: true,
          findingsCount: phase7Result.findings.length,
          executionTimeMs: phase7Result.executionTimeMs,
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`ÔØî Phase 7 failed with exception: ${errorMessage}`);
      console.error(`ÔÜá´©Å  Continuing to next phase (system resilience)`);
      
      if (this.config.enablePartialReports) {
        await this.writePartialReport(
          7,
          'Testing Strategy',
          0,
          Date.now() - phase7StartTime,
          errorMessage
        );
      }
      
      phaseResults.push({
        phase: 7,
        phaseName: 'Testing Strategy',
        success: false,
        findingsCount: 0,
        executionTimeMs: Date.now() - phase7StartTime,
        error: errorMessage,
      });
    }

    // Phase 8: Performance & Scalability
    console.log('ÔÜí Phase 8: Performance & Scalability');
    const phase8StartTime = Date.now();
    
    try {
      const phase8Performance = new Phase8Performance({
        projectRoot: this.config.projectRoot,
        statePersistence: this.config.statePersistence,
        currentState: this.config.currentState,
      });

      const timeoutMs = this.config.phaseTimeoutMs || 300000; // 5 min default
      const phase8Result = await this.runWithTimeout(
        () => phase8Performance.execute(),
        timeoutMs,
        'Phase 8: Performance & Scalability'
      );

      if (!phase8Result.success) {
        console.error(`ÔØî Phase 8 failed: ${phase8Result.error}`);
        console.error(`ÔÜá´©Å  Continuing to next phase (system resilience)`);
        
        if (this.config.enablePartialReports) {
          await this.writePartialReport(
            8,
            'Performance & Scalability',
            0,
            Date.now() - phase8StartTime,
            phase8Result.error
          );
        }
        
        phaseResults.push({
          phase: 8,
          phaseName: 'Performance & Scalability',
          success: false,
          findingsCount: 0,
          executionTimeMs: Date.now() - phase8StartTime,
          error: phase8Result.error,
        });
      } else {
        console.log(`Ô£à Phase 8: Performance & Scalability passed`);
        console.log(`  ­ƒöì Total findings: ${phase8Result.findings.length}`);
        console.log(`  ­ƒÜ¿ Critical findings: ${phase8Result.criticalFindings}`);
        console.log(`  ÔÜá´©Å  High severity findings: ${phase8Result.highSeverityFindings}\n`);
        
        if (this.config.enablePartialReports) {
          await this.writePartialReport(
            8,
            'Performance & Scalability',
            phase8Result.findings.length,
            phase8Result.executionTimeMs
          );
        }
        
        if (this.config.enableMemoryFlush && this.isHeavyPhase(8)) {
          await this.flushMemory();
        }
        
        await this.config.statePersistence.saveState(this.config.currentState);
        
        phaseResults.push({
          phase: 8,
          phaseName: 'Performance & Scalability',
          success: true,
          findingsCount: phase8Result.findings.length,
          executionTimeMs: phase8Result.executionTimeMs,
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`ÔØî Phase 8 failed with exception: ${errorMessage}`);
      console.error(`ÔÜá´©Å  Continuing to next phase (system resilience)`);
      
      if (this.config.enablePartialReports) {
        await this.writePartialReport(
          8,
          'Performance & Scalability',
          0,
          Date.now() - phase8StartTime,
          errorMessage
        );
      }
      
      phaseResults.push({
        phase: 8,
        phaseName: 'Performance & Scalability',
        success: false,
        findingsCount: 0,
        executionTimeMs: Date.now() - phase8StartTime,
        error: errorMessage,
      });
    }

    // Phase 9: Internationalization & Accessibility (i18n & a11y)
    console.log('­ƒîì Phase 9: Internationalization & Accessibility (i18n & a11y)');
    const phase9StartTime = Date.now();
    
    try {
      const phase9I18nA11y = new Phase9I18nA11y({
        projectRoot: this.config.projectRoot,
        statePersistence: this.config.statePersistence,
        currentState: this.config.currentState,
      });

      const timeoutMs = this.config.phaseTimeoutMs || 300000; // 5 min default
      const phase9Result = await this.runWithTimeout(
        () => phase9I18nA11y.execute(),
        timeoutMs,
        'Phase 9: Internationalization & Accessibility'
      );

      if (!phase9Result.success) {
        console.error(`ÔØî Phase 9 failed: ${phase9Result.error}`);
        console.error(`ÔÜá´©Å  Continuing to next phase (system resilience)`);
        
        if (this.config.enablePartialReports) {
          await this.writePartialReport(
            9,
            'Internationalization & Accessibility',
            0,
            Date.now() - phase9StartTime,
            phase9Result.error
          );
        }
        
        phaseResults.push({
          phase: 9,
          phaseName: 'Internationalization & Accessibility',
          success: false,
          findingsCount: 0,
          executionTimeMs: Date.now() - phase9StartTime,
          error: phase9Result.error,
        });
      } else {
        console.log(`Ô£à Phase 9: Internationalization & Accessibility passed`);
        console.log(`  ­ƒöì Total findings: ${phase9Result.findings.length}`);
        console.log(`  ­ƒÜ¿ Critical findings: ${phase9Result.criticalFindings}`);
        console.log(`  ÔÜá´©Å  High severity findings: ${phase9Result.highSeverityFindings}\n`);
        
        if (this.config.enablePartialReports) {
          await this.writePartialReport(
            9,
            'Internationalization & Accessibility',
            phase9Result.findings.length,
            phase9Result.executionTimeMs
          );
        }
        
        if (this.config.enableMemoryFlush && this.isHeavyPhase(9)) {
          await this.flushMemory();
        }
        
        await this.config.statePersistence.saveState(this.config.currentState);
        
        phaseResults.push({
          phase: 9,
          phaseName: 'Internationalization & Accessibility',
          success: true,
          findingsCount: phase9Result.findings.length,
          executionTimeMs: phase9Result.executionTimeMs,
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`ÔØî Phase 9 failed with exception: ${errorMessage}`);
      console.error(`ÔÜá´©Å  Continuing to next phase (system resilience)`);
      
      if (this.config.enablePartialReports) {
        await this.writePartialReport(
          9,
          'Internationalization & Accessibility',
          0,
          Date.now() - phase9StartTime,
          errorMessage
        );
      }
      
      phaseResults.push({
        phase: 9,
        phaseName: 'Internationalization & Accessibility',
        success: false,
        findingsCount: 0,
        executionTimeMs: Date.now() - phase9StartTime,
        error: errorMessage,
      });
    }

    // Phase 10: Environment & CI/CD
    console.log('­ƒî¬ Phase 10: Environment & CI/CD');
    const phase10StartTime = Date.now();
    
    try {
      const phase10EnvCICD = new Phase10EnvCICD({
        projectRoot: this.config.projectRoot,
        statePersistence: this.config.statePersistence,
        currentState: this.config.currentState,
      });

      const timeoutMs = this.config.phaseTimeoutMs || 300000; // 5 min default
      const phase10Result = await this.runWithTimeout(
        () => phase10EnvCICD.execute(),
        timeoutMs,
        'Phase 10: Environment & CI/CD'
      );

      if (!phase10Result.success) {
        console.error(`ÔØî Phase 10 failed: ${phase10Result.error}`);
        console.error(`ÔÜá´©Å  Continuing to next phase (system resilience)`);
        
        if (this.config.enablePartialReports) {
          await this.writePartialReport(
            10,
            'Environment & CI/CD',
            0,
            Date.now() - phase10StartTime,
            phase10Result.error
          );
        }
        
        phaseResults.push({
          phase: 10,
          phaseName: 'Environment & CI/CD',
          success: false,
          findingsCount: 0,
          executionTimeMs: Date.now() - phase10StartTime,
          error: phase10Result.error,
        });
      } else {
        console.log(`Ô£à Phase 10: Environment & CI/CD passed`);
        console.log(`  ­ƒöì Total findings: ${phase10Result.findings.length}`);
        console.log(`  ­ƒÜ¿ Critical findings: ${phase10Result.criticalFindings}`);
        console.log(`  ÔÜá´©Å  High severity findings: ${phase10Result.highSeverityFindings}\n`);
        
        if (this.config.enablePartialReports) {
          await this.writePartialReport(
            10,
            'Environment & CI/CD',
            phase10Result.findings.length,
            phase10Result.executionTimeMs
          );
        }
        
        if (this.config.enableMemoryFlush && this.isHeavyPhase(10)) {
          await this.flushMemory();
        }
        
        await this.config.statePersistence.saveState(this.config.currentState);
        
        phaseResults.push({
          phase: 10,
          phaseName: 'Environment & CI/CD',
          success: true,
          findingsCount: phase10Result.findings.length,
          executionTimeMs: phase10Result.executionTimeMs,
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`ÔØî Phase 10 failed with exception: ${errorMessage}`);
      console.error(`ÔÜá´©Å  Continuing to next phase (system resilience)`);
      
      if (this.config.enablePartialReports) {
        await this.writePartialReport(
          10,
          'Environment & CI/CD',
          0,
          Date.now() - phase10StartTime,
          errorMessage
        );
      }
      
      phaseResults.push({
        phase: 10,
        phaseName: 'Environment & CI/CD',
        success: false,
        findingsCount: 0,
        executionTimeMs: Date.now() - phase10StartTime,
        error: errorMessage,
      });
    }

    // Phase 11: Testing Deep Audit
    console.log('­ƒº¬ Phase 11: Testing Deep Audit');
    const phase11StartTime = Date.now();
    
    try {
      // Thermal Lock: Check thermal status before applying fixes
      await this.checkThermalLock();
      
      // Pre-flight Check: Establish error baseline before fixes
      console.log('ÔÜá´©Å  Pre-flight Check: Establishing error baseline...');
      await this.errorBaseline.establishBaseline();
      
      // Git Checkpointing: Create checkpoint before applying fixes
      console.log('ÔÜá´©Å  Git Checkpointing: Creating safety checkpoint...');
      const isInGitRepo = await this.gitCheckpointManager.isInGitRepository();
      
      if (isInGitRepo) {
        try {
          const checkpoint = await this.gitCheckpointManager.createCheckpoint('aegis-pre-fix');
          console.log(`Ô£à Checkpoint created: ${checkpoint.tagName} (${checkpoint.commitHash})`);
        } catch (error) {
          console.warn('ÔÜá´©Å  Failed to create git checkpoint, proceeding without rollback capability');
          console.warn('ÔÜá´©Å  Error:', error instanceof Error ? error.message : String(error));
        }
      } else {
        console.warn('ÔÜá´©Å  Not in a git repository, skipping checkpoint');
      }

      // Safe Level 4: Check if dry-run is required for high-risk files
      const isDryRunMode = this.config.dryRunMode || true; // Default to dry-run for safety
      
      // If not in dry-run mode, check for high-risk files and block auto-fixes
      if (!isDryRunMode) {
        console.log('ÔÜá´©Å  Safe Level 4: Checking for high-risk files...');
        // TODO: Implement dependency graph analysis here
        // For now, force dry-run mode for safety
        console.warn('ÔÜá´©Å  Auto-fix mode not yet implemented. Running in dry-run mode for safety.');
      }

      // Enforce dry-run before any fix operations
      this.validateDryRunForOperation('Phase 11: Atomic Fixes');

      const phase11AtomicFixes = new Phase11AtomicFixes({
        projectRoot: this.config.projectRoot,
        statePersistence: this.config.statePersistence,
        currentState: this.config.currentState,
        thermalController: this.config.thermalController,
        autoApply: false, // Always false for safety
        allowCorePathFixes: false, // Never allow core path fixes automatically
        dryRun: this.dryRunMode || this.config.safeOnly || false, // Use dryRunMode or safeOnly
        yesMode: this.yesMode, // Pass yesMode for interactive confirmation
        gitCheckpointManager: this.gitCheckpointManager, // Pass for auto-backup
        previewDiffs: this.config.previewDiffs || false, // Show batch diff preview before applying fixes
        auditOnly: this.config.auditOnly || false, // Audit-only mode for compliance
        interactiveFix: this.config.interactiveFix || false, // Per-fix interactive approval
        sandboxConfig: {
          projectRoot: this.config.projectRoot,
          enabled: !this.config.safeOnly, // Disable sandbox in safe-only mode
          validateSyntax: true,
          runTests: false,
        },
      });

      const timeoutMs = this.config.phaseTimeoutMs || 300000; // 5 min default
      const phase11Result = await this.runWithTimeout(
        () => phase11AtomicFixes.execute(),
        timeoutMs,
        'Phase 11: Atomic Fixes'
      );

      if (!phase11Result.success) {
        console.error(`ÔØî Phase 11 failed: ${phase11Result.error}`);
        console.error(`ÔÜá´©Å  Continuing to next phase (system resilience)`);
        
        if (this.config.enablePartialReports) {
          await this.writePartialReport(
            11,
            'Testing Deep Audit',
            0,
            Date.now() - phase11StartTime,
            phase11Result.error
          );
        }
        
        phaseResults.push({
          phase: 11,
          phaseName: 'Testing Deep Audit',
          success: false,
          findingsCount: 0,
          executionTimeMs: Date.now() - phase11StartTime,
          error: phase11Result.error,
        });
      } else {
        console.log(`Ô£à Phase 11: Atomic Fixes passed`);
        console.log(`  ­ƒöì Total fixes attempted: ${phase11Result.remediationResult.totalFixesAttempted}`);
        console.log(`  ­ƒÜ¿ Fixes applied: ${phase11Result.remediationResult.fixesApplied}`);
        console.log(`  ÔÜá´©Å  Fixes skipped: ${phase11Result.remediationResult.fixesSkipped}\n`);
        
        // Post-fix validation: Run tsc --noEmit to check if fixes broke the build
        console.log('ÔÜá´©Å  Post-fix validation: Running tsc --noEmit...');
        const { exec } = await import('child_process');
        const { promisify } = await import('util');
        const execAsync = promisify(exec);
        
        try {
          const { stderr } = await execAsync('npx tsc --noEmit', {
            cwd: this.config.projectRoot,
            env: { ...process.env },
          });
          
          if (stderr && stderr.trim().length > 0) {
            console.error('ÔØî Post-fix validation failed: tsc --noEmit found errors');
            console.error('ÔØî Rolling back to checkpoint...');
            
            // Rollback to checkpoint
            try {
              await this.gitCheckpointManager.rollbackToLastCheckpoint();
              console.log('Ô£à Successfully rolled back to checkpoint');
              
              // Mark phase as failed
              phaseResults.push({
                phase: 11,
                phaseName: 'Atomic Fixes',
                success: false,
                findingsCount: phase11Result.remediationResult.fixesApplied,
                executionTimeMs: phase11Result.executionTimeMs,
                error: 'Post-fix validation failed: tsc --noEmit found errors. Rolled back to checkpoint.',
              });
              
              if (this.config.enablePartialReports) {
                await this.writePartialReport(
                  11,
                  'Atomic Fixes',
                  0,
                  phase11Result.executionTimeMs,
                  'Post-fix validation failed: tsc --noEmit found errors. Rolled back to checkpoint.'
                );
              }
              
              // Skip to next phase after rollback
              return {
                success: false,
                totalExecutionTimeMs: Date.now() - startTime,
                phaseResults,
                totalFindings,
                domainMap,
              };
            } catch (rollbackError) {
              console.error('ÔØî Failed to rollback to checkpoint:', rollbackError);
              console.error('ÔØî Manual intervention may be required to restore repository state');
            }
          } else {
            console.log('Ô£à Post-fix validation passed');
          }
        } catch (tscError) {
          console.warn('ÔÜá´©Å  Could not run tsc --noEmit for validation, skipping post-fix check');
        }
        
        if (this.config.enablePartialReports) {
          await this.writePartialReport(
            11,
            'Atomic Fixes',
            phase11Result.remediationResult.fixesApplied,
            phase11Result.executionTimeMs
          );
        }
        
        if (this.config.enableMemoryFlush && this.isHeavyPhase(11)) {
          await this.flushMemory();
        }
        
        // Memory Guard: Trigger GC after heavy phase
        await this.triggerGarbageCollection('Phase 11: Atomic Fixes');
        
        phaseResults.push({
          phase: 11,
          phaseName: 'Atomic Fixes',
          success: true,
          findingsCount: phase11Result.remediationResult.fixesApplied,
          executionTimeMs: phase11Result.executionTimeMs,
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`ÔØî Phase 11 failed with exception: ${errorMessage}`);
      console.error(`ÔÜá´©Å  Continuing to next phase (system resilience)`);
      
      if (this.config.enablePartialReports) {
        await this.writePartialReport(
          11,
          'Testing Deep Audit',
          0,
          Date.now() - phase11StartTime,
          errorMessage
        );
      }
      
      phaseResults.push({
        phase: 11,
        phaseName: 'Testing Deep Audit',
        success: false,
        findingsCount: 0,
        executionTimeMs: Date.now() - phase11StartTime,
        error: errorMessage,
      });
    }

    // Phase 12: Error Handling & Observability
    console.log('INFO Phase 12: Error Handling & Observability');
    const phase12StartTime = Date.now();
    
    try {
      const fileFilter = new FileFilter();
      const ignoreHandler = new IgnoreHandler({ projectRoot: this.config.projectRoot });
      
      const phase12ErrorHandling = new Phase12ErrorHandling({
        projectRoot: this.config.projectRoot,
        thermalController: this.config.thermalController,
        statePersistence: this.config.statePersistence,
        fileFilter,
        ignoreHandler,
        currentState: this.config.currentState,
      });

      const timeoutMs = this.config.phaseTimeoutMs || 300000; // 5 min default
      const phase12Result = await this.runWithTimeout(
        () => phase12ErrorHandling.execute(),
        timeoutMs,
        'Phase 12: Error Handling & Observability'
      );

      if (!phase12Result.success) {
        console.error(`ERROR Phase 12 failed: ${phase12Result.error}`);
        console.log(`WARNING Continuing to next phase (system resilience)`);
        
        if (this.config.enablePartialReports) {
          await this.writePartialReport(
            12,
            'Error Handling & Observability',
            0,
            Date.now() - phase12StartTime,
            phase12Result.error
          );
        }
        
        phaseResults.push({
          phase: 12,
          phaseName: 'Error Handling & Observability',
          success: false,
          findingsCount: 0,
          executionTimeMs: Date.now() - phase12StartTime,
          error: phase12Result.error,
        });
      } else {
        console.log(`SUCCESS Phase 12: Error Handling & Observability passed`);
        console.log(`INFO Total findings: ${phase12Result.errorFindings.length}`);
        console.log(`INFO Critical findings: ${phase12Result.criticalFindings}`);
        console.log(`INFO High severity findings: ${phase12Result.highSeverityFindings}\n`);
        
        if (this.config.enablePartialReports) {
          await this.writePartialReport(
            12,
            'Error Handling & Observability',
            phase12Result.errorFindings.length,
            phase12Result.executionTimeMs
          );
        }
        
        if (this.config.enableMemoryFlush && this.isHeavyPhase(12)) {
          await this.flushMemory();
        }
        
        await this.config.statePersistence.saveState(this.config.currentState);
        
        phaseResults.push({
          phase: 12,
          phaseName: 'Error Handling & Observability',
          success: true,
          findingsCount: phase12Result.errorFindings.length,
          executionTimeMs: phase12Result.executionTimeMs,
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`ÔØî Phase 12 failed with exception: ${errorMessage}`);
      console.error(`ÔÜá´©Å  Continuing to next phase (system resilience)`);
      
      if (this.config.enablePartialReports) {
        await this.writePartialReport(
          12,
            'Error Handling & Observability',
            0,
            Date.now() - phase12StartTime,
            errorMessage
          );
      }
      
      phaseResults.push({
        phase: 12,
        phaseName: 'Error Handling & Observability',
        success: false,
        findingsCount: 0,
        executionTimeMs: Date.now() - phase12StartTime,
        error: errorMessage,
      });
    }

    // Phase 13: i18n & l10n
    console.log('INFO Phase 13: i18n & l10n');
    const phase13StartTime = Date.now();
    
    try {
      const fileFilter = new FileFilter();
      const ignoreHandler = new IgnoreHandler({ projectRoot: this.config.projectRoot });
      
      const phase13I18nL10n = new Phase13I18nL10n({
        projectRoot: this.config.projectRoot,
        thermalController: this.config.thermalController,
        statePersistence: this.config.statePersistence,
        fileFilter,
        ignoreHandler,
        currentState: this.config.currentState,
      });

      const timeoutMs = this.config.phaseTimeoutMs || 300000; // 5 min default
      const phase13Result = await this.runWithTimeout(
        () => phase13I18nL10n.execute(),
        timeoutMs,
        'Phase 13: i18n & l10n'
      );

      if (!phase13Result.success) {
        console.error(`ERROR Phase 13 failed: ${phase13Result.error}`);
        console.log(`WARNING Continuing to next phase (system resilience)`);
        
        if (this.config.enablePartialReports) {
          await this.writePartialReport(
            13,
            'i18n & l10n',
            0,
            Date.now() - phase13StartTime,
            phase13Result.error
          );
        }
        
        phaseResults.push({
          phase: 13,
          phaseName: 'i18n & l10n',
          success: false,
          findingsCount: 0,
          executionTimeMs: Date.now() - phase13StartTime,
          error: phase13Result.error,
        });
      } else {
        console.log(`SUCCESS Phase 13: i18n & l10n passed`);
        console.log(`INFO Total findings: ${phase13Result.i18nFindings.length}`);
        console.log(`INFO Critical findings: ${phase13Result.criticalFindings}`);
        console.log(`INFO High severity findings: ${phase13Result.highSeverityFindings}`);
        console.log(`INFO i18n Library: ${phase13Result.i18nLibrary.libraryName || 'None'}\n`);
        
        if (this.config.enablePartialReports) {
          await this.writePartialReport(
            13,
            'i18n & l10n',
            phase13Result.i18nFindings.length,
            phase13Result.executionTimeMs
          );
        }
        
        if (this.config.enableMemoryFlush && this.isHeavyPhase(13)) {
          await this.flushMemory();
        }
        
        await this.config.statePersistence.saveState(this.config.currentState);
        
        phaseResults.push({
          phase: 13,
          phaseName: 'i18n & l10n',
          success: true,
          findingsCount: phase13Result.i18nFindings.length,
          executionTimeMs: phase13Result.executionTimeMs,
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`ÔØî Phase 13 failed with exception: ${errorMessage}`);
      console.error(`ÔÜá´©Å  Continuing to next phase (system resilience)`);
      
      if (this.config.enablePartialReports) {
        await this.writePartialReport(
          13,
          'i18n & l10n',
          0,
          Date.now() - phase13StartTime,
          errorMessage
        );
      }
      
      phaseResults.push({
        phase: 13,
        phaseName: 'i18n & l10n',
        success: false,
        findingsCount: 0,
        executionTimeMs: Date.now() - phase13StartTime,
        error: errorMessage,
      });
    }

    // Phase 14: Git, Repo & Documentation Hygiene
    console.log('INFO Phase 14: Git, Repo & Documentation Hygiene');
    const phase14StartTime = Date.now();
    
    try {
      const phase14GitHygiene = new Phase14GitHygiene({
        projectRoot: this.config.projectRoot,
        thermalController: this.config.thermalController,
        statePersistence: this.config.statePersistence,
        currentState: this.config.currentState,
      });

      const timeoutMs = this.config.phaseTimeoutMs || 300000; // 5 min default
      const phase14Result = await this.runWithTimeout(
        () => phase14GitHygiene.execute(),
        timeoutMs,
        'Phase 14: Git, Repo & Documentation Hygiene'
      );

      if (!phase14Result.success) {
        console.error(`ERROR Phase 14 failed: ${phase14Result.error}`);
        console.log(`WARNING Continuing to next phase (system resilience)`);
        
        if (this.config.enablePartialReports) {
          await this.writePartialReport(
            14,
            'Git, Repo & Documentation Hygiene',
            0,
            Date.now() - phase14StartTime,
            phase14Result.error
          );
        }
        
        phaseResults.push({
          phase: 14,
          phaseName: 'Git, Repo & Documentation Hygiene',
          success: false,
          findingsCount: 0,
          executionTimeMs: Date.now() - phase14StartTime,
          error: phase14Result.error,
        });
      } else {
        console.log(`SUCCESS Phase 14: Git, Repo & Documentation Hygiene passed`);
        console.log(`INFO Total findings: ${phase14Result.gitHygieneFindings.length}`);
        console.log(`INFO Critical findings: ${phase14Result.criticalFindings}`);
        console.log(`INFO High severity findings: ${phase14Result.highSeverityFindings}`);
        console.log(`INFO Leaked .env files: ${phase14Result.gitHygieneAudit.leakedEnvFiles.length}\n`);
        
        if (this.config.enablePartialReports) {
          await this.writePartialReport(
            14,
            'Git, Repo & Documentation Hygiene',
            phase14Result.gitHygieneFindings.length,
            phase14Result.executionTimeMs
          );
        }
        
        if (this.config.enableMemoryFlush && this.isHeavyPhase(14)) {
          await this.flushMemory();
        }
        
        await this.config.statePersistence.saveState(this.config.currentState);
        
        phaseResults.push({
          phase: 14,
          phaseName: 'Git, Repo & Documentation Hygiene',
          success: true,
          findingsCount: phase14Result.gitHygieneFindings.length,
          executionTimeMs: phase14Result.executionTimeMs,
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`ÔØî Phase 14 failed with exception: ${errorMessage}`);
      console.error(`ÔÜá´©Å  Continuing to next phase (system resilience)`);
      
      if (this.config.enablePartialReports) {
        await this.writePartialReport(
          14,
          'Git, Repo & Documentation Hygiene',
          0,
          Date.now() - phase14StartTime,
          errorMessage
        );
      }
      
      phaseResults.push({
        phase: 14,
        phaseName: 'Git, Repo & Documentation Hygiene',
        success: false,
        findingsCount: 0,
        executionTimeMs: Date.now() - phase14StartTime,
        error: errorMessage,
      });
    }

    // Phase 15: CI/CD & DevOps
    console.log('INFO Phase 15: CI/CD & DevOps');
    const phase15StartTime = Date.now();
    
    try {
      const phase15CICDDevOps = new Phase15CICDDevOps({
        projectRoot: this.config.projectRoot,
        thermalController: this.config.thermalController,
        statePersistence: this.config.statePersistence,
        currentState: this.config.currentState,
      });

      const timeoutMs = this.config.phaseTimeoutMs || 300000; // 5 min default
      const phase15Result = await this.runWithTimeout(
        () => phase15CICDDevOps.execute(),
        timeoutMs,
        'Phase 15: CI/CD & DevOps'
      );

      if (!phase15Result.success) {
        console.error(`ERROR Phase 15 failed: ${phase15Result.error}`);
        console.log(`WARNING Continuing to final summary (system resilience)`);
        
        if (this.config.enablePartialReports) {
          await this.writePartialReport(
            15,
            'CI/CD & DevOps',
            0,
            Date.now() - phase15StartTime,
            phase15Result.error
          );
        }
        
        phaseResults.push({
          phase: 15,
          phaseName: 'CI/CD & DevOps',
          success: false,
          findingsCount: 0,
          executionTimeMs: Date.now() - phase15StartTime,
          error: phase15Result.error,
        });
      } else {
        console.log(`SUCCESS Phase 15: CI/CD & DevOps passed`);
        console.log(`INFO Total findings: ${phase15Result.cicdFindings.length}`);
        console.log(`INFO Critical findings: ${phase15Result.criticalFindings}`);
        console.log(`INFO High severity findings: ${phase15Result.highSeverityFindings}`);
        console.log(`INFO CI Platform: ${phase15Result.cicdAudit.ciPlatform}\n`);
        
        if (this.config.enablePartialReports) {
          await this.writePartialReport(
            15,
            'CI/CD & DevOps',
            phase15Result.cicdFindings.length,
            phase15Result.executionTimeMs
          );
        }
        
        if (this.config.enableMemoryFlush && this.isHeavyPhase(15)) {
          await this.flushMemory();
        }
        
        await this.config.statePersistence.saveState(this.config.currentState);
        
        phaseResults.push({
          phase: 15,
          phaseName: 'CI/CD & DevOps',
          success: true,
          findingsCount: phase15Result.cicdFindings.length,
          executionTimeMs: phase15Result.executionTimeMs,
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`ÔØî Phase 15 failed with exception: ${errorMessage}`);
      console.error(`ÔÜá´©Å  Continuing to final summary (system resilience)`);
      
      if (this.config.enablePartialReports) {
        await this.writePartialReport(
          15,
          'CI/CD & DevOps',
          0,
          Date.now() - phase15StartTime,
          errorMessage
        );
      }
      
      phaseResults.push({
        phase: 15,
        phaseName: 'CI/CD & DevOps',
        success: false,
        findingsCount: 0,
        executionTimeMs: Date.now() - phase15StartTime,
        error: errorMessage,
      });
    }

    // Phase 15B: Cloud Infrastructure
    console.log('INFO Phase 15B: Cloud Infrastructure');
    const phase15BStartTime = Date.now();
    
    try {
      const phase15BCloudInfra = new Phase15BCloudInfra({
        projectRoot: this.config.projectRoot,
        thermalController: this.config.thermalController,
        statePersistence: this.config.statePersistence,
        currentState: this.config.currentState,
      });

      const timeoutMs = this.config.phaseTimeoutMs || 300000; // 5 min default
      const phase15BResult = await this.runWithTimeout(
        () => phase15BCloudInfra.execute(),
        timeoutMs,
        'Phase 15B: Cloud Infrastructure'
      );

      if (!phase15BResult.success) {
        console.error(`ERROR Phase 15B failed: ${phase15BResult.error}`);
        console.log(`WARNING Continuing to next phase (system resilience)`);
        
        if (this.config.enablePartialReports) {
          await this.writePartialReport(
            15,
            'Cloud Infrastructure',
            0,
            Date.now() - phase15BStartTime,
            phase15BResult.error
          );
        }
        
        phaseResults.push({
          phase: 15,
          phaseName: 'Cloud Infrastructure',
          success: false,
          findingsCount: 0,
          executionTimeMs: Date.now() - phase15BStartTime,
          error: phase15BResult.error,
        });
      } else {
        console.log(`SUCCESS Phase 15B: Cloud Infrastructure passed`);
        console.log(`INFO Total findings: ${phase15BResult.cloudInfraFindings.length}`);
        console.log(`INFO Critical findings: ${phase15BResult.criticalFindings}`);
        console.log(`INFO High severity findings: ${phase15BResult.highSeverityFindings}`);
        console.log(`INFO IaC Platform: ${phase15BResult.cloudInfraAudit.iacPlatform}\n`);
        
        if (this.config.enablePartialReports) {
          await this.writePartialReport(
            15,
            'Cloud Infrastructure',
            phase15BResult.cloudInfraFindings.length,
            phase15BResult.executionTimeMs
          );
        }
        
        if (this.config.enableMemoryFlush && this.isHeavyPhase(15)) {
          await this.flushMemory();
        }
        
        await this.config.statePersistence.saveState(this.config.currentState);
        
        phaseResults.push({
          phase: 15,
          phaseName: 'Cloud Infrastructure',
          success: true,
          findingsCount: phase15BResult.cloudInfraFindings.length,
          executionTimeMs: phase15BResult.executionTimeMs,
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`ERROR Phase 15B failed with exception: ${errorMessage}`);
      console.log(`WARNING Continuing to next phase (system resilience)`);
      
      if (this.config.enablePartialReports) {
        await this.writePartialReport(
          15,
          'Cloud Infrastructure',
          0,
          Date.now() - phase15BStartTime,
          errorMessage
        );
      }
      
      phaseResults.push({
        phase: 15,
        phaseName: 'Cloud Infrastructure',
        success: false,
        findingsCount: 0,
        executionTimeMs: Date.now() - phase15BStartTime,
        error: errorMessage,
      });
    }

    // Phase 15C: Containerization
    console.log('INFO Phase 15C: Containerization');
    const phase15CStartTime = Date.now();
    
    try {
      const phase15CContainerization = new Phase15CContainerization({
        projectRoot: this.config.projectRoot,
        thermalController: this.config.thermalController,
        statePersistence: this.config.statePersistence,
        currentState: this.config.currentState,
      });

      const timeoutMs = this.config.phaseTimeoutMs || 300000; // 5 min default
      const phase15CResult = await this.runWithTimeout(
        () => phase15CContainerization.execute(),
        timeoutMs,
        'Phase 15C: Containerization'
      );

      if (!phase15CResult.success) {
        console.error(`ERROR Phase 15C failed: ${phase15CResult.error}`);
        console.log(`WARNING Continuing to final summary (system resilience)`);
        
        if (this.config.enablePartialReports) {
          await this.writePartialReport(
            15,
            'Containerization',
            0,
            Date.now() - phase15CStartTime,
            phase15CResult.error
          );
        }
        
        phaseResults.push({
          phase: 15,
          phaseName: 'Containerization',
          success: false,
          findingsCount: 0,
          executionTimeMs: Date.now() - phase15CStartTime,
          error: phase15CResult.error,
        });
      } else {
        console.log(`SUCCESS Phase 15C: Containerization passed`);
        console.log(`INFO Total findings: ${phase15CResult.containerizationFindings.length}`);
        console.log(`INFO Critical findings: ${phase15CResult.criticalFindings}`);
        console.log(`INFO High severity findings: ${phase15CResult.highSeverityFindings}`);
        console.log(`INFO Dockerfiles analyzed: ${phase15CResult.containerizationAudit.dockerfileFiles.length}\n`);
        
        if (this.config.enablePartialReports) {
          await this.writePartialReport(
            15,
            'Containerization',
            phase15CResult.containerizationFindings.length,
            phase15CResult.executionTimeMs
          );
        }
        
        if (this.config.enableMemoryFlush && this.isHeavyPhase(15)) {
          await this.flushMemory();
        }
        
        await this.config.statePersistence.saveState(this.config.currentState);
        
        phaseResults.push({
          phase: 15,
          phaseName: 'Containerization',
          success: true,
          findingsCount: phase15CResult.containerizationFindings.length,
          executionTimeMs: phase15CResult.executionTimeMs,
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`ERROR Phase 15C failed with exception: ${errorMessage}`);
      console.log(`WARNING Continuing to final summary (system resilience)`);
      
      if (this.config.enablePartialReports) {
        await this.writePartialReport(
          15,
          'Containerization',
          0,
          Date.now() - phase15CStartTime,
          errorMessage
        );
      }
      
      phaseResults.push({
        phase: 15,
        phaseName: 'Containerization',
        success: false,
        findingsCount: 0,
        executionTimeMs: Date.now() - phase15CStartTime,
        error: errorMessage,
      });
    }

    const executionTimeMs = Date.now() - startTime;
    totalFindings = phaseResults.reduce((sum, result) => sum + result.findingsCount, 0);

    const overallSuccess = phaseResults.every(result => result.success);

    console.log(`\nÔ£à Full Review Complete`);
    console.log(`­ƒôè Total Findings: ${totalFindings}`);
    console.log(`ÔÅ▒´©Å  Total Time: ${(executionTimeMs / 1000).toFixed(2)}s\n`);

    return {
      success: overallSuccess,
      totalExecutionTimeMs: executionTimeMs,
      phaseResults,
      totalFindings,
      domainMap,
    };
  }

  /**
   * Runs a function with timeout protection and automatic cleanup
   *
   * @param fn - Function to run
   * @param timeoutMs - Timeout in milliseconds
   * @param context - Context description for error messages
   * @returns Promise<T> - Function result
   * @throws {Error} If timeout is exceeded
   */
  private async runWithTimeout<T>(
    fn: () => Promise<T>,
    timeoutMs: number,
    context: string
  ): Promise<T> {
    let timeoutHandle: NodeJS.Timeout | null = null;

    const timeoutPromise = new Promise<T>((_, reject) => {
      timeoutHandle = setTimeout(() => {
        // Perform automatic cleanup on timeout
        this.performTimeoutCleanup(context);
        reject(new Error(`${context} timeout after ${timeoutMs}ms - phase aborted`));
      }, timeoutMs);
    });

    // Track the timeout for cleanup
    if (timeoutHandle) {
      this.activeTimeouts.add(timeoutHandle);
    }

    try {
      const result = await Promise.race([fn(), timeoutPromise]) as Promise<T>;
      if (timeoutHandle) {
        clearTimeout(timeoutHandle);
        this.activeTimeouts.delete(timeoutHandle);
      }
      return result;
    } catch (error) {
      if (timeoutHandle) {
        clearTimeout(timeoutHandle);
        this.activeTimeouts.delete(timeoutHandle);
      }
      throw error;
    }
  }

  /**
   * Performs cleanup when a phase times out
   *
   * @private
   * @param context - Context description for logging
   */
  private performTimeoutCleanup(context: string): void {
    console.error(`⚠️ [Timeout Cleanup] Cleaning up resources after timeout in ${context}`);

    // Clear all tracked timeouts
    const clearedTimeouts = this.clearAllTimeouts();
    console.log(`  [Security] Cleared ${clearedTimeouts} active timeouts`);

    // Kill orphaned processes
    const killedProcesses = this.killOrphanedProcesses();
    console.log(`  [Security] Killed ${killedProcesses} orphaned processes`);

    // Clean up temporary files
    const cleanedFiles = this.cleanupTemporaryFiles();
    console.log(`  [Security] Cleaned ${cleanedFiles} temporary files`);

    // Detect zombie processes
    this.detectZombieProcesses();

    // Trigger memory cleanup
    this.memoryMonitor.checkMemory();
    if (this.gcAvailable) {
      try {
        (global as any).gc();
        console.log('  🧹 Garbage collection triggered during timeout cleanup');
      } catch (error) {
        console.warn('  🧹 Failed to trigger GC during cleanup:', error);
      }
    }

    // Log current memory state
    this.memoryMonitor.logMemoryUsage('Timeout Cleanup');

    console.error(`⚠️ [Timeout Cleanup] Cleanup completed for ${context}`);
  }

  /**
   * Clears all tracked timeouts
   *
   * @private
   * @returns number - Number of timeouts cleared
   */
  private clearAllTimeouts(): number {
    let cleared = 0;
    for (const timeout of this.activeTimeouts) {
      clearTimeout(timeout);
      cleared++;
    }
    this.activeTimeouts.clear();
    return cleared;
  }

  /**
   * Kills orphaned processes (placeholder - would need process tracking)
   *
   * @private
   * @returns number - Number of processes killed
   */
  private killOrphanedProcesses(): number {
    // In a real implementation, this would track spawned processes
    // and kill them on timeout. For now, we log the intent.
    console.log('  [Security] Process tracking not implemented - no orphaned processes to kill');
    return 0;
  }

  /**
   * Cleans up temporary files in .aegis-cache
   *
   * @private
   * @returns number - Number of files cleaned
   */
  private cleanupTemporaryFiles(): number {
    let cleaned = 0;
    try {
      const cacheDir = require('path').join(this.config.projectRoot, '.aegis-cache');
      const tempDir = require('path').join(cacheDir, 'temp');

      if (require('fs').existsSync(tempDir)) {
        const files = require('fs').readdirSync(tempDir);
        for (const file of files) {
          if (file.endsWith('.tmp') || file.endsWith('.temp')) {
            const filePath = require('path').join(tempDir, file);
            require('fs').unlinkSync(filePath);
            cleaned++;
          }
        }
      }
    } catch (error) {
      console.warn('  [Security] Failed to clean temporary files:', error instanceof Error ? error.message : String(error));
    }
    return cleaned;
  }

  /**
   * Detects zombie processes
   *
   * @private
   */
  private detectZombieProcesses(): void {
    // In a real implementation, this would check for zombie processes
    // using system commands or Node.js process tracking
    console.log('  [Security] Zombie process detection not implemented');
  }

  /**
   * Determines if a phase is "heavy" (requires memory flush)
   *
   * @private
   * @param phaseNumber - Phase number
   * @returns boolean - Whether phase is heavy
   */
  private isHeavyPhase(phaseNumber: number): boolean {
    // Phases that process large amounts of data
    const heavyPhases = [2, 3, 8, 9, 10]; // Business Logic, Security, Performance, Dead Code, API
    return heavyPhases.includes(phaseNumber);
  }

  /**
   * Forces memory flush to prevent RAM growth
   *
   * @private
   */
  private async flushMemory(): Promise<void> {
    try {
      // Try to force garbage collection if available
      if (typeof global.gc === 'function') {
        global.gc();
        console.log('  ­ƒº╣ Memory flushed (global.gc())');
      } else {
        // Fallback: clear large objects from DomainAnalyzer
        // This is a simplified approach - in production, you'd have more sophisticated cleanup
        console.log('  ­ƒº╣ Memory cleanup (object clearing)');
      }
    } catch (error) {
      // Memory flush failure should not halt execution
      console.warn('  ÔÜá´©Å  Memory flush failed:', error instanceof Error ? error.message : error);
    }
  }

  /**
   * Writes partial report after each phase
   *
   * @private
   * @param phaseNumber - Phase number
   * @param phaseName - Phase name
   * @param findingsCount - Number of findings
   * @param executionTimeMs - Execution time
   * @param error - Error message if phase failed
   */
  private async writePartialReport(
    phaseNumber: number,
    phaseName: string,
    findingsCount: number,
    executionTimeMs: number,
    error?: string
  ): Promise<void> {
    try {
      const reportPath = `${this.config.projectRoot}/qa-report.partial.md`;
      const timestamp = new Date().toISOString();
      const status = error ? 'ÔØî FAILED' : 'Ô£à PASSED';

      const reportEntry = `
## Phase ${phaseNumber}: ${phaseName} - ${status}
- **Timestamp:** ${timestamp}
- **Findings:** ${findingsCount}
- **Execution Time:** ${(executionTimeMs / 1000).toFixed(2)}s
${error ? `- **Error:** ${error}` : ''}
`;

      // Append to partial report
      if (fs.existsSync(reportPath)) {
        fs.appendFileSync(reportPath, reportEntry, 'utf-8');
      } else {
        // Create new partial report with header
        const header = `# Aegis QA - Partial Report
Generated: ${timestamp}

`;
        fs.writeFileSync(reportPath, header + reportEntry, 'utf-8');
      }

      console.log(`  ­ƒôØ Partial report updated: ${reportPath}`);
    } catch (reportError) {
      // Report write failure should not halt execution
      console.warn('  ÔÜá´©Å  Failed to write partial report:', reportError instanceof Error ? reportError.message : reportError);
    }
  }

  /**
   * Runs atomic fixes (phases 16-18)
   *
   * @returns Promise<FixResult> - Fix execution result
   */
  async runFixes(): Promise<FixResult> {
    console.log('­ƒöº Aegis QA - Atomic Fixes Mode\n');

    const startTime = Date.now();

    // TODO: Implement atomic fixes
    // For now, this is a skeleton
    console.log('ÔÜá´©Å  Atomic fixes not yet implemented (skeleton)');

    const executionTimeMs = Date.now() - startTime;

    return {
      success: true,
      totalFindings: 0,
      fixedCount: 0,
      needsHumanReview: 0,
      failedCount: 0,
      executionTimeMs,
    };
  }

  /**
   * Runs incremental review (phase 19 - git diff only)
   *
   * @returns Promise<ReviewResult> - Incremental review results
   */
  async runIncrementalReview(): Promise<ReviewResult> {
    console.log('­ƒöä Aegis QA - Incremental Review Mode');
    console.log(`­ƒôé Project Root: ${this.config.projectRoot}\n`);

    const startTime = Date.now();

    // TODO: Implement incremental review
    // For now, this is a skeleton
    console.log('ÔÜá´©Å  Incremental review not yet implemented (skeleton)');

    const executionTimeMs = Date.now() - startTime;

    return {
      success: true,
      totalExecutionTimeMs: executionTimeMs,
      phaseResults: [],
      totalFindings: 0,
    };
  }

  /**
   * Compares reports (phase 20)
   *
   * @returns Promise<void> - Comparison results
   */
  async compareReports(): Promise<void> {
    console.log('­ƒôè Aegis QA - Compare Reports Mode\n');

    // TODO: Implement report comparison
    // For now, this is a skeleton
    console.log('ÔÜá´©Å  Report comparison not yet implemented (skeleton)');
  }
}
