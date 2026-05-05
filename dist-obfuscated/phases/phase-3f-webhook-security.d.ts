/**
 * Phase 3F: Webhook & Integration Security
 *
 * Purpose: Analyze webhook and integration security including signature verification,
 * idempotency of retries, timeout configurations, and secure data handling.
 *
 * Architecture:
 * - Signature Verification: Check for proper webhook signature verification
 * - Idempotency: Verify retry mechanisms are idempotent
 * - Timeout Configuration: Check for appropriate timeout settings
 * - Secure Data Handling: Verify sensitive data is handled securely in integrations
 *
 * @module phases/phase-3f-webhook-security
 * @since 2.0.0
 */
import { ThermalController } from '../core/thermal-controller.js';
import { StatePersistence, type ExecutionState } from '../core/state-persistence.js';
interface WebhookSecurityFinding {
    id: string;
    type: 'missing-signature-verification' | 'missing-idempotency' | 'insecure-timeout' | 'exposed-webhook-secret' | 'missing-retry-logic';
    severity: 'low' | 'medium' | 'high' | 'critical';
    filePath: string;
    line?: number;
    description: string;
    suggestion?: string;
    integrationType?: 'stripe' | 'github' | 'slack' | 'custom';
}
interface WebhookSecurityMetrics {
    totalFiles: number;
    missingSignatureVerification: number;
    missingIdempotency: number;
    insecureTimeouts: number;
    exposedWebhookSecrets: number;
    missingRetryLogic: number;
}
interface Phase3FConfig {
    projectRoot: string;
    thermalController: ThermalController;
    statePersistence: StatePersistence;
    currentState: ExecutionState;
}
export interface Phase3FResult {
    success: boolean;
    findings: WebhookSecurityFinding[];
    metrics: WebhookSecurityMetrics;
    criticalFindings: number;
    highSeverityFindings: number;
    executionTimeMs: number;
    error?: string;
}
export declare class Phase3FWebhookSecurity {
    private config;
    constructor(config: Phase3FConfig);
    execute(): Promise<Phase3FResult>;
    private checkSignatureVerification;
    private checkIdempotency;
    private checkTimeoutConfigurations;
    private checkExposedWebhookSecrets;
    private checkRetryLogic;
    private detectIntegrationType;
    private findSourceFiles;
    private calculateMetrics;
}
export {};
//# sourceMappingURL=phase-3f-webhook-security.d.ts.map