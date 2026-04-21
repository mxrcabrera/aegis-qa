/**
 * FileFilter - Large file and extension guard with .aegisignore support
 *
 * Purpose: Filters files based on size, extension, and .aegisignore patterns
 * to prevent memory explosion and avoid analyzing binary files or large generated files.
 *
 * Architecture:
 * - Filters by file size (default: 500KB max)
 * - Filters by extension to skip binary files
 * - Loads .aegisignore from project root (same format as .gitignore)
 * - Supports .aegisrc.json exclude key for additional patterns
 * - Configurable max file size (default: 500KB)
 * - Prevents memory explosion on large files
 * - Flexible path detection (src/, lib/, app/, or root)
 *
 * @module core/file-filter
 * @since 2.0.0
 */

import * as fs from 'fs';
import * as path from 'path';

/**
 * File filter configuration
 */
interface FileFilterConfig {
  /** Maximum file size in bytes (default: 500KB) */
  maxFileSizeBytes?: number;
  /** Allowed file extensions (if specified, only these are analyzed) */
  allowedExtensions?: string[];
  /** Blocked file extensions (always skipped) */
  blockedExtensions?: string[];
  /** Blocked file patterns (glob patterns) */
  blockedPatterns?: string[];
  /** Project root directory (for loading .aegisignore) */
  projectRoot?: string;
  /** Additional exclusion patterns from .aegisrc.json */
  additionalExcludes?: string[];
  /** Whether to load .aegisignore file (default: true) */
  loadAegisignore?: boolean;
}

/**
 * File filter result
 */
interface FileFilterResult {
  /** Whether file should be analyzed */
  shouldAnalyze: boolean;
  /** Reason for skipping (if not analyzing) */
  reason?: string;
  /** File size in bytes */
  fileSize: number;
}

/**
 * FileFilter - Large file and extension guard
 *
 * This class filters files based on size and extension to prevent memory
 * explosion and avoid analyzing binary files or large generated files.
 *
 * @class FileFilter
 * @example
 * ```typescript
 * const filter = new FileFilter({ maxFileSizeBytes: 512000 });
 * const result = filter.shouldAnalyzeFile('/path/to/file.ts');
 * if (!result.shouldAnalyze) {
 *   console.log(`Skipping: ${result.reason}`);
 * }
 * ```
 */
export class FileFilter {
  private config: FileFilterConfig;
  private maxFileSizeBytes: number;
  private blockedExtensions: Set<string>;
  private blockedPatterns: RegExp[];

  // Default blocked extensions (binary files, generated files, etc.)
  private static DEFAULT_BLOCKED_EXTENSIONS = [
    '.exe', '.dll', '.so', '.dylib', '.bin', '.o', '.a',
    '.zip', '.tar', '.gz', '.rar', '.7z', '.bz2',
    '.png', '.jpg', '.jpeg', '.gif', '.bmp', '.ico', '.svg', '.webp',
    '.mp3', '.mp4', '.avi', '.mov', '.mkv', '.flv', '.wmv',
    '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
    '.lock', '.map', '.min.js', '.min.css',
  ];

  // Default blocked patterns
  private static DEFAULT_BLOCKED_PATTERNS = [
    /node_modules/,
    /\.git/,
    /\.vscode/,
    /\.idea/,
    /dist/,
    /build/,
    /coverage/,
    /\.next/,
    /\.turbo/,
    /out/,
  ];

  // Default .aegisignore patterns (gitignore-style)
  private static DEFAULT_AEGISIGNORE_PATTERNS = [
    'node_modules/',
    'dist/',
    'build/',
    '.next/',
    '.nuxt/',
    'coverage/',
    '.aegis-state.json',
    '.sentinel/',
    '*.min.js',
    '*.min.css',
    '*.map',
    'vendor/',
    '__generated__/',
    'generated/',
    '*.generated.ts',
    '*.generated.tsx',
    'prisma/generated/',
    '.git/',
  ];

  private aegisignorePatterns: string[] = [];
  private projectRoot: string;

