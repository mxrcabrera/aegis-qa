/**
 * ThermalLock - Mutex-based Thermal Protection for Phase Orchestration
 *
 * Purpose: Provides a locking mechanism to prevent phase transitions
 * when the ThermalController reports 'Critical' status. This prevents
 * the system from continuing operations when hardware is at risk.
 *
 * @module core/thermal-lock
 * @since 1.1.0
 */

/**
 * Lock state
 */
type LockState = 'unlocked' | 'locked' | 'acquiring';

/**
 * ThermalLock - Mutex-based thermal protection
 *
 * This class provides a locking mechanism that blocks phase transitions
 * when thermal conditions are critical.
 *
 * @class ThermalLock
 */
export class ThermalLock {
  private state: LockState = 'unlocked';
  private lockPromise: Promise<void> | null = null;
  private resolveLock: (() => void) | null = null;

  /**
   * Acquires the lock
   *
   * @returns Promise<void> - Resolves when lock is acquired
   */
  async acquire(): Promise<void> {
    if (this.state === 'locked') {
      // Already locked, wait for release
      await this.lockPromise;
      return;
    }

    this.state = 'acquiring';
    
    return new Promise<void>((resolve) => {
      this.lockPromise = new Promise<void>((lockResolve) => {
        this.resolveLock = lockResolve;
      });

      this.state = 'locked';
      resolve();
    });
  }

  /**
   * Releases the lock
   *
   * @returns void
   */
  release(): void {
    if (this.state !== 'locked') {
      return;
    }

    this.state = 'unlocked';
    
    if (this.resolveLock) {
      this.resolveLock();
      this.resolveLock = null;
    }
    
    this.lockPromise = null;
  }

  /**
   * Checks if the lock is currently held
   *
   * @returns boolean - True if locked
   */
  isLocked(): boolean {
    return this.state === 'locked';
  }

  /**
   * Checks if the lock is currently being acquired
   *
   * @returns boolean - True if acquiring
   */
  isAcquiring(): boolean {
    return this.state === 'acquiring';
  }

  /**
   * Gets the current lock state
   *
   * @returns LockState - Current lock state
   */
  getState(): LockState {
    return this.state;
  }

  /**
   * Attempts to acquire the lock with a timeout
   *
   * @param timeoutMs - Timeout in milliseconds
   * @returns Promise<boolean> - True if lock was acquired, false if timeout
   */
  async tryAcquire(timeoutMs: number): Promise<boolean> {
    try {
      await Promise.race([
        this.acquire(),
        new Promise<void>((_, reject) => 
          setTimeout(() => reject(new Error('Lock acquisition timeout')), timeoutMs)
        ),
      ]);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Forces release of the lock (emergency use only)
   *
   * @returns void
   */
  forceRelease(): void {
    this.state = 'unlocked';
    
    if (this.resolveLock) {
      this.resolveLock();
      this.resolveLock = null;
    }
    
    this.lockPromise = null;
  }
}
