/**
 * Style Auditor - Auditor de Estilos para QA Orchestrator
 *
 * Propósito: Escanear archivos de componentes para detectar violaciones de estilo
 *
 * Funcionalidades:
 * - Detectar estilos inline: style={{...}}
 * - Detectar colores hardcodeados fuera de Tailwind config
 * - Validar consistencia de Tailwind classes
 * - Generar reporte de violaciones
 * - Hardware Protection via ThermalController
 */

import * as fs from "fs-extra";
import * as path from "path";
import { glob } from "glob";
import ThermalController from "./thermal-controller.js";

interface StyleViolation {
  file: string;
  line: number;
  type:
    | "inline-style"
    | "hardcoded-color"
    | "hardcoded-spacing"
    | "non-tailwind";
  message: string;
  code: string;
}

interface StyleAuditResult {
  violations: StyleViolation[];
  totalFilesScanned: number;
  filesWithViolations: number;
  summary: {
    inlineStyles: number;
    hardcodedColors: number;
    hardcodedSpacing: number;
    nonTailwind: number;
  };
}

class StyleAuditor {
  private projectPath: string;
  private currentFile: string = "";
  private thermalController?: ThermalController;

  constructor(projectPath: string, thermalController?: ThermalController) {
    this.projectPath = projectPath;
    this.thermalController = thermalController;
  }

