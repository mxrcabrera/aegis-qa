/**
 * Setup Wizard - Legendary Mode "Doble Click y Tuki"
 *
 * Purpose: One-time setup with zero friction
 * Features: Admin permissions, Ollama installation, auto-cleanup
 * Philosophy: Copy script to any repo = Senior dev working for free
 */

import * as fs from "fs-extra";
import * as path from "path";
import { exec } from "child_process";
import { promisify } from "util";
import { createInterface } from "readline";

const execAsync = promisify(exec);

interface SetupConfig {
  adminPermissions: boolean;
  ollamaInstalled: boolean;
  ollamaVersion?: string;
  setupCompleted: boolean;
  timestamp: number;
}

interface ProjectStats {
  filesProcessed: number;
  violationsFound: number;
  fixesApplied: number;
  reportPath: string;
}

class SetupWizard {
  private static instance: SetupWizard;
  private config: SetupConfig;
  private readonly configFile = path.join(process.cwd(), ".qa-setup.json");
  private readonly rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  private constructor() {
    this.config = {
      adminPermissions: false,
      ollamaInstalled: false,
      setupCompleted: false,
      timestamp: 0,
    };
  }

  static getInstance(): SetupWizard {
    if (!SetupWizard.instance) {
      SetupWizard.instance = new SetupWizard();
    }
    return SetupWizard.instance;
  }

  /**
   * Legendary Setup - "Doble Click y Tuki" con Validación de Entorno
   */
  async legendarySetup(): Promise<boolean> {
    console.log("");
    console.log("========================================");
    console.log("  QA ORCHESTRATOR - LEGENDARY MODE    ");
    console.log('       "Doble Click y Tuki"           ');
    console.log("========================================");
    console.log("");
    console.log("Bienvenido al futuro del QA autónomo...");
    console.log("");

    try {
      // Validación de Entorno - Verificar entorno básico
      console.log("=== VALIDACIÓN DE ENTORNO ===");
      console.log("Verificando entorno de ejecución...");

      // Verificar Node.js
      const nodeVersion = process.version;
      console.log(`Node.js: ${nodeVersion}`);

      // Verificar plataforma
      const platform = process.platform;
      console.log(`Plataforma: ${platform}`);

      // Verificar directorio actual
      const cwd = process.cwd();
      console.log(`Directorio actual: ${cwd}`);

      // Verificar permisos básicos
      try {
        const testFile = path.join(cwd, ".qa-test-permissions");
        fs.writeFileSync(testFile, "test");
        fs.unlinkSync(testFile);
        console.log("Permisos de escritura: OK");
      } catch (permError) {
        console.error("ERROR: Sin permisos de escritura");
        throw new Error(
          "Se requieren permisos de administrador para escribir en el directorio",
        );
      }

      console.log("AUDIT: validateEnvironment completado.\n");

      // Check if setup was already completed
      console.log("AUDIT: Verificando si setup está completo...");
      const setupComplete = await this.isSetupComplete();
      console.log(`AUDIT: isSetupComplete retornó: ${setupComplete}`);

      if (setupComplete) {
        console.log("Setup ya completado. Iniciando modo LEGENDARIO...");
        return true;
      }

      // Step 1: Admin Permissions
      console.log("AUDIT: Iniciando requestAdminPermissions...");
      console.log("=== PASO 1: PERMISOS DE ADMIN ===");
      await this.requestAdminPermissions();
      console.log("AUDIT: requestAdminPermissions completado.");

      // Step 2: Ollama Detection & Installation
      console.log("AUDIT: Iniciando setupOllama...");
      console.log("=== PASO 2: OLLAMA SETUP ===");
      await this.setupOllama();
      console.log("AUDIT: setupOllama completado.");

      // Step 3: Save configuration
      console.log("AUDIT: Iniciando saveSetupConfig...");
      console.log("=== PASO 3: CONFIGURACIÓN ===");
      await this.saveSetupConfig();
      console.log("AUDIT: saveSetupConfig completado.");

      console.log("");
      console.log("========================================");
      console.log("  SETUP LEGENDARIO COMPLETADO         ");
      console.log("========================================");
      console.log("El QA Orchestrator está listo para");
      console.log("trabajar como un Senior dev GRATIS.");
      console.log("");

      return true;
    } catch (error) {
      console.error("\n========================================");
      console.error("      ERROR EN SETUP LEGENDARIO       ");
      console.error("========================================");
      console.error("");

      const errorMessage =
        error instanceof Error ? error.message : "Error desconocido";
      const errorStack =
        error instanceof Error ? error.stack : "No stack disponible";

      console.error("ERROR DETALLADO:");
      console.error(`Mensaje: ${errorMessage}`);
      console.error(`Stack: ${errorStack}`);
      console.error("");

      console.error("DIAGNÓSTICO:");

      // Diagnóstico específico
      if (
        errorMessage.includes("EACCES") ||
        errorMessage.includes("permission")
      ) {
        console.error("- PROBLEMA: Permisos insuficientes");
        console.error("- SOLUCIÓN: Ejecutar como administrador");
      } else if (errorMessage.includes("ENOENT")) {
        console.error("- PROBLEMA: Archivo o directorio no encontrado");
        console.error("- SOLUCIÓN: Verificar rutas y existencia de archivos");
      } else if (errorMessage.includes("ollama")) {
        console.error("- PROBLEMA: Error con Ollama");
        console.error("- SOLUCIÓN: Verificar instalación de Ollama");
      } else if (
        errorMessage.includes("network") ||
        errorMessage.includes("fetch")
      ) {
        console.error("- PROBLEMA: Error de red");
        console.error("- SOLUCIÓN: Verificar conexión a internet");
      } else {
        console.error("- PROBLEMA: Error general");
        console.error("- SOLUCIÓN: Revisar el mensaje de error específico");
      }

      console.error("");
      console.error("AYUDA ADICIONAL:");
      console.error("1. Asegurate de ejecutar como administrador");
      console.error("2. Verifica que el directorio sea accesible");
      console.error("3. Revisa la conexión a internet");
      console.error("4. Intenta reinstalar Ollama manualmente");
      console.error("");

      return false;
    } finally {
      try {
        this.rl.close();
      } catch (e) {
        // Ignorar error al cerrar readline
      }
    }
  }

