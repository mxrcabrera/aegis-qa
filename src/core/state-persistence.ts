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
  /** High risk blocker flag - if true, commits should be blocked */
  highRiskBlocker?: boolean;
}

/**
 * State persistence configuration
 */
interface StatePersistenceConfig {
  /** Project root directory */
  projectRoot: string;
  /** State file path */
  stateFilePath?: string;
}

/**
 * State Persistence - Black Box for Progress Tracking
 *
 * Saves and restores execution state to enable resume capability after interruptions.
 *
 * @class StatePersistence
 */
export class StatePersistence {
  private config: StatePersistenceConfig;
  private stateFilePath: string;

  constructor(config: StatePersistenceConfig) {
    this.config = config;
    this.stateFilePath = config.stateFilePath || path.join(config.projectRoot, '.sentinel', 'state.json');
  }

  /**
   * Loads execution state from disk
   *
   * @returns Promise<ExecutionState | null> - Loaded state or null if not found
   */
  async loadState(): Promise<ExecutionState | null> {
    try {
      if (!fs.existsSync(this.stateFilePath)) {
        return null;
      }

      const content = fs.readFileSync(this.stateFilePath, 'utf-8');
      const state = JSON.parse(content) as ExecutionState;

      return state;
    } catch (error) {
      console.warn('Failed to load state:', error instanceof Error ? error.message : error);
      return null;
    }
  }

  /**
   * Saves execution state to disk
   *
   * @param state - Execution state to save
   * @returns Promise<void>
   */
  async saveState(state: ExecutionState): Promise<void> {
    try {
      const stateDir = path.dirname(this.stateFilePath);
      
      if (!fs.existsSync(stateDir)) {
        fs.mkdirSync(stateDir, { recursive: true });
      }

      state.lastSaveTime = new Date().toISOString();
      const content = JSON.stringify(state, null, 2);
      
      fs.writeFileSync(this.stateFilePath, content, 'utf-8');
    } catch (error) {
      console.error('Failed to save state:', error instanceof Error ? error.message : error);
    }
  }

  /**
   * Creates a new initial execution state
   *
   * @param totalPhases - Total number of phases
   * @returns ExecutionState - New execution state
   */
  createInitialState(totalPhases: number): ExecutionState {
    return {
      projectRoot: this.config.projectRoot,
      currentPhase: 0,
      totalPhases,
      phases: [],
      files: [],
      thermalLogs: [],
      totalFindings: 0,
      startTime: new Date().toISOString(),
      lastSaveTime: new Date().toISOString(),
      interrupted: false,
      analysisResults: {},
      highRiskBlocker: false,
    };
  }

  /**
   * Stores analysis results for a specific phase
   *
   * @param phase - Phase number
   * @param results - Analysis results
   * @param currentState - Current execution state
   * @returns Promise<void>
   */
  async storeAnalysisResults(phase: number, results: any, currentState: ExecutionState): Promise<void> {
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
   */
  getAnalysisResults(phase: number, currentState: ExecutionState): any | null {
    if (!currentState.analysisResults) {
      return null;
    }
    return currentState.analysisResults[`phase${phase}`] || null;
  }

  /**
   * Clears the state file
   *
   * @returns Promise<void>
   */
  async clearState(): Promise<void> {
    try {
      if (fs.existsSync(this.stateFilePath)) {
        fs.unlinkSync(this.stateFilePath);
      }
    } catch (error) {
      console.error('Failed to clear state:', error instanceof Error ? error.message : error);
    }
  }
}
