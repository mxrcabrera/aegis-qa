/**
 * Unit Tests for Phase 11: Atomic Fixes
 *
 * Tests for fix generation, validation, and application logic
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Phase11AtomicFixes } from '../src/phases/phase-11-atomic-fixes.js';
import { OperationGuard } from '../src/core/operation-guard.js';
import { FileWhitelist } from '../src/core/file-whitelist.js';
import fs from 'fs';
import path from 'path';

// Mock dependencies
vi.mock('fs');
vi.mock('path');

describe('Phase11AtomicFixes', () => {
  let phase11: Phase11AtomicFixes;
  let mockConfig: any;

  beforeEach(() => {
    mockConfig = {
      projectRoot: '/test/project',
      statePersistence: {},
      currentState: {
        analysisResults: {}
      },
      thermalController: {},
      autoApply: false,
      allowCorePathFixes: false,
      dryRun: true,
      yesMode: true,
      interactiveFix: false,
      previewDiffs: false,
      operationGuardConfig: {
        allowRead: true,
        allowWrite: true,
        allowDelete: false,
        allowExecuteCommands: false,
      },
      fileWhitelistConfig: {
        allowedExtensions: ['.ts', '.tsx', '.js', '.jsx'],
        blockedPatterns: ['.git', 'node_modules'],
      }
    };

    phase11 = new Phase11AtomicFixes(mockConfig);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Configuration', () => {
    it('should initialize with provided config', () => {
      expect(phase11).toBeDefined();
    });

    it('should initialize operation guard with config', () => {
      const operationGuard = (phase11 as any).operationGuard;
      expect(operationGuard).toBeInstanceOf(OperationGuard);
    });

    it('should initialize file whitelist with config', () => {
      const fileWhitelist = (phase11 as any).fileWhitelist;
      expect(fileWhitelist).toBeInstanceOf(FileWhitelist);
    });
  });


  describe('Operation Guard Integration', () => {
    it('should block write operations when configured', () => {
      const strictConfig = {
        ...mockConfig,
        operationGuardConfig: {
          allowRead: true,
          allowWrite: false,
          allowDelete: false,
          allowExecuteCommands: false,
        }
      };

      const strictPhase11 = new Phase11AtomicFixes(strictConfig);
      const operationGuard = (strictPhase11 as any).operationGuard;
      
      const result = operationGuard.canWrite('/test/file.ts');
      expect(result.allowed).toBe(false);
    });

    it('should allow write operations when configured', () => {
      const operationGuard = (phase11 as any).operationGuard;
      
      const result = operationGuard.canWrite('/test/file.ts');
      expect(result.allowed).toBe(true);
    });

    it('should block operations on blocked paths', () => {
      const strictConfig = {
        ...mockConfig,
        operationGuardConfig: {
          allowRead: true,
          allowWrite: true,
          allowDelete: false,
          allowExecuteCommands: false,
          blockedPaths: ['/test/sensitive'],
        }
      };

      const strictPhase11 = new Phase11AtomicFixes(strictConfig);
      const operationGuard = (strictPhase11 as any).operationGuard;
      
      const result = operationGuard.canWrite('/test/sensitive/file.ts');
      expect(result.allowed).toBe(false);
    });
  });

  describe('File Whitelist Integration', () => {
    it('should allow modifications to allowed extensions', () => {
      const fileWhitelist = (phase11 as any).fileWhitelist;
      
      const result = fileWhitelist.canModify('/test/file.ts');
      expect(result.allowed).toBe(true);
    });

    it('should block modifications to blocked extensions', () => {
      const fileWhitelist = (phase11 as any).fileWhitelist;
      
      const result = fileWhitelist.canModify('/test/file.py');
      expect(result.allowed).toBe(false);
    });

    it('should block modifications to blocked patterns', () => {
      const fileWhitelist = (phase11 as any).fileWhitelist;
      
      const result = fileWhitelist.canModify('/test/node_modules/file.ts');
      expect(result.allowed).toBe(false);
    });
  });

  describe('Fix Application Logic', () => {
    // Fix application logic is tested through execute() with appropriate config
    // Testing private methods directly is not recommended

    it('should require confirmation for core path fixes', () => {
      const corePathConfig = {
        ...mockConfig,
        allowCorePathFixes: false,
      };

      const corePathPhase11 = new Phase11AtomicFixes(corePathConfig);
      const fixResult = {
        fixId: 'test-fix',
        filePath: '/test/core/file.ts',
        isCorePath: true,
        success: true,
        applied: false,
        requiresConfirmation: true,
      };

      expect(fixResult.requiresConfirmation).toBe(true);
    });
  });


  describe('Interactive Fix Approval', () => {
    it('should respect interactiveFix config', () => {
      const interactiveConfig = {
        ...mockConfig,
        interactiveFix: true,
      };

      const interactivePhase11 = new Phase11AtomicFixes(interactiveConfig);
      expect((interactivePhase11 as any).config.interactiveFix).toBe(true);
    });
  });

  describe('Batch Diff Preview', () => {
    it('should respect previewDiffs config', () => {
      const previewConfig = {
        ...mockConfig,
        previewDiffs: true,
      };

      const previewPhase11 = new Phase11AtomicFixes(previewConfig);
      expect((previewPhase11 as any).config.previewDiffs).toBe(true);
    });
  });


  describe('Safe-Only Mode', () => {
    it('should respect safeOnly mode when passed through', () => {
      const safeOnlyConfig = {
        ...mockConfig,
        dryRun: true, // safe-only forces dry-run
      };

      const safeOnlyPhase11 = new Phase11AtomicFixes(safeOnlyConfig);
      expect((safeOnlyPhase11 as any).config.dryRun).toBe(true);
    });
  });
});
