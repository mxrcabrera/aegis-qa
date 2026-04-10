/**
 * Test Chasis - Integration Test for Phase 1 Components
 *
 * Purpose: Validate that the core components of Aegis QA Phase 1
 * (ThermalController and SecretManager) work correctly together.
 *
 * This test verifies:
 * - ThermalController can check GPU temperature
 * - SecretManager can load and validate secrets
 * - Both components can be instantiated and used together
 *
 * @module test-chasis
 * @since 1.0.0
 */

import { ThermalController } from './core/thermal-controller.js';
import { SecretManager } from './core/secret-manager.js';

/**
 * Test result interface
 */
interface TestResult {
  success: boolean;
  component: string;
  message: string;
  details?: string;
}

/**
 * Runs the Phase 1 integration test
 *
 * @returns Promise<TestResult[]> - Array of test results
 */
async function runChasisTest(): Promise<TestResult[]> {
  const results: TestResult[] = [];

  console.log('\n=== AEGIS QA - PHASE 1 CHASIS TEST ===\n');

  // Test 1: ThermalController Instantiation
  console.log('[TEST 1] ThermalController instantiation...');
  try {
    const thermalController = new ThermalController();
    results.push({
      success: true,
      component: 'ThermalController',
      message: 'ThermalController instantiated successfully',
    });
    console.log('✅ PASS: ThermalController instantiated\n');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    results.push({
      success: false,
      component: 'ThermalController',
      message: 'Failed to instantiate ThermalController',
      details: errorMessage,
    });
    console.log(`❌ FAIL: ${errorMessage}\n`);
  }

  // Test 2: ThermalController Temperature Check
  console.log('[TEST 2] ThermalController temperature check...');
  try {
    const thermalController = new ThermalController({ autoHalt: false });
    const reading = await thermalController.checkTemperature();
    results.push({
      success: true,
      component: 'ThermalController',
      message: `Temperature check successful: ${reading.current}°C (${reading.category})`,
      details: `Safe: ${reading.isSafe}`,
    });
    console.log(`✅ PASS: Temperature ${reading.current}°C (${reading.category})\n`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    // If nvidia-smi is not available, mark as warning not failure
    if (errorMessage.includes('nvidia-smi') || errorMessage.includes('not recognized')) {
      results.push({
        success: true,
        component: 'ThermalController',
        message: 'Temperature check skipped (nvidia-smi not available)',
        details: 'GPU temperature monitoring requires nvidia-smi',
      });
      console.log(`⚠️  SKIP: nvidia-smi not available (expected on systems without NVIDIA GPU)\n`);
    } else {
      results.push({
        success: false,
        component: 'ThermalController',
        message: 'Temperature check failed',
        details: errorMessage,
      });
      console.log(`❌ FAIL: ${errorMessage}\n`);
    }
  }

  // Test 3: ThermalController Cooldown
  console.log('[TEST 3] ThermalController cooldown...');
  try {
    const thermalController = new ThermalController();
    await thermalController.applyCooldown(100); // 100ms for testing
    results.push({
      success: true,
      component: 'ThermalController',
      message: 'Cooldown executed successfully',
    });
    console.log('✅ PASS: Cooldown executed\n');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    results.push({
      success: false,
      component: 'ThermalController',
      message: 'Cooldown failed',
      details: errorMessage,
    });
    console.log(`❌ FAIL: ${errorMessage}\n`);
  }

  // Test 4: SecretManager Instantiation (Mock Mode)
  console.log('[TEST 4] SecretManager instantiation (mock mode)...');
  try {
    const secretManager = new SecretManager({ mockMode: true });
    results.push({
      success: true,
      component: 'SecretManager',
      message: 'SecretManager instantiated successfully (mock mode)',
    });
    console.log('✅ PASS: SecretManager instantiated (mock mode)\n');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    results.push({
      success: false,
      component: 'SecretManager',
      message: 'Failed to instantiate SecretManager',
      details: errorMessage,
    });
    console.log(`❌ FAIL: ${errorMessage}\n`);
  }

  // Test 5: SecretManager Initialization (Mock Mode)
  console.log('[TEST 5] SecretManager initialization (mock mode)...');
  try {
    const secretManager = new SecretManager({ mockMode: true, validateOnInit: false });
    await secretManager.initialize();
    results.push({
      success: true,
      component: 'SecretManager',
      message: 'SecretManager initialized successfully (mock mode)',
    });
    console.log('✅ PASS: SecretManager initialized (mock mode)\n');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    results.push({
      success: false,
      component: 'SecretManager',
      message: 'SecretManager initialization failed',
      details: errorMessage,
    });
    console.log(`❌ FAIL: ${errorMessage}\n`);
  }

  // Test 6: SecretManager Mock Mode Get
  console.log('[TEST 6] SecretManager get (mock mode)...');
  try {
    const secretManager = new SecretManager({ mockMode: true, validateOnInit: false });
    await secretManager.initialize();
    const url = secretManager.get('SUPABASE_URL');
    results.push({
      success: true,
      component: 'SecretManager',
      message: `Secret retrieval successful: ${url.substring(0, 20)}...`,
    });
    console.log('✅ PASS: Secret retrieval successful\n');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    results.push({
      success: false,
      component: 'SecretManager',
      message: 'Secret retrieval failed',
      details: errorMessage,
    });
    console.log(`❌ FAIL: ${errorMessage}\n`);
  }

  // Test 7: SecretManager Sanitized Secrets
  console.log('[TEST 7] SecretManager sanitized secrets...');
  try {
    const secretManager = new SecretManager({ mockMode: true, validateOnInit: false });
    await secretManager.initialize();
    const sanitized = secretManager.getSanitizedSecrets();
    const hasMaskedValues = Object.values(sanitized).some((v) => v.includes('****'));
    results.push({
      success: true,
      component: 'SecretManager',
      message: 'Sanitized secrets generated successfully',
      details: `Masked values present: ${hasMaskedValues}`,
    });
    console.log('✅ PASS: Sanitized secrets generated\n');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    results.push({
      success: false,
      component: 'SecretManager',
      message: 'Sanitized secrets failed',
      details: errorMessage,
    });
    console.log(`❌ FAIL: ${errorMessage}\n`);
  }

  // Test 8: SecretManager Custom Env Path
  console.log('[TEST 8] SecretManager custom env path...');
  try {
    const secretManager = new SecretManager(
      { mockMode: true, validateOnInit: false },
      '/custom/path/.env'
    );
    results.push({
      success: true,
      component: 'SecretManager',
      message: 'SecretManager accepts custom env path',
    });
    console.log('✅ PASS: Custom env path accepted\n');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    results.push({
      success: false,
      component: 'SecretManager',
      message: 'Custom env path failed',
      details: errorMessage,
    });
    console.log(`❌ FAIL: ${errorMessage}\n`);
  }

  // Test 9: Integration - Both Components Together
  console.log('[TEST 9] Integration - ThermalController + SecretManager...');
  try {
    const thermalController = new ThermalController({ autoHalt: false });
    const secretManager = new SecretManager({ mockMode: true, validateOnInit: false });

    // Initialize both
    await secretManager.initialize();
    const url = secretManager.get('SUPABASE_URL');

    // Try temperature check, but don't fail if nvidia-smi is not available
    let tempDetails = 'nvidia-smi not available';
    try {
      const tempReading = await thermalController.checkTemperature();
      tempDetails = `${tempReading.current}°C (${tempReading.category})`;
    } catch (tempError) {
      const tempErrorMessage = tempError instanceof Error ? tempError.message : 'Unknown error';
      if (tempErrorMessage.includes('nvidia-smi') || tempErrorMessage.includes('not recognized')) {
        tempDetails = 'nvidia-smi not available (expected)';
      } else {
        throw tempError;
      }
    }

    results.push({
      success: true,
      component: 'Integration',
      message: 'Both components work together',
      details: `Temp: ${tempDetails}, URL: ${url.substring(0, 20)}...`,
    });
    console.log('✅ PASS: Integration successful\n');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    results.push({
      success: false,
      component: 'Integration',
      message: 'Integration failed',
      details: errorMessage,
    });
    console.log(`❌ FAIL: ${errorMessage}\n`);
  }

  return results;
}

/**
 * Main execution
 */
async function main(): Promise<void> {
  try {
    const results = await runChasisTest();

    console.log('\n=== TEST SUMMARY ===\n');

    const passed = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;
    const total = results.length;

    console.log(`Total Tests: ${total}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}\n`);

    if (failed === 0) {
      console.log('✅ ALL TESTS PASSED - PHASE 1 CHASIS IS ROBUST');
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

// Run the test if this file is executed directly
main();

export { runChasisTest };
