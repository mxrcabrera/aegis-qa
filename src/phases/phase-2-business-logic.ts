/**
 * Phase 2: Business Logic - Business Semantics & Core Path Detection
 *
 * Purpose: Deduce the business purpose of the repository to prioritize the subsequent 18 phases.
 * This is about "Business Semantics" - Aegis must know if it's analyzing a toy or a financial engine.
 *
 * Architecture:
 * - Stack & Niche Detection: Analyze package.json dependencies and README.md keywords
 * - Core Path Identification: Detect critical folders (/services, /api/v1, /core, /lib)
 * - Risk Cross-Reference: Combine Core Path with Phase 1 Quality Scores
 * - BusinessProfile Generation: Store business context in StatePersistence
 *
 * @module phases/phase-2-business-logic
 * @since 2.0.0
 */

import * as fs from 'fs';
import * as path from 'path';
import { StatePersistence, type ExecutionState } from '../core/state-persistence.js';

/**
 * Business domain types
 */
type BusinessDomain = 
  | 'Fintech' 
  | 'Health' 
  | 'E-Commerce' 
  | 'SaaS' 
  | 'Tooling' 
  | 'Education' 
  | 'Media' 
  | 'Gaming' 
  | 'IoT' 
  | 'General';

/**
 * Dependency domain mapping
 */
const DEPENDENCY_DOMAINS: Record<string, BusinessDomain> = {
  // Fintech
  'stripe': 'Fintech',
  'mercadopago': 'Fintech',
  'paypal': 'Fintech',
  'braintree': 'Fintech',
  'plaid': 'Fintech',
  'square': 'Fintech',
  'quickbooks': 'Fintech',
  'xero': 'Fintech',

  // Health
  'fhir': 'Health',
  'hl7': 'Health',
  'epic': 'Health',
  'cerner': 'Health',
  'athenahealth': 'Health',

  // E-Commerce
  'shopify': 'E-Commerce',
  'woocommerce': 'E-Commerce',
  'magento': 'E-Commerce',
  'bigcommerce': 'E-Commerce',
  'prestashop': 'E-Commerce',

  // SaaS
  'auth0': 'SaaS',
  'okta': 'SaaS',
  'clerk': 'SaaS',
  'supabase': 'SaaS',
  'firebase': 'SaaS',
  'amplify': 'SaaS',

  // Tooling
  'eslint': 'Tooling',
  'prettier': 'Tooling',
  'jest': 'Tooling',
  'vitest': 'Tooling',
  'cypress': 'Tooling',
  'playwright': 'Tooling',
  'webpack': 'Tooling',
  'vite': 'Tooling',
  'rollup': 'Tooling',
  'turbopack': 'Tooling',

  // Education
  'canvas': 'Education',
  'blackboard': 'Education',
  'moodle': 'Education',
  'edmodo': 'Education',

  // Media
  'ffmpeg': 'Media',
  'sharp': 'Media',
  'jimp': 'Media',
  'cloudinary': 'Media',
  'imgix': 'Media',

  // Gaming
  'phaser': 'Gaming',
  'three': 'Gaming',
  'babylonjs': 'Gaming',
  'pixi': 'Gaming',

  // IoT
  'mqtt': 'IoT',
  'socket.io': 'IoT',
  'bluetooth': 'IoT',
  'zigbee': 'IoT',
};

/**
 * README keyword domain mapping
 */
const KEYWORD_DOMAINS: Record<string, BusinessDomain> = {
  'fintech': 'Fintech',
  'payment': 'Fintech',
  'banking': 'Fintech',
  'finance': 'Fintech',
  'financial': 'Fintech',
  'trading': 'Fintech',
  'investment': 'Fintech',

  'health': 'Health',
  'medical': 'Health',
  'hospital': 'Health',
  'clinic': 'Health',
  'patient': 'Health',
  'doctor': 'Health',
  'pharmacy': 'Health',

  'e-commerce': 'E-Commerce',
  'ecommerce': 'E-Commerce',
  'shop': 'E-Commerce',
  'store': 'E-Commerce',
  'marketplace': 'E-Commerce',
  'cart': 'E-Commerce',
  'checkout': 'E-Commerce',

  'saas': 'SaaS',
  'subscription': 'SaaS',
  'billing': 'SaaS',
  'plan': 'SaaS',
  'pricing': 'SaaS',
  'tenant': 'SaaS',
  'multi-tenant': 'SaaS',

  'dashboard': 'Tooling',
  'admin': 'Tooling',
  'analytics': 'Tooling',
  'monitoring': 'Tooling',
  'logging': 'Tooling',
  'ci/cd': 'Tooling',
  'devops': 'Tooling',

  'booking': 'SaaS',
  'reservation': 'SaaS',
  'appointment': 'SaaS',
  'scheduler': 'SaaS',

  'api': 'SaaS',
  'rest': 'SaaS',
  'graphql': 'SaaS',
  'microservice': 'SaaS',
};

