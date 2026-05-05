/**
 * Phase 3G: Data Privacy & PII
 *
 * Purpose: Analyze data privacy and PII (Personally Identifiable Information) handling,
 * including PII inventory, account deletion, data export, and logs with PII.
 *
 * Architecture:
 * - PII Inventory: Detect and catalog PII in database schemas and code
 * - Account Deletion: Verify account deletion and data retention policies
 * - Data Export: Check for data export functionality (GDPR compliance)
 * - Logs with PII: Detect PII in logs and log statements
 *
 * @module phases/phase-3g-data-privacy-pii
 * @since 2.0.0
 */
import { ThermalController } from '../core/thermal-controller.js';
import { StatePersistence, type ExecutionState } from '../core/state-persistence.js';
interface PIIFinding {
    id: string;
    type: 'pii-in-schema' | 'missing-account-deletion' | 'missing-data-export' | 'pii-in-logs' | 'unencrypted-pii' | 'missing-retention-policy';
    severity: 'low' | 'medium' | 'high' | 'critical';
    filePath: string;
    line?: number;
    description: string;
    suggestion?: string;
    piiType?: 'email' | 'phone' | 'ssn' | 'address' | 'credit-card' | 'name' | 'custom';
}
interface PIIMetrics {
    totalFiles: number;
    piiInSchemas: number;
    missingAccountDeletion: number;
    missingDataExport: number;
    piiInLogs: number;
    unencryptedPII: number;
    missingRetentionPolicies: number;
}
interface Phase3GConfig {
    projectRoot: string;
    thermalController: ThermalController;
    statePersistence: StatePersistence;
    currentState: ExecutionState;
}
export interface Phase3GResult {
    success: boolean;
    findings: PIIFinding[];
    metrics: PIIMetrics;
    criticalFindings: number;
    highSeverityFindings: number;
    executionTimeMs: number;
    error?: string;
}
export declare class Phase3GDataPrivacyPII {
    private config;
    constructor(config: Phase3GConfig);
    execute(): Promise<Phase3GResult>;
    private analyzePIIInSchemas;
    private checkAccountDeletion;
    private checkDataExport;
    private checkPIIInLogs;
    private checkUnencryptedPII;
    private checkRetentionPolicies;
    private findSQLFiles;
    private findSourceFiles;
    private calculateMetrics;
}
export {};
//# sourceMappingURL=phase-3g-data-privacy-pii.d.ts.map