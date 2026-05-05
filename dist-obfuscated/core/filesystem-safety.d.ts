/**
 * Filesystem Safety Module
 *
 * Provides utilities for safe filesystem operations including symlink protection.
 * Prevents path traversal attacks and ensures all file operations stay within project bounds.
 *
 * @module core/filesystem-safety
 * @since 1.0.0
 */
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
export declare function resolveAndValidatePath(filePath: string, projectRoot: string): PathValidationResult;
/**
 * Validates multiple file paths in batch.
 *
 * @param filePaths - Array of file paths to validate
 * @param projectRoot - The project root directory
 * @returns Array of PathValidationResult for each path
 */
export declare function validatePaths(filePaths: string[], projectRoot: string): PathValidationResult[];
/**
 * Filters an array of file paths, keeping only those that are valid and safe.
 *
 * @param filePaths - Array of file paths to filter
 * @param projectRoot - The project root directory
 * @returns Array of valid resolved paths
 */
export declare function filterValidPaths(filePaths: string[], projectRoot: string): string[];
//# sourceMappingURL=filesystem-safety.d.ts.map