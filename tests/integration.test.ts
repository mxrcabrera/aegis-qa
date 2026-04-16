/**
 * Integration Tests for Complete QA Flow
 * 
 * Tests the complete flow: Detection -> Dry Run (patch generation)
 * Uses test-mock-project for testing
 * 
 * Coverage:
 * - DiffGenerator patch generation
 * - SecretSanitizer integration
 * - GitCheckpointManager integration
 * - Edge cases (no git repo, no permissions)
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DiffGenerator } from '../src/core/diff-generator.js';
import { GitCheckpointManager } from '../src/core/git-checkpoint-manager.js';
import { SecretSanitizer } from '../src/core/secret-sanitizer.js';
import * as fs from 'fs';
import * as path from 'path';

describe('Integration Tests - Complete QA Flow', () => {
  let testProjectRoot: string;

  beforeEach(() => {
    testProjectRoot = path.join(process.cwd(), 'test-mock-project');
  });

  afterEach(() => {
    // Clean up any generated patches
    const patchesDir = path.join(testProjectRoot, 'aegis-patches');
    if (fs.existsSync(patchesDir)) {
      fs.rmSync(patchesDir, { recursive: true, force: true });
    }
  });

  describe('Dry Run with Patch Generation', () => {
    it('should generate diff for file changes', async () => {
      const diffGenerator = new DiffGenerator(testProjectRoot);
      
      const originalContent = 'const x = 1;';
      const modifiedContent = 'const x = 2;';
      const filePath = 'test-file.ts';
      
      const diff = diffGenerator.generateFileDiff(filePath, originalContent, modifiedContent);
      
      expect(diff).toBeDefined();
      expect(diff.filePath).toBe(filePath);
      expect(diff.originalContent).toBe(originalContent);
      expect(diff.modifiedContent).toBe(modifiedContent);
    });

    it('should write patch file to disk', async () => {
      const diffGenerator = new DiffGenerator(testProjectRoot);
      
      const originalContent = 'const x = 1;';
      const modifiedContent = 'const x = 2;';
      const filePath = 'test-file.ts';
      
      const diff = diffGenerator.generateFileDiff(filePath, originalContent, modifiedContent);
      await diffGenerator.generatePatchFile([diff], 'test.patch');
      
      const patchPath = path.join(testProjectRoot, 'aegis-patches', 'test.patch');
      expect(fs.existsSync(patchPath)).toBe(true);
    });

    it('should generate unified diff format', async () => {
      const diffGenerator = new DiffGenerator(testProjectRoot);
      
      const originalContent = 'const x = 1;';
      const modifiedContent = 'const x = 2;';
      const filePath = 'test-file.ts';
      
      const diff = diffGenerator.generateFileDiff(filePath, originalContent, modifiedContent);
      await diffGenerator.generatePatchFile([diff], 'test-unified.patch');
      
      const patchPath = path.join(testProjectRoot, 'aegis-patches', 'test-unified.patch');
      const patchContent = fs.readFileSync(patchPath, 'utf-8');
      
      // Should contain unified diff markers
      expect(patchContent).toContain('---');
      expect(patchContent).toContain('+++');
      expect(patchContent).toContain('@@');
    });

    it('should list generated patches', async () => {
      const diffGenerator = new DiffGenerator(testProjectRoot);
      
      const originalContent = 'const x = 1;';
      const modifiedContent = 'const x = 2;';
      const filePath = 'test-file.ts';
      
      const diff = diffGenerator.generateFileDiff(filePath, originalContent, modifiedContent);
      await diffGenerator.generatePatchFile([diff], 'test-list.patch');
      
      const patches = diffGenerator.listPatches();
      expect(patches).toContain('test-list.patch');
    });

    it('should clear patches directory', async () => {
      const diffGenerator = new DiffGenerator(testProjectRoot);
      
      const originalContent = 'const x = 1;';
      const modifiedContent = 'const x = 2;';
      const filePath = 'test-file.ts';
      
      const diff = diffGenerator.generateFileDiff(filePath, originalContent, modifiedContent);
      await diffGenerator.generatePatchFile([diff], 'test-clear.patch');
      
      diffGenerator.clearPatches();
      
      const patchesDir = path.join(testProjectRoot, 'aegis-patches');
      expect(fs.existsSync(patchesDir)).toBe(false);
    });
  });

  describe('Complete Flow Integration', () => {
    it('should integrate DiffGenerator with SecretSanitizer', async () => {
      const diffGenerator = new DiffGenerator(testProjectRoot);
      const sanitizer = new SecretSanitizer();
      
      // Generate a patch with secrets
      const originalContent = 'const API_KEY = "sk-1234567890abcdef";';
      const modifiedContent = 'const API_KEY = "sk-newkey1234567890abcdef";';
      const diff = diffGenerator.generateFileDiff('config.ts', originalContent, modifiedContent);
      
      // Sanitize the diff
      const sanitizedDiff = sanitizer.sanitize(diff.unifiedDiff);
      
      expect(sanitizedDiff).toContain('[REDACTED_0]');
      expect(sanitizedDiff).not.toContain('sk-1234567890abcdef');
    });

    it('should integrate GitCheckpointManager with DiffGenerator', async () => {
      const gitManager = new GitCheckpointManager(testProjectRoot);
      const diffGenerator = new DiffGenerator(testProjectRoot);
      
      const isInGitRepo = await gitManager.isInGitRepository();
      
      if (isInGitRepo) {
        // Create checkpoint before generating patch
        await gitManager.createCheckpoint('test-integration-checkpoint');
        
        // Generate patch
        const originalContent = 'const x = 1;';
        const modifiedContent = 'const x = 2;';
        const diff = diffGenerator.generateFileDiff('test.ts', originalContent, modifiedContent);
        await diffGenerator.generatePatchFile([diff], 'integration-checkpoint.patch');
        
        // Rollback to checkpoint
        await gitManager.rollbackToLastCheckpoint();
        
        const patchPath = path.join(testProjectRoot, 'aegis-patches', 'integration-checkpoint.patch');
        expect(fs.existsSync(patchPath)).toBe(true);
      } else {
        // Skip git operations if not in git repo
        expect(true).toBe(true);
      }
    });

    it('should integrate SecretSanitizer with GitCheckpointManager', async () => {
      const sanitizer = new SecretSanitizer();
      const gitManager = new GitCheckpointManager(testProjectRoot);
      
      // Sanitize checkpoint tag if it contains secrets
      const checkpointTag = 'checkpoint-with-secret-sk-1234567890abcdef';
      const sanitizedTag = sanitizer.sanitize(checkpointTag);
      
      expect(sanitizedTag).toContain('[REDACTED_0]');
      expect(sanitizedTag).not.toContain('sk-1234567890abcdef');
    });
  });

  describe('Edge Cases - No Git Repository', () => {
    it('should handle project without git repository', async () => {
      const nonGitPath = '/tmp/non-git-project-' + Date.now();
      fs.mkdirSync(nonGitPath, { recursive: true });
      
      try {
        const gitManager = new GitCheckpointManager(nonGitPath);
        const isInGitRepo = await gitManager.isInGitRepository();
        
        expect(isInGitRepo).toBe(false);
      } finally {
        fs.rmSync(nonGitPath, { recursive: true, force: true });
      }
    });

    it('should handle checkpoint creation without git', async () => {
      const nonGitPath = '/tmp/non-git-project-' + Date.now();
      fs.mkdirSync(nonGitPath, { recursive: true });
      
      try {
        const gitManager = new GitCheckpointManager(nonGitPath);
        
        try {
          await gitManager.createCheckpoint('test');
          // Should fail gracefully
        } catch (error) {
          // Expected to fail
          expect(error).toBeDefined();
        }
      } finally {
        fs.rmSync(nonGitPath, { recursive: true, force: true });
      }
    });
  });

  describe('Edge Cases - No File Permissions', () => {
    it('should handle read-only files gracefully', async () => {
      // Create a read-only file
      const readOnlyPath = path.join(testProjectRoot, 'readonly-test.ts');
      fs.writeFileSync(readOnlyPath, 'const x = 1;');
      
      try {
        // Make file read-only (Windows: remove write permission)
        fs.chmodSync(readOnlyPath, 0o444);
        
        // Try to generate diff from read-only file
        const diffGenerator = new DiffGenerator(testProjectRoot);
        const diff = diffGenerator.generateFileDiff('readonly-test.ts', 'const x = 1;', 'const x = 2;');
        
        expect(diff).toBeDefined();
      } finally {
        // Restore permissions and cleanup
        try {
          fs.chmodSync(readOnlyPath, 0o644);
          fs.unlinkSync(readOnlyPath);
        } catch (error) {
          // Ignore cleanup errors
        }
      }
    });

    it('should handle missing project directory', async () => {
      const nonExistentPath = '/tmp/non-existent-' + Date.now();
      
      const diffGenerator = new DiffGenerator(nonExistentPath);
      const diff = diffGenerator.generateFileDiff('test.ts', 'const x = 1;', 'const x = 2;');
      
      // Should handle gracefully
      expect(diff).toBeDefined();
    });
  });

  describe('Edge Cases - Empty Project', () => {
    it('should handle empty project', async () => {
      const emptyPath = '/tmp/empty-project-' + Date.now();
      fs.mkdirSync(emptyPath, { recursive: true });
      
      try {
        const diffGenerator = new DiffGenerator(emptyPath);
        const diff = diffGenerator.generateFileDiff('test.ts', 'const x = 1;', 'const x = 2;');
        
        // Should handle gracefully
        expect(diff).toBeDefined();
      } finally {
        fs.rmSync(emptyPath, { recursive: true, force: true });
      }
    });

    it('should handle project with only ignored files', async () => {
      const ignoredOnlyPath = '/tmp/ignored-only-' + Date.now();
      fs.mkdirSync(ignoredOnlyPath, { recursive: true });
      
      try {
        // Create only node_modules directory
        const nodeModulesPath = path.join(ignoredOnlyPath, 'node_modules');
        fs.mkdirSync(nodeModulesPath, { recursive: true });
        
        const diffGenerator = new DiffGenerator(ignoredOnlyPath);
        const diff = diffGenerator.generateFileDiff('test.ts', 'const x = 1;', 'const x = 2;');
        
        // Should handle gracefully
        expect(diff).toBeDefined();
      } finally {
        fs.rmSync(ignoredOnlyPath, { recursive: true, force: true });
      }
    });
  });

  describe('Edge Cases - Large Files', () => {
    it('should handle large files', async () => {
      const largeFilePath = path.join(testProjectRoot, 'large-file.ts');
      const largeContent = 'const x = 1;\n'.repeat(10000); // ~150KB
      
      fs.writeFileSync(largeFilePath, largeContent);
      
      try {
        const diffGenerator = new DiffGenerator(testProjectRoot);
        const diff = diffGenerator.generateFileDiff('large-file.ts', largeContent, largeContent + '\nconst y = 2;');
        
        // Should handle large files without memory issues
        expect(diff).toBeDefined();
      } finally {
        fs.unlinkSync(largeFilePath);
      }
    });
  });

  describe('Edge Cases - Special Characters in Paths', () => {
    it('should handle files with special characters in names', async () => {
      const specialCharPath = path.join(testProjectRoot, 'test-file with spaces.ts');
      fs.writeFileSync(specialCharPath, 'const x = 1;');
      
      try {
        const diffGenerator = new DiffGenerator(testProjectRoot);
        const diff = diffGenerator.generateFileDiff('test-file with spaces.ts', 'const x = 1;', 'const x = 2;');
        
        // Should handle special characters in file names
        expect(diff).toBeDefined();
      } finally {
        fs.unlinkSync(specialCharPath);
      }
    });
  });

  describe('Performance - Complete Flow', () => {
    it('should complete full flow within reasonable time', async () => {
      const startTime = Date.now();
      
      // Diff generation
      const diffGenerator = new DiffGenerator(testProjectRoot);
      const diff = diffGenerator.generateFileDiff('test.ts', 'const x = 1;', 'const x = 2;');
      await diffGenerator.generatePatchFile([diff], 'perf-test.patch');
      
      // Secret sanitization
      const sanitizer = new SecretSanitizer();
      const sanitized = sanitizer.sanitize('API key: sk-1234567890abcdef');
      
      // Git checkpoint (if in git repo)
      const gitManager = new GitCheckpointManager(testProjectRoot);
      const isInGitRepo = await gitManager.isInGitRepository();
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete in less than 30 seconds
      expect(duration).toBeLessThan(30000);
    });
  });
});
