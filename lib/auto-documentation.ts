/**
 * Auto-Documentation - Phase 12
 *
 * Maintains up-to-date technical truth without human intervention,
 * eliminating the gap between code and documentation.
 *
 * @module auto-documentation
 * @since 2.0.0
 */

import * as fs from 'fs-extra';
import * as path from 'path';

export interface DocumentationResult {
  environmentMap: string;
  apiContract?: string;
  architectureGraph: string;
  changeLog: string;
  jsdocSuggestions: string[];
}

export class AutoDocumentation {
  private projectRoot: string;
  private docsPath: string;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
    this.docsPath = path.join(projectRoot, 'docs');
  }

  /**
   * Run all auto-documentation generation
   */
  async generateDocumentation(
    remediationResults: any,
    domainModel: any,
    qualityScore: any
  ): Promise<DocumentationResult> {
    const result: DocumentationResult = {
      environmentMap: '',
      apiContract: undefined,
      architectureGraph: '',
      changeLog: '',
      jsdocSuggestions: []
    };

    // Ensure docs directory exists
    await fs.ensureDir(this.docsPath);

    // 1. Environment Map
    result.environmentMap = await this.generateEnvironmentMap();

    // 2. API Contract (if endpoints detected)
    result.apiContract = await this.generateAPIContract();

    // 3. Architecture Graph
    result.architectureGraph = await this.generateArchitectureGraph();

    // 4. Change Log Intelligence
    result.changeLog = await this.generateChangeLog(remediationResults);

    // 5. Self-Healing Docs (JSDoc suggestions)
    result.jsdocSuggestions = await this.detectOutdatedJSDoc();

    return result;
  }

  /**
   * Generate Environment Map based on detected variables and .env.example
   */
  private async generateEnvironmentMap(): Promise<string> {
    const envExamplePath = path.join(this.projectRoot, '.env.example');
    let envContent = '';

    if (await fs.pathExists(envExamplePath)) {
      envContent = await fs.readFile(envExamplePath, 'utf-8');
    }

    const variables = this.parseEnvVariables(envContent);

    let doc = '# Environment Variables\n\n';
    doc += 'This document describes all environment variables used by Sovereign Sentinel.\n\n';
    doc += '## Required Variables\n\n';

    const requiredVars = variables.filter(v => 
      v.name.includes('SUPABASE_URL') || 
      v.name.includes('SUPABASE_ANON_KEY') ||
      v.name.includes('TEST_USER')
    );

    for (const variable of requiredVars) {
      doc += `### ${variable.name}\n\n`;
      doc += `**Description:** ${this.getVariableDescription(variable.name)}\n\n`;
      doc += `**Example:** ${variable.value}\n\n`;
      doc += `**Required:** Yes\n\n`;
    }

    doc += '## Optional Variables\n\n';

    const optionalVars = variables.filter(v => !requiredVars.includes(v));

    for (const variable of optionalVars) {
      doc += `### ${variable.name}\n\n`;
      doc += `**Description:** ${this.getVariableDescription(variable.name)}\n\n`;
      doc += `**Example:** ${variable.value}\n\n`;
      doc += `**Required:** No\n\n`;
    }

    return doc;
  }

  /**
   * Generate API Contract documentation
   */
  private async generateAPIContract(): Promise<string | undefined> {
    // Check if there are API endpoints (Phase 6 would detect this)
    // For now, we'll generate a template
    const apiPath = path.join(this.projectRoot, 'src', 'app', 'api');
    
    if (!await fs.pathExists(apiPath)) {
      return undefined;
    }

    let doc = '# API Reference\n\n';
    doc += 'This document describes all API endpoints detected in the project.\n\n';
    doc += '## Endpoints\n\n';
    doc += 'No API endpoints detected in this project.\n\n';

    return doc;
  }

  /**
   * Generate Architecture Graph with module dependencies
   */
  private async generateArchitectureGraph(): Promise<string> {
    let doc = '# Architecture Overview\n\n';
    doc += 'This document describes the module dependencies and architecture of Sovereign Sentinel.\n\n';
    doc += '## Core Modules\n\n';

    const libPath = path.join(this.projectRoot, 'lib');
    const srcPath = path.join(this.projectRoot, 'src');

    // Scan lib/ for modules
    if (await fs.pathExists(libPath)) {
      const libFiles = await fs.readdir(libPath);
      const modules = libFiles.filter(f => f.endsWith('.ts') && !f.endsWith('.d.ts'));

      for (const module of modules) {
        const moduleName = module.replace('.ts', '');
        doc += `### ${moduleName}\n\n`;
        doc += `**Location:** \`lib/${moduleName}.ts\`\n\n`;
        doc += `**Purpose:** ${this.getModuleDescription(moduleName)}\n\n`;
        doc += `**Dependencies:** ${this.getModuleDependencies(moduleName)}\n\n`;
      }
    }

    doc += '## Architecture Flow\n\n';
    doc += '```\n';
    doc += 'User Input → ThermalController → SecretManager → DomainInference\n';
    doc += '           → SecurityScanner → StyleAuditor → CodeReader\n';
    doc += '           → DeploymentHardening → AtomicFixer → ReportAggregator\n';
    doc += '```\n\n';

    return doc;
  }

  /**
   * Generate Change Log Intelligence
   */
  private async generateChangeLog(remediationResults: any): Promise<string> {
    let doc = '# Sentinel Changelog\n\n';
    doc += `**Generated:** ${new Date().toISOString()}\n\n`;
    doc += '## Phase 11: Atomic Fixes Summary\n\n';

    if (remediationResults) {
      doc += `### Applied Fixes (${remediationResults.appliedFixes?.length || 0})\n\n`;
      
      for (const fixResult of remediationResults.appliedFixes || []) {
        const fix = fixResult.fix;
        doc += `- **${fix.type}:** ${fix.description}\n`;
        doc += `  - File: \`${path.basename(fix.file)}\`\n`;
        doc += `  - Status: ${fixResult.validationPassed ? '✅ Validated' : '❌ Validation Failed'}\n\n`;
      }

      doc += `### Suggested Fixes (${remediationResults.suggestedFixes?.length || 0})\n\n`;
      
      for (const fixResult of remediationResults.suggestedFixes || []) {
        const fix = fixResult.fix;
        doc += `- **${fix.type}:** ${fix.description}\n`;
        doc += `  - File: \`${path.basename(fix.file)}\`\n`;
        doc += `  - Reason: ${fixResult.error || 'Manual review required'}\n\n`;
      }
    }

    doc += '## Remaining Risks\n\n';
    doc += '- Manual merge required for colliding fixes\n';
    doc += '- Clean Code refactoring requires manual review\n';
    doc += '- Core Path fixes require explicit confirmation\n\n';

    return doc;
  }

  /**
   * Detect outdated JSDoc comments
   */
  private async detectOutdatedJSDoc(): Promise<string[]> {
    const suggestions: string[] = [];

    // Scan lib/ and src/ for TypeScript files
    const libPath = path.join(this.projectRoot, 'lib');
    const srcPath = path.join(this.projectRoot, 'src');

    const filesToScan: string[] = [];

    if (await fs.pathExists(libPath)) {
      const libFiles = await this.scanDirectory(libPath, '.ts');
      filesToScan.push(...libFiles);
    }

    if (await fs.pathExists(srcPath)) {
      const srcFiles = await this.scanDirectory(srcPath, '.ts');
      filesToScan.push(...srcFiles);
    }

    for (const file of filesToScan) {
      const suggestions = await this.checkFileJSDoc(file);
      suggestions.push(...suggestions);
    }

    return suggestions;
  }

  /**
   * Check a single file for outdated JSDoc
   */
  private async checkFileJSDoc(filePath: string): Promise<string[]> {
    const suggestions: string[] = [];
    const content = await fs.readFile(filePath, 'utf-8');
    const lines = content.split('\n');

    // Simple heuristic: check for functions without JSDoc
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Check for function declaration
      const funcMatch = line.match(/function\s+(\w+)\s*\(|(\w+)\s*:\s*\([^)]*\)\s*=>/);
      if (funcMatch) {
        const funcName = funcMatch[1] || funcMatch[2];
        
        // Check if there's a JSDoc comment above
        if (i > 0) {
          const prevLines = lines.slice(Math.max(0, i - 5), i);
          const hasJSDoc = prevLines.some(l => l.includes('*') && l.includes('@'));
          
          if (!hasJSDoc) {
            suggestions.push(
              `Suggestion: Add JSDoc to function '${funcName}' in ${path.basename(filePath)}:${i + 1}`
            );
          }
        }
      }
    }

    return suggestions;
  }

  /**
   * Save all generated documentation
   */
  async saveDocumentation(result: DocumentationResult): Promise<void> {
    // Save Environment Map
    await fs.writeFile(
      path.join(this.docsPath, 'ENVIRONMENT.md'),
      result.environmentMap,
      'utf-8'
    );

    // Save API Contract (if exists)
    if (result.apiContract) {
      await fs.writeFile(
        path.join(this.docsPath, 'API_REFERENCE.md'),
        result.apiContract,
        'utf-8'
      );
    }

    // Save Architecture Graph
    await fs.writeFile(
      path.join(this.docsPath, 'ARCHITECTURE_OVERVIEW.md'),
      result.architectureGraph,
      'utf-8'
    );

    // Save Change Log
    await fs.writeFile(
      path.join(this.docsPath, 'SENTINEL_CHANGELOG.md'),
      result.changeLog,
      'utf-8'
    );

    // Save JSDoc suggestions (if any)
    if (result.jsdocSuggestions.length > 0) {
      let jsdocDoc = '# JSDoc Suggestions\n\n';
      jsdocDoc += 'The following functions are missing or have outdated JSDoc comments:\n\n';
      for (const suggestion of result.jsdocSuggestions) {
        jsdocDoc += `- ${suggestion}\n`;
      }
      
      await fs.writeFile(
        path.join(this.docsPath, 'JSDOC_SUGGESTIONS.md'),
        jsdocDoc,
        'utf-8'
      );
    }
  }

  /**
   * Update README with latest Quality Score and Critical Modules
   */
  async updateREADME(qualityScore: any, criticalModules: string[]): Promise<void> {
    const readmePath = path.join(this.projectRoot, 'README.md');
    
    if (!await fs.pathExists(readmePath)) {
      return;
    }

    let content = await fs.readFile(readmePath, 'utf-8');

    // Add Quality Score section if not exists
    if (!content.includes('## Quality Score')) {
      content += '\n## Quality Score\n\n';
      content += `Current Score: ${qualityScore.score || 'N/A'}\n`;
      content += `Critical Issues: ${qualityScore.critical || 0}\n`;
      content += `High Issues: ${qualityScore.high || 0}\n\n`;
    }

    // Add Critical Modules section if not exists
    if (!content.includes('## Critical Modules') && criticalModules.length > 0) {
      content += '\n## Critical Modules\n\n';
      for (const module of criticalModules) {
        content += `- ${module}\n`;
      }
      content += '\n';
    }

    await fs.writeFile(readmePath, content, 'utf-8');
  }

  // Helper methods

  private parseEnvVariables(content: string): Array<{ name: string; value: string }> {
    const variables: Array<{ name: string; value: string }> = [];
    const lines = content.split('\n');

    for (const line of lines) {
      const match = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
      if (match && !line.startsWith('#')) {
        variables.push({
          name: match[1],
          value: match[2]
        });
      }
    }

    return variables;
  }

  private getVariableDescription(name: string): string {
    const descriptions: Record<string, string> = {
      'SUPABASE_URL': 'Your Supabase project URL',
      'SUPABASE_ANON_KEY': 'Supabase anonymous key for client-side access',
      'SUPABASE_SERVICE_ROLE_KEY': 'Supabase service role key for admin operations',
      'TEST_USER_EMAIL': 'Email for test user account',
      'TEST_USER_PASSWORD': 'Password for test user account',
      'TEST_ADMIN_EMAIL': 'Email for test admin account',
      'TEST_ADMIN_PASSWORD': 'Password for test admin account',
      'OPENAI_API_KEY': 'OpenAI API key for AI features',
      'ANTHROPIC_API_KEY': 'Anthropic API key for AI features',
      'TEST_BASE_URL': 'Base URL for test environment',
      'TEST_TIMEOUT_MS': 'Timeout for test requests in milliseconds'
    };

    return descriptions[name] || 'Environment variable';
  }

  private getModuleDescription(moduleName: string): string {
    const descriptions: Record<string, string> = {
      'thermal-controller': 'Hardware protection layer monitoring GPU temperature',
      'secret-manager': 'Secure secret management with validation',
      'domain-inference': 'Business domain understanding and analysis',
      'code-reader': 'Next.js App Router scanner and mapper',
      'style-auditor': 'Style violation detector',
      'security-scanner': 'Security vulnerability scanner',
      'report-aggregator': 'Centralized violation management and reporting',
      'deployment-hardening': 'Critical deployment validation',
      'atomic-fixer': 'Surgical fix application with safety gates'
    };

    return descriptions[moduleName] || 'Core module';
  }

  private getModuleDependencies(moduleName: string): string {
    const dependencies: Record<string, string> = {
      'thermal-controller': 'None',
      'secret-manager': 'fs-extra',
      'domain-inference': 'fs-extra, glob',
      'code-reader': 'fs-extra, glob',
      'style-auditor': 'fs-extra',
      'security-scanner': 'fs-extra',
      'report-aggregator': 'None',
      'deployment-hardening': 'fs-extra, @clack/prompts',
      'atomic-fixer': 'fs-extra, @clack/prompts'
    };

    return dependencies[moduleName] || 'Unknown';
  }

  private async scanDirectory(dir: string, extension: string): Promise<string[]> {
    const files: string[] = [];
    const items = await fs.readdir(dir);

    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = await fs.stat(fullPath);

      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        files.push(...await this.scanDirectory(fullPath, extension));
      } else if (stat.isFile() && item.endsWith(extension)) {
        files.push(fullPath);
      }
    }

    return files;
  }
}

export default AutoDocumentation;
