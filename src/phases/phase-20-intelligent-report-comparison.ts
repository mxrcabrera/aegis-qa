/**
 * Phase 20: Intelligent Report Comparison
 *
 * Purpose: Executive summary of Aegis QA.
 *
 * Architecture:
 * - Diff-Based Report: Compare previous qa-report.md with current
 * - Success Metrics (ROI): Calculate remediation time saved (15 min per fix)
 * - Regression Warning: Detect if FIXED errors reappear
 * - Hardware Guard (Final Log): Generate Thermal Profile and save to .aegis/logs/performance.json
 *
 * @module phases/phase-20-intelligent-report-comparison
 * @since 2.0.0
 */

import * as fs from 'fs';
import * as path from 'path';
import { ThermalController } from '../core/thermal-controller.js';
import { StatePersistence, type ExecutionState } from '../core/state-persistence.js';

/**
 * Severity comparison
 */
interface SeverityComparison {
  /** Critical changes */
  critical: number;
  /** High changes */
  high: number;
  /** Medium changes */
  medium: number;
  /** Low changes */
  low: number;
}

/**
 * Success metrics
 */
interface SuccessMetrics {
  /** Fixes applied successfully */
  fixesApplied: number;
  /** Time saved per fix (minutes) */
  timePerFix: number;
  /** Total time saved (minutes) */
  totalTimeSavedMinutes: number;
  /** Total time saved (hours) */
  totalTimeSavedHours: number;
  /** Complex fixes (30 min each) */
  fixesComplex: number;
  /** Simple fixes (5 min each) */
  fixesSimple: number;
  /** Standard fixes (15 min each) */
  fixesStandard: number;
}

/**
 * Regression warning
 */
interface RegressionWarning {
  /** Regression ID */
  id: string;
  /** File path */
  filePath: string;
  /** Error type */
  errorType: string;
  /** Previous status */
  previousStatus: 'FIXED';
  /** Current status */
  currentStatus: 'FOUND';
  /** Description */
  description: string;
}

/**
 * Thermal profile
 */
interface ThermalProfile {
  /** Session timestamp */
  timestamp: string;
  /** Cooldown activations */
  cooldownActivations: number;
  /** Average RAM consumption */
  averageRamUsage: number;
  /** Peak CPU usage */
  peakCpuUsage: number;
  /** Total execution time (ms) */
  totalExecutionTimeMs: number;
  /** Thermal events */
  thermalEvents: string[];
  /** Recommendation */
  recommendation?: string;
}

/**
 * Phase 20 configuration
 */
interface Phase20Config {
  /** Project root directory */
  projectRoot: string;
  /** Thermal controller for hardware protection */
  thermalController: ThermalController;
  /** State persistence for resume capability */
  statePersistence: StatePersistence;
  /** Current execution state */
  currentState: ExecutionState;
}

/**
 * Phase 20 result
 */
export interface Phase20Result {
  /** Overall success */
  success: boolean;
  /** Severity comparison */
  severityComparison: SeverityComparison;
  /** Success metrics */
  successMetrics: SuccessMetrics;
  /** Regression warnings */
  regressionWarnings: RegressionWarning[];
  /** Thermal profile */
  thermalProfile: ThermalProfile;
  /** Execution time in milliseconds */
  executionTimeMs: number;
  /** Error if failed */
  error?: string;
}

/**
 * Phase 20: Intelligent Report Comparison
 *
 * This phase generates the executive summary of Aegis QA.
 *
 * @class Phase20IntelligentReportComparison
 */
export class Phase20IntelligentReportComparison {
  private config: Phase20Config;
  private thermalEvents: string[] = [];
  private cooldownCount: number = 0;
  private cpuReadings: number[] = [];
  private ramReadings: number[] = [];
  private startTime: number = 0;

  constructor(config: Phase20Config) {
    this.config = config;
  }