  constructor(config: FileFilterConfig = {}) {
    this.config = config;
    this.maxFileSizeBytes = config.maxFileSizeBytes || 512000; // 500KB default
    this.projectRoot = config.projectRoot || process.cwd();

    // Load .aegisignore patterns
    this.loadAegisignorePatterns(config.loadAegisignore !== false);

    // Merge with additional excludes from .aegisrc.json
    if (config.additionalExcludes && config.additionalExcludes.length > 0) {
      this.aegisignorePatterns = [...this.aegisignorePatterns, ...config.additionalExcludes];
    }

    // Merge default blocked extensions with custom ones
    this.blockedExtensions = new Set([
      ...FileFilter.DEFAULT_BLOCKED_EXTENSIONS,
      ...(config.blockedExtensions || []),
    ]);

    // Merge default blocked patterns with custom ones
    this.blockedPatterns = [
      ...FileFilter.DEFAULT_BLOCKED_PATTERNS,
      ...(config.blockedPatterns?.map(p => new RegExp(p)) || []),
    ];

    // Convert .aegisignore patterns to regex and add to blocked patterns
    for (const pattern of this.aegisignorePatterns) {
      const regex = this.gitignorePatternToRegex(pattern);
      if (regex) {
        this.blockedPatterns.push(regex);
      }
    }

    // Log excluded files info
    this.logExclusionInfo();
  }

