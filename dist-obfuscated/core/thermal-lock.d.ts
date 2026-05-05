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
export declare class ThermalLock {
    private state;
    private lockPromise;
    private resolveLock;
    /**
     * Acquires the lock
     *
     * @returns Promise<void> - Resolves when lock is acquired
     */
    acquire(): Promise<void>;
    /**
     * Releases the lock
     *
     * @returns void
     */
    release(): void;
    /**
     * Checks if the lock is currently held
     *
     * @returns boolean - True if locked
     */
    isLocked(): boolean;
    /**
     * Checks if the lock is currently being acquired
     *
     * @returns boolean - True if acquiring
     */
    isAcquiring(): boolean;
    /**
     * Gets the current lock state
     *
     * @returns LockState - Current lock state
     */
    getState(): LockState;
    /**
     * Attempts to acquire the lock with a timeout
     *
     * @param timeoutMs - Timeout in milliseconds
     * @returns Promise<boolean> - True if lock was acquired, false if timeout
     */
    tryAcquire(timeoutMs: number): Promise<boolean>;
    /**
     * Forces release of the lock (emergency use only)
     *
     * @returns void
     */
    forceRelease(): void;
}
export {};
//# sourceMappingURL=thermal-lock.d.ts.map