/**
 * Core path patterns
 */
const CORE_PATH_PATTERNS = [
  '/services',
  '/api/v1',
  '/api/v2',
  '/core',
  '/lib',
  '/src/core',
  '/src/lib',
  '/src/services',
  '/src/api',
  '/app/api',
];

/**
 * Business risk finding
 */
interface BusinessRiskFinding {
  /** File path */
  filePath: string;
  /** Risk level */
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  /** Risk reason */
  reason: string;
  /** Quality score from Phase 1 */
  qualityScore: number;
}

/**
 * Business profile
 */
interface BusinessProfile {
  /** Detected business domain */
  domain: BusinessDomain;
  /** Confidence score (0-100) */
  confidence: number;
  /** Detected stack dependencies */
  stack: string[];
  /** Critical modules (files that cannot break) */
  criticalModules: string[];
  /** Business risk findings */
  riskFindings: BusinessRiskFinding[];
  /** Recommended focus for subsequent phases */
  recommendedFocus: string[];
  /** Core paths identified */
  corePaths: string[];
  /** Priority Phase: Most critical phase for this business domain */
  priorityPhase: number;
  /** Untouchable folders: Folders Atomic Fixer should not touch without double validation */
  untouchableFolders: string[];
  /** Self-audit flag: Whether this is Aegis QA auditing itself */
  isSelfAudit: boolean;
  /** Sensitivity Level: High/Medium/Low based on data type (PII, Payments, etc.) */
  sensitivityLevel: 'high' | 'medium' | 'low';
  /** Core Flow: Detected data flow patterns (useContext, Cart, Auth, etc.) */
  coreFlow: string[];
  /** Business Understanding: Human-readable description of what the software does */
  businessUnderstanding: string;
}

/**
 * Phase 2 configuration
 */
interface Phase2Config {
  /** Project root directory */
  projectRoot: string;
  /** State persistence for storing results */
  statePersistence: StatePersistence;
  /** Current execution state */
  currentState: ExecutionState;
}

/**
 * Phase 2 result
 */
export interface Phase2Result {
  /** Overall success */
  success: boolean;
  /** Business profile */
  businessProfile: BusinessProfile;
  /** Execution time in milliseconds */
  executionTimeMs: number;
  /** Error if failed */
  error?: string;
}

/**
 * Phase 2: Business Logic - Business Semantics & Core Path Detection
 *
 * This phase deduces the business purpose of the repository to prioritize
 * the subsequent phases.
 *
 * @class Phase2BusinessLogic
 * @example
 * ```typescript
 * const phase2 = new Phase2BusinessLogic({
 *   projectRoot: '/path/to/project',
 *   statePersistence: new StatePersistence('/path/to/project'),
 *   currentState: executionState,
 * });
 * const result = await phase2.execute();
 * ```
 */
export class Phase2BusinessLogic {
  private config: Phase2Config;

  constructor(config: Phase2Config) {
    this.config = config;
  }

