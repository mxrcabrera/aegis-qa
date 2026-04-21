#!/usr/bin/env node

/**
 * Aegis QA - CLI Entry Point
 *
 * This is the main CLI interface for Aegis QA, supporting multiple commands
 * for review, fix, and incremental analysis modes.
 *
 * Commands:
 * - review: Full review of all 20 phases
 * - fix: Atomic fixes with mandatory verification
 * - incremental: Review only git diff changes
 */

import { ThermalController } from './core/thermal-controller.js';
import { SecretManager } from './core/secret-manager.js';
import { ReportAggregator } from './core/reporter.js';
import { DomainAnalyzer } from './inference/domain-analyzer.js';
import { PhaseOrchestrator } from './orchestration/phase-orchestrator.js';
import { StatePersistence, type ExecutionState } from './core/state-persistence.js';
import { GitCheckpointManager } from './core/git-checkpoint-manager.js';
import { ErrorMessages } from './core/error-messages.js';
import { resolve, normalize } from 'path';
import * as fs from 'fs';
import { FileSystem, setFileSystem, type WriteGuardMode } from './core/write-guard.js';

/**
 * Parses human-readable time format to milliseconds
 *
 * Supports formats like: 30m, 1h, 2h, 90s
 *
 * @param timeStr - Human-readable time string
 * @returns number - Time in milliseconds
 * @throws {Error} If format is invalid
 */
function parseHumanTime(timeStr: string): number {
  const match = timeStr.match(/^(\d+)([smh])$/);
  if (!match) {
    throw new Error(`Invalid time format: ${timeStr}. Expected format: 30m, 1h, 90s`);
  }

  const value = parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case 's':
      return value * 1000;
    case 'm':
      return value * 60 * 1000;
    case 'h':
      return value * 60 * 60 * 1000;
    default:
      throw new Error(`Invalid time unit: ${unit}. Expected: s, m, h`);
  }
}

interface CLIConfig {
  command: 'review' | 'fix' | 'incremental' | 'help';
  targetDir: string;
  skipThermal?: boolean;
  ciMode?: boolean;
  applyMode?: boolean;
  yesMode?: boolean;
  verboseMode?: boolean;
  safeOnly?: boolean;
  previewDiffs?: boolean;
  auditOnly?: boolean;
  interactiveFix?: boolean;
  sandboxMode?: boolean;
  noWriteMode?: boolean;
  maxRuntime?: string; // Human format: 30m, 1h, 2h
}

class AegisCLI {
  private config: CLIConfig;
  private statePersistence: StatePersistence | null = null;
  private currentState: ExecutionState | null = null;
  private sigintHandler: (() => void) | null = null;
  private gitCheckpointManager: GitCheckpointManager | null = null;

  constructor(config: CLIConfig) {
    this.config = config;
  }

  /**
   * Validates CLI input for security
   *
   * @static
   * @param command - Command to validate
   * @param targetDir - Target directory to validate
   * @param applyMode - Whether apply mode is enabled
   * @param yesMode - Whether yes mode is enabled
   * @throws {Error} If validation fails
   */
  static validateInput(
    command: string,
    targetDir: string,
    applyMode: boolean,
    yesMode: boolean
  ): void {
    // Validate command
    const validCommands = ['review', 'fix', 'incremental', 'help'];
    if (!validCommands.includes(command)) {
      throw new Error(`[Security] Invalid command: ${command}. Valid commands: ${validCommands.join(', ')}`);
    }

    // Validate target directory
    const resolvedPath = resolve(targetDir);
    const normalizedPath = normalize(resolvedPath);

    // Check for path traversal attempts
    if (normalizedPath.includes('..')) {
      throw new Error(`[Security] Path traversal attempt detected in target directory: ${targetDir}`);
    }

    // Check if directory exists
    if (!fs.existsSync(resolvedPath)) {
      throw new Error(`[Security] Target directory does not exist: ${resolvedPath}`);
    }

    // Check if it's a directory
    const stats = fs.statSync(resolvedPath);
    if (!stats.isDirectory()) {
      throw new Error(`[Security] Target path is not a directory: ${resolvedPath}`);
    }

    // Check for system directories (Windows)
    const systemDirs = ['C:\\Windows', 'C:\\Program Files', 'C:\\Program Files (x86)', '/etc', '/usr', '/bin', '/sbin'];
    for (const sysDir of systemDirs) {
      if (normalizedPath.startsWith(sysDir) || resolvedPath.startsWith(sysDir)) {
        throw new Error(`[Security] Cannot run Aegis QA on system directory: ${resolvedPath}`);
      }
    }

    // Validate flag combinations
    if (yesMode && !applyMode) {
      throw new Error(`[Security] --yes flag requires --apply flag. Using --yes without --apply is not allowed.`);
    }

    // Log validation success
    console.log(`[Security] Input validation passed for command: ${command}, target: ${resolvedPath}`);
  }

