/**
 * DB Seeder - Seeder de Datos para QA Orchestrator
 *
 * Propósito: Insertar y limpiar datos de prueba para tests E2E
 *
 * Funcionalidades:
 * - Insertar datos de prueba (estudiantes, clases, reservas)
 * - Limpiar datos post-test
 * - Asegurar tests determinísticos
 * - Soporte de transacciones para rollback
 */
interface TestStudent {
    id: string;
    email: string;
    nombre: string;
    telefono?: string;
}
interface TestClase {
    id: string;
    nombre: string;
    fecha: string;
    capacidad: number;
    disponible: boolean;
}
interface TestReserva {
    id: string;
    estudiante_id: string;
    clase_id: string;
    estado: "reservada" | "confirmada" | "cancelada" | "completada";
    fecha_reserva: string;
}
interface SeedResult {
    success: boolean;
    students: TestStudent[];
    classes: TestClase[];
    reservations: TestReserva[];
    error?: string;
}
interface CleanupResult {
    success: boolean;
    deletedRecords: {
        students: number;
        classes: number;
        reservations: number;
    };
    error?: string;
}
declare class DBSeeder {
    private testData;
    private secretManager;
    constructor();
    /**
     * Obtiene cliente Supabase con service role (admin access)
     */
    private getAdminClient;
    /**
     * Inserta datos de prueba en la base de datos
     */
    seed(): Promise<SeedResult>;
    /**
     * Crea una reserva de prueba
     */
    createReservation(estudianteId: string, claseId: string): Promise<TestReserva | null>;
    /**
     * Limpia datos de prueba de la base de datos
     */
    cleanup(): Promise<CleanupResult>;
    /**
     * Verifica que los datos de prueba existan
     */
    verifySeed(): Promise<boolean>;
    /**
     * Configura datos de prueba personalizados
     */
    setTestData(data: {
        students?: TestStudent[];
        classes?: TestClase[];
    }): void;
    /**
     * Obtiene datos de prueba actuales
     */
    getTestData(): {
        students: TestStudent[];
        classes: TestClase[];
    };
}
export default DBSeeder;
export { DBSeeder, SeedResult, CleanupResult, TestStudent, TestClase, TestReserva, };
//# sourceMappingURL=db-seeder.d.ts.map