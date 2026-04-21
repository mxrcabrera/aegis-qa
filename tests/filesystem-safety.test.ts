/**
 * Filesystem Safety Tests
 *
 * Tests for symlink protection and path validation.
 *
 * @module tests/filesystem-safety
 * @since 1.0.0
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { resolveAndValidatePath, filterValidPaths } from '../src/core/filesystem-safety.js';

describe('Filesystem Safety - Symlink Protection', () => {
  const testProjectRoot = path.join(process.cwd(), 'test-mock-project');
  const testDir = path.join(testProjectRoot, 'symlink-test');
  const srcDir = path.join(testProjectRoot, 'src');
  const libDir = path.join(testProjectRoot, 'lib');
  const componentsDir = path.join(testProjectRoot, 'components');

  beforeEach(() => {
    // Create test directories
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
    if (!fs.existsSync(srcDir)) {
      fs.mkdirSync(srcDir, { recursive: true });
    }
    if (!fs.existsSync(libDir)) {
      fs.mkdirSync(libDir, { recursive: true });
    }
    if (!fs.existsSync(componentsDir)) {
      fs.mkdirSync(componentsDir, { recursive: true });
    }

    // Create test files
    const indexPath = path.join(srcDir, 'index.ts');
    if (!fs.existsSync(indexPath)) {
      fs.writeFileSync(indexPath, '// test file');
    }
    const utilPath = path.join(libDir, 'util.ts');
    if (!fs.existsSync(utilPath)) {
      fs.writeFileSync(utilPath, '// test file');
    }
    const componentPath = path.join(componentsDir, 'Button.tsx');
    if (!fs.existsSync(componentPath)) {
      fs.writeFileSync(componentPath, '// test file');
    }
  });

  afterEach(() => {
    // Cleanup test directories and files
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
    if (fs.existsSync(srcDir)) {
      fs.rmSync(srcDir, { recursive: true, force: true });
    }
    if (fs.existsSync(libDir)) {
      fs.rmSync(libDir, { recursive: true, force: true });
    }
    if (fs.existsSync(componentsDir)) {
      fs.rmSync(componentsDir, { recursive: true, force: true });
    }
  });

  describe('resolveAndValidatePath', () => {
    it('should validate normal file paths within project root', () => {
      const result = resolveAndValidatePath('./src/index.ts', testProjectRoot);
      expect(result.isValid).toBe(true);
      expect(result.resolvedPath).toContain('src/index.ts');
    });

    it('should validate absolute file paths within project root', () => {
      const filePath = path.join(testProjectRoot, 'src', 'index.ts');
      const result = resolveAndValidatePath(filePath, testProjectRoot);
      expect(result.isValid).toBe(true);
    });

    it('should reject paths outside project root', () => {
      const result = resolveAndValidatePath('/etc/passwd', testProjectRoot);
      expect(result.isValid).toBe(false);
      // On Windows, the path doesn't exist, so we get a different error message
      // Just check that it's invalid and has an error
      expect(result.error).toBeDefined();
    });

    it('should reject paths that escape project root via ..', () => {
      const result = resolveAndValidatePath('../etc/passwd', testProjectRoot);
      expect(result.isValid).toBe(false);
      // On Windows, the path doesn't exist, so we get a different error message
      // Just check that it's invalid and has an error
      expect(result.error).toBeDefined();
    });

    it('should handle symlink to /etc/passwd', () => {
      // Create a symlink to /etc/passwd inside test directory
      const symlinkPath = path.join(testDir, 'etc-passwd-link');
      try {
        fs.symlinkSync('/etc/passwd', symlinkPath);
      } catch (error) {
        // Skip test if we can't create symlinks (e.g., on Windows without admin)
        console.log('Skipping symlink test: cannot create symlink');
        return;
      }

      const result = resolveAndValidatePath(symlinkPath, testProjectRoot);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('outside project root');

      // Cleanup
      fs.unlinkSync(symlinkPath);
    });

    it('should handle symlink to parent directory', () => {
      // Create a symlink to parent directory
      const symlinkPath = path.join(testDir, 'parent-link');
      try {
        fs.symlinkSync('..', symlinkPath);
      } catch (error) {
        // Skip test if we can't create symlinks
        console.log('Skipping symlink test: cannot create symlink');
        return;
      }

      const result = resolveAndValidatePath(symlinkPath, testProjectRoot);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('escapes project root');

      // Cleanup
      fs.unlinkSync(symlinkPath);
    });

    it('should handle circular symlinks', () => {
      // Create circular symlinks
      const symlink1 = path.join(testDir, 'link1');
      const symlink2 = path.join(testDir, 'link2');
      try {
        fs.symlinkSync(path.join(testDir, 'link2'), symlink1);
        fs.symlinkSync(path.join(testDir, 'link1'), symlink2);
      } catch (error) {
        // Skip test if we can't create symlinks
        console.log('Skipping symlink test: cannot create symlink');
        return;
      }

      const result = resolveAndValidatePath(symlink1, testProjectRoot);
      // Circular symlinks should either be rejected or handled gracefully
      // The important thing is it doesn't crash
      expect(result).toBeDefined();

      // Cleanup
      try {
        fs.unlinkSync(symlink1);
        fs.unlinkSync(symlink2);
      } catch {
        // Ignore cleanup errors
      }
    });

    it('should accept valid symlinks within project root', () => {
      // Create a valid file and symlink within project
      const testFile = path.join(testDir, 'test-file.txt');
      fs.writeFileSync(testFile, 'test content');

      const symlinkPath = path.join(testDir, 'test-link');
      try {
        fs.symlinkSync(testFile, symlinkPath);
      } catch (error) {
        // Skip test if we can't create symlinks
        console.log('Skipping symlink test: cannot create symlink');
        fs.unlinkSync(testFile);
        return;
      }

      const result = resolveAndValidatePath(symlinkPath, testProjectRoot);
      expect(result.isValid).toBe(true);

      // Cleanup
      fs.unlinkSync(symlinkPath);
      fs.unlinkSync(testFile);
    });

    it('should handle non-existent paths gracefully', () => {
      const result = resolveAndValidatePath('./non-existent-file.ts', testProjectRoot);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Failed to resolve path');
    });
  });

  describe('filterValidPaths', () => {
    it('should filter out invalid paths from array', () => {
      const paths = [
        './src/index.ts',
        '/etc/passwd',
        '../config.json',
        './lib/util.ts',
      ];
      const validPaths = filterValidPaths(paths, testProjectRoot);
      expect(validPaths.length).toBe(2);
      expect(validPaths.every(p => p.startsWith(testProjectRoot))).toBe(true);
    });

    it('should return empty array when all paths are invalid', () => {
      const paths = ['/etc/passwd', '../config.json', '/usr/bin'];
      const validPaths = filterValidPaths(paths, testProjectRoot);
      expect(validPaths.length).toBe(0);
    });

    it('should return all paths when all are valid', () => {
      const paths = ['./src/index.ts', './lib/util.ts', './components/Button.tsx'];
      const validPaths = filterValidPaths(paths, testProjectRoot);
      expect(validPaths.length).toBe(3);
    });
  });
});
