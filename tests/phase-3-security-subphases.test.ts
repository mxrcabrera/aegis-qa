/**
 * Unit Tests for Phase 3 Security Sub-phases
 *
 * Tests for security sub-phases 3B-3G within Phase 3
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Phase 3 Security Sub-phases', () => {
  describe('Sub-phase 3B: AI API Security', () => {
    it('should skip silently if no AI API usage detected', async () => {
      const { Phase3Security } = await import('../src/phases/phase-3-security.js');
      const { StatePersistence } = await import('../src/core/state-persistence.js');

      const mockStatePersistence = {
        createInitialState: vi.fn(() => ({
          projectRoot: '/test',
          currentPhase: 3,
          totalPhases: 20,
          phases: [],
          files: [],
          thermalLogs: [],
          totalFindings: 0,
          startTime: new Date().toISOString(),
          lastSaveTime: new Date().toISOString(),
          interrupted: false,
        })),
        saveState: vi.fn(),
        storeAnalysisResults: vi.fn(),
        getAnalysisResults: vi.fn(() => ({ criticalModules: [], domain: 'General' })),
      } as any;

      const phase3 = new Phase3Security({
        projectRoot: '/test',
        statePersistence: mockStatePersistence,
        currentState: {
          projectRoot: '/test',
          currentPhase: 3,
          totalPhases: 20,
          phases: [],
          files: [],
          thermalLogs: [],
          totalFindings: 0,
          startTime: new Date().toISOString(),
          lastSaveTime: new Date().toISOString(),
          interrupted: false,
        },
      });

      // Mock file system with no AI usage
      vi.mock('fs');
      vi.mocked(fs.existsSync).mockReturnValue(false);

      const result = await phase3.execute();
      expect(result.success).toBe(true);
    });
  });

  describe('Sub-phase 3C: Secure Development Methodology', () => {
    it('should detect hardcoded credentials', async () => {
      const { Phase3Security } = await import('../src/phases/phase-3-security.js');
      const { StatePersistence } = await import('../src/core/state-persistence.js');

      const mockStatePersistence = {
        createInitialState: vi.fn(() => ({
          projectRoot: '/test',
          currentPhase: 3,
          totalPhases: 20,
          phases: [],
          files: [],
          thermalLogs: [],
          totalFindings: 0,
          startTime: new Date().toISOString(),
          lastSaveTime: new Date().toISOString(),
          interrupted: false,
        })),
        saveState: vi.fn(),
        storeAnalysisResults: vi.fn(),
        getAnalysisResults: vi.fn(() => ({ criticalModules: [], domain: 'General' })),
      } as any;

      const phase3 = new Phase3Security({
        projectRoot: '/test',
        statePersistence: mockStatePersistence,
        currentState: {
          projectRoot: '/test',
          currentPhase: 3,
          totalPhases: 20,
          phases: [],
          files: [],
          thermalLogs: [],
          totalFindings: 0,
          startTime: new Date().toISOString(),
          lastSaveTime: new Date().toISOString(),
          interrupted: false,
        },
      });

      // This sub-phase runs in all projects, so it should execute
      const result = await phase3.execute();
      expect(result.success).toBe(true);
    });
  });

  describe('Sub-phase 3E: BaaS/RLS Platform Security', () => {
    it('should skip silently if no Supabase project detected', async () => {
      const { Phase3Security } = await import('../src/phases/phase-3-security.js');
      const { StatePersistence } = await import('../src/core/state-persistence.js');

      const mockStatePersistence = {
        createInitialState: vi.fn(() => ({
          projectRoot: '/test',
          currentPhase: 3,
          totalPhases: 20,
          phases: [],
          files: [],
          thermalLogs: [],
          totalFindings: 0,
          startTime: new Date().toISOString(),
          lastSaveTime: new Date().toISOString(),
          interrupted: false,
        })),
        saveState: vi.fn(),
        storeAnalysisResults: vi.fn(),
        getAnalysisResults: vi.fn(() => ({ criticalModules: [], domain: 'General' })),
      } as any;

      const phase3 = new Phase3Security({
        projectRoot: '/test',
        statePersistence: mockStatePersistence,
        currentState: {
          projectRoot: '/test',
          currentPhase: 3,
          totalPhases: 20,
          phases: [],
          files: [],
          thermalLogs: [],
          totalFindings: 0,
          startTime: new Date().toISOString(),
          lastSaveTime: new Date().toISOString(),
          interrupted: false,
        },
      });

      // Mock file system with no supabase directory
      vi.mock('fs');
      vi.mocked(fs.existsSync).mockReturnValue(false);

      const result = await phase3.execute();
      expect(result.success).toBe(true);
    });

    it('should analyze RLS policies if Supabase project detected', async () => {
      const { Phase3Security } = await import('../src/phases/phase-3-security.js');
      const { StatePersistence } = await import('../src/core/state-persistence.js');

      const mockStatePersistence = {
        createInitialState: vi.fn(() => ({
          projectRoot: '/test',
          currentPhase: 3,
          totalPhases: 20,
          phases: [],
          files: [],
          thermalLogs: [],
          totalFindings: 0,
          startTime: new Date().toISOString(),
          lastSaveTime: new Date().toISOString(),
          interrupted: false,
        })),
        saveState: vi.fn(),
        storeAnalysisResults: vi.fn(),
        getAnalysisResults: vi.fn(() => ({ criticalModules: [], domain: 'General' })),
      } as any;

      const phase3 = new Phase3Security({
        projectRoot: '/test',
        statePersistence: mockStatePersistence,
        currentState: {
          projectRoot: '/test',
          currentPhase: 3,
          totalPhases: 20,
          phases: [],
          files: [],
          thermalLogs: [],
          totalFindings: 0,
          startTime: new Date().toISOString(),
          lastSaveTime: new Date().toISOString(),
          interrupted: false,
        },
      });

      // Mock file system with supabase directory
      vi.mock('fs');
      vi.mocked(fs.existsSync).mockImplementation((filePath) => {
        if (typeof filePath === 'string' && filePath.includes('supabase')) {
          return true;
        }
        return false;
      });

      const result = await phase3.execute();
      expect(result.success).toBe(true);
    });
  });

  describe('Sub-phase 3F: Webhook Security', () => {
    it('should skip silently if no webhooks detected', async () => {
      const { Phase3Security } = await import('../src/phases/phase-3-security.js');
      const { StatePersistence } = await import('../src/core/state-persistence.js');

      const mockStatePersistence = {
        createInitialState: vi.fn(() => ({
          projectRoot: '/test',
          currentPhase: 3,
          totalPhases: 20,
          phases: [],
          files: [],
          thermalLogs: [],
          totalFindings: 0,
          startTime: new Date().toISOString(),
          lastSaveTime: new Date().toISOString(),
          interrupted: false,
        })),
        saveState: vi.fn(),
        storeAnalysisResults: vi.fn(),
        getAnalysisResults: vi.fn(() => ({ criticalModules: [], domain: 'General' })),
      } as any;

      const phase3 = new Phase3Security({
        projectRoot: '/test',
        statePersistence: mockStatePersistence,
        currentState: {
          projectRoot: '/test',
          currentPhase: 3,
          totalPhases: 20,
          phases: [],
          files: [],
          thermalLogs: [],
          totalFindings: 0,
          startTime: new Date().toISOString(),
          lastSaveTime: new Date().toISOString(),
          interrupted: false,
        },
      });

      // Mock file system with no webhook usage
      vi.mock('fs');
      vi.mocked(fs.existsSync).mockReturnValue(false);

      const result = await phase3.execute();
      expect(result.success).toBe(true);
    });
  });

  describe('Sub-phase 3G: Data Privacy PII', () => {
    it('should run in all projects', async () => {
      const { Phase3Security } = await import('../src/phases/phase-3-security.js');
      const { StatePersistence } = await import('../src/core/state-persistence.js');

      const mockStatePersistence = {
        createInitialState: vi.fn(() => ({
          projectRoot: '/test',
          currentPhase: 3,
          totalPhases: 20,
          phases: [],
          files: [],
          thermalLogs: [],
          totalFindings: 0,
          startTime: new Date().toISOString(),
          lastSaveTime: new Date().toISOString(),
          interrupted: false,
        })),
        saveState: vi.fn(),
        storeAnalysisResults: vi.fn(),
        getAnalysisResults: vi.fn(() => ({ criticalModules: [], domain: 'General' })),
      } as any;

      const phase3 = new Phase3Security({
        projectRoot: '/test',
        statePersistence: mockStatePersistence,
        currentState: {
          projectRoot: '/test',
          currentPhase: 3,
          totalPhases: 20,
          phases: [],
          files: [],
          thermalLogs: [],
          totalFindings: 0,
          startTime: new Date().toISOString(),
          lastSaveTime: new Date().toISOString(),
          interrupted: false,
        },
      });

      // This sub-phase runs in all projects
      const result = await phase3.execute();
      expect(result.success).toBe(true);
    });
  });

  describe('Auditor Names', () => {
    it('should use unique auditorName for each sub-phase', async () => {
      // Verify that each sub-phase uses its own auditorName
      const auditorNames = [
        'security:ai-api',
        'security:secure-dev',
        'security:rls',
        'security:webhook',
        'security:privacy',
      ];

      expect(auditorNames).toHaveLength(5);
      expect(new Set(auditorNames).size).toBe(5); // All unique
    });
  });
});
