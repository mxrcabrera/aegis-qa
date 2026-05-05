/**
 * Phase 3C: Secure Development Methodology
 *
 * Purpose: Analyze secure development practices including threat modeling,
 * supply chain security, secrets scanning, and input sanitization beyond Zod.
 *
 * Architecture:
 * - Threat Model Analysis: Check for threat modeling documentation and practices
 * - Supply Chain Security: Analyze dependency vulnerabilities and SBOM
 * - Secrets Scanning: Enhanced secrets detection beyond basic patterns
 * - Input Sanitization: Verify input validation beyond schema validation (Zod)
 *
 * @module phases/phase-3c-secure-dev-methodology
 * @since 2.0.0
 */
import { ThermalController } from '../core/thermal-controller.js';
import { StatePersistence, type ExecutionState } from '../core/state-persistence.js';
interface SecureDevFinding {
    id: string;
    type: 'missing-threat-model' | 'supply-chain-risk' | 'exposed-secret' | 'weak-input-sanitization' | 'missing-security-review';
    severity: 'low' | 'medium' | 'high' | 'critical';
    filePath: string;
    line?: number;
    description: string;
    suggestion?: string;
    dependency?: string;
    secretType?: string;
}
interface SecureDevMetrics {
    totalFiles: number;
    missingThreatModels: number;
    supplyChainRisks: number;
    exposedSecrets: number;
    weakInputSanitization: number;
    missingSecurityReviews: number;
}
interface Phase3CConfig {
    projectRoot: string;
    thermalController: ThermalController;
    statePersistence: StatePersistence;
    currentState: ExecutionState;
}
export interface Phase3CResult {
    success: boolean;
    findings: SecureDevFinding[];
    metrics: SecureDevMetrics;
    criticalFindings: number;
    highSeverityFindings: number;
    executionTimeMs: number;
    error?: string;
}
export declare class Phase3CSecureDevMethodology {
    private config;
    constructor(config: Phase3CConfig);
    execute(): Promise<Phase3CResult>;
    private checkThreatModeling;
    private analyzeSupplyChain;
    private scanSecrets;
    private checkInputSanitization;
    private checkSecurityReviewProcess;
    private findSourceFiles;
    private calculateMetrics;
}
export {};
//# sourceMappingURL=phase-3c-secure-dev-methodology.d.ts.map