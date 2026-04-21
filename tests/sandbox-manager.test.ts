/**
 * Tests for Sandbox Manager
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SandboxManager } from '../src/core/sandbox-manager.js';
import * as fs from 'fs';
import * as path from 'path';

// Mock execAsync
vi.mock('child_process', () => ({
  exec: vi.fn((cmd, options, callback) => {
    // Mock implementations for different commands
    if (cmd.includes('git rev-parse')) {
      callback(null, '.git', '');
    } else if (cmd.includes('du -sb')) {
      callback(null, '1024\t.', '');
    } else if (cmd.includes('git archive')) {
      callback(null, '', '');
    } else if (cmd.includes('tar -xf')) {
      callback(null, '', '');
    } else if (cmd.includes('diff -ruN')) {
      callback(null, '', '');
    } else {
      callback(new Error('Command not found'), '', '');
    }
  }),
}));

describe('SandboxManager', () => {
  const testProjectRoot = '/tmp/test-project';
  const testSandboxDir = '/tmp/test-sandbox';
  let sandboxManager: SandboxManager;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
  });

  afterEach(async () => {
    // Cleanup
    if (sandboxManager) {
      await sandboxManager.cleanup();
    }
  });

  describe('Constructor', () => {
    it('should create sandbox manager with default config', () => {
      sandboxManager = new SandboxManager({
        projectRoot: testProjectRoot,
        enabled: true,
      });

      expect(sandboxManager).toBeDefined();
      expect(sandboxManager.getSandboxDir()).toContain('.aegis-tmp');
    });

    it('should create sandbox manager with custom config', () => {
      sandboxManager = new SandboxManager({
        projectRoot: testProjectRoot,
        enabled: true,
        sandboxDir: testSandboxDir,
        isCI: true,
      });

      expect(sandboxManager.getSandboxDir()).toBe(testSandboxDir);
    });

    it('should handle disabled sandbox mode', async () => {
      sandboxManager = new SandboxManager({
        projectRoot: testProjectRoot,
        enabled: false,
      });

      const result = await sandboxManager.create();
      expect(result.active).toBe(false);
      expect(result.sandboxDir).toBe(testProjectRoot);
    });
  });

  describe('getStatus', () => {
    it('should return correct status when inactive', () => {
      sandboxManager = new SandboxManager({
        projectRoot: testProjectRoot,
        enabled: false,
      });

      const status = sandboxManager.getStatus();
      expect(status.active).toBe(false);
      expect(status.sandboxDir).toContain('.aegis-tmp');
      expect(status.originalProjectRoot).toBe(testProjectRoot);
    });
  });

  describe('getOriginalProjectRoot', () => {
    it('should return original project root', () => {
      sandboxManager = new SandboxManager({
        projectRoot: testProjectRoot,
        enabled: true,
      });

      expect(sandboxManager.getOriginalProjectRoot()).toBe(testProjectRoot);
    });
  });

  describe('cleanup', () => {
    it('should cleanup sandbox directory', async () => {
      // Create a temporary sandbox directory
      const tempSandboxDir = path.join(testProjectRoot, '.aegis-tmp-test');
      fs.mkdirSync(tempSandboxDir, { recursive: true });

      sandboxManager = new SandboxManager({
        projectRoot: testProjectRoot,
        enabled: true,
        sandboxDir: tempSandboxDir,
      });

      await sandboxManager.cleanup();

      expect(fs.existsSync(tempSandboxDir)).toBe(false);
    });

    it('should not error when sandbox does not exist', async () => {
      sandboxManager = new SandboxManager({
        projectRoot: testProjectRoot,
        enabled: true,
        sandboxDir: '/nonexistent/path',
      });

      // Should not throw
      await expect(sandboxManager.cleanup()).resolves.not.toThrow();
    });
  });
});
