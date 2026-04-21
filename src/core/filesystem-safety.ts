/**
 * Filesystem Safety Module
 *
 * Provides utilities for safe filesystem operations including symlink protection.
 * Prevents path traversal attacks and ensures all file operations stay within project bounds.
 *
 * @module core/filesystem-safety
 * @since 1.0.0
 */

import * as fs from 'fs';
import * as path from 'path';

/**
 * Validation result for a resolved path
 */
export interface PathValidationResult {
  /** Whether the path is valid and safe */
  isValid: boolean;
  /** The resolved real path (following symlinks) */
  resolvedPath: string;
  /** Error message if validation failed */
  error?: string;
}

/**
 * Resolves a file path and validates it stays within the project root.
 * This prevents symlink-based path traversal attacks.
 *
 * @param filePath - The file path to validate (can be relative or absolute)
 * @param projectRoot - The project root directory (absolute path)
 * @returns PathValidationResult with validation status and resolved path
 */
export function resolveAndValidatePath(
  filePath: string,
  projectRoot: string
): PathValidationResult {
  try {
    // Resolve the absolute path of the input
    const absolutePath = path.resolve(projectRoot, filePath);

    // Resolve the real path (follow symlinks)
    const realPath = fs.realpathSync(absolutePath);

    // Normalize both paths for comparison
    const normalizedRealPath = path.normalize(realPath);
    const normalizedProjectRoot = path.normalize(projectRoot);

    // Check if the resolved path is within the project root
    if (!normalizedRealPath.startsWith(normalizedProjectRoot)) {
      return {
        isValid: false,
        resolvedPath: normalizedRealPath,
        error: `Path traversal detected: Resolved path "${normalizedRealPath}" is outside project root "${normalizedProjectRoot}"`,
      };
    }

    // Additional check: prevent escaping via parent directory symlinks
    const relativePath = path.relative(normalizedProjectRoot, normalizedRealPath);
    if (relativePath.startsWith('..')) {
      return {
        isValid: false,
        resolvedPath: normalizedRealPath,
        error: `Path traversal detected: Relative path "${relativePath}" escapes project root`,
      };
    }

    return {
      isValid: true,
      resolvedPath: normalizedRealPath,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      isValid: false,
      resolvedPath: filePath,
      error: `Failed to resolve path "${filePath}": ${errorMessage}`,
    };
  }
}

/**
 * Validates multiple file paths in batch.
 *
 * @param filePaths - Array of file paths to validate
 * @param projectRoot - The project root directory
 * @returns Array of PathValidationResult for each path
 */
export function validatePaths(
  filePaths: string[],
  projectRoot: string
): PathValidationResult[] {
  return filePaths.map((filePath) => resolveAndValidatePath(filePath, projectRoot));
}

/**
 * Filters an array of file paths, keeping only those that are valid and safe.
 *
 * @param filePaths - Array of file paths to filter
 * @param projectRoot - The project root directory
 * @returns Array of valid resolved paths
 */
export function filterValidPaths(filePaths: string[], projectRoot: string): string[] {
  const results = validatePaths(filePaths, projectRoot);
  return results
    .filter((result) => result.isValid)
    .map((result) => result.resolvedPath);
}
