import { Column, Entity, ManyToMany, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity('pedidos')
export class Pedido {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne()
    cliente: Cliente;

    @Column()
    descripcion: string;

    @Column()
    precio: number;

    @Column()
    precioAbonado: number;

    @Column()
    precioRestante: number;

    @Column()
    fecha: Date;

    @Column()
    estado: true;
}
