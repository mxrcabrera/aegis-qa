/**
 * StatePersistence - Black Box for Progress Tracking
 *
 * Purpose: Save and restore execution state to enable resume capability after
 * interruptions (SIGINT, thermal shutdown, system crash). This is the "black box"
 * that records everything Aegis QA has analyzed so far.
 *
 * Architecture:
 * - Saves state after each phase or every 50 files
 * - Stores phase progress, file progress, and thermal logs
 * - Enables "aegis resume" to continue exactly where execution stopped
 * - Survives SIGINT (Ctrl+C) and thermal shutdown
 *
 * @module core/state-persistence
 * @since 2.0.0
 */

import * as fs from 'fs';
import * as path from 'path';
import { resolve } from 'path';
import * as crypto from 'crypto';
import { resolveAndValidatePath } from './filesystem-safety.js';
import { getFileSystem } from './write-guard.js';

/**
 * Phase execution state
 */
interface PhaseState {
  /** Phase number */
  phase: number;
  /** Phase name */
  phaseName: string;
  /** Whether phase completed */
  completed: boolean;
  /** Findings count from this phase */
  findingsCount: number;
  /** Execution time in milliseconds */
  executionTimeMs: number;
}

/**
 * File processing state
 */
interface FileState {
  /** File path */
  filePath: string;
  /** Whether file was processed */
  processed: boolean;
  /** Processing timestamp */
  timestamp: string;
  /** Any errors during processing */
  error?: string;
}

/**
 * Thermal log entry
 */
interface ThermalLogEntry {
  /** Timestamp */
  timestamp: string;
  /** GPU temperature in Celsius (if available) */
  gpuTemp?: number;
  /** CPU usage percentage */
  cpuUsage: number;
  /** RAM usage percentage */
  ramUsage: number;
  /** Event type */
  event: 'check' | 'cooldown' | 'critical' | 'warning';
  /** Message */
  message?: string;
}

/**
 * Complete execution state
 */
export interface ExecutionState {
  /** Project root directory */
  projectRoot: string;
  /** Current phase number */
  currentPhase: number;
  /** Total phases */
  totalPhases: number;
  /** Phase states */
  phases: PhaseState[];
  /** File states */
  files: FileState[];
  /** Thermal logs */
  thermalLogs: ThermalLogEntry[];
  /** Total findings so far */
  totalFindings: number;
  /** Execution start timestamp */
  startTime: string;
  /** Last save timestamp */
  lastSaveTime: string;
  /** Whether execution was interrupted */
  interrupted: boolean;
  /** Interruption reason */
  interruptionReason?: string;
  /** Analysis results cache (shared context between phases) */
  analysisResults?: Record<string, any>;
  /** Project type detected: typescript | javascript | mixed */
  projectType?: 'typescript' | 'javascript' | 'mixed';
  /** High risk blocker flag - if true, commits should be blocked */
  highRiskBlocker?: boolean;
  /** Context store for cross-phase communication */
  contextStore?: Record<string, any>;
  /** Ready for audit flag - if true, report is ready for audit */
  readyForAudit?: boolean;
  /** Git stash reference for checkpoint (e.g., "stash@{0}") */
  gitCheckpointStashRef?: string;
  /** SHA-256 checksum for integrity validation */
  _checksum?: string;
}

/**
 * StatePersistence - Progress tracking and resume capability
 *
 * This class manages the "black box" that records all execution state,
 * enabling Aegis QA to resume exactly where it left off after any interruption.
 *
 * @class StatePersistence
 * @example
 * ```typescript
 * const persistence = new StatePersistence('/path/to/project');
 * await persistence.saveState(state);
 * const restored = await persistence.loadState();
 * ```
 */
export class StatePersistence {
  private projectRoot: string;
  private stateFilePath: string;
  private saveInterval: number = 50; // Save every 50 files
  private fileCount: number = 0;
  private maxBackups: number = 5; // Keep last 5 backups
  private backupDir: string;

  constructor(projectRoot: string) {
    this.projectRoot = resolve(projectRoot);
    this.stateFilePath = path.join(this.projectRoot, '.aegis-state.json');
    this.backupDir = path.join(this.projectRoot, '.aegis-backups');

    // Symlink Protection: Validate state file path
    const pathValidation = resolveAndValidatePath(this.stateFilePath, this.projectRoot);
    if (!pathValidation.isValid) {
      throw new Error(`State file path validation failed: ${pathValidation.error}`);
    }
  }

