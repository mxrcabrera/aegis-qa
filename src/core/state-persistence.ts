/**
 * StatePersistence - Resume Capability and Progress Tracking
 *
 * Purpose: Save execution progress for resume capability, allowing Aegis QA to
 * continue from where it left off after interruption.
 *
 * Architecture: This component persists critical state information to disk,
 * enabling safe resumption of operations after crashes or manual interruptions.
 *
 * Stored Data:
 * - Last completed phase
 * - Files processed
 * - Thermal logs
 * - Current configuration
 * - Timestamp of last save
 *
 * @module core/state-persistence
 * @since 1.0.0
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

/**
 * Execution state snapshot
 */
export interface ExecutionState {
  /** Unique session ID */
  sessionId: string;
  /** Last completed phase number */
  lastCompletedPhase: number;
  /** Current phase being executed */
  currentPhase: number;
  /** Total number of phases */
  totalPhases: number;
  /** Files processed count */
  filesProcessed: number;
  /** Total files to process */
  totalFiles: number;
  /** Timestamp of session start */
  sessionStartTime: number;
  /** Timestamp of last save */
  lastSaveTime: number;
  /** Whether session is complete */
  isComplete: boolean;
  /** Analysis results from phases */
  analysisResults: Record<number, any>;
  /** Phase-specific state data */
  phaseState: Record<number, any>;
}

/**
 * Thermal log entry
 */
interface ThermalLogEntry {
  /** Timestamp of log entry */
  timestamp: number;
  /** Phase number when log was created */
  phaseNumber: number;
  /** CPU usage percentage */
  cpuUsage: number;
  /** RAM usage percentage */
  ramUsage: number;
  /** GPU temperature (if available) */
  gpuTemp?: number;
  /** Event type: 'check' | 'cooldown' | 'alert' */
  eventType: 'check' | 'cooldown' | 'alert';
  /** Additional context */
  context?: string;
}

/**
 * StatePersistence configuration
 */
interface StatePersistenceConfig {
  /** Directory for state storage */
  stateDir: string;
  /** Maximum number of thermal log entries to keep */
  maxThermalLogs: number;
  /** Auto-save interval in milliseconds */
  autoSaveIntervalMs: number;
}

/**
 * StatePersistence - Resume capability and progress tracking
 *
 * This class manages persistence of execution state, allowing Aegis QA to
 * resume operations after interruption. It stores progress, thermal logs,
 * and analysis results to disk.
 *
 * @class StatePersistence
 * @example
 * ```typescript
 * const persistence = new StatePersistence({ stateDir: '.aegis/state' });
 * await persistence.initialize();
 * const state = await persistence.loadState();
 * await persistence.savePhaseCompletion(5, { findings: [...] });
 * const thermalLogs = await persistence.getThermalLogs();
 * ```
 */
export class StatePersistence {
  private config: StatePersistenceConfig;
  private currentState: ExecutionState | null = null;
  private thermalLogs: ThermalLogEntry[] = [];
  private autoSaveInterval: NodeJS.Timeout | null = null;

  constructor(config?: Partial<StatePersistenceConfig>) {
    this.config = {
      stateDir: '.aegis/state',
      maxThermalLogs: 1000,
      autoSaveIntervalMs: 30000, // 30 seconds
      ...config,
    };
  }

  /**
   * Initializes state persistence system
   *
   * Creates necessary directories and loads existing state if available.
   *
   * @returns Promise<void>
   */
  async initialize(): Promise<void> {
    // Create state directory if it doesn't exist
    if (!fs.existsSync(this.config.stateDir)) {
      fs.mkdirSync(this.config.stateDir, { recursive: true });
    }

    // Load existing state if available
    const existingState = await this.loadState();
    if (existingState) {
      this.currentState = existingState;
      console.log(`[StatePersistence] Resumed session: ${existingState.sessionId}`);
    } else {
      // Create new session
      this.currentState = this.createInitialState();
      console.log(`[StatePersistence] Created new session: ${this.currentState.sessionId}`);
    }

    // Load thermal logs
    await this.loadThermalLogs();

    // Start auto-save
    this.startAutoSave();
  }

