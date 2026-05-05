/**
 * Phase 15: CI/CD & DevOps
 *
 * Purpose: Audit automation and environments including CI workflows, deployment scripts,
 * and infrastructure configuration files.
 *
 * Architecture:
 * - Workflow Audit: Detect .github/workflows/, GitLab CI, CircleCI config files
 * - Health Check de CI: Verify workflows run test and build steps
 * - Deployment Leak Prevention: Search for hardcoded URLs/credentials in deployment scripts
 * - Infrastructure Hardening: Verify environment config files exist (vercel.json, docker-compose.yml)
 * - Thermal Verification: Mandatory resource check before analyzing YAML/JSON
 *
 * @module phases/phase-15-cicd-devops
 * @since 2.0.0
 */
import { ThermalController } from '../core/thermal-controller.js';
import { StatePersistence, type ExecutionState } from '../core/state-persistence.js';
/**
 * CI/CD finding
 */
interface CICDFinding {
    /** Unique ID based on file hash + line */
    id: string;
    /** Finding type */
    type: 'workflow-detected' | 'ci-health-check' | 'deployment-leak' | 'missing-infra-config';
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
    /** The leaked credential type (for deployment leaks) */
    leakType?: string;
}
/**
 * CI/CD audit result
 */
interface CICDAuditResult {
    /** CI platform detected */
    ciPlatform: 'github' | 'gitlab' | 'circleci' | 'none';
    /** Workflow files found */
    workflowFiles: string[];
    /** Workflows with only checkout (Low severity) */
    checkoutOnlyWorkflows: string[];
    /** Workflows with test/build steps */
    healthyWorkflows: string[];
    /** Deployment leaks detected */
    deploymentLeaks: Array<{
        path: string;
        line: number;
        type: string;
        value: string;
    }>;
    /** Infrastructure config files found */
    infraConfigFiles: string[];
    /** Missing infrastructure config */
    missingInfraConfig: string[];
}
/**
 * Phase 15 configuration
 */
interface Phase15Config {
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
 * Phase 15 result
 */
export interface Phase15Result {
    /** Overall success */
    success: boolean;
    /** Total files analyzed */
    totalFiles: number;
    /** CI/CD findings */
    cicdFindings: CICDFinding[];
    /** CI/CD audit result */
    cicdAudit: CICDAuditResult;
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
 * Phase 15: CI/CD & DevOps
 *
 * This phase audits CI/CD workflows, deployment scripts, and infrastructure configuration.
 *
 * @class Phase15CICDDevOps
 */
export declare class Phase15CICDDevOps {
    private config;
    constructor(config: Phase15Config);
    /**
     * Executes Phase 15: CI/CD & DevOps
     *
     * @returns Promise<Phase15Result> - CI/CD assessment result
     */
    execute(): Promise<Phase15Result>;
    /**
     * Performs CI/CD audit
     *
     * @private
     * @returns Promise<CICDAuditResult> - CI/CD audit result
     */
    private performCICDAudit;
    /**
     * Analyzes GitHub Actions workflow file
     *
     * @private
     * @param filePath - Workflow file path
     * @param result - CI/CD audit result
     */
    private analyzeGitHubWorkflow;
    /**
     * Analyzes GitLab CI configuration
     *
     * @private
     * @param filePath - GitLab CI file path
     * @param result - CI/CD audit result
     */
    private analyzeGitLabCI;
    /**
     * Analyzes CircleCI configuration
     *
     * @private
     * @param filePath - CircleCI file path
     * @param result - CI/CD audit result
     */
    private analyzeCircleCI;
    /**
     * Detects deployment leaks (hardcoded URLs, credentials)
     *
     * LÓGICA PARA PUNTO 3 (Deployment Leak Prevention):
     *
     * 1. Busca patrones de URLs de producción/staging:
     *    - https://api.production.com
     *    - https://staging.example.com
     *    - https://prod.example.com
     *    - *.production.*, *.staging.*, *.prod.*
     *
     * 2. Busca credenciales hardcodeadas:
     *    - AWS: AWS_ACCESS_KEY_ID=, AWS_SECRET_ACCESS_KEY=, AKIAIOSFODNN7EXAMPLE
     *    - Vercel: VERCEL_TOKEN=, VERCEL_API_KEY=
     *    - Generic: API_KEY=, SECRET_KEY=, PRIVATE_KEY=
     *    - Database: DATABASE_URL=, MONGODB_URI=
     *
     * 3. Busca tokens JWT hardcodeados (patrón eyJhbGciOiJIUzI1NiIs...)
     *
     * 4. Busca passwords hardcodeados (PASSWORD=, PASS=, pwd=)
     *
     * @private
     * @param filePath - File path to analyze
     * @returns Array<{ path: string; line: number; type: string; value: string }> - Detected leaks
     */
    private detectDeploymentLeaks;
    /**
     * Sanitizes credential value for reporting
     *
     * @private
     * @param value - Credential value
     * @returns string - Sanitized value
     */
    private sanitizeCredential;
    /**
     * Generates findings from CI/CD audit
     *
     * @private
     * @param audit - CI/CD audit result
     * @returns CICDFinding[] - Array of findings
     */
    private generateFindingsFromAudit;
    /**
     * Writes partial report for Phase 15
     *
     * @private
     * @param findings - CI/CD findings
     * @param audit - CI/CD audit result
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
//# sourceMappingURL=phase-15a-cicd-devops.d.ts.map