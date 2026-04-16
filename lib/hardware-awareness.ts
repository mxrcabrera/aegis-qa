/**
 * Hardware Awareness Module - Detección de VRAM y ajuste automático
 *
 * Propósito: Detectar VRAM disponible y ajustar automáticamente:
 * - Límite de concurrencia para Ollama
 * - Modelo a usar (7B vs 32B) según capacidad
 * - Ciclo de enfriamiento obligatorio para proteger GPU
 *
 * Esto hace el proyecto vendible al adaptarse a diferentes hardware.
 */

import { exec } from "child_process";
import { promisify } from "util";
import * as fs from "fs-extra";

const execAsync = promisify(exec);

interface HardwareCapabilities {
  vramGB: number;
  concurrentOllama: number;
  recommendedModel: "7b" | "32b";
  use32B: boolean;
  use7B: boolean;
}

class HardwareAwareness {
  private cachedCapabilities: HardwareCapabilities | null = null;
  private filesProcessed = 0;
  private lastCooldownTime = 0;

  /**
   * Detecta VRAM disponible usando nvidia-smi
   */
  private async detectVRAM(): Promise<number> {
    try {
      const { stdout } = await execAsync(
        "nvidia-smi --query-gpu=memory.total --format=csv,noheader,nounits",
      );
      const vramMB = parseInt(stdout.trim().split("\n")[0]);
      return vramMB / 1024; // Convertir a GB
    } catch (error) {
      console.warn(
        "No se pudo detectar VRAM con nvidia-smi, usando valores por defecto",
      );
      return 8; // Valor por defecto conservador (8GB)
    }
  }

  /**
   * Calcula capacidades basadas en VRAM
   */
  private async calculateCapabilities(
    vramGB: number,
  ): Promise<HardwareCapabilities> {
    let concurrentOllama: number;
    let recommendedModel: "7b" | "32b";

    if (vramGB < 8) {
      concurrentOllama = 1;
      recommendedModel = "7b";
    } else if (vramGB < 12) {
      concurrentOllama = 2;
      recommendedModel = "7b";
    } else if (vramGB < 16) {
      concurrentOllama = 3;
      recommendedModel = "32b";
    } else {
      concurrentOllama = 4;
      recommendedModel = "32b";
    }

    return {
      vramGB,
      concurrentOllama,
      recommendedModel,
      use32B: recommendedModel === "32b",
      use7B: recommendedModel === "7b" || vramGB >= 12,
    };
  }

  /**
   * Obtiene capacidades de hardware con cache
   */
  async getCapabilities(): Promise<HardwareCapabilities> {
    if (this.cachedCapabilities) {
      return this.cachedCapabilities;
    }

    const vramGB = await this.detectVRAM();
    this.cachedCapabilities = await this.calculateCapabilities(vramGB);

    console.log(`=== HARDWARE AWARENESS ===`);
    console.log(`VRAM Detectada: ${this.cachedCapabilities.vramGB}GB`);
    console.log(
      `Concurrencia Ollama: ${this.cachedCapabilities.concurrentOllama} procesos`,
    );
    console.log(
      `Modelo Recomendado: ${this.cachedCapabilities.recommendedModel}`,
    );
    console.log(`Usar 32B: ${this.cachedCapabilities.use32B}`);
    console.log(`Usar 7B: ${this.cachedCapabilities.use7B}`);
    console.log(`========================`);

    return this.cachedCapabilities;
  }

  /**
   * Obtiene el modelo apropiado según la tarea
   */
  getModelForTask(task: "style" | "comment" | "domain" | "refactor"): string {
    if (!this.cachedCapabilities) {
      return "qwen2.5-coder:32b"; // Valor por defecto
    }

    const caps = this.cachedCapabilities;

    if (task === "style" || task === "comment") {
      return caps.use7B ? "qwen2.5-coder:7b" : "qwen2.5-coder:32b";
    }

    if (task === "domain" || task === "refactor") {
      return caps.use32B ? "qwen2.5-coder:32b" : "qwen2.5-coder:7b";
    }

    return "qwen2.5-coder:32b"; // Default
  }

  /**
   * Obtiene límite de concurrencia para Ollama
   */
  getConcurrentLimit(): number {
    if (!this.cachedCapabilities) {
      return 3; // Valor por defecto
    }
    return this.cachedCapabilities.concurrentOllama;
  }

  /**
   * Cuenta las líneas de un archivo
   */
  private async countFileLines(filePath: string): Promise<number> {
    try {
      const content = await fs.readFile(filePath, "utf8");
      return content.split("\n").length;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Aplica cooldown obligatorio después de procesar un archivo
   */
  async applyCooldown(filePath: string): Promise<void> {
    this.filesProcessed++;

    // Regla de Oro: Después de 3 archivos, cooldown de 20 segundos
    if (this.filesProcessed % 3 === 0) {
      console.log(
        "[Hardware] Iniciando ciclo de enfriamiento para proteger la GPU....",
      );
      console.log(
        `[Hardware] Archivos procesados: ${this.filesProcessed}, Cooldown: 20s`,
      );
      await new Promise((resolve) => setTimeout(resolve, 20000));
      console.log("[Hardware] Ciclo de enfriamiento completado");
      return;
    }

    // Modo Dinámico: Archivos > 500 líneas, cooldown de 15 segundos
    const lineCount = await this.countFileLines(filePath);
    if (lineCount > 500) {
      console.log(
        `[Hardware] Archivo grande detectado (${lineCount} líneas), Cooldown: 15s`,
      );
      console.log(
        "[Hardware] Iniciando ciclo de enfriamiento para proteger la GPU....",
      );
      await new Promise((resolve) => setTimeout(resolve, 15000));
      console.log("[Hardware] Ciclo de enfriamiento completado");
    }
  }

  /**
   * Resetea el contador de archivos procesados
   */
  resetFileCounter(): void {
    this.filesProcessed = 0;
  }
}

export { HardwareAwareness, HardwareCapabilities };
