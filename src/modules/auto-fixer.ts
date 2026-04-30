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

import * as fs from "fs";
import * as path from "path";
import { getFileSystem } from '../core/write-guard.js';

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

class AutoFixer {
  private projectPath: string;
  private fixes: Fix[] = [];

  constructor(projectPath: string) {
    this.projectPath = projectPath;
  }

  /**
   * Apply automatic fixes based on audit results - UNLEASHED MODE
   */
  async applyFixes(auditResults: AuditResults): Promise<FixResult> {
    console.log("\n=== Auto-Fixer - UNLEASHED MODE ===");

    const result: FixResult = {
      success: true,
      fixesApplied: 0,
      errors: [],
      fixes: [],
    };

    try {
      // Fix style violations - UNLEASHED
      const styleFixes = auditResults.styles?.violations || [];
      if (styleFixes.length > 0) {
        console.log(
          `UNLEASHED: Aplicando ${styleFixes.length} fixes de estilos...`,
        );
        await this.fixStyleViolationsUnleashed(styleFixes);
        result.fixesApplied += this.fixes.length;
      }

      // Fix security issues
      if (auditResults.security) {
        await this.fixSecurityIssues(auditResults.security);
        result.fixesApplied += this.fixes.length;
      }

      console.log(
        `UNLEASHED: Fixes aplicados: ${result.fixesApplied}/${styleFixes.length}`,
      );
      console.log("=== Auto-Fixer UNLEASHED Completado ===");

      return result;
    } catch (error) {
      result.success = false;
      result.errors.push(
        error instanceof Error ? error.message : "Unknown error",
      );
      return result;
    }
  }

  /**
   * Fix style violations - UNLEASHED MODE (no limits)
   */
  private async fixStyleViolationsUnleashed(violations: StyleViolation[]): Promise<void> {
    // Group violations by file
    const violationsByFile = new Map<string, StyleViolation[]>();
    for (const violation of violations) {
      if (!violationsByFile.has(violation.file)) {
        violationsByFile.set(violation.file, []);
      }
      violationsByFile.get(violation.file)!.push(violation);
    }

    // Process each file
    for (const [filePath, fileViolations] of violationsByFile) {
      try {
        console.log(
          `UNLEASHED: Processing ${fileViolations.length} violations in ${filePath}`,
        );

        // Dynamic path resolution - works from any directory
        const fullPath = path.isAbsolute(filePath)
          ? filePath
          : path.resolve(this.projectPath, filePath);

        const content = fs.readFileSync(fullPath, "utf8");
        const lines = content.split("\n");

        // Apply fixes in reverse order to maintain line numbers
        const sortedViolations = fileViolations.sort((a, b) => b.line - a.line);

        for (const violation of sortedViolations) {
          const lineIndex = violation.line - 1;
          if (lineIndex >= 0 && lineIndex < lines.length) {
            const originalLine = lines[lineIndex];
            let fixedLine = originalLine;

            // Apply fix based on violation type
            if (violation.type === "inline-style") {
              fixedLine = this.fixInlineStyleUnleashed(originalLine);
            } else if (violation.type === "hardcoded-color") {
              fixedLine = this.fixHardcodedColorUnleashed(originalLine);
            } else if (violation.type === "hardcoded-spacing") {
              fixedLine = this.fixHardcodedSpacingUnleashed(originalLine);
            } else if (violation.type === "non-tailwind") {
              fixedLine = this.fixHardcodedDimensionUnleashed(originalLine);
            }

            // Apply the fix if changed
            if (fixedLine !== originalLine) {
              lines[lineIndex] = fixedLine;

              // Auto-validation post-fix
              if (this.validateSyntax(lines.join("\n"))) {
                console.log(
                  `  UNLEASHED Fixed: ${violation.file}:${violation.line} - ${violation.type}`,
                );

                this.fixes.push({
                  file: violation.file,
                  type: "style",
                  description: `UNLEASHED: ${violation.message}`,
                  applied: true,
                });
              } else {
                // Revert if syntax is invalid
                lines[lineIndex] = originalLine;
                console.warn(
                  `  UNLEASHED Reverted: Invalid syntax in ${violation.file}:${violation.line}`,
                );
              }
            }
          }
        }

        // Write the fixed content
        const newContent = lines.join("\n");
        getFileSystem().writeFileSync(fullPath, newContent);
      } catch (error) {
        console.error(`UNLEASHED Error fixing ${filePath}:`, error);
        this.fixes.push({
          file: filePath,
          type: "style",
          description: `UNLEASHED Error: ${error instanceof Error ? error.message : "Unknown error"}`,
          applied: false,
        });
      }
    }
  }

