/**
 * DomainInference - Motor de Comprensión de Negocio
 *
 * Propósito: Analizar modelos de datos y entender el dominio del negocio
 * antes de iniciar auditoría y refactorización.
 *
 * Funcionalidades:
 * - Detectar entidades principales (users, products, orders, etc.)
 * - Inferir relaciones entre entidades
 * - Identificar reglas de negocio implícitas
 * - Generar resumen del dominio en lenguaje natural
 */

import * as fs from "fs";
import * as path from "path";

interface Entity {
  name: string;
  fields: Field[];
  relationships: Relationship[];
  businessRules: string[];
  suggestedCSSClasses?: string[]; // Clases CSS sugeridas por CSSGlobalIndexer
}

interface Field {
  name: string;
  type: string;
  nullable: boolean;
  constraints: string[];
}

interface Relationship {
  type: "one-to-one" | "one-to-many" | "many-to-one" | "many-to-many";
  target: string;
  field: string;
}

interface DomainModel {
  entities: Entity[];
  summary: string;
  inferences: string[];
}

class DomainInference {
  private projectPath: string;
  private domainModel: DomainModel | null = null;

  constructor(projectPath: string) {
    this.projectPath = projectPath;
  }

  /**
   * Analiza el proyecto e infiere el modelo de dominio
   */
  async inferDomain(): Promise<DomainModel> {
    console.log("=== DOMAIN INFERENCE - Analizando modelo de negocio ===");

    const entities: Entity[] = [];

    // 1. Buscar archivos de modelo (Prisma, TypeScript interfaces, schemas)
    const modelFiles = await this.findModelFiles();

    console.log(`Encontrados ${modelFiles.length} archivos de modelo`);

    for (const file of modelFiles) {
      const entity = await this.parseModelFile(file);
      if (entity) {
        entities.push(entity);
      }
    }

    // 2. Inferir relaciones entre entidades
    this.inferRelationships(entities);

    // 3. Inferir reglas de negocio
    this.inferBusinessRules(entities);

    // 4. Generar resumen del dominio
    const summary = this.generateDomainSummary(entities);

    // 5. Generar inferencias adicionales
    const inferences = this.generateInferences(entities);

    this.domainModel = {
      entities,
      summary,
      inferences,
    };

    console.log("=== DOMAIN INFERENCE COMPLETADO ===");
    console.log(`Entidades detectadas: ${entities.length}`);
    console.log(`\nRESUMEN DEL DOMINIO:\n${summary}`);

    return this.domainModel;
  }

  /**
   * Busca archivos que definen modelos de datos
   */
  private async findModelFiles(): Promise<string[]> {
    const { glob } = await import("glob");

    const patterns = [
      "**/schema.prisma",
      "**/models/**/*.ts",
      "**/entities/**/*.ts",
      "**/types/**/*.ts",
      "**/interfaces/**/*.ts",
      "**/schemas/**/*.ts",
      "**/*.schema.ts",
      "**/*.model.ts",
    ];

    const allFiles: string[] = [];

    for (const pattern of patterns) {
      try {
        const files = await glob(pattern, {
          cwd: this.projectPath,
          ignore: ["**/node_modules/**", "**/.next/**", "**/dist/**"],
        });
        allFiles.push(...files);
      } catch (error) {
        // Continue with other patterns
      }
    }

    return Array.from(new Set(allFiles));
  }

  /**
   * Parsea un archivo de modelo y extrae entidad
   */
  private async parseModelFile(filePath: string): Promise<Entity | null> {
    try {
      const fullPath = path.join(this.projectPath, filePath);
      const content = fs.readFileSync(fullPath, "utf8");

      // Detectar tipo de archivo
      if (filePath.includes("prisma")) {
        return this.parsePrismaSchema(content, filePath);
      } else if (filePath.includes("schema") || filePath.includes("model")) {
        return this.parseTypeScriptSchema(content, filePath);
      }

      return null;
    } catch (error) {
      console.warn(`Error parsing ${filePath}:`, error);
      return null;
    }
  }

