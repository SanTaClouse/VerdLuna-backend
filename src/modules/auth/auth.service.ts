import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) { }

  async login(loginDto: LoginDto) {
    const { usuario, password } = loginDto;

    // Buscar usuario
    const user = await this.usersService.findByUsuario(usuario);

    if (!user || !user.activo) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Verificar password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Generar JWT
    const payload = {
      sub: user.id,
      usuario: user.usuario,
      rol: user.rol,
    };

    const token = this.jwtService.sign(payload);

    // Eliminar password de la respuesta
    const { password: _, ...userWithoutPassword } = user;
    console.log(" 🟢Login exitoso desde el backend ! ");

    return {
      success: true,
      user: userWithoutPassword,
      token,
    };
  }

  async verify(userId: string) {
    const user = await this.usersService.findOne(userId);

    if (!user || !user.activo) {
      throw new UnauthorizedException('Usuario no autorizado');
    }

    const { password: _, ...userWithoutPassword } = user;

    return {
      success: true,
      user: userWithoutPassword,
    };
  }
}
