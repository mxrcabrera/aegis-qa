/**
 * Unit Tests for Write Guard
 *
 * Tests for the FileSystem abstraction layer that enforces read-only mode
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { FileSystem, WriteGuardViolation, setFileSystem, getFileSystem, resetFileSystem } from '../src/core/write-guard.js';
import * as fs from 'fs';
import * as path from 'path';

describe('FileSystem', () => {
  const testDir = path.join(process.cwd(), 'test-write-guard');
  const testFile = path.join(testDir, 'test.txt');

  beforeEach(() => {
    // Clean up test directory if it exists
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
    // Reset global file system
    resetFileSystem();
  });

  afterEach(() => {
    // Clean up test directory if it exists
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
    // Reset global file system
    resetFileSystem();
  });

  describe('Configuration', () => {
    it('should initialize in readWrite mode by default', () => {
      const fsLayer = new FileSystem();
      expect(fsLayer.getMode()).toBe('readWrite');
      expect(fsLayer.isWriteAllowed()).toBe(true);
    });

    it('should initialize in readOnly mode when specified', () => {
      const fsLayer = new FileSystem('readOnly');
      expect(fsLayer.getMode()).toBe('readOnly');
      expect(fsLayer.isWriteAllowed()).toBe(false);
    });

    it('should allow changing mode', () => {
      const fsLayer = new FileSystem('readWrite');
      expect(fsLayer.isWriteAllowed()).toBe(true);
      
      fsLayer.setMode('readOnly');
      expect(fsLayer.isWriteAllowed()).toBe(false);
      
      fsLayer.setMode('readWrite');
      expect(fsLayer.isWriteAllowed()).toBe(true);
    });
  });

  describe('Write Operations in readWrite mode', () => {
    it('should allow writeFileSync in readWrite mode', () => {
      const fsLayer = new FileSystem('readWrite');
      fs.mkdirSync(testDir, { recursive: true });
      
      fsLayer.writeFileSync(testFile, 'test content');
      expect(fs.existsSync(testFile)).toBe(true);
      expect(fs.readFileSync(testFile, 'utf-8')).toBe('test content');
    });

    it('should allow mkdirSync in readWrite mode', () => {
      const fsLayer = new FileSystem('readWrite');
      fsLayer.mkdirSync(testDir, { recursive: true });
      expect(fs.existsSync(testDir)).toBe(true);
    });

    it('should allow unlinkSync in readWrite mode', () => {
      const fsLayer = new FileSystem('readWrite');
      fs.mkdirSync(testDir, { recursive: true });
      fsLayer.writeFileSync(testFile, 'test content');
      
      expect(fs.existsSync(testFile)).toBe(true);
      fsLayer.unlinkSync(testFile);
      expect(fs.existsSync(testFile)).toBe(false);
    });

    it('should allow copyFileSync in readWrite mode', () => {
      const fsLayer = new FileSystem('readWrite');
      fs.mkdirSync(testDir, { recursive: true });
      const srcFile = path.join(testDir, 'src.txt');
      const destFile = path.join(testDir, 'dest.txt');
      
      fsLayer.writeFileSync(srcFile, 'test content');
      fsLayer.copyFileSync(srcFile, destFile);
      
      expect(fs.existsSync(destFile)).toBe(true);
      expect(fs.readFileSync(destFile, 'utf-8')).toBe('test content');
    });

    it('should allow rmSync in readWrite mode', () => {
      const fsLayer = new FileSystem('readWrite');
      fs.mkdirSync(testDir, { recursive: true });
      fsLayer.writeFileSync(testFile, 'test content');
      
      expect(fs.existsSync(testFile)).toBe(true);
      fsLayer.rmSync(testFile);
      expect(fs.existsSync(testFile)).toBe(false);
    });
  });

  describe('Write Operations in readOnly mode', () => {
    it('should block writeFileSync in readOnly mode', () => {
      const fsLayer = new FileSystem('readOnly');
      fs.mkdirSync(testDir, { recursive: true });
      
      expect(() => fsLayer.writeFileSync(testFile, 'test content')).toThrow(WriteGuardViolation);
    });

    it('should block mkdirSync in readOnly mode', () => {
      const fsLayer = new FileSystem('readOnly');
      
      expect(() => fsLayer.mkdirSync(testDir)).toThrow(WriteGuardViolation);
    });

    it('should block unlinkSync in readOnly mode', () => {
      const fsLayer = new FileSystem('readOnly');
      
      expect(() => fsLayer.unlinkSync(testFile)).toThrow(WriteGuardViolation);
    });

    it('should block copyFileSync in readOnly mode', () => {
      const fsLayer = new FileSystem('readOnly');
      
      expect(() => fsLayer.copyFileSync(testFile, testFile)).toThrow(WriteGuardViolation);
    });

    it('should block rmSync in readOnly mode', () => {
      const fsLayer = new FileSystem('readOnly');
      
      expect(() => fsLayer.rmSync(testDir)).toThrow(WriteGuardViolation);
    });

    it('should block renameSync in readOnly mode', () => {
      const fsLayer = new FileSystem('readOnly');
      
      expect(() => fsLayer.renameSync(testFile, testFile)).toThrow(WriteGuardViolation);
    });

    it('should provide operation name in WriteGuardViolation', () => {
      const fsLayer = new FileSystem('readOnly');
      
      try {
        fsLayer.writeFileSync(testFile, 'test');
        expect.fail('Should have thrown WriteGuardViolation');
      } catch (error) {
        expect(error).toBeInstanceOf(WriteGuardViolation);
        if (error instanceof WriteGuardViolation) {
          expect(error.operation).toBe('writeFileSync');
          expect(error.filePath).toBe(testFile);
          expect(error.stackTrace).toBeDefined();
        }
      }
    });
  });

  describe('Read Operations (always allowed)', () => {
    it('should allow readFileSync in readOnly mode', () => {
      const fsLayer = new FileSystem('readOnly');
      fs.mkdirSync(testDir, { recursive: true });
      fs.writeFileSync(testFile, 'test content'); // Direct fs write for setup
      
      expect(() => fsLayer.readFileSync(testFile, 'utf-8')).not.toThrow();
      expect(fsLayer.readFileSync(testFile, 'utf-8')).toBe('test content');
    });

    it('should allow existsSync in readOnly mode', () => {
      const fsLayer = new FileSystem('readOnly');
      
      expect(() => fsLayer.existsSync(testFile)).not.toThrow();
    });

    it('should allow statSync in readOnly mode', () => {
      const fsLayer = new FileSystem('readOnly');
      fs.mkdirSync(testDir, { recursive: true });
      
      expect(() => fsLayer.statSync(testDir)).not.toThrow();
    });

    it('should allow readdirSync in readOnly mode', () => {
      const fsLayer = new FileSystem('readOnly');
      fs.mkdirSync(testDir, { recursive: true });
      
      expect(() => fsLayer.readdirSync(testDir)).not.toThrow();
    });
  });

  describe('Global FileSystem instance', () => {
    it('should provide global file system instance', () => {
      const globalFs = getFileSystem();
      expect(globalFs).toBeInstanceOf(FileSystem);
      expect(globalFs.getMode()).toBe('readWrite');
    });

    it('should allow setting global file system instance', () => {
      const customFs = new FileSystem('readOnly');
      setFileSystem(customFs);
      
      const globalFs = getFileSystem();
      expect(globalFs.getMode()).toBe('readOnly');
    });

    it('should reset global file system to readWrite mode', () => {
      const customFs = new FileSystem('readOnly');
      setFileSystem(customFs);
      
      resetFileSystem();
      
      const globalFs = getFileSystem();
      expect(globalFs.getMode()).toBe('readWrite');
    });
  });

  describe('Async Write Operations', () => {
    it('should block writeFile in readOnly mode', async () => {
      const fsLayer = new FileSystem('readOnly');
      fs.mkdirSync(testDir, { recursive: true });
      
      await expect(fsLayer.writeFile(testFile, 'test')).rejects.toThrow(WriteGuardViolation);
    });

    it('should block mkdir in readOnly mode', async () => {
      const fsLayer = new FileSystem('readOnly');
      
      await expect(fsLayer.mkdir(testDir)).rejects.toThrow(WriteGuardViolation);
    });

    it('should block unlink in readOnly mode', async () => {
      const fsLayer = new FileSystem('readOnly');
      
      await expect(fsLayer.unlink(testFile)).rejects.toThrow(WriteGuardViolation);
    });

    it('should block rename in readOnly mode', async () => {
      const fsLayer = new FileSystem('readOnly');
      
      await expect(fsLayer.rename(testFile, testFile)).rejects.toThrow(WriteGuardViolation);
    });

    it('should block copyFile in readOnly mode', async () => {
      const fsLayer = new FileSystem('readOnly');
      
      await expect(fsLayer.copyFile(testFile, testFile)).rejects.toThrow(WriteGuardViolation);
    });

    it('should block rm in readOnly mode', async () => {
      const fsLayer = new FileSystem('readOnly');
      
      await expect(fsLayer.rm(testDir)).rejects.toThrow(WriteGuardViolation);
    });

    it('should allow writeFile in readWrite mode', async () => {
      const fsLayer = new FileSystem('readWrite');
      fs.mkdirSync(testDir, { recursive: true });
      
      await fsLayer.writeFile(testFile, 'test content');
      expect(fs.existsSync(testFile)).toBe(true);
    });
  });
});
