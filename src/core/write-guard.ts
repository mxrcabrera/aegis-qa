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
export class WriteGuardViolation extends Error {
  /** The write operation that was attempted */
  operation: string;

  /** The file path that was being written to */
  filePath: string;

  /** Stack trace of where the write was attempted */
  stackTrace: string;

  constructor(operation: string, filePath: string, stackTrace: string) {
    super(`[WriteGuard] Write operation '${operation}' attempted in read-only mode on path: ${filePath}`);
    this.name = 'WriteGuardViolation';
    this.operation = operation;
    this.filePath = filePath;
    this.stackTrace = stackTrace;
  }
}

/**
 * FileSystem abstraction layer with write guard
 */
export class FileSystem {
  private mode: WriteGuardMode;

  constructor(mode: WriteGuardMode = 'readWrite') {
    this.mode = mode;
  }

  /**
   * Sets the write guard mode
   *
   * @param mode - The mode to set
   */
  setMode(mode: WriteGuardMode): void {
    this.mode = mode;
  }

  /**
   * Gets the current write guard mode
   *
   * @returns The current mode
   */
  getMode(): WriteGuardMode {
    return this.mode;
  }

  /**
   * Checks if write operations are allowed
   *
   * @returns true if writes are allowed, false otherwise
   */
  isWriteAllowed(): boolean {
    return this.mode === 'readWrite';
  }

  /**
   * Guards a write operation by throwing an error if in read-only mode
   *
   * @private
   * @param operation - The name of the write operation
   * @param filePath - The file path being written to
   * @throws WriteGuardViolation if in read-only mode
   */
  private guardWrite(operation: string, filePath: string): void {
    if (this.mode === 'readOnly') {
      const stack = new Error().stack || '';
      throw new WriteGuardViolation(operation, filePath, stack);
    }
  }

  // Synchronous write operations

  /**
   * Writes data to a file synchronously
   *
   * @param filePath - The file path to write to
   * @param data - The data to write
   * @param options - File write options
   */
  writeFileSync(filePath: string, data: string | Buffer, options?: fs.WriteFileOptions): void {
    this.guardWrite('writeFileSync', filePath);
    fs.writeFileSync(filePath, data, options);
  }

  /**
   * Creates a directory synchronously
   *
   * @param dirPath - The directory path to create
   * @param options - Directory creation options
   */
  mkdirSync(dirPath: string, options?: fs.MakeDirectoryOptions): void {
    this.guardWrite('mkdirSync', dirPath);
    fs.mkdirSync(dirPath, options);
  }

  /**
   * Renames a file or directory synchronously
   *
   * @param oldPath - The old path
   * @param newPath - The new path
   */
  renameSync(oldPath: string, newPath: string): void {
    this.guardWrite('renameSync', `${oldPath} -> ${newPath}`);
    fs.renameSync(oldPath, newPath);
  }

  /**
   * Deletes a file synchronously
   *
   * @param filePath - The file path to delete
   */
  unlinkSync(filePath: string): void {
    this.guardWrite('unlinkSync', filePath);
    fs.unlinkSync(filePath);
  }

  /**
   * Copies a file synchronously
   *
   * @param src - The source file path
   * @param dest - The destination file path
   * @param mode - Copy mode
   */
  copyFileSync(src: string, dest: string, mode?: number): void {
    this.guardWrite('copyFileSync', `${src} -> ${dest}`);
    fs.copyFileSync(src, dest, mode);
  }

  /**
   * Removes a directory recursively synchronously
   *
   * @param dirPath - The directory path to remove
   */
  rmSync(dirPath: string, options?: fs.RmOptions): void {
    this.guardWrite('rmSync', dirPath);
    fs.rmSync(dirPath, options);
  }

  // Asynchronous write operations

  /**
   * Writes data to a file asynchronously
   *
   * @param filePath - The file path to write to
   * @param data - The data to write
   * @param options - File write options
   * @returns Promise that resolves when the write is complete
   */
  async writeFile(filePath: string, data: string | Buffer, options?: fs.WriteFileOptions): Promise<void> {
    this.guardWrite('writeFile', filePath);
    return fs.promises.writeFile(filePath, data, options);
  }

  /**
   * Creates a directory asynchronously
   *
   * @param dirPath - The directory path to create
   * @param options - Directory creation options
   * @returns Promise that resolves when the directory is created
   */
  async mkdir(dirPath: string, options?: fs.MakeDirectoryOptions): Promise<void> {
    this.guardWrite('mkdir', dirPath);
    await fs.promises.mkdir(dirPath, options);
  }

