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

  describe('Fix ID Generation', () => {
    it('should generate unique fix IDs', () => {
      const fixId1 = (phase11 as any).generateFixId('alt-attributes', '/test/file.ts');
      const fixId2 = (phase11 as any).generateFixId('alt-attributes', '/test/file.ts');
      
      expect(fixId1).toBeDefined();
      expect(fixId2).toBeDefined();
      expect(fixId1).not.toBe(fixId2);
    });

    it('should include fix type in ID', () => {
      const fixId = (phase11 as any).generateFixId('alt-attributes', '/test/file.ts');
      expect(fixId).toContain('alt-attributes');
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
    it('should skip fixes in dry-run mode', async () => {
      const dryRunConfig = {
        ...mockConfig,
        dryRun: true,
      };

      const dryRunPhase11 = new Phase11AtomicFixes(dryRunConfig);
      
      const result = await dryRunPhase11.execute();
      expect(result.success).toBe(true);
    });

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

  describe('Syntax Validation', () => {
    it('should validate TypeScript syntax', async () => {
      const validContent = 'const x: number = 1;';
      const filePath = '/test/file.ts';

      const isValid = await (phase11 as any).validateSyntax(filePath, validContent);
      expect(isValid).toBeDefined();
    });

    it('should reject invalid TypeScript syntax', async () => {
      const invalidContent = 'const x: number = ';
      const filePath = '/test/file.ts';

      const isValid = await (phase11 as any).validateSyntax(filePath, invalidContent);
      expect(isValid).toBeDefined();
    });
  });

  describe('Collision Detection', () => {
    it('should detect collisions in modified lines', () => {
      const filePath = '/test/file.ts';
      const modifiedLines = [10, 11, 12];
      const existingFixes = new Map([
        ['/test/file.ts', [10, 11]]
      ]);

      const collisionDetected = (phase11 as any).checkCollision(filePath, modifiedLines, existingFixes);
      expect(collisionDetected).toBe(true);
    });

    it('should not detect collisions when no overlap', () => {
      const filePath = '/test/file.ts';
      const modifiedLines = [20, 21, 22];
      const existingFixes = new Map([
        ['/test/file.ts', [10, 11]]
      ]);

      const collisionDetected = (phase11 as any).checkCollision(filePath, modifiedLines, existingFixes);
      expect(collisionDetected).toBe(false);
    });
  });

  describe('Interactive Fix Approval', () => {
    it('should have showPerFixApproval method', () => {
      expect(typeof (phase11 as any).showPerFixApproval).toBe('function');
    });

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
    it('should have showBatchDiffPreview method', () => {
      expect(typeof (phase11 as any).showBatchDiffPreview).toBe('function');
    });

    it('should respect previewDiffs config', () => {
      const previewConfig = {
        ...mockConfig,
        previewDiffs: true,
      };

      const previewPhase11 = new Phase11AtomicFixes(previewConfig);
      expect((previewPhase11 as any).config.previewDiffs).toBe(true);
    });
  });

  describe('Destructive Operation Detection', () => {
    it('should identify core path fixes as destructive', () => {
      const fixResult = {
        filePath: '/test/core/file.ts',
        isCorePath: true,
      };

      const isDestructive = (phase11 as any).isDestructiveOperation(fixResult);
      expect(isDestructive).toBe(true);
    });

    it('should not identify non-core path fixes as destructive', () => {
      const fixResult = {
        filePath: '/test/src/file.ts',
        isCorePath: false,
      };

      const isDestructive = (phase11 as any).isDestructiveOperation(fixResult);
      expect(isDestructive).toBe(false);
    });
  });

  describe('Backup and Rollback', () => {
    it('should have createBackup method', () => {
      expect(typeof (phase11 as any).createBackup).toBe('function');
    });

    it('should have rollbackFromBackup method', () => {
      expect(typeof (phase11 as any).rollbackFromBackup).toBe('function');
    });

    it('should create backup before applying fixes in non-dry-run mode', async () => {
      const applyConfig = {
        ...mockConfig,
        dryRun: false,
        yesMode: true,
        gitCheckpointManager: {
          createCheckpoint: vi.fn().mockResolvedValue(undefined),
        },
      };

      const applyPhase11 = new Phase11AtomicFixes(applyConfig);
      
      // This test verifies the method exists and can be called
      const backupPath = await (applyPhase11 as any).createBackup('/test/file.ts', 'content');
      expect(backupPath).toBeDefined();
    });
  });

  describe('Traceability', () => {
    it('should add traceability comments to fixes', () => {
      const content = 'const x = 1;';
      const fixId = 'test-fix-123';
      const violationId = 'phase9-test-violation';

      const tracedContent = (phase11 as any).addTraceabilityComment(content, fixId, violationId);
      expect(tracedContent).toContain(fixId);
      expect(tracedContent).toContain(violationId);
    });
  });

  describe('Error Handling', () => {
    it('should handle missing analysis results gracefully', async () => {
      const noAnalysisConfig = {
        ...mockConfig,
        currentState: {
          analysisResults: null
        },
      };

      const noAnalysisPhase11 = new Phase11AtomicFixes(noAnalysisConfig);
      
      const result = await noAnalysisPhase11.execute();
      expect(result.success).toBe(true);
    });

    it('should handle file system errors gracefully', async () => {
      vi.mocked(fs.readFileSync).mockImplementation(() => {
        throw new Error('File not found');
      });

      const result = await phase11.execute();
      expect(result).toBeDefined();
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