  /**
   * Aplica todos los fixes basados en resultados de auditoría
   */
  async fixAll(auditResults: AuditResults): Promise<FixResult> {
    console.log("\n=== Auto-Fixer - Aplicando Parches ===");

    const result: FixResult = {
      success: true,
      fixesApplied: 0,
      errors: [],
      fixes: [],
    };

    try {
      // Aplicar fixes de estilos
      if (auditResults.styles?.violations && auditResults.styles.violations.length > 0) {
        console.log(
          `Aplicando ${auditResults.styles.violations.length} fixes de estilos...`,
        );
        await this.fixStyleViolations(auditResults.styles.violations);
      }

      // Aplicar fixes de seguridad (limitados a los seguros)
      if (auditResults.security) {
        await this.fixSecurityIssues(auditResults.security);
      }

      result.fixes = this.fixes;
      result.fixesApplied = this.fixes.filter((f) => f.applied).length;

      console.log(
        `Fixes aplicados: ${result.fixesApplied}/${this.fixes.length}`,
      );
      console.log("=== Auto-Fixer Completado ===");

      return result;
    } catch (error) {
      result.success = false;
      result.errors.push(
        error instanceof Error ? error.message : "Unknown error",
      );
      console.error("Error en Auto-Fixer:", error);
      return result;
    }
  }