  /**
   * Creates a new initial state
   *
   * @private
   * @returns ExecutionState - New initial state
   */
  private createInitialState(): ExecutionState {
    return {
      sessionId: crypto.randomUUID(),
      lastCompletedPhase: -1,
      currentPhase: 0,
      totalPhases: 20,
      filesProcessed: 0,
      totalFiles: 0,
      sessionStartTime: Date.now(),
      lastSaveTime: Date.now(),
      isComplete: false,
      analysisResults: {},
      phaseState: {},
    };
  }

  /**
   * Loads execution state from disk
   *
   * @private
   * @returns Promise<ExecutionState | null> - Loaded state or null if not found
   */
  private async loadState(): Promise<ExecutionState | null> {
    try {
      const stateFilePath = this.getStateFilePath();
      if (!fs.existsSync(stateFilePath)) {
        return null;
      }

      const content = fs.readFileSync(stateFilePath, 'utf-8');
      const state = JSON.parse(content) as ExecutionState;
      return state;
    } catch (error) {
      console.warn('Failed to load state:', error instanceof Error ? error.message : error);
      return null;
    }
  }

  /**
   * Saves current execution state to disk
   *
   * @returns Promise<void>
   */
  async saveState(): Promise<void> {
    if (!this.currentState) {
      console.warn('No state to save');
      return;
    }

    try {
      this.currentState.lastSaveTime = Date.now();
      const stateFilePath = this.getStateFilePath();
      const content = JSON.stringify(this.currentState, null, 2);
      fs.writeFileSync(stateFilePath, content, 'utf-8');
      console.log(`[StatePersistence] State saved: Phase ${this.currentState.currentPhase}/${this.currentState.totalPhases}`);
    } catch (error) {
      console.error('Failed to save state:', error instanceof Error ? error.message : error);
    }
  }

  /**
   * Saves phase completion and stores analysis results
   *
   * @param phaseNumber - Phase number that was completed
   * @param results - Analysis results from the phase
   * @param phaseState - Optional phase-specific state data
   * @returns Promise<void>
   */
  async savePhaseCompletion(
    phaseNumber: number,
    results: any,
    phaseState?: any
  ): Promise<void> {
    if (!this.currentState) {
      console.warn('No current state to update');
      return;
    }

    this.currentState.lastCompletedPhase = phaseNumber;
    this.currentState.currentPhase = phaseNumber + 1;
    this.currentState.analysisResults[phaseNumber] = results;
    
    if (phaseState) {
      this.currentState.phaseState[phaseNumber] = phaseState;
    }

    if (this.currentState.currentPhase >= this.currentState.totalPhases) {
      this.currentState.isComplete = true;
    }

    await this.saveState();
  }

  /**
   * Stores analysis results for a phase
   *
   * @param phaseNumber - Phase number
   * @param results - Analysis results
   * @param state - Current execution state
   * @returns Promise<void>
   */
  async storeAnalysisResults(phaseNumber: number, results: any, state: ExecutionState): Promise<void> {
    if (!this.currentState) {
      this.currentState = state;
    }
    
    this.currentState.analysisResults[phaseNumber] = results;
    await this.saveState();
  }

  /**
   * Gets analysis results for a specific phase
   *
   * @param phaseNumber - Phase number
   * @param state - Current execution state
   * @returns any - Analysis results or undefined
   */
  getAnalysisResults(phaseNumber: number, state: ExecutionState): any {
    return state.analysisResults?.[phaseNumber];
  }

  /**
   * Updates file processing progress
   *
   * @param filesProcessed - Number of files processed
   * @param totalFiles - Total number of files to process
   * @returns Promise<void>
   */
  async updateFileProgress(filesProcessed: number, totalFiles: number): Promise<void> {
    if (!this.currentState) {
      return;
    }

    this.currentState.filesProcessed = filesProcessed;
    this.currentState.totalFiles = totalFiles;
    await this.saveState();
  }

