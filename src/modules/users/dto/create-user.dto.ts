import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  Length,
  MinLength,
  IsEmail,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { UserRole } from '../entities/user.entity';

export class CreateUserDto {
  @ApiProperty({ example: 'admin' })
  @IsNotEmpty()
  @IsString()
  @Length(3, 50)
  usuario: string;

  @ApiProperty({ example: 'admin123' })
  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'Administrador', required: false })
  @IsOptional()
  @IsString()
  nombre?: string;

  @ApiProperty({ example: 'admin@laluna.com', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ enum: UserRole, default: UserRole.VENDEDOR })
  @IsOptional()
  @IsEnum(UserRole)
  rol?: UserRole;
}