  /**
   * Aplica fixes para violaciones de estilo
   */
  private async fixStyleViolations(violations: StyleViolation[]): Promise<void> {
    for (const violation of violations) {
      try {
        const filePath = path.join(this.projectPath, violation.file);

        if (!fs.existsSync(filePath)) {
          console.warn(`Archivo no encontrado: ${filePath}`);
          continue;
        }

        const content = fs.readFileSync(filePath, "utf-8");
        const lines = content.split("\n");
        const lineIndex = violation.line - 1;

        if (lineIndex >= 0 && lineIndex < lines.length) {
          const originalLine = lines[lineIndex];
          let fixedLine = originalLine;

          // Fix 1: Estilos inline -> clases Tailwind
          if (violation.type === "inline-style") {
            fixedLine = this.fixInlineStyle(originalLine);
          }

          // Fix 2: Colores hardcodeados -> clases Tailwind
          if (violation.type === "hardcoded-color") {
            fixedLine = this.fixHardcodedColor(originalLine);
          }

          // Fix 3: Espaciado hardcodeado -> clases Tailwind
          if (violation.type === "hardcoded-spacing") {
            fixedLine = this.fixHardcodedSpacing(originalLine);
          }

          // Fix 4: Dimensiones hardcodeadas -> clases Tailwind
          if (violation.type === "non-tailwind") {
            fixedLine = this.fixHardcodedDimension(originalLine);
          }

          // Aplicar el fix si cambió
          if (fixedLine !== originalLine) {
            // Para estilos inline, siempre extraer y mover a className
            if (violation.type === "inline-style") {
              const { newLine, tailwindClasses } =
                this.extractTailwindClasses(originalLine);

              if (tailwindClasses.length > 0) {
                // Buscar className existente y agregar las clases
                const updatedLine = this.mergeTailwindClasses(
                  newLine,
                  tailwindClasses,
                );
                lines[lineIndex] = updatedLine;

                console.log(
                  `  Fixed: ${violation.file}:${violation.line} - Moved style to className: ${tailwindClasses.join(" ")}`,
                );

                this.fixes.push({
                  file: violation.file,
                  type: "style",
                  description: `Moved inline style to className: ${tailwindClasses.join(" ")}`,
                  applied: true,
                });
              }
            } else {
              lines[lineIndex] = fixedLine;

              this.fixes.push({
                file: violation.file,
                type: "style",
                description: violation.message,
                applied: true,
              });

              console.log(
                `  Fixed: ${violation.file}:${violation.line} - ${violation.type}`,
              );
            }

            const newContent = lines.join("\n");

            getFileSystem().writeFileSync(filePath, newContent);
          }
        }
      } catch (error) {
        console.error(
          `Error fixing ${violation.file}:${violation.line}:`,
          error,
        );
        this.fixes.push({
          file: violation.file,
          type: "style",
          description: violation.message,
          applied: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }
  }

  /**
   * Aplica fixes para issues de seguridad (solo los seguros)
   */
  private async fixSecurityIssues(securityResult: SecurityAuditResult): Promise<void> {
    // Solo aplicar fixes seguros, no cambios críticos de seguridad

    // Fix 1: Agregar comentarios sobre RLS si faltan
    if (securityResult.summary && securityResult.summary.critical > 0) {
      const criticalTables = securityResult.tablesTested?.filter(
        (t: TableInfo) => t.vulnerability === "critical",
      ) || [];

      for (const table of criticalTables) {
        try {
          // Buscar archivos de schema o migrations
          const schemaFiles = await this.findSchemaFiles();

          for (const schemaFile of schemaFiles) {
            const filePath = path.join(this.projectPath, schemaFile);
            const content = fs.readFileSync(filePath, "utf-8");

            // Agregar comentario sobre RLS si no existe
            if (
              !content.includes("-- RLS enabled") &&
              !content.includes("-- Row Level Security")
            ) {
              const rlsComment = `-- TODO: Enable Row Level Security for ${table.table} table\n-- This table is currently accessible without authentication\n`;

              getFileSystem().writeFileSync(filePath, rlsComment + "\n" + content);

              this.fixes.push({
                file: schemaFile,
                type: "security",
                description: `Added RLS reminder for table ${table.table}`,
                applied: true,
              });

              console.log(
                `  Security fix: Added RLS reminder for ${table.table}`,
              );
            }
          }
        } catch (error) {
          console.error(`Error adding RLS comment for ${table.table}:`, error);
        }
      }
    }

    // Fix 2: Buscar service_role expuesto (solo advertencias, no cambios automáticos)
    if (securityResult.serviceRoleExposed?.found) {
      for (const file of securityResult.serviceRoleExposed.files) {
        this.fixes.push({
          file,
          type: "security",
          description:
            "Service role key potentially exposed - manual review required",
          applied: false,
          error: "Manual intervention required for security",
        });

        console.log(`  Security warning: ${file} - Manual review required`);
      }
    }
  }

  /**
   * Extrae clases Tailwind de un atributo style y las devuelve
   */
  private extractTailwindClasses(line: string): {
    newLine: string;
    tailwindClasses: string[];
  } {
    const styleMatch = line.match(/style\s*=\s*\{\s*\{([^}]+)\}\s*\}/);
    const tailwindClasses: string[] = [];
    let newLine = line;

    if (styleMatch) {
      const styles = styleMatch[1];

      // Extraer y convertir estilos a clases Tailwind
      if (
        styles.includes("backgroundColor: 'purple'") ||
        styles.includes('backgroundColor: "purple"')
      ) {
        tailwindClasses.push("bg-purple-500");
      }
      if (
        styles.includes("backgroundColor: 'text-purple-500'") ||
        styles.includes('backgroundColor: "text-purple-500"')
      ) {
        tailwindClasses.push("bg-purple-500");
      }
      if (
        styles.includes("padding: '55px'") ||
        styles.includes('padding: "55px"')
      ) {
        tailwindClasses.push("p-14");
      }
      if (styles.includes("cursor: default")) {
        tailwindClasses.push("cursor-default");
      }
      if (styles.includes("cursor: pointer")) {
        tailwindClasses.push("cursor-pointer");
      }
      if (
        styles.includes("backgroundColor: 'purple'") ||
        styles.includes('backgroundColor: "purple"')
      ) {
        tailwindClasses.push("bg-purple-500");
      }
      if (
        styles.includes("padding: '55px'") ||
        styles.includes('padding: "55px"')
      ) {
        tailwindClasses.push("p-14");
      }

      // Siempre eliminar el atributo style si hay clases detectadas
      if (tailwindClasses.length > 0) {
        newLine = line.replace(styleMatch[0], "");
      }
    }

    return { newLine, tailwindClasses };
  }

  /**
   * Fusiona clases Tailwind existentes con nuevas clases
   */
  private mergeTailwindClasses(line: string, newClasses: string[]): string {
    // Buscar className existente
    const classNameMatch = line.match(/className\s*=\s*\{([^}]+)\}/);
    const classNameStringMatch = line.match(/className\s*=\s*"([^"]+)"/);

    if (classNameMatch) {
      // className con expresión (cn(...))
      const existingClasses = classNameMatch[1];
      const mergedClasses = `${existingClasses} ${newClasses.join(" ")}`;
      return line.replace(classNameMatch[0], `className={${mergedClasses}}`);
    } else if (classNameStringMatch) {
      // className con string
      const existingClasses = classNameStringMatch[1];
      const mergedClasses = `${existingClasses} ${newClasses.join(" ")}`;
      return line.replace(
        classNameStringMatch[0],
        `className="${mergedClasses}"`,
      );
    } else {
      // No hay className existente, crear uno
      const insertPoint = line.lastIndexOf(">") + 1;
      const before = line.substring(0, insertPoint);
      const after = line.substring(insertPoint);
      return `${before} className="${newClasses.join(" ")}"${after}`;
    }
  }

