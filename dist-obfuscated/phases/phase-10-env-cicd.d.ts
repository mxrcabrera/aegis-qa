/**
 * Phase 10: Environment & CI/CD
 *
 * Purpose: Audit environment configuration, variables, and pipelines for secure and repeatable deploys.
 * Focus on Environment Health, CI/CD Configuration, Security Checks, and Dependency Health.
 *
 * Architecture:
 * - Environment Health: .env.example presence, Environment Mismatch detection
 * - CI/CD Configuration: GitHub Actions, GitLab CI, Vercel detection
 * - Security Check: Secrets in repo, cross-reference with Phase 3
 * - Dependency Health: Vulnerabilities, Engines Mismatch
 *
 * @module phases/phase-10-env-cicd
 * @since 2.0.0
 */
import { StatePersistence, type ExecutionState } from '../core/state-persistence.js';
/**
 * Environment & CI/CD finding
 */
interface EnvCICDFinding {
    /** Unique ID based on file hash + line */
    id: string;
    /** Finding type */
    type: 'missing-env-example' | 'env-mismatch' | 'missing-cicd' | 'secret-leak' | 'dependency-vulnerability' | 'engines-mismatch' | 'env-cicd-issue' | 'unconfigured-circuit' | 'infrastructure-drift';
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
}
/**
 * Phase 10 configuration
 */
interface Phase10Config {
    /** Project root directory */
    projectRoot: string;
    /** State persistence for storing results */
    statePersistence: StatePersistence;
    /** Current execution state */
    currentState: ExecutionState;
}
/**
 * Phase 10 result
 */
export interface Phase10Result {
    /** Overall success */
    success: boolean;
    /** Environment & CI/CD findings */
    findings: EnvCICDFinding[];
    /** Total critical findings */
    criticalFindings: number;
    /** Total high severity findings */
    highSeverityFindings: number;
    /** Execution time in milliseconds */
    executionTimeMs: number;
    /** Error if failed */
    error?: string;
}
/**
 * Phase 10: Environment & CI/CD
 *
 * This phase audits environment configuration, variables, and pipelines for secure and repeatable deploys.
 * Focuses on Environment Health, CI/CD Configuration, Security Checks, and Dependency Health.
 *
 * @class Phase10EnvCICD
 * @example
 * ```typescript
 * const phase10 = new Phase10EnvCICD({
 *   projectRoot: '/path/to/project',
 *   statePersistence: new StatePersistence('/path/to/project'),
 *   currentState: executionState,
 * });
 * const result = await phase10.execute();
 * ```
 */
export declare class Phase10EnvCICD {
    private config;
    constructor(config: Phase10Config);
    /**
     * Executes Phase 10: Environment & CI/CD
     *
     * @returns Promise<Phase10Result> - Environment & CI/CD analysis result
     */
    execute(): Promise<Phase10Result>;
    /**
     * Analyzes Environment Health
     *
     * @private
     * @returns EnvCICDFinding[] - Environment health findings
     */
    private analyzeEnvironmentHealth;
    /**
     * Analyzes CI/CD Configuration
     *
     * @private
     * @returns EnvCICDFinding[] - CI/CD configuration findings
     */
    private analyzeCICDConfiguration;
    /**
     * Analyzes Security Check (cross-reference with Phase 3)
     *
     * @private
     * @param securityFindings - Security findings from Phase 3
     * @returns EnvCICDFinding[] - Security check findings
     */
    private analyzeSecurityCheck;
    /**
     * Analyzes Dependency Health
     *
     * @private
     * @returns EnvCICDFinding[] - Dependency health findings
     */
    private analyzeDependencyHealth;
    /**
     * Gets critical environment variables used in code
     *
     * @private
     * @returns string[] - Array of critical variable names
     */
    private getCriticalEnvVars;
    /**
     * Scans a directory for files matching patterns
     *
     * @private
     * @param dir - Directory path
     * @param patterns - File patterns (e.g., ['*.yml', '*.yaml'])
     * @returns string[] - Array of file paths
     */
    private scanDirectory;
    /**
     * Scans for source files
     *
     * @private
     * @returns string[] - Array of file paths
     */
    private scanSourceFiles;
    /**
     * Generates unique ID for a finding
     *
     * @private
     * @param fileHash - SHA-1 hash of file content or identifier
     * @param line - Line number
     * @param type - Finding type
     * @returns string - Unique ID
     */
    private generateFindingId;
    /**
     * Writes partial report for Phase 10
     *
     * @private
     * @param result - Phase 10 result
     */
    private writePartialReport;
}
export {};
//# sourceMappingURL=phase-10-env-cicd.d.ts.map