  /**
   * Parsea schema de Prisma
   */
  private parsePrismaSchema(content: string, _filePath: string): Entity | null {
    const modelMatch = content.match(/model\s+(\w+)\s*\{([\s\S]*?)\}/);

    if (!modelMatch) return null;

    const entityName = modelMatch[1];
    const modelBody = modelMatch[2];

    const fields: Field[] = [];
    const fieldLines = modelBody.split("\n").filter((line) => line.trim());

    for (const line of fieldLines) {
      const fieldMatch = line.match(/(\w+)\s+(\w+)/);
      if (fieldMatch) {
        const fieldName = fieldMatch[1];
        const fieldType = fieldMatch[2];

        const constraints: string[] = [];
        if (line.includes("@unique")) constraints.push("unique");
        if (line.includes("@id")) constraints.push("primary key");
        if (line.includes("required")) constraints.push("required");
        if (line.includes("?")) constraints.push("nullable");

        fields.push({
          name: fieldName,
          type: fieldType,
          nullable: line.includes("?"),
          constraints,
        });
      }
    }

    return {
      name: entityName,
      fields,
      relationships: [],
      businessRules: [],
    };
  }

  /**
   * Parsea schema TypeScript
   */
  private parseTypeScriptSchema(
    content: string,
    _filePath: string,
  ): Entity | null {
    const interfaceMatch = content.match(/interface\s+(\w+)/);
    const typeMatch = content.match(/type\s+(\w+)\s*=/);

    const entityName = (interfaceMatch || typeMatch)?.[1];
    if (!entityName) return null;

    const fields: Field[] = [];

    // Extraer campos del interface/type
    const fieldMatches = Array.from(content.matchAll(/(\w+)\s*:\s*([^,\n]+)/g));
    for (const match of fieldMatches) {
      const fieldName = match[1];
      const fieldType = match[2].trim();

      const constraints: string[] = [];
      if (fieldType.includes("| null") || fieldType.includes("?")) {
        constraints.push("nullable");
      }

      fields.push({
        name: fieldName,
        type: fieldType,
        nullable: constraints.includes("nullable"),
        constraints,
      });
    }

    return {
      name: entityName,
      fields,
      relationships: [],
      businessRules: [],
    };
  }

  /**
   * Infiere relaciones entre entidades basándose en nombres de campos
   */
  private inferRelationships(entities: Entity[]): void {
    for (const entity of entities) {
      for (const field of entity.fields) {
        // Buscar campos que terminan en _id (foreign keys)
        if (field.name.endsWith("_id")) {
          const targetEntityName = field.name.replace("_id", "");
          const targetEntity = entities.find(
            (e) => e.name.toLowerCase() === targetEntityName.toLowerCase(),
          );

          if (targetEntity) {
            entity.relationships.push({
              type: "many-to-one",
              target: targetEntity.name,
              field: field.name,
            });
          }
        }

        // Buscar campos que son arrays de otras entidades
        if (field.type.includes("[]")) {
          const arrayType = field.type.replace("[]", "");
          const targetEntity = entities.find(
            (e) => e.name.toLowerCase() === arrayType.toLowerCase(),
          );

          if (targetEntity) {
            entity.relationships.push({
              type: "one-to-many",
              target: targetEntity.name,
              field: field.name,
            });
          }
        }
      }
    }
  }

  /**
   * Infiere reglas de negocio basándose en nombres de campos y entidades
   */
  private inferBusinessRules(entities: Entity[]): void {
    for (const entity of entities) {
      const rules: string[] = [];

      // Reglas basadas en nombres de campos
      if (entity.fields.some((f) => f.name === "email")) {
        rules.push(`${entity.name} requiere email válido`);
      }

      if (entity.fields.some((f) => f.name === "password")) {
        rules.push(
          `${entity.name} requiere password con requisitos de seguridad`,
        );
      }

      if (
        entity.fields.some((f) => f.name === "status" || f.name === "estado")
      ) {
        rules.push(`${entity.name} tiene ciclo de vida de estados`);
      }

      if (
        entity.fields.some(
          (f) => f.name.includes("created_at") || f.name.includes("createdAt"),
        )
      ) {
        rules.push(`${entity.name} tiene tracking de creación`);
      }

      if (
        entity.fields.some(
          (f) => f.name.includes("updated_at") || f.name.includes("updatedAt"),
        )
      ) {
        rules.push(`${entity.name} tiene tracking de actualización`);
      }

      if (
        entity.fields.some(
          (f) => f.name === "deleted_at" || f.name === "deletedAt",
        )
      ) {
        rules.push(`${entity.name} usa soft delete`);
      }

      // Reglas basadas en nombre de entidad
      if (
        entity.name.toLowerCase().includes("user") ||
        entity.name.toLowerCase().includes("usuario")
      ) {
        rules.push(`${entity.name} tiene autenticación y autorización`);
      }

      if (
        entity.name.toLowerCase().includes("order") ||
        entity.name.toLowerCase().includes("pedido")
      ) {
        rules.push(
          `${entity.name} tiene workflow de estados (pending, confirmed, shipped, delivered)`,
        );
      }

      if (
        entity.name.toLowerCase().includes("payment") ||
        entity.name.toLowerCase().includes("pago")
      ) {
        rules.push(`${entity.name} requiere integración con gateway de pagos`);
        rules.push(
          `${entity.name} maneja estados de transacción (pending, completed, failed, refunded)`,
        );
      }

      entity.businessRules = rules;
    }
  }

