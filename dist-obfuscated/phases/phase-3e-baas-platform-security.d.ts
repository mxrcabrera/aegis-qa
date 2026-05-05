/**
 * Phase 3E: BaaS/Platform Security
 *
 * Purpose: Analyze Backend-as-a-Service (BaaS) and platform security configurations,
 * specifically focusing on Supabase RLS policies, PostGREST access patterns, storage buckets,
 * and authentication configurations.
 *
 * Architecture:
 * - RLS Policy Analysis: Table-by-table Row Level Security verification
 * - PostGREST + Anon Key Testing: Direct API testing with anon key to detect data exposure
 * - Storage Bucket Security: Public/private bucket configurations and access policies
 * - Auth Configuration: JWT settings, MFA, email verification, session policies
 *
 * @module phases/phase-3e-baas-platform-security
 * @since 2.0.0
 */
import { ThermalController } from '../core/thermal-controller.js';
import { StatePersistence, type ExecutionState } from '../core/state-persistence.js';
interface BaaSSecurityFinding {
    id: string;
    type: 'missing-rls' | 'rls-bypass' | 'public-bucket' | 'weak-auth' | 'exposed-table' | 'storage-overexposed';
    severity: 'low' | 'medium' | 'high' | 'critical';
    filePath: string;
    line?: number;
    tableName?: string;
    bucketName?: string;
    description: string;
    suggestion?: string;
}
interface BaaSSecurityMetrics {
    totalTables: number;
    tablesWithoutRLS: number;
    tablesWithBypass: number;
    publicBuckets: number;
    weakAuthConfigs: number;
    exposedTablesViaAnon: number;
}
interface Phase3EConfig {
    projectRoot: string;
    thermalController: ThermalController;
    statePersistence: StatePersistence;
    currentState: ExecutionState;
}
export interface Phase3EResult {
    success: boolean;
    findings: BaaSSecurityFinding[];
    metrics: BaaSSecurityMetrics;
    criticalFindings: number;
    highSeverityFindings: number;
    executionTimeMs: number;
    error?: string;
}
export declare class Phase3EBaaSPlatformSecurity {
    private config;
    constructor(config: Phase3EConfig);
    execute(): Promise<Phase3EResult>;
    private analyzeRLSPolicies;
    private checkRLSBypass;
    private analyzeStorageBuckets;
    private analyzeAuthConfig;
    private checkPostgRESTExposure;
    private findSQLFiles;
    private findSourceFiles;
    private findConfigFiles;
    private extractTables;
    private calculateMetrics;
}
export {};
//# sourceMappingURL=phase-3e-baas-platform-security.d.ts.map