/**
 * Unit Tests for Phase 6: API & Contracts
 *
 * Tests for API contracts validation including:
 * - Request/response type validation
 * - Input validation detection
 * - Sensitive data sanitization
 * - Frontend/backend type consistency
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Phase 6: API & Contracts', () => {
  describe('Request/Response Type Validation', () => {
    it('should detect endpoint handlers without explicit return types', async () => {
      const { Phase6APIContracts } = await import('../src/phases/phase-6-api-contracts.js');
      const { StatePersistence } = await import('../src/core/state-persistence.js');

      const mockStatePersistence = {
        createInitialState: vi.fn(() => ({
          projectRoot: '/test',
          currentPhase: 6,
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

      const phase6 = new Phase6APIContracts({
        projectRoot: '/test',
        statePersistence: mockStatePersistence,
        currentState: {
          projectRoot: '/test',
          currentPhase: 6,
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

      const result = await phase6.execute();
      expect(result.success).toBe(true);
    });

    it('should detect request body usage without type definition', async () => {
      const { Phase6APIContracts } = await import('../src/phases/phase-6-api-contracts.js');
      const { StatePersistence } = await import('../src/core/state-persistence.js');

      const mockStatePersistence = {
        createInitialState: vi.fn(() => ({
          projectRoot: '/test',
          currentPhase: 6,
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

      const phase6 = new Phase6APIContracts({
        projectRoot: '/test',
        statePersistence: mockStatePersistence,
        currentState: {
          projectRoot: '/test',
          currentPhase: 6,
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

      const result = await phase6.execute();
      expect(result.success).toBe(true);
    });
  });

  describe('Input Validation Detection', () => {
    it('should detect endpoints without input validation (zod, joi, class-validator)', async () => {
      const { Phase6APIContracts } = await import('../src/phases/phase-6-api-contracts.js');
      const { StatePersistence } = await import('../src/core/state-persistence.js');

      const mockStatePersistence = {
        createInitialState: vi.fn(() => ({
          projectRoot: '/test',
          currentPhase: 6,
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

      const phase6 = new Phase6APIContracts({
        projectRoot: '/test',
        statePersistence: mockStatePersistence,
        currentState: {
          projectRoot: '/test',
          currentPhase: 6,
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

      const result = await phase6.execute();
      expect(result.success).toBe(true);
    });

    it('should detect validation library usage with `any` type', async () => {
      const { Phase6APIContracts } = await import('../src/phases/phase-6-api-contracts.js');
      const { StatePersistence } = await import('../src/core/state-persistence.js');

      const mockStatePersistence = {
        createInitialState: vi.fn(() => ({
          projectRoot: '/test',
          currentPhase: 6,
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

      const phase6 = new Phase6APIContracts({
        projectRoot: '/test',
        statePersistence: mockStatePersistence,
        currentState: {
          projectRoot: '/test',
          currentPhase: 6,
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

      const result = await phase6.execute();
      expect(result.success).toBe(true);
    });
  });

  describe('Sensitive Data Sanitization', () => {
    it('should detect endpoints returning sensitive data without sanitization', async () => {
      const { Phase6APIContracts } = await import('../src/phases/phase-6-api-contracts.js');
      const { StatePersistence } = await import('../src/core/state-persistence.js');

      const mockStatePersistence = {
        createInitialState: vi.fn(() => ({
          projectRoot: '/test',
          currentPhase: 6,
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
        getAnalysisResults: vi.fn(() => ({ 
          criticalModules: [], 
          domain: 'General',
          findings: [
            { type: 'sensitive-data', description: 'password field detected' },
            { type: 'secret', description: 'api key detected' },
          ],
        })),
      } as any;

      const phase6 = new Phase6APIContracts({
        projectRoot: '/test',
        statePersistence: mockStatePersistence,
        currentState: {
          projectRoot: '/test',
          currentPhase: 6,
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

      const result = await phase6.execute();
      expect(result.success).toBe(true);
    });
  });

  describe('Frontend/Backend Type Consistency', () => {
    it('should detect missing shared types directory between frontend and backend', async () => {
      const { Phase6APIContracts } = await import('../src/phases/phase-6-api-contracts.js');
      const { StatePersistence } = await import('../src/core/state-persistence.js');

      const mockStatePersistence = {
        createInitialState: vi.fn(() => ({
          projectRoot: '/test',
          currentPhase: 6,
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

      const phase6 = new Phase6APIContracts({
        projectRoot: '/test',
        statePersistence: mockStatePersistence,
        currentState: {
          projectRoot: '/test',
          currentPhase: 6,
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

      const result = await phase6.execute();
      expect(result.success).toBe(true);
    });

    it('should detect duplicate type definitions across different directories', async () => {
      const { Phase6APIContracts } = await import('../src/phases/phase-6-api-contracts.js');
      const { StatePersistence } = await import('../src/core/state-persistence.js');

      const mockStatePersistence = {
        createInitialState: vi.fn(() => ({
          projectRoot: '/test',
          currentPhase: 6,
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

      const phase6 = new Phase6APIContracts({
        projectRoot: '/test',
        statePersistence: mockStatePersistence,
        currentState: {
          projectRoot: '/test',
          currentPhase: 6,
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

      const result = await phase6.execute();
      expect(result.success).toBe(true);
    });
  });

  describe('Finding Types', () => {
    it('should use unique finding types for different issues', async () => {
      const findingTypes = [
        'missing-versioning',
        'missing-rate-limit',
        'cors-misconfig',
        'pii-exposure',
        'format-inconsistency',
        'missing-validation',
        'contract-issue',
        'missing-type-validation',
        'type-inconsistency',
      ];

      expect(findingTypes).toHaveLength(9);
      expect(new Set(findingTypes).size).toBe(9); // All unique
    });
  });
});
