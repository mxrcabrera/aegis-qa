/**
 * DomainAnalyzer - Business Domain Inference Engine
 *
 * Purpose: Analyzes a Next.js/Supabase project to understand the business domain,
 * identify core entities, relationships, and critical paths. This prevents the AI from
 * suggesting generic changes that break business logic.
 *
 * Analysis Methods:
 * - Static Analysis: Reads SQL schema files and TypeScript types
 * - Database Analysis: Connects to Supabase to query actual schema (if credentials available)
 * - Hybrid: Combines both for maximum accuracy
 *
 * AI Assistance (Ollama):
 * When static analysis is ambiguous (e.g., unclear relationships, generic table names),
 * the analyzer can use Ollama to classify entities and infer business context from
 * code patterns and naming conventions.
 *
 * @module inference/domain-analyzer
 * @since 1.0.0
 */
import { SecretManager } from '../core/secret-manager.js';
import type { DomainAnalyzerConfig, AnalysisResult } from '../types/domain.js';
import type { DatabaseIntrospector } from '../core/database-introspection.js';
/**
 * DomainAnalyzer - Business domain inference
 *
 * This class analyzes a project to understand its business domain by examining
 * database schemas, TypeScript types, and Server Actions. It provides the context
 * needed for intelligent code auditing and refactoring.
 *
 * @class DomainAnalyzer
 * @example
 * ```typescript
 * const analyzer = new DomainAnalyzer({
 *   projectRoot: '/path/to/project',
 *   useDatabase: true,
 *   useAI: true
 * });
 *
 * const result = await analyzer.analyze();
 * console.log(result.domainMap?.entities);
 * ```
 */