  /**
   * Adds a thermal log entry
   *
   * @param entry - Thermal log entry to add
   * @returns Promise<void>
   */
  async addThermalLog(entry: ThermalLogEntry): Promise<void> {
    this.thermalLogs.push(entry);

    // Trim logs if exceeding max
    if (this.thermalLogs.length > this.config.maxThermalLogs) {
      this.thermalLogs = this.thermalLogs.slice(-this.config.maxThermalLogs);
    }

    await this.saveThermalLogs();
  }

  /**
   * Gets thermal logs
   *
   * @param limit - Maximum number of logs to return
   * @returns Promise<ThermalLogEntry[]> - Thermal log entries
   */
  async getThermalLogs(limit?: number): Promise<ThermalLogEntry[]> {
    if (limit) {
      return this.thermalLogs.slice(-limit);
    }
    return [...this.thermalLogs];
  }

  /**
   * Saves thermal logs to disk
   *
   * @private
   * @returns Promise<void>
   */
  private async saveThermalLogs(): Promise<void> {
    try {
      const logsFilePath = this.getThermalLogsFilePath();
      const content = JSON.stringify(this.thermalLogs, null, 2);
      fs.writeFileSync(logsFilePath, content, 'utf-8');
    } catch (error) {
      console.error('Failed to save thermal logs:', error instanceof Error ? error.message : error);
    }
  }

  /**
   * Loads thermal logs from disk
   *
   * @private
   * @returns Promise<void>
   */
  private async loadThermalLogs(): Promise<void> {
    try {
      const logsFilePath = this.getThermalLogsFilePath();
      if (!fs.existsSync(logsFilePath)) {
        return;
      }

      const content = fs.readFileSync(logsFilePath, 'utf-8');
      this.thermalLogs = JSON.parse(content) as ThermalLogEntry[];
      console.log(`[StatePersistence] Loaded ${this.thermalLogs.length} thermal log entries`);
    } catch (error) {
      console.warn('Failed to load thermal logs:', error instanceof Error ? error.message : error);
      this.thermalLogs = [];
    }
  }

  /**
   * Gets current execution state
   *
   * @returns ExecutionState | null - Current state or null
   */
  getCurrentState(): ExecutionState | null {
    return this.currentState;
  }

  /**
   * Checks if session can be resumed
   *
   * @returns boolean - True if session can be resumed
   */
  canResume(): boolean {
    return this.currentState !== null && !this.currentState.isComplete;
  }

  /**
   * Resets the current session (starts fresh)
   *
   * @returns Promise<void>
   */
  async resetSession(): Promise<void> {
    this.currentState = this.createInitialState();
    this.thermalLogs = [];
    await this.saveState();
    await this.saveThermalLogs();
    console.log('[StatePersistence] Session reset');
  }

  /**
   * Cleans up resources and stops auto-save
   *
   * @returns Promise<void>
   */
  async cleanup(): Promise<void> {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
      this.autoSaveInterval = null;
    }

    // Final save
    await this.saveState();
    await this.saveThermalLogs();
  }

  /**
   * Starts auto-save interval
   *
   * @private
   */
  private startAutoSave(): void {
    this.autoSaveInterval = setInterval(async () => {
      await this.saveState();
    }, this.config.autoSaveIntervalMs);
  }

  /**
   * Gets the state file path
   *
   * @private
   * @returns string - Path to state file
   */
  private getStateFilePath(): string {
    return path.join(this.config.stateDir, 'execution-state.json');
  }

  /**
   * Gets the thermal logs file path
   *
   * @private
   * @returns string - Path to thermal logs file
   */
  private getThermalLogsFilePath(): string {
    return path.join(this.config.stateDir, 'thermal-logs.json');
  }

  /**
   * Gets current configuration
   *
   * @returns StatePersistenceConfig - Current configuration
   */
  getConfig(): StatePersistenceConfig {
    return { ...this.config };
  }

  /**
   * Updates configuration
   *
   * @param config - Partial configuration to update
   */
  updateConfig(config: Partial<StatePersistenceConfig>): void {
    this.config = {
      ...this.config,
      ...config,
    };
  }
}
