/**
 * Write Guard - Read-Only Mode Enforcement
 *
 * This module provides a FileSystem abstraction layer that enforces read-only
 * mode at the infrastructure level. Unlike dry-run which is a logical flag that
 * modules check voluntarily, this blocks writes at the filesystem level even
 * if there's a bug that bypasses dry-run checks.
 *
 * @module core/write-guard
 * @since 2.0.0
 */
import * as fs from 'fs';
/**
 * Write guard mode
 */
export type WriteGuardMode = 'readWrite' | 'readOnly';
/**
 * Write guard violation error
 * Thrown when a write operation is attempted in read-only mode
 */
export declare class WriteGuardViolation extends Error {
    /** The write operation that was attempted */
    operation: string;
    /** The file path that was being written to */
    filePath: string;
    /** Stack trace of where the write was attempted */
    stackTrace: string;
    constructor(operation: string, filePath: string, stackTrace: string);
}
/**
 * FileSystem abstraction layer with write guard
 */
export declare class FileSystem {
    private mode;
    constructor(mode?: WriteGuardMode);
    /**
     * Sets the write guard mode
     *
     * @param mode - The mode to set
     */
    setMode(mode: WriteGuardMode): void;
    /**
     * Gets the current write guard mode
     *
     * @returns The current mode
     */
    getMode(): WriteGuardMode;
    /**
     * Checks if write operations are allowed
     *
     * @returns true if writes are allowed, false otherwise
     */
    isWriteAllowed(): boolean;
    /**
     * Guards a write operation by throwing an error if in read-only mode
     *
     * @private
     * @param operation - The name of the write operation
     * @param filePath - The file path being written to
     * @throws WriteGuardViolation if in read-only mode
     */
    private guardWrite;
    /**
     * Writes data to a file synchronously
     *
     * @param filePath - The file path to write to
     * @param data - The data to write
     * @param options - File write options
     */
    writeFileSync(filePath: string, data: string | Buffer, options?: fs.WriteFileOptions): void;
    /**
     * Creates a directory synchronously
     *
     * @param dirPath - The directory path to create
     * @param options - Directory creation options
     */
    mkdirSync(dirPath: string, options?: fs.MakeDirectoryOptions): void;
    /**
     * Renames a file or directory synchronously
     *
     * @param oldPath - The old path
     * @param newPath - The new path
     */
    renameSync(oldPath: string, newPath: string): void;
    /**
     * Deletes a file synchronously
     *
     * @param filePath - The file path to delete
     */
    unlinkSync(filePath: string): void;
    /**
     * Copies a file synchronously
     *
     * @param src - The source file path
     * @param dest - The destination file path
     * @param mode - Copy mode
     */
    copyFileSync(src: string, dest: string, mode?: number): void;
    /**
     * Removes a directory recursively synchronously
     *
     * @param dirPath - The directory path to remove
     */
    rmSync(dirPath: string, options?: fs.RmOptions): void;
    /**
     * Writes data to a file asynchronously
     *
     * @param filePath - The file path to write to
     * @param data - The data to write
     * @param options - File write options
     * @returns Promise that resolves when the write is complete
     */
    writeFile(filePath: string, data: string | Buffer, options?: fs.WriteFileOptions): Promise<void>;
    /**
     * Creates a directory asynchronously
     *
     * @param dirPath - The directory path to create
     * @param options - Directory creation options
     * @returns Promise that resolves when the directory is created
     */
    mkdir(dirPath: string, options?: fs.MakeDirectoryOptions): Promise<void>;
    /**
     * Renames a file or directory asynchronously
     *
     * @param oldPath - The old path
     * @param newPath - The new path
     * @returns Promise that resolves when the rename is complete
     */
    rename(oldPath: string, newPath: string): Promise<void>;
    /**
     * Deletes a file asynchronously
     *
     * @param filePath - The file path to delete
     * @returns Promise that resolves when the file is deleted
     */
    unlink(filePath: string): Promise<void>;
    /**
     * Copies a file asynchronously
     *
     * @param src - The source file path
     * @param dest - The destination file path
     * @param mode - Copy mode
     * @returns Promise that resolves when the copy is complete
     */
    copyFile(src: string, dest: string, mode?: number): Promise<void>;
    /**
     * Removes a directory recursively asynchronously
     *
     * @param dirPath - The directory path to remove
     * @param options - Remove options
     * @returns Promise that resolves when the directory is removed
     */
    rm(dirPath: string, options?: fs.RmOptions): Promise<void>;
    /**
     * Reads a file synchronously
     *
     * @param filePath - The file path to read
     * @param options - File read options
     * @returns The file contents
     */
    readFileSync(filePath: string, options?: fs.EncodingOption | BufferEncoding): Buffer | string;
    /**
     * Checks if a file or directory exists synchronously
     *
     * @param filePath - The file path to check
     * @returns true if the path exists, false otherwise
     */
    existsSync(filePath: string): boolean;
    /**
     * Reads a directory synchronously
     *
     * @param dirPath - The directory path to read
     * @param options - Directory read options
     * @returns Array of file/directory names
     */
    readdirSync(dirPath: string, options?: {
        withFileTypes?: boolean;
        encoding?: BufferEncoding;
    }): string[] | Buffer[] | fs.Dirent[];
    /**
     * Gets file statistics synchronously
     *
     * @param filePath - The file path to stat
     * @returns File statistics
     */
    statSync(filePath: string): fs.Stats;
    /**
     * Reads a file asynchronously
     *
     * @param filePath - The file path to read
     * @param options - File read options
     * @returns Promise that resolves with the file contents
     */
    readFile(filePath: string, options?: fs.EncodingOption | BufferEncoding): Promise<Buffer | string>;
    /**
     * Checks if a file or directory exists asynchronously
     *
     * @param filePath - The file path to check
     * @returns Promise that resolves with true if the path exists, false otherwise
     */
    exists(filePath: string): Promise<boolean>;
    /**
     * Reads a directory asynchronously
     *
     * @param dirPath - The directory path to read
     * @param options - Directory read options
     * @returns Promise that resolves with array of file/directory names
     */
    readdir(dirPath: string, options?: {
        withFileTypes?: boolean;
        encoding?: BufferEncoding;
    }): Promise<string[] | Buffer[] | fs.Dirent[]>;
    /**
     * Gets file statistics asynchronously
     *
     * @param filePath - The file path to stat
     * @returns Promise that resolves with file statistics
     */
    stat(filePath: string): Promise<fs.Stats>;
}
/**
 * Gets the global file system instance
 *
 * @returns The global file system instance
 */
export declare function getFileSystem(): FileSystem;
/**
 * Sets the global file system instance
 *
 * @param fileSystem - The file system instance to set
 */
export declare function setFileSystem(fileSystem: FileSystem): void;
/**
 * Resets the global file system instance to read-write mode
 * This is useful for testing
 */
export declare function resetFileSystem(): void;
//# sourceMappingURL=write-guard.d.ts.map