  /**
   * Executes Phase 20: Intelligent Report Comparison
   *
   * @returns Promise<Phase20Result> - Intelligent report comparison result
   */
  async execute(): Promise<Phase20Result> {
    this.startTime = Date.now();
    console.log('INFO Phase 20: Intelligent Report Comparison\n');

    try {
      // Track thermal events during execution
      this.trackThermalEvents();

      // Step 1: Diff-Based Report (PUNTO 1)
      const severityComparison = await this.performDiffBasedReport();

      // Step 2: Success Metrics ROI (PUNTO 2)
      const successMetrics = this.calculateSuccessMetrics();

      // Step 3: Regression Warning (PUNTO 3)
      const regressionWarnings = await this.detectRegressions();

      // Step 4: Hardware Guard (Final Log) (PUNTO 4)
      const thermalProfile = await this.generateThermalProfile();

      // Step 5: Historical Drift Detection (PUNTO 3)
      const driftAlert = await this.detectHistoricalDrift();
      if (driftAlert) {
        console.log(`ALERT ${driftAlert}`);
      }

      // Step 6: Self-Destruct Secure Mode (PUNTO 4)
      await this.selfDestructSecureMode();

      // Store Phase 20 results in StatePersistence
      const phase20Result: Phase20Result = {
        success: true,
        severityComparison,
        successMetrics,
        regressionWarnings,
        thermalProfile,
        executionTimeMs: Date.now() - this.startTime,
      };

      await this.config.statePersistence.storeAnalysisResults(20, phase20Result, this.config.currentState);

      console.log(`\nSUCCESS Phase 20 Complete`);
      console.log(`INFO Critical changes: ${severityComparison.critical}`);
      console.log(`INFO High changes: ${severityComparison.high}`);
      console.log(`INFO Medium changes: ${severityComparison.medium}`);
      console.log(`INFO Low changes: ${severityComparison.low}`);
      console.log(`INFO Fixes applied: ${successMetrics.fixesApplied}`);
      console.log(`INFO Time saved: ${successMetrics.totalTimeSavedHours.toFixed(2)} hours`);
      console.log(`INFO Regressions detected: ${regressionWarnings.length}`);
      console.log(`INFO Cooldown activations: ${thermalProfile.cooldownActivations}`);
      console.log(`INFO Peak CPU: ${thermalProfile.peakCpuUsage}%`);
      console.log(`INFO Average RAM: ${thermalProfile.averageRamUsage}%\n`);

      return phase20Result;
    } catch {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`ERROR Phase 20 failed: ${errorMessage}\n`);

      return {
        success: false,
        severityComparison: { critical: 0, high: 0, medium: 0, low: 0 },
        successMetrics: { fixesApplied: 0, timePerFix: 15, totalTimeSavedMinutes: 0, totalTimeSavedHours: 0, fixesComplex: 0, fixesSimple: 0, fixesStandard: 0 },
        regressionWarnings: [],
        thermalProfile: {
          timestamp: new Date().toISOString(),
          cooldownActivations: 0,
          averageRamUsage: 0,
          peakCpuUsage: 0,
          totalExecutionTimeMs: 0,
          thermalEvents: [],
        },
        executionTimeMs: Date.now() - this.startTime,
        error: errorMessage,
      };
    }
  }

  /**
   * Performs Diff-Based Report (PUNTO 1)
   *
   * @private
   * @returns Promise<SeverityComparison> - Severity comparison
   */
  private async performDiffBasedReport(): Promise<SeverityComparison> {
    console.log('INFO Performing Diff-Based Report...');
    const comparison: SeverityComparison = { critical: 0, high: 0, medium: 0, low: 0 };

    try {
      const reportPath = path.join(this.config.projectRoot, 'qa-report.md');
      
      if (!fs.existsSync(reportPath)) {
        console.log('INFO No previous qa-report.md found. Skipping comparison.');
        return comparison;
      }

      const currentReport = fs.readFileSync(reportPath, 'utf-8');
      
      // Get previous report from StatePersistence if available
      const previousReport = this.getPreviousReport();
      
      if (!previousReport) {
        console.log('INFO No previous report in StatePersistence. Skipping comparison.');
        return comparison;
      }

      // Compare severity counts
      const currentSeverity = this.extractSeverityCounts(currentReport);
      const previousSeverity = this.extractSeverityCounts(previousReport);

      comparison.critical = currentSeverity.critical - previousSeverity.critical;
      comparison.high = currentSeverity.high - previousSeverity.high;
      comparison.medium = currentSeverity.medium - previousSeverity.medium;
      comparison.low = currentSeverity.low - previousSeverity.low;

      console.log(`INFO Severity comparison: Critical ${comparison.critical}, High ${comparison.high}, Medium ${comparison.medium}, Low ${comparison.low}`);
    } catch {
      console.warn('WARNING Failed to perform diff-based report:', error instanceof Error ? error.message : error);
    }

    return comparison;
  }

  /**
   * Gets previous report from StatePersistence
   *
   * @private
   * @returns string | null - Previous report content
   */
  private getPreviousReport(): string | null {
    // In real implementation, would retrieve from StatePersistence
    // For now, return null
    return null;
  }

  /**
   * Extracts severity counts from report
   *
   * @private
   * @param report - Report content
   * @returns SeverityComparison - Severity counts
   */
  private extractSeverityCounts(report: string): SeverityComparison {
    const counts = { critical: 0, high: 0, medium: 0, low: 0 };

    const lines = report.split('\n');
    for (const line of lines) {
      if (line.toLowerCase().includes('critical')) counts.critical++;
      if (line.toLowerCase().includes('high')) counts.high++;
      if (line.toLowerCase().includes('medium')) counts.medium++;
      if (line.toLowerCase().includes('low')) counts.low++;
    }

    return counts;
  }

  /**
   * Calculates Success Metrics ROI with Sensitivity Adjustment (PUNTO 1)
   *
   * PUNTO 1: ROI Sensitivity Adjustment
   * 
   * LÓGICA DE ROI AJUSTADO:
   * - No todos los fixes valen 15 minutos
   * - Si fix fue en archivo con Blast Radius >10 o Core Path, subir ahorro a 30 minutos
   * - Si fue fix de estilo simple, bajar a 5 minutos
   * - Refinar cálculo del ROI para que sea más realista
   * - Esto diferencia el valor de un fix en el corazón del sistema vs uno periférico
   * 
   * @private
   * @returns SuccessMetrics - Success metrics
   */
  private calculateSuccessMetrics(): SuccessMetrics {
    console.log('INFO Calculating Success Metrics (ROI) with Sensitivity Adjustment...');

    // Get strategy details from Phase 16 to determine complexity
    const phase16Data = this.config.currentState.analysisResults?.['16'];
    
    let totalTimeSavedMinutes = 0;
    let fixesApplied = 0;
    let fixesComplex = 0;
    let fixesSimple = 0;
    let fixesStandard = 0;

    // Get strategy details from Phase 16 to determine complexity
    if (phase16Data && (phase16Data as unknown).strategiesByPhase) {
      for (const strategies of Object.values((phase16Data as unknown).strategiesByPhase)) {
        for (const strategy of strategies as unknown[]) {
          if ((strategy as unknown).applied) {
            fixesApplied++;

            // Determine fix complexity based on file characteristics
            const isComplex = (strategy as unknown).blastRadius > 10 || (strategy as unknown).isCorePath;
            const isSimple = (strategy as unknown).findingType === 'style' || (strategy as unknown).findingType === 'formatting';

            if (isComplex) {
              totalTimeSavedMinutes += 30; // 30 minutes for complex fixes (Core Path or high Blast Radius)
              fixesComplex++;
            } else if (isSimple) {
              totalTimeSavedMinutes += 5; // 5 minutes for simple style fixes
              fixesSimple++;
            } else {
              totalTimeSavedMinutes += 15; // 15 minutes for standard fixes
              fixesStandard++;
            }
          }
        }
      }
    }

    const totalTimeSavedHours = totalTimeSavedMinutes / 60;
    const averageTimePerFix = fixesApplied > 0 ? totalTimeSavedMinutes / fixesApplied : 15;

    const metrics: SuccessMetrics = {
      fixesApplied,
      timePerFix: averageTimePerFix,
      totalTimeSavedMinutes,
      totalTimeSavedHours,
      fixesComplex,
      fixesSimple,
      fixesStandard,
    };

    console.log(`INFO Success Metrics: ${fixesApplied} fixes applied (${fixesComplex} complex, ${fixesSimple} simple, ${fixesStandard} standard)`);
    console.log(`INFO Time saved: ${totalTimeSavedHours.toFixed(2)} hours (avg ${averageTimePerFix.toFixed(1)} min/fix)`);
    return metrics;
  }

  /**
   * Detects Regressions (PUNTO 3)
   *
   * @private
   * @returns Promise<RegressionWarning[]> - Regression warnings
   */
  private async detectRegressions(): Promise<RegressionWarning[]> {
    console.log('INFO Detecting Regressions...');
    const regressions: RegressionWarning[] = [];

    // Get current findings
    const currentFindings = this.getCurrentFindings();
    
    // Get previous findings from StatePersistence
    const previousFindings = this.getPreviousFindings();

    // Compare to detect regressions
    for (const previousFinding of previousFindings) {
      if ((previousFinding as unknown).status === 'FIXED') {
        const currentFinding = currentFindings.find(
          (f: unknown) => (f as unknown).filePath === (previousFinding as unknown).filePath && (f as unknown).type === (previousFinding as unknown).type
        );

        if (currentFinding && (currentFinding as unknown).status !== 'FIXED') {
          regressions.push({
            id: `regression-${Date.now()}`,
            filePath: (previousFinding as unknown).filePath,
            errorType: (previousFinding as unknown).type,
            previousStatus: 'FIXED',
            currentStatus: 'FOUND',
            description: `Error marked as FIXED in previous audit reappeared`,
          });
          console.log(`WARNING [REGRESION-CRÍTICA] ${(previousFinding as unknown).type} in ${(previousFinding as unknown).filePath}`);
        }
      }
    }

    console.log(`INFO Regressions detected: ${regressions.length}`);
    return regressions;
  }

  /**
   * Gets current findings
   *
   * @private
   * @returns any[] - Current findings
   */
  private getCurrentFindings(): unknown[] {
    const findings: unknown[] = [];

    // Aggregate findings from all phases
    const analysisResults = this.config.currentState.analysisResults || {};
    for (const [, phaseData] of Object.entries(analysisResults)) {
      if ((phaseData as unknown).findings) {
        findings.push(...(phaseData as unknown).findings);
      }
    }

    return findings;
  }

  /**
   * Gets previous findings from StatePersistence
   *
   * @private
   * @returns any[] - Previous findings
   */
  private getPreviousFindings(): unknown[] {
    // In real implementation, would retrieve from StatePersistence
    // For now, return empty array
    return [];
  }

  /**
   * Generates Thermal Profile with Insights (PUNTO 2)
   *
   * PUNTO 2: Thermal Stress Insights
   * 
   * LÓGICA DE THERMAL STRESS INSIGHTS:
   * - El performance.json no debe ser solo un log
   * - Debe incluir un consejo final
   * - Si el pico de CPU fue >90% durante más del 30% del tiempo, agregar recomendación
   * - Recomendación: 'Se recomienda aumentar el cooldown o reducir el batch size en este hardware'
   * 
   * @private
   * @returns Promise<ThermalProfile> - Thermal profile
   */
  private async generateThermalProfile(): Promise<ThermalProfile> {
    console.log('INFO Generating Thermal Profile with Insights...');

    const averageRamUsage = this.ramReadings.length > 0 
      ? this.ramReadings.reduce((a, b) => a + b, 0) / this.ramReadings.length 
      : 0;
    
    const peakCpuUsage = this.cpuReadings.length > 0 
      ? Math.max(...this.cpuReadings) 
      : 0;

    // Calculate percentage of time CPU was > 90%
    const highCpuReadings = this.cpuReadings.filter((reading) => reading > 90);
    const highCpuPercentage = this.cpuReadings.length > 0 
      ? (highCpuReadings.length / this.cpuReadings.length) * 100 
      : 0;

    // Generate recommendation based on thermal stress
    let recommendation: string | undefined;
    if (highCpuPercentage > 30) {
      recommendation = 'Se recomienda aumentar el cooldown o reducir el batch size en este hardware';
    } else if (peakCpuUsage > 85) {
      recommendation = 'Se recomienda monitorear el uso de CPU para evitar thermal throttling';
    }

    const profile: ThermalProfile = {
      timestamp: new Date().toISOString(),
      cooldownActivations: this.cooldownCount,
      averageRamUsage,
      peakCpuUsage,
      totalExecutionTimeMs: Date.now() - this.startTime,
      thermalEvents: [...this.thermalEvents],
      recommendation,
    };

    // Save to .aegis/logs/performance.json
    await this.saveThermalProfile(profile);

    console.log(`INFO Thermal Profile: Cooldowns ${profile.cooldownActivations}, Peak CPU ${profile.peakCpuUsage}%, Avg RAM ${profile.averageRamUsage.toFixed(2)}%`);
    if (recommendation) {
      console.log(`INFO Thermal Recommendation: ${recommendation}`);
    }
    
    return profile;
  }

  /**
   * Saves Thermal Profile to disk
   *
   * @private
   * @param profile - Thermal profile
   * @returns Promise<void>
   */
  private async saveThermalProfile(profile: ThermalProfile): Promise<void> {
    try {
      const logsDir = path.join(this.config.projectRoot, '.aegis', 'logs');
      if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir, { recursive: true });
      }

      const profilePath = path.join(logsDir, 'performance.json');
      fs.writeFileSync(profilePath, JSON.stringify(profile, null, 2), 'utf-8');
      console.log(`INFO Thermal Profile saved to ${profilePath}`);
    } catch {
      console.warn('WARNING Failed to save Thermal Profile:', error instanceof Error ? error.message : error);
    }
  }

  /**
   * Detects Historical Drift (PUNTO 3)
   *
   * PUNTO 3: Historical Drift Detection
   * 
   * LÓGICA DE HISTORICAL DRIFT DETECTION:
   * - Guardar historial de los últimos 5 reportes en .aegis/history/
   * - Si la tendencia de errores es alcista (cada vez hay más errores), disparar alerta
   * - Alerta: [TECHNICAL-DEBT-ALERT] en el resumen ejecutivo
   * 
   * @private
   * @returns Promise<string | null> - Drift alert or null
   */
  private async detectHistoricalDrift(): Promise<string | null> {
    console.log('INFO Detecting Historical Drift...');
    
    const historyDir = path.join(this.config.projectRoot, '.aegis', 'history');
    if (!fs.existsSync(historyDir)) {
      fs.mkdirSync(historyDir, { recursive: true });
      console.log('INFO No history found. Creating history directory.');
      return null;
    }

    // Get last 5 reports
    const historyFiles = fs.readdirSync(historyDir)
      .filter((file) => file.endsWith('.json'))
      .sort()
      .slice(-5);

    if (historyFiles.length < 2) {
      console.log('INFO Not enough history for drift detection (need at least 2 reports)');
      return null;
    }

    // Extract error counts from history
    const errorCounts: number[] = [];
    for (const historyFile of historyFiles) {
      try {
        const historyPath = path.join(historyDir, historyFile);
        const historyContent = fs.readFileSync(historyPath, 'utf-8');
        const historyData = JSON.parse(historyContent);
        
        // Get total errors from severity comparison
        const totalErrors = 
          (historyData.severityComparison?.critical || 0) +
          (historyData.severityComparison?.high || 0) +
          (historyData.severityComparison?.medium || 0);
        
        errorCounts.push(totalErrors);
      } catch {
        // Failed to read history file
      }
    }

    // Detect upward trend
    if (errorCounts.length >= 2) {
      const lastCount = errorCounts[errorCounts.length - 1];
      const previousCount = errorCounts[errorCounts.length - 2];
      
      if (lastCount > previousCount) {
        console.log('WARNING [TECHNICAL-DEBT-ALERT] Error trend is upward. Technical debt is increasing.');
        return '[TECHNICAL-DEBT-ALERT]';
      }
    }

    console.log('INFO No historical drift detected');
    return null;
  }

  /**
   * Self-Destruct Secure Mode (PUNTO 4)
   *
   * PUNTO 4: Self-Destruct Secure Mode
   * 
   * LÓGICA DE SELF-DESTRUCT SECURE MODE:
   * - Si durante la generación del reporte final Aegis detecta que qa-report.md contiene secreto
   * - Censurar automáticamente antes de escribirlo en disco
   * - Previene filtración accidental de API Keys, Tokens desde logs de las fases
   * 
   * @private
   * @returns Promise<void>
   */
  private async selfDestructSecureMode(): Promise<void> {
    console.log('INFO Running Self-Destruct Secure Mode...');

    const reportPath = path.join(this.config.projectRoot, 'qa-report.md');
    if (!fs.existsSync(reportPath)) {
      console.log('INFO No qa-report.md found. Skipping secure mode.');
      return;
    }

    try {
      let content = fs.readFileSync(reportPath, 'utf-8');
      const originalLength = content.length;

      // Secret patterns to detect and censor
      const secretPatterns = [
        { pattern: /sk-[a-zA-Z0-9]{20,}/gi, replacement: 'sk-****************' }, // Stripe API Key
        { pattern: /pk-[a-zA-Z0-9]{20,}/gi, replacement: 'pk-****************' }, // Stripe Publishable Key
        { pattern: /AKIA[0-9A-Z]{16}/gi, replacement: 'AKIA****************' }, // AWS Access Key
        { pattern: /Bearer\s+[a-zA-Z0-9]{20,}/gi, replacement: 'Bearer ****************' }, // Bearer Token
        { pattern: /api[_-]?key[\s:=]+["']?[a-zA-Z0-9]{20,}/gi, replacement: 'api_key=****************' }, // API Key
        { pattern: /secret[_-]?key[\s:=]+["']?[a-zA-Z0-9]{20,}/gi, replacement: 'secret_key=****************' }, // Secret Key
        { pattern: /password[\s:=]+["']?[a-zA-Z0-9]{8,}/gi, replacement: 'password=****************' }, // Password
        { pattern: /token[\s:=]+["']?[a-zA-Z0-9]{20,}/gi, replacement: 'token=****************' }, // Token
        { pattern: /mongodb:\/\/[a-zA-Z0-9:.-]+@[a-zA-Z0-9.-]+/gi, replacement: 'mongodb://****************' }, // MongoDB Connection String
        { pattern: /postgresql:\/\/[a-zA-Z0-9:.-]+@[a-zA-Z0-9.-]+/gi, replacement: 'postgresql://****************' }, // PostgreSQL Connection String
      ];

      for (const { pattern, replacement } of secretPatterns) {
        content = content.replace(pattern, replacement);
      }

      if (content.length !== originalLength) {
        console.log('WARNING Secrets detected and censored in qa-report.md');
        fs.writeFileSync(reportPath, content, 'utf-8');
      } else {
        console.log('INFO No secrets detected in qa-report.md');
      }
    } catch {
      console.warn('WARNING Failed to run Self-Destruct Secure Mode:', error instanceof Error ? error.message : error);
    }
  }

  /**
   * Tracks thermal events during execution
   *
   * @private
   * @returns void
   */
  private trackThermalEvents(): void {
    // In real implementation, would hook into thermal controller events
    // For now, just log initial state
    this.thermalEvents.push('Phase 20 started');
  }
}





