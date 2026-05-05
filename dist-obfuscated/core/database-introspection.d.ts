/**
 * Database Introspection - Pluggable Database Schema Detection
 *
 * Purpose: Provides a pluggable interface for database schema introspection,
 * decoupling the DomainAnalyzer from specific database implementations like Supabase.
 *
 * This allows Aegis QA to work with:
 * - Supabase (via API)
 * - Prisma (via schema.prisma)
 * - SQL files (via parsing)
 * - No database (Null introspector)
 *
 * @module core/database-introspection
 * @since 2.0.0
 */
import type { Entity, Relationship } from '../types/domain.js';
import { SupabaseClient } from '@supabase/supabase-js';
/**
 * Database schema representation
 */
export interface DatabaseSchema {
    /** List of entities (tables/views) */
    entities: Entity[];
    /** List of relationships between entities */
    relationships: Relationship[];
    /** Warnings encountered during introspection */
    warnings: string[];
}
/**
 * Database introspector interface
 *
 * Implementations of this interface provide different ways to introspect
 * database schemas (Supabase API, Prisma schema, SQL files, etc.).
 */
export interface DatabaseIntrospector {
    /**
     * Introspects the database schema
     *
     * @returns Promise<DatabaseSchema> - Database schema with entities and relationships
     */
    getSchema(): Promise<DatabaseSchema>;
    /**
     * Gets the name/type of this introspector
     *
     * @returns string - Introspector name (e.g., 'supabase', 'prisma', 'sql', 'null')
     */
    getName(): string;
}
/**
 * Null Database Introspector
 *
 * A no-op introspector that returns an empty schema.
 * Used when no database credentials or schema files are available.
 */
export declare class NullDatabaseIntrospector implements DatabaseIntrospector {
    getSchema(): Promise<DatabaseSchema>;
    getName(): string;
}
/**
 * SQL File Database Introspector
 *
 * Parses SQL files to extract database schema information.
 */
export declare class SQLFileDatabaseIntrospector implements DatabaseIntrospector {
    private projectRoot;
    private schemaPaths;
    constructor(config: {
        projectRoot: string;
        schemaPaths?: string[];
    });
    getSchema(): Promise<DatabaseSchema>;
    getName(): string;
    private parseSQLSchema;
    private extractFieldsFromSQL;
    private isCoreEntity;
}
/**
 * Prisma Database Introspector
 *
 * Parses Prisma schema.prisma files to extract database schema information.
 */
export declare class PrismaDatabaseIntrospector implements DatabaseIntrospector {
    private projectRoot;
    private schemaPaths;
    constructor(config: {
        projectRoot: string;
        schemaPaths?: string[];
    });
    getSchema(): Promise<DatabaseSchema>;
    getName(): string;
    private parsePrismaSchema;
    private parsePrismaRelationships;
    private extractFieldsFromPrisma;
    private isCoreEntity;
}
/**
 * Supabase Database Introspector
 *
 * Connects to Supabase to query the actual database schema.
 */
export declare class SupabaseDatabaseIntrospector implements DatabaseIntrospector {
    private secretManager;
    constructor(secretManager: {
        getSupabaseClient(): SupabaseClient | null;
    });
    getSchema(): Promise<DatabaseSchema>;
    getName(): string;
    private isCoreEntity;
}
//# sourceMappingURL=database-introspection.d.ts.map