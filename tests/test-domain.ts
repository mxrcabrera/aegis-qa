/**
 * Domain Stress Test - Hardening Verification for DomainAnalyzer
 *
 * Purpose: Stress test the DomainAnalyzer with contradictory schemas and
 * complex names to verify that confidence scores drop correctly instead
 * of giving false positives of 100%.
 *
 * @module test-domain
 * @since 1.0.0
 */

import * as fs from 'fs';
import * as path from 'path';
import { DomainAnalyzer } from './inference/domain-analyzer.js';

/**
 * Test result interface
 */
interface TestResult {
  success: boolean;
  testName: string;
  message: string;
  details?: any;
}

/**
 * Runs domain stress tests
 *
 * @returns Promise<TestResult[]> - Array of test results
 */
async function runDomainStressTests(): Promise<TestResult[]> {
  const results: TestResult[] = [];

  console.log('\n=== AEGIS QA - DOMAIN STRESS TEST ===\n');

  // Test 1: Contradictory Entity Names (User vs users)
  console.log('[TEST 1] Contradictory entity names (User vs users)...');
  try {
    const testDir = await createTestProject('test-contradictory-names');
    await createContradictorySQLSchema(testDir);

    const analyzer = new DomainAnalyzer({
      projectRoot: testDir,
      useDatabase: false,
      useAI: false,
      schemaPaths: ['supabase/migrations/*.sql'],
      actionPaths: [],
    });

    const result = await analyzer.analyze();

    if (result.success && result.domainMap) {
      const reconciledEntities = result.domainMap.entities.filter(
        (e) => e.name.toLowerCase() === 'user' || e.name.toLowerCase() === 'users'
      );

      if (reconciledEntities.length === 1 && reconciledEntities[0].source === 'multiple') {
        results.push({
          success: true,
          testName: 'Contradictory Entity Names',
          message: 'Successfully reconciled User vs users into single entity',
          details: {
            reconciledEntity: reconciledEntities[0],
            confidence: reconciledEntities[0].confidence,
          },
        });
        console.log('✅ PASS: Reconciled into single entity with source: multiple\n');
      } else {
        results.push({
          success: false,
          testName: 'Contradictory Entity Names',
          message: 'Failed to reconcile contradictory names',
          details: { entities: reconciledEntities },
        });
        console.log(`❌ FAIL: Found ${reconciledEntities.length} entities instead of 1\n`);
      }
    } else {
      results.push({
        success: false,
        testName: 'Contradictory Entity Names',
        message: 'Analysis failed',
        details: { error: result.error },
      });
      console.log(`❌ FAIL: ${result.error}\n`);
    }

    cleanupTestProject(testDir);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    results.push({
      success: false,
      testName: 'Contradictory Entity Names',
      message: 'Test execution failed',
      details: { error: errorMessage },
    });
    console.log(`❌ FAIL: ${errorMessage}\n`);
  }

  // Test 2: Confidence Score Drop with Contradictions
  console.log('[TEST 2] Confidence score drop with contradictions...');
  try {
    const testDir = await createTestProject('test-confidence-drop');
    await createLowConfidenceSchema(testDir);

    const analyzer = new DomainAnalyzer({
      projectRoot: testDir,
      useDatabase: false,
      useAI: false,
      schemaPaths: ['supabase/migrations/*.sql'],
      actionPaths: [],
    });

    const result = await analyzer.analyze();

    if (result.success && result.domainMap) {
      const confidence = result.domainMap.overallConfidence;

      if (confidence < 0.9) {
        results.push({
          success: true,
          testName: 'Confidence Score Drop',
          message: `Confidence correctly dropped to ${Math.round(confidence * 100)}%`,
          details: { confidence, warnings: result.warnings },
        });
        console.log(`✅ PASS: Confidence = ${Math.round(confidence * 100)}% (< 90%)\n`);
      } else {
        results.push({
          success: false,
          testName: 'Confidence Score Drop',
          message: 'Confidence did not drop as expected',
          details: { confidence, warnings: result.warnings },
        });
        console.log(`❌ FAIL: Confidence = ${Math.round(confidence * 100)}% (should be < 90%)\n`);
      }
    } else {
      results.push({
        success: false,
        testName: 'Confidence Score Drop',
        message: 'Analysis failed',
        details: { error: result.error },
      });
      console.log(`❌ FAIL: ${result.error}\n`);
    }

    cleanupTestProject(testDir);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    results.push({
      success: false,
      testName: 'Confidence Score Drop',
      message: 'Test execution failed',
      details: { error: errorMessage },
    });
    console.log(`❌ FAIL: ${errorMessage}\n`);
  }

  // Test 3: Complex Entity Names with Plurals
  console.log('[TEST 3] Complex entity names with plurals...');
  try {
    const testDir = await createTestProject('test-complex-names');
    await createComplexNameSchema(testDir);

    const analyzer = new DomainAnalyzer({
      projectRoot: testDir,
      useDatabase: false,
      useAI: false,
      schemaPaths: ['supabase/migrations/*.sql'],
      actionPaths: [],
    });

    const result = await analyzer.analyze();

    if (result.success && result.domainMap) {
      const bookingEntities = result.domainMap.entities.filter(
        (e) => e.name.toLowerCase().includes('booking')
      );

      // Expect 2 entities: booking (merged from booking + Bookings) and booking_items (different entity)
      if (bookingEntities.length === 2) {
        const mainBooking = bookingEntities.find((e) => e.name === 'booking');
        if (mainBooking && mainBooking.source === 'multiple') {
          results.push({
            success: true,
            testName: 'Complex Entity Names',
            message: 'Successfully merged booking/Bookings, kept booking_items separate',
            details: { entities: bookingEntities },
          });
          console.log('✅ PASS: Merged booking/Bookings, kept booking_items separate\n');
        } else {
          results.push({
            success: false,
            testName: 'Complex Entity Names',
            message: 'booking not marked as multiple source',
            details: { entities: bookingEntities },
          });
          console.log('❌ FAIL: booking not marked as multiple source\n');
        }
      } else {
        results.push({
          success: false,
          testName: 'Complex Entity Names',
          message: 'Failed to merge complex names',
          details: { entities: bookingEntities },
        });
        console.log(`❌ FAIL: Found ${bookingEntities.length} booking entities instead of 2\n`);
      }
    } else {
      results.push({
        success: false,
        testName: 'Complex Entity Names',
        message: 'Analysis failed',
        details: { error: result.error },
      });
      console.log(`❌ FAIL: ${result.error}\n`);
    }

    cleanupTestProject(testDir);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    results.push({
      success: false,
      testName: 'Complex Entity Names',
      message: 'Test execution failed',
      details: { error: errorMessage },
    });
    console.log(`❌ FAIL: ${errorMessage}\n`);
  }

  // Test 4: Sovereign Map Override
  console.log('[TEST 4] Sovereign map override...');
  try {
    const testDir = await createTestProject('test-map-override');
    await createSimpleSchema(testDir);
    await createSovereignMap(testDir);

    const analyzer = new DomainAnalyzer({
      projectRoot: testDir,
      useDatabase: false,
      useAI: false,
      schemaPaths: ['supabase/migrations/*.sql'],
      actionPaths: [],
    });

    const result = await analyzer.analyze();

    if (result.success && result.domainMap) {
      const customEntity = result.domainMap.entities.find((e) => e.name === 'CustomEntity');

      if (customEntity && customEntity.isCore && customEntity.source === 'manual') {
        results.push({
          success: true,
          testName: 'Sovereign Map Override',
          message: 'Successfully applied manual override',
          details: { entity: customEntity },
        });
        console.log('✅ PASS: Manual override applied with source: manual\n');
      } else {
        results.push({
          success: false,
          testName: 'Sovereign Map Override',
          message: 'Manual override not applied',
          details: { entities: result.domainMap.entities },
        });
        console.log('❌ FAIL: CustomEntity not found or not marked as manual\n');
      }
    } else {
      results.push({
        success: false,
        testName: 'Sovereign Map Override',
        message: 'Analysis failed',
        details: { error: result.error },
      });
      console.log(`❌ FAIL: ${result.error}\n`);
    }

    cleanupTestProject(testDir);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    results.push({
      success: false,
      testName: 'Sovereign Map Override',
      message: 'Test execution failed',
      details: { error: errorMessage },
    });
    console.log(`❌ FAIL: ${errorMessage}\n`);
  }

  // Test 5: Empty Schema Handling
  console.log('[TEST 5] Empty schema handling...');
  try {
    const testDir = await createTestProject('test-empty-schema');
    await createEmptySchema(testDir);

    const analyzer = new DomainAnalyzer({
      projectRoot: testDir,
      useDatabase: false,
      useAI: false,
      schemaPaths: ['supabase/migrations/*.sql'],
      actionPaths: [],
    });

    const result = await analyzer.analyze();

    if (result.success && result.domainMap) {
      const confidence = result.domainMap.overallConfidence;

      if (confidence === 0 && result.domainMap.entities.length === 0) {
        results.push({
          success: true,
          testName: 'Empty Schema Handling',
          message: 'Correctly handled empty schema with 0% confidence',
          details: { confidence },
        });
        console.log('✅ PASS: Empty schema handled correctly\n');
      } else {
        results.push({
          success: false,
          testName: 'Empty Schema Handling',
          message: 'Empty schema not handled correctly',
          details: { confidence, entityCount: result.domainMap.entities.length },
        });
        console.log(`❌ FAIL: Confidence = ${confidence}, entities = ${result.domainMap.entities.length}\n`);
      }
    } else {
      results.push({
        success: false,
        testName: 'Empty Schema Handling',
        message: 'Analysis failed',
        details: { error: result.error },
      });
      console.log(`❌ FAIL: ${result.error}\n`);
    }

    cleanupTestProject(testDir);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    results.push({
      success: false,
      testName: 'Empty Schema Handling',
      message: 'Test execution failed',
      details: { error: errorMessage },
    });
    console.log(`❌ FAIL: ${errorMessage}\n`);
  }

  return results;
}

