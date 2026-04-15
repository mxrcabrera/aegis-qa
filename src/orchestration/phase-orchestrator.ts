/**
 * PhaseOrchestrator - Orchestrator for 20 QA Phases
 *
 * Purpose: Orchestrate the 20 phases of qa-orchestrator in Aegis QA,
 * maintaining hardware protection and ensuring proper execution order.
 *
 * Architecture: This orchestrator manages the execution of all 20 phases,
 * coordinating with thermal controller, system resource monitor, domain
 * analyzer, and report aggregator.
 *
 * The 20 Phases:
 * Phase 0: Setup
 * Phase 1: Code Quality
 * Phase 2: Business Logic (PRIORITY MAXIMUM)
 * Phase 3: Security
 * Phase 4: Database
 * Phase 5: Clean Code
 * Phase 6: UI Components
 * Phase 7: UX & Accessibility
 * Phase 8: Performance & SEO
 * Phase 9: Dead Code & Dependencies
 * Phase 10: API Contracts
 * Phase 11: Tests
 * Phase 12: Error Handling & Observability
 * Phase 13: i18n & l10n
 * Phase 14: Git, Repo & Documentation Hygiene
 * Phase 15: CI/CD & DevOps
 * Phase 15B: Cloud Infrastructure Review
 * Phase 15C: Containerization Review
 * Phase 16-18: Fixes
 * Phase 19: Incremental Review
 * Phase 20: Compare Reports
 *
 * @module orchestration/phase-orchestrator
 * @since 1.0.0
 */

import { ThermalController } from '../core/thermal-controller.js';
import { SystemResourceMonitor } from '../core/system-resource-monitor.js';
import { StatePersistence } from '../core/state-persistence.js';
import { CacheManager } from '../core/cache-manager.js';
import { DomainAnalyzer } from '../inference/domain-analyzer.js';

/**
 * Review result from full review
 */
interface ReviewResult {
  /** Overall success */
  success: boolean;
  /** Total files analyzed */
  totalFiles: number;
  /** Findings from all phases */
  findings: any[];
  /** Critical findings count */
  criticalFindings: number;
  /** High severity findings count */
  highSeverityFindings: number;
  /** Execution time in milliseconds */
  executionTimeMs: number;
  /** Error if failed */
  error?: string;
}

/**
 * Phase result from single phase execution
 */
interface PhaseResult {
  /** Phase number */
  phaseNumber: number;
  /** Phase name */
  phaseName: string;
  /** Success status */
  success: boolean;
  /** Findings from phase */
  findings: any[];
  /** Execution time in milliseconds */
  executionTimeMs: number;
  /** Error if failed */
  error?: string;
}

/**
 * Fix result from fix operations
 */
interface FixResult {
  /** Overall success */
  success: boolean;
  /** Total fixes attempted */
  fixesAttempted: number;
  /** Total fixes applied */
  fixesApplied: number;
  /** Failed fixes count */
  fixesFailed: number;
  /** Execution time in milliseconds */
  executionTimeMs: number;
  /** Error if failed */
  error?: string;
}

/**
 * PhaseOrchestrator configuration
 */
interface OrchestratorConfig {
  /** Project root directory */
  projectRoot: string;
  /** Thermal controller for hardware protection */
  thermalController: ThermalController;
  /** System resource monitor for CPU/RAM monitoring */
  systemResourceMonitor: SystemResourceMonitor;
  /** State persistence for resume capability */
  statePersistence: StatePersistence;
  /** Cache manager for performance optimization */
  cacheManager: CacheManager;
  /** Domain analyzer for business logic understanding */
  domainAnalyzer: DomainAnalyzer;
  /** Whether to enable thermal protection */
  enableThermalProtection: boolean;
  /** Whether to enable resource monitoring */
  enableResourceMonitoring: boolean;
  /** Whether to enable caching */
  enableCaching: boolean;
}

/**
 * PhaseOrchestrator - Orchestrates the 20 QA phases
 *
 * This class manages the execution of all 20 phases, coordinating with
 * hardware protection systems to ensure safe and efficient operation.
 *
 * @class PhaseOrchestrator
 * @example
 * ```typescript
 * const orchestrator = new PhaseOrchestrator(config);
 * await orchestrator.initialize();
 * const reviewResult = await orchestrator.runFullReview();
 * const phaseResult = await orchestrator.runPhase(2); // Business Logic
 * const fixResult = await orchestrator.runFixes();
 * await orchestrator.cleanup();
 * ```
 */
