import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Pedido } from '../../pedidos/entities/pedido.entity';

export enum UserRole {
  ADMIN = 'admin',
  VENDEDOR = 'vendedor',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({ description: 'ID único del usuario' })
  id: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  @Index()
  @ApiProperty({ description: 'Nombre de usuario único', example: 'admin' })
  usuario: string;

  @Column({ type: 'varchar', length: 255 })
  @ApiProperty({ description: 'Contraseña hasheada (bcrypt)' })
  password: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  @ApiProperty({ description: 'Nombre completo', example: 'Juan Pérez', required: false })
  nombre: string;

  @Column({ type: 'varchar', length: 100, unique: true, nullable: true })
  @Index()
  @ApiProperty({ description: 'Email del usuario', example: 'admin@laluna.com', required: false })
  email: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.VENDEDOR,
  })
  @ApiProperty({ enum: UserRole, description: 'Rol del usuario', example: UserRole.ADMIN })
  rol: UserRole;

  @Column({ type: 'boolean', default: true })
  @ApiProperty({ description: 'Indica si el usuario está activo', default: true })
  activo: boolean;

  @CreateDateColumn()
  @ApiProperty({ description: 'Fecha de creación del usuario' })
  createdAt: Date;

  @UpdateDateColumn()
  @ApiProperty({ description: 'Fecha de última actualización' })
  updatedAt: Date;

  // Relaciones
  @OneToMany(() => Pedido, (pedido) => pedido.creadoPor)
  pedidos: Pedido[];
}