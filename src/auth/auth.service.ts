import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import type { StringValue } from 'ms';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    if (dto.email) {
      const exists = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });
      if (exists) {
        throw new ConflictException('El email ya está registrado');
      }
    }

    const hashed = await bcrypt.hash(dto.password, 10);

    // El registro público solo permite crear cuentas OPERARIO.
    // COORDINADOR y SUPERVISOR se crean desde el módulo de usuarios del admin.
    const user = await this.prisma.user.create({
      data: {
        fullName: dto.fullName,
        email: dto.email ?? null,
        password: hashed,
        role: 'OPERARIO',
        document: dto.document,
        phone: dto.phone,
        city: dto.city,
        regional: dto.regional,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        status: true,
        regional: true,
        createdAt: true,
      },
    });

    return user;
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    if (user.status === 'DISABLED') {
      throw new UnauthorizedException('Usuario deshabilitado');
    }

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const payload = { sub: user.id, email: user.email, role: user.role, regional: user.regional };
    const secret = this.config.get<string>('JWT_SECRET');
    if (!secret) {
      throw new Error('JWT_SECRET environment variable is not defined');
    }
    const expiresIn = this.config.get<string>('JWT_EXPIRES_IN') ?? '7d';

    const token = this.jwt.sign(payload, {
      secret,
      expiresIn: expiresIn as StringValue,
    });

    return {
      accessToken: token,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        status: user.status,
        avatarUrl: user.avatarUrl,
        regional: user.regional,
      },
    };
  }

  async me(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        status: true,
        document: true,
        phone: true,
        city: true,
        regional: true,
        avatarUrl: true,
        createdAt: true,
      },
    });
  }
}