  async run(): Promise<void> {
    const { command, targetDir } = this.config;

    // Initialize FileSystem with write guard
    const fsMode: WriteGuardMode = this.config.noWriteMode ? 'readOnly' : 'readWrite';
    const fileSystem = new FileSystem(fsMode);
    setFileSystem(fileSystem);

    if (this.config.noWriteMode) {
      console.log('[WriteGuard] Read-only mode enabled - all filesystem writes are blocked at infrastructure level');
    }

    // Security: Enforce dry-run mode by default
    const isApplyMode = this.config.applyMode === true;
    if (!isApplyMode && command === 'fix') {
      console.log('[Security] Dry-run mode enabled by default for fix command.');
      console.log('[Security] Use --apply flag to disable dry-run mode and apply changes.');
    }

    if (!this.config.ciMode) {
      console.log('­ƒøí´©Å  Aegis QA - Advanced Quality Assurance Orchestrator');
      console.log(`­ƒôé Target Directory: ${resolve(targetDir)}\n`);
    }

    // Initialize core components
    const thermalController = new ThermalController({}, resolve(targetDir));
    const secretManager = new SecretManager({ mockMode: true });
    // Create report aggregator (will be updated with business risk findings after Phase 2)
    const reportAggregator = new ReportAggregator({ projectRoot: resolve(targetDir) });
    this.statePersistence = new StatePersistence(resolve(targetDir));
    this.gitCheckpointManager = new GitCheckpointManager(resolve(targetDir));

    // Initialize execution state
    this.currentState = this.statePersistence.createInitialState(20);

    // Set up SIGINT handler for graceful shutdown
    this.setupSigintHandler();

    // Establish error baseline before running phases
    if (!this.config.ciMode) {
      console.log('­ƒö¼ Establishing error baseline...');
    }
    await reportAggregator.establishBaseline();
    if (!this.config.ciMode) {
      console.log('Ô£à Baseline established\n');
    }

    // Run self-diagnostic stress test on startup
    if (!this.config.skipThermal) {
      if (!this.config.ciMode) {
        console.log('­ƒö¼ Running self-diagnostic stress test...');
      }
      const diagnosticResult = await thermalController.runSelfDiagnostic(5000);
      if (!this.config.ciMode) {
        console.log(`  Diagnostic passed: ${diagnosticResult.pass}`);
        console.log(`  Temperature rise rate: ${diagnosticResult.temperatureRiseRate.toFixed(2)}┬░C/s`);
        console.log(`  Thresholds adjusted: ${diagnosticResult.adjustedThresholds}`);
        console.log('Ô£à Self-diagnostic complete\n');
      }
    }

    const domainAnalyzer = new DomainAnalyzer({
      projectRoot: resolve(targetDir),
      useDatabase: false,
      useAI: false,
      schemaPaths: [
        'supabase/migrations/*.sql',
        'supabase/schema.sql',
        'prisma/schema.prisma',
        'database/schema.sql',
        'lib/db/schema.ts',
        'types/database.ts',
      ],
      actionPaths: [
        'app/**/actions.ts',
        'app/**/actions/*.ts',
        'actions/*.ts',
        'lib/actions/*.ts',
      ],
    }, secretManager);

    // Detect hardware capabilities
    if (!this.config.ciMode) {
      console.log('­ƒöº Detecting hardware capabilities...');
    }
    const hardwareProfile = await thermalController.detectHardwareCapabilities();
    if (!this.config.ciMode) {
      console.log(`  GPU: ${hardwareProfile.hasGPU ? hardwareProfile.gpuModel : 'Not detected'}`);
      console.log(`  VRAM: ${hardwareProfile.gpuVRAM ? `${hardwareProfile.gpuVRAM}GB` : 'N/A'}`);
      console.log(`  CPU Cores: ${hardwareProfile.cpuCores}`);
      console.log(`  RAM: ${hardwareProfile.ramTotal}GB`);
      console.log(`  Recommended Batch Size: ${hardwareProfile.recommendedBatchSize}`);
      console.log(`  Recommended Cooldown: ${hardwareProfile.recommendedCooldown}ms`);
      console.log('Ô£à Hardware detection complete\n');
    }

    // Create phase orchestrator with execution hardening enabled
    let maxRuntimeMs: number | undefined;
    if (this.config.maxRuntime) {
      maxRuntimeMs = parseHumanTime(this.config.maxRuntime);
    } else if (this.config.ciMode) {
      // Default to 30 minutes in CI mode if not specified
      maxRuntimeMs = 30 * 60 * 1000; // 30 minutes
    }

    const phaseOrchestrator = new PhaseOrchestrator({
      projectRoot: resolve(targetDir),
      thermalController,
      domainAnalyzer,
      reportAggregator,
      statePersistence: this.statePersistence!,
      currentState: this.currentState!,
      applyCooldowns: !this.config.skipThermal,
      phaseTimeoutMs: 300000, // 5 minutes per phase
      maxRuntimeMs, // Global execution timeout
      enableMemoryFlush: true, // Enable memory flush after heavy phases
      enablePartialReports: true, // Write partial reports after each phase
      dryRunMode: !this.config.applyMode, // Default to dry-run, false only if --apply
      yesMode: this.config.yesMode || false, // Skip confirmation prompts
      safeOnly: this.config.safeOnly || false, // Safe-only mode: report only, no modifications
      verboseMode: this.config.verboseMode || false, // Enable verbose logging
      previewDiffs: this.config.previewDiffs || false, // Show batch diff preview before applying fixes
      auditOnly: this.config.auditOnly || false, // Audit-only mode for compliance
      interactiveFix: this.config.interactiveFix || false, // Per-fix interactive approval
      sandboxMode: this.config.sandboxMode || false, // Sandbox mode for isolated execution
    });

    // Execute command
    switch (command) {
      case 'review':
        await this.runReview(phaseOrchestrator, reportAggregator);
        break;
      case 'fix':
        await this.runFix(phaseOrchestrator, reportAggregator);
        break;
      case 'incremental':
        await this.runIncremental(phaseOrchestrator, reportAggregator);
        break;
      case 'help':
        this.printHelp();
        break;
    }

    // Clear state on successful completion
    if (this.statePersistence && this.currentState) {
      await this.statePersistence.clearState();
    }
  }

