/**
 * Auto-Fixer - Motor de Auto-Fix para QA Orchestrator
 *
 * Propósito: Aplicar parches automáticamente para violaciones de estilo y seguridad
 *
 * Funcionalidades:
 * - Leer resultados de auditores
 * - Aplicar fixes usando edit/multi_edit
 * - Verificar fixes no rompan funcionalidad
 * - Trackear fixes aplicados
 */
interface FixResult {
    success: boolean;
    fixesApplied: number;
    errors: string[];
    fixes: Fix[];
}
interface Fix {
    file: string;
    type: "style" | "security";
    description: string;
    applied: boolean;
    error?: string;
}
interface StyleViolation {
    file: string;
    line: number;
    type: string;
    message: string;
}
interface StyleAuditResult {
    violations?: StyleViolation[];
}
interface TableInfo {
    table: string;
    vulnerability: string;
}
interface ServiceRoleExposure {
    found: boolean;
    files: string[];
}
interface SecuritySummary {
    critical: number;
}
interface SecurityAuditResult {
    recommendations?: unknown[];
    tablesTested?: TableInfo[];
    summary?: SecuritySummary;
    serviceRoleExposed?: ServiceRoleExposure;
}
interface AuditResults {
    routes: unknown;
    styles: StyleAuditResult;
    security: SecurityAuditResult;
}
declare class AutoFixer {
    private projectPath;
    private fixes;
    constructor(projectPath: string);
    /**
     * Apply automatic fixes based on audit results - UNLEASHED MODE
     */
    applyFixes(auditResults: AuditResults): Promise<FixResult>;
    /**
     * Fix style violations - UNLEASHED MODE (no limits)
     */
    private fixStyleViolationsUnleashed;
    /**
     * Aplica todos los fixes basados en resultados de auditoría
     */
    fixAll(auditResults: AuditResults): Promise<FixResult>;
    /**
     * Aplica fixes para violaciones de estilo
     */
    private fixStyleViolations;
    /**
     * Aplica fixes para issues de seguridad (solo los seguros)
     */
    private fixSecurityIssues;
    /**
     * Extrae clases Tailwind de un atributo style y las devuelve
     */
    private extractTailwindClasses;
    /**
     * Fusiona clases Tailwind existentes con nuevas clases
     */
    private mergeTailwindClasses;
    /**
     * UNLEASHED: Fix inline styles - aggressive mode
     */
    private fixInlineStyleUnleashed;
    /**
     * UNLEASHED: Fix hardcoded colors
     */
    private fixHardcodedColorUnleashed;
    /**
     * UNLEASHED: Fix hardcoded spacing
     */
    private fixHardcodedSpacingUnleashed;
    /**
     * UNLEASHED: Fix hardcoded dimensions
     */
    private fixHardcodedDimensionUnleashed;
    /**
     * Auto-Validación Post-Fix - Check syntax validity
     */
    private validateSyntax;
    /**
     * Convierte estilos inline a clases Tailwind (simplificado)
     */
    private fixInlineStyle;
    /**
     * Convierte colores hardcodeados a clases Tailwind (simplificado)
     */
    private fixHardcodedColor;
    /**
     * Convierte espaciado hardcodeado a clases Tailwind (simplificado)
     */
    private fixHardcodedSpacing;
    /**
     * Convierte dimensiones hardcodeadas a clases Tailwind (simplificado)
     */
    private fixHardcodedDimension;
    /**
     * Busca archivos de schema o migrations
     */
    private findSchemaFiles;
    /**
     * Genera reporte de fixes aplicados
     */
    generateFixReport(): string;
}
export default AutoFixer;
export { AutoFixer, FixResult, Fix, AuditResults };
//# sourceMappingURL=auto-fixer.d.ts.map