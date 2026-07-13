import { MigrationInterface, QueryRunner } from 'typeorm';

export class FacturacionModule1900000000000 implements MigrationInterface {
  name = 'FacturacionModule1900000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ENUM de estado
    await queryRunner.query(`
      CREATE TYPE "facturas_estado_enum" AS ENUM('pendiente', 'pagado')
    `);

    // Tabla facturas
    await queryRunner.query(`
      CREATE TABLE "facturas" (
        "id"               uuid          NOT NULL DEFAULT uuid_generate_v4(),
        "periodo"          varchar(7)    NOT NULL,
        "monto"            numeric(12,2) NOT NULL DEFAULT 23000,
        "moneda"           varchar(3)    NOT NULL DEFAULT 'ARS',
        "estado"           "facturas_estado_enum" NOT NULL DEFAULT 'pendiente',
        "fechaEmision"     TIMESTAMP     NOT NULL,
        "fechaVencimiento" date          NOT NULL,
        "fechaPago"        TIMESTAMP,
        "metodoPago"       varchar(20),
        "mpPreferenceId"   varchar(100),
        "mpPaymentId"      varchar(100),
        "createdAt"        TIMESTAMP     NOT NULL DEFAULT now(),
        "updatedAt"        TIMESTAMP     NOT NULL DEFAULT now(),
        CONSTRAINT "PK_facturas" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_facturas_periodo" UNIQUE ("periodo")
      )
    `);

    await queryRunner.query(`CREATE INDEX "IDX_facturas_periodo" ON "facturas" ("periodo")`);
    await queryRunner.query(`CREATE INDEX "IDX_facturas_estado"  ON "facturas" ("estado")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_facturas_estado"`);
    await queryRunner.query(`DROP INDEX "IDX_facturas_periodo"`);
    await queryRunner.query(`DROP TABLE "facturas"`);
    await queryRunner.query(`DROP TYPE "facturas_estado_enum"`);
  }
}