/**
 * Creates a test project directory
 *
 * @param name - Test directory name
 * @returns Promise<string> - Path to test directory
 */
async function createTestProject(name: string): Promise<string> {
  const testDir = path.join(process.cwd(), 'test-temp', name);

  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
  }

  return testDir;
}

/**
 * Creates contradictory SQL schema (User vs users)
 *
 * @param testDir - Test directory path
 */
async function createContradictorySQLSchema(testDir: string): Promise<void> {
  const schemaDir = path.join(testDir, 'supabase', 'migrations');
  fs.mkdirSync(schemaDir, { recursive: true });

  // First migration with singular name
  const migration1 = path.join(schemaDir, '001_initial.sql');
  fs.writeFileSync(
    migration1,
    `
CREATE TABLE User (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
`
  );

  // Second migration with plural name (contradiction)
  const migration2 = path.join(schemaDir, '002_add_users.sql');
  fs.writeFileSync(
    migration2,
    `
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
`
  );
}

/**
 * Creates schema with low confidence indicators
 *
 * @param testDir - Test directory path
 */
async function createLowConfidenceSchema(testDir: string): Promise<void> {
  const schemaDir = path.join(testDir, 'supabase', 'migrations');
  fs.mkdirSync(schemaDir, { recursive: true });

  const migration = path.join(schemaDir, '001_schema.sql');
  fs.writeFileSync(
    migration,
    `
CREATE TABLE GenericTable1 (
  id SERIAL PRIMARY KEY,
  data TEXT
);

CREATE TABLE GenericTable2 (
  id SERIAL PRIMARY KEY,
  more_data TEXT
);

CREATE TABLE AnotherGeneric (
  id SERIAL PRIMARY KEY,
  extra TEXT
);
`
  );
}