  /**
   * Loads .aegisignore patterns from file or uses defaults
   *
   * @private
   * @param loadFromFile - Whether to load from file (default: true)
   */
  private loadAegisignorePatterns(loadFromFile: boolean): void {
    if (loadFromFile) {
      const aegisignorePath = path.join(this.projectRoot, '.aegisignore');
      if (fs.existsSync(aegisignorePath)) {
        try {
          const content = fs.readFileSync(aegisignorePath, 'utf-8');
          this.aegisignorePatterns = this.parseGitignore(content);
          console.log(`[FileFilter] Loaded .aegisignore with ${this.aegisignorePatterns.length} patterns`);
          return;
        } catch (error) {
          console.warn(`[FileFilter] Failed to load .aegisignore: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    }

    // Use default patterns if file doesn't exist or loading failed
    this.aegisignorePatterns = [...FileFilter.DEFAULT_AEGISIGNORE_PATTERNS];
    console.log(`[FileFilter] Using default .aegisignore patterns (${this.aegisignorePatterns.length} patterns)`);
  }

  /**
   * Parses gitignore-style content into patterns
   *
   * @private
   * @param content - Gitignore file content
   * @returns Array of patterns
   */
  private parseGitignore(content: string): string[] {
    const patterns: string[] = [];
    const lines = content.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();
      // Skip empty lines and comments
      if (!trimmed || trimmed.startsWith('#')) {
        continue;
      }
      patterns.push(trimmed);
    }

    return patterns;
  }

  /**
   * Converts gitignore pattern to regex
   *
   * @private
   * @param pattern - Gitignore pattern
   * @returns RegExp or null if pattern is invalid
   */
  private gitignorePatternToRegex(pattern: string): RegExp | null {
    try {
      // Handle negation patterns (prefixed with !)
      const isNegation = pattern.startsWith('!');
      const actualPattern = isNegation ? pattern.slice(1) : pattern;

      // Handle directory patterns (ending with /)
      const isDirectory = actualPattern.endsWith('/');
      const basePattern = isDirectory ? actualPattern.slice(0, -1) : actualPattern;

      // Escape special regex characters except for glob wildcards
      let regexStr = basePattern
        .replace(/[.+^${}()|[\]\\]/g, '\\$&')
        .replace(/\*/g, '[^/]*')
        .replace(/\?/g, '[^/]');

      // Match pattern anywhere in path
      // For directory patterns, match the directory name anywhere
      // For file patterns, match at the end or at a path boundary
      if (isDirectory) {
        regexStr = `.*${regexStr}.*`;
      } else if (actualPattern.includes('*')) {
        // Wildcard pattern like *.min.js - match at end or after slash
        regexStr = `.*${regexStr}$`;
      } else {
        // Exact file pattern - match at end or after slash
        regexStr = `(?:^|/)${regexStr}(?:/|$)`;
      }

      return new RegExp(regexStr);
    } catch {
      return null;
    }
  }

  /**
   * Logs exclusion information at startup
   *
   * @private
   */
  private logExclusionInfo(): void {
    const patternCount = this.aegisignorePatterns.length;
    const extensionCount = this.blockedExtensions.size;
    const patternRegexCount = this.blockedPatterns.length;

    console.log(`[FileFilter] Exclusion configuration:`);
    console.log(`  - .aegisignore patterns: ${patternCount}`);
    console.log(`  - Blocked extensions: ${extensionCount}`);
    console.log(`  - Blocked path patterns: ${patternRegexCount}`);

    if (this.aegisignorePatterns.length > 0) {
      console.log(`[FileFilter] .aegisignore patterns:`);
      this.aegisignorePatterns.slice(0, 10).forEach(p => console.log(`  - ${p}`));
      if (this.aegisignorePatterns.length > 10) {
        console.log(`  ... and ${this.aegisignorePatterns.length - 10} more`);
      }
    }
  }

  /**
   * Checks if a file should be analyzed
   *
   * This method checks file size, extension, and patterns to determine
   * whether a file should be analyzed or skipped.
   *
   * @param filePath - Path to the file
   * @returns FileFilterResult - Filter result
   *
   * @example
   * ```typescript
   * const result = filter.shouldAnalyzeFile('/path/to/package-lock.json');
   * // { shouldAnalyze: false, reason: 'File too large (2.5MB > 500KB)', fileSize: 2621440 }
   * ```
   */
  shouldAnalyzeFile(filePath: string): FileFilterResult {
    try {
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        return {
          shouldAnalyze: false,
          reason: 'File does not exist',
          fileSize: 0,
        };
      }

      // Get file stats
      const stats = fs.statSync(filePath);
      const fileSize = stats.size;

      // Check file size
      if (fileSize > this.maxFileSizeBytes) {
        const fileSizeMB = (fileSize / (1024 * 1024)).toFixed(2);
        const maxSizeMB = (this.maxFileSizeBytes / (1024 * 1024)).toFixed(2);
        return {
          shouldAnalyze: false,
          reason: `File too large (${fileSizeMB}MB > ${maxSizeMB}MB)`,
          fileSize,
        };
      }

      // Check blocked patterns
      for (const pattern of this.blockedPatterns) {
        if (pattern.test(filePath)) {
          return {
            shouldAnalyze: false,
            reason: `File matches blocked pattern: ${pattern.source}`,
            fileSize,
          };
        }
      }

      // Get file extension
      const ext = path.extname(filePath).toLowerCase();

      // Check blocked extensions
      if (this.blockedExtensions.has(ext)) {
        return {
          shouldAnalyze: false,
          reason: `Blocked extension: ${ext}`,
          fileSize,
        };
      }

      // If allowed extensions are specified, check if extension is allowed
      if (this.config.allowedExtensions && this.config.allowedExtensions.length > 0) {
        if (!this.config.allowedExtensions.includes(ext)) {
          return {
            shouldAnalyze: false,
            reason: `Extension not in allowed list: ${ext}`,
            fileSize,
          };
        }
      }

      // File passes all checks
      return {
        shouldAnalyze: true,
        fileSize,
      };
    } catch (error) {
      // If stat fails, skip the file
      return {
        shouldAnalyze: false,
        reason: `Failed to read file stats: ${error instanceof Error ? error.message : 'Unknown error'}`,
        fileSize: 0,
      };
    }
  }

  /**
   * Checks if a file should be included (alias for shouldAnalyzeFile)
   *
   * This method provides a simpler API for file inclusion checks.
   *
   * @param filePath - Path to the file
   * @returns boolean - Whether the file should be included
   *
   * @example
   * ```typescript
   * const shouldInclude = filter.shouldInclude('/path/to/file.ts');
   * // true or false
   * ```
   */
  shouldInclude(filePath: string): boolean {
    const result = this.shouldAnalyzeFile(filePath);
    return result.shouldAnalyze;
  }

  /**
   * Filters an array of file paths
   *
   * @param filePaths - Array of file paths
   * @returns Array of file paths that should be analyzed
   *
   * @example
   * ```typescript
   * const files = ['/path/to/file.ts', '/path/to/image.png'];
   * const filtered = filter.filterFiles(files);
   * // ['/path/to/file.ts']
   * ```
   */
  filterFiles(filePaths: string[]): string[] {
    const filtered: string[] = [];
    const skipped: { path: string; reason: string }[] = [];

    for (const filePath of filePaths) {
      const result = this.shouldAnalyzeFile(filePath);

      if (result.shouldAnalyze) {
        filtered.push(filePath);
      } else {
        skipped.push({ path: filePath, reason: result.reason || 'Unknown' });
      }
    }

    if (skipped.length > 0) {
      console.log(`[FileFilter] Skipped ${skipped.length} files`);
      skipped.slice(0, 10).forEach(({ path, reason }) => {
        console.log(`  - ${path}: ${reason}`);
      });
      if (skipped.length > 10) {
        console.log(`  ... and ${skipped.length - 10} more`);
      }
    }

    return filtered;
  }

  /**
   * Gets the current max file size
   *
   * @returns Max file size in bytes
   */
  getMaxFileSize(): number {
    return this.maxFileSizeBytes;
  }

  /**
   * Sets the max file size
   *
   * @param sizeBytes - New max file size in bytes
   */
  setMaxFileSize(sizeBytes: number): void {
    this.maxFileSizeBytes = sizeBytes;
  }

  /**
   * Adds a blocked extension
   *
   * @param extension - Extension to block (e.g., '.log')
   */
  addBlockedExtension(extension: string): void {
    this.blockedExtensions.add(extension.toLowerCase());
  }

  /**
   * Adds a blocked pattern
   *
   * @param pattern - Pattern to block (as RegExp string)
   */
  addBlockedPattern(pattern: string): void {
    this.blockedPatterns.push(new RegExp(pattern));
  }

  /**
   * Detects the source directory for a project
   *
   * This function checks for common source directory patterns:
   * - src/ (most common)
   * - lib/ (common in older projects)
   * - app/ (common in some frameworks)
   * - root directory (fallback)
   *
   * @param projectRoot - Project root directory
   * @returns string - Detected source directory path (relative to projectRoot)
   *
   * @example
   * ```typescript
   * const sourceDir = FileFilter.detectSourceDirectory('/path/to/project');
   * // Returns 'src' if src/ exists, 'lib' if lib/ exists, etc.
   * ```
   */
  static detectSourceDirectory(projectRoot: string): string {
    const commonSourceDirs = ['src', 'lib', 'app', 'source', 'server'];

    for (const dir of commonSourceDirs) {
      const dirPath = path.join(projectRoot, dir);
      if (fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory()) {
        // Check if this directory has source files
        const entries = fs.readdirSync(dirPath);
        const hasSourceFiles = entries.some(entry => {
          const ext = path.extname(entry).toLowerCase();
          return ['.ts', '.tsx', '.js', '.jsx'].includes(ext);
        });

        if (hasSourceFiles) {
          return dir;
        }
      }
    }

    // Fallback to root directory
    return '.';
  }

  /**
   * Gets source file patterns based on detected source directory
   *
   * @param projectRoot - Project root directory
   * @returns string[] - Array of glob patterns for source files
   */
  static getSourceFilePatterns(projectRoot: string): string[] {
    const sourceDir = FileFilter.detectSourceDirectory(projectRoot);
    const extensions = ['ts', 'tsx', 'js', 'jsx'];

    if (sourceDir === '.') {
      // Use root directory
      return extensions.map(ext => `**/*.${ext}`);
    } else {
      // Use detected source directory
      return extensions.map(ext => `${sourceDir}/**/*.${ext}`);
    }
  }
}