  /**
   * Sets up SIGINT handler for graceful shutdown
   *
   * @private
   */
  private setupSigintHandler(): void {
    this.sigintHandler = async () => {
      console.log('\n\n[SIGINT] Interrupt signal received. Saving state gracefully...');

      // Attempt to restore from git checkpoint if it exists
      if (this.gitCheckpointManager && this.currentState?.gitCheckpointStashRef) {
        console.log(`[SIGINT] Attempting to restore from git checkpoint: ${this.currentState.gitCheckpointStashRef}`);
        const restoreResult = await this.gitCheckpointManager.restoreFromStash(this.currentState.gitCheckpointStashRef);
        if (restoreResult.success) {
          console.log('[SIGINT] Successfully restored from git checkpoint.');
        } else {
          console.error(`[SIGINT] Failed to restore from git checkpoint: ${restoreResult.error}`);
        }
      }

      if (this.statePersistence && this.currentState) {
        await this.statePersistence.markInterrupted('SIGINT (Ctrl+C)', this.currentState);
        console.log('[SIGINT] State saved. Use "aegis-qa resume" to continue.');
      }

      process.exit(130); // Standard exit code for SIGINT
    };

    process.on('SIGINT', this.sigintHandler);
  }

  private async runReview(phaseOrchestrator: PhaseOrchestrator, reportAggregator: ReportAggregator): Promise<void> {
    if (!this.config.ciMode) {
      console.log('´┐¢ Running Full Review (Phases 0-15)\n');
    }

    const result = await phaseOrchestrator.runFullReview();

    if (result.success) {
      const newViolationCount = reportAggregator.getNewViolationCount();
      const inheritedViolationCount = reportAggregator.getInheritedViolationCount();

      if (!this.config.ciMode) {
        console.log('\nÔ£à Review Complete');
        console.log(`­ƒôè Total Findings: ${result.totalFindings}`);
        console.log(`ÔÅ▒´©Å  Total Time: ${(result.totalExecutionTimeMs / 1000).toFixed(2)}s`);
        console.log(`­ƒå New Issues: ${newViolationCount}`);
        console.log(`­ƒ¥ Inherited Issues: ${inheritedViolationCount}`);
      } else {
        console.log(`Review Complete: ${result.totalFindings} findings, ${(result.totalExecutionTimeMs / 1000).toFixed(2)}s`);
        console.log(`New Issues: ${newViolationCount}, Inherited: ${inheritedViolationCount}`);
      }

      // Smart exit code: success if only inherited errors, failure if new errors
      if (newViolationCount > 0) {
        console.log('\nÔØî New issues detected');
        process.exit(1);
      } else if (inheritedViolationCount > 0) {
        console.log('\nÔ£à No new issues (all errors inherited)');
        process.exit(0);
      }
    } else {
      console.log('\nÔØî Review Failed');
      process.exit(1);
    }
  }