/**
 * Creates schema with complex entity names
 *
 * @param testDir - Test directory path
 */
async function createComplexNameSchema(testDir: string): Promise<void> {
  const schemaDir = path.join(testDir, 'supabase', 'migrations');
  fs.mkdirSync(schemaDir, { recursive: true });

  const migration = path.join(schemaDir, '001_schema.sql');
  fs.writeFileSync(
    migration,
    `
CREATE TABLE booking (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES User(id)
);

CREATE TABLE Bookings (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER
);

CREATE TABLE booking_items (
  id SERIAL PRIMARY KEY,
  booking_id INTEGER REFERENCES booking(id)
);
`
  );
}

/**
 * Creates simple schema for map override test
 *
 * @param testDir - Test directory path
 */
async function createSimpleSchema(testDir: string): Promise<void> {
  const schemaDir = path.join(testDir, 'supabase', 'migrations');
  fs.mkdirSync(schemaDir, { recursive: true });

  const migration = path.join(schemaDir, '001_schema.sql');
  fs.writeFileSync(
    migration,
    `
CREATE TABLE SimpleTable (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255)
);
`
  );
}

/**
 * Creates sovereign.map.json for override test
 *
 * @param testDir - Test directory path
 */
async function createSovereignMap(testDir: string): Promise<void> {
  const mapPath = path.join(testDir, 'sovereign.map.json');
  const mapConfig = {
    entities: [
      {
        name: 'CustomEntity',
        type: 'table',
        fieldCount: 5,
        isCore: true,
        confidence: 1.0,
        fields: ['id', 'name', 'email', 'created_at', 'updated_at'],
        source: 'manual',
      },
    ],
    criticalPaths: [
      {
        name: 'CustomPath',
        type: 'custom',
        entities: ['CustomEntity'],
        actions: ['customAction'],
        confidence: 1.0,
      },
    ],
  };

  fs.writeFileSync(mapPath, JSON.stringify(mapConfig, null, 2));
}

/**
 * Creates empty schema
 *
 * @param testDir - Test directory path
 */
async function createEmptySchema(testDir: string): Promise<void> {
  const schemaDir = path.join(testDir, 'supabase', 'migrations');
  fs.mkdirSync(schemaDir, { recursive: true });

  const migration = path.join(schemaDir, '001_schema.sql');
  fs.writeFileSync(migration, '-- Empty migration\n');
}

/**
 * Cleans up test project directory
 *
 * @param testDir - Test directory path
 */
function cleanupTestProject(testDir: string): void {
  try {
    fs.rmSync(testDir, { recursive: true, force: true });
  } catch (error) {
    // Ignore cleanup errors
  }
}

/**
 * Main execution
 */
async function main(): Promise<void> {
  try {
    const results = await runDomainStressTests();

    console.log('\n=== TEST SUMMARY ===\n');

    const passed = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;
    const total = results.length;

    console.log(`Total Tests: ${total}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}\n`);

    if (failed === 0) {
      console.log('✅ ALL TESTS PASSED - DOMAIN ANALYZER IS ROBUST');
      console.log('\nOK');
    } else {
      console.log('❌ SOME TESTS FAILED - REVIEW FAILURES ABOVE');
      console.log('\nFAIL');
      process.exit(1);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`\n❌ TEST EXECUTION FAILED: ${errorMessage}`);
    console.log('\nFAIL');
    process.exit(1);
  }
}

// Run the test
main();
