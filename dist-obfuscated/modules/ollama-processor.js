/**
 * Ollama Processor - Arquitectura de Memoria con IA
 *
 * Purpose: Process files using Ollama with atomic overwrite
 * Features: Memory architecture, atomic writes, progress tracking
 */
import * as fs from "fs";
import * as path from "path";
import { spawn } from "child_process";
import { execSafe } from "../core/command-sanitizer.js";
import { RetryHelper } from "../core/retry-helper.js";
class OllamaProcessor {
    static instance;
    model = "llama3.2:3b";
    stats;
    logAPB = [];
    constructor() {
        this.stats = {
            filesProcessed: 0,
            filesTotal: 0,
            currentFile: "",
            fixesApplied: 0,
            startTime: Date.now(),
        };
    }
    static getInstance() {
        if (!OllamaProcessor.instance) {
            OllamaProcessor.instance = new OllamaProcessor();
        }
        return OllamaProcessor.instance;
    }
    /**
     * Check Ollama health before processing
     */
    async checkHealth() {
        console.log("=== HEALTH CHECK OLLAMA ===");
        const retryHelper = new RetryHelper();
        const result = await retryHelper.executeWithRetry(async () => {
            const { stdout } = await execSafe("ollama", ["list"]);
            return stdout;
        }, { maxRetries: 3, initialBackoffMs: 1000 });
        if (result.success && result.result !== undefined) {
            console.log("✅ Ollama está corriendo");
            console.log(`Modelos disponibles: ${result.result.split("\n").length - 2}`);
        }
        else {
            console.error("❌ ERROR: OLLAMA NO ESTÁ CORRIENDO");
            console.error("Por favor, iniciá Ollama con: ollama serve");
            throw new Error("OLLAMA NO ESTÁ CORRIENDO - Iniciá con: ollama serve");
        }
        console.log("=== FIN HEALTH CHECK ===");
    }
    /**
     * Process project files with Ollama - Enhanced with timeout and health check
     */
    async processProject(projectPath) {
        console.log("");
        console.log("=== OLLAMA PROCESSOR - ARQUITECTURA DE MEMORIA ===");
        console.log("");
        // Health check before starting
        await this.checkHealth();
        // Find all files to process
        const files = await this.findFilesToProcess(projectPath);
        this.stats.filesTotal = files.length;
        console.log(`Encontrados ${files.length} archivos para procesar con IA...`);
        console.log("");
        // Process each file with progress bar and timeout
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            this.stats.currentFile = file;
            this.stats.filesProcessed = i + 1;
            // Log inmediato con emoji
            console.log(`🤖 Procesando archivo: ${file}`);
            // Show progress bar
            this.showProgressBar();
            try {
                // Timeout real de 30 segundos por archivo
                await Promise.race([
                    this.processFileWithOllama(file),
                    new Promise((_, reject) => setTimeout(() => reject(new Error(`TIMEOUT: ${file} - Ollama no respondió en 30 segundos`)), 30000)),
                ]);
            }
            catch (error) {
                console.error(`❌ Error procesando ${file}:`, error instanceof Error ? error.message : error);
                console.log(`⏭️  Saltando al siguiente archivo...`);
                // Continue with next file
            }
        }
        console.log("");
        console.log("=== PROCESAMIENTO COMPLETADO ===");
        console.log(`Archivos procesados: ${this.stats.filesProcessed}/${this.stats.filesTotal}`);
        console.log(`Fixes aplicados: ${this.stats.fixesApplied}`);
        console.log(`Tiempo total: ${((Date.now() - this.stats.startTime) / 1000).toFixed(1)}s`);
        console.log("");
        // Generate final APB log
        await this.generateFinalAPBLog(projectPath);
    }
    /**
     * Find files to process with memory architecture - Enhanced path resolution
     */
    async findFilesToProcess(projectPath) {
        const { glob } = await import("glob");
        // Ensure projectPath is absolute
        const absoluteProjectPath = path.resolve(projectPath);
        console.log(`Buscando archivos en: ${absoluteProjectPath}`);
        const patterns = [
            "**/*.ts",
            "**/*.tsx",
            "**/*.js",
            "**/*.jsx",
            "**/*.md",
            "**/package.json",
            "**/tsconfig.json",
        ];
        const excludePatterns = [
            "**/node_modules/**",
            "**/.next/**",
            "**/dist/**",
            "**/build/**",
            "**/.git/**",
            "**/coverage/**",
            "**/playwright-report/**",
            "**/*.test.*",
            "**/*.spec.*",
            "**/*.d.ts",
        ];
        const allFiles = [];
        for (const pattern of patterns) {
            try {
                const files = await glob(pattern, {
                    cwd: absoluteProjectPath,
                    ignore: excludePatterns,
                    absolute: true,
                });
                allFiles.push(...files);
            }
            catch (error) {
                console.warn(`Pattern ${pattern} failed:`, error);
            }
        }
        // Filter to only existing files and sort
        const validFiles = [...new Set(allFiles)]
            .filter((file) => fs.existsSync(file))
            .sort();
        console.log(`Archivos válidos encontrados: ${validFiles.length}`);
        return validFiles;
    }
    /**
     * Show progress bar
     */
    showProgressBar() {
        const progress = (this.stats.filesProcessed / this.stats.filesTotal) * 100;
        const barLength = 50;
        const filledLength = Math.round((progress / 100) * barLength);
        const bar = "=".repeat(filledLength) + "-".repeat(barLength - filledLength);
        // Clear line and show progress
        process.stdout.write("\r");
        process.stdout.write(`[${bar}] ${progress.toFixed(1)}% | ${this.stats.filesProcessed}/${this.stats.filesTotal} | ${path.basename(this.stats.currentFile)}`);
    }
    /**
     * Process single file with Ollama - Enhanced path handling
     */
    async processFileWithOllama(filePath) {
        try {
            // Validate file path and existence
            if (!fs.existsSync(filePath)) {
                console.warn(`File does not exist: ${filePath}`);
                return;
            }
            // Load file content with error handling
            let originalContent;
            try {
                originalContent = fs.readFileSync(filePath, "utf8");
            }
            catch (readError) {
                console.warn(`Failed to read ${filePath}:`, readError);
                return;
            }
            // Skip if file is empty or too small
            if (originalContent.trim().length < 50) {
                return;
            }
            // Create system prompt for Ollama - Enhanced for QA
            const systemPrompt = `Sos un Senior Full Stack experto en React/Next.js, TypeScript y Tailwind CSS.
Tu tarea: Analizá y optimizá este código. Corregí errores, mejorá la estructura, pasá estilos inline a clases Tailwind.
Devolvé SOLO el código optimizado, sin explicaciones ni comentarios extra.
Mantené toda la funcionalidad intacta y asegurate que el código sea compilable.`;
            // Send to Ollama with content
            const response = await this.sendToOllama(originalContent, systemPrompt);
            if (response.code && response.code !== originalContent) {
                // Validate response before writing
                if (this.isValidCode(response.code)) {
                    // Atomic overwrite - write file in one operation
                    this.atomicWrite(filePath, response.code);
                    // Log APB entry
                    this.logAPBEntry(filePath, originalContent, response.code, response.fixes);
                    this.stats.fixesApplied += response.fixes.length;
                }
                else {
                    console.warn(`Invalid code generated for ${filePath}, skipping write`);
                }
            }
        }
        catch (error) {
            console.warn(`Error procesando ${path.basename(filePath)}:`, error instanceof Error ? error.message : error);
        }
    }
    /**
     * Validate generated code before writing
     */
    isValidCode(code) {
        try {
            // Basic validation checks
            if (!code || code.trim().length === 0)
                return false;
            if (code.length < 20)
                return false; // Too short
            // Check for balanced braces/parentheses
            const openBraces = (code.match(/{/g) || []).length;
            const closeBraces = (code.match(/}/g) || []).length;
            const openParens = (code.match(/\(/g) || []).length;
            const closeParens = (code.match(/\)/g) || []).length;
            if (openBraces !== closeBraces || openParens !== closeParens) {
                return false;
            }
            // Check for common invalid patterns
            if (code.includes("undefined") || code.includes("NaN")) {
                return false;
            }
            return true;
        }
        catch {
            return false;
        }
    }
    /**
     * Send content to Ollama for processing - Enhanced Debug
     */
    async sendToOllama(content, systemPrompt) {
        try {
            const prompt = `${systemPrompt}

Código a procesar:
\`\`\`typescript
${content}
\`\`\`

Devuelve el código optimizado:`;
            console.log(`=== DEBUG OLLAMA ===`);
            console.log(`Modelo: ${this.model}`);
            console.log(`Prompt length: ${prompt.length} chars`);
            console.log(`Enviando a Ollama...`);
            // FIX CRÍTICO: Usar spawn con stdin pipe correcto
            console.log(`FIX: Usando spawn con stdin pipe correcto...`);
            // Dividir prompt en chunks si es muy largo
            const maxPromptLength = 8000;
            let effectivePrompt = prompt;
            if (prompt.length > maxPromptLength) {
                effectivePrompt =
                    prompt.substring(0, maxPromptLength) +
                        "\n\n[Contenido truncado para procesamiento]";
                console.log(`Prompt truncado de ${prompt.length} a ${effectivePrompt.length} chars`);
            }
            return new Promise((resolve, reject) => {
                console.log(`Iniciando spawn de ollama run ${this.model}...`);
                const ollama = spawn("ollama", ["run", this.model], {
                    stdio: ["pipe", "pipe", "pipe"],
                    timeout: 30000,
                });
                let stdout = "";
                let stderr = "";
                ollama.stdout.on("data", (data) => {
                    stdout += data.toString();
                    console.log(`Chunk recibido: ${data.length} chars, total: ${stdout.length}`);
                });
                ollama.stderr.on("data", (data) => {
                    stderr += data.toString();
                    console.log(`STDERR: ${data.toString()}`);
                });
                const timeout = setTimeout(() => {
                    ollama.kill();
                    reject(new Error("TIMEOUT: Ollama no respondió en 30 segundos"));
                }, 30000);
                ollama.on("close", (exitCode) => {
                    clearTimeout(timeout);
                    if (exitCode !== 0) {
                        console.error(`Ollama exited with code: ${exitCode}, STDERR: ${stderr}`);
                        reject(new Error(`Ollama process failed with exit code ${exitCode}`));
                        return;
                    }
                    console.log(`Response received: ${stdout.length} chars`);
                    const response = stdout.trim();
                    // Extract processed code from response
                    const codeMatch = response.match(/```(?:typescript|tsx|javascript|js)?\n([\s\S]*?)\n```/);
                    const processedCode = codeMatch ? codeMatch[1] : response;
                    // Extract fixes (simple detection)
                    const fixes = this.detectFixes(content, processedCode);
                    resolve({ code: processedCode, fixes });
                });
                ollama.on("error", (error) => {
                    clearTimeout(timeout);
                    reject(error);
                });
                // Enviar prompt por stdin
                ollama.stdin.write(effectivePrompt);
                ollama.stdin.end();
            });
        }
        catch (error) {
            console.error(`=== ERROR OLLAMA ===`);
            console.error(`Error comunicando con Ollama:`);
            console.error(`Tipo: ${error instanceof Error ? error.constructor.name : typeof error}`);
            console.error(`Mensaje: ${error instanceof Error ? error.message : error}`);
            console.error(`Stack: ${error instanceof Error ? error.stack : "No stack"}`);
            console.error(`=== FIN ERROR OLLAMA ===`);
            // FORZAR ERROR EXPLÍCITO en lugar de devolver archivo vacío
            throw new Error(`OLLAMA CONNECTION FAILED: ${error instanceof Error ? error.message : error}. ` +
                `Check if Ollama is running with: ollama list`);
        }
    }
    /**
     * Detect fixes between original and processed code
     */
    detectFixes(original, processed) {
        const fixes = [];
        // Detect style removal
        if (original.includes("style={{") && !processed.includes("style={{")) {
            fixes.push("Estilos inline eliminados");
        }
        // Detect className addition
        const originalClassMatches = original.match(/className=/g) || [];
        const processedClassMatches = processed.match(/className=/g) || [];
        if (processedClassMatches.length > originalClassMatches.length) {
            fixes.push("Clases Tailwind agregadas");
        }
        // Detect JSX style removal
        if (original.includes("<style jsx>") &&
            !processed.includes("<style jsx>")) {
            fixes.push("Estilos JSX eliminados");
        }
        return fixes;
    }
    /**
     * Atomic overwrite - write file in one operation - Enhanced Debug
     */
    atomicWrite(filePath, content) {
        try {
            // DEBUG: Log paths absolutos
            const absolutePath = path.resolve(filePath);
            const tempPath = `${filePath}.tmp`;
            const absoluteTempPath = path.resolve(tempPath);
            console.log(`=== DEBUG ESCRITURA ===`);
            console.log(`Path original: ${filePath}`);
            console.log(`Path absoluto: ${absolutePath}`);
            console.log(`Path temporal: ${absoluteTempPath}`);
            console.log(`Content length: ${content.length} chars`);
            console.log(`File exists antes: ${fs.existsSync(absolutePath)}`);
            // Write atomically using temporary file
            fs.writeFileSync(tempPath, content, "utf8");
            console.log(`Temporal escrito: ${fs.existsSync(absoluteTempPath)}`);
            fs.renameSync(tempPath, filePath);
            console.log(`Renombre exitoso: ${fs.existsSync(absolutePath)}`);
            console.log(`=== FIN DEBUG ESCRITURA ===`);
        }
        catch (error) {
            console.error(`=== ERROR ESCRITURA ===`);
            console.error(`Path: ${path.resolve(filePath)}`);
            console.error(`Error escribiendo:`, error instanceof Error ? error.message : error);
            console.error(`Stack: ${error instanceof Error ? error.stack : "No stack"}`);
            console.error(`=== FIN ERROR ESCRITURA ===`);
            throw error;
        }
    }
    /**
     * Log APB entry for file
     */
    logAPBEntry(filePath, original, processed, fixes) {
        const fileName = path.basename(filePath);
        const timestamp = new Date().toISOString();
        const entry = `
## FIX: ${fileName}
**Timestamp:** ${timestamp}
**File:** ${filePath}

### ANTES:
\`\`\`typescript
${original.substring(0, 500)}${original.length > 500 ? "..." : ""}
\`\`\`

### DESPUÉS:
\`\`\`typescript
${processed.substring(0, 500)}${processed.length > 500 ? "..." : ""}
\`\`\`

### CAMBIOS:
${fixes.map((fix) => `- **${fix}**`).join("\n")}

---

`;
        this.logAPB.push(entry);
    }
    /**
     * Generate final APB log
     */
    async generateFinalAPBLog(projectPath) {
        const logContent = `# LOG APB - OLLAMA PROCESSOR

## ESTADÍSTICAS
- **Archivos procesados:** ${this.stats.filesProcessed}/${this.stats.filesTotal}
- **Fixes aplicados:** ${this.stats.fixesApplied}
- **Tiempo total:** ${((Date.now() - this.stats.startTime) / 1000).toFixed(1)}s
- **Modelo IA:** ${this.model}

## LOG DE CAMBIOS
${this.logAPB.join("\n")}

## RESUMEN FINAL
QA Orchestrator con Ollama procesó ${this.stats.filesProcessed} archivos aplicando ${this.stats.fixesApplied} fixes automáticos.
Código optimizado con IA local sin enviar datos a la nube.

---
*Generado por QA Orchestrator - Ollama Processor*
`;
        const logPath = path.join(projectPath, "OLLAMA_APB_LOG.md");
        fs.writeFileSync(logPath, logContent, "utf8");
        console.log(`Log APB generado: ${logPath}`);
    }
    /**
     * Get processing stats
     */
    getStats() {
        return { ...this.stats };
    }
}
export default OllamaProcessor;
//# sourceMappingURL=ollama-processor.js.map