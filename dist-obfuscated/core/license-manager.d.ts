export interface LicenseInfo {
    machineId: string;
    email: string;
    isValid: boolean;
    issuedAt: number;
    expiresAt?: number;
}
export interface LicenseStatus {
    isTrial: boolean;
    machineId: string;
    allowedPhases: number[];
    maxFiles: number;
    message?: string;
}
export declare class LicenseManager {
    private machineId;
    private licensePath;
    constructor();
    /**
     * Genera un ID único de hardware usando UUID de placa base o serial del sistema
     * 🔒 PROTEGIDO POR MARIANELLA CABRERA AHUMADA
     */
    private generateMachineId;
    /**
     * Genera un hash corto (8-12 caracteres) a partir del ID del sistema
     * 🔒 PROTEGIDO POR MARIANELLA CABRERA AHUMADA
     */
    private hashMachineId;
    /**
     * Verifica el estado actual de la licencia
     * 🔒 PROTEGIDO POR MARIANELLA CABRERA AHUMADA
     */
    checkLicense(): Promise<LicenseStatus>;
    /**
     * Valida el archivo de licencia local
     * 🔒 PROTEGIDO POR MARIANELLA CABRERA AHUMADA
     */
    private validateLicenseFile;
    /**
     * Valida licencia online vía Vercel Edge Function
     * 🔒 PROTEGIDO POR MARIANELLA CABRERA AHUMADA
     */
    validateOnline(email: string): Promise<boolean>;
    /**
     * Genera archivo de licencia local para uso offline
     * 🔒 PROTEGIDO POR MARIANELLA CABRERA AHUMADA
     */
    private generateLocalLicense;
    /**
     * Genera firma criptográfica para la licencia
     * 🔒 PROTEGIDO POR MARIANELLA CABRERA AHUMADA
     */
    private generateLicenseSignature;
    /**
     * Verifica si una fase está permitida según la licencia actual
     * 🔒 PROTEGIDO POR MARIANELLA CABRERA AHUMADA
     */
    isPhaseAllowed(phase: number): Promise<boolean>;
    /**
     * Verifica si se puede escanear más archivos
     * 🔒 PROTEGIDO POR MARIANELLA CABRERA AHUMADA
     */
    canScanMoreFiles(currentFileCount: number): Promise<boolean>;
    /**
     * Obtiene mensaje de estado para mostrar al usuario
     * 🔒 PROTEGIDO POR MARIANELLA CABRERA AHUMADA
     */
    getStatusMessage(): Promise<string>;
    /**
     * Revoca licencia local (para debugging o migración)
     * 🔒 PROTEGIDO POR MARIANELLA CABRERA AHUMADA
     */
    revokeLicense(): Promise<void>;
    /**
     * Obtiene Machine ID actual (para registro/compra)
     * 🔒 PROTEGIDO POR MARIANELLA CABRERA AHUMADA
     */
    getMachineId(): string;
}
export declare const licenseManager: LicenseManager;
//# sourceMappingURL=license-manager.d.ts.map