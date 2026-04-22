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
export class NullDatabaseIntrospector implements DatabaseIntrospector {
  async getSchema(): Promise<DatabaseSchema> {
    return {
      entities: [],
      relationships: [],
      warnings: [],
    };
  }

  getName(): string {
    return 'null';
  }
}

/**
 * SQL File Database Introspector
 *
 * Parses SQL files to extract database schema information.
 */
export class SQLFileDatabaseIntrospector implements DatabaseIntrospector {
  private projectRoot: string;
  private schemaPaths: string[];

  constructor(config: { projectRoot: string; schemaPaths?: string[] }) {
    this.projectRoot = config.projectRoot;
    this.schemaPaths = config.schemaPaths || [
      'supabase/migrations/*.sql',
      'supabase/schema.sql',
      'database/schema.sql',
    ];
  }

  async getSchema(): Promise<DatabaseSchema> {
    const entities: Entity[] = [];
    const relationships: Relationship[] = [];
    const warnings: string[] = [];

    const { glob } = await import('glob');
    const { readFile } = await import('fs/promises');
    const path = await import('path');

    for (const pattern of this.schemaPaths) {
      const files = await glob(pattern, {
        cwd: this.projectRoot,
        absolute: true,
      });

      for (const file of files) {
        try {
          const content = await readFile(file, 'utf-8');
          const sqlEntities = this.parseSQLSchema(content, path.basename(file));
          entities.push(...sqlEntities);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          warnings.push(`Failed to parse ${file}: ${errorMessage}`);
        }
      }
    }

    return { entities, relationships, warnings };
  }

  getName(): string {
    return 'sql';
  }

  private parseSQLSchema(content: string, sourceFile: string): Entity[] {
    const entities: Entity[] = [];
    const tableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(\w+)/gi;
    const matches = content.match(tableRegex);

    if (matches) {
      for (const match of matches) {
        const tableNameMatch = match.match(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(\w+)/i);
        if (tableNameMatch) {
          const tableName = tableNameMatch[1];
          const fields = this.extractFieldsFromSQL(content, tableName);

          entities.push({
            name: tableName,
            type: 'table',
            fieldCount: fields.length,
            isCore: this.isCoreEntity(tableName),
            confidence: 0.8,
            fields,
            description: `Table defined in ${sourceFile}`,
            source: 'sql',
          });
        }
      }
    }

    return entities;
  }

  private extractFieldsFromSQL(content: string, tableName: string): string[] {
    const fields: string[] = [];
    const tableRegex = new RegExp(
      `CREATE\\s+TABLE\\s+(?:IF\\s+NOT\\s+EXISTS\\s+)?${tableName}\\s*\\(([^)]+)\\)`,
      'gi'
    );
    const match = content.match(tableRegex);

    if (match && match[1]) {
      const columns = match[1].split(',');
      for (const column of columns) {
        const colMatch = column.trim().match(/^(\w+)/);
        if (colMatch) {
          fields.push(colMatch[1]);
        }
      }
    }

    return fields;
  }

  private isCoreEntity(entityName: string): boolean {
    const name = entityName.toLowerCase();
    const coreKeywords = [
      'user',
      'users',
      'customer',
      'customers',
      'booking',
      'bookings',
      'order',
      'orders',
      'product',
      'products',
      'payment',
      'payments',
      'reservation',
      'reservations',
      'subscription',
      'subscriptions',
      'account',
      'accounts',
    ];

    return coreKeywords.some((keyword) => name.includes(keyword));
  }
}

/**
 * Prisma Database Introspector
 *
 * Parses Prisma schema.prisma files to extract database schema information.
 */
export class PrismaDatabaseIntrospector implements DatabaseIntrospector {
  private projectRoot: string;
  private schemaPaths: string[];

  constructor(config: { projectRoot: string; schemaPaths?: string[] }) {
    this.projectRoot = config.projectRoot;
    this.schemaPaths = config.schemaPaths || ['prisma/schema.prisma'];
  }

  async getSchema(): Promise<DatabaseSchema> {
    const entities: Entity[] = [];
    const relationships: Relationship[] = [];
    const warnings: string[] = [];

    const { glob } = await import('glob');
    const { readFile } = await import('fs/promises');
    const path = await import('path');

    for (const pattern of this.schemaPaths) {
      const files = await glob(pattern, {
        cwd: this.projectRoot,
        absolute: true,
      });

      for (const file of files) {
        try {
          const content = await readFile(file, 'utf-8');
          const prismaEntities = this.parsePrismaSchema(content, path.basename(file));
          entities.push(...prismaEntities);
          const prismaRelationships = this.parsePrismaRelationships(content);
          relationships.push(...prismaRelationships);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          warnings.push(`Failed to parse ${file}: ${errorMessage}`);
        }
      }
    }

    return { entities, relationships, warnings };
  }

  getName(): string {
    return 'prisma';
  }

  private parsePrismaSchema(content: string, sourceFile: string): Entity[] {
    const entities: Entity[] = [];
    const modelRegex = /model\s+(\w+)\s*\{([^}]+)\}/gi;
    let match;

