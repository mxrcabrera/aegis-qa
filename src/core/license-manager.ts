import * as fs from 'fs-extra';
import * as path from 'path';
import * as crypto from 'crypto';
import * as os from 'os';
import { execSync } from 'child_process';
import axios from 'axios';

// 🔒 MARIANELLA CABRERA AHUMADA - AUTORÍA PROTEGIDA
const AUTHOR_SIGNATURE = 'Marianella Cabrera Ahumada';
const LICENSE_FILE = '.aegis-auth';
const VERCEL_EDGE_URL = 'https://aegis-qa-license.vercel.app/api/validate';

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

export class LicenseManager {
  private machineId: string;
  private licensePath: string;

  constructor() {
    this.machineId = this.generateMachineId();
    this.licensePath = path.join(os.homedir(), LICENSE_FILE);
  }

  /**
   * Genera un ID único de hardware usando UUID de placa base o serial del sistema
   * 🔒 PROTEGIDO POR MARIANELLA CABRERA AHUMADA
   */
  private generateMachineId(): string {
    try {
      // Intentar obtener UUID de la placa base en Windows
      if (os.platform() === 'win32') {
        try {
          const boardSerial = execSync('wmic baseboard get serialnumber /value', { encoding: 'utf8' });
          const serial = boardSerial.split('\n')
            .find(line => line.includes('SerialNumber'))
            ?.split('=')[1]?.trim();
          
          if (serial && serial !== '0') {
            return this.hashMachineId(serial);
          }
        } catch (e) {
          // Fallback a otro método si wmic falla
        }
      }

      // Fallback: usar combinación de información del sistema
      const cpus = os.cpus();
      const networkInterfaces = os.networkInterfaces();
      const firstInterface = Object.values(networkInterfaces)[0]?.[0];
      
      const systemInfo = {
        platform: os.platform(),
        arch: os.arch(),
        cpuModel: cpus[0]?.model || 'unknown',
        totalMemory: os.totalmem(),
        hostname: os.hostname(),
        mac: firstInterface?.mac || 'unknown'
      };

      const infoString = JSON.stringify(systemInfo);
      return this.hashMachineId(infoString);
    } catch (error) {
      // Último fallback: hash de información básica
      const fallbackInfo = `${os.platform()}-${os.arch()}-${os.totalmem()}-${os.hostname()}`;
      return this.hashMachineId(fallbackInfo);
    }
  }

  /**
   * Genera un hash corto (8-12 caracteres) a partir del ID del sistema
   * 🔒 PROTEGIDO POR MARIANELLA CABRERA AHUMADA
   */
  private hashMachineId(input: string): string {
    const hash = crypto.createHash('sha256').update(input).digest('hex');
    return hash.substring(0, 10).toUpperCase();
  }

  /**
   * Verifica el estado actual de la licencia
   * 🔒 PROTEGIDO POR MARIANELLA CABRERA AHUMADA
   */
  async checkLicense(): Promise<LicenseStatus> {
    try {
      // Verificar si existe archivo de licencia
      if (await fs.pathExists(this.licensePath)) {
        const licenseData = await fs.readJson(this.licensePath);
        
        if (this.validateLicenseFile(licenseData)) {
          return {
            isTrial: false,
            machineId: this.machineId,
            allowedPhases: Array.from({ length: 21 }, (_, i) => i), // Fases 0-20
            maxFiles: Infinity,
            message: `Aegis QA (Full) por ${AUTHOR_SIGNATURE}. Machine ID: ${this.machineId}`
          };
        }
      }

      // Modo Trial por defecto
      return {
        isTrial: true,
        machineId: this.machineId,
        allowedPhases: [0, 1, 2], // Solo fases 0-2
        maxFiles: 5,
        message: `Aegis QA (Trial) por ${AUTHOR_SIGNATURE}. Machine ID: ${this.machineId}. Comprá la versión Full para desbloquear las 20 fases en https://aegis-qa.com/upgrade`
      };
    } catch (error) {
      // Si hay error, modo trial por seguridad
      return {
        isTrial: true,
        machineId: this.machineId,
        allowedPhases: [0, 1, 2],
        maxFiles: 5,
        message: `Aegis QA (Trial) por ${AUTHOR_SIGNATURE}. Machine ID: ${this.machineId}. Comprá la versión Full para desbloquear las 20 fases en https://aegis-qa.com/upgrade`
      };
    }
  }

