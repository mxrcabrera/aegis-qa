/**
 * CSSGlobalIndexer - Motor de Indexación Semántica de CSS Global
 *
 * Propósito: Indexar el CSS global (globals.css) usando IA para generar un mapa
 * semántico que relacione clases CSS con entidades de negocio.
 *
 * Funcionalidades:
 * - Analizar CSS global con modelo 32B
 * - Generar mapa semántico de clases CSS
 * - Mapear entidades de negocio a clases CSS apropiadas
 * - Soportar diferentes frameworks CSS (Tailwind, Bootstrap, Custom)
 */

import * as fs from "fs-extra";
import * as path from "path";
import { spawn } from "child_process";
import OllamaProcessor from "./ollama-processor";

interface CSSProperties {
  [property: string]: string;
}

interface GlobalCSSMap {
  classes: {
    [className: string]: {
      properties: CSSProperties;
      semanticPurpose: string;
    };
  };
  semanticMappings: {
    [businessEntity: string]: string[];
  };
}

interface CSSIndexResult {
  success: boolean;
  globalCSSMap: GlobalCSSMap | null;
  error?: string;
}

class CSSGlobalIndexer {
  private projectPath: string;
  private ollamaProcessor: OllamaProcessor;
  private globalCSSMap: GlobalCSSMap | null = null;

  constructor(projectPath: string) {
    this.projectPath = projectPath;
    this.ollamaProcessor = OllamaProcessor.getInstance();
  }