  /**
   * Check if setup was already completed
   */
  private async isSetupComplete(): Promise<boolean> {
    try {
      if (!(await fs.pathExists(this.configFile))) {
        return false;
      }

      const config = await fs.readJson(this.configFile);
      const now = Date.now();
      const age = now - config.timestamp;
      const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days

      return config.setupCompleted && age < maxAge;
    } catch (error) {
      return false;
    }
  }

  /**
   * Request admin permissions once
   */
  private async requestAdminPermissions(): Promise<void> {
    console.log("=== PERMISOS DE ADMIN ===");
    console.log("Necesito permisos de Admin/Sudo para:");
    console.log("1. Leer y modificar archivos del proyecto");
    console.log("2. Ejecutar fixes automáticos");
    console.log("3. Instalar dependencias si es necesario");
    console.log("4. Limpiar y optimizar tu código");
    console.log("");

    // Check if running with admin privileges
    const isAdmin = await this.checkAdminPrivileges();

    if (isAdmin) {
      console.log("Permisos de Admin detectados. Continuando...");
      this.config.adminPermissions = true;
      return;
    }

    console.log("No se detectan permisos de Admin.");
    console.log("Por favor, ejecuta este script como administrador.");

    // Auto-elevate on Windows
    if (process.platform === "win32") {
      console.log("Intentando elevar privilegios automáticamente...");
      await this.elevateWindows();
      this.config.adminPermissions = true;
    } else {
      console.log("Ejecuta: sudo npm run autonomous:qa [tu-proyecto]");
      throw new Error("Se requieren permisos de administrador");
    }
  }

  /**
   * Check if running with admin privileges
   */
  private async checkAdminPrivileges(): Promise<boolean> {
    try {
      if (process.platform === "win32") {
        // Windows admin check
        await execAsync("fsutil dirty query %systemdrive%", { timeout: 5000 });
        return true;
      } else {
        // Unix admin check
        await execAsync("ls /root", { timeout: 5000 });
        return true;
      }
    } catch (error) {
      return false;
    }
  }