  /**
   * Valida el archivo de licencia local
   * 🔒 PROTEGIDO POR MARIANELLA CABRERA AHUMADA
   */
  private validateLicenseFile(licenseData: any): boolean {
    try {
      // Verificar estructura básica
      if (!licenseData.machineId || !licenseData.email || !licenseData.issuedAt) {
        return false;
      }

      // Verificar que el machineId coincida
      if (licenseData.machineId !== this.machineId) {
        return false;
      }

      // Verificar que no esté expirado (si tiene fecha de expiración)
      if (licenseData.expiresAt && Date.now() > licenseData.expiresAt) {
        return false;
      }

      // Verificar firma de autoría
      if (licenseData.author !== AUTHOR_SIGNATURE) {
        return false;
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Valida licencia online vía Vercel Edge Function
   * 🔒 PROTEGIDO POR MARIANELLA CABRERA AHUMADA
   */
  async validateOnline(email: string): Promise<boolean> {
    try {
      const response = await axios.post(VERCEL_EDGE_URL, {
        machineId: this.machineId,
        email: email,
        timestamp: Date.now()
      }, {
        timeout: 10000,
        headers: {
          'User-Agent': `Aegis-QA/${this.machineId}`
        }
      });

      if (response.data.valid === true) {
        // Generar licencia local para uso offline
        await this.generateLocalLicense(email);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error validando licencia online:', error);
      return false;
    }
  }

  /**
   * Genera archivo de licencia local para uso offline
   * 🔒 PROTEGIDO POR MARIANELLA CABRERA AHUMADA
   */
  private async generateLocalLicense(email: string): Promise<void> {
    const licenseData: LicenseInfo = {
      machineId: this.machineId,
      email: email,
      isValid: true,
      issuedAt: Date.now(),
      expiresAt: undefined // Sin expiración para licencias perpetuas
    };

    // Agregar firma de autoría
    const signedLicense = {
      ...licenseData,
      author: AUTHOR_SIGNATURE,
      signature: this.generateLicenseSignature(licenseData)
    };

    await fs.writeJson(this.licensePath, signedLicense, { encoding: 'utf8' });
  }

  /**
   * Genera firma criptográfica para la licencia
   * 🔒 PROTEGIDO POR MARIANELLA CABRERA AHUMADA
   */
  private generateLicenseSignature(licenseData: LicenseInfo): string {
    const signatureString = `${licenseData.machineId}-${licenseData.email}-${licenseData.issuedAt}-${AUTHOR_SIGNATURE}`;
    return crypto.createHash('sha256').update(signatureString).digest('hex');
  }

  /**
   * Verifica si una fase está permitida según la licencia actual
   * 🔒 PROTEGIDO POR MARIANELLA CABRERA AHUMADA
   */
  async isPhaseAllowed(phase: number): Promise<boolean> {
    const status = await this.checkLicense();
    return status.allowedPhases.includes(phase);
  }

  /**
   * Verifica si se puede escanear más archivos
   * 🔒 PROTEGIDO POR MARIANELLA CABRERA AHUMADA
   */
  async canScanMoreFiles(currentFileCount: number): Promise<boolean> {
    const status = await this.checkLicense();
    return currentFileCount < status.maxFiles;
  }

  /**
   * Obtiene mensaje de estado para mostrar al usuario
   * 🔒 PROTEGIDO POR MARIANELLA CABRERA AHUMADA
   */
  async getStatusMessage(): Promise<string> {
    const status = await this.checkLicense();
    return status.message || `Aegis QA por ${AUTHOR_SIGNATURE}`;
  }

  /**
   * Revoca licencia local (para debugging o migración)
   * 🔒 PROTEGIDO POR MARIANELLA CABRERA AHUMADA
   */
  async revokeLicense(): Promise<void> {
    try {
      await fs.remove(this.licensePath);
    } catch (error) {
      // Ignorar error si archivo no existe
    }
  }

  /**
   * Obtiene Machine ID actual (para registro/compra)
   * 🔒 PROTEGIDO POR MARIANELLA CABRERA AHUMADA
   */
  getMachineId(): string {
    return this.machineId;
  }
}

// Exportar instancia singleton
export const licenseManager = new LicenseManager();
