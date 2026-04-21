/**
 * Impact Analysis Tests
 *
 * Tests for the ImpactAnalyzer module which analyzes file dependencies
 * and calculates impact scores before applying fixes.
 *
 * @module impact-analysis.test
 * @since 2.0.0
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { ImpactAnalyzer, type ImpactScore, type ImportGraph } from '../src/modules/impact-analyzer.js';

// Mock fs module
vi.mock('fs');

describe('ImpactAnalyzer', () => {
  let analyzer: ImpactAnalyzer;
  const mockProjectRoot = '/test/project';

  beforeEach(() => {
    vi.clearAllMocks();
    analyzer = new ImpactAnalyzer(mockProjectRoot);
  });

  afterEach(() => {
    analyzer.clearCache();
  });

  describe('analyzeImpact', () => {
    it('should return impact score with zero dependents for isolated file', async () => {
      const filePath = path.join(mockProjectRoot, 'isolated.ts');

      // Mock file exists
      vi.mocked(fs.existsSync).mockReturnValue(true);

      // Mock readdirSync to return the test file
      vi.mocked(fs.readdirSync).mockReturnValue([
        { name: 'isolated.ts', isDirectory: () => false, isFile: () => true }
      ] as any);

      // Mock readFileSync to return a file with no imports
      vi.mocked(fs.readFileSync).mockReturnValue(`
export function isolatedFunction() {
  return 'hello';
}
`);

      const impactScore: ImpactScore = await analyzer.analyzeImpact(filePath);

      expect(impactScore.dependentsCount).toBe(0);
      expect(impactScore.isBarrelExport).toBe(false);
      expect(impactScore.isEntryPoint).toBe(true);
    });

    it('should identify barrel files (index.ts)', async () => {
      const filePath = path.join(mockProjectRoot, 'index.ts');

      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readdirSync).mockReturnValue([
        { name: 'index.ts', isDirectory: () => false, isFile: () => true }
      ] as any);
      vi.mocked(fs.readFileSync).mockReturnValue(`
export * from './module1';
export * from './module2';
`);

      const impactScore: ImpactScore = await analyzer.analyzeImpact(filePath);

      expect(impactScore.isBarrelExport).toBe(true);
    });

    it('should identify entry points (files with no project-local imports)', async () => {
      const filePath = path.join(mockProjectRoot, 'entry.ts');

      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readdirSync).mockReturnValue([
        { name: 'entry.ts', isDirectory: () => false, isFile: () => true }
      ] as any);
      vi.mocked(fs.readFileSync).mockReturnValue(`
import { external } from 'external-package';

export function main() {
  return external;
}
`);

      const impactScore: ImpactScore = await analyzer.analyzeImpact(filePath);

      expect(impactScore.isEntryPoint).toBe(true);
    });

    it('should count dependents from import graph', async () => {
      const filePath = path.join(mockProjectRoot, 'module.ts');

      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readdirSync).mockReturnValue([
        { name: 'module.ts', isDirectory: () => false, isFile: () => true },
        { name: 'consumer1.ts', isDirectory: () => false, isFile: () => true },
        { name: 'consumer2.ts', isDirectory: () => false, isFile: () => true },
        { name: 'consumer3.ts', isDirectory: () => false, isFile: () => true },
      ] as any);
      vi.mocked(fs.readFileSync).mockReturnValue(`
export function moduleFunction() {
  return 'module';
}
`);

      // Mock findSourceFiles to return multiple files
      const mockFiles = [
        path.join(mockProjectRoot, 'module.ts'),
        path.join(mockProjectRoot, 'consumer1.ts'),
        path.join(mockProjectRoot, 'consumer2.ts'),
        path.join(mockProjectRoot, 'consumer3.ts'),
      ];

      // Mock consumer files that import the module
      vi.mocked(fs.readFileSync).mockImplementation((filePath: fs.PathOrFileDescriptor) => {
        if (typeof filePath === 'string' && filePath.includes('consumer')) {
          return `import { moduleFunction } from './module';`;
        }
        return `export function moduleFunction() { return 'module'; }`;
      });

      const impactScore: ImpactScore = await analyzer.analyzeImpact(filePath);

      // Should count the 3 consumer files
      expect(impactScore.dependentsCount).toBeGreaterThan(0);
    });
  });

  describe('import graph caching', () => {
    it('should cache import graph to avoid re-scanning', async () => {
      const filePath = path.join(mockProjectRoot, 'module.ts');

      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readdirSync).mockReturnValue([
        { name: 'module.ts', isDirectory: () => false, isFile: () => true }
      ] as any);
      vi.mocked(fs.readFileSync).mockReturnValue(`
export function moduleFunction() {
  return 'module';
}
`);

      // First call
      await analyzer.analyzeImpact(filePath);
      const graphAfterFirstCall = analyzer.getImportGraph();

      // Second call should use cached graph
      await analyzer.analyzeImpact(filePath);
      const graphAfterSecondCall = analyzer.getImportGraph();

      expect(graphAfterFirstCall).not.toBeNull();
      expect(graphAfterSecondCall).toEqual(graphAfterFirstCall);
    });

    it('should clear cache when clearCache is called', async () => {
      const filePath = path.join(mockProjectRoot, 'module.ts');

      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readdirSync).mockReturnValue([
        { name: 'module.ts', isDirectory: () => false, isFile: () => true }
      ] as any);
      vi.mocked(fs.readFileSync).mockReturnValue(`
export function moduleFunction() {
  return 'module';
}
`);

      await analyzer.analyzeImpact(filePath);
      expect(analyzer.getImportGraph()).not.toBeNull();

      analyzer.clearCache();
      expect(analyzer.getImportGraph()).toBeNull();
    });
  });

  describe('barrel file detection', () => {
    it('should identify index.ts as barrel file', async () => {
      const filePath = path.join(mockProjectRoot, 'index.ts');

      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readdirSync).mockReturnValue([
        { name: 'index.ts', isDirectory: () => false, isFile: () => true }
      ] as any);
      vi.mocked(fs.readFileSync).mockReturnValue(`
export * from './module1';
export { default } from './module2';
`);

      const impactScore: ImpactScore = await analyzer.analyzeImpact(filePath);

      expect(impactScore.isBarrelExport).toBe(true);
    });

    it('should identify index.js as barrel file', async () => {
      const filePath = path.join(mockProjectRoot, 'index.js');

      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readdirSync).mockReturnValue([
        { name: 'index.js', isDirectory: () => false, isFile: () => true }
      ] as any);
      vi.mocked(fs.readFileSync).mockReturnValue(`
module.exports = require('./module1');
`);

      const impactScore: ImpactScore = await analyzer.analyzeImpact(filePath);

      expect(impactScore.isBarrelExport).toBe(true);
    });

    it('should not identify regular files as barrel files', async () => {
      const filePath = path.join(mockProjectRoot, 'regular.ts');

      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readdirSync).mockReturnValue([
        { name: 'regular.ts', isDirectory: () => false, isFile: () => true }
      ] as any);
      vi.mocked(fs.readFileSync).mockReturnValue(`
export function regularFunction() {
  return 'regular';
}
`);

      const impactScore: ImpactScore = await analyzer.analyzeImpact(filePath);

      expect(impactScore.isBarrelExport).toBe(false);
    });
  });

  describe('entry point detection', () => {
    it('should identify files with no local imports as entry points', async () => {
      const filePath = path.join(mockProjectRoot, 'entry.ts');

      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readdirSync).mockReturnValue([
        { name: 'entry.ts', isDirectory: () => false, isFile: () => true }
      ] as any);
      vi.mocked(fs.readFileSync).mockReturnValue(`
import { external } from 'external-package';

export function main() {
  return external;
}
`);

      const impactScore: ImpactScore = await analyzer.analyzeImpact(filePath);

      expect(impactScore.isEntryPoint).toBe(true);
    });

    it('should not identify files with local imports as entry points', async () => {
      const filePath = path.join(mockProjectRoot, 'module.ts');

      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readdirSync).mockReturnValue([
        { name: 'module.ts', isDirectory: () => false, isFile: () => true }
      ] as any);
      vi.mocked(fs.readFileSync).mockReturnValue(`
import { helper } from './helper';

export function moduleFunction() {
  return helper();
}
`);

      const impactScore: ImpactScore = await analyzer.analyzeImpact(filePath);

      expect(impactScore.isEntryPoint).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should handle non-existent files gracefully', async () => {
      const filePath = path.join(mockProjectRoot, 'nonexistent.ts');

      vi.mocked(fs.existsSync).mockReturnValue(false);

      const impactScore: ImpactScore = await analyzer.analyzeImpact(filePath);

      expect(impactScore.dependentsCount).toBe(0);
      expect(impactScore.isBarrelExport).toBe(false);
      expect(impactScore.isEntryPoint).toBe(false);
    });

    it('should handle files with no content', async () => {
      const filePath = path.join(mockProjectRoot, 'empty.ts');

      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readdirSync).mockReturnValue([
        { name: 'empty.ts', isDirectory: () => false, isFile: () => true }
      ] as any);
      vi.mocked(fs.readFileSync).mockReturnValue('');

      const impactScore: ImpactScore = await analyzer.analyzeImpact(filePath);

      expect(impactScore.dependentsCount).toBe(0);
      expect(impactScore.isEntryPoint).toBe(true);
    });

    it('should handle circular dependencies', async () => {
      const filePath = path.join(mockProjectRoot, 'moduleA.ts');

      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readdirSync).mockReturnValue([
        { name: 'moduleA.ts', isDirectory: () => false, isFile: () => true },
        { name: 'moduleB.ts', isDirectory: () => false, isFile: () => true },
      ] as any);

      // Mock circular dependency scenario
      vi.mocked(fs.readFileSync).mockImplementation((filePath: fs.PathOrFileDescriptor) => {
        if (typeof filePath === 'string' && filePath.includes('moduleA')) {
          return `import { moduleB } from './moduleB'; export function moduleA() { return moduleB(); }`;
        }
        if (typeof filePath === 'string' && filePath.includes('moduleB')) {
          return `import { moduleA } from './moduleA'; export function moduleB() { return moduleA(); }`;
        }
        return '';
      });

      const impactScore: ImpactScore = await analyzer.analyzeImpact(filePath);

      // Should not crash on circular dependencies
      expect(impactScore).toBeDefined();
      expect(typeof impactScore.dependentsCount).toBe('number');
    });
  });
});
