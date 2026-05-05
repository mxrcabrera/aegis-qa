/**
 * Phase 3B: AI API Integration Security
 *
 * Purpose: Analyze AI API integrations for security vulnerabilities including
 * prompt injection, API key exposure, cost limits, and output validation.
 *
 * Architecture:
 * - Prompt Injection Detection: Detect patterns vulnerable to prompt injection
 * - API Key Exposure: Check for hardcoded AI API keys in client code
 * - Cost Limits: Verify cost limits and rate limiting implementations
 * - Output Validation: Check for proper AI output validation and sanitization
 *
 * @module phases/phase-3b-ai-api-security
 * @since 2.0.0
 */
import { ThermalController } from '../core/thermal-controller.js';
import { StatePersistence, type ExecutionState } from '../core/state-persistence.js';
interface AIAPIFinding {
    id: string;
    type: 'prompt-injection' | 'key-exposure' | 'missing-cost-limit' | 'missing-output-validation' | 'unsafe-ai-usage';
    severity: 'low' | 'medium' | 'high' | 'critical';
    filePath: string;
    line?: number;
    description: string;
    suggestion?: string;
    apiProvider?: 'openai' | 'anthropic' | 'cohere' | 'huggingface' | 'custom';
}
interface AIAPIsMetrics {
    totalFiles: number;
    promptInjectionVulnerabilities: number;
    exposedKeys: number;
    missingCostLimits: number;
    missingOutputValidation: number;
    unsafeAIUsage: number;
}
interface Phase3BConfig {
    projectRoot: string;
    thermalController: ThermalController;
    statePersistence: StatePersistence;
    currentState: ExecutionState;
}
export interface Phase3BResult {
    success: boolean;
    findings: AIAPIFinding[];
    metrics: AIAPIsMetrics;
    criticalFindings: number;
    highSeverityFindings: number;
    executionTimeMs: number;
    error?: string;
}
export declare class Phase3BAIAPIIntegration {
    private config;
    constructor(config: Phase3BConfig);
    execute(): Promise<Phase3BResult>;
    private findSourceFiles;
    private analyzeAIAPIIntegrations;
    private analyzeFileForAIAPI;
    private detectAPIProvider;
    private checkPromptInjection;
    private checkKeyExposure;
    private checkCostLimits;
    private checkOutputValidation;
    private calculateMetrics;
}
export {};
//# sourceMappingURL=phase-3b-ai-api-security.d.ts.map