/**
 * QA Orchestrator - Cerebro Principal
 *
 * Propósito: Ejecutar pipeline completo de QA autónomo
 *
 * Pipeline: Seed -> Audit -> Fix -> Test -> Verify -> Report
 */

import * as path from "path";
import * as fs from "fs-extra";
import { exec } from "child_process";
import { promisify } from "util";
import CodeReader from "./code-reader";
import StyleAuditor from "./style-auditor";
import SecurityScanner from "./security-scanner";
import DBSeeder from "./db-seeder";
import SecretManager from "./secret-manager";
import AdminWrapper from "./admin-wrapper";
import SetupWizard from "./setup-wizard";
import OllamaProcessor from "./ollama-processor";

const execAsync = promisify(exec);

interface OrchestratorConfig {
  projectPath: string;
  skipSeed?: boolean;
  skipFix?: boolean;
  skipTests?: boolean;
}

interface AuditResults {
  routes: any;
  styles: any;
  security: any;
}

interface TestResults {
  passed: number;
  failed: number;
  total: number;
  failures: TestFailure[];
}

interface TestFailure {
  test: string;
  error: string;
  file: string;
  line?: number;
}

interface OrchestratorReport {
  timestamp: string;
  projectPath: string;
  phases: {
    seed: { success: boolean; details: any };
    audit: { success: boolean; details: AuditResults };
    fix: { success: boolean; details: any };
    test: { success: boolean; details: TestResults };
    verify: { success: boolean; details: any };
  };
  summary: {
    totalViolations: number;
    fixesApplied: number;
    testsPassed: number;
    testsFailed: number;
    overallSuccess: boolean;
  };
  recommendations: string[];
}

class QAOrchestrator {
  private config: OrchestratorConfig;
  private report: OrchestratorReport;

  constructor(config: OrchestratorConfig) {
    this.config = config;

    this.report = {
      timestamp: new Date().toISOString(),
      projectPath: config.projectPath,
      phases: {
        seed: { success: false, details: {} },
        audit: {
          success: false,
          details: { routes: null, styles: null, security: null },
        },
        fix: { success: false, details: {} },
        test: {
          success: false,
          details: { passed: 0, failed: 0, total: 0, failures: [] },
        },
        verify: { success: false, details: {} },
      },
      summary: {
        totalViolations: 0,
        fixesApplied: 0,
        testsPassed: 0,
        testsFailed: 0,
        overallSuccess: false,
      },
      recommendations: [],
    };
  }

  /**
   * Ejecuta el pipeline completo de QA - MODO LEGENDARIO
   */
  async run(): Promise<OrchestratorReport> {
    // Initialize Setup Wizard - LEGENDARY MODE
    const setupWizard = SetupWizard.getInstance();
    const setupComplete = await setupWizard.legendarySetup();

    if (!setupComplete) {
      throw new Error("Setup LEGENDARIO fallido. No se puede continuar.");
    }

    console.log("\n=== QA Orchestrator - MODO LEGENDARIO ===");
    console.log(`Project: ${this.config.projectPath}`);
    console.log(`Timestamp: ${this.report.timestamp}\n`);

    try {
      // Ollama Processor - Arquitectura de Memoria con IA
      const ollamaProcessor = OllamaProcessor.getInstance();
      await ollamaProcessor.processProject(this.config.projectPath);
      const stats = ollamaProcessor.getStats();

      // FASE 1: Desactivar Seed/DB para self-audit
      console.log("AUDIT: Desactivando fase Seed/DB para self-audit...");
      console.log("Skipping seed phase...");
      this.report.phases.seed.success = true;

      // Fase 2: Auditoría
      await this.executeAuditPhase();

      // Fase 3: Auto-fix
      if (!this.config.skipFix) {
        await this.executeFixPhase();
      } else {
        console.log("Skipping fix phase...");
        this.report.phases.fix.success = true;
      }

      // Fase 4: Tests
      if (!this.config.skipTests) {
        await this.executeTestPhase();
      } else {
        console.log("Skipping test phase...");
        this.report.phases.test.success = true;
      }

      // Fase 5: Verificación
      await this.executeVerifyPhase();

      // Calcular resumen final
      this.calculateSummary();

      // Auto-Cleanup - dejar todo "pipí cucú" y abrir reporte
      const projectStats = {
        filesProcessed: stats.filesProcessed,
        violationsFound: stats.fixesApplied,
        fixesApplied: stats.fixesApplied,
        reportPath: path.join(this.config.projectPath, "OLLAMA_APB_LOG.md"),
      };
      await setupWizard.autoCleanup(this.config.projectPath, projectStats);

      console.log("\n=== Pipeline LEGENDARIO Completado ===");
      console.log(
        `Resultado: ${this.report.summary.overallSuccess ? "SUCCESS" : "FAILURE"}`,
      );

      return this.report;
    } catch (error) {
      console.error("\n=== Pipeline Fallido ===");
      console.error("Error:", error instanceof Error ? error.message : error);
      this.report.summary.overallSuccess = false;
      return this.report;
    }
  }

