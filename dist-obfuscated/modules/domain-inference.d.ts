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
interface Entity {
    name: string;
    fields: Field[];
    relationships: Relationship[];
    businessRules: string[];
    suggestedCSSClasses?: string[];
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
declare class DomainInference {
    private projectPath;
    private domainModel;
    constructor(projectPath: string);
    /**
     * Analiza el proyecto e infiere el modelo de dominio
     */
    inferDomain(): Promise<DomainModel>;
    /**
     * Busca archivos que definen modelos de datos
     */
    private findModelFiles;
    /**
     * Parsea un archivo de modelo y extrae entidad
     */
    private parseModelFile;
    /**
     * Parsea schema de Prisma
     */
    private parsePrismaSchema;
    /**
     * Parsea schema TypeScript
     */
    private parseTypeScriptSchema;
    /**
     * Infiere relaciones entre entidades basándose en nombres de campos
     */
    private inferRelationships;
    /**
     * Infiere reglas de negocio basándose en nombres de campos y entidades
     */
    private inferBusinessRules;
    /**
     * Genera resumen del dominio en lenguaje natural
     */
    private generateDomainSummary;
    /**
     * Genera inferencias adicionales sobre el negocio
     */
    private generateInferences;
    /**
     * Obtiene el modelo de dominio inferido
     */
    getDomainModel(): DomainModel | null;
    /**
     * Genera reporte en Markdown del dominio
     */
    generateDomainReport(): string;
}
export default DomainInference;
export { DomainInference, DomainModel, Entity, Field, Relationship };
//# sourceMappingURL=domain-inference.d.ts.map