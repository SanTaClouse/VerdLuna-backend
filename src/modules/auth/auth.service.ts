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

    if (!user) {
      console.log(' 🔴 Login fallido: usuario no encontrado -', usuario);
      throw new UnauthorizedException('Usuario o contraseña incorrectos');
    }

    if (!user.activo) {
      console.log(' 🔴 Login fallido: usuario inactivo -', usuario);
      throw new UnauthorizedException('Usuario inactivo. Contacta al administrador.');
    }

    // Verificar password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      console.log(' 🔴 Login fallido: contraseña incorrecta -', usuario);
      throw new UnauthorizedException('Usuario o contraseña incorrectos');
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
    console.log(' 🟢 Login exitoso -', usuario);

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
