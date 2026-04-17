/**
 * Compatibility Matrix - Platform Compatibility Testing
 *
 * Purpose: Tests Aegis QA compatibility across different Node.js versions
 * and operating systems (Windows/Mac/Linux) to ensure cross-platform support.
 *
 * @module tests/compatibility-matrix
 * @since 2.0.0
 */

import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Platform information
 */
export interface PlatformInfo {
  /** Operating system */
  os: string;
  /** OS version */
  osVersion: string;
  /** Node.js version */
  nodeVersion: string;
  /** Node.js major version */
  nodeMajor: number;
  /** Architecture */
  arch: string;
  /** Platform identifier */
  platform: NodeJS.Platform;
}

/**
 * Compatibility test result
 */
export interface CompatibilityTestResult {
  /** Platform information */
  platform: PlatformInfo;
  /** Node.js version check */
  nodeVersionCheck: boolean;
  /** Platform-specific features check */
  platformFeaturesCheck: boolean;
  /** File system operations check */
  fsOperationsCheck: boolean;
  /** Process operations check */
  processOperationsCheck: boolean;
  /** Overall compatibility */
  compatible: boolean;
  /** Warnings */
  warnings: string[];
  /** Errors */
  errors: string[];
}

/**
 * Compatibility Matrix - Platform compatibility testing
 *
 * @class CompatibilityMatrix
 */
export class CompatibilityMatrix {
  private requiredNodeMajor: number = 18;
  private supportedPlatforms: NodeJS.Platform[] = ['win32', 'darwin', 'linux'];
  private supportedArchs: string[] = ['x64', 'arm64'];

  /**
   * Gets current platform information
   *
   * @returns PlatformInfo - Platform information
   */
  getPlatformInfo(): PlatformInfo {
    return {
      os: os.type(),
      osVersion: os.release(),
      nodeVersion: process.version,
      nodeMajor: parseInt(process.version.slice(1).split('.')[0], 10),
      arch: os.arch(),
      platform: os.platform(),
    };
  }

  /**
   * Runs compatibility test
   *
   * @returns Promise<CompatibilityTestResult> - Compatibility test result
   */
  async runTest(): Promise<CompatibilityTestResult> {
    console.log('🔍 Running Compatibility Matrix Test\n');

    const platform = this.getPlatformInfo();
    const result: CompatibilityTestResult = {
      platform,
      nodeVersionCheck: false,
      platformFeaturesCheck: false,
      fsOperationsCheck: false,
      processOperationsCheck: false,
      compatible: false,
      warnings: [],
      errors: [],
    };

    console.log(`📊 Platform Information:`);
    console.log(`   OS: ${platform.os} ${platform.osVersion}`);
    console.log(`   Platform: ${platform.platform}`);
    console.log(`   Architecture: ${platform.arch}`);
    console.log(`   Node.js: ${platform.nodeVersion}\n`);

    // Test Node.js version
    result.nodeVersionCheck = this.testNodeVersion(platform);
    if (!result.nodeVersionCheck) {
      result.errors.push(`Node.js version ${platform.nodeVersion} is not supported (requires >= v${this.requiredNodeMajor})`);
    }

    // Test platform support
    if (!this.supportedPlatforms.includes(platform.platform)) {
      result.warnings.push(`Platform ${platform.platform} may not be fully supported`);
    }

    // Test architecture
    if (!this.supportedArchs.includes(platform.arch)) {
      result.warnings.push(`Architecture ${platform.arch} may not be fully supported`);
    }

    // Test platform-specific features
    const platformFeaturesResult = await this.testPlatformFeatures(platform);
    result.platformFeaturesCheck = platformFeaturesResult.passed;
    result.warnings.push(...platformFeaturesResult.warnings);
    if (!result.platformFeaturesCheck) {
      result.warnings.push('Some platform-specific features may not work correctly');
    }

    // Test file system operations
    result.fsOperationsCheck = await this.testFSOperations(platform);
    if (!result.fsOperationsCheck) {
      result.errors.push('File system operations failed');
    }

    // Test process operations
    result.processOperationsCheck = this.testProcessOperations(platform);
    if (!result.processOperationsCheck) {
      result.errors.push('Process operations failed');
    }

    // Determine overall compatibility
    result.compatible = result.nodeVersionCheck && result.fsOperationsCheck && result.processOperationsCheck;

    this.printResult(result);
    return result;
  }

