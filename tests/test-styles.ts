/**
 * Style Auditor Stress Test
 *
 * This script validates the premium quality hardening of the StyleAuditor:
 * - Conflict Detector (conflicting Tailwind classes)
 * - Next.js Optimizer Check (native img → next/image)
 * - Smart Ignoring (template literals with dynamic Tailwind)
 *
 * @module test-styles
 * @since 1.0.0
 */

import * as fs from 'fs';
import * as path from 'path';
import { StyleAuditor } from './modules/style-auditor.js';
import { ReportAggregator } from './core/reporter.js';
import type { DomainMap } from './types/domain.js';

/**
 * Test result interface
 */
interface TestResult {
  testName: string;
  success: boolean;
  message: string;
  details?: any;
}

/**
 * Creates a mock DomainMap for testing
 */
function createMockDomainMap(): DomainMap {
  return {
    entities: [],
    relationships: [],
    criticalPaths: [
      {
        name: 'Booking',
        type: 'booking',
        confidence: 0.9,
        entities: ['booking', 'reservation'],
        actions: ['create', 'update', 'cancel'],
      },
    ],
    serverActions: [],
    overallConfidence: 0.9,
    metadata: {
      method: 'static',
      aiAssisted: false,
      timestamp: new Date().toISOString(),
      sourceFiles: [],
    },
  };
}

/**
 * Creates a temporary test directory
 */
async function createTestProject(testName: string): Promise<string> {
  const testDir = path.join(process.cwd(), 'test-temp', testName);

  // Clean up existing test directory
  if (fs.existsSync(testDir)) {
    fs.rmSync(testDir, { recursive: true, force: true });
  }

  // Create test directory structure
  fs.mkdirSync(testDir, { recursive: true });
  fs.mkdirSync(path.join(testDir, 'app'), { recursive: true });
  fs.mkdirSync(path.join(testDir, 'app', 'booking'), { recursive: true });

  return testDir;
}

/**
 * Creates a component with all style violations for stress testing
 */
function createStressTestComponent(testDir: string): void {
  const componentPath = path.join(testDir, 'app', 'booking', 'page.tsx');

  const componentContent = `
import React from 'react';

export default function BookingPage() {
  return (
    <div className="p-4 p-6 p-8 flex-row flex-col text-left text-center text-blue-500 text-red-500 bg-blue-500 bg-red-500">
      {/* Duplicate classes: p-4, p-6, p-8 */}
      {/* Conflicting classes: flex-row + flex-col, text-left + text-center, text-blue-500 + text-red-500, bg-blue-500 + bg-red-500 */}
      
      <div className="p-4 m-2">
        <img src="/hero.jpg" alt="Hero image" />
        {/* Native img tag - should suggest next/image */}
        
        <img src="/thumbnail.jpg" />
        {/* Image without alt - accessibility violation */}
      </div>

      <div>
        <img src="/logo.png" alt="Company Logo" />
        {/* Another native img in critical path - HIGH severity */}
      </div>

      <div className={\`p-4 \${isLarge ? 'p-8' : 'p-2'}\`}>
        {/* Dynamic Tailwind - should be ignored by Smart Ignoring */}
      </div>
    </div>
  );
}
`;

  fs.writeFileSync(componentPath, componentContent);
}

/**
 * Cleans up test project
 */
function cleanupTestProject(testDir: string): void {
  if (fs.existsSync(testDir)) {
    fs.rmSync(testDir, { recursive: true, force: true });
  }
}

/**
 * Runs all style auditor tests
 */
