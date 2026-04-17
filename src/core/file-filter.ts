/**
 * FileFilter - Large file and extension guard
 *
 * Purpose: Filters files based on size and extension to prevent memory explosion
 * and avoid analyzing binary files or large generated files.
 *
 * Architecture:
 * - Filters by file size (default: 500KB max)
 * - Filters by extension to skip binary files
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

  constructor(config: FileFilterConfig = {}) {
    this.config = config;
    this.maxFileSizeBytes = config.maxFileSizeBytes || 512000; // 500KB default
    
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
