/**
 * Aegis CLI - Command Line Interface for Aegis QA Orchestrator
 *
 * Purpose: Provides CLI commands for running Aegis QA operations
 * including review, fix, and incremental review modes.
 *
 * @module cli
 * @since 1.0.0
 */

import { resolve } from 'path';
import { ThermalController } from './core/thermal-controller.js';
import { SecretManager } from './core/secret-manager.js';
import { DomainAnalyzer } from './inference/domain-analyzer.js';
import { ReportAggregator } from './modules/report-aggregator.js';
import { StatePersistence } from './core/state-persistence.js';
import { PhaseOrchestrator } from './orchestration/phase-orchestrator.js';

interface CLIConfig {
  command: 'review' | 'fix' | 'incremental' | 'help';
  targetDir: string;
  skipThermal: boolean;
}

class AegisCLI {
  private config: CLIConfig;
  private thermalController: ThermalController;
  private secretManager: SecretManager;
  private statePersistence: StatePersistence | null = null;
  private currentState: any = null;
  private sigintHandler: (() => void) | null = null;

  constructor(config: CLIConfig) {
    this.config = config;
    this.thermalController = new ThermalController();
    this.secretManager = new SecretManager();
  }

  async run(): Promise<void> {
    const { command, targetDir } = this.config;

    // Initialize state persistence
    this.statePersistence = new StatePersistence({
      projectRoot: resolve(targetDir),
    });

    // Load existing state if available
    this.currentState = await this.statePersistence.loadState();

    // Initialize report aggregator
    const reportAggregator = new ReportAggregator({
      projectRoot: resolve(targetDir),
    });

    // Set up SIGINT handler for graceful shutdown
    this.setupSigintHandler();

    // Run self-diagnostic stress test on startup
    if (!this.config.skipThermal) {
      console.log('🔍 Running self-diagnostic stress test...');
      const diagnosticResult = await this.thermalController.runSelfDiagnostic(5000);
      console.log(`  Diagnostic passed: ${diagnosticResult.pass}`);
      console.log(`  Temperature rise rate: ${diagnosticResult.temperatureRiseRate.toFixed(2)}°C/s`);
      console.log(`  Thresholds adjusted: ${diagnosticResult.adjustedThresholds}`);
      console.log('✅ Self-diagnostic complete\n');
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
    }, this.secretManager);

    // Detect hardware capabilities
    console.log('🔍 Detecting hardware capabilities...');
    const hardwareProfile = await this.thermalController.detectHardwareCapabilities();
    console.log(`  GPU: ${hardwareProfile.hasGPU ? hardwareProfile.gpuModel : 'Not detected'}`);
    console.log(`  VRAM: ${hardwareProfile.gpuVRAM ? `${hardwareProfile.gpuVRAM}GB` : 'N/A'}`);
    console.log(`  CPU Cores: ${hardwareProfile.cpuCores}`);
    console.log(`  RAM: ${hardwareProfile.ramTotal}GB`);
    console.log(`  Recommended Batch Size: ${hardwareProfile.recommendedBatchSize}`);
    console.log(`  Recommended Cooldown: ${hardwareProfile.recommendedCooldown}ms`);
    console.log('✅ Hardware detection complete\n');

    // Create phase orchestrator with execution hardening enabled
    const phaseOrchestrator = new PhaseOrchestrator({
      projectRoot: resolve(targetDir),
      thermalController: this.thermalController,
      domainAnalyzer,
      reportAggregator,
      statePersistence: this.statePersistence!,
      currentState: this.currentState!,
      applyCooldowns: !this.config.skipThermal,
      phaseTimeoutMs: 300000, // 5 minutes per phase
      enableMemoryFlush: true, // Enable memory flush after heavy phases
      enablePartialReports: true, // Write partial reports after each phase
    });

    // Execute command
    switch (command) {
      case 'review':
        await this.runReview(phaseOrchestrator);
        break;
      case 'fix':
        await this.runFix(phaseOrchestrator);
        break;
      case 'incremental':
        await this.runIncremental(phaseOrchestrator);
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
      
      if (this.statePersistence && this.currentState) {
        await this.statePersistence.markInterrupted('SIGINT (Ctrl+C)', this.currentState);
        console.log('[SIGINT] State saved. Use "aegis-qa resume" to continue.');
      }

      process.exit(130); // Standard exit code for SIGINT
    };

    process.on('SIGINT', this.sigintHandler);
  }

  private async runReview(phaseOrchestrator: PhaseOrchestrator): Promise<void> {
    console.log('🔍 Running Full Review (Phases 0-15)\n');

    const result = await phaseOrchestrator.runFullReview();

    if (result.success) {
      console.log('\n✅ Review Complete');
      console.log(`📊 Total Findings: ${result.totalFindings}`);
      console.log(`⏱️ Total Time: ${(result.totalExecutionTimeMs / 1000).toFixed(2)}s`);
    } else {
      console.log('\n❌ Review Failed');
      process.exit(1);
    }
  }

  private async runFix(phaseOrchestrator: PhaseOrchestrator): Promise<void> {
    console.log('🔧 Running Atomic Fixes (Phases 16-18)\n');

    const result = await phaseOrchestrator.runFixes();

    if (result.success) {
      console.log('\n✅ Fixes Complete');
      console.log(`📊 Total Findings: ${result.totalFindings}`);
      console.log(`✅ Fixed: ${result.fixedCount}`);
      console.log(`👁️ Needs Human Review: ${result.needsHumanReview}`);
      console.log(`❌ Failed: ${result.failedCount}`);
    } else {
      console.log('\n❌ Fixes Failed');
      process.exit(1);
    }
  }

  private async runIncremental(phaseOrchestrator: PhaseOrchestrator): Promise<void> {
    console.log('🔄 Running Incremental Review (Phase 19)\n');

    const result = await phaseOrchestrator.runIncrementalReview();

    if (result.success) {
      console.log('\n✅ Incremental Review Complete');
      console.log(`📊 Total Findings: ${result.totalFindings}`);
      console.log(`⏱️ Total Time: ${(result.totalExecutionTimeMs / 1000).toFixed(2)}s`);
    } else {
      console.log('\n❌ Incremental Review Failed');
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

For more information, visit: https://github.com/mxrcabrera/aegis-qa
    `);
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);

  const command = (args[0] || 'review') as 'review' | 'fix' | 'incremental' | 'help';
  const targetDir = args[1] || '.';

  if (!['review', 'fix', 'incremental', 'help'].includes(command)) {
    console.error(`❌ Unknown command: ${command}`);
    console.log('Run "aegis-qa help" for usage information');
    process.exit(1);
  }

  const cli = new AegisCLI({
    command,
    targetDir,
    skipThermal: false,
  });

  try {
    await cli.run();
  } catch (error) {
    console.error('❌ Execution failed:', error);
    process.exit(1);
  }
}

main();