export class PhaseOrchestrator {
  private config: OrchestratorConfig;
  private isInitialized: boolean = false;

  constructor(config: OrchestratorConfig) {
    this.config = config;
  }

  /**
   * Initializes the orchestrator
   *
   * Sets up all subsystems and prepares for phase execution.
   *
   * @returns Promise<void>
   */
  async initialize(): Promise<void> {
    console.log('[PhaseOrchestrator] Initializing orchestrator...');

    // Initialize state persistence
    await this.config.statePersistence.initialize();

    // Initialize cache manager
    await this.config.cacheManager.initialize();

    // Start resource monitoring if enabled
    if (this.config.enableResourceMonitoring) {
      await this.config.systemResourceMonitor.start();
    }

    // Detect hardware capabilities
    await this.config.thermalController.detectHardwareCapabilities();

    this.isInitialized = true;
    console.log('[PhaseOrchestrator] Initialization complete');
  }

  /**
   * Runs full review (all phases 0-15)
   *
   * Executes all review phases in order, with thermal protection and
   * resource monitoring throughout.
   *
   * @returns Promise<ReviewResult> - Review results
   */
  async runFullReview(): Promise<ReviewResult> {
    if (!this.isInitialized) {
      throw new Error('Orchestrator not initialized. Call initialize() first.');
    }

    const startTime = Date.now();
    console.log('[PhaseOrchestrator] Starting full review (Phases 0-15)...\n');

    try {
      const allFindings: any[] = [];
      let criticalFindings = 0;
      let highSeverityFindings = 0;
      let totalFiles = 0;

      // Run phases 0-15 (review phases)
      for (let phaseNumber = 0; phaseNumber <= 15; phaseNumber++) {
        console.log(`\n[PhaseOrchestrator] Executing Phase ${phaseNumber}...`);

        // Thermal check before phase
        if (this.config.enableThermalProtection) {
          await this.performThermalCheck();
        }

        // Resource check before phase
        if (this.config.enableResourceMonitoring) {
          await this.performResourceCheck();
        }

        // Execute phase
        const phaseResult = await this.runPhase(phaseNumber);

        if (!phaseResult.success) {
          console.error(`[PhaseOrchestrator] Phase ${phaseNumber} failed: ${phaseResult.error}`);
          continue;
        }

        // Collect findings
        allFindings.push(...phaseResult.findings);
        criticalFindings += phaseResult.findings.filter((f) => f.severity === 'critical').length;
        highSeverityFindings += phaseResult.findings.filter((f) => f.severity === 'high').length;
        totalFiles += phaseResult.findings.length;

        // Save phase completion
        await this.config.statePersistence.savePhaseCompletion(phaseNumber, phaseResult);
      }

      const executionTimeMs = Date.now() - startTime;

      const result: ReviewResult = {
        success: true,
        totalFiles,
        findings: allFindings,
        criticalFindings,
        highSeverityFindings,
        executionTimeMs,
      };

      console.log(`\n[PhaseOrchestrator] Full review complete in ${executionTimeMs / 1000}s`);
      console.log(`[PhaseOrchestrator] Total findings: ${allFindings.length}`);
      console.log(`[PhaseOrchestrator] Critical: ${criticalFindings}, High: ${highSeverityFindings}`);

      return result;
    } catch (error) {
      const executionTimeMs = Date.now() - startTime;
      const result: ReviewResult = {
        success: false,
        totalFiles: 0,
        findings: [],
        criticalFindings: 0,
        highSeverityFindings: 0,
        executionTimeMs,
        error: error instanceof Error ? error.message : String(error),
      };

      console.error('[PhaseOrchestrator] Full review failed:', result.error);
      return result;
    }
  }

