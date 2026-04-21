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

  beforeEach(() => {
    // Create test directory
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
  });

  afterEach(() => {
    // Cleanup test directory
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('resolveAndValidatePath', () => {
    it('should validate normal file paths within project root', () => {
      // Create test file first
      const testFile = path.join(testProjectRoot, 'src', 'index.ts');
      fs.mkdirSync(path.dirname(testFile), { recursive: true });
      fs.writeFileSync(testFile, '// test');
      
      const result = resolveAndValidatePath('./src/index.ts', testProjectRoot);
      expect(result.isValid).toBe(true);
      // Use path.sep for cross-platform compatibility
      expect(result.resolvedPath).toContain(path.join('src', 'index.ts'));
      
      // Cleanup
      fs.unlinkSync(testFile);
      fs.rmdirSync(path.dirname(testFile));
    });

    it('should validate absolute file paths within project root', () => {
      const filePath = path.join(testProjectRoot, 'src', 'index.ts');
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(filePath, '// test');
      
      const result = resolveAndValidatePath(filePath, testProjectRoot);
      expect(result.isValid).toBe(true);
      
      // Cleanup
      fs.unlinkSync(filePath);
      fs.rmdirSync(path.dirname(filePath));
    });

    it('should reject paths outside project root', () => {
      // Use a path that's guaranteed to be outside on any OS
      const outsidePath = process.platform === 'win32' ? 'C:\\Windows\\System32' : '/etc/passwd';
      const result = resolveAndValidatePath(outsidePath, testProjectRoot);
      expect(result.isValid).toBe(false);
    });

    it('should reject paths that escape project root via ..', () => {
      const result = resolveAndValidatePath('../etc/passwd', testProjectRoot);
      expect(result.isValid).toBe(false);
    });

    it('should handle symlink to /etc/passwd', () => {
      // Create a symlink to /etc/passwd inside test directory
      const symlinkPath = path.join(testDir, 'etc-passwd-link');
      const targetPath = process.platform === 'win32' ? 'C:\\Windows\\System32' : '/etc/passwd';
      try {
        fs.symlinkSync(targetPath, symlinkPath);
      } catch (error) {
        // Skip test if we can't create symlinks (e.g., on Windows without admin)
        console.log('Skipping symlink test: cannot create symlink');
        return;
      }

      const result = resolveAndValidatePath(symlinkPath, testProjectRoot);
      expect(result.isValid).toBe(false);

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
      // Create test files first
      const srcFile = path.join(testProjectRoot, 'src', 'index.ts');
      const libFile = path.join(testProjectRoot, 'lib', 'util.ts');
      fs.mkdirSync(path.dirname(srcFile), { recursive: true });
      fs.mkdirSync(path.dirname(libFile), { recursive: true });
      fs.writeFileSync(srcFile, '// test');
      fs.writeFileSync(libFile, '// test');
      
      const paths = [
        './src/index.ts',
        process.platform === 'win32' ? 'C:\\Windows\\System32' : '/etc/passwd',
        '../config.json',
        './lib/util.ts',
      ];
      const validPaths = filterValidPaths(paths, testProjectRoot);
      expect(validPaths.length).toBe(2);
      expect(validPaths.every(p => p.startsWith(testProjectRoot))).toBe(true);
      
      // Cleanup
      fs.unlinkSync(srcFile);
      fs.unlinkSync(libFile);
      fs.rmdirSync(path.dirname(srcFile));
      fs.rmdirSync(path.dirname(libFile));
    });

    it('should return empty array when all paths are invalid', () => {
      const paths = [
        process.platform === 'win32' ? 'C:\\Windows\\System32' : '/etc/passwd',
        '../config.json',
        process.platform === 'win32' ? 'C:\\Program Files' : '/usr/bin'
      ];
      const validPaths = filterValidPaths(paths, testProjectRoot);
      expect(validPaths.length).toBe(0);
    });

    it('should return all paths when all are valid', () => {
      // Create test files first
      const files = ['./src/index.ts', './lib/util.ts', './components/Button.tsx'];
      files.forEach(file => {
        const fullPath = path.join(testProjectRoot, file);
        fs.mkdirSync(path.dirname(fullPath), { recursive: true });
        fs.writeFileSync(fullPath, '// test');
      });
      
      const validPaths = filterValidPaths(files, testProjectRoot);
      expect(validPaths.length).toBe(3);
      
      // Cleanup
      files.reverse().forEach(file => {
        const fullPath = path.join(testProjectRoot, file);
        fs.unlinkSync(fullPath);
        try {
          fs.rmdirSync(path.dirname(fullPath));
        } catch {
          // Directory not empty, ignore
        }
      });
    });
  });
});
