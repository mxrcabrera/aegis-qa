/**
 * Unit Tests for Thermal Controller Graceful Degradation
 *
 * Tests for the thermal controller's graceful degradation when nvidia-smi is not available
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ThermalController } from '../src/core/thermal-controller.js';
import { execSafe } from '../src/core/command-sanitizer.js';
import * as si from 'systeminformation';

// Mock the dependencies
vi.mock('../src/core/command-sanitizer.js');
vi.mock('systeminformation');

describe('ThermalController Graceful Degradation', () => {
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

  const createMockCpu = (cores: number) => ({
    cores,
    physicalCores: cores / 2,
    processors: 1,
    manufacturer: 'Intel',
    brand: 'Intel Core',
    vendor: 'Intel',
    family: 6,
    model: 158,
    stepping: 10,
    revision: '',
    voltage: '',
    speed: 3.0,
    speedMin: 0.8,
    speedMax: 4.5,
    governor: '',
    coresData: [],
    cache: { l1d: 32, l1i: 32, l2: 256, l3: 8192 },
  } as any);

  describe('checkTemperature() fallback to CPU/RAM', () => {
    it('should use CPU/RAM monitoring when nvidia-smi is not available', async () => {
      // Mock nvidia-smi failure
      vi.mocked(execSafe).mockRejectedValue(new Error('nvidia-smi not found'));
      
      // Mock systeminformation CPU/RAM data
      (vi.mocked(si.currentLoad) as any).mockResolvedValue(createMockCurrentLoad(0.5));
      (vi.mocked(si.mem) as any).mockResolvedValue(createMockMem(16, 8));

      const reading = await controller.checkTemperature();

      expect(reading.isSafe).toBe(true);
      expect(reading.category).toBe('safe');
      expect(reading.current).toBeGreaterThan(0); // Should be simulated from CPU/RAM
      expect(vi.mocked(execSafe)).toHaveBeenCalledWith('nvidia-smi', expect.any(Array));
      expect(vi.mocked(si.currentLoad)).toHaveBeenCalled();
      expect(vi.mocked(si.mem)).toHaveBeenCalled();
    });

    it('should log GPU unavailability message only once', async () => {
      // Mock nvidia-smi failure
      vi.mocked(execSafe).mockRejectedValue(new Error('nvidia-smi not found'));
      
      // Mock systeminformation CPU/RAM data
      (vi.mocked(si.currentLoad) as any).mockResolvedValue(createMockCurrentLoad(0.5));
      (vi.mocked(si.mem) as any).mockResolvedValue(createMockMem(16, 8));

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      // First call - should log
      await controller.checkTemperature();
      expect(consoleSpy).toHaveBeenCalledWith('[ThermalController] GPU monitoring not available, using CPU/RAM only');
      expect(consoleSpy).toHaveBeenCalledTimes(1);

      // Second call - should not log again
      await controller.checkTemperature();
      expect(consoleSpy).toHaveBeenCalledTimes(1);

      consoleSpy.mockRestore();
    });

    it('should throw error when CPU/RAM exceeds critical thresholds', async () => {
      // Mock nvidia-smi failure
      vi.mocked(execSafe).mockRejectedValue(new Error('nvidia-smi not found'));
      
      // Mock systeminformation with critical CPU/RAM
      (vi.mocked(si.currentLoad) as any).mockResolvedValue(createMockCurrentLoad(0.95));
      (vi.mocked(si.mem) as any).mockResolvedValue(createMockMem(16, 1));

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await expect(controller.checkTemperature()).rejects.toThrow('CRITICAL: System resources critical');

      consoleSpy.mockRestore();
    });

    it('should return safe reading when systeminformation also fails', async () => {
      // Create a fresh controller to avoid cached state
      const freshController = new ThermalController();

      // Clear all mocks
      vi.clearAllMocks();

      // Mock nvidia-smi failure
      vi.mocked(execSafe).mockRejectedValue(new Error('nvidia-smi not found'));

      // Mock systeminformation failure
      (vi.mocked(si.currentLoad) as any).mockRejectedValue(new Error('systeminformation failed'));
      (vi.mocked(si.mem) as any).mockRejectedValue(new Error('systeminformation failed'));

      const reading = await freshController.checkTemperature();

      expect(reading.isSafe).toBe(true);
      expect(reading.category).toBe('safe');
      // Note: current may be non-zero due to cached readings, but should be safe
    });
  });

  describe('detectHardwareCapabilities() without GPU', () => {
    it('should report GPU as "none detected" when nvidia-smi fails', async () => {
      // Mock nvidia-smi failure
      vi.mocked(execSafe).mockRejectedValue(new Error('nvidia-smi not found'));
      
      // Mock systeminformation CPU/RAM data
      (vi.mocked(si.cpu) as any).mockResolvedValue(createMockCpu(8));
      (vi.mocked(si.mem) as any).mockResolvedValue(createMockMem(16, 8));

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const profile = await controller.detectHardwareCapabilities();

      expect(profile.hasGPU).toBe(false);
      expect(profile.gpuModel).toBe('none detected');
      expect(profile.gpuVRAM).toBeUndefined();
      expect(profile.cpuCores).toBe(8);
      expect(profile.ramTotal).toBe(16);
      expect(profile.recommendedBatchSize).toBeGreaterThan(0);
      expect(profile.recommendedCooldown).toBeGreaterThan(0);

      consoleSpy.mockRestore();
    });

    it('should adjust batch size based on CPU/RAM when no GPU', async () => {
      // Mock nvidia-smi failure
      vi.mocked(execSafe).mockRejectedValue(new Error('nvidia-smi not found'));
      
      // Mock systeminformation with high RAM
      (vi.mocked(si.cpu) as any).mockResolvedValue(createMockCpu(16));
      (vi.mocked(si.mem) as any).mockResolvedValue(createMockMem(32, 16));

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const profile = await controller.detectHardwareCapabilities();

      expect(profile.hasGPU).toBe(false);
      expect(profile.gpuModel).toBe('none detected');
      expect(profile.recommendedBatchSize).toBe(15); // High RAM without GPU
      expect(profile.recommendedCooldown).toBe(20000); // 20 seconds

      consoleSpy.mockRestore();
    });

    it('should use conservative defaults for low-end hardware', async () => {
      // Mock nvidia-smi failure
      vi.mocked(execSafe).mockRejectedValue(new Error('nvidia-smi not found'));
      
      // Mock systeminformation with low RAM
      (vi.mocked(si.cpu) as any).mockResolvedValue(createMockCpu(4));
      (vi.mocked(si.mem) as any).mockResolvedValue(createMockMem(4, 2));

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const profile = await controller.detectHardwareCapabilities();

      expect(profile.hasGPU).toBe(false);
      expect(profile.recommendedBatchSize).toBe(5); // Low-end hardware
      expect(profile.recommendedCooldown).toBe(30000); // 30 seconds

      consoleSpy.mockRestore();
    });

    it('should log GPU unavailability message only once', async () => {
      // Mock nvidia-smi failure
      vi.mocked(execSafe).mockRejectedValue(new Error('nvidia-smi not found'));
      
      // Mock systeminformation CPU/RAM data
      (vi.mocked(si.cpu) as any).mockResolvedValue(createMockCpu(8));
      (vi.mocked(si.mem) as any).mockResolvedValue(createMockMem(16, 8));

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      // First call - should log
      await controller.detectHardwareCapabilities();
      expect(consoleSpy).toHaveBeenCalledWith('[ThermalController] GPU monitoring not available, using CPU/RAM only');
      expect(consoleSpy).toHaveBeenCalledTimes(1);

      // Second call - should not log again
      await controller.detectHardwareCapabilities();
      expect(consoleSpy).toHaveBeenCalledTimes(1);

      consoleSpy.mockRestore();
    });
  });

  describe('Integration: CPU/RAM thresholds protect hardware', () => {
    it('should use CPU/RAM thresholds for protection when GPU unavailable', async () => {
      const controllerWithCustomThresholds = new ThermalController({
        cpuCriticalThreshold: 85,
        cpuWarningThreshold: 70,
        ramCriticalThreshold: 90,
        ramWarningThreshold: 75,
        autoHalt: false, // Disable autoHalt to test warning logging
      });

      // Mock nvidia-smi failure
      vi.mocked(execSafe).mockRejectedValue(new Error('nvidia-smi not found'));

      // Mock systeminformation with warning-level CPU/RAM
      // CPU: 72% (above warning threshold of 70)
      // RAM: 80% used (above warning threshold of 75)
      (vi.mocked(si.currentLoad) as any).mockResolvedValue(createMockCurrentLoad(0.72));
      (vi.mocked(si.mem) as any).mockResolvedValue(createMockMem(16, 3.2)); // 3.2GB available = 80% used

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const reading = await controllerWithCustomThresholds.checkTemperature();

      expect(reading.category).toBe('warning');
      // Warning category means it's still safe (below critical) but elevated
      expect(reading.isSafe).toBe(true);

      consoleSpy.mockRestore();
    });
  });
});