  /**
   * Executes Phase 2: Business Logic
   *
   * @returns Promise<Phase2Result> - Business logic analysis result
   */
  async execute(): Promise<Phase2Result> {
    const startTime = Date.now();
    console.log('­ƒÄ» Phase 2: Business Logic - Business Semantics & Core Path Detection\n');

    try {
      // 1. Detect Stack & Niche from package.json
      console.log('­ƒôª Analyzing package.json for stack detection...');
      const domainFromDeps = await this.analyzePackageJson();
      console.log(`  Detected domain: ${domainFromDeps.domain} (confidence: ${domainFromDeps.confidence})\n`);

      // 2. Detect Niche from README.md
      console.log('­ƒôä Analyzing README.md for keywords...');
      const domainFromReadme = await this.analyzeReadme();
      console.log(`  Detected domain: ${domainFromReadme.domain} (confidence: ${domainFromReadme.confidence})\n`);

      // 3. Combine domain detections
      const combinedDomain = this.combineDomainDetections(domainFromDeps, domainFromReadme);
      console.log(`Ô£à Combined domain: ${combinedDomain.domain} (confidence: ${combinedDomain.confidence})\n`);

      // 4. Identify Core Paths
      console.log('­ƒöì Identifying core paths...');
      const corePaths = this.identifyCorePaths();
      console.log(`  Found ${corePaths.length} core paths\n`);

      // 5. Cross-reference with Phase 1 Quality Scores
      console.log('ÔÜá´©Å  Cross-referencing with Phase 1 quality scores...');
      const riskFindings = await this.crossReferenceWithPhase1(corePaths);
      console.log(`  Found ${riskFindings.length} business risk findings\n`);

      // 6. Detect self-audit (Aegis QA auditing itself)
      const isSelfAudit = this.detectSelfAudit();
      if (isSelfAudit) {
        console.log('­Œ¡ SELF-AUDIT DETECTED: Aegis QA is auditing itself');
        console.log('  Adjusting business context for Developer Tools / QA Infrastructure\n');
      }

      // 7. Analyze Core Flow (data flow patterns)
      const coreFlow = this.analyzeCoreFlow();
      console.log(`  ­Ÿ Core Flow: ${coreFlow.length > 0 ? coreFlow.join(', ') : 'No specific flow detected'}\n`);

      // 8. Calculate Sensitivity Level
      const sensitivityLevel = this.calculateSensitivityLevel(combinedDomain.domain, coreFlow);
      console.log(`  âœ¨ Sensitivity Level: ${sensitivityLevel}\n`);

      // 9. Generate Business Understanding
      const businessUnderstanding = this.generateBusinessUnderstanding(combinedDomain.domain, coreFlow, isSelfAudit);
      console.log(`  ðŸ§  Business Understanding: ${businessUnderstanding}\n`);

      // 10. Generate Business Profile
      const businessProfile: BusinessProfile = {
        domain: combinedDomain.domain,
        confidence: combinedDomain.confidence,
        stack: domainFromDeps.stack,
        criticalModules: riskFindings.filter(f => f.riskLevel === 'critical' || f.riskLevel === 'high').map(f => f.filePath),
        riskFindings,
        recommendedFocus: this.generateRecommendedFocus(combinedDomain.domain, riskFindings),
        corePaths,
        priorityPhase: this.generatePriorityPhase(combinedDomain.domain, isSelfAudit),
        untouchableFolders: this.generateUntouchableFolders(combinedDomain.domain, corePaths, isSelfAudit),
        isSelfAudit,
        sensitivityLevel,
        coreFlow,
        businessUnderstanding,
      };

      // Write partial report for Phase 2
      await this.writePartialReport(businessProfile);

      const executionTimeMs = Date.now() - startTime;

      console.log(`Ô£à Phase 2 Complete`);
      console.log(`  ­ƒÄ» Domain: ${businessProfile.domain}`);
      console.log(`  ­ƒôè Confidence: ${businessProfile.confidence}%`);
      console.log(`  ­ƒôª Stack: ${businessProfile.stack.length} dependencies`);
      console.log(`  ­ƒöÆ Critical modules: ${businessProfile.criticalModules.length}`);
      console.log(`  ÔÜá´©Å  Risk findings: ${businessProfile.riskFindings.length}`);
      console.log(`  ­ƒÄ» Recommended focus: ${businessProfile.recommendedFocus.join(', ')}\n`);

      return {
        success: true,
        businessProfile,
        executionTimeMs,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`ÔØî Phase 2 failed: ${errorMessage}\n`);

      return {
        success: false,
        businessProfile: {
          domain: 'General',
          confidence: 0,
          stack: [],
          criticalModules: [],
          riskFindings: [],
          recommendedFocus: [],
          corePaths: [],
          priorityPhase: 3, // Default to Security
          untouchableFolders: [],
          isSelfAudit: false,
          sensitivityLevel: 'low',
          coreFlow: [],
          businessUnderstanding: 'Unable to determine business context due to error.',
        },
        executionTimeMs: Date.now() - startTime,
        error: errorMessage,
      };
    }
  }

  /**
   * Analyzes package.json for domain detection
   *
   * @private
   * @returns Promise<{ domain: BusinessDomain; confidence: number; stack: string[] }>
   */
  private async analyzePackageJson(): Promise<{ domain: BusinessDomain; confidence: number; stack: string[] }> {
    const packageJsonPath = path.join(this.config.projectRoot, 'package.json');

    if (!fs.existsSync(packageJsonPath)) {
      console.log('  ÔÜá´©Å  package.json not found');
      return { domain: 'General', confidence: 0, stack: [] };
    }

    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
      const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };

      const stack: string[] = Object.keys(dependencies);
      const domainScores: Record<BusinessDomain, number> = {
        'Fintech': 0,
        'Health': 0,
        'E-Commerce': 0,
        'SaaS': 0,
        'Tooling': 0,
        'Education': 0,
        'Media': 0,
        'Gaming': 0,
        'IoT': 0,
        'General': 0,
      };

      for (const dep of stack) {
        const depLower = dep.toLowerCase();
        for (const [key, domain] of Object.entries(DEPENDENCY_DOMAINS)) {
          if (depLower.includes(key)) {
            domainScores[domain]++;
          }
        }
      }

      // Find domain with highest score
      let maxScore = 0;
      let detectedDomain: BusinessDomain = 'General';

      for (const [domain, score] of Object.entries(domainScores)) {
        if (score > maxScore) {
          maxScore = score;
          detectedDomain = domain as BusinessDomain;
        }
      }

      // Calculate confidence based on score vs total dependencies
      const confidence = stack.length > 0 ? Math.min(100, (maxScore / stack.length) * 100) : 0;

      console.log(`  Dependencies found: ${stack.length}`);
      console.log(`  Domain scores: ${JSON.stringify(domainScores)}`);

      return { domain: detectedDomain, confidence, stack };
    } catch (error) {
      console.warn('  ÔÜá´©Å  Failed to parse package.json:', error instanceof Error ? error.message : error);
      return { domain: 'General', confidence: 0, stack: [] };
    }
  }

  /**
   * Analyzes README.md for domain detection
   *
   * @private
   * @returns Promise<{ domain: BusinessDomain; confidence: number }>
   */
  private async analyzeReadme(): Promise<{ domain: BusinessDomain; confidence: number }> {
    const readmePaths = [
      path.join(this.config.projectRoot, 'README.md'),
      path.join(this.config.projectRoot, 'readme.md'),
      path.join(this.config.projectRoot, 'README.txt'),
    ];

    let readmeContent = '';
    for (const readmePath of readmePaths) {
      if (fs.existsSync(readmePath)) {
        readmeContent = fs.readFileSync(readmePath, 'utf-8').toLowerCase();
        break;
      }
    }

    if (!readmeContent) {
      console.log('  ÔÜá´©Å  README.md not found');
      return { domain: 'General', confidence: 0 };
    }

    const domainScores: Record<BusinessDomain, number> = {
      'Fintech': 0,
      'Health': 0,
      'E-Commerce': 0,
      'SaaS': 0,
      'Tooling': 0,
      'Education': 0,
      'Media': 0,
      'Gaming': 0,
      'IoT': 0,
      'General': 0,
    };

    for (const [keyword, domain] of Object.entries(KEYWORD_DOMAINS)) {
      const regex = new RegExp(keyword, 'gi');
      const matches = readmeContent.match(regex);
      if (matches) {
        domainScores[domain] += matches.length;
      }
    }

    // Find domain with highest score
    let maxScore = 0;
    let detectedDomain: BusinessDomain = 'General';

    for (const [domain, score] of Object.entries(domainScores)) {
      if (score > maxScore) {
        maxScore = score;
        detectedDomain = domain as BusinessDomain;
      }
    }

    // Calculate confidence based on keyword matches
    const totalKeywords = Object.keys(KEYWORD_DOMAINS).length;
    const confidence = Math.min(100, (maxScore / totalKeywords) * 100);

    console.log(`  Domain scores: ${JSON.stringify(domainScores)}`);

    return { domain: detectedDomain, confidence };
  }

  /**
   * Combines domain detections from package.json and README
   *
   * @private
   * @param depsResult - Result from package.json analysis
   * @param readmeResult - Result from README analysis
   * @returns { domain: BusinessDomain; confidence: number }
   */
  private combineDomainDetections(
    depsResult: { domain: BusinessDomain; confidence: number },
    readmeResult: { domain: BusinessDomain; confidence: number }
  ): { domain: BusinessDomain; confidence: number } {
    // If both agree, high confidence
    if (depsResult.domain === readmeResult.domain && depsResult.domain !== 'General') {
      return {
        domain: depsResult.domain,
        confidence: Math.min(100, (depsResult.confidence + readmeResult.confidence) / 2 + 20),
      };
    }

    // If one has high confidence, use that
    if (depsResult.confidence > 50) {
      return depsResult;
    }

    if (readmeResult.confidence > 50) {
      return readmeResult;
    }

    // Default to dependency result
    return depsResult;
  }

  /**
   * Identifies core paths in the project
   *
   * @private
   * @returns string[] - List of core paths
   */
  private identifyCorePaths(): string[] {
    const corePaths: string[] = [];

    for (const pattern of CORE_PATH_PATTERNS) {
      const fullPath = path.join(this.config.projectRoot, pattern);
      if (fs.existsSync(fullPath)) {
        corePaths.push(fullPath);
      }
    }

    return corePaths;
  }

  /**
   * Cross-references core paths with Phase 1 quality scores
   *
   * @private
   * @param corePaths - List of core paths
   * @returns Promise<BusinessRiskFinding[]> - Business risk findings
   */
  private async crossReferenceWithPhase1(corePaths: string[]): Promise<BusinessRiskFinding[]> {
    const riskFindings: BusinessRiskFinding[] = [];

    // Get Phase 1 results from StatePersistence
    const phase1Results = this.config.statePersistence.getAnalysisResults(1, this.config.currentState);

    if (!phase1Results || !phase1Results.fileScores) {
      console.log('  ÔÜá´©Å  Phase 1 results not found, skipping cross-reference');
      return riskFindings;
    }

    const fileScores = phase1Results.fileScores;

    for (const fileScore of fileScores) {
      // Check if file is in a core path
      const isInCorePath = corePaths.some(corePath => fileScore.filePath.includes(corePath));

      if (isInCorePath && fileScore.isCritical) {
        riskFindings.push({
          filePath: fileScore.filePath,
          riskLevel: fileScore.score < 30 ? 'critical' : 'high',
          reason: 'Core path file with low quality score',
          qualityScore: fileScore.score,
        });
      } else if (isInCorePath && fileScore.score < 70) {
        riskFindings.push({
          filePath: fileScore.filePath,
          riskLevel: 'medium',
          reason: 'Core path file with moderate quality score',
          qualityScore: fileScore.score,
        });
      }
    }

    return riskFindings;
  }

  /**
   * Generates recommended focus for subsequent phases
   *
   * @private
   * @param domain - Detected business domain
   * @param riskFindings - Business risk findings
   * @returns string[] - Recommended focus areas
   */
  private generateRecommendedFocus(domain: BusinessDomain, riskFindings: BusinessRiskFinding[]): string[] {
    const focus: string[] = [];

    // Domain-specific recommendations
    switch (domain) {
      case 'Fintech':
        focus.push('Phase 3: Security (Critical)', 'Phase 4: Database (Strict)', 'Phase 10: API Contracts (Strict)');
        break;
      case 'Health':
        focus.push('Phase 3: Security (Critical)', 'Phase 4: Database (Strict)', 'Phase 12: Error Handling (Strict)');
        break;
      case 'E-Commerce':
        focus.push('Phase 3: Security (High)', 'Phase 8: Performance (High)', 'Phase 10: API Contracts (Strict)');
        break;
      case 'SaaS':
        focus.push('Phase 3: Security (High)', 'Phase 12: Error Handling (High)', 'Phase 13: i18n (Medium)');
        break;
      case 'Tooling':
        focus.push('Phase 5: Clean Code (High)', 'Phase 9: Dead Code (High)', 'Phase 11: Tests (Medium)');
        break;
      default:
        focus.push('Phase 3: Security (Medium)', 'Phase 5: Clean Code (Medium)');
    }

    // Risk-based recommendations
    if (riskFindings.some(f => f.riskLevel === 'critical')) {
      focus.push('Phase 1: Code Quality (Critical - Re-review)');
    }

    if (riskFindings.some(f => f.riskLevel === 'high')) {
      focus.push('Phase 1: Code Quality (High Priority)');
    }

    return focus;
  }

  /**
   * Detects if Aegis QA is auditing itself
   *
   * @private
   * @returns boolean - True if self-audit detected
   */
  private detectSelfAudit(): boolean {
    const packageJsonPath = path.join(this.config.projectRoot, 'package.json');
    
    if (!fs.existsSync(packageJsonPath)) {
      return false;
    }

    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
      const packageName = packageJson.name || '';
      
      // Check for Aegis QA indicators
      const isAegisQA = 
        packageName.includes('aegis') ||
        packageName.includes('qa-orchestrator') ||
        this.config.projectRoot.includes('aegis-qa') ||
        this.config.projectRoot.includes('qa-orchestrator');

      return isAegisQA;
    } catch {
      return false;
    }
  }

  /**
   * Generates the priority phase based on business domain
   *
   * @private
   * @param domain - Detected business domain
   * @param isSelfAudit - Whether this is a self-audit
   * @returns number - Priority phase number
   */
  private generatePriorityPhase(domain: BusinessDomain, isSelfAudit: boolean): number {
    // Self-audit special case: Developer Tools / QA Infrastructure
    if (isSelfAudit) {
      console.log('  Priority Phase: Phase 5 (Clean Code) - Core for Developer Tools');
      return 5; // Clean Code is critical for developer tools
    }

    // Domain-specific priority phases
    switch (domain) {
      case 'Fintech':
        console.log('  Priority Phase: Phase 3 (Security) - Critical for Fintech');
        return 3; // Security is critical for fintech
      case 'Health':
        console.log('  Priority Phase: Phase 3 (Security) - Critical for Healthtech');
        return 3; // Security is critical for health
      case 'E-Commerce':
        console.log('  Priority Phase: Phase 3 (Security) - High priority for E-commerce');
        return 3; // Security is high priority
      case 'SaaS':
        console.log('  Priority Phase: Phase 3 (Security) - High priority for SaaS');
        return 3; // Security is high priority
      case 'Tooling':
        console.log('  Priority Phase: Phase 5 (Clean Code) - Critical for Tooling');
        return 5; // Clean Code is critical for tooling
      default:
        console.log('  Priority Phase: Phase 3 (Security) - Default priority');
        return 3; // Default to Security
    }
  }

  /**
   * Generates untouchable folders for Atomic Fixer
   *
   * @private
   * @param domain - Detected business domain
   * @param corePaths - Identified core paths
   * @param isSelfAudit - Whether this is a self-audit
   * @returns string[] - List of untouchable folders
   */
  private generateUntouchableFolders(domain: BusinessDomain, corePaths: string[], isSelfAudit: boolean): string[] {
    const untouchable: string[] = [];

    // Self-audit special case: Core orchestration and analysis modules
    if (isSelfAudit) {
      untouchable.push('/src/orchestration', '/src/core', '/src/inference', '/src/modules');
      console.log('  Untouchable folders: /src/orchestration, /src/core, /src/inference, /src/modules (Core QA infrastructure)');
      return untouchable;
    }

    // Domain-specific untouchable folders
    switch (domain) {
      case 'Fintech':
        untouchable.push('/checkout', '/billing', '/payment', '/transactions');
        console.log('  Untouchable folders: /checkout, /billing, /payment, /transactions (Financial operations)');
        break;
      case 'Health':
        untouchable.push('/patient-records', '/medical-data', '/prescriptions', '/diagnostics');
        console.log('  Untouchable folders: /patient-records, /medical-data, /prescriptions, /diagnostics (Health data)');
        break;
      case 'E-Commerce':
        untouchable.push('/checkout', '/cart', '/payment', '/inventory');
        console.log('  Untouchable folders: /checkout, /cart, /payment, /inventory (E-commerce operations)');
        break;
      case 'SaaS':
        untouchable.push('/auth', '/billing', '/tenant', '/subscription');
        console.log('  Untouchable folders: /auth, /billing, /tenant, /subscription (SaaS operations)');
        break;
      default:
        // Default: all core paths are untouchable
        untouchable.push(...corePaths);
        console.log(`  Untouchable folders: ${corePaths.join(', ')} (Core paths)`);
    }

    return untouchable;
  }

  /**
   * Finds source files in the project
   *
   * @private
   * @param projectRoot - Project root directory
   * @returns string[] - Array of source file paths
   */
  private findSourceFiles(projectRoot: string): string[] {
    const sourceFiles: string[] = [];
    const extensions = ['.ts', '.tsx', '.js', '.jsx'];

    try {
      const walkDir = (dir: string) => {
        const files = fs.readdirSync(dir);
        for (const file of files) {
          const filePath = path.join(dir, file);
          const stat = fs.statSync(filePath);
          if (stat.isDirectory()) {
            // Skip node_modules and .git
            if (!file.includes('node_modules') && !file.includes('.git') && !file.startsWith('.')) {
              walkDir(filePath);
            }
          } else if (extensions.some(ext => file.endsWith(ext))) {
            sourceFiles.push(filePath);
          }
        }
      };

      walkDir(projectRoot);
    } catch {
      // If scanning fails, return empty array
    }

    return sourceFiles;
  }

  /**
   * Analyzes Core Flow - detects data flow patterns (useContext, Cart, Auth, etc.)
   *
   * @private
   * @returns string[] - Detected core flow patterns
   */
  private analyzeCoreFlow(): string[] {
    const coreFlow: string[] = [];
    const projectRoot = this.config.projectRoot;

    // Scan for common data flow patterns in source files
    const sourceFiles = this.findSourceFiles(projectRoot);

    for (const filePath of sourceFiles) {
      try {
        const content = fs.readFileSync(filePath, 'utf-8');

        // Detect useContext patterns
        if (/useContext|createContext|Context\.Provider/.test(content)) {
          if (!coreFlow.includes('Context API')) {
            coreFlow.push('Context API');
          }
        }

        // Detect Cart/Checkout flow
        if (/cart|checkout|basket|purchase|order/.test(content.toLowerCase())) {
          if (!coreFlow.includes('E-commerce Flow')) {
            coreFlow.push('E-commerce Flow');
          }
        }

        // Detect Auth flow
        if (/auth|login|logout|signin|signup|token|session/.test(content.toLowerCase())) {
          if (!coreFlow.includes('Authentication Flow')) {
            coreFlow.push('Authentication Flow');
          }
        }

        // Detect Payment flow
        if (/payment|stripe|paypal|billing|invoice|subscription/.test(content.toLowerCase())) {
          if (!coreFlow.includes('Payment Flow')) {
            coreFlow.push('Payment Flow');
          }
        }

        // Detect User Management
        if (/user|profile|account|settings/.test(content.toLowerCase())) {
          if (!coreFlow.includes('User Management')) {
            coreFlow.push('User Management');
          }
        }

        // Detect Data Processing/Analytics
        if (/analytics|reporting|metrics|dashboard|statistics/.test(content.toLowerCase())) {
          if (!coreFlow.includes('Data Analytics')) {
            coreFlow.push('Data Analytics');
          }
        }

        // Detect API/Service layer
        if (/api|service|controller|endpoint|route/.test(content.toLowerCase())) {
          if (!coreFlow.includes('API Layer')) {
            coreFlow.push('API Layer');
          }
        }

        // Detect Database/ORM
        if (/database|db|orm|query|model|schema/.test(content.toLowerCase())) {
          if (!coreFlow.includes('Database Layer')) {
            coreFlow.push('Database Layer');
          }
        }
      } catch {
        // Skip files that can't be read
      }
    }

    return coreFlow;
  }

  /**
   * Calculates Sensitivity Level based on domain and core flow
   *
   * @private
   * @param domain - Business domain
   * @param coreFlow - Detected core flow patterns
   * @returns 'high' | 'medium' | 'low' - Sensitivity level
   */
  private calculateSensitivityLevel(domain: BusinessDomain, coreFlow: string[]): 'high' | 'medium' | 'low' {
    // High sensitivity domains
    if (domain === 'Fintech' || domain === 'Health') {
      return 'high';
    }

    // Medium sensitivity domains with PII
    if (domain === 'SaaS' || domain === 'E-Commerce') {
      if (coreFlow.includes('Authentication Flow') || coreFlow.includes('Payment Flow')) {
        return 'high';
      }
      return 'medium';
    }

    // Check for sensitive data in core flow
    if (coreFlow.includes('Payment Flow') || coreFlow.includes('Authentication Flow')) {
      return 'high';
    }

    if (coreFlow.includes('User Management') || coreFlow.includes('E-commerce Flow')) {
      return 'medium';
    }

    return 'low';
  }

  /**
   * Generates Business Understanding - human-readable description of what the software does
   *
   * @private
   * @param domain - Business domain
   * @param coreFlow - Detected core flow patterns
   * @param isSelfAudit - Whether this is a self-audit
   * @returns string - Business understanding description
   */
  private generateBusinessUnderstanding(domain: BusinessDomain, coreFlow: string[], isSelfAudit: boolean): string {
    if (isSelfAudit) {
      return 'Nicho: Developer Tools / QA Infrastructure. Core: Hardware Monitoring & Static Analysis. Priorizando integridad del motor de análisis.';
    }

    const flowDescriptions: string[] = [];

    // Describe core flow in business terms
    if (coreFlow.includes('E-commerce Flow')) {
      flowDescriptions.push('sistema de gestión de compras');
    }
    if (coreFlow.includes('Authentication Flow')) {
      flowDescriptions.push('gestión de identidad y acceso');
    }
    if (coreFlow.includes('Payment Flow')) {
      flowDescriptions.push('procesamiento de pagos');
    }
    if (coreFlow.includes('User Management')) {
      flowDescriptions.push('gestión de perfiles de usuario');
    }
    if (coreFlow.includes('Data Analytics')) {
      flowDescriptions.push('análisis de datos y reportes');
    }
    if (coreFlow.includes('API Layer')) {
      flowDescriptions.push('servicios API');
    }

    // Domain-specific descriptions
    let domainDesc = '';
    switch (domain) {
      case 'Fintech':
        domainDesc = 'servicios financieros';
        break;
      case 'Health':
        domainDesc = 'servicios de salud';
        break;
      case 'E-Commerce':
        domainDesc = 'comercio electrónico';
        break;
      case 'SaaS':
        domainDesc = 'plataforma de software como servicio';
        break;
      case 'Tooling':
        domainDesc = 'herramientas de desarrollo';
        break;
      default:
        domainDesc = 'aplicación general';
    }

    // Build comprehensive understanding
    if (flowDescriptions.length === 0) {
      return `Entiendo que este es un ${domainDesc}. Voy a priorizar la seguridad y estabilidad.`;
    }

    const flowStr = flowDescriptions.join(', ');
    return `Entiendo que este es un ${domainDesc} con ${flowStr}. Voy a priorizar la integridad del flujo de datos crítico.`;
  }

  /**
   * Writes partial report for Phase 2
   *
   * @private
   * @param businessProfile - Business profile to write
   */
  private async writePartialReport(businessProfile: BusinessProfile): Promise<void> {
    try {
      const reportPath = path.join(this.config.projectRoot, 'qa-report.partial.md');
      const timestamp = new Date().toISOString();

      let riskFindingsContent = '';
      for (const risk of businessProfile.riskFindings) {
        riskFindingsContent += `- **[${risk.riskLevel.toUpperCase()}] ${risk.filePath}**\n`;
        riskFindingsContent += `  - Reason: ${risk.reason}\n`;
        riskFindingsContent += `  - Quality Score: ${risk.qualityScore}/100\n`;
      }

      const reportContent = `
## Phase 2: Business Logic - Ô£à PASSED
- **Timestamp:** ${timestamp}
- **Execution Time:** ${Date.now() - Date.now()}ms

### Business Understanding
- **Domain:** ${businessProfile.domain}
- **Sensitivity Level:** ${businessProfile.sensitivityLevel.toUpperCase()}
- **Core Flow:** ${businessProfile.coreFlow.length > 0 ? businessProfile.coreFlow.join(', ') : 'No specific flow detected'}
- **Aegis Assessment:** ${businessProfile.businessUnderstanding}

### Business Domain Analysis
- **Confidence:** ${businessProfile.confidence}%
- **Stack Dependencies:** ${businessProfile.stack.length}

### Core Paths Identified
${businessProfile.corePaths.length > 0 ? businessProfile.corePaths.map(p => `- ${p}`).join('\n') : 'None detected'}

### Business Risk Findings
- **Total Risk Findings:** ${businessProfile.riskFindings.length}
- **Critical Modules:** ${businessProfile.criticalModules.length}

${riskFindingsContent ? `
### Risk Details
${riskFindingsContent}
` : ''}

### Recommended Focus for Subsequent Phases
${businessProfile.recommendedFocus.map(f => `- ${f}`).join('\n')}

### Priority Phase
- **Phase ${businessProfile.priorityPhase}:** Most critical phase for this business domain

### Untouchable Folders (Atomic Fixer)
${businessProfile.untouchableFolders.length > 0 ? businessProfile.untouchableFolders.map(f => `- ${f}`).join('\n') : 'None'}

${businessProfile.isSelfAudit ? `### Self-Audit Mode
- **Status:** Active - Aegis QA is auditing itself
- **Adjusted Context:** Developer Tools / QA Infrastructure
- **Core Focus:** Hardware Monitoring & Static Analysis
` : ''}

---

`;

      // Append to partial report
      if (fs.existsSync(reportPath)) {
        fs.appendFileSync(reportPath, reportContent, 'utf-8');
      } else {
        // Create new partial report with header
        const header = `# Aegis QA - Partial Report
Generated: ${timestamp}

`;
        fs.writeFileSync(reportPath, header + reportContent, 'utf-8');
      }

      console.log(`­ƒôØ Partial report written: ${reportPath}`);
    } catch (error) {
      console.warn('ÔÜá´©Å  Failed to write partial report:', error instanceof Error ? error.message : error);
    }
  }
}