  /**
   * Runs a single phase
   *
   * @param phaseNumber - Phase number to execute (0-20)
   * @returns Promise<PhaseResult> - Phase execution result
   */
  async runPhase(phaseNumber: number): Promise<PhaseResult> {
    if (!this.isInitialized) {
      throw new Error('Orchestrator not initialized. Call initialize() first.');
    }

    const startTime = Date.now();
    const phaseName = this.getPhaseName(phaseNumber);

    console.log(`[PhaseOrchestrator] Executing Phase ${phaseNumber}: ${phaseName}`);

    try {
      // Load phase implementation
      const phaseModule = await this.loadPhase(phaseNumber);
      
      if (!phaseModule) {
        throw new Error(`Phase ${phaseNumber} not implemented yet`);
      }

      // Execute phase
      const phaseResult = await phaseModule.execute(this.config);

      const executionTimeMs = Date.now() - startTime;

      const result: PhaseResult = {
        phaseNumber,
        phaseName,
        success: true,
        findings: phaseResult.findings || [],
        executionTimeMs,
      };

      console.log(`[PhaseOrchestrator] Phase ${phaseNumber} complete in ${executionTimeMs / 1000}s`);
      console.log(`[PhaseOrchestrator] Findings: ${result.findings.length}`);

      return result;
    } catch (error) {
      const executionTimeMs = Date.now() - startTime;

      const result: PhaseResult = {
        phaseNumber,
        phaseName,
        success: false,
        findings: [],
        executionTimeMs,
        error: error instanceof Error ? error.message : String(error),
      };

      console.error(`[PhaseOrchestrator] Phase ${phaseNumber} failed: ${result.error}`);
      return result;
    }
  }

  /**
   * Runs fix operations (Phases 16-18)
   *
   * @returns Promise<FixResult> - Fix operation results
   */
  async runFixes(): Promise<FixResult> {
    if (!this.isInitialized) {
      throw new Error('Orchestrator not initialized. Call initialize() first.');
    }

    const startTime = Date.now();
    console.log('[PhaseOrchestrator] Starting fix operations (Phases 16-18)...');

    try {
      let fixesAttempted = 0;
      let fixesApplied = 0;
      let fixesFailed = 0;

      // Run fix phases 16-18
      for (let phaseNumber = 16; phaseNumber <= 18; phaseNumber++) {
        console.log(`\n[PhaseOrchestrator] Executing Fix Phase ${phaseNumber}...`);

        // Thermal check before fix
        if (this.config.enableThermalProtection) {
          await this.performThermalCheck();
        }

        const phaseResult = await this.runPhase(phaseNumber);

        if (phaseResult.success) {
          fixesAttempted += phaseResult.findings.length;
          fixesApplied += phaseResult.findings.filter((f) => f.fixed).length;
          fixesFailed += phaseResult.findings.filter((f) => !f.fixed).length;
        }
      }

      const executionTimeMs = Date.now() - startTime;

      const result: FixResult = {
        success: true,
        fixesAttempted,
        fixesApplied,
        fixesFailed,
        executionTimeMs,
      };

      console.log(`\n[PhaseOrchestrator] Fix operations complete in ${executionTimeMs / 1000}s`);
      console.log(`[PhaseOrchestrator] Fixes applied: ${fixesApplied}/${fixesAttempted}`);

      return result;
    } catch (error) {
      const executionTimeMs = Date.now() - startTime;

      const result: FixResult = {
        success: false,
        fixesAttempted: 0,
        fixesApplied: 0,
        fixesFailed: 0,
        executionTimeMs,
        error: error instanceof Error ? error.message : String(error),
      };

      console.error('[PhaseOrchestrator] Fix operations failed:', result.error);
      return result;
    }
  }

  /**
   * Runs incremental review (Phase 19)
   *
   * @returns Promise<ReviewResult> - Incremental review results
   */
  async runIncrementalReview(): Promise<ReviewResult> {
    if (!this.isInitialized) {
      throw new Error('Orchestrator not initialized. Call initialize() first.');
    }

    console.log('[PhaseOrchestrator] Starting incremental review (Phase 19)...');

    const phaseResult = await this.runPhase(19);

    const result: ReviewResult = {
      success: phaseResult.success,
      totalFiles: phaseResult.findings.length,
      findings: phaseResult.findings,
      criticalFindings: phaseResult.findings.filter((f) => f.severity === 'critical').length,
      highSeverityFindings: phaseResult.findings.filter((f) => f.severity === 'high').length,
      executionTimeMs: phaseResult.executionTimeMs,
      error: phaseResult.error,
    };

    return result;
  }

  /**
   * Loads phase implementation
   *
   * @private
   * @param phaseNumber - Phase number
   * @returns Promise<any> - Phase module or null
   */
  private async loadPhase(phaseNumber: number): Promise<any> {
    try {
      // Dynamic import based on phase number
      const phasePath = `../phases/phase-${this.getPhaseFileName(phaseNumber)}.ts`;
      const phaseModule = await import(phasePath);
      return phaseModule.default || phaseModule;
    } catch (error) {
      console.warn(`Failed to load phase ${phaseNumber}:`, error instanceof Error ? error.message : error);
      return null;
    }
  }

