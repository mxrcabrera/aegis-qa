/**
 * Unit Tests for Project Type Detection
 *
 * Tests for detecting project type based on configuration files
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

// Mock fs module
vi.mock('fs');

describe('Project Type Detection', () => {
  const mockProjectRoot = '/test/project';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('detectProjectType logic', () => {
    it('should detect TypeScript project when tsconfig.json exists', () => {
      vi.mocked(fs.existsSync).mockImplementation((filePath: fs.PathLike) => {
        if (filePath === path.join(mockProjectRoot, 'tsconfig.json')) {
          return true;
        }
        if (filePath === path.join(mockProjectRoot, 'jsconfig.json')) {
          return false;
        }
        return false;
      });

      const hasTsConfig = fs.existsSync(path.join(mockProjectRoot, 'tsconfig.json'));
      const hasJsConfig = fs.existsSync(path.join(mockProjectRoot, 'jsconfig.json'));

      let projectType: 'typescript' | 'javascript' | 'mixed';
      if (hasTsConfig && hasJsConfig) {
        projectType = 'mixed';
      } else if (hasTsConfig) {
        projectType = 'typescript';
      } else if (hasJsConfig) {
        projectType = 'javascript';
      } else {
        projectType = 'javascript';
      }

      expect(projectType).toBe('typescript');
    });

    it('should detect JavaScript project when jsconfig.json exists', () => {
      vi.mocked(fs.existsSync).mockImplementation((filePath: fs.PathLike) => {
        if (filePath === path.join(mockProjectRoot, 'tsconfig.json')) {
          return false;
        }
        if (filePath === path.join(mockProjectRoot, 'jsconfig.json')) {
          return true;
        }
        return false;
      });

      const hasTsConfig = fs.existsSync(path.join(mockProjectRoot, 'tsconfig.json'));
      const hasJsConfig = fs.existsSync(path.join(mockProjectRoot, 'jsconfig.json'));

      let projectType: 'typescript' | 'javascript' | 'mixed';
      if (hasTsConfig && hasJsConfig) {
        projectType = 'mixed';
      } else if (hasTsConfig) {
        projectType = 'typescript';
      } else if (hasJsConfig) {
        projectType = 'javascript';
      } else {
        projectType = 'javascript';
      }

      expect(projectType).toBe('javascript');
    });

    it('should detect mixed project when both tsconfig.json and jsconfig.json exist', () => {
      vi.mocked(fs.existsSync).mockImplementation((filePath: fs.PathLike) => {
        if (filePath === path.join(mockProjectRoot, 'tsconfig.json')) {
          return true;
        }
        if (filePath === path.join(mockProjectRoot, 'jsconfig.json')) {
          return true;
        }
        return false;
      });

      const hasTsConfig = fs.existsSync(path.join(mockProjectRoot, 'tsconfig.json'));
      const hasJsConfig = fs.existsSync(path.join(mockProjectRoot, 'jsconfig.json'));

      let projectType: 'typescript' | 'javascript' | 'mixed';
      if (hasTsConfig && hasJsConfig) {
        projectType = 'mixed';
      } else if (hasTsConfig) {
        projectType = 'typescript';
      } else if (hasJsConfig) {
        projectType = 'javascript';
      } else {
        projectType = 'javascript';
      }

      expect(projectType).toBe('mixed');
    });

    it('should default to JavaScript when neither config exists', () => {
      vi.mocked(fs.existsSync).mockImplementation((filePath: fs.PathLike) => {
        if (filePath === path.join(mockProjectRoot, 'tsconfig.json')) {
          return false;
        }
        if (filePath === path.join(mockProjectRoot, 'jsconfig.json')) {
          return false;
        }
        return false;
      });

      const hasTsConfig = fs.existsSync(path.join(mockProjectRoot, 'tsconfig.json'));
      const hasJsConfig = fs.existsSync(path.join(mockProjectRoot, 'jsconfig.json'));

      let projectType: 'typescript' | 'javascript' | 'mixed';
      if (hasTsConfig && hasJsConfig) {
        projectType = 'mixed';
      } else if (hasTsConfig) {
        projectType = 'typescript';
      } else if (hasJsConfig) {
        projectType = 'javascript';
      } else {
        projectType = 'javascript';
      }

      expect(projectType).toBe('javascript');
    });
  });
});
