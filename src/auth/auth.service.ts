import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto) {
    const user = await this.usersService.findByUsername(loginDto.username);

    if (!user || user.password !== loginDto.password) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const payload = { sub: user.id, username: user.username, role: user.role };

    return {
      message: 'Inicio de sesión exitoso',
      access_token: await this.jwtService.signAsync(payload),
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
    };
  }

  async logout() {
    // In a stateless JWT architecture, the client should just discard the token.
    // To properly invalidate it on the backend, a blacklist or short-lived tokens with refresh tokens are used.
    return { message: 'Cierre de sesión exitoso' };
  }
}