  private async runFix(phaseOrchestrator: PhaseOrchestrator, reportAggregator: ReportAggregator): Promise<void> {
    if (!this.config.ciMode) {
      console.log('­ƒöº Running Atomic Fixes (Phases 16-18)\n');
    }

    const result = await phaseOrchestrator.runFixes();

    if (result.success) {
      const newViolationCount = reportAggregator.getNewViolationCount();
      const inheritedViolationCount = reportAggregator.getInheritedViolationCount();

      if (!this.config.ciMode) {
        console.log('\nÔ£à Fixes Complete');
        console.log(`­ƒôè Total Findings: ${result.totalFindings}`);
        console.log(`Ô£à Fixed: ${result.fixedCount}`);
        console.log(`ÔÜá´©Å  Needs Human Review: ${result.needsHumanReview}`);
        console.log(`ÔØî Failed: ${result.failedCount}`);
        console.log(`­ƒå New Issues: ${newViolationCount}`);
        console.log(`­ƒ¥ Inherited Issues: ${inheritedViolationCount}`);
      } else {
        console.log(`Fixes Complete: ${result.fixedCount} fixed, ${result.needsHumanReview} needs review, ${result.failedCount} failed`);
        console.log(`New Issues: ${newViolationCount}, Inherited: ${inheritedViolationCount}`);
      }

      // Smart exit code: success if only inherited errors, failure if new errors
      if (newViolationCount > 0) {
        console.log('\nÔØî New issues detected');
        process.exit(1);
      } else if (inheritedViolationCount > 0) {
        console.log('\nÔ£à No new issues (all errors inherited)');
        process.exit(0);
      }
    } else {
      console.log('\nÔØî Fixes Failed');
      process.exit(1);
    }
  }