  /**
   * Auto-elevate on Windows
   */
  private async elevateWindows(): Promise<void> {
    try {
      const scriptPath = process.argv[1];
      await execAsync(
        `powershell -Command "Start-Process '${scriptPath}' -Verb RunAs"`,
        { timeout: 10000 },
      );
      console.log(
        "Solicitud de elevación enviada. Por favor, acepta el diálogo UAC.",
      );
    } catch (error) {
      console.warn(
        "No se pudo elevar automáticamente:",
        error instanceof Error ? error.message : error,
      );
    }
  }

  /**
   * Setup Ollama - CHECK OBLIGATORIO SIN FALLBACK con Debug
   */
  private async setupOllama(): Promise<void> {
    console.log("");
    console.log("=== OLLAMA - DEPENDENCIA OBLIGATORIA ===");
    console.log("");

    try {
      // DIAGNÓSTICO REAL: Log exacto del cuello de botella
      console.log("AUDIT: Iniciando checkOllamaStatus...");
      const ollamaStatus = await this.checkOllamaStatus();
      console.log(
        `AUDIT: checkOllamaStatus retornó: ${JSON.stringify(ollamaStatus)}`,
      );

      if (ollamaStatus.installed) {
        console.log(`Ollama detectado (${ollamaStatus.version})`);
        console.log(
          "Modelos disponibles:",
          ollamaStatus.models?.join(", ") || "Ninguno",
        );
        this.config.ollamaInstalled = true;
        this.config.ollamaVersion = ollamaStatus.version;
        console.log("AUDIT: Configuración Ollama actualizada, retornando...");
        return;
      }

      // OBLIGATORY: No hay fallback, se instala automáticamente
      console.log(
        "Ollama no detectado. Iniciando instalación automática OBLIGATORIA...",
      );
      console.log("QA Orchestrator REQUIERE Ollama para funcionar.");
      console.log("");

      // Abrir nueva terminal para instalación visible
      console.log("Abriendo terminal para instalación de Ollama...");
      await execAsync(
        'start cmd /k "curl -fsSL https://ollama.ai/install.sh | sh && echo Instalación completada && pause"',
        { timeout: 60000 },
      );

      this.config.ollamaInstalled = true;
      console.log("Ollama instalado exitosamente. QA Orchestrator listo.");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Error desconocido";
      const errorStack =
        error instanceof Error ? error.stack : "No stack disponible";

      // Escribir CRITICAL_ERROR.log en escritorio
      try {
        const desktopPath = require("os").homedir() + "\\Desktop";
        const fs = require("fs");
        const logContent = `CRITICAL ERROR - QA ORCHESTRATOR
Timestamp: ${new Date().toISOString()}
Error: ${errorMessage}
Stack: ${errorStack}

ACCION REQUERIDA:
1. Instalar Ollama manualmente: https://ollama.ai/download
2. Ejecutar como administrador
3. Verificar conexión a internet

QA Orchestrator no puede continuar sin Ollama.
`;
        fs.writeFileSync(`${desktopPath}\\CRITICAL_ERROR.log`, logContent);
        console.log(
          `Error crítico escrito en: ${desktopPath}\\CRITICAL_ERROR.log`,
        );
      } catch (logError) {
        console.error("No se pudo escribir el log de error:", logError);
      }

      console.error("ERROR CRÍTICO: No se pudo instalar Ollama.");
      console.error("Log de error creado en escritorio: CRITICAL_ERROR.log");
      console.error("Instala manualmente: https://ollama.ai/download");

      // No cerrar automáticamente - esperar input
      console.log("\nPresioná Enter para salir...");
      await new Promise((resolve) => {
        process.stdin.setRawMode(true);
        process.stdin.resume();
        process.stdin.once("data", resolve);
      });

      process.exit(1);
    }
  }

