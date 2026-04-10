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

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';
import { SecretManager } from '../core/secret-manager.js';
import type {
  DomainMap,
  Entity,
  Relationship,
  CriticalPath,
  ServerAction,
  DomainAnalyzerConfig,
  AnalysisResult,
} from '../types/domain.js';
import type {
  DatabaseIntrospector,
} from '../core/database-introspection.js';

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
export class DomainAnalyzer {
  private config: DomainAnalyzerConfig;
  private secretManager: SecretManager;
  private databaseIntrospector: DatabaseIntrospector | null = null;
  private sourceFiles: string[] = [];

  /**
   * Creates a new DomainAnalyzer instance
   *
   * @param config - Configuration for domain analysis
   * @param secretManager - SecretManager instance for database connection
   * @param databaseIntrospector - Optional DatabaseIntrospector for schema introspection
   */
  constructor(
    config: DomainAnalyzerConfig,
    secretManager?: SecretManager,
    databaseIntrospector?: DatabaseIntrospector
  ) {
    const defaultConfig: DomainAnalyzerConfig = {
      projectRoot: process.cwd(),
      useDatabase: true,
      useAI: false,
      schemaPaths: [
        'supabase/migrations/*.sql',
        'supabase/schema.sql',
        'prisma/schema.prisma',
        'database/schema.sql',
        'lib/db/schema.ts',
        'types/database.ts',
      ],
      actionPaths: [
        'app/**/actions.ts',
        'app/**/actions/*.ts',
        'actions/*.ts',
        'lib/actions/*.ts',
      ],
    };

    this.config = { ...defaultConfig, ...config };
    this.secretManager = secretManager || new SecretManager({ mockMode: true });
    this.databaseIntrospector = databaseIntrospector || null;
  }

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
  async analyze(): Promise<AnalysisResult> {
    const warnings: string[] = [];
    const entities: Entity[] = [];
    const relationships: Relationship[] = [];
    const criticalPaths: CriticalPath[] = [];
    const serverActions: ServerAction[] = [];

    try {
      // Initialize secret manager
      if (this.config.useDatabase) {
        await this.secretManager.initialize();
      }

      // Perform static analysis
      const staticResult = await this.performStaticAnalysis();
      entities.push(...staticResult.entities);
      relationships.push(...staticResult.relationships);
      serverActions.push(...staticResult.serverActions);
      warnings.push(...staticResult.warnings);

      // Perform database analysis if introspector provided
      if (this.config.useDatabase && this.databaseIntrospector) {
        const dbResult = await this.performDatabaseAnalysis();
        entities.push(...dbResult.entities);
        relationships.push(...dbResult.relationships);
        warnings.push(...dbResult.warnings);
      } else if (this.config.useDatabase && !this.secretManager.isMockMode()) {
        // Fallback to old Supabase logic if no introspector but useDatabase is true
        const dbResult = await this.performDatabaseAnalysis();
        entities.push(...dbResult.entities);
        relationships.push(...dbResult.relationships);
        warnings.push(...dbResult.warnings);
      }

      // Infer critical paths from entities and actions
      const inferredPaths = this.inferCriticalPaths(entities, serverActions);
      criticalPaths.push(...inferredPaths);

      // Deduplicate entities and relationships
      const uniqueEntities = this.reconcileEntities(entities);
      const uniqueRelationships = this.deduplicateRelationships(relationships);

      // Calculate overall confidence
      const overallConfidence = this.calculateOverallConfidence(
        uniqueEntities,
        uniqueRelationships,
        warnings
      );

      // Determine analysis method
      const method: 'static' | 'database' | 'hybrid' =
        this.config.useDatabase && !this.secretManager.isMockMode()
          ? 'hybrid'
          : 'static';

      const domainMap: DomainMap = {
        entities: uniqueEntities,
        relationships: uniqueRelationships,
        criticalPaths,
        serverActions,
        overallConfidence,
        metadata: {
          method,
          aiAssisted: this.config.useAI,
          timestamp: new Date().toISOString(),
          sourceFiles: this.sourceFiles,
        },
      };

      // Load and apply sovereign.map.json if exists
      const mapOverride = this.loadSovereignMap();
      if (mapOverride) {
        this.applyMapOverride(domainMap, mapOverride);
      }

      return {
        success: true,
        domainMap,
        warnings,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        error: `Domain analysis failed: ${errorMessage}`,
        warnings,
      };
    }
  }