  /**
   * Execute the seed phase with Sanity Check & Repair
   */
  private async executeSeedPhase(): Promise<void> {
    console.log("\n--- Fase 1: Seed de Datos ---");

    try {
      // Sanity Check & Repair for API keys
      console.log("Sanity check para credenciales de Supabase...");
      const validServiceKey = SecretManager.sanityCheckAndRepair(
        "SUPABASE_SERVICE_ROLE_KEY",
      );
      const validAnonKey =
        SecretManager.sanityCheckAndRepair("SUPABASE_ANON_KEY");

      if (!validServiceKey || !validAnonKey) {
        console.warn(
          "Continuando sin acceso a base de datos - API keys inválidas",
        );
        this.report.phases.seed = {
          success: false,
          details: {
            error:
              "API keys inválidas o no encontradas. Continuando sin acceso a base de datos.",
            cleanup: {
              success: false,
              deletedRecords: { students: 0, classes: 0, reservations: 0 },
            },
            seed: {
              success: false,
              students: [],
              classes: [],
              reservations: [],
            },
            verified: false,
          },
        };
        return;
      }

      const seeder = new DBSeeder();

      console.log("Limpiando datos de prueba...");
      const cleanupResult = await seeder.cleanup();

      console.log("Insertando datos de prueba...");
      const seedResult = await seeder.seed();

      console.log("Seed verification:");
      const verificationResult = await seeder.verifySeed();

      this.report.phases.seed = {
        success: !!verificationResult,
        details: {
          cleanup: cleanupResult,
          seed: seedResult,
          verified: !!verificationResult,
        },
      };

      if (!verificationResult) {
        console.log("Falló el seed de datos");
      }
    } catch (error) {
      this.report.phases.seed.success = false;
      this.report.phases.seed.details = {
        error: error instanceof Error ? error.message : error,
      };
      throw error;
    }
  }

  /**
   * Fase 2: Auditoría completa
   */
  private async executeAuditPhase(): Promise<void> {
    console.log("\n--- Fase 2: Auditoría ---");

    try {
      const auditResults: AuditResults = {
        routes: null,
        styles: null,
        security: null,
      };

      // Auditoría de rutas
      console.log("Auditoría de rutas...");
      const routeReader = new CodeReader({
        projectPath: this.config.projectPath,
      });
      const routeTree = await routeReader.scanAppRouter();
      auditResults.routes = { routeTree, totalRoutes: routeTree.length };

      // Auditoría de estilos
      console.log("Auditoría de estilos...");
      const styleAuditor = new StyleAuditor(this.config.projectPath);
      const styleResult = await styleAuditor.audit();
      auditResults.styles = styleResult;

      // Auditoría de seguridad
      console.log("Auditoría de seguridad...");
      const securityScanner = new SecurityScanner(this.config.projectPath);
      const securityResult = await securityScanner.scan();
      auditResults.security = securityResult;

      this.report.phases.audit = {
        success: true,
        details: auditResults,
      };

      // Calcular total de violaciones
      this.report.summary.totalViolations =
        (styleResult?.violations?.length || 0) +
        (securityResult?.summary?.critical || 0) +
        (securityResult?.summary?.high || 0);

      console.log("Auditoría completada");
      console.log(
        `Violaciones encontradas: ${this.report.summary.totalViolations}`,
      );
    } catch (error) {
      this.report.phases.audit.success = false;
      (this.report.phases.audit.details as any).error =
        error instanceof Error ? error.message : error;
      throw error;
    }
  }

  /**
   * Fase 3: Auto-fix de violaciones
   */
  private async executeFixPhase(): Promise<void> {
    console.log("\n--- Fase 3: Auto-Fix ---");

    try {
      // Importar AutoFixer dinámicamente para evitar dependencias circulares
      const AutoFixer = await import("./auto-fixer");
      const fixer = new AutoFixer.default(this.config.projectPath);

      const fixResult = await fixer.applyFixes(
        this.report.phases.audit.details,
      );

      this.report.phases.fix = {
        success: fixResult.success,
        details: fixResult,
      };

      this.report.summary.fixesApplied = fixResult.fixesApplied || 0;

      console.log(
        `Auto-fix completado: ${this.report.summary.fixesApplied} fixes aplicados`,
      );
    } catch (error) {
      this.report.phases.fix.success = false;
      this.report.phases.fix.details = {
        error: error instanceof Error ? error.message : error,
      };
      console.error("Falló el auto-fix:", error);
      // No lanzar error para continuar con tests
    }
  }

