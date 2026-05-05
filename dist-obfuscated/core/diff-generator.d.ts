/**
 * DiffGenerator - Unified Diff Generation for Dry-Run Mode
 *
 * Purpose: Generate unified diff files (.patch) for proposed fixes
 * when running in dry-run mode. This allows users to review changes
 * before applying them to the codebase.
 *
 * @module core/diff-generator
 * @since 1.1.0
 */
/**
 * File diff information
 */
interface FileDiff {
    /** Original file path */
    filePath: string;
    /** Original content */
    originalContent: string;
    /** Modified content */
    modifiedContent: string;
    /** Diff in unified format */
    unifiedDiff: string;
}
/**
 * Diff generation result
 */
interface DiffResult {
    /** Total number of files with diffs */
    totalFiles: number;
    /** Total number of lines changed */
    totalLinesChanged: number;
    /** Array of file diffs */
    diffs: FileDiff[];
    /** Path to the generated patch file */
    patchFilePath: string;
}
/**
 * DiffGenerator - Unified diff generation for dry-run mode
 *
 * This class generates unified diff files for proposed fixes,
 * allowing users to review changes before applying them.
 *
 * @class DiffGenerator
 */
export declare class DiffGenerator {
    private patchesDir;
    constructor(projectRoot: string);
    /**
     * Ensures the patches directory exists
     *
     * @private
     * @returns Promise<void>
     */
    private ensurePatchesDir;
    /**
     * Generates a unified diff between two strings
     *
     * @private
     * @param original - Original content
     * @param modified - Modified content
     * @param filePath - File path for the diff header
     * @returns string - Unified diff string
     */
    private generateUnifiedDiff;
    /**
     * Generates a diff for a single file
     *
     * @param filePath - File path (relative to project root)
     * @param originalContent - Original file content
     * @param modifiedContent - Modified file content
     * @returns FileDiff - File diff information
     */
    generateFileDiff(filePath: string, originalContent: string, modifiedContent: string): FileDiff;
    /**
     * Generates a combined patch file from multiple file diffs
     *
     * @param diffs - Array of file diffs
     * @param patchFileName - Name of the patch file (default: proposal.patch)
     * @returns Promise<DiffResult> - Diff generation result
     */
    generatePatchFile(diffs: FileDiff[], patchFileName?: string): Promise<DiffResult>;
    /**
     * Gets the patches directory path
     *
     * @returns string - Path to patches directory
     */
    getPatchesDir(): string;
    /**
     * Clears all patches from the patches directory
     *
     * @returns Promise<void>
     */
    clearPatches(): Promise<void>;
    /**
     * Lists all patch files in the patches directory
     *
     * @returns Promise<string[]> - Array of patch file names
     */
    listPatches(): Promise<string[]>;
}
export {};
//# sourceMappingURL=diff-generator.d.ts.map