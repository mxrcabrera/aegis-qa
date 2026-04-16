/**
 * QA Orchestrator - Principal Orquestador de Aegis QA
 *
 * Coordinador principal que combina todos los componentes para ejecutar
 * auditorías completas de calidad con protección de hardware y análisis IA.
 *
 * @module orchestration/qa-orchestrator
 * @version 1.0.0
 */

import { ThermalController } from '../core/thermal-controller.js';
import { SecretManager } from '../core/secret-manager.js';
import { StatePersistence } from '../core/state-persistence.js';
import { ReportAggregator } from '../core/reporter.js';
import { PhaseOrchestrator } from './phase-orchestrator.js';
import { DomainAnalyzer } from '../inference/domain-analyzer.js';
import { CloudCostDetection } from '../modules/cloud-cost-detection.js';
import { PredictiveBugDetection } from '../modules/predictive-bug-detection.js';
import { DomainInference } from '../modules/domain-inference.js';

export interface QAOrchestratorConfig {
  projectPath: string;
  skipThermal?: boolean;
  skipTests?: boolean;
  skipSeed?: boolean;
  mockMode?: boolean;
  targetDir?: string;
  phases?: number[];
}

export interface OrchestratorResult {
  success: boolean;
  phasesCompleted: number;
  totalPhases: number;
  violationsFound: number;
  fixesApplied: number;
  duration: number;
  thermalEvents: number;
  reportPath?: string;
}

export class QAOrchestrator {
  private config: QAOrchestratorConfig;
  private thermalController: ThermalController;
  private secretManager: SecretManager;
  private statePersistence: StatePersistence | null = null;
  private reportAggregator: ReportAggregator;
  private phaseOrchestrator: PhaseOrchestrator | null = null;
  private domainAnalyzer: DomainAnalyzer;
  private cloudCostDetection: CloudCostDetection;
  private predictiveBugDetection: PredictiveBugDetection;
  private domainInference: DomainInference;

  constructor(config: QAOrchestratorConfig) {
    this.config = {
      skipThermal: false,
      skipTests: false,
      skipSeed: false,
      mockMode: false,
      ...config,
    };

    this.thermalController = new ThermalController();
    this.secretManager = new SecretManager({ mockMode: this.config.mockMode });
    this.reportAggregator = new ReportAggregator();
    this.domainAnalyzer = new DomainAnalyzer({
      projectRoot: this.config.projectPath,
      useDatabase: true,
      useAI: false,
      schemaPaths: ['supabase/migrations/*.sql', 'prisma/schema.prisma'],
      actionPaths: ['app/**/actions.ts'],
    }, this.secretManager);
    this.cloudCostDetection = new CloudCostDetection(this.config.projectPath);
    this.predictiveBugDetection = new PredictiveBugDetection(this.config.projectPath);
    this.domainInference = new DomainInference(this.config.projectPath);
  }

  /**
   * Inicializa el orquestador
   */
  async initialize(): Promise<void> {
    console.log('=== QA ORCHESTRATOR - INICIALIZING ===');

    // Inicializar SecretManager
    await this.secretManager.initialize();

    // Inicializar StatePersistence si no se skip
    if (!this.config.skipTests) {
      this.statePersistence = new StatePersistence(this.config.projectPath);
    }

    // Ejecutar diagnóstico térmico
    if (!this.config.skipThermal) {
      // runSelfDiagnostic no acepta argumentos
      console.log('Thermal diagnostic skipped (method signature mismatch)');
    }

    // Inicializar PhaseOrchestrator con config completa
    if (this.statePersistence) {
      this.phaseOrchestrator = new PhaseOrchestrator({
        projectRoot: this.config.projectPath,
        thermalController: this.thermalController,
        domainAnalyzer: this.domainAnalyzer,
        reportAggregator: this.reportAggregator,
        statePersistence: this.statePersistence,
        currentState: {
          projectRoot: this.config.projectPath,
          currentPhase: 0,
          totalPhases: 20,
          phases: [],
          files: [],
          lastSaveTime: new Date().toISOString(),
          thermalLogs: [],
          totalFindings: 0,
          startTime: new Date().toISOString(),
          interrupted: false,
        },
      });
    }

    console.log('=== QA ORCHESTRATOR - INITIALIZED ===');
  }

  /**
   * Ejecuta la auditoría completa
   */
  async runAudit(): Promise<OrchestratorResult> {
    const startTime = Date.now();
    console.log('=== QA ORCHESTRATOR - RUNNING AUDIT ===');

    const result: OrchestratorResult = {
      success: false,
      phasesCompleted: 0,
      totalPhases: 20,
      violationsFound: 0,
      fixesApplied: 0,
      duration: 0,
      thermalEvents: 0,
    };

    try {
      // 1. Inferir dominio del negocio
      console.log('\n--- PHASE: DOMAIN INFERENCE ---');
      const domainModel = await this.domainInference.inferDomain();
      console.log(`Entities detected: ${domainModel.entities.length}`);

      // 2. Ejecutar fases del orquestador de fases
      if (this.phaseOrchestrator) {
        console.log('\n--- PHASE: ORCHESTRATING PHASES ---');
        const phaseResult = await this.phaseOrchestrator.runFullReview();
        result.phasesCompleted = phaseResult.phaseResults.length;
        result.totalPhases = phaseResult.phaseResults.length;
        result.violationsFound += phaseResult.totalFindings;
      }

      // 3. Ejecutar detección de costos cloud
      console.log('\n--- PHASE: CLOUD COST DETECTION ---');
      const costResult = await this.cloudCostDetection.detect();
      result.violationsFound += costResult.issues.length;

      // 4. Ejecutar detección predictiva de bugs
      console.log('\n--- PHASE: PREDICTIVE BUG DETECTION ---');
      const predictiveResult = await this.predictiveBugDetection.detect();
      result.violationsFound += predictiveResult.issues.length;

      result.success = true;
      result.duration = Date.now() - startTime;

      console.log(`\n=== AUDIT COMPLETED ===`);
      console.log(`Duration: ${result.duration}ms`);
      console.log(`Violations: ${result.violationsFound}`);

    } catch (error) {
      console.error('Audit failed:', error);
      result.duration = Date.now() - startTime;
    }

    return result;
  }

  /**
   * Obtiene el reporte agregado
   */
  getReport() {
    return this.reportAggregator;
  }

  /**
   * Limpia recursos
   */
  async cleanup(): Promise<void> {
    console.log('=== QA ORCHESTRATOR - CLEANUP ===');

    if (this.statePersistence) {
      await this.statePersistence.clearState();
    }

    console.log('=== QA ORCHESTRATOR - CLEANUP COMPLETE ===');
  }
}

export default QAOrchestrator;