  /**
   * Genera resumen del dominio en lenguaje natural
   */
  private generateDomainSummary(entities: Entity[]): string {
    if (entities.length === 0) {
      return "No se detectaron entidades en el modelo de dominio.";
    }

    let summary = `El sistema maneja ${entities.length} entidades principales:\n\n`;

    for (const entity of entities) {
      summary += `**${entity.name}**: ${entity.fields.length} campos`;
      if (entity.relationships.length > 0) {
        summary += `, ${entity.relationships.length} relaciones`;
      }
      summary += "\n";
    }

    summary += "\nRelaciones detectadas:\n";
    for (const entity of entities) {
      for (const rel of entity.relationships) {
        summary += `- ${entity.name} → ${rel.target} (${rel.type})\n`;
      }
    }

    return summary;
  }

  /**
   * Genera inferencias adicionales sobre el negocio
   */
  private generateInferences(entities: Entity[]): string[] {
    const inferences: string[] = [];

    // Inferir tipo de aplicación
    if (entities.some((e) => e.name.toLowerCase().includes("user"))) {
      inferences.push("Aplicación con autenticación de usuarios");
    }

    if (
      entities.some(
        (e) =>
          e.name.toLowerCase().includes("order") ||
          e.name.toLowerCase().includes("pedido"),
      )
    ) {
      inferences.push("Aplicación de e-commerce o gestión de pedidos");
    }

    if (entities.some((e) => e.name.toLowerCase().includes("product"))) {
      inferences.push("Catálogo de productos con inventario");
    }

    if (
      entities.some(
        (e) =>
          e.name.toLowerCase().includes("payment") ||
          e.name.toLowerCase().includes("pago"),
      )
    ) {
      inferences.push("Procesamiento de pagos online");
    }

    if (
      entities.some(
        (e) =>
          e.name.toLowerCase().includes("reservation") ||
          e.name.toLowerCase().includes("booking"),
      )
    ) {
      inferences.push("Sistema de reservas o citas");
    }

    if (entities.some((e) => e.name.toLowerCase().includes("subscription"))) {
      inferences.push("Modelo de suscripción recurrente");
    }

    // Inferir complejidad del dominio
    if (entities.length > 10) {
      inferences.push(
        "Dominio complejo con múltiples entidades interconectadas",
      );
    } else if (entities.length > 5) {
      inferences.push("Dominio de complejidad media");
    } else {
      inferences.push("Dominio simple con pocas entidades");
    }

    return inferences;
  }

  /**
   * Obtiene el modelo de dominio inferido
   */
  getDomainModel(): DomainModel | null {
    return this.domainModel;
  }

  /**
   * Genera reporte en Markdown del dominio
   */
  generateDomainReport(): string {
    if (!this.domainModel) {
      return "# Domain Inference Report\n\nNo se ha inferido el modelo de dominio.";
    }

    let report = "# Domain Inference Report\n\n";
    report += `## Summary\n\n${this.domainModel.summary}\n\n`;

    report += "## Inferences\n\n";
    for (const inference of this.domainModel.inferences) {
      report += `- ${inference}\n`;
    }
    report += "\n";

    report += "## Entities\n\n";
    for (const entity of this.domainModel.entities) {
      report += `### ${entity.name}\n\n`;
      report += `**Fields:** ${entity.fields.length}\n\n`;
      report += "| Name | Type | Nullable | Constraints |\n";
      report += "|------|------|----------|-------------|\n";
      for (const field of entity.fields) {
        report += `| ${field.name} | ${field.type} | ${field.nullable ? "Yes" : "No"} | ${field.constraints.join(", ") || "-"} |\n`;
      }
      report += "\n";

      if (entity.relationships.length > 0) {
        report += "**Relationships:**\n";
        for (const rel of entity.relationships) {
          report += `- ${rel.type} → ${rel.target} (via ${rel.field})\n`;
        }
        report += "\n";
      }

      if (entity.businessRules.length > 0) {
        report += "**Business Rules:**\n";
        for (const rule of entity.businessRules) {
          report += `- ${rule}\n`;
        }
        report += "\n";
      }
    }

    return report;
  }
}

export default DomainInference;
export { DomainInference, DomainModel, Entity, Field, Relationship };
