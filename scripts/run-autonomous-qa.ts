#!/usr/bin/env ts-node
/**
 * CLI Script - Autonomous QA Orchestrator
 *
 * Uso: npx ts-node scripts/run-autonomous-qa.ts <project-path> [options]
 *
 * Options:
 *   --skip-seed      Skip database seeding phase
 *   --skip-fix       Skip auto-fix phase
 *   --skip-tests     Skip test execution phase
 *   --help           Show this help message
 */

import * as path from "path";
import * as fs from "fs";
import * as dotenv from "dotenv";
import { PhaseOrchestrator } from "../src/orchestration/phase-orchestrator.js";

dotenv.config();

interface CliOptions {
  skipSeed?: boolean;
  skipFix?: boolean;
  skipTests?: boolean;
  help?: boolean;
}

function parseArguments(): { projectPath: string; options: CliOptions } {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
    console.log(`
Usage: npx ts-node scripts/run-autonomous-qa.ts <project-path> [options]

Arguments:
  project-path    Path to the project to audit (e.g., ../pilates-booking)

Options:
  --skip-seed     Skip database seeding phase
  --skip-fix      Skip auto-fix phase
  --skip-tests    Skip test execution phase
  --help, -h      Show this help message

Examples:
  npx ts-node scripts/run-autonomous-qa.ts ../pilates-booking
  npx ts-node scripts/run-autonomous-qa.ts ../pilates-booking --skip-tests
  npx ts-node scripts/run-autonomous-qa.ts ../pilates-booking --skip-fix --skip-seed
`);
    process.exit(0);
  }

  const projectPath = path.resolve(args[0]);
  const options: CliOptions = {};

  if (args.includes("--skip-seed")) options.skipSeed = true;
  if (args.includes("--skip-fix")) options.skipFix = true;
  if (args.includes("--skip-tests")) options.skipTests = true;

  return { projectPath, options };
}

async function main() {
  const { projectPath, options } = parseArguments();

  console.log("\n=== QA Orchestrator - Autonomous Mode ===");
  console.log(`Project: ${projectPath}`);
  console.log(`Options: ${JSON.stringify(options, null, 2)}\n`);

  // Validar que el proyecto exista
  if (!(await fs.pathExists(projectPath))) {
    console.error(`Error: Project path does not exist: ${projectPath}`);
    process.exit(1);
  }

  // Validar variables de entorno requeridas
  const requiredEnvVars = ["SUPABASE_URL", "SUPABASE_ANON_KEY"];
  const missingVars = requiredEnvVars.filter(
    (varName) => !process.env[varName],
  );

  if (missingVars.length > 0) {
    console.error("Error: Missing required environment variables:");
    missingVars.forEach((varName) => console.error(`  - ${varName}`));
    console.error(
      "\nPlease set these variables in your .env file or environment.",
    );
    process.exit(1);
  }

  try {
    // Crear y ejecutar el orchestrator
    const orchestrator = new QAOrchestrator({
      projectPath,
      ...options,
    });

    const report = await orchestrator.run();

    // Generar reporte Markdown
    const markdownReport = orchestrator.generateMarkdownReport();

    // Guardar reporte en archivo
    const reportPath = path.join(projectPath, "qa-orchestrator-report.md");
    await fs.writeFile(reportPath, markdownReport);

    console.log(`\n=== Report Generated ===`);
    console.log(`Report saved to: ${reportPath}`);
    console.log(
      `Overall Status: ${report.summary.overallSuccess ? "SUCCESS" : "FAILURE"}`,
    );
    console.log(`Violations Found: ${report.summary.totalViolations}`);
    console.log(`Fixes Applied: ${report.summary.fixesApplied}`);
    console.log(`Tests Passed: ${report.summary.testsPassed}`);
    console.log(`Tests Failed: ${report.summary.testsFailed}`);

    if (report.recommendations.length > 0) {
      console.log("\nRecommendations:");
      report.recommendations.forEach((rec) => console.log(`  - ${rec}`));
    }

    // Salir con código apropiado
    process.exit(report.summary.overallSuccess ? 0 : 1);
  } catch (error) {
    console.error("\n=== Pipeline Failed ===");
    console.error("Error:", error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  process.exit(1);
});

main();
