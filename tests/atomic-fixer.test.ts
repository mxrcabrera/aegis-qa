/**
 * Tests for Atomic Fixer - Separation of Atomic Fixes and Refactoring Suggestions
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { AtomicFixer } from '../src/modules/atomic-fixer.js';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('AtomicFixer - Category Classification', () => {
  let testDir: string;

  beforeEach(() => {
    testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'atomic-fixer-test-'));
  });

  afterEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('should mark i18n fixes as atomic category', async () => {
    const fixer = new AtomicFixer(testDir, false, true);
    const violation = {
      rule: 'missing-alt' as const,
      file: { path: path.join(testDir, 'file.html') },
      id: 'test-1',
      location: { line: 10 },
      severity: 'medium' as const,
      confidence: 0.9
    };

    // Create a test file
    fs.writeFileSync(path.join(testDir, 'file.html'), '<img src="test.jpg">');

    const fix = await fixer['generateI18nFix'](violation);
    
    expect(fix).not.toBeNull();
    expect(fix?.category).toBe('atomic');
    expect(fix?.autoApply).toBe(true);
  });

  it('should mark a11y fixes as atomic category', async () => {
    const fixer = new AtomicFixer(testDir, false, true);
    const violation = {
      rule: 'missing-aria' as const,
      file: { path: path.join(testDir, 'file.html') },
      id: 'test-2',
      location: { line: 10 },
      severity: 'medium' as const,
      confidence: 0.9
    };

    fs.writeFileSync(path.join(testDir, 'file.html'), '<button>Click me</button>');

    const fix = await fixer['generateI18nFix'](violation);
    
    expect(fix).not.toBeNull();
    expect(fix?.category).toBe('atomic');
    expect(fix?.autoApply).toBe(true);
  });

  it('should mark environment fixes as atomic category', async () => {
    const fixer = new AtomicFixer(testDir, false, true);
    const violation = {
      rule: 'strict-env-validation' as const,
      id: 'test-3',
      severity: 'critical' as const,
      confidence: 0.9
    };

    const fix = await fixer['generateEnvironmentFix'](violation);
    
    expect(fix).not.toBeNull();
    expect(fix?.category).toBe('atomic');
    expect(fix?.autoApply).toBe(true);
  });

  it('should mark clean-code fixes as refactoring category', async () => {
    const fixer = new AtomicFixer(testDir, false, true);
    const violation = {
      rule: 'too-many-parameters' as const,
      file: { path: path.join(testDir, 'file.ts') },
      id: 'test-4',
      location: { line: 1 },
      severity: 'medium' as const,
      confidence: 0.7
    };

    // Write a function with too many parameters on line 1
    fs.writeFileSync(path.join(testDir, 'file.ts'), 'function test(a, b, c, d, e, f) { return a + b + c + d + e + f; }');

    const fix = await fixer['generateCleanCodeFix'](violation);
    
    expect(fix).not.toBeNull();
    expect(fix?.category).toBe('refactoring');
    expect(fix?.autoApply).toBe(false);
  });

  it('should separate atomic fixes from refactoring suggestions in results', async () => {
    const fixer = new AtomicFixer(testDir, false, true);
    
    const violations = [
      {
        rule: 'missing-alt' as const,
        file: { path: path.join(testDir, 'file.html') },
        id: 'test-1',
        location: { line: 1 },
        severity: 'medium' as const,
        confidence: 0.9
      },
      {
        rule: 'too-many-parameters' as const,
        file: { path: path.join(testDir, 'file.ts') },
        id: 'test-2',
        location: { line: 1 },
        severity: 'medium' as const,
        confidence: 0.7
      }
    ];

    fs.writeFileSync(path.join(testDir, 'file.html'), '<img src="test.jpg">');
    fs.writeFileSync(path.join(testDir, 'file.ts'), 'function test(a, b, c, d, e, f) { return a + b + c + d + e + f; }');

    const results = await fixer.runFixes(violations);
    
    expect(results.atomicFixes).toBeDefined();
    expect(results.refactoringSuggestions).toBeDefined();
    expect(results.refactoringSuggestions.length).toBeGreaterThan(0);
    
    // Find the refactoring suggestion
    const refactoringFix = results.refactoringSuggestions.find(r => r.fix.type === 'clean-code');
    expect(refactoringFix).toBeDefined();
    expect(refactoringFix?.fix.category).toBe('refactoring');
  });

  it('should never auto-apply refactoring suggestions', async () => {
    const fixer = new AtomicFixer(testDir, false, true);
    
    const violations = [
      {
        rule: 'too-many-parameters' as const,
        file: { path: path.join(testDir, 'file.ts') },
        id: 'test-refactor',
        location: { line: 1 },
        severity: 'medium' as const,
        confidence: 0.9
      }
    ];

    fs.writeFileSync(path.join(testDir, 'file.ts'), 'function test(a, b, c, d, e, f) { return a + b + c + d + e + f; }');

    const results = await fixer.runFixes(violations);
    
    // All refactoring suggestions should have applied: false
    results.refactoringSuggestions.forEach(suggestion => {
      expect(suggestion.applied).toBe(false);
      expect(suggestion.error).toContain('REFACTORING_SUGGESTION');
    });
  });
});
