/**
 * Ollama Processor - Arquitectura de Memoria con IA
 *
 * Purpose: Process files using Ollama with atomic overwrite
 * Features: Memory architecture, atomic writes, progress tracking
 */
interface ProcessingStats {
    filesProcessed: number;
    filesTotal: number;
    currentFile: string;
    fixesApplied: number;
    startTime: number;
}
declare class OllamaProcessor {
    private static instance;
    private model;
    private stats;
    private logAPB;
    private constructor();
    static getInstance(): OllamaProcessor;
    /**
     * Check Ollama health before processing
     */
    private checkHealth;
    /**
     * Process project files with Ollama - Enhanced with timeout and health check
     */
    processProject(projectPath: string): Promise<void>;
    /**
     * Find files to process with memory architecture - Enhanced path resolution
     */
    private findFilesToProcess;
    /**
     * Show progress bar
     */
    private showProgressBar;
    /**
     * Process single file with Ollama - Enhanced path handling
     */
    private processFileWithOllama;
    /**
     * Validate generated code before writing
     */
    private isValidCode;
    /**
     * Send content to Ollama for processing - Enhanced Debug
     */
    private sendToOllama;
    /**
     * Detect fixes between original and processed code
     */
    private detectFixes;
    /**
     * Atomic overwrite - write file in one operation - Enhanced Debug
     */
    private atomicWrite;
    /**
     * Log APB entry for file
     */
    private logAPBEntry;
    /**
     * Generate final APB log
     */
    private generateFinalAPBLog;
    /**
     * Get processing stats
     */
    getStats(): ProcessingStats;
}
export default OllamaProcessor;
//# sourceMappingURL=ollama-processor.d.ts.map