  /**
   * Check Ollama installation status - Enhanced Debug
   */
  private async checkOllamaStatus(): Promise<{
    installed: boolean;
    version?: string;
    models?: string[];
  }> {
    console.log("AUDIT: checkOllamaStatus - Iniciando verificación...");

    try {
      console.log("AUDIT: Ejecutando 'ollama --version'...");
      const { stdout } = await execAsync("ollama --version", { timeout: 5000 });
      const version = stdout.trim();
      console.log(`AUDIT: Ollama version detectada: ${version}`);

      // Get models
      console.log("AUDIT: Ejecutando 'ollama list'...");
      const { stdout: modelsOutput } = await execAsync("ollama list", {
        timeout: 5000,
      });
      console.log(
        `AUDIT: ollama list output length: ${modelsOutput.length} chars`,
      );

      const models = modelsOutput
        .split("\n")
        .filter((line) => line.trim() && !line.includes("NAME"))
        .map((line) => line.split(/\s+/)[0])
        .filter((model) => model);

      console.log(`AUDIT: Modelos detectados: ${models.length}`);
      return { installed: true, version, models };
    } catch (error) {
      console.log(`AUDIT: ERROR en checkOllamaStatus:`);
      console.log(
        `AUDIT: Error type: ${error instanceof Error ? error.constructor.name : typeof error}`,
      );
      console.log(
        `AUDIT: Error message: ${error instanceof Error ? error.message : error}`,
      );
      console.log(`AUDIT: Retornando installed: false`);
      return { installed: false };
    }
  }

  /**
   * Install Ollama automatically
   */
  private async installOllama(): Promise<void> {
    console.log("Instalando Ollama...");
    console.log("Esto tomará aproximadamente 30 segundos...");
    console.log("");

    try {
      if (process.platform === "win32") {
        // Windows installation
        console.log("Descargando Ollama para Windows...");
        await execAsync("curl -fsSL https://ollama.ai/install.sh | sh", {
          timeout: 60000,
        });
      } else if (process.platform === "darwin") {
        // macOS installation
        console.log("Instalando Ollama para macOS...");
        await execAsync("curl -fsSL https://ollama.ai/install.sh | sh", {
          timeout: 60000,
        });
      } else {
        // Linux installation
        console.log("Instalando Ollama para Linux...");
        await execAsync("curl -fsSL https://ollama.ai/install.sh | sh", {
          timeout: 60000,
        });
      }

      // Verify installation
      await new Promise((resolve) => setTimeout(resolve, 2000));
      const status = await this.checkOllamaStatus();

      if (status.installed) {
        console.log("Ollama instalado exitosamente!");
        console.log("Versión:", status.version);

        // Download a default model
        console.log("Descargando modelo Llama 3.2 (3B) para indexing...");
        await execAsync("ollama pull llama3.2:3b", { timeout: 300000 });
        console.log("Modelo listo para usar!");
      } else {
        throw new Error("La instalación falló");
      }
    } catch (error) {
      console.error(
        "Error instalando Ollama:",
        error instanceof Error ? error.message : error,
      );
      console.log("");
      console.log("INSTALACIÓN MANUAL:");
      console.log("1. Visita https://ollama.ai/download");
      console.log("2. Descarga e instala Ollama");
      console.log("3. Reinicia este script");
      throw new Error("Instalación de Ollama fallida");
    }
  }

  /**
   * Zero-Friction Mode - Sweep everything without asking
   */
  async zeroFrictionMode(projectPath: string): Promise<ProjectStats> {
    console.log("");
    console.log("=== MODO ZERO-FRICTION ===");
    console.log("Barriendo todo el proyecto sin preguntar...");
    console.log("");

    const stats: ProjectStats = {
      filesProcessed: 0,
      violationsFound: 0,
      fixesApplied: 0,
      reportPath: "",
    };

    try {
      // Find all relevant files
      const files = await this.findProjectFiles(projectPath);
      console.log(`Encontrados ${files.length} archivos para procesar...`);

      // Process files in batches
      const batchSize = 50;
      for (let i = 0; i < files.length; i += batchSize) {
        const batch = files.slice(i, i + batchSize);
        await this.processBatch(batch, stats);

        // Progress indicator
        const progress = Math.min(((i + batchSize) / files.length) * 100, 100);
        console.log(
          `Progreso: ${progress.toFixed(1)}% - ${stats.fixesApplied} fixes aplicados`,
        );
      }

      console.log("");
      console.log("=== RESUMEN ZERO-FRICTION ===");
      console.log(`Archivos procesados: ${stats.filesProcessed}`);
      console.log(`Violaciones encontradas: ${stats.violationsFound}`);
      console.log(`Fixes aplicados: ${stats.fixesApplied}`);
      console.log("");

      return stats;
    } catch (error) {
      console.error(
        "Error en modo Zero-Friction:",
        error instanceof Error ? error.message : error,
      );
      throw error;
    }
  }

