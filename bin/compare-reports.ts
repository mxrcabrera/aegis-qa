#!/usr/bin/env node

/**
 * Aegis QA - Compare Reports Command
 *
 * Compares two QA reports and shows delta analysis:
 * - Resolved violations
 * - New violations
 * - Trend analysis
 *
 * Usage: aegis-qa compare [report1] [report2]
 * Or: node bin/compare-reports.ts [report1] [report2]
 */

import * as path from 'path';
import * as fs from 'fs';
import {
  compareReports,
  generateComparisonMarkdown,
  listReports,
  type ComparisonResult,
} from '../src/modules/report-comparator.js';

function printHelp(): void {
  console.log(`
Aegis QA - Compare Reports Command

Compares two QA reports and shows delta analysis.

Usage:
  aegis-qa compare [report1] [report2]
  node bin/compare-reports.ts [report1] [report2]

Arguments:
  report1  Path to the first (older) report
  report2  Path to the second (newer) report

Options:
  --list    List all available timestamped reports in .sentinel/reports/
  --help    Show this help message

Examples:
  aegis-qa compare .sentinel/reports/qa-report-2024-01-01T10-00-00.md .sentinel/reports/qa-report-2024-01-02T10-00-00.md
  aegis-qa compare --list
  node bin/compare-reports.ts qa-report-old.md qa-report-new.md
`);
}

function main(): void {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    printHelp();
    process.exit(0);
  }

  // List reports option
  if (args.includes('--list')) {
    const projectRoot = process.cwd();
    const reports = listReports(projectRoot);

    if (reports.length === 0) {
      console.log('No timestamped reports found in .sentinel/reports/');
      process.exit(0);
    }

    console.log('Available timestamped reports:');
    for (const report of reports) {
      const filename = path.basename(report);
      const stat = fs.statSync(report);
      const date = stat.mtime.toISOString();
      console.log(`  ${filename} (${date})`);
    }
    process.exit(0);
  }

  // Compare reports
  if (args.length < 2) {
    console.error('Error: Two report paths are required for comparison.');
    console.error('Usage: aegis-qa compare [report1] [report2]');
    console.error('Use --list to see available reports.');
    process.exit(1);
  }

  const report1Path = args[0];
  const report2Path = args[1];

  // Validate report paths
  if (!fs.existsSync(report1Path)) {
    console.error(`Error: Report not found: ${report1Path}`);
    process.exit(1);
  }

  if (!fs.existsSync(report2Path)) {
    console.error(`Error: Report not found: ${report2Path}`);
    process.exit(1);
  }

  try {
    const comparison: ComparisonResult = compareReports(report1Path, report2Path);
    const markdown = generateComparisonMarkdown(comparison);

    console.log(markdown);
  } catch (error) {
    console.error('Error comparing reports:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

main();
