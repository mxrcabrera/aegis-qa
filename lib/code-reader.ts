/**
 * Code Reader - Motor de Visión para QA Orchestrator
 *
 * Propósito: Mapear recursivamente el directorio de una app Next.js
 * para reconstruir el árbol de rutas del App Router.
 *
 * Funcionalidades:
 * - Detectar archivos page.tsx, layout.tsx, route.ts
 * - Identificar Server Actions buscando "use server"
 * - Construir estructura de rutas
 * - Exportar mapa de rutas como JSON
 * - Hardware Protection via ThermalController
 */

import * as fs from "fs-extra";
import * as path from "path";
import { glob } from "glob";
import ThermalController from "./thermal-controller.js";

interface RouteNode {
  path: string;
  type: "page" | "layout" | "route" | "loading" | "error" | "not-found";
  filePath: string;
  children?: RouteNode[];
  serverActions?: string[];
  hasServerAction?: boolean;
}

interface CodeReaderConfig {
  projectPath: string;
  appDir?: string;
  thermalController?: ThermalController;
}

class CodeReader {
  private config: CodeReaderConfig;
  private routeTree: RouteNode[] = [];

  constructor(config: CodeReaderConfig) {
    this.config = {
      appDir: config.appDir || "app",
      ...config,
    };
  }

  /**
   * Escanea el directorio app y construye el árbol de rutas
   */
  async scanAppRouter(): Promise<RouteNode[]> {
    const appPath = path.join(this.config.projectPath, this.config.appDir!);

    if (!(await fs.pathExists(appPath))) {
      console.log(`App directory not found: ${appPath}. Skipping route audit.`);
      return []; // Return empty array instead of throwing error
    }

    // Hardware check before processing
    if (this.config.thermalController) {
      const tempReading = await this.config.thermalController.checkTemperature();
      if (!tempReading.isSafe) {
        console.warn(`[CodeReader] GPU temperature unsafe (${tempReading.current}°C), applying cooldown`);
        await this.config.thermalController.applyCooldown(3000);
      }
    }

    // Buscar todos los archivos relevantes
    const pageFiles = await glob("**/page.tsx", { cwd: appPath });
    const layoutFiles = await glob("**/layout.tsx", { cwd: appPath });
    const routeFiles = await glob("**/route.ts", { cwd: appPath });
    const loadingFiles = await glob("**/loading.tsx", { cwd: appPath });
    const errorFiles = await glob("**/error.tsx", { cwd: appPath });
    const notFoundFiles = await glob("**/not-found.tsx", { cwd: appPath });

    // Construir árbol de rutas
    this.routeTree = await this.buildRouteTree(appPath, {
      pages: pageFiles,
      layouts: layoutFiles,
      routes: routeFiles,
      loading: loadingFiles,
      error: errorFiles,
      notFound: notFoundFiles,
    });

    return this.routeTree;
  }

  /**
   * Construye el árbol de rutas recursivamente
   */
  private async buildRouteTree(
    appPath: string,
    files: {
      pages: string[];
      layouts: string[];
      routes: string[];
      loading: string[];
      error: string[];
      notFound: string[];
    },
  ): Promise<RouteNode[]> {
    const nodes: Map<string, RouteNode> = new Map();
    const allFiles = [
      ...files.pages.map((f) => ({ file: f, type: "page" as const })),
      ...files.layouts.map((f) => ({ file: f, type: "layout" as const })),
      ...files.routes.map((f) => ({ file: f, type: "route" as const })),
      ...files.loading.map((f) => ({ file: f, type: "loading" as const })),
      ...files.error.map((f) => ({ file: f, type: "error" as const })),
      ...files.notFound.map((f) => ({ file: f, type: "not-found" as const })),
    ];

    // Crear nodos para cada archivo
    for (const { file, type } of allFiles) {
      const fullPath = path.join(appPath, file);
      const dirPath = path.dirname(file);
      const routePath = this.dirPathToRoutePath(dirPath);

      // Detectar Server Actions
      const serverActions = await this.detectServerActions(fullPath);

      const node: RouteNode = {
        path: routePath,
        type,
        filePath: fullPath,
        serverActions,
        hasServerAction: serverActions.length > 0,
      };

      // Usar la ruta como clave (el layout/page en ese path)
      const key = `${routePath}:${type}`;
      nodes.set(key, node);
    }

    // Organizar en jerarquía
    return Array.from(nodes.values());
  }