  /**
   * Tests Node.js version compatibility
   *
   * @private
   * @param platform - Platform information
   * @returns boolean - Whether Node.js version is compatible
   */
  private testNodeVersion(platform: PlatformInfo): boolean {
    const compatible = platform.nodeMajor >= this.requiredNodeMajor;
    console.log(`✅ Node.js version check: ${compatible ? 'PASS' : 'FAIL'} (${platform.nodeVersion} >= v${this.requiredNodeMajor})`);
    return compatible;
  }

  /**
   * Tests platform-specific features
   *
   * @private
   * @param platform - Platform information
   * @returns Promise<{ passed: boolean; warnings: string[] }> - Test result with warnings
   */
  private async testPlatformFeatures(platform: PlatformInfo): Promise<{ passed: boolean; warnings: string[] }> {
    const warnings: string[] = [];

    try {
      // Test path operations (platform-specific)
      const testPath = platform.platform === 'win32' ? 'C:\\Windows' : '/tmp';
      fs.accessSync(testPath);

      // Test environment variables
      process.env.AEGIS_COMPAT_TEST = 'test';
      delete process.env.AEGIS_COMPAT_TEST;

      // Test OS-specific operations
      if (platform.platform === 'win32') {
        // Windows-specific test
        const homedir = os.homedir();
        if (!homedir) {
          warnings.push('Could not determine Windows home directory');
        }
      } else {
        // Unix-specific test
        const tmpdir = os.tmpdir();
        if (!tmpdir) {
          warnings.push('Could not determine Unix temp directory');
        }
      }

      console.log('✅ Platform features check: PASS');
      return { passed: true, warnings };
    } catch (error) {
      console.log(`❌ Platform features check: FAIL (${error instanceof Error ? error.message : String(error)})`);
      return { passed: false, warnings };
    }
  }

  /**
   * Tests file system operations
   *
   * @private
   * @param platform - Platform information
   * @returns Promise<boolean> - Whether FS operations work correctly
   */
  private async testFSOperations(platform: PlatformInfo): Promise<boolean> {
    try {
      const testDir = path.join(os.tmpdir(), 'aegis-compat-test');
      const testFile = path.join(testDir, 'test.txt');

      // Create directory
      await fs.promises.mkdir(testDir, { recursive: true });

      // Write file
      await fs.promises.writeFile(testFile, 'test content', 'utf-8');

      // Read file
      const content = await fs.promises.readFile(testFile, 'utf-8');
      if (content !== 'test content') {
        throw new Error('File content mismatch');
      }

      // Check file stats
      const stats = await fs.promises.stat(testFile);
      if (!stats.isFile()) {
        throw new Error('Not a file');
      }

      // List directory
      const entries = await fs.promises.readdir(testDir);
      if (!entries.includes('test.txt')) {
        throw new Error('File not found in directory listing');
      }

      // Cleanup
      await fs.promises.unlink(testFile);
      await fs.promises.rmdir(testDir);

      console.log('✅ File system operations check: PASS');
      return true;
    } catch (error) {
      console.log(`❌ File system operations check: FAIL (${error instanceof Error ? error.message : String(error)})`);
      return false;
    }
  }

  /**
   * Tests process operations
   *
   * @private
   * @param platform - Platform information
   * @returns boolean - Whether process operations work correctly
   */
  private testProcessOperations(platform: PlatformInfo): boolean {
    try {
      // Test process memory usage
      const memory = process.memoryUsage();
      if (!memory || memory.heapUsed <= 0) {
        throw new Error('Invalid memory usage data');
      }

      // Test process uptime
      const uptime = process.uptime();
      if (uptime < 0) {
        throw new Error('Invalid uptime');
      }

      // Test process PID
      const pid = process.pid;
      if (pid <= 0) {
        throw new Error('Invalid PID');
      }

      // Test process platform
      const currentPlatform = process.platform;
      if (currentPlatform !== platform.platform) {
        throw new Error('Platform mismatch');
      }

      // Test process arch
      const arch = process.arch;
      if (arch !== platform.arch) {
        throw new Error('Architecture mismatch');
      }

      console.log('✅ Process operations check: PASS');
      return true;
    } catch (error) {
      console.log(`❌ Process operations check: FAIL (${error instanceof Error ? error.message : String(error)})`);
      return false;
    }
  }

