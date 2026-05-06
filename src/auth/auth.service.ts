import {
  BadRequestException,
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

function normalizeEmail(value?: string | null): string | null {
  const email = value?.trim().toLowerCase();
  return email || null;
}

function normalizePhoneDigits(value?: string | null): string {
  const digits = String(value ?? '').replace(/\D/g, '');
  return digits.startsWith('57') && digits.length === 12
    ? digits.slice(2)
    : digits;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  private async findUserByPhone(phone: string) {
    const phoneDigits = normalizePhoneDigits(phone);
    if (!phoneDigits) return null;

    const users = await this.prisma.user.findMany({
      where: { phone: { not: null } },
    });
    const matches = users.filter(
      (user) => normalizePhoneDigits(user.phone) === phoneDigits,
    );

    if (matches.length > 1) {
      throw new UnauthorizedException(
        'Hay más de una cuenta con este teléfono. Contacta al administrador.',
      );
    }

    return matches[0] ?? null;
  }

  private async assertPhoneAvailable(phone?: string | null) {
    const phoneDigits = normalizePhoneDigits(phone);
    if (!phoneDigits) return;

    const users = await this.prisma.user.findMany({
      where: { phone: { not: null } },
      select: { id: true, phone: true },
    });
    const exists = users.some(
      (user) => normalizePhoneDigits(user.phone) === phoneDigits,
    );

    if (exists) {
      throw new ConflictException('El teléfono ya está registrado');
    }
  }

  async register(dto: RegisterDto) {
    const email = normalizeEmail(dto.email);
    const phone = dto.phone?.trim();

    if (!email && !phone) {
      throw new BadRequestException(
        'Debes registrar un correo o un teléfono para iniciar sesión',
      );
    }

    if (email) {
      const exists = await this.prisma.user.findUnique({
        where: { email },
      });
      if (exists) {
        throw new ConflictException('El email ya está registrado');
      }
    }

    await this.assertPhoneAvailable(phone);

    const hashed = await bcrypt.hash(dto.password, 10);

    // El registro público solo permite crear cuentas OPERARIO.
    // COORDINADOR y SUPERVISOR se crean desde el módulo de usuarios del admin.
    const user = await this.prisma.user.create({
      data: {
        fullName: dto.fullName,
        email,
        password: hashed,
        role: 'OPERARIO',
        document: dto.document,
        phone,
        city: dto.city,
        regional: dto.regional,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        document: true,
        phone: true,
        city: true,
        role: true,
        status: true,
        regional: true,
        createdAt: true,
      },
    });

    return user;
  }

  async login(dto: LoginDto) {
    const identifier = (dto.identifier ?? dto.email ?? '').trim();
    if (!identifier) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const email = normalizeEmail(identifier);
    const user = identifier.includes('@')
      ? await this.prisma.user.findUnique({
          where: { email: email ?? '' },
        })
      : await this.findUserByPhone(identifier);

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

    const payload = {
      sub: user.id,
      email: user.email,
      phone: user.phone,
      role: user.role,
      regional: user.regional,
    };
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
        document: user.document,
        phone: user.phone,
        city: user.city,
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
