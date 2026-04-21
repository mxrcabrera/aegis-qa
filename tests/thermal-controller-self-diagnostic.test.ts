/**
 * Unit Tests for Thermal Controller Passive Self-Diagnostic
 *
 * Tests for the thermal controller's passive self-diagnostic that replaces
 * the destructive stress test with a non-invasive baseline reading.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ThermalController } from '../src/core/thermal-controller.js';
import { execSafe } from '../src/core/command-sanitizer.js';
import * as si from 'systeminformation';

// Mock the dependencies
vi.mock('../src/core/command-sanitizer.js');
vi.mock('systeminformation');

describe('ThermalController Passive Self-Diagnostic', () => {
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

  describe('passive baseline reading', () => {
    it('should perform passive baseline reading without artificial load', async () => {
      // Mock nvidia-smi success
      vi.mocked(execSafe).mockResolvedValue({ stdout: '45', stderr: '' });

      // Mock systeminformation
      (vi.mocked(si.currentLoad) as any).mockResolvedValue(createMockCurrentLoad(0.3));
      (vi.mocked(si.mem) as any).mockResolvedValue(createMockMem(16, 12));

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const result = await controller.runSelfDiagnostic(100);

      expect(result.pass).toBe(true);
      expect(result.baseline.initialTemp).toBe(45);
      expect(result.baseline.initialCpuUsage).toBe(30);
      expect(result.baseline.initialRamUsage).toBe(25); // 4GB used out of 16GB = 25%
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Running passive self-diagnostic')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Waiting 100ms for passive baseline measurement')
      );

      consoleSpy.mockRestore();
    });

    it('should not perform stress test loop', async () => {
      // Mock nvidia-smi success
      vi.mocked(execSafe).mockResolvedValue({ stdout: '40', stderr: '' });

      // Mock systeminformation
      (vi.mocked(si.currentLoad) as any).mockResolvedValue(createMockCurrentLoad(0.3));
      (vi.mocked(si.mem) as any).mockResolvedValue(createMockMem(16, 12));

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await controller.runSelfDiagnostic(100);

      // Verify no stress test messages
      expect(consoleSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('stress test')
      );

      // Verify passive measurement message
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('passive baseline')
      );

      consoleSpy.mockRestore();
    });

    it('should measure baseline over specified duration', async () => {
      // Mock nvidia-smi success
      vi.mocked(execSafe).mockResolvedValue({ stdout: '40', stderr: '' });

      // Mock systeminformation
      (vi.mocked(si.currentLoad) as any).mockResolvedValue(createMockCurrentLoad(0.3));
      (vi.mocked(si.mem) as any).mockResolvedValue(createMockMem(16, 12));

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await controller.runSelfDiagnostic(500);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Waiting 500ms for passive baseline measurement')
      );

      consoleSpy.mockRestore();
    });

    it('should return baseline data structure', async () => {
      // Mock nvidia-smi success
      vi.mocked(execSafe).mockResolvedValue({ stdout: '40', stderr: '' });

      // Mock systeminformation
      (vi.mocked(si.currentLoad) as any).mockResolvedValue(createMockCurrentLoad(0.3));
      (vi.mocked(si.mem) as any).mockResolvedValue(createMockMem(16, 12));

      const result = await controller.runSelfDiagnostic(100);

      expect(result.baseline).toHaveProperty('initialTemp');
      expect(result.baseline).toHaveProperty('finalTemp');
      expect(result.baseline).toHaveProperty('initialCpuUsage');
      expect(result.baseline).toHaveProperty('initialRamUsage');
      expect(result.baseline).toHaveProperty('finalCpuUsage');
      expect(result.baseline).toHaveProperty('finalRamUsage');
    });
  });

  describe('conservative threshold adjustment for warning zone', () => {
    it('should adjust thresholds when initial baseline is in warning zone', async () => {
      // Mock nvidia-smi success with warning temperature
      vi.mocked(execSafe).mockResolvedValue({ stdout: '62', stderr: '' }); // Warning zone (60-70)

      // Mock systeminformation with warning CPU/RAM
      (vi.mocked(si.currentLoad) as any).mockResolvedValue(createMockCurrentLoad(0.72)); // 72% CPU
      (vi.mocked(si.mem) as any).mockResolvedValue(createMockMem(16, 4)); // 75% RAM used

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const result = await controller.runSelfDiagnostic(100);

      expect(result.adjustedThresholds).toBe(true);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Initial baseline already in warning zone')
      );

      consoleSpy.mockRestore();
      consoleWarnSpy.mockRestore();
    });

    it('should use maximum conservative settings for critical zone', async () => {
      // Create controller with autoHalt disabled to prevent error throw
      const controllerNoHalt = new ThermalController({ autoHalt: false });

      // Mock nvidia-smi success with critical temperature
      vi.mocked(execSafe).mockResolvedValue({ stdout: '75', stderr: '' }); // Critical zone (>70)

      // Mock systeminformation with critical CPU/RAM
      (vi.mocked(si.currentLoad) as any).mockResolvedValue(createMockCurrentLoad(0.92)); // 92% CPU
      (vi.mocked(si.mem) as any).mockResolvedValue(createMockMem(16, 1)); // 94% RAM used

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const result = await controllerNoHalt.runSelfDiagnostic(100);

      expect(result.adjustedThresholds).toBe(true);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Initial baseline in critical zone')
      );

      consoleSpy.mockRestore();
      consoleWarnSpy.mockRestore();
    });

    it('should not adjust thresholds when baseline is safe', async () => {
      // Mock nvidia-smi success with safe temperature
      vi.mocked(execSafe).mockResolvedValue({ stdout: '45', stderr: '' }); // Safe zone (<60)

      // Mock systeminformation with safe CPU/RAM
      (vi.mocked(si.currentLoad) as any).mockResolvedValue(createMockCurrentLoad(0.3)); // 30% CPU
      (vi.mocked(si.mem) as any).mockResolvedValue(createMockMem(16, 12)); // 25% RAM used

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const result = await controller.runSelfDiagnostic(100);

      expect(result.adjustedThresholds).toBe(false);

      consoleSpy.mockRestore();
    });
  });

  describe('temperature rise rate calculation', () => {
    it('should calculate temperature change rate correctly', async () => {
      // Mock nvidia-smi with temperature change
      let callCount = 0;
      vi.mocked(execSafe).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve({ stdout: '40', stderr: '' });
        } else {
          return Promise.resolve({ stdout: '42', stderr: '' }); // 2 degree rise
        }
      });

      // Mock systeminformation
      (vi.mocked(si.currentLoad) as any).mockResolvedValue(createMockCurrentLoad(0.3));
      (vi.mocked(si.mem) as any).mockResolvedValue(createMockMem(16, 12));

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const result = await controller.runSelfDiagnostic(2000); // 2 seconds

      expect(result.temperatureRiseRate).toBeCloseTo(1.0, 1); // 2 degrees / 2 seconds = 1.0

      consoleSpy.mockRestore();
    });

    it('should adjust thresholds if temperature rises quickly without load', async () => {
      // Mock nvidia-smi with fast temperature rise
      let callCount = 0;
      vi.mocked(execSafe).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve({ stdout: '40', stderr: '' });
        } else {
          return Promise.resolve({ stdout: '45', stderr: '' }); // 5 degree rise in 2 seconds = 2.5 deg/s
        }
      });

      // Mock systeminformation
      (vi.mocked(si.currentLoad) as any).mockResolvedValue(createMockCurrentLoad(0.3));
      (vi.mocked(si.mem) as any).mockResolvedValue(createMockMem(16, 12));

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const result = await controller.runSelfDiagnostic(2000);

      expect(result.temperatureRiseRate).toBeGreaterThan(1.0);
      expect(result.adjustedThresholds).toBe(true);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Fast temperature rise detected without load')
      );

      consoleSpy.mockRestore();
      consoleWarnSpy.mockRestore();
    });
  });

  describe('error handling', () => {
    it('should return conservative defaults on diagnostic failure', async () => {
      // Create fresh controller to avoid cached state
      const freshController = new ThermalController();
      vi.clearAllMocks();

      // Mock nvidia-smi failure
      vi.mocked(execSafe).mockRejectedValue(new Error('nvidia-smi failed'));

      // Mock systeminformation failure
      (vi.mocked(si.currentLoad) as any).mockRejectedValue(new Error('systeminformation failed'));
      (vi.mocked(si.mem) as any).mockRejectedValue(new Error('systeminformation failed'));

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await freshController.runSelfDiagnostic(100);

      expect(result.pass).toBe(true);
      expect(result.temperatureRiseRate).toBe(0);
      expect(result.adjustedThresholds).toBe(false);
      // Baseline values may be 0 or fallback values depending on error handling
      expect(result.baseline.initialTemp).toBeGreaterThanOrEqual(0);
      expect(result.baseline.finalTemp).toBeGreaterThanOrEqual(0);

      consoleSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });
  });
});
