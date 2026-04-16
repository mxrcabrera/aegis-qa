#!/usr/bin/env node

/**
 * Legendary Mode Script - "Doble Click y Tuki"
 *
 * Usage: npm run legendary [project-path]
 * Philosophy: Copy script to any repo = Senior dev working for free
 */

import { QAOrchestrator } from "../lib/orchestrator";
import * as path from "path";

async function runLegendaryMode() {
  console.log("");
  console.log("========================================");
  console.log("  QA ORCHESTRATOR - LEGENDARY MODE    ");
  console.log('       "Doble Click y Tuki"           ');
  console.log("========================================");
  console.log("");

  const projectPath = process.argv[2]
    ? path.resolve(process.argv[2])
    : process.cwd();

  console.log(`Proyecto objetivo: ${projectPath}`);
  console.log("");

  try {
    // Create orchestrator in LEGENDARY mode
    const orchestrator = new QAOrchestrator({
      projectPath,
      skipTests: true, // Skip tests for legendary mode
      skipSeed: true, // Skip seed for legendary mode
      appDir: "app", // Focus on app directory
    });

    // Run in legendary mode
    const report = await orchestrator.run();

    console.log("");
    console.log("========================================");
    console.log("      MODO LEGENDARIO COMPLETADO       ");
    console.log("========================================");
    console.log("");
    console.log("Tu proyecto ha sido procesado por un");
    console.log("Senior dev AUTOMÁTICO y GRATIS.");
    console.log("");
    console.log("Resultados:");
    console.log(`- Archivos procesados: ${report.summary.fixesApplied || 0}`);
    console.log(
      `- Violaciones corregidas: ${report.summary.totalViolations || 0}`,
    );
    console.log(
      `- Estado: ${report.summary.overallSuccess ? "ÉXITO" : "ADVERTENCIA"}`,
    );
    console.log("");
    console.log("El reporte se abrió automáticamente.");
    console.log("¡Disfruta tu código optimizado!");
    console.log("");
  } catch (error) {
    console.error("");
    console.error("========================================");
    console.error("         ERROR EN MODO LEGENDARIO       ");
    console.error("========================================");
    console.error("");
    console.error("Error:", error instanceof Error ? error.message : error);
    console.error("");
    console.error("Soluciones:");
    console.error("1. Ejecuta como administrador");
    console.error("2. Verifica que el proyecto existe");
    console.error("3. Asegúrate de tener permisos de escritura");
    console.error("");
    process.exit(1);
  }
}

// Run legendary mode if called directly
if (require.main === module) {
  runLegendaryMode();
}

export { runLegendaryMode };
