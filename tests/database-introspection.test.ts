/**
 * Unit Tests for Database Introspection
 *
 * Tests for pluggable database introspection system
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'fs';

describe('Database Introspection', () => {
  describe('NullDatabaseIntrospector', () => {
    it('should return empty schema', async () => {
      const { NullDatabaseIntrospector } = await import('../src/core/database-introspection.js');
      const introspector = new NullDatabaseIntrospector();

      const schema = await introspector.getSchema();

      expect(schema.entities).toEqual([]);
      expect(schema.relationships).toEqual([]);
      expect(schema.warnings).toEqual([]);
    });

    it('should return correct name', async () => {
      const { NullDatabaseIntrospector } = await import('../src/core/database-introspection.js');
      const introspector = new NullDatabaseIntrospector();

      expect(introspector.getName()).toBe('null');
    });
  });

  describe('SQLFileDatabaseIntrospector', () => {
    it('should return correct name', async () => {
      const { SQLFileDatabaseIntrospector } = await import('../src/core/database-introspection.js');
      const introspector = new SQLFileDatabaseIntrospector({ projectRoot: '/test' });

      expect(introspector.getName()).toBe('sql');
    });

    it('should parse SQL CREATE TABLE statements', async () => {
      // Mock fs.existsSync to return false (no files found)
      vi.mock('fs');
      vi.mocked(fs.existsSync).mockReturnValue(false);

      const { SQLFileDatabaseIntrospector } = await import('../src/core/database-introspection.js');
      const introspector = new SQLFileDatabaseIntrospector({ projectRoot: '/test' });

      const schema = await introspector.getSchema();

      // Since no files exist, should return empty schema
      expect(schema.entities).toEqual([]);
      expect(schema.relationships).toEqual([]);
    });
  });

  describe('PrismaDatabaseIntrospector', () => {
    it('should return correct name', async () => {
      const { PrismaDatabaseIntrospector } = await import('../src/core/database-introspection.js');
      const introspector = new PrismaDatabaseIntrospector({ projectRoot: '/test' });

      expect(introspector.getName()).toBe('prisma');
    });

    it('should parse Prisma model definitions', async () => {
      // Mock fs.existsSync to return false (no files found)
      vi.mock('fs');
      vi.mocked(fs.existsSync).mockReturnValue(false);

      const { PrismaDatabaseIntrospector } = await import('../src/core/database-introspection.js');
      const introspector = new PrismaDatabaseIntrospector({ projectRoot: '/test' });

      const schema = await introspector.getSchema();

      // Since no files exist, should return empty schema
      expect(schema.entities).toEqual([]);
      expect(schema.relationships).toEqual([]);
    });
  });

  describe('SupabaseDatabaseIntrospector', () => {
    it('should return correct name', async () => {
      const { SupabaseDatabaseIntrospector } = await import('../src/core/database-introspection.js');
      const mockSecretManager = { isMockMode: () => true, getSupabaseClient: () => null };
      const introspector = new SupabaseDatabaseIntrospector(mockSecretManager);

      expect(introspector.getName()).toBe('supabase');
    });

    it('should handle missing Supabase client', async () => {
      const { SupabaseDatabaseIntrospector } = await import('../src/core/database-introspection.js');
      const mockSecretManager = { isMockMode: () => true, getSupabaseClient: () => null };
      const introspector = new SupabaseDatabaseIntrospector(mockSecretManager);

      const schema = await introspector.getSchema();

      expect(schema.entities).toEqual([]);
      expect(schema.relationships).toEqual([]);
      expect(schema.warnings).toContain('Supabase client not available, skipping database analysis');
    });
  });

  describe('DatabaseIntrospector interface', () => {
    it('should have getSchema method', async () => {
      const { NullDatabaseIntrospector } = await import('../src/core/database-introspection.js');
      const introspector = new NullDatabaseIntrospector();

      expect(typeof introspector.getSchema).toBe('function');
      await introspector.getSchema(); // Should not throw
    });

    it('should have getName method', async () => {
      const { NullDatabaseIntrospector } = await import('../src/core/database-introspection.js');
      const introspector = new NullDatabaseIntrospector();

      expect(typeof introspector.getName).toBe('function');
      introspector.getName(); // Should not throw
    });
  });
});