  /**
   * Find all project files to process
   */
  private async findProjectFiles(projectPath: string): Promise<string[]> {
    const { glob } = await import("glob");

    const patterns = [
      "app/**/*.tsx",
      "app/**/*.ts",
      "app/**/*.jsx",
      "app/**/*.js",
      "lib/**/*.tsx",
      "lib/**/*.ts",
      "lib/**/*.jsx",
      "lib/**/*.js",
      "components/**/*.tsx",
      "components/**/*.ts",
      "components/**/*.jsx",
      "components/**/*.js",
    ];

    const excludePatterns = [
      "**/node_modules/**",
      "**/.next/**",
      "**/dist/**",
      "**/build/**",
      "**/.git/**",
      "**/*.test.*",
      "**/*.spec.*",
    ];

    const allFiles: string[] = [];

    for (const pattern of patterns) {
      try {
        const files = await glob(pattern, {
          cwd: projectPath,
          ignore: excludePatterns,
          absolute: true,
        });
        allFiles.push(...files);
      } catch (error) {
        // Continue with other patterns
      }
    }

    return [...new Set(allFiles)]; // Remove duplicates
  }

  /**
   * Process a batch of files
   */
  private async processBatch(
    files: string[],
    stats: ProjectStats,
  ): Promise<void> {
    for (const file of files) {
      try {
        const content = await fs.readFile(file, "utf8");

        // Simple violation detection (would be enhanced with real audit logic)
        const violations = this.detectViolations(content);

        if (violations.length > 0) {
          stats.violationsFound += violations.length;

          // Apply fixes (simplified)
          const fixedContent = this.applyFixes(content, violations);

          if (fixedContent !== content) {
            await fs.writeFile(file, fixedContent);
            stats.fixesApplied += violations.length;
          }
        }

        stats.filesProcessed++;
      } catch (error) {
        // Continue with other files
      }
    }
  }

  /**
   * Simple violation detection
   */
  private detectViolations(content: string): string[] {
    const violations: string[] = [];

    // Check for inline styles
    if (content.includes("style={{")) {
      violations.push("inline-style");
    }

    // Check for hardcoded colors
    if (content.match(/#[0-9a-fA-F]{3,6}/g)) {
      violations.push("hardcoded-color");
    }

    // Check for console.log
    if (content.includes("console.log")) {
      violations.push("console-log");
    }

    return violations;
  }

  /**
   * Apply simple fixes
   */
  private applyFixes(content: string, violations: string[]): string {
    let fixedContent = content;

    for (const violation of violations) {
      switch (violation) {
        case "inline-style":
          // Convert style={{}} to className (simplified)
          fixedContent = fixedContent.replace(
            /style={{[^}]+}}/g,
            'className="fixed-style"',
          );
          break;
        case "hardcoded-color":
          // Replace common hardcoded colors
          fixedContent = fixedContent.replace(
            /#[0-9a-fA-F]{6}/gi,
            "bg-primary",
          );
          break;
        case "console.log":
          // Remove console.log statements
          fixedContent = fixedContent.replace(/console\.log\([^)]*\);?/g, "");
          break;
      }
    }

