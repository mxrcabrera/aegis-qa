/**
 * Phase 3H: XSS/Injection Security
 *
 * Purpose: Deep analysis of Cross-Site Scripting (XSS) and injection vulnerabilities
 * beyond basic innerHTML checks, covering eval, document.write, URL-based XSS,
 * HTML attributes, template literals, and client-side storage.
 *
 * Architecture:
 * - Dynamic Code Execution: eval(), Function(), setTimeout/setInterval with strings
 * - DOM Manipulation: document.write(), innerHTML, outerHTML, insertAdjacentHTML
 * - URL-based XSS: href, src, data URLs with user input
 * - HTML Attribute XSS: on* event handlers, javascript: protocol
 * - Template Literal XSS: Unescaped template literals with user input
 * - Storage XSS: localStorage/sessionStorage with unsanitized data
 * - React/Next.js Specific: dangerouslySetInnerHTML, unsanitized props
 *
 * @module phases/phase-3h-xss-injection-security
 * @since 2.0.0
 */
import { ThermalController } from '../core/thermal-controller.js';
import { StatePersistence, type ExecutionState } from '../core/state-persistence.js';
interface XSSFinding {
    id: string;
    type: 'eval-with-user-input' | 'document-write-xss' | 'url-xss' | 'attribute-xss' | 'template-literal-xss' | 'storage-xss' | 'timeout-xss' | 'function-xss' | 'dangerous-innerhtml' | 'react-dangerous-set';
    severity: 'low' | 'medium' | 'high' | 'critical';
    filePath: string;
    line?: number;
    description: string;
    suggestion?: string;
    pattern?: string;
}
interface XSSMetrics {
    totalFiles: number;
    evalWithUserInput: number;
    documentWriteXSS: number;
    urlBasedXSS: number;
    attributeXSS: number;
    templateLiteralXSS: number;
    storageXSS: number;
    timeoutXSS: number;
    functionConstructorXSS: number;
    dangerousInnerHTML: number;
    reactDangerousSet: number;
}
interface Phase3HConfig {
    projectRoot: string;
    thermalController: ThermalController;
    statePersistence: StatePersistence;
    currentState: ExecutionState;
}
export interface Phase3HResult {
    success: boolean;
    findings: XSSFinding[];
    metrics: XSSMetrics;
    criticalFindings: number;
    highSeverityFindings: number;
    executionTimeMs: number;
    error?: string;
}
export declare class Phase3HXSSInjectionSecurity {
    private config;
    constructor(config: Phase3HConfig);
    execute(): Promise<Phase3HResult>;
    private checkEvalWithUserInput;
    private checkDocumentWriteXSS;
    private checkURLBasedXSS;
    private checkAttributeXSS;
    private checkTemplateLiteralXSS;
    private checkStorageXSS;
    private checkTimeoutXSS;
    private checkFunctionConstructorXSS;
    private checkDangerousInnerHTML;
    private checkReactDangerousSet;
    private findSourceFiles;
    private calculateMetrics;
}
export {};
//# sourceMappingURL=phase-3h-xss-injection-security.d.ts.map