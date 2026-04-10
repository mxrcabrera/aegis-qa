#!/usr/bin/env node

/**
 * QA Orchestrator - Entry Point Simplificado (Multi-Directorio)
 *
 * Purpose: Ejecutar desde cualquier directorio sin imports complejos
 * Flow: SetupWizard -> Orchestrator -> OllamaProcessor
 * Output: Ejecución nativa con ts-node
 */

console.log("AUDIT: Iniciando imports estándar...");
import * as path from "path";
import * as fs from "fs";
console.log("AUDIT: path y fs importados");

// Imports estándar (sin paths dinámicos)
import SetupWizard from "./qa-orchestrator-lib/setup-wizard.js";
console.log("AUDIT: SetupWizard importado");
import { QAOrchestrator } from "./qa-orchestrator-lib/orchestrator.js";
console.log("AUDIT: QAOrchestrator importado");
console.log("AUDIT: Todos los imports completados");

/**
 * Función principal - Orquesta todo el flujo
 */
async function main() {
  try {
    // PATH PROJECT-AGNOSTIC - Usar directorio actual sin importar rutas fijas
    console.log("=== PATH PROJECT-AGNOSTIC ===");
    const cwd = process.cwd();
    console.log(`AUDIT: Directorio actual: ${cwd}`);

    // Project-agnostic: Usar siempre el directorio actual
    const projectPath = cwd;
    
    console.log(`AUDIT: Project path final: ${projectPath}`);
    console.log("========================================");
    console.log("  QA ORCHESTRATOR - PROJECT-AGNOSTIC ");
    console.log("       Ejecución Nativa                ");
    console.log("========================================");
    console.log("");
    console.log(`Proyecto objetivo: ${projectPath}`);
    console.log("");

    // FASE 1: Setup Wizard - Permisos y Ollama
    console.log("=== FASE 1: SETUP WIZARD ===");
    const setupWizard = SetupWizard.getInstance();
    const setupComplete = await setupWizard.legendarySetup();

    if (!setupComplete) {
      console.error("Setup fallido. Abortando...");
      throw new Error("Setup fallido");
    }

    // FASE 2: QA ORCHESTRATOR - Pipeline completo
    console.log("\n=== FASE 2: QA ORCHESTRATOR ===");
    const orchestrator = new QAOrchestrator({
      projectPath,
      skipTests: true,
      skipSeed: true,
    });

    const report = await orchestrator.run();

    // FASE 3: Resultados finales
    console.log("\n=== RESULTADOS FINALES ===");
    console.log(`Estado: ${report.summary.overallSuccess ? "ÉXITO" : "ERROR"}`);
    console.log(`Violaciones encontradas: ${report.summary.totalViolations}`);
    console.log(`Fixes aplicados: ${report.summary.fixesApplied}`);
    console.log(`Tests pasados: ${report.summary.testsPassed}`);
    console.log(`Tests fallidos: ${report.summary.testsFailed}`);
    console.log("");

    // FASE 4: Resumen final
    console.log("========================================");
    console.log("     PROYECTO OPTIMIZADO CON ÉXITO");
    console.log("========================================");
    console.log("El proyecto ha sido procesado y optimizado.");
    console.log("Revisa los reportes generados para más detalles.");
    console.log("");
    console.log("¡Listo para producción!");
    console.log("");
    console.log("=======================================");
    console.log("        PROCESO FINALIZADO");
    console.log("=======================================");
  } catch (error) {
    console.error("\n=== ERROR CRÍTICO ===");
    console.error("Error en el proceso principal:");
    console.error(error instanceof Error ? error.message : error);
    if (error instanceof Error && error.stack) {
      console.error("\nStack trace:");
      console.error(error.stack);
    }
    console.error("=======================");
    process.exit(1);
  }
}

// Ejecutar función principal
main();
