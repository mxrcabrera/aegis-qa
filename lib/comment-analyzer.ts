/**
 * CommentAnalyzer - Motor de Limpieza Inteligente de Comentarios
 *
 * Propósito: Analizar comentarios de código para decidir cuáles mantener
 * y cuáles eliminar basándose en su valor semántico.
 *
 * Funcionalidades:
 * - Diferenciar comentarios que explican lógica compleja (mantener)
 * - Identificar basura redundante (eliminar)
 * - Usar IA para decisiones ambiguas
 * - Preservar contexto de negocio y arquitectura
 */

import * as fs from "fs-extra";
import * as path from "path";

interface CommentAnalysis {
  type: "keep" | "remove";
  reason: string;
  confidence: number; // 0-1
}

interface CommentAnalysisResult {
  totalComments: number;
  commentsToKeep: number;
  commentsToRemove: number;
  analyses: {
    file: string;
    line: number;
    comment: string;
    analysis: CommentAnalysis;
  }[];
}

class CommentAnalyzer {
  private projectPath: string;

  constructor(projectPath: string) {
    this.projectPath = projectPath;
  }

  /**
   * Analiza todos los comentarios de un archivo
   */
  async analyzeFile(filePath: string): Promise<CommentAnalysisResult> {
    const fullPath = path.isAbsolute(filePath)
      ? filePath
      : path.resolve(this.projectPath, filePath);

    const content = await fs.readFile(fullPath, "utf8");
    const lines = content.split("\n");

    const analyses: CommentAnalysisResult["analyses"] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNumber = i + 1;

      // Detectar comentarios de una línea (//)
      const singleLineMatch = line.match(/^\s*\/\/(.*)/);
      if (singleLineMatch) {
        const comment = singleLineMatch[1].trim();
        if (comment.length > 0) {
          const analysis = this.analyzeComment(comment, line, lines, i);
          analyses.push({
            file: filePath,
            line: lineNumber,
            comment,
            analysis,
          });
        }
      }

      // Detectar comentarios de bloque /* */
      const blockMatch = line.match(/\/\*([\s\S]*?)\*\//);
      if (blockMatch) {
        const comment = blockMatch[1].trim();
        if (comment.length > 0) {
          const analysis = this.analyzeComment(comment, line, lines, i);
          analyses.push({
            file: filePath,
            line: lineNumber,
            comment,
            analysis,
          });
        }
      }
    }

    const commentsToKeep = analyses.filter(
      (a) => a.analysis.type === "keep",
    ).length;
    const commentsToRemove = analyses.filter(
      (a) => a.analysis.type === "remove",
    ).length;

    return {
      totalComments: analyses.length,
      commentsToKeep,
      commentsToRemove,
      analyses,
    };
  }

  /**
   * Analiza un comentario individual usando heurísticas
   */
  private analyzeComment(
    comment: string,
    line: string,
    lines: string[],
    lineIndex: number,
  ): CommentAnalysis {
    const commentLower = comment.toLowerCase();

    // CRITERIOS PARA MANTENER (KEEP):

    // 1. Explica algoritmos complejos
    if (this.explainsComplexAlgorithm(comment, lines, lineIndex)) {
      return {
        type: "keep",
        reason: "Explica algoritmo complejo",
        confidence: 0.9,
      };
    }

    // 2. Documenta decisiones de arquitectura
    if (this.documentsArchitectureDecision(comment)) {
      return {
        type: "keep",
        reason: "Documenta decisión de arquitectura",
        confidence: 0.85,
      };
    }

    // 3. Explica workarounds de bugs
    if (this.explainsBugWorkaround(comment)) {
      return {
        type: "keep",
        reason: "Explica workaround de bug",
        confidence: 0.9,
      };
    }

    // 4. Tiene contexto de negocio
    if (this.hasBusinessContext(comment)) {
      return {
        type: "keep",
        reason: "Tiene contexto de negocio",
        confidence: 0.8,
      };
    }

    // 5. Es TODO/FIXME/HACK con contexto específico
    if (this.isActionableComment(comment)) {
      return {
        type: "keep",
        reason: "Comentario accionable (TODO/FIXME/HACK)",
        confidence: 0.85,
      };
    }

    // 6. Explica edge cases
    if (this.explainsEdgeCase(comment)) {
      return {
        type: "keep",
        reason: "Explica edge case",
        confidence: 0.8,
      };
    }

    // 7. Referencia a documentación externa
    if (this.referencesDocumentation(comment)) {
      return {
        type: "keep",
        reason: "Referencia a documentación",
        confidence: 0.75,
      };
    }

    // CRITERIOS PARA ELIMINAR (REMOVE):

    // 1. Repite el código obviamente
    if (this.repeatsCode(comment, line)) {
      return {
        type: "remove",
        reason: "Repite el código obviamente",
        confidence: 0.95,
      };
    }

    // 2. Es obvio (ej. // return true)
    if (this.isObvious(comment, line)) {
      return {
        type: "remove",
        reason: "Comentario obvio",
        confidence: 0.9,
      };
    }

    // 3. Está desactualizado
    if (this.isOutdated(comment, lines, lineIndex)) {
      return {
        type: "remove",
        reason: "Comentario desactualizado",
        confidence: 0.85,
      };
    }

    // 4. Es comentario de debug olvidado
    if (this.isForgottenDebugComment(comment, line)) {
      return {
        type: "remove",
        reason: "Comentario de debug olvidado",
        confidence: 0.95,
      };
    }

    // 5. Es redundante con nombres descriptivos
    if (this.isRedundantWithNames(comment, line)) {
      return {
        type: "remove",
        reason: "Redundante con nombres descriptivos",
        confidence: 0.8,
      };
    }

    // 6. Es basura (símbolos, texto sin sentido)
    if (this.isGarbage(comment)) {
      return {
        type: "remove",
        reason: "Basura sin sentido",
        confidence: 0.9,
      };
    }

    // AMBIGUO - Requiere IA para decidir
    return {
      type: "keep", // Por defecto mantener si es ambiguo
      reason: "Ambiguo - requiere análisis IA",
      confidence: 0.5,
    };
  }

