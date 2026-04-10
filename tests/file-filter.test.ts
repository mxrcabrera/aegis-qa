/**
 * Unit Tests for FileFilter with .aegisignore support
 *
 * Tests for the file filter module that loads .aegisignore patterns
 * and filters files based on size, extension, and patterns.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { FileFilter } from '../src/core/file-filter.js';
import * as fs from 'fs';
import * as path from 'path';

// Mock fs module
vi.mock('fs');
vi.mock('path');

describe('FileFilter with .aegisignore support', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('.aegisignore loading', () => {
    it('should load .aegisignore from project root when file exists', () => {
      const mockContent = `
# Comment line
node_modules/
dist/
*.min.js
`;
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(mockContent);
      vi.mocked(path.join).mockReturnValue('/project/.aegisignore');

      new FileFilter({ projectRoot: '/project', loadAegisignore: true });

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Loaded .aegisignore with 3 patterns')
      );
    });

    it('should use default patterns when .aegisignore does not exist', () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);
      vi.mocked(path.join).mockReturnValue('/project/.aegisignore');

      new FileFilter({ projectRoot: '/project', loadAegisignore: true });

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Using default .aegisignore patterns')
      );
    });

    it('should skip .aegisignore loading when loadAegisignore is false', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(path.join).mockReturnValue('/project/.aegisignore');

      new FileFilter({ projectRoot: '/project', loadAegisignore: false });

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Using default .aegisignore patterns')
      );
    });

    it('should handle .aegisignore read errors gracefully', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockImplementation(() => {
        throw new Error('Permission denied');
      });
      vi.mocked(path.join).mockReturnValue('/project/.aegisignore');

      new FileFilter({ projectRoot: '/project', loadAegisignore: true });

      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('Failed to load .aegisignore')
      );
    });
  });

  describe('default exclusion patterns', () => {
    it('should include all required default patterns', () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);
      vi.mocked(path.join).mockReturnValue('/project/.aegisignore');

      const filter = new FileFilter({ projectRoot: '/project', loadAegisignore: false }) as any;

      // Check that default patterns are loaded
      expect(filter.aegisignorePatterns).toContain('node_modules/');
      expect(filter.aegisignorePatterns).toContain('dist/');
      expect(filter.aegisignorePatterns).toContain('build/');
      expect(filter.aegisignorePatterns).toContain('.next/');
      expect(filter.aegisignorePatterns).toContain('.nuxt/');
      expect(filter.aegisignorePatterns).toContain('coverage/');
      expect(filter.aegisignorePatterns).toContain('.aegis-state.json');
      expect(filter.aegisignorePatterns).toContain('.sentinel/');
      expect(filter.aegisignorePatterns).toContain('*.min.js');
      expect(filter.aegisignorePatterns).toContain('*.min.css');
      expect(filter.aegisignorePatterns).toContain('*.map');
      expect(filter.aegisignorePatterns).toContain('vendor/');
      expect(filter.aegisignorePatterns).toContain('__generated__/');
      expect(filter.aegisignorePatterns).toContain('generated/');
      expect(filter.aegisignorePatterns).toContain('*.generated.ts');
      expect(filter.aegisignorePatterns).toContain('*.generated.tsx');
      expect(filter.aegisignorePatterns).toContain('prisma/generated/');
      expect(filter.aegisignorePatterns).toContain('.git/');
    });
  });

  describe('shouldInclude method', () => {
    beforeEach(() => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(path.join).mockReturnValue('/project/.aegisignore');
      vi.mocked(fs.statSync).mockReturnValue({ size: 1024 } as any);
    });

    it('should return false for files matching default patterns', () => {
      const filter = new FileFilter({ projectRoot: '/project', loadAegisignore: false });

      expect(filter.shouldInclude('/project/node_modules/package.json')).toBe(false);
      expect(filter.shouldInclude('/project/dist/bundle.js')).toBe(false);
      expect(filter.shouldInclude('/project/build/output.js')).toBe(false);
      expect(filter.shouldInclude('/project/.next/pages/index.js')).toBe(false);
      expect(filter.shouldInclude('/project/coverage/lcov.info')).toBe(false);
      expect(filter.shouldInclude('/project/.aegis-state.json')).toBe(false);
      expect(filter.shouldInclude('/project/.sentinel/checkpoint')).toBe(false);
      expect(filter.shouldInclude('/project/app.min.js')).toBe(false);
      expect(filter.shouldInclude('/project/style.min.css')).toBe(false);
      expect(filter.shouldInclude('/project/bundle.map')).toBe(false);
    });

    it('should return false for files with blocked extensions', () => {
      const filter = new FileFilter({ projectRoot: '/project', loadAegisignore: false });

      expect(filter.shouldInclude('/project/image.png')).toBe(false);
      expect(filter.shouldInclude('/project/archive.zip')).toBe(false);
      expect(filter.shouldInclude('/project/document.pdf')).toBe(false);
    });

    it('should have shouldInclude method that returns boolean', () => {
      const filter = new FileFilter({ projectRoot: '/project', loadAegisignore: false });

      const result = filter.shouldInclude('/project/test.ts');
      expect(typeof result).toBe('boolean');
    });
  });

  describe('.aegisrc.json exclude key support', () => {
    it('should merge additional excludes from config', () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);
      vi.mocked(path.join).mockReturnValue('/project/.aegisignore');

      const filter = new FileFilter({
        projectRoot: '/project',
        loadAegisignore: false,
        additionalExcludes: ['temp/', 'logs/*.log'],
      }) as any;

      expect(filter.aegisignorePatterns).toContain('temp/');
      expect(filter.aegisignorePatterns).toContain('logs/*.log');
    });

    it('should have additional excludes in blocked patterns', () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);
      vi.mocked(path.join).mockReturnValue('/project/.aegisignore');

      const filter = new FileFilter({
        projectRoot: '/project',
        loadAegisignore: false,
        additionalExcludes: ['temp/'],
      }) as any;

      expect(filter.aegisignorePatterns).toContain('temp/');
    });
  });

  describe('gitignore pattern parsing', () => {
    it('should parse gitignore-style content correctly', () => {
      const mockContent = `
# This is a comment
node_modules/
dist/
*.min.js

# Another comment
coverage/
`;
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(mockContent);
      vi.mocked(path.join).mockReturnValue('/project/.aegisignore');

      const filter = new FileFilter({ projectRoot: '/project', loadAegisignore: true }) as any;

      expect(filter.aegisignorePatterns).toContain('node_modules/');
      expect(filter.aegisignorePatterns).toContain('dist/');
      expect(filter.aegisignorePatterns).toContain('*.min.js');
      expect(filter.aegisignorePatterns).toContain('coverage/');
      expect(filter.aegisignorePatterns).not.toContain('# This is a comment');
      expect(filter.aegisignorePatterns).not.toContain('');
    });

    it('should handle empty lines and comments', () => {
      const mockContent = `
# Comment 1

node_modules/

# Comment 2
dist/
`;
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(mockContent);
      vi.mocked(path.join).mockReturnValue('/project/.aegisignore');

      const filter = new FileFilter({ projectRoot: '/project', loadAegisignore: true }) as any;

      expect(filter.aegisignorePatterns).not.toContain('');
      expect(filter.aegisignorePatterns).not.toContain('# Comment 1');
    });
  });

  describe('logging at startup', () => {
    it('should log exclusion information at startup', () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);
      vi.mocked(path.join).mockReturnValue('/project/.aegisignore');

      new FileFilter({ projectRoot: '/project', loadAegisignore: false });

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Exclusion configuration')
      );
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('.aegisignore patterns')
      );
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Blocked extensions')
      );
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Blocked path patterns')
      );
    });

    it('should log .aegisignore patterns', () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);
      vi.mocked(path.join).mockReturnValue('/project/.aegisignore');

      new FileFilter({ projectRoot: '/project', loadAegisignore: false });

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('.aegisignore patterns:')
      );
    });
  });
});
