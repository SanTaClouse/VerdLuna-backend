import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1600000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Crear extension para UUID
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // Crear ENUM types
    await queryRunner.query(`
      CREATE TYPE "users_rol_enum" AS ENUM('admin', 'vendedor')
    `);

    await queryRunner.query(`
      CREATE TYPE "clientes_estado_enum" AS ENUM('Activo', 'Inactivo')
    `);

    await queryRunner.query(`
      CREATE TYPE "pedidos_estado_enum" AS ENUM('Pago', 'Impago')
    `);

    // Crear tabla USERS
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "usuario" character varying(50) NOT NULL,
        "password" character varying(255) NOT NULL,
        "nombre" character varying(100),
        "email" character varying(100),
        "rol" "users_rol_enum" NOT NULL DEFAULT 'vendedor',
        "activo" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_users_usuario" UNIQUE ("usuario"),
        CONSTRAINT "UQ_users_email" UNIQUE ("email"),
        CONSTRAINT "PK_users" PRIMARY KEY ("id")
      )
    `);

    // Crear indices para users
    await queryRunner.query(`CREATE INDEX "IDX_users_usuario" ON "users" ("usuario")`);
    await queryRunner.query(`CREATE INDEX "IDX_users_email" ON "users" ("email")`);

    // Crear tabla CLIENTES
    await queryRunner.query(`
      CREATE TABLE "clientes" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "nombre" character varying(150) NOT NULL,
        "direccion" character varying(255) NOT NULL,
        "telefono" character varying(20) NOT NULL,
        "email" character varying(100),
        "descripcion" text,
        "estado" "clientes_estado_enum" NOT NULL DEFAULT 'Activo',
        "totalFacturado" numeric(10,2) NOT NULL DEFAULT 0,
        "cantidadPedidos" integer NOT NULL DEFAULT 0,
        "ultimoPedido" date,
        "fechaRegistro" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "isDeleted" boolean NOT NULL DEFAULT false,
        "fechaBaja" TIMESTAMP,
        CONSTRAINT "PK_clientes" PRIMARY KEY ("id")
      )
    `);

    // Crear indices para clientes
    await queryRunner.query(`CREATE INDEX "IDX_clientes_nombre" ON "clientes" ("nombre")`);
    await queryRunner.query(`CREATE INDEX "IDX_clientes_telefono" ON "clientes" ("telefono")`);
    await queryRunner.query(`CREATE INDEX "IDX_clientes_estado" ON "clientes" ("estado")`);

    // Crear tabla PEDIDOS
    await queryRunner.query(`
      CREATE TABLE "pedidos" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "clienteId" uuid NOT NULL,
        "descripcion" text NOT NULL,
        "precio" numeric(10,2) NOT NULL,
        "precioAbonado" numeric(10,2) NOT NULL DEFAULT 0,
        "estado" "pedidos_estado_enum" NOT NULL,
        "fecha" date NOT NULL,
        "creadoPorId" uuid,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_pedidos" PRIMARY KEY ("id"),
        CONSTRAINT "CHK_precioAbonado_menor_precio" CHECK ("precioAbonado" <= "precio")
      )
    `);

    // Crear indices para pedidos
    await queryRunner.query(`CREATE INDEX "IDX_pedidos_clienteId" ON "pedidos" ("clienteId")`);
    await queryRunner.query(`CREATE INDEX "IDX_pedidos_estado" ON "pedidos" ("estado")`);
    await queryRunner.query(`CREATE INDEX "IDX_pedidos_fecha" ON "pedidos" ("fecha")`);
    await queryRunner.query(`CREATE INDEX "IDX_pedidos_createdAt" ON "pedidos" ("createdAt")`);

    // Crear foreign keys para pedidos
    await queryRunner.query(`
      ALTER TABLE "pedidos"
      ADD CONSTRAINT "FK_pedidos_cliente"
      FOREIGN KEY ("clienteId")
      REFERENCES "clientes"("id")
      ON DELETE NO ACTION
      ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "pedidos"
      ADD CONSTRAINT "FK_pedidos_creadoPor"
      FOREIGN KEY ("creadoPorId")
      REFERENCES "users"("id")
      ON DELETE NO ACTION
      ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Eliminar foreign keys
    await queryRunner.query(`ALTER TABLE "pedidos" DROP CONSTRAINT "FK_pedidos_creadoPor"`);
    await queryRunner.query(`ALTER TABLE "pedidos" DROP CONSTRAINT "FK_pedidos_cliente"`);

    // Eliminar indices de pedidos
    await queryRunner.query(`DROP INDEX "IDX_pedidos_createdAt"`);
    await queryRunner.query(`DROP INDEX "IDX_pedidos_fecha"`);
    await queryRunner.query(`DROP INDEX "IDX_pedidos_estado"`);
    await queryRunner.query(`DROP INDEX "IDX_pedidos_clienteId"`);

    // Eliminar tabla pedidos
    await queryRunner.query(`DROP TABLE "pedidos"`);

    // Eliminar indices de clientes
    await queryRunner.query(`DROP INDEX "IDX_clientes_estado"`);
    await queryRunner.query(`DROP INDEX "IDX_clientes_telefono"`);
    await queryRunner.query(`DROP INDEX "IDX_clientes_nombre"`);

    // Eliminar tabla clientes
    await queryRunner.query(`DROP TABLE "clientes"`);

    // Eliminar indices de users
    await queryRunner.query(`DROP INDEX "IDX_users_email"`);
    await queryRunner.query(`DROP INDEX "IDX_users_usuario"`);

    // Eliminar tabla users
    await queryRunner.query(`DROP TABLE "users"`);

    // Eliminar ENUMs
    await queryRunner.query(`DROP TYPE "pedidos_estado_enum"`);
    await queryRunner.query(`DROP TYPE "clientes_estado_enum"`);
    await queryRunner.query(`DROP TYPE "users_rol_enum"`);
  }
}