  /**
   * Performs static analysis of schema files and TypeScript types
   *
   * This method reads SQL schema files, Prisma schemas, and TypeScript type
   * definitions to infer the domain structure without connecting to the database.
   *
   * @private
   * @returns Promise<{entities: Entity[], relationships: Relationship[], serverActions: ServerAction[], warnings: string[]}>
   */
  private async performStaticAnalysis(): Promise<{
    entities: Entity[];
    relationships: Relationship[];
    serverActions: ServerAction[];
    warnings: string[];
  }> {
    const entities: Entity[] = [];
    const relationships: Relationship[] = [];
    const serverActions: ServerAction[] = [];
    const warnings: string[] = [];

    // Find schema files
    for (const pattern of this.config.schemaPaths) {
      const files = await glob(pattern, {
        cwd: this.config.projectRoot,
        absolute: true,
      });

      // Sort for deterministic execution
      files.sort();

      for (const file of files) {
        this.sourceFiles.push(file);

        try {
          const content = fs.readFileSync(file, 'utf-8');
          const fileExt = path.extname(file);

          if (fileExt === '.sql') {
            const sqlEntities = this.parseSQLSchema(content, file);
            entities.push(...sqlEntities);
          } else if (fileExt === '.prisma') {
            const prismaEntities = this.parsePrismaSchema(content, file);
            entities.push(...prismaEntities);
          } else if (fileExt === '.ts') {
            const tsEntities = this.parseTypeScriptTypes(content, file);
            entities.push(...tsEntities);
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          warnings.push(`Failed to parse ${file}: ${errorMessage}`);
        }
      }
    }

    // Find server actions
    for (const pattern of this.config.actionPaths) {
      const files = await glob(pattern, {
        cwd: this.config.projectRoot,
        absolute: true,
      });

      // Sort for deterministic execution
      files.sort();

      for (const file of files) {
        this.sourceFiles.push(file);

        try {
          const content = fs.readFileSync(file, 'utf-8');
          const actions = this.parseServerActions(content, file);
          serverActions.push(...actions);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          warnings.push(`Failed to parse actions ${file}: ${errorMessage}`);
        }
      }
    }

    // Infer relationships from entities
    const inferredRelationships = this.inferRelationships(entities);
    relationships.push(...inferredRelationships);

    return { entities, relationships, serverActions, warnings };
  }

  /**
   * Performs database analysis by connecting to Supabase
   *
   * This method queries the actual database schema to get accurate entity
   * and relationship information. Requires valid Supabase credentials.
   *
   * @private
   * @returns Promise<{entities: Entity[], relationships: Relationship[], warnings: string[]}>
   */
  private async performDatabaseAnalysis(): Promise<{
    entities: Entity[];
    relationships: Relationship[];
    warnings: string[];
  }> {
    // Use DatabaseIntrospector if provided
    if (this.databaseIntrospector) {
      const schema = await this.databaseIntrospector.getSchema();
      return {
        entities: schema.entities,
        relationships: schema.relationships,
        warnings: schema.warnings,
      };
    }

    // Fallback to old Supabase logic for backward compatibility
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
          fieldCount: 0, // Will be updated with column query
          isCore: this.isCoreEntity(table.table_name),
          confidence: 1.0, // Database source has high confidence
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
          entity.fields = columns.map((c: { column_name: string }) => c.column_name);
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
        // Query key column usage for foreign keys
        for (const constraint of constraints || []) {
          const { data: keyUsage } = await supabaseClient
            .from('information_schema.key_column_usage')
            .select('column_name, referenced_table_name, referenced_column_name')
            .eq('table_schema', 'public')
            .eq('constraint_name', constraint.constraint_name);

          if (keyUsage && keyUsage.length > 0) {
            const ku = keyUsage[0] as { referenced_table_name: string; column_name: string };
            relationships.push({
              from: constraint.table_name,
              to: ku.referenced_table_name,
              type: 'many-to-one', // Default assumption
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

  /**
   * Parses SQL schema file to extract entities
   *
   * @private
   * @param content - SQL file content
   * @param filePath - Path to the SQL file
   * @returns Entity[] - Extracted entities
   */
  private parseSQLSchema(content: string, filePath: string): Entity[] {
    const entities: Entity[] = [];

    // Match CREATE TABLE statements
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
            confidence: 0.8, // SQL parsing has good but not perfect confidence
            fields,
            description: `Table defined in ${path.basename(filePath)}`,
            source: 'sql',
          });
        }
      }
    }

    return entities;
  }

  /**
   * Parses Prisma schema file to extract entities
   *
   * @private
   * @param content - Prisma schema content
   * @param filePath - Path to the Prisma file
   * @returns Entity[] - Extracted entities
   */
  private parsePrismaSchema(content: string, filePath: string): Entity[] {
    const entities: Entity[] = [];

    // Match model definitions
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
        confidence: 0.9, // Prisma has high confidence
        fields,
        description: `Prisma model defined in ${path.basename(filePath)}`,
        source: 'prisma',
      });
    }

    return entities;
  }

  /**
   * Parses TypeScript type definitions to extract entities
   *
   * @private
   * @param content - TypeScript file content
   * @param filePath - Path to the TypeScript file
   * @returns Entity[] - Extracted entities
   */
  private parseTypeScriptTypes(content: string, filePath: string): Entity[] {
    const entities: Entity[] = [];

    // Match interface or type definitions that look like database entities
    const typeRegex = /(?:interface|type)\s+(\w+)(?:\s+extends\s+\w+)?\s*\{([^}]+)\}/gi;
    let match;

    while ((match = typeRegex.exec(content)) !== null) {
      const typeName = match[1];
      const typeBody = match[2];
      const fields = this.extractFieldsFromTypeScript(typeBody);

      // Only include if it looks like a database entity (has id field, etc.)
      if (fields.some((f) => f.toLowerCase() === 'id')) {
        entities.push({
          name: typeName,
          type: 'table',
          fieldCount: fields.length,
          isCore: this.isCoreEntity(typeName),
          confidence: 0.6, // TypeScript inference has lower confidence
          fields,
          description: `TypeScript type defined in ${path.basename(filePath)}`,
          source: 'typescript',
        });
      }
    }

    return entities;
  }

  /**
   * Parses Server Actions file to extract action metadata
   *
   * @private
   * @param content - Server Actions file content
   * @param filePath - Path to the actions file
   * @returns ServerAction[] - Extracted server actions
   */
  private parseServerActions(content: string, filePath: string): ServerAction[] {
    const actions: ServerAction[] = [];

    // Match "use server" directive and function definitions
    const functionRegex = /(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\(/gi;
    const arrowFunctionRegex = /(?:export\s+)?(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?\(/gi;

    const matches = [
      ...content.matchAll(functionRegex),
      ...content.matchAll(arrowFunctionRegex),
    ];

    for (const match of matches) {
      const functionName = match[1];
      const entities = this.extractEntitiesFromFunction(content, functionName);

      if (entities.length > 0) {
        const actionType = this.inferActionType(functionName, content);

        actions.push({
          filePath,
          functionName,
          entities,
          actionType,
          description: `Server action: ${functionName}`,
        });
      }
    }

    return actions;
  }

  /**
   * Extracts field names from SQL CREATE TABLE statement
   *
   * @private
   * @param content - SQL content
   * @param tableName - Table name to extract fields for
   * @returns string[] - Field names
   */
  private extractFieldsFromSQL(content: string, tableName: string): string[] {
    const fields: string[] = [];

    // Find the table definition
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

  /**
   * Extracts field names from Prisma model body
   *
   * @private
   * @param modelBody - Prisma model body content
   * @returns string[] - Field names
   */
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

  /**
   * Extracts field names from TypeScript type/interface body
   *
   * @private
   * @param typeBody - TypeScript type body content
   * @returns string[] - Field names
   */
  private extractFieldsFromTypeScript(typeBody: string): string[] {
    const fields: string[] = [];

    const lines = typeBody.split('\n');
    for (const line of lines) {
      const fieldMatch = line.trim().match(/^(\w+)\s*:/);
      if (fieldMatch) {
        fields.push(fieldMatch[1]);
      }
    }

    return fields;
  }

  /**
   * Extracts entity names referenced in a function
   *
   * @private
   * @param content - File content
   * @param functionName - Function name to analyze
   * @returns string[] - Referenced entity names
   */
  private extractEntitiesFromFunction(content: string, functionName: string): string[] {
    const entities: string[] = [];
    const commonEntityNames = [
      'user',
      'users',
      'profile',
      'profiles',
      'session',
      'sessions',
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
    ];

    // Find the function body
    const functionRegex = new RegExp(
      `(?:export\\s+)?(?:async\\s+)?function\\s+${functionName}\\s*\\([^)]*\\)\\s*\\{([^}]*(?:\\{[^}]*\\}[^}]*)*)\\}`,
      's'
    );
    const match = content.match(functionRegex);

    if (match && match[1]) {
      const functionBody = match[1].toLowerCase();

      // Check for common entity names
      for (const entity of commonEntityNames) {
        if (functionBody.includes(entity)) {
          entities.push(entity);
        }
      }
    }

    return entities;
  }

  /**
   * Infers action type from function name and content
   *
   * @private
   * @param functionName - Function name
   * @param content - File content
   * @returns Action type
   */
  private inferActionType(
    functionName: string,
    content: string
  ): 'create' | 'read' | 'update' | 'delete' | 'custom' {
    const name = functionName.toLowerCase();
    const contentLower = content.toLowerCase();

    if (name.startsWith('create') || name.startsWith('add') || name.startsWith('insert')) {
      return 'create';
    }
    if (name.startsWith('get') || name.startsWith('fetch') || name.startsWith('find') || name.startsWith('list')) {
      return 'read';
    }
    if (name.startsWith('update') || name.startsWith('edit') || name.startsWith('modify')) {
      return 'update';
    }
    if (name.startsWith('delete') || name.startsWith('remove')) {
      return 'delete';
    }

    // Infer from content if name is ambiguous
    if (contentLower.includes('insert into') || contentLower.includes('create(')) {
      return 'create';
    }
    if (contentLower.includes('select') || contentLower.includes('find(')) {
      return 'read';
    }
    if (contentLower.includes('update') || contentLower.includes('set')) {
      return 'update';
    }
    if (contentLower.includes('delete from') || contentLower.includes('remove')) {
      return 'delete';
    }

    return 'custom';
  }

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
  private inferRelationships(entities: Entity[]): Relationship[] {
    const relationships: Relationship[] = [];

    for (const entity of entities) {
      for (const field of entity.fields) {
        // Check if field is a foreign key (ends with _id)
        if (field.endsWith('_id')) {
          const referencedEntityName = field.replace('_id', '');

          // Find the referenced entity
          const referencedEntity = entities.find(
            (e) => e.name.toLowerCase() === referencedEntityName.toLowerCase()
          );

          if (referencedEntity) {
            relationships.push({
              from: entity.name,
              to: referencedEntity.name,
              type: 'many-to-one',
              foreignKey: field,
              confidence: 0.7, // Inferred relationships have moderate confidence
            });
          }
        }
      }
    }

    return relationships;
  }

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
  private inferCriticalPaths(
    entities: Entity[],
    serverActions: ServerAction[]
  ): CriticalPath[] {
    const criticalPaths: CriticalPath[] = [];
    const entityNames = entities.map((e) => e.name.toLowerCase());

    // Detect authentication path
    if (entityNames.some((n) => n.includes('user') || n.includes('session'))) {
      criticalPaths.push({
        name: 'Authentication',
        type: 'auth',
        entities: entities.filter((e) => e.name.toLowerCase().includes('user')).map((e) => e.name),
        actions: serverActions
          .filter((a) => a.functionName.toLowerCase().includes('auth') || a.functionName.toLowerCase().includes('login'))
          .map((a) => a.functionName),
        description: 'User authentication and session management',
        confidence: 0.8,
      });
    }

    // Detect booking/reservation path
    if (entityNames.some((n) => n.includes('booking') || n.includes('reservation'))) {
      criticalPaths.push({
        name: 'Booking',
        type: 'booking',
        entities: entities
          .filter((e) => e.name.toLowerCase().includes('booking') || e.name.toLowerCase().includes('reservation'))
          .map((e) => e.name),
        actions: serverActions
          .filter((a) => a.functionName.toLowerCase().includes('book') || a.functionName.toLowerCase().includes('reserve'))
          .map((a) => a.functionName),
        description: 'Booking and reservation management',
        confidence: 0.8,
      });
    }

    // Detect payment path
    if (entityNames.some((n) => n.includes('payment') || n.includes('order'))) {
      criticalPaths.push({
        name: 'Payment',
        type: 'payment',
        entities: entities
          .filter((e) => e.name.toLowerCase().includes('payment') || e.name.toLowerCase().includes('order'))
          .map((e) => e.name),
        actions: serverActions
          .filter((a) => a.functionName.toLowerCase().includes('pay') || a.functionName.toLowerCase().includes('order'))
          .map((a) => a.functionName),
        description: 'Payment processing and order management',
        confidence: 0.8,
      });
    }

    return criticalPaths;
  }

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
  private reconcileEntities(entities: Entity[]): Entity[] {
    const reconciled: Entity[] = [];

    for (const entity of entities) {
      const normalizedName = entity.name.toLowerCase();
      const baseName = normalizedName.replace(/s$/, ''); // Remove trailing 's' for plural check

      // Check if we've already processed a similar entity
      let merged = false;

      for (const existing of reconciled) {
        const existingNormalizedName = existing.name.toLowerCase();
        const existingBaseName = existingNormalizedName.replace(/s$/, '');

        // Check for exact match
        if (existingNormalizedName === normalizedName) {
          // Merge sources
          if (existing.source !== entity.source) {
            existing.source = 'multiple';
            existing.confidence = Math.max(existing.confidence, entity.confidence);
            // Merge fields
            const uniqueFields = new Set([...existing.fields, ...entity.fields]);
            existing.fields = Array.from(uniqueFields);
            existing.fieldCount = existing.fields.length;
          }
          merged = true;
          break;
        }

        // Check for singular/plural match (User vs users)
        if (
          existingBaseName === baseName &&
          (existingNormalizedName.endsWith('s') || normalizedName.endsWith('s'))
        ) {
          // Merge into the singular version
          const singularName = existingNormalizedName.endsWith('s')
            ? existingNormalizedName.slice(0, -1)
            : existingNormalizedName;
          const pluralName = existingNormalizedName.endsWith('s')
            ? existingNormalizedName
            : normalizedName;

          existing.name = singularName;
          existing.source = 'multiple';
          existing.confidence = Math.max(existing.confidence, entity.confidence);
          // Merge fields
          const uniqueFields = new Set([...existing.fields, ...entity.fields]);
          existing.fields = Array.from(uniqueFields);
          existing.fieldCount = existing.fields.length;
          // Update description
          existing.description = `${existing.description || ''} (also detected as: ${pluralName})`.trim();
          merged = true;
          break;
        }
      }

      if (!merged) {
        reconciled.push({ ...entity });
      }
    }

    return reconciled;
  }

  /**
   * Deduplicates relationships based on from/to pair
   *
   * @private
   * @param relationships - List of relationships to deduplicate
   * @returns Relationship[] - Deduplicated relationships
   */
  private deduplicateRelationships(relationships: Relationship[]): Relationship[] {
    const relationshipMap = new Map<string, Relationship>();

    for (const relationship of relationships) {
      const key = `${relationship.from}-${relationship.to}`;
      const existing = relationshipMap.get(key);

      if (!existing || relationship.confidence > existing.confidence) {
        relationshipMap.set(key, relationship);
      }
    }

    return Array.from(relationshipMap.values());
  }

  /**
   * Calculates overall confidence score for the analysis
   *
   * @private
   * @param entities - List of entities
   * @param relationships - List of relationships
   * @param warnings - List of warnings
   * @returns number - Overall confidence score (0-1)
   */
  private calculateOverallConfidence(
    entities: Entity[],
    relationships: Relationship[],
    warnings: string[]
  ): number {
    if (entities.length === 0) {
      return 0;
    }

    const avgEntityConfidence =
      entities.reduce((sum, e) => sum + e.confidence, 0) / entities.length;
    const avgRelationshipConfidence =
      relationships.length > 0
        ? relationships.reduce((sum, r) => sum + r.confidence, 0) / relationships.length
        : 1;

    // Penalize for warnings
    const warningPenalty = Math.min(warnings.length * 0.05, 0.3);

    const overallConfidence = (avgEntityConfidence * 0.6 + avgRelationshipConfidence * 0.4) * (1 - warningPenalty);

    return Math.max(0, Math.min(1, overallConfidence));
  }

  /**
   * Loads sovereign.map.json configuration file if it exists
   *
   * This method looks for a sovereign.map.json file in the project root
   * that can override automatic inferences.
   *
   * @private
   * @returns Partial<DomainMap> | null - Map configuration or null if not found
   */
  private loadSovereignMap(): Partial<DomainMap> | null {
    const mapPath = path.join(this.config.projectRoot, 'sovereign.map.json');

    if (!fs.existsSync(mapPath)) {
      return null;
    }

    try {
      const content = fs.readFileSync(mapPath, 'utf-8');
      const mapConfig = JSON.parse(content);

      // Validate structure
      if (!mapConfig || typeof mapConfig !== 'object') {
        console.warn('[DomainAnalyzer] Invalid sovereign.map.json structure');
        return null;
      }

      return mapConfig;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.warn(`[DomainAnalyzer] Failed to load sovereign.map.json: ${errorMessage}`);
      return null;
    }
  }

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
  private applyMapOverride(domainMap: DomainMap, override: Partial<DomainMap>): void {
    // Override entity properties
    if (override.entities) {
      for (const overrideEntity of override.entities) {
        const existingIndex = domainMap.entities.findIndex(
          (e) => e.name.toLowerCase() === overrideEntity.name?.toLowerCase()
        );

        if (existingIndex !== -1 && overrideEntity) {
          // Apply overrides while preserving source
          domainMap.entities[existingIndex] = {
            ...domainMap.entities[existingIndex],
            ...overrideEntity,
            source: 'manual',
            confidence: 1.0, // Manual overrides have maximum confidence
          };
        } else if (overrideEntity) {
          // Add new entity
          domainMap.entities.push({
            ...overrideEntity,
            source: 'manual',
            confidence: 1.0,
            fields: overrideEntity.fields || [],
            fieldCount: overrideEntity.fieldCount || 0,
            isCore: overrideEntity.isCore || false,
            type: overrideEntity.type || 'table',
          });
        }
      }
    }

    // Override critical paths
    if (override.criticalPaths) {
      for (const overridePath of override.criticalPaths) {
        const existingIndex = domainMap.criticalPaths.findIndex(
          (cp) => cp.name.toLowerCase() === overridePath.name?.toLowerCase()
        );

        if (existingIndex !== -1 && overridePath) {
          domainMap.criticalPaths[existingIndex] = {
            ...domainMap.criticalPaths[existingIndex],
            ...overridePath,
            confidence: 1.0,
          };
        } else if (overridePath) {
          domainMap.criticalPaths.push({
            ...overridePath,
            confidence: 1.0,
            entities: overridePath.entities || [],
            actions: overridePath.actions || [],
          });
        }
      }
    }
  }
}