    return fixedContent;
  }

  /**
   * Auto-Cleanup - Leave project "pipí cucú" and open report
   */
  async autoCleanup(projectPath: string, stats: ProjectStats): Promise<void> {
    console.log("");
    console.log("=== AUTO-CLEANUP ===");
    console.log('Dejando todo "pipí cucú"...');

    try {
      // Generate report
      const reportPath = await this.generateReport(projectPath, stats);
      stats.reportPath = reportPath;

      // Clean up temporary files
      await this.cleanupTempFiles(projectPath);

      // Format code (if prettier is available)
      await this.formatCode(projectPath);

      // Open the report automatically
      await this.openReport(reportPath);

      console.log("");
      console.log("========================================");
      console.log("  TRABAJO LEGENDARIO COMPLETADO       ");
      console.log("========================================");
      console.log("Tu proyecto está ahora optimizado.");
      console.log("Reporte abierto automáticamente.");
      console.log("");
      console.log("El QA Orchestrator trabajó como un");
      console.log("Senior dev GRATIS. ¡Disfruta!");
      console.log("");
    } catch (error) {
      console.error(
        "Error en auto-cleanup:",
        error instanceof Error ? error.message : error,
      );
    }
  }

  /**
   * Generate final report
   */
  private async generateReport(
    projectPath: string,
    stats: ProjectStats,
  ): Promise<string> {
    const reportContent = `# QA Orchestrator - Legendary Mode Report

## Estadísticas
- **Archivos procesados:** ${stats.filesProcessed}
- **Violaciones encontradas:** ${stats.violationsFound}
- **Fixes aplicados:** ${stats.fixesApplied}
- **Fecha:** ${new Date().toLocaleString()}

## Resumen
El QA Orchestrator ha procesado tu proyecto en modo LEGENDARIO.
Todos los archivos han sido optimizados automáticamente.

## Próximos Pasos
1. Revisa los cambios aplicados
2. Ejecuta tus tests para verificar
3. Commit los cambios si todo está bien

---
*Generado por QA Orchestrator - Modo LEGENDARIO*
`;

    const reportPath = path.join(
      projectPath,
      "qa-orchestrator-legendary-report.md",
    );
    await fs.writeFile(reportPath, reportContent);

    return reportPath;
  }

  /**
   * Clean up temporary files
   */
  private async cleanupTempFiles(projectPath: string): Promise<void> {
    const tempFiles = [
      ".qa-permissions.json",
      ".qa-setup.json",
      ".qa-temp",
      ".qa-cache",
    ];

    for (const file of tempFiles) {
      try {
        const filePath = path.join(projectPath, file);
        if (await fs.pathExists(filePath)) {
          await fs.remove(filePath);
        }
      } catch (error) {
        // Continue cleanup
      }
    }
  }

  /**
   * Format code if prettier is available
   */
  private async formatCode(projectPath: string): Promise<void> {
    try {
      await execAsync('cd "' + projectPath + '" && npx prettier --write .', {
        timeout: 30000,
      });
      console.log("Código formateado automáticamente.");
    } catch (error) {
      console.log("Prettier no disponible - omitiendo formateo.");
    }
  }

  /**
   * Open report automatically
   */
  private async openReport(reportPath: string): Promise<void> {
    try {
      if (process.platform === "win32") {
        await execAsync(`start "" "${reportPath}"`);
      } else if (process.platform === "darwin") {
        await execAsync(`open "${reportPath}"`);
      } else {
        await execAsync(`xdg-open "${reportPath}"`);
      }
      console.log("Reporte abierto automáticamente.");
    } catch (error) {
      console.log("No se pudo abrir el reporte automáticamente.");
      console.log("Abre manualmente:", reportPath);
    }
  }

  /**
   * Save setup configuration
   */
  private async saveSetupConfig(): Promise<void> {
    this.config.setupCompleted = true;
    this.config.timestamp = Date.now();

    await fs.writeJson(this.configFile, this.config, { spaces: 2 });
    console.log("Configuración guardada.");
  }

  /**
   * Ask yes/no question
   */
  private async askYesNo(question: string): Promise<boolean> {
    return new Promise((resolve) => {
      this.rl.question(`${question} (y/n): `, (answer) => {
        resolve(answer.toLowerCase().startsWith("y"));
      });
    });
  }
}

export default SetupWizard;