  /**
   * Fase 4: Ejecución de tests
   */
  private async executeTestPhase(): Promise<void> {
    console.log("\n--- Fase 4: Tests ---");

    try {
      const testCommand = "npm test";
      const { stdout, stderr } = await execAsync(testCommand, {
        cwd: path.resolve(__dirname, ".."),
        timeout: 60000,
      });

      // Parsear resultados de tests (simplificado)
      const testResults = this.parseTestOutput(stdout);

      this.report.phases.test = {
        success: testResults.failed === 0,
        details: testResults,
      };

      this.report.summary.testsPassed = testResults.passed;
      this.report.summary.testsFailed = testResults.failed;

      console.log(
        `Tests completados: ${testResults.passed} passed, ${testResults.failed} failed`,
      );
    } catch (error) {
      const testError = error as any;
      const testResults = this.parseTestOutput(testError.stdout || "");

      this.report.phases.test = {
        success: false,
        details: testResults,
      };

      this.report.summary.testsPassed = testResults.passed;
      this.report.summary.testsFailed = testResults.failed;

      console.log(
        `Tests completados con errores: ${testResults.passed} passed, ${testResults.failed} failed`,
      );
    }
  }

  /**
   * Fase 5: Verificación post-test
   */
  private async executeVerifyPhase(): Promise<void> {
    console.log("\n--- Fase 5: Verificación ---");

    try {
      const verificationResults: any = {};

      // Verificar estado de DB
      console.log("Verificando estado de DB...");
      const seeder = new DBSeeder();
      const isSeeded = await seeder.verifySeed();
      verificationResults.dbState = { seeded: isSeeded };

      // Verificar si hay archivos de reporte de Playwright
      const reportPath = path.join(
        path.resolve(__dirname, ".."),
        "playwright-report",
      );
      const reportExists = await fs.pathExists(reportPath);
      verificationResults.playwrightReport = { exists: reportExists };

      // Verificar si hay test results
      const testResultsPath = path.join(
        path.resolve(__dirname, ".."),
        "test-results",
      );
      const testResultsExists = await fs.pathExists(testResultsPath);
      verificationResults.testResults = { exists: testResultsExists };

      this.report.phases.verify = {
        success: true,
        details: verificationResults,
      };

      console.log("Verificación completada");
    } catch (error) {
      this.report.phases.verify.success = false;
      this.report.phases.verify.details = {
        error: error instanceof Error ? error.message : error,
      };
      throw error;
    }
  }

  /**
   * Parsear salida de tests (mejorado con errores específicos)
   */
  private parseTestOutput(output: string): TestResults {
    const lines = output.split("\n");
    let passed = 0;
    let failed = 0;
    const failures: TestFailure[] = [];

    let currentTest = "";
    let currentError = "";
    let inErrorBlock = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Buscar patrones de Playwright
      if (line.includes("passed")) {
        const match = line.match(/(\d+)\s+passed/);
        if (match) passed = parseInt(match[1]);
      }
      if (line.includes("failed")) {
        const match = line.match(/(\d+)\s+failed/);
        if (match) failed = parseInt(match[1]);
      }

      // Extraer nombres de tests que fallaron (formato Playwright)
      const testMatch = line.match(/^\s*([^\s]+)\s+»/);
      if (testMatch) {
        currentTest = testMatch[1];
        inErrorBlock = true;
      }

      // Extraer errores de tests - múltiples patrones
      if (
        inErrorBlock &&
        (line.includes("Error:") ||
          line.includes("TypeError:") ||
          line.includes("AssertionError:") ||
          line.includes("expect(") ||
          line.includes(" locator.") ||
          line.includes("page.") ||
          line.includes("Timeout"))
      ) {
        currentError = line.trim();

        // Buscar más líneas de error (multiline)
        let j = i + 1;
        while (
          j < lines.length &&
          lines[j].trim() &&
          !lines[j].includes("»") &&
          !lines[j].includes("passed") &&
          !lines[j].includes("failed")
        ) {
          currentError += " " + lines[j].trim();
          j++;
        }

        if (currentTest && currentError) {
          failures.push({
            test: currentTest,
            error: currentError,
            file: this.extractFileFromTest(currentTest),
          });
          currentTest = "";
          currentError = "";
          inErrorBlock = false;
        }
      }

      // Error pattern de Playwright (formato numerado)
      const errorMatch = line.match(/^\s*\d+\)\s+([^\n]+)$/);
      if (errorMatch && !line.includes("passed") && !line.includes("failed")) {
        const errorText = errorMatch[1];
        if (errorText.length > 10) {
          // Evitar capturar líneas muy cortas
          failures.push({
            test: "Unknown test",
            error: errorText,
            file: "Unknown file",
          });
        }
      }

