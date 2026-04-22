/**
 * Stack Detector - Automatic Technology Stack Detection
 *
 * Purpose: Automatically detects the technology stack (React, Next.js, Node, etc.)
 * used in the project to provide intelligent default configuration.
 *
 * Security: This class uses only safe file system operations and never executes
 * arbitrary code. All file access is audited and restricted to project root.
 *
 * @module core/stack-detector
 * @since 2.0.0
 */

import * as fs from 'fs';
import * as path from 'path';

/**
 * Blocked patterns that could indicate code execution attempts
 */
const BLOCKED_PATTERNS = [
  /eval\s*\(/gi,
  /Function\s*\(/gi,
  /require\s*\(\s*[^'"]/gi, // Only allow require with string literals
  /import\s*\(/gi,
  /exec\s*\(/gi,
  /spawn\s*\(/gi,
  /child_process/gi,
];

/**
 * Detected technology stack
 */
export interface TechStack {
  /** Framework (React, Vue, Angular, Next.js, etc.) */
  framework?: string;
  /** Language (TypeScript, JavaScript, etc.) */
  language: string;
  /** Package manager (npm, yarn, pnpm) */
  packageManager: string;
  /** Build tool (Webpack, Vite, Rollup, etc.) */
  buildTool?: string;
  /** Testing framework (Jest, Vitest, Mocha, etc.) */
  testingFramework?: string;
  /** CSS framework (Tailwind, Bootstrap, etc.) */
  cssFramework?: string;
  /** Backend framework (Express, NestJS, Fastify, etc.) */
  backendFramework?: string;
  /** Database (PostgreSQL, MongoDB, MySQL, etc.) */
  database?: string;
  /** ORM/Query builder (Prisma, TypeORM, Sequelize, etc.) */
  orm?: string;
  /** Whether this is a monorepo */
  isMonorepo: boolean;
  /** Whether this is a TypeScript project */
  isTypeScript: boolean;
  /** Confidence score (0-1) */
  confidence: number;
}

/**
 * StackDetector - Automatic technology stack detection
 *
 * @class StackDetector
 */
export class StackDetector {
  private projectRoot: string;
  private auditLog: string[] = [];

  constructor(projectRoot: string) {
    this.projectRoot = path.resolve(projectRoot);
  }

  /**
   * Validates that a file path is within the project root (sandbox)
   *
   * @private
   * @param filePath - File path to validate
   * @throws {Error} If path is outside project root
   */
  private validatePath(filePath: string): void {
    const resolvedPath = path.resolve(filePath);
    const normalizedProjectRoot = path.normalize(this.projectRoot);
    const normalizedPath = path.normalize(resolvedPath);

    if (!normalizedPath.startsWith(normalizedProjectRoot)) {
      throw new Error(`[Security] Path traversal attempt detected: ${filePath} is outside project root`);
    }
  }

  /**
   * Audits a file system operation
   *
   * @private
   * @param operation - Operation performed
   * @param filePath - File path accessed
   */
  private auditOperation(operation: string, filePath: string): void {
    const entry = `[Security Audit] ${operation}: ${filePath}`;
    this.auditLog.push(entry);
    console.log(entry);
  }

  /**
   * Checks file content for blocked patterns
   *
   * @private
   * @param content - File content to check
   * @returns boolean - True if content is safe
   */
  private isContentSafe(content: string): boolean {
    for (const pattern of BLOCKED_PATTERNS) {
      if (pattern.test(content)) {
        console.warn(`[Security] Blocked pattern detected in file content: ${pattern}`);
        return false;
      }
    }
    return true;
  }

  /**
   * Safe file read with validation
   *
   * @private
   * @param filePath - File path to read
   * @returns string - File content
   * @throws {Error} If validation fails
   */
  private safeReadFile(filePath: string): string {
    this.validatePath(filePath);
    this.auditOperation('readFile', filePath);

    const content = fs.readFileSync(filePath, 'utf-8');

    if (!this.isContentSafe(content)) {
      throw new Error(`[Security] Blocked pattern detected in ${filePath}. File will not be processed.`);
    }

    return content;
  }

  /**
   * Safe file existence check with validation
   *
   * @private
   * @param filePath - File path to check
   * @returns boolean - Whether file exists
   */
  private safeExistsSync(filePath: string): boolean {
    this.validatePath(filePath);
    this.auditOperation('existsSync', filePath);
    return fs.existsSync(filePath);
  }

  /**
   * Gets the audit log
   *
   * @returns string[] - Audit log entries
   */
  getAuditLog(): string[] {
    return [...this.auditLog];
  }

  /**
   * Detects the technology stack
   *
   * @returns Promise<TechStack> - Detected technology stack
   */
  async detect(): Promise<TechStack> {
    const stack: TechStack = {
      language: 'javascript',
      packageManager: 'npm',
      isMonorepo: false,
      isTypeScript: false,
      confidence: 0,
    };

    // Detect TypeScript
    stack.isTypeScript = await this.detectTypeScript();
    stack.language = stack.isTypeScript ? 'typescript' : 'javascript';

    // Detect package manager
    stack.packageManager = await this.detectPackageManager();

    // Detect framework
    stack.framework = await this.detectFramework();

    // Detect build tool
    stack.buildTool = await this.detectBuildTool();

    // Detect testing framework
    stack.testingFramework = await this.detectTestingFramework();

    // Detect CSS framework
    stack.cssFramework = await this.detectCSSFramework();

    // Detect backend framework
    stack.backendFramework = await this.detectBackendFramework();

    // Detect database
    stack.database = await this.detectDatabase();

    // Detect ORM
    stack.orm = await this.detectORM();

    // Detect monorepo
    stack.isMonorepo = await this.detectMonorepo();

    // Calculate confidence
    stack.confidence = this.calculateConfidence(stack);

    return stack;
  }

  /**
   * Detects if project uses TypeScript
   *
   * @private
   * @returns Promise<boolean> - True if TypeScript is detected
   */
  private async detectTypeScript(): Promise<boolean> {
    try {
      // Check for tsconfig.json
      const tsconfigPath = path.join(this.projectRoot, 'tsconfig.json');
      if (this.safeExistsSync(tsconfigPath)) {
        return true;
      }

      // Check for .ts or .tsx files
      const hasTsFiles = await this.hasFilesWithExtension(['.ts', '.tsx']);
      return hasTsFiles;
    } catch {
      return false;
    }
  }

  /**
   * Detects package manager
   *
   * @private
   * @returns Promise<string> - Detected package manager
   */
  private async detectPackageManager(): Promise<string> {
    try {
      // Check for lock files
      if (this.safeExistsSync(path.join(this.projectRoot, 'yarn.lock'))) {
        return 'yarn';
      }
      if (this.safeExistsSync(path.join(this.projectRoot, 'pnpm-lock.yaml'))) {
        return 'pnpm';
      }
      if (this.safeExistsSync(path.join(this.projectRoot, 'package-lock.json'))) {
        return 'npm';
      }
    } catch {
      // Ignore errors
    }

    return 'npm'; // Default to npm
  }

  /**
   * Detects framework
   *
   * @private
   * @returns Promise<string | undefined> - Detected framework
   */
  private async detectFramework(): Promise<string | undefined> {
    try {
      const packageJsonPath = path.join(this.projectRoot, 'package.json');
      if (!this.safeExistsSync(packageJsonPath)) {
        return undefined;
      }

      const packageJson = JSON.parse(this.safeReadFile(packageJsonPath));
      const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };

      // React
      if (dependencies.react) {
        // Check for Next.js
        if (dependencies.next) {
          return 'next.js';
        }
        // Check for Remix
        if (dependencies['@remix-run/react']) {
          return 'remix';
        }
        return 'react';
      }

      // Vue
      if (dependencies.vue) {
        if (dependencies.nuxt) {
          return 'nuxt.js';
        }
        return 'vue';
      }

      // Angular
      if (dependencies['@angular/core']) {
        return 'angular';
      }

      // Svelte
      if (dependencies.svelte) {
        if (dependencies['svelte-kit']) {
          return 'svelte-kit';
        }
        return 'svelte';
      }

      // Express (backend framework)
      if (dependencies.express) {
        return 'express';
      }

      // NestJS
      if (dependencies['@nestjs/core']) {
        return 'nestjs';
      }

      // Fastify
      if (dependencies.fastify) {
        return 'fastify';
      }

      return undefined;
    } catch {
      return undefined;
    }
  }

  /**
   * Detects build tool
   *
   * @private
   * @returns Promise<string | undefined> - Detected build tool
   */
  private async detectBuildTool(): Promise<string | undefined> {
    try {
      const packageJsonPath = path.join(this.projectRoot, 'package.json');
      if (!this.safeExistsSync(packageJsonPath)) {
        return undefined;
      }

      const packageJson = JSON.parse(this.safeReadFile(packageJsonPath));
      const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };

      // Vite
      if (dependencies.vite) {
        return 'vite';
      }

      // Webpack
      if (dependencies.webpack) {
        return 'webpack';
      }

      // Rollup
      if (dependencies.rollup) {
        return 'rollup';
      }

      // esbuild
      if (dependencies.esbuild) {
        return 'esbuild';
      }

      // Next.js has its own build system
      if (dependencies.next) {
        return 'next.js';
      }

      return undefined;
    } catch {
      return undefined;
    }
  }

  /**
   * Detects testing framework
   *
   * @private
   * @returns Promise<string | undefined> - Detected testing framework
   */
  private async detectTestingFramework(): Promise<string | undefined> {
    try {
      const packageJsonPath = path.join(this.projectRoot, 'package.json');
      if (!this.safeExistsSync(packageJsonPath)) {
        return undefined;
      }

      const packageJson = JSON.parse(this.safeReadFile(packageJsonPath));
      const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };

      // Jest
      if (dependencies.jest) {
        return 'jest';
      }

      // Vitest
      if (dependencies.vitest) {
        return 'vitest';
      }

      // Mocha
      if (dependencies.mocha) {
        return 'mocha';
      }

      // Jasmine
      if (dependencies.jasmine) {
        return 'jasmine';
      }

      // Cypress
      if (dependencies.cypress) {
        return 'cypress';
      }

      // Playwright
      if (dependencies['@playwright/test']) {
        return 'playwright';
      }

      return undefined;
    } catch {
      return undefined;
    }
  }

  /**
   * Detects CSS framework
   *
   * @private
   * @returns Promise<string | undefined> - Detected CSS framework
   */
  private async detectCSSFramework(): Promise<string | undefined> {
    try {
      const packageJsonPath = path.join(this.projectRoot, 'package.json');
      if (!this.safeExistsSync(packageJsonPath)) {
        return undefined;
      }

      const packageJson = JSON.parse(this.safeReadFile(packageJsonPath));
      const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };

      // Tailwind CSS
      if (dependencies.tailwindcss) {
        return 'tailwind';
      }

      // Bootstrap
      if (dependencies.bootstrap) {
        return 'bootstrap';
      }

      // Material UI
      if (dependencies['@mui/material']) {
        return 'material-ui';
      }

      // Chakra UI
      if (dependencies['@chakra-ui/react']) {
        return 'chakra-ui';
      }

      // Ant Design
      if (dependencies.antd) {
        return 'ant-design';
      }

      return undefined;
    } catch {
      return undefined;
    }
  }

  /**
   * Detects backend framework
   *
   * @private
   * @returns Promise<string | undefined> - Detected backend framework
   */
  private async detectBackendFramework(): Promise<string | undefined> {
    try {
      const packageJsonPath = path.join(this.projectRoot, 'package.json');
      if (!this.safeExistsSync(packageJsonPath)) {
        return undefined;
      }

      const packageJson = JSON.parse(this.safeReadFile(packageJsonPath));
      const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };

      if (dependencies.express) {
        return 'express';
      }

      if (dependencies['@nestjs/core']) {
        return 'nestjs';
      }

      if (dependencies.fastify) {
        return 'fastify';
      }

      if (dependencies.koa) {
        return 'koa';
      }

      if (dependencies.hapi) {
        return 'hapi';
      }

      return undefined;
    } catch {
      return undefined;
    }
  }

  /**
   * Detects database
   *
   * @private
   * @returns Promise<string | undefined> - Detected database
   */
  private async detectDatabase(): Promise<string | undefined> {
    try {
      const packageJsonPath = path.join(this.projectRoot, 'package.json');
      if (!this.safeExistsSync(packageJsonPath)) {
        return undefined;
      }

      const packageJson = JSON.parse(this.safeReadFile(packageJsonPath));
      const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };

      if (dependencies['pg']) {
        return 'postgresql';
      }

      if (dependencies.mongodb || dependencies.mongoose) {
        return 'mongodb';
      }

      if (dependencies.mysql || dependencies.mysql2) {
        return 'mysql';
      }

      if (dependencies['@libsql/client']) {
        return 'sqlite';
      }

      if (dependencies.redis) {
        return 'redis';
      }

      return undefined;
    } catch {
      return undefined;
    }
  }

  /**
   * Detects ORM
   *
   * @private
   * @returns Promise<string | undefined> - Detected ORM
   */
  private async detectORM(): Promise<string | undefined> {
    try {
      const packageJsonPath = path.join(this.projectRoot, 'package.json');
      if (!this.safeExistsSync(packageJsonPath)) {
        return undefined;
      }

      const packageJson = JSON.parse(this.safeReadFile(packageJsonPath));
      const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };

      if (dependencies.prisma) {
        return 'prisma';
      }

      if (dependencies['@prisma/client']) {
        return 'prisma';
      }

      if (dependencies['typeorm']) {
        return 'typeorm';
      }

      if (dependencies.sequelize) {
        return 'sequelize';
      }

      if (dependencies['mikro-orm']) {
        return 'mikro-orm';
      }

      if (dependencies['drizzle-orm']) {
        return 'drizzle';
      }

      return undefined;
    } catch {
      return undefined;
    }
  }

  /**
   * Detects if project is a monorepo
   *
   * @private
   * @returns Promise<boolean> - True if monorepo detected
   */
  private async detectMonorepo(): Promise<boolean> {
    try {
      // Check for common monorepo indicators
      const monorepoIndicators = [
        'pnpm-workspace.yaml',
        'lerna.json',
        'turbo.json',
        'nx.json',
        'rush.json',
      ];

      for (const indicator of monorepoIndicators) {
        if (this.safeExistsSync(path.join(this.projectRoot, indicator))) {
          return true;
        }
      }

      // Check for packages directory
      const packagesPath = path.join(this.projectRoot, 'packages');
      if (this.safeExistsSync(packagesPath)) {
        this.auditOperation('readdirSync', packagesPath);
        const packages = fs.readdirSync(packagesPath);
        return packages.length > 1;
      }

      // Check for apps directory (common in monorepos)
      const appsPath = path.join(this.projectRoot, 'apps');
      if (this.safeExistsSync(appsPath)) {
        this.auditOperation('readdirSync', appsPath);
        const apps = fs.readdirSync(appsPath);
        return apps.length > 1;
      }

      return false;
    } catch (error) {
      return false;
    }
  }

  /**
   * Checks if project has files with specific extensions
   *
   * @private
   * @param extensions - Array of file extensions to check
   * @returns Promise<boolean> - True if files with extensions found
   */
  private async hasFilesWithExtension(extensions: string[]): Promise<boolean> {
    try {
      const scanDir = async (dir: string): Promise<boolean> => {
        this.validatePath(dir);
        this.auditOperation('readdir', dir);
        const entries = await fs.promises.readdir(dir, { withFileTypes: true });

        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);

          if (entry.isDirectory()) {
            // Skip node_modules and .git
            if (entry.name !== 'node_modules' && entry.name !== '.git' && entry.name !== '.aegis-cache') {
              const found = await scanDir(fullPath);
              if (found) return true;
            }
          } else if (extensions.some(ext => entry.name.endsWith(ext))) {
            return true;
          }
        }

        return false;
      };

      return await scanDir(this.projectRoot);
    } catch (error) {
      return false;
    }
  }

  /**
   * Calculates confidence score based on detected information
   *
   * @private
   * @param stack - Detected tech stack
   * @returns number - Confidence score (0-1)
   */
  private calculateConfidence(stack: TechStack): number {
    let score = 0;
    const maxScore = 10;

    // TypeScript detection (+2)
    if (stack.isTypeScript) score += 2;

    // Framework detection (+2)
    if (stack.framework) score += 2;

    // Build tool detection (+1)
    if (stack.buildTool) score += 1;

    // Testing framework detection (+1)
    if (stack.testingFramework) score += 1;

    // CSS framework detection (+1)
    if (stack.cssFramework) score += 1;

    // Backend framework detection (+1)
    if (stack.backendFramework) score += 1;

    // Database detection (+1)
    if (stack.database) score += 1;

    // ORM detection (+1)
    if (stack.orm) score += 1;

    return Math.min(score / maxScore, 1);
  }
}