  private async runIncremental(phaseOrchestrator: PhaseOrchestrator, reportAggregator: ReportAggregator): Promise<void> {
    if (!this.config.ciMode) {
      console.log('­ƒöä Running Incremental Review (Phase 19)\n');
    }

    const result = await phaseOrchestrator.runIncrementalReview();

    if (result.success) {
      const newViolationCount = reportAggregator.getNewViolationCount();
      const inheritedViolationCount = reportAggregator.getInheritedViolationCount();

      if (!this.config.ciMode) {
        console.log('\nÔ£à Incremental Review Complete');
        console.log(`­ƒôè Total Findings: ${result.totalFindings}`);
        console.log(`ÔÅ▒´©Å  Total Time: ${(result.totalExecutionTimeMs / 1000).toFixed(2)}s`);
        console.log(`­ƒå New Issues: ${newViolationCount}`);
        console.log(`­ƒ¥ Inherited Issues: ${inheritedViolationCount}`);
      } else {
        console.log(`Incremental Review Complete: ${result.totalFindings} findings, ${(result.totalExecutionTimeMs / 1000).toFixed(2)}s`);
        console.log(`New Issues: ${newViolationCount}, Inherited: ${inheritedViolationCount}`);
      }

      // Smart exit code: success if only inherited errors, failure if new errors
      if (newViolationCount > 0) {
        console.log('\nÔØî New issues detected');
        process.exit(1);
      } else if (inheritedViolationCount > 0) {
        console.log('\nÔ£à No new issues (all errors inherited)');
        process.exit(0);
      }
    } else {
      console.log('\nÔØî Incremental Review Failed');
      process.exit(1);
    }
  }

  private printHelp(): void {
    console.log(`
Aegis QA - Advanced Quality Assurance Orchestrator

USAGE:
  aegis-qa review [directory]    Full review (phases 0-15)
  aegis-qa fix [directory]       Atomic fixes (phases 16-18)
  aegis-qa incremental [dir]     Incremental review (phase 19)
  aegis-qa help                  Show this help message

EXAMPLES:
  aegis-qa review ./src
  aegis-qa fix .
  aegis-qa incremental ./src

OPTIONS:
  [directory]                   Target directory (default: current directory)
  --apply                       Apply fixes to filesystem (default: dry-run mode)
  --yes, -y                     Skip confirmation prompts (use with --apply)
  --verbose, -v                 Enable verbose logging for debugging
  --ci                          CI mode (minimalist output, permissive thermal locks)
  --sandbox                     Run in isolated sandbox mode (generates patch file)
  --no-write                    Enable read-only mode (blocks all filesystem writes at infrastructure level)
  CI=true                       Set environment variable to enable CI mode

SAFETY:
  By default, Aegis runs in dry-run mode. Use --apply to write changes.
  Auto-backup is created before applying any fixes.
  Interactive confirmation is required unless --yes is specified.
  Sandbox mode creates an isolated copy and generates a patch file.

For more information, visit: https://github.com/mxrcabrera/aegis-qa
`);
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);

  const command = (args[0] || 'review') as 'review' | 'fix' | 'incremental' | 'help';
  const targetDir = args[1] || '.';
  const ciMode = args.includes('--ci') || process.env.CI === 'true';
  const applyMode = args.includes('--apply');
  const yesMode = args.includes('--yes') || args.includes('-y');
  const verboseMode = args.includes('--verbose') || args.includes('-v');
  const safeOnly = args.includes('--safe-only');
  const previewDiffs = args.includes('--preview-diffs');
  const auditOnly = args.includes('--audit-only');
  const interactiveFix = args.includes('--interactive-fix');
  const sandboxMode = args.includes('--sandbox');
  const noWriteMode = args.includes('--no-write');

  // Parse --max-runtime flag
  const maxRuntimeIndex = args.indexOf('--max-runtime');
  let maxRuntime: string | undefined;
  if (maxRuntimeIndex !== -1 && args[maxRuntimeIndex + 1]) {
    maxRuntime = args[maxRuntimeIndex + 1];
  }

  // Security: Validate all input before proceeding
  try {
    AegisCLI.validateInput(command, targetDir, applyMode, yesMode);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }

  const cli = new AegisCLI({
    command,
    targetDir,
    skipThermal: false,
    ciMode,
    applyMode,
    yesMode,
    verboseMode,
    safeOnly,
    previewDiffs,
    auditOnly,
    interactiveFix,
    sandboxMode,
    noWriteMode,
    maxRuntime,
  });

  try {
    await cli.run();
  } catch (error) {
    ErrorMessages.logError(error as Error, verboseMode);
    process.exit(1);
  }
}

main();
