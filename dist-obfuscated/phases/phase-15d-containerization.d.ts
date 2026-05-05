/**
 * Phase 15C: Containerization
 *
 * Purpose: Audit Dockerfile and container configurations for security and cost issues.
 *
 * Architecture:
 * - Dockerfile Audit: Detect USER root usage, latest images, secrets in ENV
 * - Cost Efficiency: Detect oversized instances for dev environments
 * - Hardware Guard: Monitor RAM, pause if > 90%
 *
 * @module phases/phase-15c-containerization
 * @since 2.0.0
 */
import { ThermalController } from '../core/thermal-controller.js';
import { StatePersistence, type ExecutionState } from '../core/state-persistence.js';
/**
 * Containerization finding
 */
interface ContainerizationFinding {
    /** Unique ID based on file hash + line */
    id: string;
    /** Finding type */
    type: 'dockerfile-detected' | 'security-issue' | 'cost-inefficiency';
    /** Severity: low, medium, high, critical */
    severity: 'low' | 'medium' | 'high' | 'critical';
    /** File path */
    filePath: string;
    /** Line number */
    line?: number;
    /** Description of the issue */
    description: string;
    /** Suggested fix */
    suggestion?: string;
    /** Whether in Core Path */
    isCorePath?: boolean;
    /** The security issue type (for security issues) */
    securityType?: string;
}
/**
 * Containerization audit result
 */
interface ContainerizationAuditResult {
    /** Dockerfile files found */
    dockerfileFiles: string[];
    /** Security issues detected */
    securityIssues: Array<{
        path: string;
        line: number;
        type: string;
        value: string;
    }>;
    /** Cost inefficiencies detected */
    costInefficiencies: Array<{
        path: string;
        line: number;
        type: string;
        value: string;
    }>;
    /** Total files analyzed */
    totalFilesAnalyzed: number;
}
/**
 * Phase 15C configuration
 */
interface Phase15CConfig {
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
 * Phase 15C result
 */
export interface Phase15CResult {
    /** Overall success */
    success: boolean;
    /** Total files analyzed */
    totalFiles: number;
    /** Containerization findings */
    containerizationFindings: ContainerizationFinding[];
    /** Containerization audit result */
    containerizationAudit: ContainerizationAuditResult;
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
 * Phase 15C: Containerization
 *
 * This phase audits Dockerfile and container configurations for security and cost issues.
 *
 * @class Phase15CContainerization
 */
export declare class Phase15CContainerization {
    private config;
    constructor(config: Phase15CConfig);
    /**
     * Executes Phase 15C: Containerization
     *
     * @returns Promise<Phase15CResult> - Containerization assessment result
     */
    execute(): Promise<Phase15CResult>;
    /**
     * Performs containerization audit
     *
     * @private
     * @returns Promise<ContainerizationAuditResult> - Containerization audit result
     */
    private performContainerizationAudit;
    /**
     * Finds Dockerfile files in the repository
     *
     * @private
     * @returns Promise<string[]> - Array of file paths
     */
    private findDockerfiles;
    /**
     * Checks if the project is a production environment
     *
     * @private
     * @returns boolean - Whether project is production
     */
    private isProductionEnvironment;
    /**
     * Runs Self-Audit de Infra
     * Verifies if Aegis QA's own Dockerfile or deployment configs comply with No Root and No Latest rules
     *
     * @private
     * @returns { passed: boolean; reason?: string } - Self-audit result
     */
    private runSelfAudit;
    /**
     * Analyzes Dockerfile for security and cost issues
     *
     * LÓGICA PARA PUNTO 2 (Dockerfile Audit):
     *
     * 1. Detección de USER root:
     *    - Busca líneas con "USER root" o "USER 0"
     *    - Reporta como 'high' severity (riesgo de seguridad alto)
     *
     * 2. Detección de imágenes base sin versión específica:
     *    - Busca "FROM" seguido de ":latest" o sin tag
     *    - Ejemplos: FROM node:latest, FROM ubuntu, FROM python
     *    - Reporta como 'medium' severity (riesgo de reproducibilidad)
     *
     * 3. Detección de secrets inyectados vía ENV:
     *    - Busca ENV con patrones de credenciales: API_KEY, SECRET_KEY, PASSWORD, DATABASE_URL
     *    - Reporta como 'critical' severity (fuga de secretos)
     *    - Sugerencia: Usar Docker Secrets o env vars en runtime
     *
     * 4. Dockerfile Multi-Stage Check:
     *    - Cuenta el número de instrucciones FROM
     *    - Si es producción y solo tiene un FROM con imagen pesada, reporta como 'low'
     *    - Sugerencia: Usar multi-stage builds para optimizar tamaño/seguridad
     *
     * @private
     * @param filePath - Dockerfile path
     * @param result - Containerization audit result
     */
    private analyzeDockerfile;
    /**
     * Generates findings from containerization audit
     *
     * @private
     * @param audit - Containerization audit result
     * @returns ContainerizationFinding[] - Array of findings
     */
    private generateFindingsFromAudit;
    /**
     * Gets security suggestion based on issue type
     *
     * @private
     * @param type - Security issue type
     * @returns string - Suggestion
     */
    private getSecuritySuggestion;
    /**
     * Writes partial report for Phase 15C
     *
     * @private
     * @param findings - Containerization findings
     * @param audit - Containerization audit result
     */
    private writePartialReport;
    /**
     * Generates a unique finding ID
     *
     * @private
     * @param filePath - File path
     * @param line - Line number
     * @param type - Finding type
     * @returns string - Unique finding ID
     */
    private generateFindingId;
}
export {};
//# sourceMappingURL=phase-15d-containerization.d.ts.map