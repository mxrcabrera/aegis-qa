/**
 * Unit Tests for Thermal Controller CI Mode
 *
 * Tests for the thermal controller's CI mode behavior with minimal thermal monitoring
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ThermalController } from '../src/core/thermal-controller.js';
import { execSafe } from '../src/core/command-sanitizer.js';
import * as si from 'systeminformation';

// Mock the dependencies
vi.mock('../src/core/command-sanitizer.js');
vi.mock('systeminformation');

describe('ThermalController CI Mode', () => {
  let controller: ThermalController;

  beforeEach(() => {
    controller = new ThermalController();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const createMockCurrentLoad = (load: number) => ({
    currentLoad: load,
    currentLoadUser: load * 0.6,
    currentLoadSystem: load * 0.4,
    rawCurrentLoad: load * 100,
    avgLoad: load * 0.8,
    currentLoadNice: 0,
    currentLoadIdle: 1 - load,
    currentLoadIrq: 0,
    currentLoadSteal: 0,
    cpus: [],
  } as any);

  const createMockMem = (totalGB: number, availableGB: number) => ({
    total: totalGB * 1024 * 1024 * 1024,
    available: availableGB * 1024 * 1024 * 1024,
    used: (totalGB - availableGB) * 1024 * 1024 * 1024,
    free: availableGB * 1024 * 1024 * 1024,
    active: (totalGB - availableGB) * 1024 * 1024 * 1024,
    buffcache: 0,
    buffers: 0,
    cached: 0,
    slab: 0,
    swaptotal: 0,
    swapused: 0,
    swapfree: 0,
  } as any);

  describe('checkTemperature in CI mode', () => {
    it('should skip GPU monitoring when CI mode is enabled', async () => {
      // Create controller with CI mode enabled
      const ciController = new ThermalController({ 
        criticalThreshold: 70, 
        warningThreshold: 60, 
        autoHalt: true, 
        cpuCriticalThreshold: 90, 
        cpuWarningThreshold: 80, 
        ramCriticalThreshold: 95, 
        ramWarningThreshold: 90,
        ciMode: true 
      });

      // Mock nvidia-smi to fail (simulating GPU not available)
      vi.mocked(execSafe).mockRejectedValue(new Error('nvidia-smi not found'));

      // Mock systeminformation to return safe values
      vi.mocked(si.currentLoad).mockResolvedValue(createMockCurrentLoad(0.3));
      vi.mocked(si.mem).mockResolvedValue(createMockMem(16, 10));

      const reading = await ciController.checkTemperature();

      // Should use CPU/RAM fallback without trying nvidia-smi
      expect(reading).toBeDefined();
      expect(reading.isSafe).toBe(true);
      expect(reading.category).toBe('safe');
    });

    it('should not call nvidia-smi in CI mode even if GPU is available', async () => {
      // Create controller with CI mode enabled
      const ciController = new ThermalController({ 
        criticalThreshold: 70, 
        warningThreshold: 60, 
        autoHalt: true, 
        cpuCriticalThreshold: 90, 
        cpuWarningThreshold: 80, 
        ramCriticalThreshold: 95, 
        ramWarningThreshold: 90,
        ciMode: true 
      });

      // Mock nvidia-smi to succeed
      vi.mocked(execSafe).mockResolvedValue({ stdout: '45', stderr: '' });

      // Mock systeminformation to return safe values
      vi.mocked(si.currentLoad).mockResolvedValue(createMockCurrentLoad(0.3));
      vi.mocked(si.mem).mockResolvedValue(createMockMem(16, 10));

      const reading = await ciController.checkTemperature();

      // nvidia-smi should not be called in CI mode
      expect(vi.mocked(execSafe)).not.toHaveBeenCalled();
      expect(reading).toBeDefined();
    });
  });

  describe('applyCooldown in CI mode', () => {
    it('should skip cooldown when CI mode is enabled', async () => {
      // Create controller with CI mode enabled
      const ciController = new ThermalController({ 
        criticalThreshold: 70, 
        warningThreshold: 60, 
        autoHalt: true, 
        cpuCriticalThreshold: 90, 
        cpuWarningThreshold: 80, 
        ramCriticalThreshold: 95, 
        ramWarningThreshold: 90,
        ciMode: true 
      });

      const startTime = Date.now();
      await ciController.applyCooldown(15000); // Try to apply 15s cooldown
      const elapsed = Date.now() - startTime;

      // Cooldown should be skipped (immediate return)
      expect(elapsed).toBeLessThan(100); // Should complete in < 100ms
    });

    it('should log message when skipping cooldown in CI mode', async () => {
      // Create controller with CI mode enabled
      const ciController = new ThermalController({ 
        criticalThreshold: 70, 
        warningThreshold: 60, 
        autoHalt: true, 
        cpuCriticalThreshold: 90, 
        cpuWarningThreshold: 80, 
        ramCriticalThreshold: 95, 
        ramWarningThreshold: 90,
        ciMode: true 
      });

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await ciController.applyCooldown(15000);

      expect(consoleSpy).toHaveBeenCalledWith(
        '[ThermalController] CI mode: skipping cooldown (CI runners don\'t overheat)'
      );

      consoleSpy.mockRestore();
    });

    it('should apply cooldown when CI mode is disabled', async () => {
      // Create controller with CI mode disabled
      const normalController = new ThermalController({ 
        criticalThreshold: 70, 
        warningThreshold: 60, 
        autoHalt: true, 
        cpuCriticalThreshold: 90, 
        cpuWarningThreshold: 80, 
        ramCriticalThreshold: 95, 
        ramWarningThreshold: 90,
        ciMode: false 
      });

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      // Mock setTimeout to avoid actual delay
      vi.useFakeTimers();

      const cooldownPromise = normalController.applyCooldown(15000);

      // Fast-forward time
      vi.advanceTimersByTime(15000);

      await cooldownPromise;

      expect(consoleSpy).toHaveBeenCalledWith('[ThermalController] Applying cooldown: 15s to protect GPU');

      vi.useRealTimers();
      consoleSpy.mockRestore();
    });
  });

  describe('checkSystemResources in CI mode', () => {
    it('should only log warning when RAM > 90% in CI mode without blocking', async () => {
      // Create controller with CI mode enabled
      const ciController = new ThermalController({ 
        criticalThreshold: 70, 
        warningThreshold: 60, 
        autoHalt: true, 
        cpuCriticalThreshold: 90, 
        cpuWarningThreshold: 80, 
        ramCriticalThreshold: 95, 
        ramWarningThreshold: 90,
        ciMode: true 
      });

      // Mock systeminformation to return high RAM usage (> 90%)
      vi.mocked(si.currentLoad).mockResolvedValue(createMockCurrentLoad(0.5));
      vi.mocked(si.mem).mockResolvedValue(createMockMem(16, 1)); // 93.75% RAM usage

      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const reading = await ciController.checkSystemResources();

      // Should log warning but not throw error
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('CI mode: RAM usage elevated')
      );
      expect(reading).toBeDefined();
      expect(reading.ramUsage).toBeGreaterThan(90);

      consoleWarnSpy.mockRestore();
    });

    it('should not log warning when RAM < 90% in CI mode', async () => {
      // Create controller with CI mode enabled
      const ciController = new ThermalController({ 
        criticalThreshold: 70, 
        warningThreshold: 60, 
        autoHalt: true, 
        cpuCriticalThreshold: 90, 
        cpuWarningThreshold: 80, 
        ramCriticalThreshold: 95, 
        ramWarningThreshold: 90,
        ciMode: true 
      });

      // Mock systeminformation to return normal RAM usage (< 90%)
      vi.mocked(si.currentLoad).mockResolvedValue(createMockCurrentLoad(0.3));
      vi.mocked(si.mem).mockResolvedValue(createMockMem(16, 8)); // 50% RAM usage

      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const reading = await ciController.checkSystemResources();

      // Should not log warning
      expect(consoleWarnSpy).not.toHaveBeenCalled();
      expect(reading).toBeDefined();
      expect(reading.ramUsage).toBeLessThan(90);

      consoleWarnSpy.mockRestore();
    });

    it('should not block on CPU/RAM critical thresholds in CI mode', async () => {
      // Create controller with CI mode enabled
      const ciController = new ThermalController({ 
        criticalThreshold: 70, 
        warningThreshold: 60, 
        autoHalt: true, 
        cpuCriticalThreshold: 90, 
        cpuWarningThreshold: 80, 
        ramCriticalThreshold: 95, 
        ramWarningThreshold: 90,
        ciMode: true 
      });

      // Mock systeminformation to return critical CPU usage
      vi.mocked(si.currentLoad).mockResolvedValue(createMockCurrentLoad(0.95)); // 95% CPU
      vi.mocked(si.mem).mockResolvedValue(createMockMem(16, 8)); // 50% RAM

      const reading = await ciController.checkSystemResources();

      // Should not throw error even with critical CPU usage
      expect(reading).toBeDefined();
      expect(reading.cpuUsage).toBeGreaterThan(90);
    });

    it('should block on critical thresholds when CI mode is disabled', async () => {
      // Create controller with CI mode disabled
      const normalController = new ThermalController({ 
        criticalThreshold: 70, 
        warningThreshold: 60, 
        autoHalt: true, 
        cpuCriticalThreshold: 90, 
        cpuWarningThreshold: 80, 
        ramCriticalThreshold: 95, 
        ramWarningThreshold: 90,
        ciMode: false 
      });

      // Mock systeminformation to return critical CPU usage
      vi.mocked(si.currentLoad).mockResolvedValue(createMockCurrentLoad(0.95)); // 95% CPU
      vi.mocked(si.mem).mockResolvedValue(createMockMem(16, 8)); // 50% RAM

      await expect(normalController.checkSystemResources()).rejects.toThrow('CRITICAL');
    });
  });

});