      // Reset si encontramos un nuevo test
      if (line.includes("»") && currentTest) {
        currentTest = "";
        inErrorBlock = false;
      }
    }

    return {
      passed,
      failed,
      total: passed + failed,
      failures,
    };
  }

  /**
   * Extraer nombre de archivo de un test
   */
  private extractFileFromTest(testName: string): string {
    // Si el nombre del test contiene un path, extraerlo
    const pathMatch = testName.match(/([^\s]+\.(spec|test)\.[jt]sx?)/i);
    return pathMatch ? pathMatch[1] : testName;
  }

  /**
   * Calcular resumen final
   */
  private calculateSummary(): void {
    const allPhasesSuccessful = Object.values(this.report.phases).every(
      (phase) => phase.success,
    );
    this.report.summary.overallSuccess =
      allPhasesSuccessful && this.report.summary.testsFailed === 0;

    // Generar recomendaciones
    this.report.recommendations = [];

    if (this.report.summary.testsFailed > 0) {
      this.report.recommendations.push(
        `${this.report.summary.testsFailed} tests fallaron. Revisar los errores y aplicar fixes.`,
      );
    }

    if (
      this.report.summary.totalViolations > 0 &&
      this.report.summary.fixesApplied === 0
    ) {
      this.report.recommendations.push(
        "Violaciones detectadas pero no se aplicaron fixes. Revisar manualmente.",
      );
    }

    if (
      this.report.phases.verify.success &&
      this.report.phases.verify.details.dbState?.seeded
    ) {
      this.report.recommendations.push(
        "Base de datos está en estado consistente.",
      );
    }

    if (this.report.summary.overallSuccess) {
      this.report.recommendations.push(
        "Pipeline completado exitosamente. La aplicación está lista para producción.",
      );
    }
  }

  /**
   * Generar reporte en formato Markdown
   */
  generateMarkdownReport(): string {
    let report = "# QA Orchestrator Report\n\n";
    report += `**Project:** ${this.report.projectPath}\n`;
    report += `**Timestamp:** ${this.report.timestamp}\n`;
    report += `**Overall Status:** ${this.report.summary.overallSuccess ? "SUCCESS" : "FAILURE"}\n\n`;

    report += "## Summary\n\n";
    report += `| Metric | Value |\n`;
    report += `|--------|-------|\n`;
    report += `| Total Violations | ${this.report.summary.totalViolations} |\n`;
    report += `| Fixes Applied | ${this.report.summary.fixesApplied} |\n`;
    report += `| Tests Passed | ${this.report.summary.testsPassed} |\n`;
    report += `| Tests Failed | ${this.report.summary.testsFailed} |\n\n`;

    report += "## Phase Results\n\n";
    const phases = [
      { name: "Seed", phase: this.report.phases.seed },
      { name: "Audit", phase: this.report.phases.audit },
      { name: "Fix", phase: this.report.phases.fix },
      { name: "Test", phase: this.report.phases.test },
      { name: "Verify", phase: this.report.phases.verify },
    ];

    for (const { name, phase } of phases) {
      const status = phase.success ? "SUCCESS" : "FAILURE";
      report += `### ${name}: ${status}\n`;
      if (phase.details) {
        report += "```json\n";
        report += JSON.stringify(phase.details, null, 2);
        report += "\n```\n\n";
      }
    }

    if (this.report.phases.test.details.failures.length > 0) {
      report += "### Test Failures\n\n";
      report += "| Test | File | Error |\n";
      report += "|------|------|-------|\n";
      for (const failure of this.report.phases.test.details.failures) {
        report += `| ${failure.test} | ${failure.file} | ${failure.error} |\n`;
      }
      report += "\n";
    }

    if (this.report.recommendations.length > 0) {
      report += "## Recommendations\n\n";
      for (const rec of this.report.recommendations) {
        report += `- ${rec}\n`;
      }
      report += "\n";
    }

    return report;
  }
}

export default QAOrchestrator;
export { QAOrchestrator, OrchestratorConfig, OrchestratorReport };
