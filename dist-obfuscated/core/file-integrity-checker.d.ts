/**
 * File Integrity Checker - Checksum Verification
 *
 * Purpose: Provides checksum verification for critical files to prevent
 * tampering and ensure file integrity before and after operations.
 *
 * @module core/file-integrity-checker
 * @since 2.0.0
 */
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
export declare class FileIntegrityChecker {
    /**
     * Calculates SHA-256 checksum for a file
     *
     * @param filePath - File path
     * @returns Promise<FileChecksum> - File checksum information
     */
    static calculateChecksum(filePath: string): Promise<FileChecksum>;
    /**
     * Verifies file integrity against expected checksum
     *
     * @param filePath - File path
     * @param expectedChecksum - Expected SHA-256 checksum
     * @returns Promise<IntegrityCheckResult> - Integrity check result
     */
    static verifyIntegrity(filePath: string, expectedChecksum: string): Promise<IntegrityCheckResult>;
    /**
     * Calculates checksum for multiple files
     *
     * @param filePaths - Array of file paths
     * @returns Promise<Map<string, FileChecksum>> - Map of file paths to checksums
     */
    static calculateChecksums(filePaths: string[]): Promise<Map<string, FileChecksum>>;
    /**
     * Verifies integrity of multiple files
     *
     * @param checksums - Map of file paths to expected checksums
     * @returns Promise<Map<string, IntegrityCheckResult>> - Map of file paths to check results
     */
    static verifyIntegrityBatch(checksums: Map<string, FileChecksum>): Promise<Map<string, IntegrityCheckResult>>;
    /**
     * Creates a snapshot of file checksums for a directory
     *
     * @param dirPath - Directory path
     * @returns Promise<Map<string, FileChecksum>> - Map of file paths to checksums
     */
    static createSnapshot(dirPath: string): Promise<Map<string, FileChecksum>>;
    /**
     * Compares two snapshots to detect changes
     *
     * @param before - Snapshot before changes
     * @param after - Snapshot after changes
     * @returns Map<string, IntegrityCheckResult> - Map of file paths to change results
     */
    static compareSnapshots(before: Map<string, FileChecksum>, after: Map<string, FileChecksum>): Map<string, IntegrityCheckResult>;
    /**
     * Validates that a file has not been modified since a given timestamp
     *
     * @param filePath - File path
     * @param timestamp - Timestamp to compare against
     * @returns Promise<boolean> - True if file has not been modified
     */
    static validateNotModifiedSince(filePath: string, timestamp: number): Promise<boolean>;
}
//# sourceMappingURL=file-integrity-checker.d.ts.map