#!/usr/bin/env ts-node
/**
 * CLI Script - Audit Security
 *
 * Uso: npx ts-node scripts/audit-security.ts <project-path>
 */

import SecurityScanner from "../lib/security-scanner";
import * as path from "path";
import * as fs from "fs-extra";

const projectPath = process.argv[2] || path.join(__dirname, "..", "..");

async function main() {
  console.log(`\n=== Security Scanner - BaaS ===`);
  console.log(`Project Path: ${projectPath}\n`);

  const scanner = new SecurityScanner(projectPath);

  try {
    const result = await scanner.scan();
    scanner.printReport(result);

    // Guardar reporte en archivo
    const reportPath = path.join(projectPath, "security-audit-report.md");
    const markdownReport = scanner.generateMarkdownReport(result);
    await fs.writeFile(reportPath, markdownReport);

    console.log(`\n📄 Report saved to: ${reportPath}`);
    console.log("\n✅ Security scan completed successfully");
  } catch (error) {
    console.error(
      "\n❌ Error:",
      error instanceof Error ? error.message : error,
    );
    process.exit(1);
  }
}

main();
