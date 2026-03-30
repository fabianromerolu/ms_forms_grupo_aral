// src/auth/optional-jwt-auth.guard.ts
import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(
    err: any,
    user: any,
    info: any,
    context: ExecutionContext,
  ): any {
    const req = context.switchToHttp().getRequest<Request>();
    const authHeader = req.headers.authorization;

    // Si no mandó token, lo dejas pasar como anónimo
    if (!authHeader) {
      return null;
    }

    // Si mandó token pero está malo/inválido, sí rechazas
    if (err || info) {
      throw err || new UnauthorizedException('Token inválido');
    }

    return user;
  }
}