  /**
   * Gets phase name by number
   *
   * @private
   * @param phaseNumber - Phase number
   * @returns string - Phase name
   */
  private getPhaseName(phaseNumber: number): string {
    const phaseNames: Record<number, string> = {
      0: 'Setup',
      1: 'Code Quality',
      2: 'Business Logic',
      3: 'Security',
      4: 'Database',
      5: 'Clean Code',
      6: 'UI Components',
      7: 'UX & Accessibility',
      8: 'Performance & SEO',
      9: 'Dead Code & Dependencies',
      10: 'API Contracts',
      11: 'Tests',
      12: 'Error Handling & Observability',
      13: 'i18n & l10n',
      14: 'Git, Repo & Documentation Hygiene',
      15: 'CI/CD & DevOps',
      16: 'Fix Strategy Generation',
      17: 'Multi-Fix Execution',
      18: 'Post-Fix Validation',
      19: 'Incremental Review',
      20: 'Intelligent Report Comparison',
    };

    return phaseNames[phaseNumber] || `Phase ${phaseNumber}`;
  }

  /**
   * Gets phase file name by number
   *
   * @private
   * @param phaseNumber - Phase number
   * @returns string - Phase file name
   */
  private getPhaseFileName(phaseNumber: number): string {
    const fileNames: Record<number, string> = {
      0: 'setup',
      1: 'code-quality',
      2: 'business-logic',
      3: 'security',
      4: 'database',
      5: 'clean-code',
      6: 'ui-components',
      7: 'ux-accessibility',
      8: 'performance-seo',
      9: 'dead-code-dependencies',
      10: 'api-contracts',
      11: 'tests',
      12: 'error-handling',
      13: 'i18n-l10n',
      14: 'git-hygiene',
      15: 'cicd-devops',
      16: 'fix-strategy',
      17: 'multi-fix-execution',
      18: 'post-fix-validation',
      19: 'incremental-review',
      20: 'intelligent-report-comparison',
    };

    return fileNames[phaseNumber] || `phase-${phaseNumber}`;
  }

  /**
   * Performs thermal check before operation
   *
   * @private
   * @returns Promise<void>
   */
  private async performThermalCheck(): Promise<void> {
    try {
      const resourceCheck = await this.config.thermalController.checkSystemResources();
      
      if (!resourceCheck.isSafe) {
        console.warn(`[PhaseOrchestrator] Resources elevated: CPU ${resourceCheck.cpuUsage}%, RAM ${resourceCheck.ramUsage}%`);
        await this.config.thermalController.applyAdaptiveCooldown('medium');
      }
    } catch (error) {
      console.warn('Failed thermal check:', error instanceof Error ? error.message : error);
    }
  }

  /**
   * Performs resource check before operation
   *
   * @private
   * @returns Promise<void>
   */
  private async performResourceCheck(): Promise<void> {
    try {
      const isSafe = await this.config.systemResourceMonitor.isSafe();
      
      if (!isSafe) {
        console.warn('[PhaseOrchestrator] System resources not safe, applying cooldown');
        await this.config.thermalController.applyAdaptiveCooldown('medium');
      }
    } catch (error) {
      console.warn('Failed resource check:', error instanceof Error ? error.message : error);
    }
  }

  /**
   * Cleans up resources
   *
   * @returns Promise<void>
   */
  async cleanup(): Promise<void> {
    console.log('[PhaseOrchestrator] Cleaning up...');

    // Stop resource monitoring
    if (this.config.enableResourceMonitoring) {
      await this.config.systemResourceMonitor.stop();
    }

    // Cleanup state persistence
    await this.config.statePersistence.cleanup();

    this.isInitialized = false;
    console.log('[PhaseOrchestrator] Cleanup complete');
  }

  /**
   * Gets current configuration
   *
   * @returns OrchestratorConfig - Current configuration
   */
  getConfig(): OrchestratorConfig {
    return { ...this.config };
  }

  /**
   * Updates configuration
   *
   * @param config - Partial configuration to update
   */
  updateConfig(config: Partial<OrchestratorConfig>): void {
    this.config = {
      ...this.config,
      ...config,
    };
  }
}