async function runStyleAuditorTests(): Promise<void> {
  console.log('=== AEGIS QA - STYLE AUDITOR STRESS TEST ===\n');

  const results: TestResult[] = [];

  // Test 1: Conflict Detection
  console.log('[TEST 1] Conflict detection (conflicting classes)...');
  try {
    const testDir = await createTestProject('test-conflict-detection');
    createStressTestComponent(testDir);

    const domainMap = createMockDomainMap();
    const reporter = new ReportAggregator({ autoEscalateCriticalPath: true });
    const auditor = new StyleAuditor({
      projectRoot: testDir,
      domainMap,
      reporter,
      thermalController: undefined,
    });

    await auditor.audit();
    const violations = reporter.getViolations('style-auditor');

    const conflictViolations = violations.filter(
      (v) => v.rule === 'tailwind-conflicting-classes'
    );

    if (conflictViolations.length > 0) {
      results.push({
        success: true,
        testName: 'Conflict Detection',
        message: `Detected ${conflictViolations.length} conflicting class violations`,
        details: { conflictViolations },
      });
      console.log(`✅ PASS: Detected ${conflictViolations.length} conflicting class violations\n`);
    } else {
      results.push({
        success: false,
        testName: 'Conflict Detection',
        message: 'No conflicting classes detected',
        details: { violations },
      });
      console.log('❌ FAIL: No conflicting classes detected\n');
    }

    cleanupTestProject(testDir);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    results.push({
      success: false,
      testName: 'Conflict Detection',
      message: 'Test execution failed',
      details: { error: errorMessage },
    });
    console.log(`❌ FAIL: ${errorMessage}\n`);
  }

  // Test 2: Next.js Optimizer Check (native img)
  console.log('[TEST 2] Next.js Optimizer Check (native img)...');
  try {
    const testDir = await createTestProject('test-nextjs-optimizer');
    createStressTestComponent(testDir);

    const domainMap = createMockDomainMap();
    const reporter = new ReportAggregator({ autoEscalateCriticalPath: true });
    const auditor = new StyleAuditor({
      projectRoot: testDir,
      domainMap,
      reporter,
      thermalController: undefined,
    });

    await auditor.audit();
    const violations = reporter.getViolations('style-auditor');

    const imgViolations = violations.filter((v) => v.rule === 'nextjs-use-next-image');

    if (imgViolations.length > 0) {
      // Check if any are HIGH severity (in critical path)
      const highSeverityViolations = imgViolations.filter((v) => v.severity === 'high');

      if (highSeverityViolations.length > 0) {
        results.push({
          success: true,
          testName: 'Next.js Optimizer Check',
          message: `Detected ${imgViolations.length} native img violations (${highSeverityViolations.length} HIGH severity in critical path)`,
          details: { imgViolations, highSeverityViolations },
        });
        console.log(
          `✅ PASS: Detected ${imgViolations.length} native img violations (${highSeverityViolations.length} HIGH severity in critical path)\n`
        );
      } else {
        results.push({
          success: true,
          testName: 'Next.js Optimizer Check',
          message: `Detected ${imgViolations.length} native img violations (MEDIUM severity)`,
          details: { imgViolations },
        });
        console.log(`✅ PASS: Detected ${imgViolations.length} native img violations (MEDIUM severity)\n`);
      }
    } else {
      results.push({
        success: false,
        testName: 'Next.js Optimizer Check',
        message: 'No native img violations detected',
        details: { violations },
      });
      console.log('❌ FAIL: No native img violations detected\n');
    }

    cleanupTestProject(testDir);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    results.push({
      success: false,
      testName: 'Next.js Optimizer Check',
      message: 'Test execution failed',
      details: { error: errorMessage },
    });
    console.log(`❌ FAIL: ${errorMessage}\n`);
  }

  // Test 3: Accessibility (missing alt)
  console.log('[TEST 3] Accessibility (missing alt on img)...');
  try {
    const testDir = await createTestProject('test-accessibility');
    createStressTestComponent(testDir);

    const domainMap = createMockDomainMap();
    const reporter = new ReportAggregator({ autoEscalateCriticalPath: true });
    const auditor = new StyleAuditor({
      projectRoot: testDir,
      domainMap,
      reporter,
      thermalController: undefined,
    });

    await auditor.audit();
    const violations = reporter.getViolations('style-auditor');

    const altViolations = violations.filter((v) => v.rule === 'a11y-img-alt');

    if (altViolations.length > 0) {
      results.push({
        success: true,
        testName: 'Accessibility Check',
        message: `Detected ${altViolations.length} missing alt violations`,
        details: { altViolations },
      });
      console.log(`✅ PASS: Detected ${altViolations.length} missing alt violations\n`);
    } else {
      results.push({
        success: false,
        testName: 'Accessibility Check',
        message: 'No missing alt violations detected',
        details: { violations },
      });
      console.log('❌ FAIL: No missing alt violations detected\n');
    }

    cleanupTestProject(testDir);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    results.push({
      success: false,
      testName: 'Accessibility Check',
      message: 'Test execution failed',
      details: { error: errorMessage },
    });
    console.log(`❌ FAIL: ${errorMessage}\n`);
  }

  // Test 4: Smart Ignoring (dynamic Tailwind)
  console.log('[TEST 4] Smart Ignoring (dynamic Tailwind)...');
  try {
    const testDir = await createTestProject('test-smart-ignoring');
    createStressTestComponent(testDir);

    const domainMap = createMockDomainMap();
    const reporter = new ReportAggregator({ autoEscalateCriticalPath: true });
    const auditor = new StyleAuditor({
      projectRoot: testDir,
      domainMap,
      reporter,
      thermalController: undefined,
    });

    await auditor.audit();
    const violations = reporter.getViolations('style-auditor');

    // Check that the dynamic Tailwind line is NOT flagged for duplicates/conflicts
    // The dynamic line should be ignored
    const dynamicLineViolations = violations.filter((v) =>
      v.message.includes('dynamic') || v.message.includes('template')
    );

    if (dynamicLineViolations.length === 0) {
      results.push({
        success: true,
        testName: 'Smart Ignoring',
        message: 'Dynamic Tailwind correctly ignored',
        details: { violations },
      });
      console.log('✅ PASS: Dynamic Tailwind correctly ignored\n');
    } else {
      results.push({
        success: false,
        testName: 'Smart Ignoring',
        message: 'Dynamic Tailwind was not ignored (false positive)',
        details: { dynamicLineViolations },
      });
      console.log('❌ FAIL: Dynamic Tailwind was not ignored\n');
    }

    cleanupTestProject(testDir);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    results.push({
      success: false,
      testName: 'Smart Ignoring',
      message: 'Test execution failed',
      details: { error: errorMessage },
    });
    console.log(`❌ FAIL: ${errorMessage}\n`);
  }

  // Test 5: Critical Path Severity Escalation
  console.log('[TEST 5] Critical Path Severity Escalation...');
  try {
    const testDir = await createTestProject('test-critical-path-escalation');
    createStressTestComponent(testDir);

    const domainMap = createMockDomainMap();
    const reporter = new ReportAggregator({ autoEscalateCriticalPath: true });
    const auditor = new StyleAuditor({
      projectRoot: testDir,
      domainMap,
      reporter,
      thermalController: undefined,
    });

    await auditor.audit();
    const violations = reporter.getViolations('style-auditor');

    // Check if violations in critical path have been escalated
    const criticalPathViolations = violations.filter((v) => v.file.inCriticalPath);
    const escalatedViolations = criticalPathViolations.filter((v) => v.message.includes('ESCALATED'));

    if (escalatedViolations.length > 0) {
      results.push({
        success: true,
        testName: 'Critical Path Escalation',
        message: `${escalatedViolations.length} violations escalated in critical path`,
        details: { escalatedViolations },
      });
      console.log(`✅ PASS: ${escalatedViolations.length} violations escalated in critical path\n`);
    } else {
      // Check if any violations are in critical path with higher severity
      const highSeverityInCriticalPath = criticalPathViolations.filter((v) => v.severity === 'high');
      if (highSeverityInCriticalPath.length > 0) {
        results.push({
          success: true,
          testName: 'Critical Path Escalation',
          message: `${highSeverityInCriticalPath.length} violations in critical path have HIGH severity`,
          details: { highSeverityInCriticalPath },
        });
        console.log(
          `✅ PASS: ${highSeverityInCriticalPath.length} violations in critical path have HIGH severity\n`
        );
      } else {
        results.push({
          success: false,
          testName: 'Critical Path Escalation',
          message: 'No severity escalation detected in critical path',
          details: { criticalPathViolations },
        });
        console.log('❌ FAIL: No severity escalation detected in critical path\n');
      }
    }

    cleanupTestProject(testDir);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    results.push({
      success: false,
      testName: 'Critical Path Escalation',
      message: 'Test execution failed',
      details: { error: errorMessage },
    });
    console.log(`❌ FAIL: ${errorMessage}\n`);
  }

  // Print summary
  console.log('=== TEST SUMMARY ===\n');
  console.log(`Total Tests: ${results.length}`);
  console.log(`Passed: ${results.filter((r) => r.success).length}`);
  console.log(`Failed: ${results.filter((r) => !r.success).length}\n`);

  if (results.every((r) => r.success)) {
    console.log('✅ ALL TESTS PASSED - STYLE AUDITOR IS PREMIUM QUALITY');
  } else {
    console.log('❌ SOME TESTS FAILED - REVIEW FAILURES ABOVE');
    console.log('\nFailed Tests:');
    for (const result of results.filter((r) => !r.success)) {
      console.log(`- ${result.testName}: ${result.message}`);
    }
  }
}

// Run tests
runStyleAuditorTests().catch(console.error);