export declare class DomainAnalyzer {
    private config;
    private secretManager;
    private databaseIntrospector;
    private sourceFiles;
    /**
     * Creates a new DomainAnalyzer instance
     *
     * @param config - Configuration for domain analysis
     * @param secretManager - SecretManager instance for database connection
     * @param databaseIntrospector - Optional DatabaseIntrospector for schema introspection
     */
    constructor(config: DomainAnalyzerConfig, secretManager?: SecretManager, databaseIntrospector?: DatabaseIntrospector);
    /**
     * Analyzes the project domain
     *
     * This method performs a comprehensive analysis of the project to understand
     * the business domain. It combines static analysis with optional database
     * connection and AI assistance.
     *
     * @returns Promise<AnalysisResult> - Analysis result with domain map
     *
     * @example
     * ```typescript
     * const result = await analyzer.analyze();
     * if (result.success) {
     *   console.log(`Found ${result.domainMap?.entities.length} entities`);
     * }
     * ```
     */
    analyze(): Promise<AnalysisResult>;
    /**
     * Performs static analysis of schema files and TypeScript types
     *
     * This method reads SQL schema files, Prisma schemas, and TypeScript type
     * definitions to infer the domain structure without connecting to the database.
     *
     * @private
     * @returns Promise<{entities: Entity[], relationships: Relationship[], serverActions: ServerAction[], warnings: string[]}>
     */
    private performStaticAnalysis;
    /**
     * Performs database analysis by connecting to Supabase
     *
     * This method queries the actual database schema to get accurate entity
     * and relationship information. Requires valid Supabase credentials.
     *
     * @private
     * @returns Promise<{entities: Entity[], relationships: Relationship[], warnings: string[]}>
     */
    private performDatabaseAnalysis;
    /**
     * Parses SQL schema file to extract entities
     *
     * @private
     * @param content - SQL file content
     * @param filePath - Path to the SQL file
     * @returns Entity[] - Extracted entities
     */
    private parseSQLSchema;
    /**
     * Parses Prisma schema file to extract entities
     *
     * @private
     * @param content - Prisma schema content
     * @param filePath - Path to the Prisma file
     * @returns Entity[] - Extracted entities
     */
    private parsePrismaSchema;
    /**
     * Parses TypeScript type definitions to extract entities
     *
     * @private
     * @param content - TypeScript file content
     * @param filePath - Path to the TypeScript file
     * @returns Entity[] - Extracted entities
     */
    private parseTypeScriptTypes;
    /**
     * Parses Server Actions file to extract action metadata
     *
     * @private
     * @param content - Server Actions file content
     * @param filePath - Path to the actions file
     * @returns ServerAction[] - Extracted server actions
     */
    private parseServerActions;
    /**
     * Extracts field names from SQL CREATE TABLE statement
     *
     * @private
     * @param content - SQL content
     * @param tableName - Table name to extract fields for
     * @returns string[] - Field names
     */
    private extractFieldsFromSQL;
    /**
     * Extracts field names from Prisma model body
     *
     * @private
     * @param modelBody - Prisma model body content
     * @returns string[] - Field names
     */
    private extractFieldsFromPrisma;
    /**
     * Extracts field names from TypeScript type/interface body
     *
     * @private
     * @param typeBody - TypeScript type body content
     * @returns string[] - Field names
     */
    private extractFieldsFromTypeScript;
    /**
     * Extracts entity names referenced in a function
     *
     * @private
     * @param content - File content
     * @param functionName - Function name to analyze
     * @returns string[] - Referenced entity names
     */
    private extractEntitiesFromFunction;
    /**
     * Infers action type from function name and content
     *
     * @private
     * @param functionName - Function name
     * @param content - File content
     * @returns Action type
     */
    private inferActionType;
    /**
     * Determines if an entity is a core business entity
     *
     * Core entities are central to the business logic (e.g., users, bookings, orders).
     * This heuristic uses naming conventions to make the determination.
     *
     * @private
     * @param entityName - Name of the entity
     * @returns boolean - True if entity is core
     */
    private isCoreEntity;
    /**
     * Infers relationships between entities
     *
     * This method analyzes entity names and fields to infer relationships
     * based on common naming conventions (e.g., user_id implies relationship to users).
     *
     * @private
     * @param entities - List of entities
     * @returns Relationship[] - Inferred relationships
     */
    private inferRelationships;
    /**
     * Infers critical business paths from entities and actions
     *
     * This method analyzes the domain to identify key business flows like
     * authentication, booking, payment, etc.
     *
     * @private
     * @param entities - List of entities
     * @param serverActions - List of server actions
     * @returns CriticalPath[] - Inferred critical paths
     */
    private inferCriticalPaths;
    /**
     * Reconciles entities from multiple sources (SQL, Prisma, TypeScript)
     *
     * This method merges entities from different sources, detecting name similarities
     * (e.g., User vs users) and unifying them into a single entity with source: 'multiple'.
     *
     * @private
     * @param entities - List of entities from all sources
     * @returns Entity[] - Reconciled entities
     */
    private reconcileEntities;
    /**
     * Deduplicates relationships based on from/to pair
     *
     * @private
     * @param relationships - List of relationships to deduplicate
     * @returns Relationship[] - Deduplicated relationships
     */
    private deduplicateRelationships;
    /**
     * Calculates overall confidence score for the analysis
     *
     * @private
     * @param entities - List of entities
     * @param relationships - List of relationships
     * @param warnings - List of warnings
     * @returns number - Overall confidence score (0-1)
     */
    private calculateOverallConfidence;
    /**
     * Loads sovereign.map.json configuration file if it exists
     *
     * This method looks for a sovereign.map.json file in the project root
     * that can override automatic inferences.
     *
     * @private
     * @returns Partial<DomainMap> | null - Map configuration or null if not found
     */
    private loadSovereignMap;
    /**
     * Applies sovereign.map.json overrides to the domain map
     *
     * This method applies manual overrides from the configuration file,
     * such as forcing certain entities to be core or adding custom critical paths.
     *
     * @private
     * @param domainMap - The domain map to modify
     * @param override - The override configuration
     */
    private applyMapOverride;
}
//# sourceMappingURL=domain-analyzer.d.ts.map