  /**
   * Renames a file or directory asynchronously
   *
   * @param oldPath - The old path
   * @param newPath - The new path
   * @returns Promise that resolves when the rename is complete
   */
  async rename(oldPath: string, newPath: string): Promise<void> {
    this.guardWrite('rename', `${oldPath} -> ${newPath}`);
    return fs.promises.rename(oldPath, newPath);
  }

  /**
   * Deletes a file asynchronously
   *
   * @param filePath - The file path to delete
   * @returns Promise that resolves when the file is deleted
   */
  async unlink(filePath: string): Promise<void> {
    this.guardWrite('unlink', filePath);
    return fs.promises.unlink(filePath);
  }

  /**
   * Copies a file asynchronously
   *
   * @param src - The source file path
   * @param dest - The destination file path
   * @param mode - Copy mode
   * @returns Promise that resolves when the copy is complete
   */
  async copyFile(src: string, dest: string, mode?: number): Promise<void> {
    this.guardWrite('copyFile', `${src} -> ${dest}`);
    return fs.promises.copyFile(src, dest, mode);
  }

  /**
   * Removes a directory recursively asynchronously
   *
   * @param dirPath - The directory path to remove
   * @param options - Remove options
   * @returns Promise that resolves when the directory is removed
   */
  async rm(dirPath: string, options?: fs.RmOptions): Promise<void> {
    this.guardWrite('rm', dirPath);
    return fs.promises.rm(dirPath, options);
  }

  // Read operations (always allowed)

  /**
   * Reads a file synchronously
   *
   * @param filePath - The file path to read
   * @param options - File read options
   * @returns The file contents
   */
  readFileSync(filePath: string, options?: fs.EncodingOption | BufferEncoding): Buffer | string {
    return fs.readFileSync(filePath, options);
  }

  /**
   * Checks if a file or directory exists synchronously
   *
   * @param filePath - The file path to check
   * @returns true if the path exists, false otherwise
   */
  existsSync(filePath: string): boolean {
    return fs.existsSync(filePath);
  }

  /**
   * Reads a directory synchronously
   *
   * @param dirPath - The directory path to read
   * @param options - Directory read options
   * @returns Array of file/directory names
   */
  readdirSync(dirPath: string, options?: { withFileTypes?: boolean; encoding?: BufferEncoding }): string[] | Buffer[] | fs.Dirent[] {
    return fs.readdirSync(dirPath, options as any);
  }

  /**
   * Gets file statistics synchronously
   *
   * @param filePath - The file path to stat
   * @returns File statistics
   */
  statSync(filePath: string): fs.Stats {
    return fs.statSync(filePath);
  }

  /**
   * Reads a file asynchronously
   *
   * @param filePath - The file path to read
   * @param options - File read options
   * @returns Promise that resolves with the file contents
   */
  async readFile(filePath: string, options?: fs.EncodingOption | BufferEncoding): Promise<Buffer | string> {
    return fs.promises.readFile(filePath, options);
  }

  /**
   * Checks if a file or directory exists asynchronously
   *
   * @param filePath - The file path to check
   * @returns Promise that resolves with true if the path exists, false otherwise
   */
  async exists(filePath: string): Promise<boolean> {
    try {
      await fs.promises.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Reads a directory asynchronously
   *
   * @param dirPath - The directory path to read
   * @param options - Directory read options
   * @returns Promise that resolves with array of file/directory names
   */
  async readdir(dirPath: string, options?: { withFileTypes?: boolean; encoding?: BufferEncoding }): Promise<string[] | Buffer[] | fs.Dirent[]> {
    return fs.promises.readdir(dirPath, options as any);
  }

  /**
   * Gets file statistics asynchronously
   *
   * @param filePath - The file path to stat
   * @returns Promise that resolves with file statistics
   */
  async stat(filePath: string): Promise<fs.Stats> {
    return fs.promises.stat(filePath);
  }
}

/**
 * Global file system instance
 * This is the singleton instance that should be used throughout the application
 */
let globalFileSystem: FileSystem | null = null;

/**
 * Gets the global file system instance
 *
 * @returns The global file system instance
 */
export function getFileSystem(): FileSystem {
  if (!globalFileSystem) {
    globalFileSystem = new FileSystem('readWrite');
  }
  return globalFileSystem;
}

/**
 * Sets the global file system instance
 *
 * @param fileSystem - The file system instance to set
 */
export function setFileSystem(fileSystem: FileSystem): void {
  globalFileSystem = fileSystem;
}

/**
 * Resets the global file system instance to read-write mode
 * This is useful for testing
 */
export function resetFileSystem(): void {
  globalFileSystem = new FileSystem('readWrite');
}
