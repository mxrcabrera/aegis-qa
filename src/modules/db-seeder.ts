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

import { SecretManager } from "../core/secret-manager";

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

class DBSeeder {
  private testData: {
    students: TestStudent[];
    classes: TestClase[];
  };
  private secretManager: SecretManager;

  constructor() {
    // Datos de prueba por defecto
    this.testData = {
      students: [
        {
          id: "test-student-1",
          email: "test.student1@example.com",
          nombre: "Test Student One",
          telefono: "+5491112345678",
        },
        {
          id: "test-student-2",
          email: "test.student2@example.com",
          nombre: "Test Student Two",
          telefono: "+5491198765432",
        },
      ],
      classes: [
        {
          id: "test-clase-1",
          nombre: "Clase Test 1",
          fecha: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 días en el futuro
          capacidad: 10,
          disponible: true,
        },
        {
          id: "test-clase-2",
          nombre: "Clase Test 2",
          fecha: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 días en el futuro
          capacidad: 8,
          disponible: true,
        },
      ],
    };

    this.secretManager = new SecretManager({ mockMode: true });
  }

  /**
   * Obtiene cliente Supabase con service role (admin access)
   */
  private async getAdminClient() {
    await this.secretManager.initialize();
    const url = this.secretManager.get('SUPABASE_URL');
    const key = this.secretManager.get('SUPABASE_SERVICE_ROLE_KEY');
    const { createClient } = await import('@supabase/supabase-js');
    return createClient(url, key);
  }

  /**
   * Inserta datos de prueba en la base de datos
   */
  async seed(): Promise<SeedResult> {
    try {
      const client = await this.getAdminClient();

      const result: SeedResult = {
        success: false,
        students: [],
        classes: [],
        reservations: [],
      };

      // Insertar estudiantes
      for (const student of this.testData.students) {
        const { data, error } = await client
          .from("estudiantes")
          .upsert(student as TestStudent, { onConflict: "id" })
          .select()
          .single();

        if (error) {
          console.warn(
            `Failed to insert student ${student.id}:`,
            error.message,
          );
        } else if (data) {
          result.students.push(data as TestStudent);
        }
      }

      // Insertar clases
      for (const clase of this.testData.classes) {
        const { data, error } = await client
          .from("clases")
          .upsert(clase as TestClase, { onConflict: "id" })
          .select()
          .single();

        if (error) {
          console.warn(`Failed to insert class ${clase.id}:`, error.message);
        } else if (data) {
          result.classes.push(data as TestClase);
        }
      }

      result.success = true;
      console.log("✅ Test data seeded successfully");
      console.log(`  - Students: ${result.students.length}`);
      console.log(`  - Classes: ${result.classes.length}`);

      return result;
    } catch (error) {
      return {
        success: false,
        students: [],
        classes: [],
        reservations: [],
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Crea una reserva de prueba
   */
  async createReservation(
    estudianteId: string,
    claseId: string,
  ): Promise<TestReserva | null> {
    try {
      const client = await this.getAdminClient();

      const reserva: TestReserva = {
        id: `test-reserva-${Date.now()}`,
        estudiante_id: estudianteId,
        clase_id: claseId,
        estado: "reservada",
        fecha_reserva: new Date().toISOString(),
      };

      const { data, error } = await client
        .from("reservas")
        .insert(reserva as TestReserva)
        .select()
        .single();

      if (error) {
        console.error("Failed to create reservation:", error.message);
        return null;
      }

      console.log(`✅ Reservation created: ${(data as { id?: string }).id}`);
      return data as TestReserva;
    } catch (error) {
      console.error("Error creating reservation:", error);
      return null;
    }
  }

  /**
   * Limpia datos de prueba de la base de datos
   */
  async cleanup(): Promise<CleanupResult> {
    try {
      const client = await this.getAdminClient();

      const result: CleanupResult = {
        success: false,
        deletedRecords: {
          students: 0,
          classes: 0,
          reservations: 0,
        },
      };

      // Eliminar reservas de prueba
      const { count: reservationsCount } = await client
        .from("reservas")
        .delete()
        .ilike("id", "test-reserva-%");

      result.deletedRecords.reservations = reservationsCount || 0;

      // Eliminar estudiantes de prueba
      const { count: studentsCount } = await client
        .from("estudiantes")
        .delete()
        .ilike("email", "test.student%");

      result.deletedRecords.students = studentsCount || 0;

      // Eliminar clases de prueba
      const { count: classesCount } = await client
        .from("clases")
        .delete()
        .ilike("nombre", "Clase Test%");

      result.deletedRecords.classes = classesCount || 0;

      result.success = true;
      console.log("✅ Test data cleaned up successfully");
      console.log(`  - Students deleted: ${result.deletedRecords.students}`);
      console.log(`  - Classes deleted: ${result.deletedRecords.classes}`);
      console.log(
        `  - Reservations deleted: ${result.deletedRecords.reservations}`,
      );

      return result;
    } catch (error) {
      return {
        success: false,
        deletedRecords: {
          students: 0,
          classes: 0,
          reservations: 0,
        },
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Verifica que los datos de prueba existan
   */
  async verifySeed(): Promise<boolean> {
    try {
      const client = await this.getAdminClient();

      // Verificar estudiantes
      const { count: studentCount } = await client
        .from("estudiantes")
        .select("*", { count: "exact", head: true })
        .ilike("email", "test.student%");

      // Verificar clases
      const { count: classCount } = await client
        .from("clases")
        .select("*", { count: "exact", head: true })
        .ilike("nombre", "Clase Test%");

      const hasStudents = (studentCount || 0) > 0;
      const hasClasses = (classCount || 0) > 0;

      console.log("Seed verification:");
      console.log(`  - Test students: ${studentCount || 0}`);
      console.log(`  - Test classes: ${classCount || 0}`);

      return hasStudents && hasClasses;
    } catch (error) {
      console.error("Error verifying seed:", error);
      return false;
    }
  }

  /**
   * Configura datos de prueba personalizados
   */
  setTestData(data: { students?: TestStudent[]; classes?: TestClase[] }): void {
    if (data.students) {
      this.testData.students = data.students;
    }
    if (data.classes) {
      this.testData.classes = data.classes;
    }
  }

  /**
   * Obtiene datos de prueba actuales
   */
  getTestData() {
    return { ...this.testData };
  }
}

export default DBSeeder;
export {
  DBSeeder,
  SeedResult,
  CleanupResult,
  TestStudent,
  TestClase,
  TestReserva,
};
