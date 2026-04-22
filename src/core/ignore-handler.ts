/**
 * IgnoreHandler - Glob Optimization with .aegisignore
 *
 * Purpose: Read and parse .aegisignore file (inheriting from .gitignore) to
 * optimize glob patterns and avoid scanning unnecessary directories like node_modules
 * or .git, which saves time and prevents memory issues.
 *
 * Architecture:
 * - Reads .aegisignore if it exists
 * - Falls back to .gitignore if .aegisignore doesn't exist
 * - Parses ignore patterns (gitignore syntax)
 * - Provides filter function for file paths
 * - Merges default ignore patterns with custom ones
 *
 * @module core/ignore-handler
 * @since 2.0.0
 */

import * as fs from 'fs';
import * as path from 'path';

/**
 * Ignore handler configuration
 */
interface IgnoreHandlerConfig {
  /** Project root directory */
  projectRoot: string;
  /** Custom ignore patterns to add */
  additionalPatterns?: string[];
  /** Whether to inherit from .gitignore if .aegisignore doesn't exist */
  inheritFromGitignore?: boolean;
}

/**
 * IgnoreHandler - Glob optimization with ignore patterns
 *
 * This class reads .aegisignore (or .gitignore) and provides a filter
 * function to exclude files and directories from analysis.
 *
 * @class IgnoreHandler
 * @example
 * ```typescript
 * const handler = new IgnoreHandler({ projectRoot: '/path/to/project' });
 * const shouldIgnore = handler.shouldIgnore('/path/to/node_modules/package.json');
 * // true
 * ```
 */
export class IgnoreHandler {
  private config: IgnoreHandlerConfig;
  private ignorePatterns: string[];
  private projectRoot: string;

  // Default ignore patterns (always applied)
  private static DEFAULT_PATTERNS = [
    'node_modules',
    '.git',
    '.vscode',
    '.idea',
    'dist',
    'build',
    'coverage',
    '.next',
    '.turbo',
    'out',
    '.cache',
    '.nuxt',
    '.output',
    'tmp',
    'temp',
  ];

  constructor(config: IgnoreHandlerConfig) {
    this.config = config;
    this.projectRoot = path.resolve(config.projectRoot);
    this.ignorePatterns = [...IgnoreHandler.DEFAULT_PATTERNS];
    
    // Load ignore patterns
    this.loadIgnorePatterns();
  }

  /**
   * Loads ignore patterns from .aegisignore or .gitignore
   *
   * @private
   */
  private loadIgnorePatterns(): void {
    const aegisignorePath = path.join(this.projectRoot, '.aegisignore');
    const gitignorePath = path.join(this.projectRoot, '.gitignore');

    let patternsLoaded = false;

    // Try to load .aegisignore first
    if (fs.existsSync(aegisignorePath)) {
      const content = fs.readFileSync(aegisignorePath, 'utf-8');
      const patterns = this.parseIgnoreFile(content);
      this.ignorePatterns.push(...patterns);
      console.log(`[IgnoreHandler] Loaded ${patterns.length} patterns from .aegisignore`);
      patternsLoaded = true;
    } else if (this.config.inheritFromGitignore !== false && fs.existsSync(gitignorePath)) {
      // Fall back to .gitignore if .aegisignore doesn't exist
      const content = fs.readFileSync(gitignorePath, 'utf-8');
      const patterns = this.parseIgnoreFile(content);
      this.ignorePatterns.push(...patterns);
      console.log(`[IgnoreHandler] Loaded ${patterns.length} patterns from .gitignore (fallback)`);
      patternsLoaded = true;
    }

    // Add additional patterns from config
    if (this.config.additionalPatterns) {
      this.ignorePatterns.push(...this.config.additionalPatterns);
      console.log(`[IgnoreHandler] Added ${this.config.additionalPatterns.length} additional patterns`);
    }

    if (!patternsLoaded) {
      console.log('[IgnoreHandler] No .aegisignore or .gitignore found, using default patterns');
    }
  }

  /**
   * Parses an ignore file (gitignore syntax)
   *
   * @private
   * @param content - File content
   * @returns string[] - Array of ignore patterns
   */
  private parseIgnoreFile(content: string): string[] {
    const patterns: string[] = [];
    const lines = content.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();
      
      // Skip empty lines and comments
      if (!trimmed || trimmed.startsWith('#')) {
        continue;
      }

      // Skip negation patterns (starting with !)
      if (trimmed.startsWith('!')) {
        continue;
      }

      patterns.push(trimmed);
    }