    while ((match = modelRegex.exec(content)) !== null) {
      const modelName = match[1];
      const modelBody = match[2];
      const fields = this.extractFieldsFromPrisma(modelBody);

      entities.push({
        name: modelName,
        type: 'table',
        fieldCount: fields.length,
        isCore: this.isCoreEntity(modelName),
        confidence: 0.9,
        fields,
        description: `Prisma model defined in ${sourceFile}`,
        source: 'prisma',
      });
    }

    return entities;
  }

  private parsePrismaRelationships(content: string): Relationship[] {
    const relationships: Relationship[] = [];
    const relationRegex = /(\w+)\s+(\w+)\s+@relation\(["']?([^"')]+)["']?\s*,\s*(?:fields:\s*\[(\w+)\],\s*)?(?:references:\s*\[(\w+)\])?/gi;
    let match;

    while ((match = relationRegex.exec(content)) !== null) {
      const fromModel = match[1];
      const toModel = match[2];
      const relationName = match[3];
      const fromField = match[4];

      relationships.push({
        from: fromModel,
        to: toModel,
        type: 'many-to-one',
        foreignKey: fromField,
        description: relationName,
        confidence: 0.9,
      });
    }

    return relationships;
  }

  private extractFieldsFromPrisma(modelBody: string): string[] {
    const fields: string[] = [];
    const lines = modelBody.split('\n');
    for (const line of lines) {
      const fieldMatch = line.trim().match(/^(\w+)\s+/);
      if (fieldMatch) {
        fields.push(fieldMatch[1]);
      }
    }

    return fields;
  }

  private isCoreEntity(entityName: string): boolean {
    const name = entityName.toLowerCase();
    const coreKeywords = [
      'user',
      'users',
      'customer',
      'customers',
      'booking',
      'bookings',
      'order',
      'orders',
      'product',
      'products',
      'payment',
      'payments',
      'reservation',
      'reservations',
      'subscription',
      'subscriptions',
      'account',
      'accounts',
    ];

    return coreKeywords.some((keyword) => name.includes(keyword));
  }
}

/**
 * Supabase Database Introspector
 *
 * Connects to Supabase to query the actual database schema.
 */
export class SupabaseDatabaseIntrospector implements DatabaseIntrospector {
  private secretManager: any; // SecretManager type

  constructor(secretManager: any) {
    this.secretManager = secretManager;
  }

  async getSchema(): Promise<DatabaseSchema> {
    const entities: Entity[] = [];
    const relationships: Relationship[] = [];
    const warnings: string[] = [];

    try {
      const supabaseClient = this.secretManager.getSupabaseClient();

      if (!supabaseClient) {
        warnings.push('Supabase client not available, skipping database analysis');
        return { entities, relationships, warnings };
      }

      // Query information schema for tables
      const { data: tables, error: tablesError } = await supabaseClient
        .from('information_schema.tables')
        .select('table_name, table_type')
        .eq('table_schema', 'public');

      if (tablesError) {
        warnings.push(`Failed to query tables: ${tablesError.message}`);
        return { entities, relationships, warnings };
      }

      // Convert tables to entities
      for (const table of tables || []) {
        const entity: Entity = {
          name: table.table_name,
          type: table.table_type === 'BASE TABLE' ? 'table' : 'view',
          fieldCount: 0,
          isCore: this.isCoreEntity(table.table_name),
          confidence: 1.0,
          fields: [],
          source: 'database',
        };

        // Query columns for field count
        const { data: columns } = await supabaseClient
          .from('information_schema.columns')
          .select('column_name')
          .eq('table_schema', 'public')
          .eq('table_name', table.table_name);

        if (columns) {
          entity.fieldCount = columns.length;
          entity.fields = columns.map((c: any) => c.column_name);
        }

        entities.push(entity);
      }

      // Query foreign key constraints for relationships
      const { data: constraints, error: constraintsError } = await supabaseClient
        .from('information_schema.table_constraints')
        .select(`
          table_name,
          constraint_name,
          constraint_type
        `)
        .eq('table_schema', 'public')
        .eq('constraint_type', 'FOREIGN KEY');

      if (constraintsError) {
        warnings.push(`Failed to query constraints: ${constraintsError.message}`);
      } else {
        for (const constraint of constraints || []) {
          const { data: keyUsage } = await supabaseClient
            .from('information_schema.key_column_usage')
            .select('column_name, referenced_table_name, referenced_column_name')
            .eq('table_schema', 'public')
            .eq('constraint_name', constraint.constraint_name);

          if (keyUsage && keyUsage.length > 0) {
            const ku = keyUsage[0] as any;
            relationships.push({
              from: constraint.table_name,
              to: ku.referenced_table_name,
              type: 'many-to-one',
              foreignKey: ku.column_name,
              confidence: 1.0,
            });
          }
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      warnings.push(`Database analysis error: ${errorMessage}`);
    }

    return { entities, relationships, warnings };
  }

  getName(): string {
    return 'supabase';
  }

  private isCoreEntity(entityName: string): boolean {
    const name = entityName.toLowerCase();
    const coreKeywords = [
      'user',
      'users',
      'customer',
      'customers',
      'booking',
      'bookings',
      'order',
      'orders',
      'product',
      'products',
      'payment',
      'payments',
      'reservation',
      'reservations',
      'subscription',
      'subscriptions',
      'account',
      'accounts',
    ];

    return coreKeywords.some((keyword) => name.includes(keyword));
  }
}
