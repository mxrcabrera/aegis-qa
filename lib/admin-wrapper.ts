/**
 * Admin Wrapper - Single Permission Request System
 *
 * Purpose: Request admin permissions once at startup and never ask again
 * Features: Permission caching, Ollama integration, project indexing
 */

import * as fs from "fs-extra";
import * as path from "path";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

interface AdminPermissions {
  granted: boolean;
  timestamp: number;
  sessionId: string;
}

interface OllamaConfig {
  available: boolean;
  version?: string;
  models?: string[];
}

class AdminWrapper {
  private static instance: AdminWrapper;
  private permissions: AdminPermissions | null = null;
  private ollamaConfig: OllamaConfig | null = null;
  private readonly permissionsFile = path.join(
    process.cwd(),
    ".qa-permissions.json",
  );

  private constructor() {}

  static getInstance(): AdminWrapper {
    if (!AdminWrapper.instance) {
      AdminWrapper.instance = new AdminWrapper();
    }
    return AdminWrapper.instance;
  }

  /**
   * Initialize admin permissions and Ollama detection
   */
  async initialize(): Promise<boolean> {
    console.log("=== QA Orchestrator - Admin Wrapper ===");

    // Check existing permissions
    if (await this.hasValidPermissions()) {
      console.log("Admin permissions already granted. Proceeding...");
      await this.detectOllama();
      return true;
    }

    // Request permissions
    const granted = await this.requestPermissions();
    if (granted) {
      await this.savePermissions();
      await this.detectOllama();
      return true;
    }

    return false;
  }

  /**
   * Check if valid permissions exist
   */
  private async hasValidPermissions(): Promise<boolean> {
    try {
      if (!(await fs.pathExists(this.permissionsFile))) {
        return false;
      }

      const permissions = await fs.readJson(this.permissionsFile);

      // Check if permissions are recent (within 24 hours)
      const now = Date.now();
      const age = now - permissions.timestamp;
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours

      return permissions.granted && age < maxAge;
    } catch (error) {
      return false;
    }
  }

  /**
   * Request admin permissions from user
   */
  private async requestPermissions(): Promise<boolean> {
    console.log("\n=== Admin Permission Request ===");
    console.log("QA Orchestrator requires admin permissions to:");
    console.log("1. Read and modify project files");
    console.log("2. Run automated fixes and audits");
    console.log("3. Generate reports and recommendations");
    console.log("");
    console.log("This permission will be cached for 24 hours.");
    console.log("");

    // In a real implementation, this would show a UI prompt
    // For now, we'll use a simple console-based approach
    console.log("Granting admin permissions for this session...");
    console.log("(In production, this would show a proper permission dialog)");

    return true; // Auto-grant for development
  }

  /**
   * Save permissions to file
   */
  private async savePermissions(): Promise<void> {
    const permissions: AdminPermissions = {
      granted: true,
      timestamp: Date.now(),
      sessionId: this.generateSessionId(),
    };

    await fs.writeJson(this.permissionsFile, permissions, { spaces: 2 });
    console.log("Admin permissions granted and cached.");
  }

  /**
   * Detect if Ollama is available and get configuration
   */
  private async detectOllama(): Promise<void> {
    console.log("Detecting Ollama integration...");

    try {
      // Check if Ollama is installed
      const { stdout } = await execAsync("ollama --version");
      const version = stdout.trim();

      // Get available models
      const { stdout: modelsOutput } = await execAsync("ollama list");
      const models = modelsOutput
        .split("\n")
        .filter((line) => line.trim() && !line.includes("NAME"))
        .map((line) => line.split(/\s+/)[0])
        .filter((model) => model);

      this.ollamaConfig = {
        available: true,
        version,
        models,
      };

      console.log(`Ollama detected: ${version}`);
      console.log(`Available models: ${models.join(", ")}`);
    } catch (error) {
      this.ollamaConfig = {
        available: false,
      };
      console.log("Ollama not detected. Continuing without AI indexing.");
    }
  }

  /**
   * Index project using Ollama if available
   */
  async indexProjectWithOllama(projectPath: string): Promise<void> {
    if (!this.ollamaConfig?.available || !this.ollamaConfig.models?.length) {
      console.log("Ollama not available for project indexing.");
      return;
    }

    console.log("Indexing project with Ollama...");

    try {
      // Find relevant files to index
      const filesToIndex = await this.findFilesToIndex(projectPath);

      if (filesToIndex.length === 0) {
        console.log("No files found for indexing.");
        return;
      }

      // Use first available model
      const model = this.ollamaConfig.models[0];
      console.log(`Using model: ${model}`);
      console.log(`Indexing ${filesToIndex.length} files...`);

      // Index files in batches to avoid overwhelming Ollama
      const batchSize = 5;
      for (let i = 0; i < filesToIndex.length; i += batchSize) {
        const batch = filesToIndex.slice(i, i + batchSize);
        await this.indexBatch(batch, model);
      }

      console.log("Project indexing completed.");
    } catch (error) {
      console.warn(
        "Project indexing failed:",
        error instanceof Error ? error.message : error,
      );
    }
  }

  /**
   * Find relevant files for indexing
   */
  private async findFilesToIndex(projectPath: string): Promise<string[]> {
    const { glob } = await import("glob");

    const patterns = [
      "**/*.tsx",
      "**/*.ts",
      "**/*.jsx",
      "**/*.js",
      "**/*.md",
      "**/README*",
      "**/package.json",
    ];

    const excludePatterns = [
      "**/node_modules/**",
      "**/.next/**",
      "**/dist/**",
      "**/build/**",
      "**/.git/**",
    ];

    const allFiles: string[] = [];

    for (const pattern of patterns) {
      const files = await glob(pattern, {
        cwd: projectPath,
        ignore: excludePatterns,
        absolute: true,
      });
      allFiles.push(...files);
    }

    // Limit to most important files for indexing
    return allFiles.slice(0, 100);
  }

  /**
   * Index a batch of files with Ollama
   */
  private async indexBatch(files: string[], model: string): Promise<void> {
    for (const file of files) {
      try {
        const content = await fs.readFile(file, "utf8");
        const relativePath = path.relative(process.cwd(), file);

        // Create a simple embedding/prompt for Ollama
        const prompt = `Index this file for QA analysis:\n\nFile: ${relativePath}\n\nContent:\n${content.substring(0, 2000)}...`;

        // Send to Ollama (simplified - in production would use proper embeddings)
        await execAsync(
          `ollama run ${model} "${prompt.substring(0, 500)}..."`,
          {
            timeout: 10000,
          },
        );
      } catch (error) {
        // Continue with other files even if one fails
        console.warn(
          `Failed to index ${file}:`,
          error instanceof Error ? error.message : error,
        );
      }
    }
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `qa-session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get current permissions status
   */
  getPermissions(): AdminPermissions | null {
    return this.permissions;
  }

  /**
   * Get Ollama configuration
   */
  getOllamaConfig(): OllamaConfig | null {
    return this.ollamaConfig;
  }

  /**
   * Clear permissions (for testing or manual reset)
   */
  async clearPermissions(): Promise<void> {
    try {
      await fs.remove(this.permissionsFile);
      this.permissions = null;
      console.log("Admin permissions cleared.");
    } catch (error) {
      console.warn("Failed to clear permissions:", error);
    }
  }
}

export default AdminWrapper;
