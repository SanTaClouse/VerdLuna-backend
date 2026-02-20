import { MigrationInterface, QueryRunner } from 'typeorm';

export class MercaderiaModule1800000000000 implements MigrationInterface {
  name = 'MercaderiaModule1800000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ENUM types
    await queryRunner.query(`
      CREATE TYPE "productos_categoria_enum" AS ENUM(
        'Verduras y Hortalizas',
        'Frutas',
        'Verduras de Hoja y Otros',
        'Varios y Elaborados'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "productos_unidad_enum" AS ENUM('kg', 'unidad')
    `);

    // Tabla productos
    await queryRunner.query(`
      CREATE TABLE "productos" (
        "id"       uuid         NOT NULL DEFAULT uuid_generate_v4(),
        "nombre"   varchar(150) NOT NULL,
        "categoria" "productos_categoria_enum" NOT NULL,
        "unidad"   "productos_unidad_enum"    NOT NULL DEFAULT 'kg',
        "activo"   boolean      NOT NULL DEFAULT true,
        "orden"    integer      NOT NULL DEFAULT 0,
        CONSTRAINT "PK_productos" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`CREATE INDEX "IDX_productos_categoria" ON "productos" ("categoria")`);
    await queryRunner.query(`CREATE INDEX "IDX_productos_activo"    ON "productos" ("activo")`);

    // Tabla stock
    await queryRunner.query(`
      CREATE TABLE "stock" (
        "id"          uuid         NOT NULL DEFAULT uuid_generate_v4(),
        "productoId"  uuid         NOT NULL,
        "sucursalId"  integer      NOT NULL,
        "cantidad"    numeric(10,3) NOT NULL DEFAULT 0,
        "updatedAt"   TIMESTAMP    NOT NULL DEFAULT now(),
        CONSTRAINT "PK_stock" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_stock_producto_sucursal" UNIQUE ("productoId", "sucursalId")
      )
    `);

    await queryRunner.query(`CREATE INDEX "IDX_stock_sucursalId" ON "stock" ("sucursalId")`);

    await queryRunner.query(`
      ALTER TABLE "stock"
      ADD CONSTRAINT "FK_stock_producto"
      FOREIGN KEY ("productoId") REFERENCES "productos"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    // Tabla stock_historial
    await queryRunner.query(`
      CREATE TABLE "stock_historial" (
        "id"               uuid          NOT NULL DEFAULT uuid_generate_v4(),
        "productoId"       uuid          NOT NULL,
        "sucursalId"       integer       NOT NULL,
        "cantidadAnterior" numeric(10,3) NOT NULL,
        "cantidadNueva"    numeric(10,3) NOT NULL,
        "diferencia"       numeric(10,3) NOT NULL,
        "usuarioId"        uuid,
        "createdAt"        TIMESTAMP     NOT NULL DEFAULT now(),
        CONSTRAINT "PK_stock_historial" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`CREATE INDEX "IDX_stock_historial_sucursal"  ON "stock_historial" ("sucursalId")`);
    await queryRunner.query(`CREATE INDEX "IDX_stock_historial_createdAt" ON "stock_historial" ("createdAt")`);
    await queryRunner.query(`CREATE INDEX "IDX_stock_historial_producto"  ON "stock_historial" ("productoId")`);

    await queryRunner.query(`
      ALTER TABLE "stock_historial"
      ADD CONSTRAINT "FK_stock_historial_producto"
      FOREIGN KEY ("productoId") REFERENCES "productos"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Foreign keys
    await queryRunner.query(`ALTER TABLE "stock_historial" DROP CONSTRAINT "FK_stock_historial_producto"`);
    await queryRunner.query(`ALTER TABLE "stock"           DROP CONSTRAINT "FK_stock_producto"`);

    // Índices stock_historial
    await queryRunner.query(`DROP INDEX "IDX_stock_historial_producto"`);
    await queryRunner.query(`DROP INDEX "IDX_stock_historial_createdAt"`);
    await queryRunner.query(`DROP INDEX "IDX_stock_historial_sucursal"`);

    // Tablas
    await queryRunner.query(`DROP TABLE "stock_historial"`);

    await queryRunner.query(`DROP INDEX "IDX_stock_sucursalId"`);
    await queryRunner.query(`DROP TABLE "stock"`);

    await queryRunner.query(`DROP INDEX "IDX_productos_activo"`);
    await queryRunner.query(`DROP INDEX "IDX_productos_categoria"`);
    await queryRunner.query(`DROP TABLE "productos"`);

    // ENUMs
    await queryRunner.query(`DROP TYPE "productos_unidad_enum"`);
    await queryRunner.query(`DROP TYPE "productos_categoria_enum"`);
  }
}
