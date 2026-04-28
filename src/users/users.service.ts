import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { PrismaService } from '../prisma/prisma.service';
import { ReportNotificationsService } from '../notifications/notifications.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { paginateResponse } from '../utils/pagination.util';

export class CreatePrivilegedUserDto {
  @IsString()
  @MinLength(3)
  fullName: string;

  @IsEmail()
  email: string;

  @IsEnum(['COORDINADOR', 'SUPERVISOR'])
  role: 'COORDINADOR' | 'SUPERVISOR';

  @IsOptional()
  @IsString()
  regional?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  document?: string;
}

function generatePassword(): string {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghjkmnpqrstuvwxyz';
  const digits = '23456789';
  const special = '!@#$&*';
  const all = upper + lower + digits + special;

  let password =
    upper[Math.floor(Math.random() * upper.length)] +
    lower[Math.floor(Math.random() * lower.length)] +
    digits[Math.floor(Math.random() * digits.length)] +
    special[Math.floor(Math.random() * special.length)];

  for (let i = 0; i < 6; i++) {
    password += all[Math.floor(Math.random() * all.length)];
  }

  return password
    .split('')
    .sort(() => Math.random() - 0.5)
    .join('');
}

const SELECT_SAFE = {
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
  updatedAt: true,
};

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifier: ReportNotificationsService,
  ) {}

  async create(dto: CreateUserDto) {
    const exists = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (exists) throw new ConflictException('El email ya está registrado');

    const hashed = await bcrypt.hash(dto.password, 10);

    return this.prisma.user.create({
      data: {
        fullName: dto.fullName,
        email: dto.email,
        password: hashed,
        role: dto.role ?? 'OPERARIO',
        document: dto.document,
        phone: dto.phone,
        city: dto.city,
        avatarUrl: dto.avatarUrl,
      },
      select: SELECT_SAFE,
    });
  }

  async findAll(page = 1, limit_ = 20) {
    const limit = Math.min(limit_, 100);
    const skip = (page - 1) * limit;
    const [total, items] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.findMany({
        skip,
        take: limit,
        select: SELECT_SAFE,
        orderBy: { createdAt: 'desc' },
      }),
    ]);
    return paginateResponse(items, total, page, limit);
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: SELECT_SAFE,
    });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return user;
  }

  async update(id: string, dto: UpdateUserDto) {
    await this.findOne(id);

    const data: Record<string, unknown> = { ...dto };

    if (dto.password) {
      data['password'] = await bcrypt.hash(dto.password, 10);
    }

    return this.prisma.user.update({
      where: { id },
      data,
      select: SELECT_SAFE,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.user.update({
      where: { id },
      data: { status: 'DISABLED' },
      select: SELECT_SAFE,
    });
  }

  async createPrivileged(dto: CreatePrivilegedUserDto) {
    const exists = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (exists) throw new ConflictException('El email ya está registrado');

    const plainPassword = generatePassword();
    const hashed = await bcrypt.hash(plainPassword, 10);

    const user = await this.prisma.user.create({
      data: {
        fullName: dto.fullName,
        email: dto.email,
        password: hashed,
        role: dto.role,
        regional: dto.regional,
        city: dto.city,
        phone: dto.phone,
        document: dto.document,
      },
      select: SELECT_SAFE,
    });

    void this.notifier
      .notifyUserCreated({ fullName: dto.fullName, email: dto.email, role: dto.role, password: plainPassword })
      .catch(() => {});

    return { ...user, generatedPassword: plainPassword };
  }

  async hardRemove(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    if (user.role === 'ADMIN') throw new ForbiddenException('No se puede eliminar una cuenta administrador');

    await this.prisma.$transaction(async (tx) => {
      await tx.incidencia.updateMany({ where: { createdById: id }, data: { createdById: null } });
      await tx.incidencia.updateMany({ where: { updatedById: id }, data: { updatedById: null } });
      await tx.cotizacion.updateMany({ where: { createdById: id }, data: { createdById: null } });
      await tx.solicitud.updateMany({ where: { createdById: id }, data: { createdById: null } });
      await tx.report.updateMany({ where: { createdById: id }, data: { createdById: null } });
      await tx.actividad.updateMany({ where: { userId: id }, data: { userId: null } });
      await tx.user.delete({ where: { id } });
    });

    return { deleted: true, id };
  }
}
