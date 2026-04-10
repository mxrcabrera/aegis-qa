/**
 * Progress Bar Real - Indicador de avance con estado por hilo
 *
 * Propósito: Mostrar porcentaje de avance real y qué está haciendo la IA en cada hilo.
 * No deja la terminal trabada y muestra progreso en tiempo real.
 */

class ProgressBar {
  private total: number = 0;
  private completed: number = 0;
  private currentTask: string = "";
  private threadStates: Map<number, string> = new Map();
  private startTime: number = 0;
  private lastUpdate: number = 0;

  constructor(total: number) {
    this.total = total;
    this.startTime = Date.now();
  }

  /**
   * Actualiza el progreso general
   */
  update(completed: number, currentTask: string): void {
    this.completed = completed;
    this.currentTask = currentTask;
    this.render();
  }

  /**
   * Actualiza el estado de un hilo específico
   */
  updateThread(threadId: number, state: string): void {
    this.threadStates.set(threadId, state);
    this.render();
  }

  /**
   * Renderiza la barra de progreso
   */
  private render(): void {
    const now = Date.now();
    // Limitar actualizaciones a una por segundo para no saturar la terminal
    if (now - this.lastUpdate < 1000) {
      return;
    }
    this.lastUpdate = now;

    const percentage = Math.floor((this.completed / this.total) * 100);
    const elapsed = Math.floor((now - this.startTime) / 1000);
    const eta =
      this.completed > 0
        ? Math.floor((elapsed / this.completed) * (this.total - this.completed))
        : 0;

    // Barra de progreso visual
    const barLength = 50;
    const filled = Math.floor((percentage / 100) * barLength);
    const empty = barLength - filled;
    const progressBar = "█".repeat(filled) + "░".repeat(empty);

    // Limpiar línea y renderizar
    process.stdout.write("\r\x1b[K"); // Limpiar línea

    console.log(
      `\r[${progressBar}] ${percentage}% | ${this.completed}/${this.total} | ${this.currentTask}`,
    );
    console.log(`\r  ⏱  Elapsed: ${elapsed}s | ETA: ${eta}s`);

    // Mostrar estado de hilos activos
    if (this.threadStates.size > 0) {
      console.log(`\r  🧵 Hilos activos (${this.threadStates.size}):`);
      for (const [threadId, state] of this.threadStates.entries()) {
        console.log(`\r    Thread ${threadId}: ${state}`);
      }
    }
  }

  /**
   * Finaliza la barra de progreso
   */
  complete(): void {
    const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
    console.log(`\r\x1b[K`);
    console.log(`\r[██████████████████████████████████████████████████] 100%`);
    console.log(`\r  ✅ Completado en ${elapsed}s`);
  }
}

export { ProgressBar };