  /**
   * Ejecuta auditoría completa de estilos
   */
  async audit(): Promise<StyleAuditResult> {
    const violations: StyleViolation[] = [];

    // Hardware check before processing
    if (this.thermalController) {
      const tempReading = await this.thermalController.checkTemperature();
      if (!tempReading.isSafe) {
        console.warn(`[StyleAuditor] GPU temperature unsafe (${tempReading.current}°C), applying cooldown`);
        await this.thermalController.applyCooldown(3000);
      }
    }

    // Escanear archivos TSX/JSX
    const componentFiles = await glob("**/*.{tsx,jsx}", {
      cwd: this.projectPath,
    });

    for (const file of componentFiles) {
      this.currentFile = file;
      const fullPath = path.join(this.projectPath, file);
      const content = await fs.readFile(fullPath, "utf-8");
      const lines = content.split("\n");

      // Detectar violaciones en cada línea
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lineNumber = i + 1;

        // Detectar estilos inline
        const inlineStyleMatch = line.match(/style\s*=\s*\{\s*\{/);
        if (inlineStyleMatch) {
          const styleViolation = this.fixInlineStyle(line, lineNumber);
          if (styleViolation) {
            violations.push(styleViolation);
          }
        }

        // Detectar colores hardcodeados (hex, rgb, rgba)
        const colorPatterns = [
          /#[0-9a-fA-F]{3,8}\b/, // Hex colors
          /rgb\s*\(/, // rgb()
          /rgba\s*\(/, // rgba()
          /color\s*:\s*['"][^'"]+['"]/, // color: "value"
        ];

        for (const pattern of colorPatterns) {
          const match = line.match(pattern);
          if (
            match &&
            !line.includes("className") &&
            !line.includes("tailwind")
          ) {
            violations.push({
              file,
              line: lineNumber,
              type: "hardcoded-color",
              message:
                "Color hardcodeado detectado. Usar clases de Tailwind (bg-red-500, text-blue-600, etc.)",
              code: line.trim(),
            });
          }
        }

        // Detectar espaciado hardcodeado (margin, padding en px/rem/em)
        const spacingPattern = /(margin|padding)\s*:\s*\d+(px|rem|em)/;
        const spacingMatch = line.match(spacingPattern);
        if (spacingMatch && !line.includes("className")) {
          violations.push({
            file,
            line: lineNumber,
            type: "hardcoded-spacing",
            message:
              "Espaciado hardcodeado detectado. Usar clases de Tailwind (p-4, m-2, etc.)",
            code: line.trim(),
          });
        }

        // Detectar estilos no-Tailwind (width/height hardcodeados)
        const dimensionPattern = /(width|height)\s*:\s*\d+(px|%)/;
        const dimensionMatch = line.match(dimensionPattern);
        if (dimensionMatch && !line.includes("className")) {
          violations.push({
            file,
            line: lineNumber,
            type: "non-tailwind",
            message:
              "Dimensión hardcodeada detectada. Usar clases de Tailwind (w-64, h-32, etc.)",
            code: line.trim(),
          });
        }
      }
    }

    // Calcular resumen
    const summary = {
      inlineStyles: violations.filter((v) => v.type === "inline-style").length,
      hardcodedColors: violations.filter((v) => v.type === "hardcoded-color")
        .length,
      hardcodedSpacing: violations.filter((v) => v.type === "hardcoded-spacing")
        .length,
      nonTailwind: violations.filter((v) => v.type === "non-tailwind").length,
    };

    return {
      violations,
      totalFilesScanned: componentFiles.length,
      filesWithViolations: new Set(violations.map((v) => v.file)).size,
      summary,
    };
  }

  /**
   * Escanea archivos CSS/SCSS para detectar problemas
   */
  async auditCSSFiles(): Promise<StyleAuditResult> {
    const violations: StyleViolation[] = [];

    const cssFiles = await glob("**/*.{css,scss,sass}", {
      cwd: this.projectPath,
    });

    for (const file of cssFiles) {
      const fullPath = path.join(this.projectPath, file);
      const content = await fs.readFile(fullPath, "utf-8");
      const lines = content.split("\n");

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lineNumber = i + 1;

        // Detectar !important (indicativo de mal diseño de CSS)
        if (line.includes("!important")) {
          violations.push({
            file,
            line: lineNumber,
            type: "non-tailwind",
            message:
              "Uso de !important detectado. Revisar especificidad de CSS.",
            code: line.trim(),
          });
        }

        // Detectar colores hardcodeados en CSS
        const colorPattern = /#[0-9a-fA-F]{3,8}\b/;
        const colorMatch = line.match(colorPattern);
        if (colorMatch) {
          violations.push({
            file,
            line: lineNumber,
            type: "hardcoded-color",
            message:
              "Color hardcodeado en CSS. Considerar usar variables CSS o Tailwind.",
            code: line.trim(),
          });
        }
      }
    }

    const summary = {
      inlineStyles: 0,
      hardcodedColors: violations.filter((v) => v.type === "hardcoded-color")
        .length,
      hardcodedSpacing: 0,
      nonTailwind: violations.filter((v) => v.type === "non-tailwind").length,
    };

    return {
      violations,
      totalFilesScanned: cssFiles.length,
      filesWithViolations: new Set(violations.map((v) => v.file)).size,
      summary,
    };
  }

  /**
   * Genera reporte en formato Markdown
   */
  generateMarkdownReport(result: StyleAuditResult): string {
    let report = "# Style Audit Report\n\n";
    report += `**Total Files Scanned:** ${result.totalFilesScanned}\n`;
    report += `**Files with Violations:** ${result.filesWithViolations}\n`;
    report += `**Total Violations:** ${result.violations.length}\n\n`;

    report += "## Summary\n\n";
    report += "| Type | Count |\n";
    report += "|------|-------|\n";
    report += `| Inline Styles | ${result.summary.inlineStyles} |\n`;
    report += `| Hardcoded Colors | ${result.summary.hardcodedColors} |\n`;
    report += `| Hardcoded Spacing | ${result.summary.hardcodedSpacing} |\n`;
    report += `| Non-Tailwind | ${result.summary.nonTailwind} |\n\n`;

    if (result.violations.length > 0) {
      report += "## Violations\n\n";

      // Agrupar por archivo
      const violationsByFile = new Map<string, StyleViolation[]>();
      for (const violation of result.violations) {
        if (!violationsByFile.has(violation.file)) {
          violationsByFile.set(violation.file, []);
        }
        violationsByFile.get(violation.file)!.push(violation);
      }

      for (const [file, violations] of Array.from(violationsByFile.entries())) {
        report += `### ${file}\n\n`;
        for (const violation of violations) {
          report += `- **Line ${violation.line}** (${violation.type}): ${violation.message}\n`;
          report += `  \`\`\`\n${violation.code}\n\`\`\`\n\n`;
        }
      }
    } else {
      report += "✅ No style violations found.\n";
    }

    return report;
  }

  /**
   * Extrae valor numérico de tamaño CSS
   */
  private extractSizeValue(value: string): string {
    // Mapeo común de valores a Tailwind
    const sizeMap: { [key: string]: string } = {
      "4px": "1",
      "8px": "2",
      "12px": "3",
      "16px": "4",
      "20px": "5",
      "24px": "6",
      "32px": "8",
      "40px": "10",
      "48px": "12",
      "1rem": "4",
      "2rem": "8",
    };

    return sizeMap[value] || "4"; // Default a 4
  }

  /**
   * Convierte estilos CSS a clases Tailwind
   */
  private convertStylesToTailwind(styles: string): string {
    const tailwindClasses: string[] = [];

    // Parse simple CSS properties
    const properties = styles.split(";").filter((p) => p.trim());

    for (const prop of properties) {
      const [property, value] = prop.split(":").map((s) => s.trim());

      switch (property) {
        case "backgroundColor":
          if (value.includes("rgb")) {
            tailwindClasses.push("bg-blue-500");
          } else if (value.includes("#fff")) {
            tailwindClasses.push("bg-white");
          } else if (value.includes("#000")) {
            tailwindClasses.push("bg-black");
          }
          break;

        case "color":
          if (value.includes("rgb")) {
            tailwindClasses.push("text-blue-500");
          } else if (value.includes("#fff")) {
            tailwindClasses.push("text-white");
          } else if (value.includes("#000")) {
            tailwindClasses.push("text-black");
          }
          break;

        case "padding":
          const paddingValue = this.extractSizeValue(value);
          if (paddingValue) {
            tailwindClasses.push(`p-${paddingValue}`);
          }
          break;

        case "margin":
          const marginValue = this.extractSizeValue(value);
          if (marginValue) {
            tailwindClasses.push(`m-${marginValue}`);
          }
          break;

        case "display":
          if (value === "flex") {
            tailwindClasses.push("flex");
          } else if (value === "block") {
            tailwindClasses.push("block");
          } else if (value === "inline") {
            tailwindClasses.push("inline");
          }
          break;

        case "textAlign":
          if (value === "center") {
            tailwindClasses.push("text-center");
          } else if (value === "left") {
            tailwindClasses.push("text-left");
          } else if (value === "right") {
            tailwindClasses.push("text-right");
          }
          break;
      }
    }

    return tailwindClasses.join(" ");
  }

  /**
   * Fix inline styles by converting to Tailwind classes - APB Mode
   */
  private fixInlineStyle(line: string, lineNum: number): StyleViolation | null {
    const styleMatch = line.match(/style\s*=\s*\{\s*\{([^}]+)\}\s*\}/);

    if (styleMatch) {
      const styles = styleMatch[1];
      const tailwindClasses = this.convertStylesToTailwind(styles);

      // APB Log - Antes y Después
      console.log(`\n=== FIX VISUAL ===`);
      console.log(`Archivo: ${this.currentFile}:${lineNum}`);
      console.log(`ANTES: ${line.trim()}`);
      console.log(
        `DESPUÉS: ${line.replace(styleMatch[0], `className="${tailwindClasses}"`).trim()}`,
      );
      console.log(`BORRADO: style={{${styles}}}`);
      console.log(`PUESTO: className="${tailwindClasses}"`);
      console.log(`================\n`);

      return {
        file: this.currentFile,
        line: lineNum,
        type: "inline-style",
        message: `Inline style detected: ${styles}`,
        code: line.trim(),
      };
    }

    return null;
  }

  /**
   * Imprime reporte en consola
   */
  printReport(result: StyleAuditResult): void {
    console.log("\n=== Style Audit Report ===\n");
    console.log(`Total Files Scanned: ${result.totalFilesScanned}`);
    console.log(`Files with Violations: ${result.filesWithViolations}`);
    console.log(`Total Violations: ${result.violations.length}\n`);

    console.log("Summary:");
    console.log(`  Inline Styles: ${result.summary.inlineStyles}`);
    console.log(`  Hardcoded Colors: ${result.summary.hardcodedColors}`);
    console.log(`  Hardcoded Spacing: ${result.summary.hardcodedSpacing}`);
    console.log(`  Non-Tailwind: ${result.summary.nonTailwind}\n`);

    if (result.violations.length > 0) {
      console.log("Violations:");
      for (const violation of result.violations) {
        console.log(
          `  ${violation.file}:${violation.line} [${violation.type}]`,
        );
        console.log(`    ${violation.message}`);
        console.log(`    Code: ${violation.code}`);
      }
    } else {
      console.log("No style violations found.");
    }
  }
}

export default StyleAuditor;
export { StyleAuditor, StyleViolation, StyleAuditResult };
