/**
 * Phase 20: Intelligent Report Comparison
 *
 * Purpose: Executive summary of Aegis QA.
 *
 * Architecture:
 * - Diff-Based Report: Compare previous qa-report.md with current
 * - Success Metrics (ROI): Calculate remediation time saved (15 min per fix)
 * - Regression Warning: Detect if FIXED errors reappear
 * - Hardware Guard (Final Log): Generate Thermal Profile and save to .aegis/logs/performance.json
 *
 * @module phases/phase-20-intelligent-report-comparison
 * @since 2.0.0
 */
import { ThermalController } from '../core/thermal-controller.js';
import { StatePersistence, type ExecutionState } from '../core/state-persistence.js';
/**
 * Severity comparison
 */
interface SeverityComparison {
    /** Critical changes */
    critical: number;
    /** High changes */
    high: number;
    /** Medium changes */
    medium: number;
    /** Low changes */
    low: number;
}
/**
 * Success metrics
 */
interface SuccessMetrics {
    /** Fixes applied successfully */
    fixesApplied: number;
    /** Time saved per fix (minutes) */
    timePerFix: number;
    /** Total time saved (minutes) */
    totalTimeSavedMinutes: number;
    /** Total time saved (hours) */
    totalTimeSavedHours: number;
    /** Complex fixes (30 min each) */
    fixesComplex: number;
    /** Simple fixes (5 min each) */
    fixesSimple: number;
    /** Standard fixes (15 min each) */
    fixesStandard: number;
}
/**
 * Regression warning
 */
interface RegressionWarning {
    /** Regression ID */
    id: string;
    /** File path */
    filePath: string;
    /** Error type */
    errorType: string;
    /** Previous status */
    previousStatus: 'FIXED';
    /** Current status */
    currentStatus: 'FOUND';
    /** Description */
    description: string;
}
/**
 * Thermal profile
 */
interface ThermalProfile {
    /** Session timestamp */
    timestamp: string;
    /** Cooldown activations */
    cooldownActivations: number;
    /** Average RAM consumption */
    averageRamUsage: number;
    /** Peak CPU usage */
    peakCpuUsage: number;
    /** Total execution time (ms) */
    totalExecutionTimeMs: number;
    /** Thermal events */
    thermalEvents: string[];
    /** Recommendation */
    recommendation?: string;
}
/**
 * Phase 20 configuration
 */
interface Phase20Config {
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
 * Phase 20 result
 */
export interface Phase20Result {
    /** Overall success */
    success: boolean;
    /** Severity comparison */
    severityComparison: SeverityComparison;
    /** Success metrics */
    successMetrics: SuccessMetrics;
    /** Regression warnings */
    regressionWarnings: RegressionWarning[];
    /** Thermal profile */
    thermalProfile: ThermalProfile;
    /** Execution time in milliseconds */
    executionTimeMs: number;
    /** Error if failed */
    error?: string;
}
/**
 * Phase 20: Intelligent Report Comparison
 *
 * This phase generates the executive summary of Aegis QA.
 *
 * @class Phase20IntelligentReportComparison
 */
export declare class Phase20IntelligentReportComparison {
    private config;
    private thermalEvents;
    private cooldownCount;
    private cpuReadings;
    private ramReadings;
    private startTime;
    constructor(config: Phase20Config);
    /**
     * Executes Phase 20: Intelligent Report Comparison
     *
     * @returns Promise<Phase20Result> - Intelligent report comparison result
     */
    execute(): Promise<Phase20Result>;
    /**
     * Performs Diff-Based Report (PUNTO 1)
     *
     * @private
     * @returns Promise<SeverityComparison> - Severity comparison
     */
    private performDiffBasedReport;
    /**
     * Gets previous report from StatePersistence
     *
     * @private
     * @returns string | null - Previous report content
     */
    private getPreviousReport;
    /**
     * Extracts severity counts from report
     *
     * @private
     * @param report - Report content
     * @returns SeverityComparison - Severity counts
     */
    private extractSeverityCounts;
    /**
     * Calculates Success Metrics ROI with Sensitivity Adjustment (PUNTO 1)
     *
     * PUNTO 1: ROI Sensitivity Adjustment
     *
     * LÓGICA DE ROI AJUSTADO:
     * - No todos los fixes valen 15 minutos
     * - Si fix fue en archivo con Blast Radius >10 o Core Path, subir ahorro a 30 minutos
     * - Si fue fix de estilo simple, bajar a 5 minutos
     * - Refinar cálculo del ROI para que sea más realista
     * - Esto diferencia el valor de un fix en el corazón del sistema vs uno periférico
     *
     * @private
     * @returns SuccessMetrics - Success metrics
     */
    private calculateSuccessMetrics;
    /**
     * Detects Regressions (PUNTO 3)
     *
     * @private
     * @returns Promise<RegressionWarning[]> - Regression warnings
     */
    private detectRegressions;
    /**
     * Gets current findings
     *
     * @private
     * @returns Finding[] - Current findings
     */
    private getCurrentFindings;
    /**
     * Gets previous findings from StatePersistence
     *
     * @private
     * @returns Finding[] - Previous findings
     */
    private getPreviousFindings;
    /**
     * Generates Thermal Profile with Insights (PUNTO 2)
     *
     * PUNTO 2: Thermal Stress Insights
     *
     * LÓGICA DE THERMAL STRESS INSIGHTS:
     * - El performance.json no debe ser solo un log
     * - Debe incluir un consejo final
     * - Si el pico de CPU fue >90% durante más del 30% del tiempo, agregar recomendación
     * - Recomendación: 'Se recomienda aumentar el cooldown o reducir el batch size en este hardware'
     *
     * @private
     * @returns Promise<ThermalProfile> - Thermal profile
     */
    private generateThermalProfile;
    /**
     * Saves Thermal Profile to disk
     *
     * @private
     * @param profile - Thermal profile
     * @returns Promise<void>
     */
    private saveThermalProfile;
    /**
     * Detects Historical Drift (PUNTO 3)
     *
     * PUNTO 3: Historical Drift Detection
     *
     * LÓGICA DE HISTORICAL DRIFT DETECTION:
     * - Guardar historial de los últimos 5 reportes en .aegis/history/
     * - Si la tendencia de errores es alcista (cada vez hay más errores), disparar alerta
     * - Alerta: [TECHNICAL-DEBT-ALERT] en el resumen ejecutivo
     *
     * @private
     * @returns Promise<string | null> - Drift alert or null
     */
    private detectHistoricalDrift;
    /**
     * Self-Destruct Secure Mode (PUNTO 4)
     *
     * PUNTO 4: Self-Destruct Secure Mode
     *
     * LÓGICA DE SELF-DESTRUCT SECURE MODE:
     * - Si durante la generación del reporte final Aegis detecta que qa-report.md contiene secreto
     * - Censurar automáticamente antes de escribirlo en disco
     * - Previene filtración accidental de API Keys, Tokens desde logs de las fases
     *
     * @private
     * @returns Promise<void>
     */
    private selfDestructSecureMode;
    /**
     * Tracks thermal events during execution
     *
     * @private
     * @returns void
     */
    private trackThermalEvents;
}
export {};
//# sourceMappingURL=phase-20-intelligent-report-comparison.d.ts.map