  /**
   * Verifica si el comentario explica un algoritmo complejo
   */
  private explainsComplexAlgorithm(
    comment: string,
    lines: string[],
    lineIndex: number,
  ): boolean {
    const complexityKeywords = [
      "complexity",
      "o(n",
      "o(log",
      "algorithm",
      "backtracking",
      "dynamic programming",
      "dp",
      "recursive",
      "optimization",
      "complex",
      "complicated",
      "tricky",
      "hacky",
    ];

    const commentLower = comment.toLowerCase();
    const hasKeyword = complexityKeywords.some((kw) =>
      commentLower.includes(kw),
    );

    // Verificar si el código cercano es complejo
    const nearbyCode = lines
      .slice(Math.max(0, lineIndex - 2), lineIndex + 3)
      .join(" ");
    const hasComplexCode =
      nearbyCode.includes("for (") ||
      nearbyCode.includes("while (") ||
      nearbyCode.includes("recursive") ||
      nearbyCode.includes("reduce") ||
      nearbyCode.includes("map(") ||
      nearbyCode.includes("filter(");

    return hasKeyword || hasComplexCode;
  }

  /**
   * Verifica si el comentario documenta una decisión de arquitectura
   */
  private documentsArchitectureDecision(comment: string): boolean {
    const architectureKeywords = [
      "architecture",
      "design",
      "pattern",
      "why",
      "reason",
      "because",
      "chosen",
      "selected",
      "trade-off",
      "tradeoff",
      "decided",
      "implemented",
      "approach",
    ];

    const commentLower = comment.toLowerCase();
    return architectureKeywords.some((kw) => commentLower.includes(kw));
  }

  /**
   * Verifica si el comentario explica un workaround de bug
   */
  private explainsBugWorkaround(comment: string): boolean {
    const workaroundKeywords = [
      "bug",
      "fix",
      "workaround",
      "issue",
      "problem",
      "error",
      "exception",
      "hack",
      "patch",
      "temporary",
      "until",
      "waiting for",
    ];

    const commentLower = comment.toLowerCase();
    return workaroundKeywords.some((kw) => commentLower.includes(kw));
  }

  /**
   * Verifica si el comentario tiene contexto de negocio
   */
  private hasBusinessContext(comment: string): boolean {
    const businessKeywords = [
      "business",
      "requirement",
      "user",
      "customer",
      "client",
      "feature",
      "workflow",
      "process",
      "rule",
      "policy",
      "validation",
      "constraint",
    ];

    const commentLower = comment.toLowerCase();
    return businessKeywords.some((kw) => commentLower.includes(kw));
  }

  /**
   * Verifica si es un comentario accionable
   */
  private isActionableComment(comment: string): boolean {
    const actionablePrefixes = ["todo", "fixme", "hack", "note", "warning"];
    const commentLower = comment.toLowerCase();

    return actionablePrefixes.some((prefix) => commentLower.startsWith(prefix));
  }

  /**
   * Verifica si el comentario explica un edge case
   */
  private explainsEdgeCase(comment: string): boolean {
    const edgeCaseKeywords = [
      "edge case",
      "edge-case",
      "edgecase",
      "boundary",
      "corner case",
      "corner-case",
      "corner case",
      "special case",
      "exception",
      "when",
      "if",
      "handle",
      "scenario",
    ];

    const commentLower = comment.toLowerCase();
    return edgeCaseKeywords.some((kw) => commentLower.includes(kw));
  }

  /**
   * Verifica si el comentario referencia documentación
   */
  private referencesDocumentation(comment: string): boolean {
    const docPatterns = [
      /https?:\/\//, // URLs
      /see\s+(the\s+)?docs/i,
      /reference/i,
      /documentation/i,
      /mdn/i,
      /wikipedia/i,
    ];

    return docPatterns.some((pattern) => pattern.test(comment));
  }