  /**
   * Convierte un path de directorio a ruta de Next.js
   */
  private dirPathToRoutePath(dirPath: string): string {
    if (dirPath === ".") return "/";
    return "/" + dirPath.replace(/\\/g, "/");
  }

  /**
   * Detecta Server Actions buscando "use server" directive
   */
  private async detectServerActions(filePath: string): Promise<string[]> {
    try {
      const content = await fs.readFile(filePath, "utf-8");
      const lines = content.split("\n");
      const actions: string[] = [];
      let inServerAction = false;
      let currentAction = "";

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Detectar "use server"
        if (line.includes("use server")) {
          inServerAction = true;
        }

        // Detectar funciones exportadas
        if (inServerAction && line.match(/export\s+(async\s+)?function/)) {
          const match = line.match(/export\s+(?:async\s+)?function\s+(\w+)/);
          if (match) {
            currentAction = match[1];
            actions.push(currentAction);
          }
        }

        // Detectar arrow functions exportadas
        if (
          inServerAction &&
          line.match(/export\s+(?:async\s+)?const\s+(\w+)\s*=/)
        ) {
          const match = line.match(/export\s+(?:async\s+)?const\s+(\w+)\s*=/);
          if (match) {
            currentAction = match[1];
            actions.push(currentAction);
          }
        }

        // Detectar fin de función
        if (inServerAction && line.match(/^}$/)) {
          inServerAction = false;
          currentAction = "";
        }
      }

      return actions;
    } catch (error) {
      console.warn(
        `Failed to read file for server action detection: ${filePath}`,
      );
      return [];
    }
  }

  /**
   * Escanea todos los archivos .ts y .tsx buscando patrones específicos
   */
  async scanForPattern(
    pattern: RegExp,
    projectPath: string,
  ): Promise<string[]> {
    const allFiles = await glob("**/*.{ts,tsx}", { cwd: projectPath });
    const matches: string[] = [];

    for (const file of allFiles) {
      const fullPath = path.join(projectPath, file);
      try {
        const content = await fs.readFile(fullPath, "utf-8");
        if (pattern.test(content)) {
          matches.push(fullPath);
        }
      } catch (error) {
        // Skip files that can't be read
      }
    }

    return matches;
  }

  /**
   * Obtiene estadísticas del proyecto
   */
  async getProjectStats(projectPath: string): Promise<{
    totalFiles: number;
    tsFiles: number;
    tsxFiles: number;
    jsFiles: number;
    jsxFiles: number;
  }> {
    const tsFiles = await glob("**/*.ts", { cwd: projectPath });
    const tsxFiles = await glob("**/*.tsx", { cwd: projectPath });
    const jsFiles = await glob("**/*.js", { cwd: projectPath });
    const jsxFiles = await glob("**/*.jsx", { cwd: projectPath });

    return {
      totalFiles:
        tsFiles.length + tsxFiles.length + jsFiles.length + jsxFiles.length,
      tsFiles: tsFiles.length,
      tsxFiles: tsxFiles.length,
      jsFiles: jsFiles.length,
      jsxFiles: jsxFiles.length,
    };
  }

  /**
   * Exporta el árbol de rutas como JSON
   */
  exportRouteTree(): string {
    return JSON.stringify(this.routeTree, null, 2);
  }

  /**
   * Imprime el árbol de rutas de forma legible
   */
  printRouteTree(): void {
    console.log(JSON.stringify(this.routeTree, null, 2));
  }
}

export default CodeReader;
export { CodeReader, RouteNode, CodeReaderConfig };
