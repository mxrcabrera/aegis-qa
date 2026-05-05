/**
 * Aegis QA - Advanced Quality Assurance Orchestrator
 *
 * Aegis QA is a premium quality assurance orchestrator with hardware protection
 * and AI-powered code analysis capabilities.
 *
 * @module aegis-qa
 * @version 1.0.0
 */
export { ThermalController } from './core/thermal-controller.js';
export { SecretManager } from './core/secret-manager.js';
export { ReportAggregator } from './core/reporter.js';
export { StatePersistence } from './core/state-persistence.js';
export { PhaseOrchestrator } from './orchestration/phase-orchestrator.js';
export { QAOrchestrator } from './orchestration/qa-orchestrator.js';
export { DomainAnalyzer } from './inference/domain-analyzer.js';
export { CodeReader } from './modules/code-reader.js';
export { SecurityScanner } from './modules/security-scanner.js';
export { StyleAuditor } from './modules/style-auditor.js';
export { AtomicFixer } from './modules/atomic-fixer.js';
export { AutoFixer } from './modules/auto-fixer.js';
export { CloudCostDetection } from './modules/cloud-cost-detection.js';
export { PredictiveBugDetection } from './modules/predictive-bug-detection.js';
export { default as OllamaProcessor } from './modules/ollama-processor.js';
export { DomainInference } from './modules/domain-inference.js';
export { DBSeeder } from './modules/db-seeder.js';
export type * from './types/audit.js';
export type * from './types/domain.js';
export type * from './types/secrets.js';
//# sourceMappingURL=index.d.ts.map