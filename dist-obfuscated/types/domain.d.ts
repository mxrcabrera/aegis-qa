/**
 * Domain Types - Business domain inference and analysis
 *
 * This module defines interfaces for analyzing and representing the business
 * domain of a Next.js/Supabase application, including entities, relationships,
 * and critical paths.
 *
 * @module types/domain
 * @since 1.0.0
 */
/**
 * Entity type classification
 */
export type EntityType = 'table' | 'view' | 'enum' | 'composite' | 'unknown';
/**
 * Relationship type between entities
 */
export type RelationshipType = 'one-to-one' | 'one-to-many' | 'many-to-one' | 'many-to-many' | 'unknown';
/**
 * Critical path classification for business flows
 */
export type CriticalPathType = 'auth' | 'payment' | 'booking' | 'content' | 'admin' | 'unknown';
/**
 * Database entity representation
 *
 * Represents a table, view, or other database object that is part of the
 * business domain.
 */
export interface Entity {
    /** Name of the entity (table/view name) */
    name: string;
    /** Type of entity (table, view, enum, etc.) */
    type: EntityType;
    /** Description inferred from schema or comments */
    description?: string;
    /** Number of columns/fields */
    fieldCount: number;
    /** Whether this is a core entity (central to business logic) */
    isCore: boolean;
    /** Confidence score for entity classification (0-1) */
    confidence: number;
    /** List of column/field names */
    fields: string[];
    /** Source of entity detection (sql, prisma, typescript, database, multiple) */
    source: 'sql' | 'prisma' | 'typescript' | 'database' | 'multiple' | 'manual';
}
/**
 * Relationship between two entities
 *
 * Represents how entities are connected in the database schema.
 */
export interface Relationship {
    /** Source entity name */
    from: string;
    /** Target entity name */
    to: string;
    /** Type of relationship */
    type: RelationshipType;
    /** Foreign key column name (if applicable) */
    foreignKey?: string;
    /** Description of the relationship purpose */
    description?: string;
    /** Confidence score for relationship inference (0-1) */
    confidence: number;
}
/**
 * Critical business flow/path
 *
 * Represents a key business process that involves multiple entities.
 */
export interface CriticalPath {
    /** Name of the critical path */
    name: string;
    /** Type of critical path */
    type: CriticalPathType;
    /** Entities involved in this path */
    entities: string[];
    /** Description of the business flow */
    description?: string;
    /** Server actions that implement this path */
    actions: string[];
    /** Confidence score for path inference (0-1) */
    confidence: number;
}
/**
 * Server action metadata
 *
 * Represents a Server Action that manipulates domain entities.
 */
export interface ServerAction {
    /** File path of the action */
    filePath: string;
    /** Function name */
    functionName: string;
    /** Entities this action manipulates */
    entities: string[];
    /** Action type (create, read, update, delete, custom) */
    actionType: 'create' | 'read' | 'update' | 'delete' | 'custom';
    /** Description inferred from code */
    description?: string;
}
/**
 * Complete domain map
 *
 * The output of domain analysis, containing all inferred business context.
 */
export interface DomainMap {
    /** All detected entities */
    entities: Entity[];
    /** Relationships between entities */
    relationships: Relationship[];
    /** Critical business paths */
    criticalPaths: CriticalPath[];
    /** Server actions that manipulate entities */
    serverActions: ServerAction[];
    /** Overall confidence in the analysis (0-1) */
    overallConfidence: number;
    /** Additional metadata about the analysis */
    metadata: {
        /** Analysis method used (static, database, hybrid) */
        method: 'static' | 'database' | 'hybrid';
        /** Whether AI assistance was used */
        aiAssisted: boolean;
        /** Timestamp of analysis */
        timestamp: string;
        /** Source files analyzed */
        sourceFiles: string[];
    };
}
/**
 * Domain analyzer configuration
 */
export interface DomainAnalyzerConfig {
    /** Root directory of the project to analyze */
    projectRoot: string;
    /** Whether to use database connection if available */
    useDatabase: boolean;
    /** Whether to use AI (Ollama) for ambiguous cases */
    useAI: boolean;
    /** Paths to search for schema files */
    schemaPaths: string[];
    /** Paths to search for server actions */
    actionPaths: string[];
}
/**
 * Analysis result
 */
export interface AnalysisResult {
    /** Success status */
    success: boolean;
    /** Generated domain map */
    domainMap?: DomainMap;
    /** Error message if analysis failed */
    error?: string;
    /** Warnings generated during analysis */
    warnings: string[];
}
//# sourceMappingURL=domain.d.ts.map