    return patterns;
  }

  /**
   * Checks if a file path should be ignored
   *
   * This method checks the file path against all ignore patterns.
   * Patterns support gitignore syntax including wildcards and directory patterns.
   *
   * @param filePath - File path to check (absolute or relative)
   * @returns boolean - Whether the file should be ignored
   *
   * @example
   * ```typescript
   * shouldIgnore('/path/to/node_modules/package.json') // true
   * shouldIgnore('/path/to/src/index.ts') // false
   * ```
   */
  shouldIgnore(filePath: string): boolean {
    // Convert to absolute path if relative
    const absolutePath = path.isAbsolute(filePath) ? filePath : path.join(this.projectRoot, filePath);
    
    // Get relative path from project root
    const relativePath = path.relative(this.projectRoot, absolutePath);
    
    // Normalize path separators
    const normalizedPath = relativePath.replace(/\\/g, '/');

    // Check each pattern
    for (const pattern of this.ignorePatterns) {
      if (this.matchesPattern(normalizedPath, pattern)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Checks if a path matches an ignore pattern
   *
   * @private
   * @param path - File path (normalized, relative to project root)
   * @param pattern - Ignore pattern
   * @returns boolean - Whether the path matches the pattern
   */
  private matchesPattern(filePath: string, pattern: string): boolean {
    // Normalize pattern
    const normalizedPattern = pattern.replace(/\\/g, '/');

    // Exact match
    if (filePath === normalizedPattern) {
      return true;
    }

    // Directory pattern (ending with /)
    if (normalizedPattern.endsWith('/')) {
      const dirPattern = normalizedPattern.slice(0, -1);
      if (filePath.startsWith(dirPattern + '/') || filePath === dirPattern) {
        return true;
      }
    }

    // Wildcard pattern (*)
    if (normalizedPattern.includes('*')) {
      const regex = this.patternToRegex(normalizedPattern);
      if (regex.test(filePath)) {
        return true;
      }
    }

    // Check if path is inside a directory
    if (filePath.startsWith(normalizedPattern + '/')) {
      return true;
    }

    return false;
  }

  /**
   * Converts a glob pattern to a regular expression
   *
   * @private
   * @param pattern - Glob pattern
   * @returns RegExp - Regular expression
   */
  private patternToRegex(pattern: string): RegExp {
    // Escape special regex characters except *, ?, and /
    const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&');
    
    // Convert glob wildcards to regex
    const regexPattern = escaped
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.');
    
    return new RegExp(`^${regexPattern}$`);
  }

  /**
   * Filters an array of file paths
   *
   * @param filePaths - Array of file paths
   * @returns string[] - Filtered array (non-ignored files)
   *
   * @example
   * ```typescript
   * const files = ['/path/to/src/index.ts', '/path/to/node_modules/pkg/index.js'];
   * const filtered = handler.filterFiles(files);
   * // ['/path/to/src/index.ts']
   * ```
   */
  filterFiles(filePaths: string[]): string[] {
    const filtered: string[] = [];
    const ignored: string[] = [];

    for (const filePath of filePaths) {
      if (this.shouldIgnore(filePath)) {
        ignored.push(filePath);
      } else {
        filtered.push(filePath);
      }
    }

    if (ignored.length > 0) {
      console.log(`[IgnoreHandler] Ignored ${ignored.length} files/directories`);
      ignored.slice(0, 10).forEach(p => {
        console.log(`  - ${p}`);
      });
      if (ignored.length > 10) {
        console.log(`  ... and ${ignored.length - 10} more`);
      }
    }

    return filtered;
  }

  /**
   * Gets the current ignore patterns
   *
   * @returns string[] - Array of ignore patterns
   */
  getPatterns(): string[] {
    return [...this.ignorePatterns];
  }

  /**
   * Adds a custom ignore pattern
   *
   * @param pattern - Pattern to add
   */
  addPattern(pattern: string): void {
    this.ignorePatterns.push(pattern);
  }

  /**
   * Removes an ignore pattern
   *
   * @param pattern - Pattern to remove
   */
  removePattern(pattern: string): void {
    const index = this.ignorePatterns.indexOf(pattern);
    if (index > -1) {
      this.ignorePatterns.splice(index, 1);
    }
  }
}