  /**
   * Prints compatibility test result
   *
   * @private
   * @param result - Compatibility test result
   */
  private printResult(result: CompatibilityTestResult): void {
    console.log('\n' + '='.repeat(60));
    console.log('📊 Compatibility Matrix Test Result');
    console.log('='.repeat(60));

    console.log(`\nOverall: ${result.compatible ? '✅ COMPATIBLE' : '❌ NOT COMPATIBLE'}`);

    console.log('\nChecks:');
    console.log(`  Node.js version: ${result.nodeVersionCheck ? '✅' : '❌'}`);
    console.log(`  Platform features: ${result.platformFeaturesCheck ? '✅' : '❌'}`);
    console.log(`  File system: ${result.fsOperationsCheck ? '✅' : '❌'}`);
    console.log(`  Process operations: ${result.processOperationsCheck ? '✅' : '❌'}`);

    if (result.warnings.length > 0) {
      console.log('\nWarnings:');
      result.warnings.forEach(warning => console.log(`  ⚠️  ${warning}`));
    }

    if (result.errors.length > 0) {
      console.log('\nErrors:');
      result.errors.forEach(error => console.log(`  ❌ ${error}`));
    }

    console.log('='.repeat(60) + '\n');
  }

  /**
   * Generates compatibility matrix report
   *
   * @param result - Compatibility test result
   * @returns string - Report in markdown format
   */
  generateReport(result: CompatibilityTestResult): string {
    const timestamp = new Date().toISOString();

    let report = `# Compatibility Matrix Report\n\n`;
    report += `**Generated:** ${timestamp}\n\n`;

    report += `## Platform Information\n\n`;
    report += `- **OS:** ${result.platform.os} ${result.platform.osVersion}\n`;
    report += `- **Platform:** ${result.platform.platform}\n`;
    report += `- **Architecture:** ${result.platform.arch}\n`;
    report += `- **Node.js:** ${result.platform.nodeVersion}\n\n`;

    report += `## Compatibility Status\n\n`;
    report += `- **Overall:** ${result.compatible ? '✅ COMPATIBLE' : '❌ NOT COMPATIBLE'}\n\n`;

    report += `## Check Results\n\n`;
    report += `| Check | Status |\n`;
    report += `|-------|--------|\n`;
    report += `| Node.js version | ${result.nodeVersionCheck ? '✅ PASS' : '❌ FAIL'} |\n`;
    report += `| Platform features | ${result.platformFeaturesCheck ? '✅ PASS' : '❌ FAIL'} |\n`;
    report += `| File system | ${result.fsOperationsCheck ? '✅ PASS' : '❌ FAIL'} |\n`;
    report += `| Process operations | ${result.processOperationsCheck ? '✅ PASS' : '❌ FAIL'} |\n\n`;

    if (result.warnings.length > 0) {
      report += `## Warnings\n\n`;
      result.warnings.forEach(warning => {
        report += `- ⚠️  ${warning}\n`;
      });
      report += '\n';
    }

    if (result.errors.length > 0) {
      report += `## Errors\n\n`;
      result.errors.forEach(error => {
        report += `- ❌ ${error}\n`;
      });
      report += '\n';
    }

    return report;
  }

  /**
   * Saves compatibility report to file
   *
   * @param result - Compatibility test result
   * @param outputPath - Output file path
   * @returns Promise<void>
   */
  async saveReport(result: CompatibilityTestResult, outputPath: string): Promise<void> {
    const report = this.generateReport(result);
    await fs.promises.writeFile(outputPath, report, 'utf-8');
    console.log(`📄 Compatibility report saved to: ${outputPath}`);
  }

  /**
   * Runs full compatibility matrix test and saves report
   *
   * @param outputPath - Output file path for report
   * @returns Promise<CompatibilityTestResult> - Compatibility test result
   */
  async runAndSaveReport(outputPath: string): Promise<CompatibilityTestResult> {
    const result = await this.runTest();
    await this.saveReport(result, outputPath);
    return result;
  }

  /**
   * Gets supported Node.js versions
   *
   * @static
   * @returns string[] - Supported Node.js versions
   */
  static getSupportedNodeVersions(): string[] {
    return ['18.x', '20.x', '22.x'];
  }

  /**
   * Gets supported platforms
   *
   * @static
   * @returns string[] - Supported platforms
   */
  static getSupportedPlatforms(): string[] {
    return ['Windows (win32)', 'macOS (darwin)', 'Linux (linux)'];
  }

  /**
   * Gets supported architectures
   *
   * @static
   * @returns string[] - Supported architectures
   */
  static getSupportedArchitectures(): string[] {
    return ['x64', 'arm64'];
  }
}