  /**
   * Verifica si el comentario repite el código obviamente
   */
  private repeatsCode(comment: string, line: string): boolean {
    // Ejemplo: // incrementa i // i++
    const commentLower = comment.toLowerCase().replace(/\s/g, "");
    const codeLower = line.toLowerCase().replace(/\s/g, "");

    // Si el comentario es muy similar al código
    const similarity = this.calculateSimilarity(commentLower, codeLower);
    return similarity > 0.7 && commentLower.length > 3;
  }

  /**
   * Verifica si el comentario es obvio
   */
  private isObvious(comment: string, line: string): boolean {
    const obviousPatterns = [
      /return\s+\w+/i,
      /true|false/i,
      /null|undefined/i,
      /\d+/,
      /empty/i,
      /clear/i,
      /reset/i,
    ];

    // Si el comentario describe algo muy obvio en el código
    const commentLower = comment.toLowerCase();
    return (
      obviousPatterns.some((pattern) => pattern.test(comment)) &&
      commentLower.length < 20
    );
  }

  /**
   * Verifica si el comentario está desactualizado
   */
  private isOutdated(
    comment: string,
    lines: string[],
    lineIndex: number,
  ): boolean {
    const outdatedKeywords = [
      "deprecated",
      "old",
      "legacy",
      "previous",
      "removed",
      "deleted",
      "no longer",
      "not used",
      "unused",
    ];

    const commentLower = comment.toLowerCase();
    const hasOutdatedKeyword = outdatedKeywords.some((kw) =>
      commentLower.includes(kw),
    );

    // Verificar si el código referenciado ya no existe
    const nearbyCode = lines.slice(lineIndex, lineIndex + 5).join(" ");
    const hasReferencedCode = nearbyCode.includes(comment.split(" ")[0]);

    return hasOutdatedKeyword && !hasReferencedCode;
  }

  /**
   * Verifica si es un comentario de debug olvidado
   */
  private isForgottenDebugComment(comment: string, line: string): boolean {
    const debugPatterns = [
      /console\.log/i,
      /debug/i,
      /test/i,
      /tmp/i,
      /temp/i,
      /xxx/i,
      /\*\*\*/i,
    ];

    return debugPatterns.some((pattern) => pattern.test(comment));
  }

  /**
   * Verifica si es redundante con nombres descriptivos
   */
  private isRedundantWithNames(comment: string, line: string): boolean {
    // Ejemplo: // getUserData function
    const functionMatch = line.match(/function\s+(\w+)/);
    if (functionMatch) {
      const functionName = functionMatch[1].toLowerCase();
      const commentLower = comment.toLowerCase();

      // Si el comentario repite el nombre de la función
      if (
        commentLower.includes(functionName) &&
        commentLower.length < functionName.length + 10
      ) {
        return true;
      }
    }

    return false;
  }

  /**
   * Verifica si es basura
   */
  private isGarbage(comment: string): boolean {
    // Solo símbolos o texto sin sentido
    const garbagePatterns = [
      /^[^\w\s]+$/, // Solo símbolos
      /^[a-z]{1,2}$/, // 1-2 letras sin sentido
      /^\d+$/, // Solo números
      /^[\s\-_]+$/, // Solo espacios, guiones, guiones bajos
    ];

    return garbagePatterns.some((pattern) => pattern.test(comment));
  }

  /**
   * Calcula similitud entre dos strings (algoritmo simple)
   */
  private calculateSimilarity(str1: string, str2: string): number {
    if (str1 === str2) return 1;
    if (str1.length === 0 || str2.length === 0) return 0;

    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    const longerLength = longer.length;
    if (longerLength === 0) return 1;

    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longerLength - editDistance) / longerLength;
  }

  /**
   * Calcula distancia de Levenshtein
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1,
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Genera reporte en Markdown del análisis
   */
  generateAnalysisReport(result: CommentAnalysisResult): string {
    let report = "# Comment Analysis Report\n\n";
    report += `**Total Comments:** ${result.totalComments}\n`;
    report += `**Comments to Keep:** ${result.commentsToKeep}\n`;
    report += `**Comments to Remove:** ${result.commentsToRemove}\n\n`;

    if (result.commentsToRemove > 0) {
      report += "## Comments to Remove\n\n";
      const toRemove = result.analyses.filter(
        (a) => a.analysis.type === "remove",
      );

      for (const item of toRemove) {
        report += `### ${item.file}:${item.line}\n`;
        report += `**Comment:** \`${item.comment}\`\n`;
        report += `**Reason:** ${item.analysis.reason}\n`;
        report += `**Confidence:** ${(item.analysis.confidence * 100).toFixed(0)}%\n\n`;
      }
    }

    if (result.commentsToKeep > 0) {
      report += "## Comments to Keep\n\n";
      const toKeep = result.analyses.filter((a) => a.analysis.type === "keep");

      for (const item of toKeep) {
        report += `### ${item.file}:${item.line}\n`;
        report += `**Comment:** \`${item.comment}\`\n`;
        report += `**Reason:** ${item.analysis.reason}\n`;
        report += `**Confidence:** ${(item.analysis.confidence * 100).toFixed(0)}%\n\n`;
      }
    }

    return report;
  }
}

export default CommentAnalyzer;
export { CommentAnalyzer, CommentAnalysis, CommentAnalysisResult };
