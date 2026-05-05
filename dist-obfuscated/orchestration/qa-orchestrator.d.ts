/**
 * QA Orchestrator - Principal Orquestador de Aegis QA
 *
 * Coordinador principal que combina todos los componentes para ejecutar
 * auditorías completas de calidad con protección de hardware y análisis IA.
 *
 * @module orchestration/qa-orchestrator
 * @version 1.0.0
 */
import { ReportAggregator } from '../core/reporter.js';
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
export declare class QAOrchestrator {
    private config;
    private thermalController;
    private secretManager;
    private statePersistence;
    private reportAggregator;
    private phaseOrchestrator;
    private domainAnalyzer;
    private cloudCostDetection;
    private predictiveBugDetection;
    private domainInference;
    constructor(config: QAOrchestratorConfig);
    /**
     * Inicializa el orquestador
     */
    initialize(): Promise<void>;
    /**
     * Ejecuta la auditoría completa
     */
    runAudit(): Promise<OrchestratorResult>;
    /**
     * Obtiene el reporte agregado
     */
    getReport(): ReportAggregator;
    /**
     * Limpia recursos
     */
    cleanup(): Promise<void>;
}
export default QAOrchestrator;
//# sourceMappingURL=qa-orchestrator.d.ts.map