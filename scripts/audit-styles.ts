#!/usr/bin/env ts-node
import { createProcess } from "child_process";
import * as path from "path";
import * as fs from "fs-extra";

const projectPath = process.argv[2] || process.cwd();
const reportPath = path.join(projectPath, "style-audit-report.md");

async function main() {
  console.log(`\n=== Style Auditor ===`);
  console.log(`Project Path: ${projectPath}\n`);

  const auditor = new StyleAuditor(projectPath);

  try {
    const result = await auditor.audit();
    auditor.printReport(result);
    fs.writeFile(reportPath, auditor.generateMarkdownReport(result));
    console.log(`\n📄 Report saved to: ${reportPath}`);
    console.log("\n✅ Style audit completed successfully");
  } catch (error) {
    console.error("\n❌ Error:", error.message);
    process.exit(1);
  }
}

main();
