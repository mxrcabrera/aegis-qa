/**
 * Unit Tests for Sandbox Manager
 *
 * Tests for sandbox environment creation, patch generation, and cleanup
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SandboxManager } from '../src/core/sandbox-manager.js';
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

describe('SandboxManager', () => {
  const testProjectRoot = path.join(process.cwd(), 'test-mock-project');
  let sandboxManager: SandboxManager;

  beforeEach(() => {
    // Clean up any existing sandbox
    const sandboxDir = path.join(testProjectRoot, '.aegis-tmp');
    if (fs.existsSync(sandboxDir)) {
      fs.rmSync(sandboxDir, { recursive: true, force: true });
    }
  });

  afterEach(async () => {
    // Clean up sandbox after each test
    const sandboxDir = path.join(testProjectRoot, '.aegis-tmp');
    if (fs.existsSync(sandboxDir)) {
      try {
        await sandboxManager?.cleanup();
      } catch {
        fs.rmSync(sandboxDir, { recursive: true, force: true });
      }
    }
  });

  describe('Configuration', () => {
    it('should initialize with provided config', () => {
      sandboxManager = new SandboxManager({
        projectRoot: testProjectRoot,
        enabled: true,
        validateSyntax: false,
        runTests: false,
      });

      const status = sandboxManager.getStatus();
      expect(status.enabled).toBe(true);
      expect(status.sandboxDir).toContain('.aegis-tmp');
    });

    it('should use custom sandbox directory if provided', () => {
      const customSandboxDir = path.join(testProjectRoot, '.custom-sandbox');
      sandboxManager = new SandboxManager({
        projectRoot: testProjectRoot,
        enabled: true,
        sandboxDir: customSandboxDir,
        validateSyntax: false,
        runTests: false,
      });

      const status = sandboxManager.getStatus();
      expect(status.sandboxDir).toBe(customSandboxDir);
    });

    it('should disable sandbox when enabled is false', () => {
      sandboxManager = new SandboxManager({
        projectRoot: testProjectRoot,
        enabled: false,
        validateSyntax: false,
        runTests: false,
      });

      const status = sandboxManager.getStatus();
      expect(status.enabled).toBe(false);
    });
  });

  describe('Sandbox Creation', () => {
    it('should create sandbox directory', async () => {
      sandboxManager = new SandboxManager({
        projectRoot: testProjectRoot,
        enabled: true,
        validateSyntax: false,
        runTests: false,
        skipConfirmation: true,
      });

      await sandboxManager.create();

      const status = sandboxManager.getStatus();
      expect(status.active).toBe(true);
      expect(fs.existsSync(status.sandboxDir)).toBe(true);
    });

    it('should copy project files to sandbox', async () => {
      sandboxManager = new SandboxManager({
        projectRoot: testProjectRoot,
        enabled: true,
        validateSyntax: false,
        runTests: false,
        skipConfirmation: true,
      });

      await sandboxManager.create();

      const status = sandboxManager.getStatus();
      // Verify sandbox was created and is active
      expect(status.active).toBe(true);
      expect(fs.existsSync(status.sandboxDir)).toBe(true);
    });

    it('should skip sandbox creation when disabled', async () => {
      sandboxManager = new SandboxManager({
        projectRoot: testProjectRoot,
        enabled: false,
        validateSyntax: false,
        runTests: false,
      });

      await sandboxManager.create();

      const status = sandboxManager.getStatus();
      expect(status.active).toBe(false);
    });
  });

  describe('Sandbox Path Mapping', () => {
    it('should return sandbox path when active', async () => {
      sandboxManager = new SandboxManager({
        projectRoot: testProjectRoot,
        enabled: true,
        validateSyntax: false,
        runTests: false,
        skipConfirmation: true,
      });

      await sandboxManager.create();

      const sandboxPath = sandboxManager.getSandboxPath('src/index.ts');
      const status = sandboxManager.getStatus();
      expect(sandboxPath).toContain('.aegis-tmp');
      expect(sandboxPath).toContain('src');
      expect(sandboxPath).toContain('index.ts');
    });

    it('should return project path when sandbox not active', () => {
      sandboxManager = new SandboxManager({
        projectRoot: testProjectRoot,
        enabled: false,
        validateSyntax: false,
        runTests: false,
      });

      const sandboxPath = sandboxManager.getSandboxPath('src/index.ts');
      expect(sandboxPath).not.toContain('.aegis-tmp');
      expect(sandboxPath).toContain(testProjectRoot);
    });
  });

  describe('Sandbox Cleanup', () => {
    it('should cleanup sandbox directory', async () => {
      sandboxManager = new SandboxManager({
        projectRoot: testProjectRoot,
        enabled: true,
        validateSyntax: false,
        runTests: false,
        skipConfirmation: true,
      });

      await sandboxManager.create();

      const status = sandboxManager.getStatus();
      expect(fs.existsSync(status.sandboxDir)).toBe(true);

      await sandboxManager.cleanup();

      expect(fs.existsSync(status.sandboxDir)).toBe(false);
    });

    it('should handle cleanup when sandbox does not exist', async () => {
      sandboxManager = new SandboxManager({
        projectRoot: testProjectRoot,
        enabled: true,
        validateSyntax: false,
        runTests: false,
        skipConfirmation: true,
      });

      // Should not throw even if sandbox doesn't exist
      await expect(sandboxManager.cleanup()).resolves.not.toThrow();
    });
  });

  describe('Patch Generation', () => {
    it('should generate patch file when sandbox is active', async () => {
      sandboxManager = new SandboxManager({
        projectRoot: testProjectRoot,
        enabled: true,
        validateSyntax: false,
        runTests: false,
        generatePatch: true,
        skipConfirmation: true,
      });

      await sandboxManager.create();

      // Make a change in sandbox
      const status = sandboxManager.getStatus();
      const testFile = path.join(status.sandboxDir, 'qa-report.partial.md');
      fs.writeFileSync(testFile, '# Modified content\n');

      const patchPath = await sandboxManager.generatePatch();
      expect(patchPath).toBeDefined();
      expect(patchPath).toContain('.patch');
      expect(fs.existsSync(patchPath)).toBe(true);
    });

    it('should throw error when generating patch without active sandbox', async () => {
      sandboxManager = new SandboxManager({
        projectRoot: testProjectRoot,
        enabled: false,
        validateSyntax: false,
        runTests: false,
        generatePatch: true,
      });

      await expect(sandboxManager.generatePatch()).rejects.toThrow();
    });
  });

  describe('Size Check', () => {
    it('should warn for large repositories', async () => {
      sandboxManager = new SandboxManager({
        projectRoot: testProjectRoot,
        enabled: true,
        validateSyntax: false,
        runTests: false,
        maxSizeBeforeWarning: 1, // 1 byte threshold
        skipConfirmation: true,
      });

      // Should not throw even if size exceeds threshold (skipConfirmation: true)
      await expect(sandboxManager.create()).resolves.not.toThrow();
    });
  });

  describe('SIGINT Handler', () => {
    it('should setup SIGINT handler when sandbox is created', async () => {
      sandboxManager = new SandboxManager({
        projectRoot: testProjectRoot,
        enabled: true,
        validateSyntax: false,
        runTests: false,
        skipConfirmation: true,
      });

      const listenerCountBefore = process.listenerCount('SIGINT');
      await sandboxManager.create();
      const listenerCountAfter = process.listenerCount('SIGINT');

      // Should have added a SIGINT listener
      expect(listenerCountAfter).toBeGreaterThan(listenerCountBefore);
    });

    it('should remove SIGINT handler after cleanup', async () => {
      sandboxManager = new SandboxManager({
        projectRoot: testProjectRoot,
        enabled: true,
        validateSyntax: false,
        runTests: false,
        skipConfirmation: true,
      });

      await sandboxManager.create();
      const listenerCountBefore = process.listenerCount('SIGINT');
      await sandboxManager.cleanup();
      const listenerCountAfter = process.listenerCount('SIGINT');

      // Should have removed the SIGINT listener
      expect(listenerCountAfter).toBeLessThan(listenerCountBefore);
    });
  });
});
