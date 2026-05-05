/**
 * Phase 15B: Cloud Infrastructure
 *
 * Purpose: Audit Infrastructure as Code (IaC) files for security and cost issues.
 *
 * Architecture:
 * - Cloud Infrastructure Audit: Detect Terraform .tf and CloudFormation .yaml files
 * - Permission Audit: Detect overly permissive settings (0.0.0.0/0, S3 public access)
 * - Cost Efficiency: Detect oversized instances for dev environments
 * - Hardware Guard: Monitor RAM swap, pause if > 500MB
 *
 * @module phases/phase-15b-cloud-infra
 * @since 2.0.0
 */
import { ThermalController } from '../core/thermal-controller.js';
import { StatePersistence, type ExecutionState } from '../core/state-persistence.js';
/**
 * Cloud infrastructure finding
 */
interface CloudInfraFinding {
    /** Unique ID based on file hash + line */
    id: string;
    /** Finding type */
    type: 'iac-detected' | 'permission-issue' | 'cost-inefficiency';
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
    /** The permission type (for permission issues) */
    permissionType?: string;
}
/**
 * Cloud infrastructure audit result
 */
interface CloudInfraAuditResult {
    /** IaC platform detected */
    iacPlatform: 'terraform' | 'cloudformation' | 'none';
    /** IaC files found */
    iacFiles: string[];
    /** Permission issues detected */
    permissionIssues: Array<{
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
    /** Total IaC files analyzed */
    totalFilesAnalyzed: number;
}
/**
 * Phase 15B configuration
 */
interface Phase15BConfig {
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
 * Phase 15B result
 */
export interface Phase15BResult {
    /** Overall success */
    success: boolean;
    /** Total files analyzed */
    totalFiles: number;
    /** Cloud infrastructure findings */
    cloudInfraFindings: CloudInfraFinding[];
    /** Cloud infrastructure audit result */
    cloudInfraAudit: CloudInfraAuditResult;
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
 * Phase 15B: Cloud Infrastructure
 *
 * This phase audits IaC files for security and cost issues.
 *
 * @class Phase15BCloudInfra
 */
export declare class Phase15BCloudInfra {
    private config;
    constructor(config: Phase15BConfig);
    /**
     * Executes Phase 15B: Cloud Infrastructure
     *
     * @returns Promise<Phase15BResult> - Cloud infrastructure assessment result
     */
    execute(): Promise<Phase15BResult>;
    /**
     * Performs cloud infrastructure audit
     *
     * @private
     * @returns Promise<CloudInfraAuditResult> - Cloud infrastructure audit result
     */
    private performCloudInfraAudit;
    /**
     * Finds IaC files in the repository
     *
     * @private
     * @param extension - File extension to search for
     * @returns Promise<string[]> - Array of file paths
     */
    private findIaCFiles;
    /**
     * Checks if a file is in .gitignore
     *
     * @private
     * @param filePath - File path to check
     * @returns boolean - Whether file is in .gitignore
     */
    private isFileInGitignore;
    /**
     * Analyzes Terraform file
     *
     * @private
     * @param filePath - Terraform file path
     * @param result - Cloud infrastructure audit result
     */
    private analyzeTerraformFile;
    /**
     * Analyzes CloudFormation file
     *
     * @private
     * @param filePath - CloudFormation file path
     * @param result - Cloud infrastructure audit result
     */
    private analyzeCloudFormationFile;
    /**
     * Generates findings from cloud infrastructure audit
     *
     * @private
     * @param audit - Cloud infrastructure audit result
     * @returns CloudInfraFinding[] - Array of findings
     */
    private generateFindingsFromAudit;
    /**
     * Writes partial report for Phase 15B
     *
     * @private
     * @param findings - Cloud infrastructure findings
     * @param audit - Cloud infrastructure audit result
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
//# sourceMappingURL=phase-15c-cloud-infra.d.ts.map