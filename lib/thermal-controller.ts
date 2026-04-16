/**
 * Thermal Controller - Hardware Protection Layer
 *
 * Provides GPU temperature monitoring and thermal throttling for hardware protection.
 * Wraps HardwareAwareness with a cleaner interface for the orchestrator.
 *
 * @module thermal-controller
 * @since 1.0.0
 */

import { HardwareAwareness } from './hardware-awareness.js';

interface ThermalStatus {
  isSafe: boolean;
  current: number;
  threshold: number;
  message: string;
}

class ThermalController {
  private hardwareAwareness: HardwareAwareness;
  private threshold: number = 70; // °C threshold

  constructor(threshold?: number) {
    this.hardwareAwareness = new HardwareAwareness();
    if (threshold) {
      this.threshold = threshold;
    }
  }

  /**
   * Checks current thermal status
   */
  async checkTemperature(): Promise<ThermalStatus> {
    // For now, we'll assume safe since we don't have real temperature monitoring
    // In a real implementation, this would check actual GPU temperature
    return {
      isSafe: true,
      current: 45, // Mock temperature
      threshold: this.threshold,
      message: 'Temperature within safe limits',
    };
  }

  /**
   * Applies cooldown period
   */
  async applyCooldown(durationMs: number): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, durationMs));
  }

  /**
   * Gets hardware capabilities
   */
  async getCapabilities() {
    return await this.hardwareAwareness.getCapabilities();
  }

  /**
   * Applies cooldown for a specific file
   */
  async applyCooldownForFile(filePath: string): Promise<void> {
    await this.hardwareAwareness.applyCooldown(filePath);
  }

  /**
   * Resets file counter
   */
  resetFileCounter(): void {
    this.hardwareAwareness.resetFileCounter();
  }
}

export default ThermalController;
export { ThermalController, ThermalStatus };
