/**
 * Phase 14: Git, Repo & Documentation Hygiene
 *
 * Purpose: Audit the structural health of the repository including git hygiene,
 * documentation quality, orphaned files, and script verification.
 *
 * Architecture:
 * - Git Hygiene: Detect .log, .env, node_modules, dist leaks in .gitignore
 * - Documentation Check: Verify README.md and build/dev instructions for Next.js
 * - Orphaned Files: Detect .bak, .old, copy of..., IDE config files
 * - Script Verification: Check if package.json scripts reference existing files
 * - Thermal Verification: Mandatory resource check before scanning
 * - Batch Processing: Use BatchProcessor for thermal-safe processing
 *
 * @module phases/phase-14-git-hygiene
 * @since 2.0.0
 */
import { ThermalController } from '../core/thermal-controller.js';
import { StatePersistence, type ExecutionState } from '../core/state-persistence.js';
/**
 * Git hygiene finding
 */
interface GitHygieneFinding {
    /** Unique ID based on file hash + line */
    id: string;
    /** Finding type */
    type: 'gitignore-leak' | 'missing-docs' | 'orphaned-file' | 'script-verification' | 'env-committed' | 'large-file' | 'git-tracked-sensitive' | 'script-typo';
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
    /** The leaked file type (for gitignore leaks) */
    leakedType?: string;
    /** File size in MB (for large files) */
    fileSizeMB?: number;
}
/**
 * Git hygiene audit result
 */
interface GitHygieneAuditResult {
    /** Has .gitignore file */
    hasGitignore: boolean;
    /** Leaked .log files */
    leakedLogFiles: string[];
    /** Leaked .env files (CRITICAL) */
    leakedEnvFiles: string[];
    /** Leaked node_modules directories */
    leakedNodeModules: string[];
    /** Leaked dist directories */
    leakedDistDirs: string[];
    /** Orphaned files (.bak, .old, copy of...) */
    orphanedFiles: string[];
    /** IDE config files (.vscode, .idea) */
    ideConfigFiles: string[];
    /** Large files (> 5MB non-binary) */
    largeFiles: Array<{
        path: string;
        sizeMB: number;
    }>;
    /** Git-tracked sensitive files (BLOCKER) */
    gitTrackedSensitive: string[];
    /** README.md exists */
    hasReadme: boolean;
    /** README.md has build instructions */
    hasBuildInstructions: boolean;
    /** README.md has dev instructions */
    hasDevInstructions: boolean;
    /** Script verification results */
    scriptVerification: ScriptVerificationResult;
}
/**
 * Script verification result
 */
interface ScriptVerificationResult {
    /** Scripts checked */
    scriptsChecked: string[];
    /** Invalid scripts (file not found) */
    invalidScripts: string[];
    /** Valid scripts */
    validScripts: string[];
    /** Scripts with typos */
    scriptsWithTypos: Array<{
        scriptName: string;
        command: string;
        typo: string;
    }>;
}
/**
 * Phase 14 configuration
 */
interface Phase14Config {
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
 * Phase 14 result
 */
export interface Phase14Result {
    /** Overall success */
    success: boolean;
    /** Total files analyzed */
    totalFiles: number;
    /** Git hygiene findings */
    gitHygieneFindings: GitHygieneFinding[];
    /** Git hygiene audit result */
    gitHygieneAudit: GitHygieneAuditResult;
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
 * Phase 14: Git, Repo & Documentation Hygiene
 *
 * This phase audits git hygiene, documentation, orphaned files, and script verification.
 *
 * @class Phase14GitHygiene
 */
export declare class Phase14GitHygiene {
    private config;
    constructor(config: Phase14Config);
    /**
     * Executes Phase 14: Git, Repo & Documentation Hygiene
     *
     * @returns Promise<Phase14Result> - Git hygiene assessment result
     */
    execute(): Promise<Phase14Result>;
    /**
     * Gets all repository files
     *
     * @private
     * @returns Promise<string[]> - Array of file paths
     */
    private getAllRepositoryFiles;
    /**
     * Performs git hygiene audit
     *
     * LÓGICA PARA DETECCIÓN DE FUGAS EN .GITIGNORE (Punto 1):
     *
     * 1. Lee el archivo .gitignore si existe
     * 2. Obtiene todos los archivos del repositorio (ya tracked + untracked)
     * 3. Para cada archivo, verifica si debería estar ignorado según .gitignore
     * 4. Detecta fugas específicas:
     *    - Archivos .log (deberían estar en .gitignore)
     *    - Archivos .env (CRITICAL si están commiteados sin .example)
     *    - Carpetas node_modules (deberían estar en .gitignore)
     *    - Carpetas dist (deberían estar en .gitignore)
     *
     * CÓMO REPORTAR UN .ENV COMMITEADO POR ERROR (CRITICAL):
     * - Tipo de finding: 'env-committed'
     * - Severidad: 'critical'
     * - Descripción: "CRITICAL SECURITY RISK: .env file committed to repository"
     * - Sugerencia: "Remove .env from git history, add to .gitignore, and create .env.example"
     * - Marcar como isCorePath si está en directorio raíz
     *
     * @private
     * @param files - Array of file paths
     * @returns Promise<GitHygieneAuditResult> - Git hygiene audit result
     */
    private performGitHygieneAudit;
    /**
     * Generates findings from git hygiene audit
     *
     * @private
     * @param audit - Git hygiene audit result
     * @param corePathFiles - Set of Core Path files
     * @returns GitHygieneFinding[] - Array of findings
     */
    private generateFindingsFromAudit;
    /**
     * Writes partial report for Phase 14
     *
     * @private
     * @param findings - Git hygiene findings
     * @param audit - Git hygiene audit result
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
//# sourceMappingURL=phase-14b-git-hygiene.d.ts.map