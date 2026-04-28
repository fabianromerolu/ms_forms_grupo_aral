import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../prisma/prisma.service';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

type CachedUser = {
  id: string;
  email: string;
  fullName: string;
  role: string;
  status: string;
  regional: string | null;
};

// In-memory TTL cache — avoids one DB round-trip per authenticated request.
// Without this, 6 parallel API calls from the same user open 6 simultaneous
// DB connections just for auth validation, exhausting the connection pool.
const USER_CACHE_TTL_MS = 60_000; // 1 minute

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly cache = new Map<string, { user: CachedUser; expiresAt: number }>();

  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const secret = config.get<string>('JWT_SECRET');
    if (!secret) {
      throw new Error('JWT_SECRET environment variable is not defined');
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: JwtPayload): Promise<CachedUser> {
    const now = Date.now();
    const cached = this.cache.get(payload.sub);
    if (cached && cached.expiresAt > now) {
      return cached.user;
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        status: true,
        regional: true,
      },
    });

    if (!user || user.status === 'DISABLED') {
      this.cache.delete(payload.sub);
      throw new UnauthorizedException('Usuario inactivo o no encontrado');
    }

    this.cache.set(payload.sub, { user, expiresAt: now + USER_CACHE_TTL_MS });
    return user;
  }
}