  /**
   * UNLEASHED: Fix inline styles - aggressive mode
   */
  private fixInlineStyleUnleashed(line: string): string {
    const styleMatch = line.match(/style\s*=\s*\{\s*\{([^}]+)\}\s*\}/);
    if (styleMatch) {
      const styles = styleMatch[1];
      const tailwindClasses: string[] = [];

      // Convert common styles to Tailwind
      if (styles.includes("backgroundColor:")) {
        tailwindClasses.push("bg-primary");
      }
      if (styles.includes("padding:")) {
        tailwindClasses.push("p-4");
      }
      if (styles.includes("margin:")) {
        tailwindClasses.push("m-4");
      }
      if (styles.includes("display: flex")) {
        tailwindClasses.push("flex");
      }
      if (styles.includes("text-align: center")) {
        tailwindClasses.push("text-center");
      }

      if (tailwindClasses.length > 0) {
        // Remove style attribute and add classes
        const newLine = line.replace(styleMatch[0], "");
        return this.mergeTailwindClasses(newLine, tailwindClasses);
      }
    }
    return line;
  }

  /**
   * UNLEASHED: Fix hardcoded colors
   */
  private fixHardcodedColorUnleashed(line: string): string {
    // Replace common hardcoded colors
    return line
      .replace(/#fff|#ffffff/gi, "bg-white text-white")
      .replace(/#000|#000000/gi, "bg-black text-black")
      .replace(/rgba\(255,\s*255,\s*255/gi, "bg-white text-white")
      .replace(/rgba\(0,\s*0,\s*0/gi, "bg-black text-black");
  }

  /**
   * UNLEASHED: Fix hardcoded spacing
   */
  private fixHardcodedSpacingUnleashed(line: string): string {
    return line
      .replace(/padding:\s*\d+px/gi, "p-4")
      .replace(/margin:\s*\d+px/gi, "m-4")
      .replace(/padding:\s*\d+rem/gi, "p-4")
      .replace(/margin:\s*\d+rem/gi, "m-4");
  }

  /**
   * UNLEASHED: Fix hardcoded dimensions
   */
  private fixHardcodedDimensionUnleashed(line: string): string {
    return line
      .replace(/width:\s*\d+px/gi, "w-auto")
      .replace(/height:\s*\d+px/gi, "h-auto")
      .replace(/font-size:\s*\d+px/gi, "text-base");
  }

  /**
   * Auto-Validación Post-Fix - Check syntax validity
   */
  private validateSyntax(content: string): boolean {
    try {
      // Basic syntax checks
      const openBraces = (content.match(/\{/g) || []).length;
      const closeBraces = (content.match(/\}/g) || []).length;
      const openParens = (content.match(/\(/g) || []).length;
      const closeParens = (content.match(/\)/g) || []).length;

      return openBraces === closeBraces && openParens === closeParens;
    } catch {
      return false;
    }
  }

  /**
   * Convierte estilos inline a clases Tailwind (simplificado)
   */
  private fixInlineStyle(line: string): string {
    // Reemplazar style={{}} con clases Tailwind básicas
    const styleMatch = line.match(/style\s*=\s*\{\s*\{([^}]+)\}\s*\}/);
    if (styleMatch) {
      const styles = styleMatch[1];
      let className = "";

      // Convertir estilos comunes a clases Tailwind
      if (styles.includes("display: flex")) className += " flex";
      if (styles.includes("display: block")) className += " block";
      if (styles.includes("text-align: center")) className += " text-center";
      if (styles.includes("margin: 0 auto")) className += " mx-auto";

      if (className) {
        return line.replace(styleMatch[0], `className="${className.trim()}"`);
      }
    }
    return line;
  }

  /**
   * Convierte colores hardcodeados a clases Tailwind (simplificado)
   */
  private fixHardcodedColor(line: string): string {
    // Reemplazar colores hex comunes
    const colorMap: { [key: string]: string } = {
      "#000000": "text-black",
      "#ffffff": "text-white",
      "#ff0000": "text-red-500",
      "#00ff00": "text-green-500",
      "#0000ff": "text-blue-500",
      "#ffff00": "text-yellow-500",
      "#ff00ff": "text-purple-500",
      "#00ffff": "text-cyan-500",
    };

    for (const [hex, tailwindClass] of Object.entries(colorMap)) {
      if (line.includes(hex)) {
        return line.replace(hex, tailwindClass);
      }
    }
    return line;
  }

  /**
   * Convierte espaciado hardcodeado a clases Tailwind (simplificado)
   */
  private fixHardcodedSpacing(line: string): string {
    const spacingMap: { [key: string]: string } = {
      "margin: 0": "m-0",
      "margin: 4px": "m-1",
      "margin: 8px": "m-2",
      "margin: 16px": "m-4",
      "margin: 24px": "m-6",
      "padding: 0": "p-0",
      "padding: 4px": "p-1",
      "padding: 8px": "p-2",
      "padding: 16px": "p-4",
      "padding: 24px": "p-6",
    };

    for (const [cssValue, tailwindClass] of Object.entries(spacingMap)) {
      if (line.includes(cssValue)) {
        return line.replace(cssValue, tailwindClass);
      }
    }
    return line;
  }

  /**
   * Convierte dimensiones hardcodeadas a clases Tailwind (simplificado)
   */
  private fixHardcodedDimension(line: string): string {
    const dimensionMap: { [key: string]: string } = {
      "width: 100%": "w-full",
      "width: 50%": "w-1/2",
      "width: 25%": "w-1/4",
      "height: 100%": "h-full",
      "height: 50vh": "h-screen",
      "height: 100vh": "h-screen",
    };

    for (const [cssValue, tailwindClass] of Object.entries(dimensionMap)) {
      if (line.includes(cssValue)) {
        return line.replace(cssValue, tailwindClass);
      }
    }
    return line;
  }

  /**
   * Busca archivos de schema o migrations
   */
  private async findSchemaFiles(): Promise<string[]> {
    const schemaPatterns = [
      "**/schema.prisma",
      "**/migrations/**/*.sql",
      "**/supabase/migrations/**/*.sql",
    ];

    const files: string[] = [];
    for (const pattern of schemaPatterns) {
      try {
        const { glob } = await import("glob");
        const matches = await glob(pattern, { cwd: this.projectPath });
        files.push(...matches);
      } catch {
        // Skip if pattern doesn't match
      }
    }

    return files;
  }

  /**
   * Genera reporte de fixes aplicados
   */
  generateFixReport(): string {
    let report = "# Auto-Fix Report\n\n";

    const appliedFixes = this.fixes.filter((f) => f.applied);
    const failedFixes = this.fixes.filter((f) => !f.applied);

    report += `Total Fixes: ${this.fixes.length}\n`;
    report += `Applied: ${appliedFixes.length}\n`;
    report += `Failed: ${failedFixes.length}\n\n`;

    if (appliedFixes.length > 0) {
      report += "## Applied Fixes\n\n";
      for (const fix of appliedFixes) {
        report += `- **${fix.file}** (${fix.type}): ${fix.description}\n`;
      }
      report += "\n";
    }

    if (failedFixes.length > 0) {
      report += "## Failed Fixes\n\n";
      for (const fix of failedFixes) {
        report += `- **${fix.file}** (${fix.type}): ${fix.description}`;
        if (fix.error) {
          report += ` - Error: ${fix.error}`;
        }
        report += "\n";
      }
      report += "\n";
    }

    return report;
  }
}

export default AutoFixer;
export { AutoFixer, FixResult, Fix, AuditResults };