  /**
   * Indexa el CSS global y genera mapa semántico
   */
  async indexGlobalCSS(cssPath: string): Promise<CSSIndexResult> {
    console.log("=== CSS GLOBAL INDEXER ===");
    console.log(`Analizando CSS: ${cssPath}`);

    try {
      // Verificar que el archivo existe
      if (!(await fs.pathExists(cssPath))) {
        console.warn(`CSS file not found: ${cssPath}`);
        return {
          success: false,
          globalCSSMap: null,
          error: `CSS file not found: ${cssPath}`,
        };
      }

      // Leer contenido del CSS
      const cssContent = await fs.readFile(cssPath, "utf8");
      console.log(`CSS content length: ${cssContent.length} chars`);

      // Paso 1: Pedir al 32B que resuma el CSS semánticamente
      console.log("Generando resumen semántico con Qwen2.5-Coder:32b...");
      const semanticSummary = await this.generateSemanticSummary(cssContent);
      console.log("Resumen generado exitosamente");

      // Paso 2: Parsear el resumen a JSON estructurado
      console.log("Parseando resumen a JSON estructurado...");
      this.globalCSSMap = this.parseSemanticSummary(semanticSummary);
      console.log(
        `Mapa generado: ${Object.keys(this.globalCSSMap.classes).length} clases indexadas`,
      );

      // Paso 3: Mostrar resumen del mapa
      this.printCSSMapSummary();

      return {
        success: true,
        globalCSSMap: this.globalCSSMap,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      console.error(`Error indexing CSS: ${errorMessage}`);
      return {
        success: false,
        globalCSSMap: null,
        error: errorMessage,
      };
    }
  }

  /**
   * Genera resumen semántico del CSS usando 32B
   */
  private async generateSemanticSummary(cssContent: string): Promise<string> {
    const systemPrompt = `Sos un experto en arquitectura CSS y diseño de sistemas con 32 billones de parámetros de razonamiento.

Tu tarea: Analizar este CSS global y generar un JSON estructurado que capture:
1. Todas las clases CSS definidas y sus propiedades
2. El propósito semántico de cada clase (para qué sirve en el diseño del sistema)
3. Mapeo de entidades de negocio comunes a clases CSS apropiadas

IMPORTANTE:
- Identifica patrones de nomenclatura (btn-*, container-*, card-*, etc.)
- Agrupa clases por propósito semántico (botones, contenedores, tipografía, layout)
- Mapea entidades de negocio lógicas a clases (ej. "botón de acción" → "btn-primary")
- Si es Tailwind, identifica las utilidades disponibles
- Si es Bootstrap, identifica los componentes del framework
- Si es CSS custom, identifica las clases semánticas del proyecto

SALIDA: JSON válido con esta estructura exacta:
{
  "classes": {
    "btn": {
      "properties": { "padding": "10px 20px", "backgroundColor": "#007bff" },
      "semanticPurpose": "botón primario de acción"
    },
    "container": {
      "properties": { "maxWidth": "1200px", "margin": "0 auto" },
      "semanticPurpose": "contenedor principal de contenido"
    }
  },
  "semanticMappings": {
    "button": ["btn", "btn-primary", "btn-secondary"],
    "container": ["container", "container-fluid"],
    "card": ["card", "card-body"],
    "text": ["text-primary", "text-secondary", "text-muted"]
  }
}

CSS A ANALIZAR:
`;

    const fullPrompt =
      systemPrompt + "\n```\n" + cssContent + "\n```\n\nDevuelve el JSON:";

    // Usar OllamaProcessor para procesar el contenido
    // Como OllamaProcessor está diseñado para refactorizar código, necesitamos adaptarlo
    // Por ahora, usaremos el método existente pero con un prompt específico
    const response = await this.sendToOllamaForCSSAnalysis(fullPrompt);

    return response;
  }

  /**
   * Envía prompt a Ollama para análisis de CSS
   */
  private async sendToOllamaForCSSAnalysis(prompt: string): Promise<string> {
    const model = "qwen2.5-coder:32b";

    return new Promise((resolve, reject) => {
      console.log("Iniciando análisis CSS con Ollama...");
      const startTime = Date.now();

      const ollama = spawn("ollama", ["run", model], {
        stdio: ["pipe", "pipe", "pipe"],
        timeout: 300000,
      });

      let stdout = "";
      let stderr = "";

      ollama.stdout.on("data", (data: Buffer) => {
        stdout += data.toString();
      });

      ollama.stderr.on("data", (data: Buffer) => {
        stderr += data.toString();
      });

      const timeout = setTimeout(() => {
        ollama.kill();
        reject(new Error("TIMEOUT: Ollama no respondió en 5 minutos"));
      }, 300000);

      // Heartbeat log cada 10 segundos
      const heartbeat = setInterval(() => {
        console.log(
          `[ANALIZANDO CSS...] Procesando con Qwen2.5-Coder:32b - ${Math.floor((Date.now() - startTime) / 1000)}s transcurridos`,
        );
      }, 10000);

      ollama.on("close", (exitCode: number) => {
        clearTimeout(timeout);
        clearInterval(heartbeat);

        if (exitCode !== 0) {
          console.error(
            `Ollama exited with code: ${exitCode}, STDERR: ${stderr}`,
          );
          reject(new Error(`Ollama process failed with exit code ${exitCode}`));
          return;
        }

        const response = stdout.trim();
        console.log(`Response received: ${response.length} chars`);

        // Extraer JSON de la respuesta
        const jsonMatch =
          response.match(/```(?:json)?\n?([\s\S]*?)\n```/) ||
          response.match(/\{[\s\S]*\}/);
        const jsonContent = jsonMatch ? jsonMatch[1] || jsonMatch[0] : response;

        resolve(jsonContent);
      });

      ollama.on("error", (error: Error) => {
        clearTimeout(timeout);
        reject(error);
      });

      // Enviar prompt por stdin
      ollama.stdin.write(prompt);
      ollama.stdin.end();
    });
  }

  /**
   * Parsea el resumen semántico a JSON estructurado
   */
  private parseSemanticSummary(semanticSummary: string): GlobalCSSMap {
    try {
      // Intentar parsear como JSON directo
      const parsed = JSON.parse(semanticSummary);

      // Validar estructura mínima
      if (!parsed.classes || !parsed.semanticMappings) {
        throw new Error(
          "Invalid CSS map structure: missing classes or semanticMappings",
        );
      }

      return parsed as GlobalCSSMap;
    } catch (error) {
      console.warn("Error parsing semantic summary, using fallback");
      console.error(error);

      // Fallback: mapa vacío
      return {
        classes: {},
        semanticMappings: {},
      };
    }
  }

  /**
   * Obtiene clases sugeridas para una entidad de negocio
   */
  getSuggestedClassesForEntity(entityName: string): string[] {
    if (!this.globalCSSMap) return [];

    const entityLower = entityName.toLowerCase();

    // Buscar mapeo directo
    const directMapping = this.globalCSSMap.semanticMappings[entityLower];
    if (directMapping) return directMapping;

    // Buscar por similitud semántica
    const similarKeys = Object.keys(this.globalCSSMap.semanticMappings).filter(
      (key) =>
        key.includes(entityLower) ||
        entityLower.includes(key) ||
        this.areSemanticallySimilar(key, entityLower),
    );

    return similarKeys.flatMap(
      (key) => this.globalCSSMap!.semanticMappings[key],
    );
  }

  /**
   * Verifica similitud semántica entre dos palabras
   */
  private areSemanticallySimilar(word1: string, word2: string): boolean {
    // Mapeo de sinónimos comunes
    const synonyms: { [key: string]: string[] } = {
      button: ["btn", "botón"],
      container: ["contenedor", "wrapper"],
      card: ["tarjeta", "panel"],
      text: ["texto", "tipografía"],
      image: ["img", "imagen", "foto"],
      input: ["campo", "entrada"],
    };

    for (const [key, values] of Object.entries(synonyms)) {
      if (values.includes(word1) && values.includes(word2)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Imprime resumen del mapa CSS
   */
  private printCSSMapSummary(): void {
    if (!this.globalCSSMap) return;

    console.log("\n=== CSS GLOBAL MAP SUMMARY ===");
    console.log(
      `Total clases indexadas: ${Object.keys(this.globalCSSMap.classes).length}`,
    );
    console.log(
      `Total mapeos semánticos: ${Object.keys(this.globalCSSMap.semanticMappings).length}`,
    );

    console.log("\nCLASES CSS:");
    for (const [className, info] of Object.entries(this.globalCSSMap.classes)) {
      console.log(`  .${className}: ${info.semanticPurpose}`);
      console.log(`    Propiedades: ${JSON.stringify(info.properties)}`);
    }

    console.log("\nMAPEOS SEMÁNTICOS:");
    for (const [entity, classes] of Object.entries(
      this.globalCSSMap.semanticMappings,
    )) {
      console.log(`  ${entity} → ${classes.join(", ")}`);
    }

    console.log("=========================\n");
  }

  /**
   * Obtiene el mapa CSS global
   */
  getGlobalCSSMap(): GlobalCSSMap | null {
    return this.globalCSSMap;
  }

  /**
   * Genera reporte en Markdown del mapa CSS
   */
  generateCSSMapReport(): string {
    if (!this.globalCSSMap) {
      return "# CSS Global Map Report\n\nNo CSS map available.";
    }

    let report = "# CSS Global Map Report\n\n";
    report += `**Total Classes:** ${Object.keys(this.globalCSSMap.classes).length}\n`;
    report += `**Semantic Mappings:** ${Object.keys(this.globalCSSMap.semanticMappings).length}\n\n`;

    report += "## CSS Classes\n\n";
    for (const [className, info] of Object.entries(this.globalCSSMap.classes)) {
      report += `### .${className}\n`;
      report += `**Purpose:** ${info.semanticPurpose}\n\n`;
      report += "**Properties:**\n";
      report += "```css\n";
      for (const [prop, value] of Object.entries(info.properties)) {
        report += `  ${prop}: ${value};\n`;
      }
      report += "```\n\n";
    }

    report += "## Semantic Mappings\n\n";
    report += "| Business Entity | CSS Classes |\n";
    report += "|-----------------|-------------|\n";
    for (const [entity, classes] of Object.entries(
      this.globalCSSMap.semanticMappings,
    )) {
      report += `| ${entity} | ${classes.join(", ")} |\n`;
    }

    return report;
  }
}

export default CSSGlobalIndexer;
export { CSSGlobalIndexer, GlobalCSSMap, CSSProperties, CSSIndexResult };
