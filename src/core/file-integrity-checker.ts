/**
 * File Integrity Checker - Checksum Verification
 *
 * Purpose: Provides checksum verification for critical files to prevent
 * tampering and ensure file integrity before and after operations.
 *
 * @module core/file-integrity-checker
 * @since 2.0.0
 */

import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

/**
 * File checksum information
 */
export interface FileChecksum {
  /** File path */
  filePath: string;
  /** SHA-256 checksum */
  checksum: string;
  /** File size in bytes */
  size: number;
  /** Last modified timestamp */
  lastModified: number;
}

/**
 * Integrity check result
 */
export interface IntegrityCheckResult {
  /** Whether integrity check passed */
  passed: boolean;
  /** Expected checksum */
  expectedChecksum: string;
  /** Actual checksum */
  actualChecksum: string;
  /** Whether file was modified */
  modified: boolean;
  /** Error message if check failed */
  error?: string;
}

/**
 * File Integrity Checker
 *
 * @class FileIntegrityChecker
 */
export class FileIntegrityChecker {
  /**
   * Calculates SHA-256 checksum for a file
   *
   * @param filePath - File path
   * @returns Promise<FileChecksum> - File checksum information
   */
  static async calculateChecksum(filePath: string): Promise<FileChecksum> {
    const content = await fs.promises.readFile(filePath);
    const hash = crypto.createHash('sha256');
    hash.update(content);
    const checksum = hash.digest('hex');

    const stats = await fs.promises.stat(filePath);

    return {
      filePath,
      checksum,
      size: stats.size,
      lastModified: stats.mtimeMs,
    };
  }

  /**
   * Verifies file integrity against expected checksum
   *
   * @param filePath - File path
   * @param expectedChecksum - Expected SHA-256 checksum
   * @returns Promise<IntegrityCheckResult> - Integrity check result
   */
  static async verifyIntegrity(
    filePath: string,
    expectedChecksum: string
  ): Promise<IntegrityCheckResult> {
    try {
      const actualChecksum = await FileIntegrityChecker.calculateChecksum(filePath);
      const passed = actualChecksum.checksum === expectedChecksum;

      return {
        passed,
        expectedChecksum,
        actualChecksum: actualChecksum.checksum,
        modified: !passed,
      };
    } catch (error) {
      return {
        passed: false,
        expectedChecksum,
        actualChecksum: '',
        modified: true,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Calculates checksum for multiple files
   *
   * @param filePaths - Array of file paths
   * @returns Promise<Map<string, FileChecksum>> - Map of file paths to checksums
   */
  static async calculateChecksums(filePaths: string[]): Promise<Map<string, FileChecksum>> {
    const checksums = new Map<string, FileChecksum>();

    for (const filePath of filePaths) {
      try {
        const checksum = await FileIntegrityChecker.calculateChecksum(filePath);
        checksums.set(filePath, checksum);
      } catch (error) {
        console.warn(`[IntegrityChecker] Failed to calculate checksum for ${filePath}:`, error);
      }
    }

    return checksums;
  }

  /**
   * Verifies integrity of multiple files
   *
   * @param checksums - Map of file paths to expected checksums
   * @returns Promise<Map<string, IntegrityCheckResult>> - Map of file paths to check results
   */
  static async verifyIntegrityBatch(
    checksums: Map<string, FileChecksum>
  ): Promise<Map<string, IntegrityCheckResult>> {
    const results = new Map<string, IntegrityCheckResult>();

    for (const [filePath, expectedChecksum] of checksums.entries()) {
      const result = await FileIntegrityChecker.verifyIntegrity(filePath, expectedChecksum.checksum);
      results.set(filePath, result);
    }

    return results;
  }

  /**
   * Creates a snapshot of file checksums for a directory
   *
   * @param dirPath - Directory path
   * @returns Promise<Map<string, FileChecksum>> - Map of file paths to checksums
   */
  static async createSnapshot(dirPath: string): Promise<Map<string, FileChecksum>> {
    const checksums = new Map<string, FileChecksum>();

    const collectFiles = async (currentDir: string): Promise<void> => {
      const entries = await fs.promises.readdir(currentDir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);

        if (entry.isDirectory()) {
          // Skip node_modules, .git, .aegis-cache
          if (entry.name !== 'node_modules' && entry.name !== '.git' && entry.name !== '.aegis-cache') {
            await collectFiles(fullPath);
          }
        } else {
          try {
            const checksum = await FileIntegrityChecker.calculateChecksum(fullPath);
            checksums.set(fullPath, checksum);
          } catch (error) {
            console.warn(`[IntegrityChecker] Failed to checksum ${fullPath}:`, error);
          }
        }
      }
    };

    await collectFiles(dirPath);
    return checksums;
  }

  /**
   * Compares two snapshots to detect changes
   *
   * @param before - Snapshot before changes
   * @param after - Snapshot after changes
   * @returns Map<string, IntegrityCheckResult> - Map of file paths to change results
   */
  static compareSnapshots(
    before: Map<string, FileChecksum>,
    after: Map<string, FileChecksum>
  ): Map<string, IntegrityCheckResult> {
    const results = new Map<string, IntegrityCheckResult>();

    // Check for modified files
    for (const [filePath, beforeChecksum] of before.entries()) {
      const afterChecksum = after.get(filePath);

      if (!afterChecksum) {
        // File was deleted
        results.set(filePath, {
          passed: false,
          expectedChecksum: beforeChecksum.checksum,
          actualChecksum: '<deleted>',
          modified: true,
        });
      } else if (afterChecksum.checksum !== beforeChecksum.checksum) {
        // File was modified
        results.set(filePath, {
          passed: false,
          expectedChecksum: beforeChecksum.checksum,
          actualChecksum: afterChecksum.checksum,
          modified: true,
        });
      }
    }

    // Check for new files
    for (const [filePath] of after.entries()) {
      if (!before.has(filePath)) {
        results.set(filePath, {
          passed: false,
          expectedChecksum: '<new>',
          actualChecksum: after.get(filePath)!.checksum,
          modified: true,
        });
      }
    }

    return results;
  }

  /**
   * Validates that a file has not been modified since a given timestamp
   *
   * @param filePath - File path
   * @param timestamp - Timestamp to compare against
   * @returns Promise<boolean> - True if file has not been modified
   */
  static async validateNotModifiedSince(filePath: string, timestamp: number): Promise<boolean> {
    try {
      const stats = await fs.promises.stat(filePath);
      return stats.mtimeMs <= timestamp;
    } catch (error) {
      return false;
    }
  }
}
