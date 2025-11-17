import { Pedido } from "src/modules/pedidos/entities/pedido.entity";
import { Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('clientes')
export class Cliente {
    @PrimaryGeneratedColumn('uuid')
    id: string;
    name: string; //El nombre del cliente
    email: string; //Email para confirmacion de pedidos
    direccion: string; //direccion para saber su ubicación
    telefono: string; //numero de contacto para acceder facilmente
    fechaRegistro: Date; //La fecha en que se registro el cliente 
    fechaBaja: Date; //SI se elimino el cliente, apaece true isDeleted y aca estar la fecha de baja
    isDeleted?: boolean; //Borrado logico
    cantidadPedidos: number; //Se va incrementando con cada pedido
    totallInvertido: float; //Se va acumulando con cada pedido
    pedidos: Pedido[]


}