  /**
   * Generates SHA-256 checksum of content
   *
   * @private
   * @param content - Content to hash
   * @returns string - SHA-256 hash in hex format
   */
  private generateChecksum(content: string): string {
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  /**
   * Validates JSON by attempting to parse it
   *
   * @private
   * @param jsonString - JSON string to validate
   * @returns boolean - True if valid JSON
   */
  private isValidJSON(jsonString: string): boolean {
    try {
      JSON.parse(jsonString);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Creates a backup of the current state file
   *
   * @private
   * @returns Promise<void>
   */
  private async createBackup(): Promise<void> {
    try {
      // Ensure backup directory exists
      if (!fs.existsSync(this.backupDir)) {
        getFileSystem().mkdirSync(this.backupDir, { recursive: true });
      }

      if (!fs.existsSync(this.stateFilePath)) {
        return;
      }

      // Create backup filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFileName = `aegis-state-backup-${timestamp}.json`;
      const backupFilePath = path.join(this.backupDir, backupFileName);

      // Copy current state to backup
      getFileSystem().copyFileSync(this.stateFilePath, backupFilePath);

      // Clean up old backups (keep only maxBackups)
      const backups = fs.readdirSync(this.backupDir)
        .filter(f => f.startsWith('aegis-state-backup-') && f.endsWith('.json'))
        .sort();

      while (backups.length > this.maxBackups) {
        const oldBackup = backups.shift();
        if (oldBackup) {
          const oldBackupPath = path.join(this.backupDir, oldBackup);
          getFileSystem().unlinkSync(oldBackupPath);
        }
      }

      console.log(`[StatePersistence] Backup created: ${backupFileName}`);
    } catch (error) {
      console.warn('[StatePersistence] Failed to create backup:', error instanceof Error ? error.message : error);
    }
  }

  /**
   * Attempts to restore from the latest backup
   *
   * @private
   * @returns Promise<ExecutionState | null> - Restored state or null
   */
  private async restoreFromBackup(): Promise<ExecutionState | null> {
    try {
      if (!fs.existsSync(this.backupDir)) {
        return null;
      }

      const backups = fs.readdirSync(this.backupDir)
        .filter(f => f.startsWith('aegis-state-backup-') && f.endsWith('.json'))
        .sort()
        .reverse(); // Get most recent first

      if (backups.length === 0) {
        return null;
      }

      // Try the most recent backup
      const latestBackup = backups[0];
      const backupPath = path.join(this.backupDir, latestBackup);

      const stateJson = fs.readFileSync(backupPath, 'utf-8');
      const state = JSON.parse(stateJson) as ExecutionState;

      // Validate checksum if present
      if (state._checksum) {
        const checksumWithout = stateJson.replace(/"_checksum":\s*"[^"]+"/, '');
        const calculatedChecksum = this.generateChecksum(checksumWithout);
        
        if (calculatedChecksum !== state._checksum) {
          console.warn('[StatePersistence] Backup checksum mismatch, trying next backup');
          
          // Try next backup
          for (let i = 1; i < backups.length; i++) {
            const nextBackupPath = path.join(this.backupDir, backups[i]);
            const nextStateJson = fs.readFileSync(nextBackupPath, 'utf-8');
            const nextState = JSON.parse(nextStateJson) as ExecutionState;
            
            if (nextState._checksum) {
              const nextChecksumWithout = nextStateJson.replace(/"_checksum":\s*"[^"]+"/, '');
              const nextCalculatedChecksum = this.generateChecksum(nextChecksumWithout);
              
              if (nextCalculatedChecksum === nextState._checksum) {
                console.log(`[StatePersistence] Restored from backup: ${backups[i]}`);
                return nextState;
              }
            }
          }
          
          return null;
        }
      }

      console.log(`[StatePersistence] Restored from backup: ${latestBackup}`);
      return state;
    } catch (error) {
      console.error('[StatePersistence] Failed to restore from backup:', error instanceof Error ? error.message : error);
      return null;
    }
  }

  /**
   * Saves execution state to disk
   *
   * This method writes the current execution state to the state file.
   * Called after each phase completion or every N files processed.
   *
   * ACID Properties:
   * - Atomic: Writes to .tmp file, validates, then renames
   * - Consistent: Validates JSON before committing
   * - Isolated: No concurrent writes (single writer)
   * - Durable: Checksum validation on load
   *
   * @param state - Current execution state
   * @returns Promise<void>
   *
   * @example
   * ```typescript
   * await persistence.saveState({
   *   projectRoot: '/path/to/project',
   *   currentPhase: 5,
   *   totalPhases: 20,
   *   phases: [...],
   *   files: [...],
   *   thermalLogs: [...],
   *   totalFindings: 42,
   *   startTime: new Date().toISOString(),
   *   lastSaveTime: new Date().toISOString(),
   *   interrupted: false,
   * });
   * ```
   */
  async saveState(state: ExecutionState): Promise<void> {
    try {
      const stateToSave = {
        ...state,
        lastSaveTime: new Date().toISOString(),
      };

      const stateJson = JSON.stringify(stateToSave, null, 2);
      
      // Generate checksum of content without _checksum field
      const checksum = this.generateChecksum(stateJson);
      stateToSave._checksum = checksum;
      
      const stateJsonWithChecksum = JSON.stringify(stateToSave, null, 2);

      // Atomic write: write to .tmp file first
      const tmpFilePath = this.stateFilePath + '.tmp';
      
      // Create backup before overwriting
      if (fs.existsSync(this.stateFilePath)) {
        await this.createBackup();
      }

      // Write to temp file
      getFileSystem().writeFileSync(tmpFilePath, stateJsonWithChecksum, 'utf-8');
      
      // Validate the temp file is valid JSON
      if (!this.isValidJSON(stateJsonWithChecksum)) {
        throw new Error('Generated invalid JSON');
      }

      // Verify checksum in temp file
      const tmpContent = fs.readFileSync(tmpFilePath, 'utf-8');
      const tmpParsed = JSON.parse(tmpContent) as ExecutionState;
      if (tmpParsed._checksum !== checksum) {
        throw new Error('Checksum mismatch in temp file');
      }

      // Atomic rename (this is the actual commit point)
      getFileSystem().renameSync(tmpFilePath, this.stateFilePath);
      
      console.log(`[StatePersistence] State saved to ${this.stateFilePath} (checksum: ${checksum.substring(0, 16)}...)`);
    } catch (error) {
      console.error('[StatePersistence] Failed to save state:', error instanceof Error ? error.message : error);
      
      // Clean up temp file if it exists
      const tmpFilePath = this.stateFilePath + '.tmp';
      if (fs.existsSync(tmpFilePath)) {
        try {
          getFileSystem().unlinkSync(tmpFilePath);
        } catch {
          // Ignore cleanup error
        }
      }
      
      // Don't throw - state save failure should not halt execution
    }
  }

  /**
   * Loads execution state from disk
   *
   * This method reads the saved state file if it exists.
   * Returns null if no state file exists or if validation fails.
   *
   * ACID Properties:
   * - Validates checksum on load
   * - Attempts to restore from backup if checksum mismatch or truncation
   *
   * @returns Promise<ExecutionState | null> - Restored state or null
   *
   * @example
   * ```typescript
   * const state = await persistence.loadState();
   * if (state) {
   *   console.log(`Resuming from phase ${state.currentPhase}`);
   * } else {
   *   console.log('No saved state found, starting fresh');
   * }
   * ```
   */
  async loadState(): Promise<ExecutionState | null> {
    try {
      if (!fs.existsSync(this.stateFilePath)) {
        return null;
      }

      const stateJson = fs.readFileSync(this.stateFilePath, 'utf-8');
      
      // Check if file might be truncated (invalid JSON)
      try {
        const state = JSON.parse(stateJson) as ExecutionState;
        
        // Validate checksum if present
        if (state._checksum) {
          const checksumWithout = stateJson.replace(/"_checksum":\s*"[^"]+"/, '');
          const calculatedChecksum = this.generateChecksum(checksumWithout);
          
          if (calculatedChecksum !== state._checksum) {
            console.warn('[StatePersistence] Checksum mismatch, attempting to restore from backup');
            const restored = await this.restoreFromBackup();
            
            if (restored) {
              console.log(`[StatePersistence] Restored from backup: phase ${restored.currentPhase}/${restored.totalPhases}`);
              console.log(`[StatePersistence] Files processed: ${restored.files.filter(f => f.processed).length}/${restored.files.length}`);
              console.log(`[StatePersistence] Total findings: ${restored.totalFindings}`);
              return restored;
            } else {
              console.error('[StatePersistence] All backups corrupted, starting fresh');
              return null;
            }
          }
        }

        console.log(`[StatePersistence] State loaded from ${this.stateFilePath}`);
        console.log(`[StatePersistence] Resuming from phase ${state.currentPhase}/${state.totalPhases}`);
        console.log(`[StatePersistence] Files processed: ${state.files.filter(f => f.processed).length}/${state.files.length}`);
        console.log(`[StatePersistence] Total findings: ${state.totalFindings}`);
        
        return state;
      } catch {
        // File might be truncated or corrupted
        console.warn('[StatePersistence] State file appears corrupted or truncated, attempting to restore from backup');
        const restored = await this.restoreFromBackup();
        
        if (restored) {
          console.log(`[StatePersistence] Restored from backup: phase ${restored.currentPhase}/${restored.totalPhases}`);
          console.log(`[StatePersistence] Files processed: ${restored.files.filter(f => f.processed).length}/${restored.files.length}`);
          console.log(`[StatePersistence] Total findings: ${restored.totalFindings}`);
          return restored;
        } else {
          console.error('[StatePersistence] No valid backup found, starting fresh');
          return null;
        }
      }
    } catch (error) {
      console.error('[StatePersistence] Failed to load state:', error instanceof Error ? error.message : error);
      
      // Attempt to restore from backup as last resort
      const restored = await this.restoreFromBackup();
      if (restored) {
        console.log(`[StatePersistence] Restored from backup after error: phase ${restored.currentPhase}/${restored.totalPhases}`);
        return restored;
      }
      
      return null;
    }
  }

  /**
   * Checks if a saved state exists
   *
   * @returns boolean - Whether state file exists
   */
  hasState(): boolean {
    return fs.existsSync(this.stateFilePath);
  }

  /**
   * Deletes saved state
   *
   * Call this after successful completion to clean up.
   *
   * @returns Promise<void>
   */
  async clearState(): Promise<void> {
    try {
      if (fs.existsSync(this.stateFilePath)) {
        getFileSystem().unlinkSync(this.stateFilePath);
        console.log(`[StatePersistence] State cleared from ${this.stateFilePath}`);
      }
    } catch (error) {
      console.error('[StatePersistence] Failed to clear state:', error instanceof Error ? error.message : error);
    }
  }

  /**
   * Records file processing progress
   *
   * Call this after processing each file. Automatically saves state
   * every N files (configurable via saveInterval).
   *
   * @param filePath - Path to processed file
   * @param processed - Whether processing succeeded
   * @param error - Error message if processing failed
   * @param currentState - Current execution state
   * @returns Promise<void>
   *
   * @example
   * ```typescript
   * await persistence.recordFile('/path/to/file.ts', true, undefined, currentState);
   * ```
   */
  async recordFile(
    filePath: string,
    processed: boolean,
    error: string | undefined,
    currentState: ExecutionState
  ): Promise<void> {
    const fileState: FileState = {
      filePath,
      processed,
      timestamp: new Date().toISOString(),
      error,
    };

    // Update or add file state
    const existingIndex = currentState.files.findIndex(f => f.filePath === filePath);
    if (existingIndex >= 0) {
      currentState.files[existingIndex] = fileState;
    } else {
      currentState.files.push(fileState);
    }

    this.fileCount++;

    // Save state every N files
    if (this.fileCount % this.saveInterval === 0) {
      await this.saveState(currentState);
    }
  }

  /**
   * Records phase completion
   *
   * Call this after completing each phase.
   *
   * @param phaseNumber - Phase number
   * @param phaseName - Phase name
   * @param completed - Whether phase completed successfully
   * @param findingsCount - Number of findings from this phase
   * @param executionTimeMs - Execution time in milliseconds
   * @param currentState - Current execution state
   * @returns Promise<void>
   *
   * @example
   * ```typescript
   * await persistence.recordPhase(2, 'Business Logic', true, 15, 5000, currentState);
   * ```
   */
  async recordPhase(
    phaseNumber: number,
    phaseName: string,
    completed: boolean,
    findingsCount: number,
    executionTimeMs: number,
    currentState: ExecutionState
  ): Promise<void> {
    const phaseState: PhaseState = {
      phase: phaseNumber,
      phaseName,
      completed,
      findingsCount,
      executionTimeMs,
    };

    // Update or add phase state
    const existingIndex = currentState.phases.findIndex(p => p.phase === phaseNumber);
    if (existingIndex >= 0) {
      currentState.phases[existingIndex] = phaseState;
    } else {
      currentState.phases.push(phaseState);
    }

    // Update current phase
    currentState.currentPhase = phaseNumber;

    // Save state after each phase
    await this.saveState(currentState);
  }

  /**
   * Records thermal event
   *
   * Call this to log thermal events for debugging and analysis.
   *
   * @param gpuTemp - GPU temperature in Celsius (if available)
   * @param cpuUsage - CPU usage percentage
   * @param ramUsage - RAM usage percentage
   * @param event - Event type
   * @param message - Optional message
   * @param currentState - Current execution state
   * @returns Promise<void>
   *
   * @example
   * ```typescript
   * await persistence.recordThermalEvent(65, 45, 60, 'warning', 'Temperature elevated', currentState);
   * ```
   */
  async recordThermalEvent(
    gpuTemp: number | undefined,
    cpuUsage: number,
    ramUsage: number,
    event: 'check' | 'cooldown' | 'critical' | 'warning',
    message: string | undefined,
    currentState: ExecutionState
  ): Promise<void> {
    const logEntry: ThermalLogEntry = {
      timestamp: new Date().toISOString(),
      gpuTemp,
      cpuUsage,
      ramUsage,
      event,
      message,
    };

    currentState.thermalLogs.push(logEntry);

    // Keep only last 1000 thermal logs to prevent file bloat
    if (currentState.thermalLogs.length > 1000) {
      currentState.thermalLogs = currentState.thermalLogs.slice(-1000);
    }
  }

  /**
   * Marks execution as interrupted
   *
   * Call this when handling SIGINT or thermal shutdown.
   *
   * @param reason - Reason for interruption
   * @param currentState - Current execution state
   * @returns Promise<void>
   *
   * @example
   * ```typescript
   * await persistence.markInterrupted('SIGINT received', currentState);
   * ```
   */
  async markInterrupted(reason: string, currentState: ExecutionState): Promise<void> {
    currentState.interrupted = true;
    currentState.interruptionReason = reason;
    
    console.log(`[StatePersistence] Execution interrupted: ${reason}`);
    await this.saveState(currentState);
  }

  /**
   * Creates initial execution state
   *
   * Call this at the start of execution to initialize state.
   *
   * @param totalPhases - Total number of phases
   * @returns ExecutionState - Initial state
   *
   * @example
   * ```typescript
   * const initialState = persistence.createInitialState(20);
   * ```
   */
  createInitialState(totalPhases: number): ExecutionState {
    return {
      projectRoot: this.projectRoot,
      currentPhase: 0,
      totalPhases,
      phases: [],
      files: [],
      thermalLogs: [],
      totalFindings: 0,
      startTime: new Date().toISOString(),
      lastSaveTime: new Date().toISOString(),
      interrupted: false,
    };
  }

  /**
   * Sets the save interval (number of files between saves)
   *
   * @param interval - Save interval in files
   */
  setSaveInterval(interval: number): void {
    this.saveInterval = interval;
  }

  /**
   * Stores analysis results for a specific phase
   *
   * @param phase - Phase number
   * @param results - Analysis results object
   * @param currentState - Current execution state
   * @returns Promise<void>
   *
   * @example
   * ```typescript
   * await persistence.storeAnalysisResults(1, { fileScores: [...], totalFindings: 42 }, currentState);
   * ```
   */
  async storeAnalysisResults(phase: number, results: unknown, currentState: ExecutionState): Promise<void> {
    if (!currentState.analysisResults) {
      currentState.analysisResults = {};
    }
    currentState.analysisResults[`phase${phase}`] = results;
    await this.saveState(currentState);
  }

  /**
   * Retrieves analysis results for a specific phase
   *
   * @param phase - Phase number
   * @param currentState - Current execution state
   * @returns Analysis results or null
   *
   * @example
   * ```typescript
   * const results = await persistence.getAnalysisResults(1, currentState);
   * if (results) {
   *   console.log('Phase 1 results:', results);
   * }
   * ```
   */
  getAnalysisResults(phase: number, currentState: ExecutionState): unknown | null {
    if (!currentState.analysisResults) {
      return null;
    }
    return currentState.analysisResults[`phase${phase}`] || null;
  }

  /**
   * Stores file hash cache for Phase 1
   *
   * @param filePath - File path
   * @param hash - SHA-1 hash of file content
   * @param score - Quality score
   * @param currentState - Current execution state
   * @returns Promise<void>
   */
  async storeFileHash(filePath: string, hash: string, score: number, currentState: ExecutionState): Promise<void> {
    if (!currentState.analysisResults) {
      currentState.analysisResults = {};
    }
    if (!currentState.analysisResults.fileHashCache) {
      currentState.analysisResults.fileHashCache = {};
    }
    currentState.analysisResults.fileHashCache[filePath] = { hash, score, timestamp: new Date().toISOString() };
  }

  /**
   * Gets file hash from cache
   *
   * @param filePath - File path
   * @param currentState - Current execution state
   * @returns File hash info or null
   */
  getFileHash(filePath: string, currentState: ExecutionState): { hash: string; score: number; timestamp: string } | null {
    if (!currentState.analysisResults || !currentState.analysisResults.fileHashCache) {
      return null;
    }
    return currentState.analysisResults.fileHashCache[filePath] || null;
  }
}

