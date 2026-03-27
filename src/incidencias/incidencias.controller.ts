import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '@prisma/client';
import { IncidenciasService } from './incidencias.service';
import { CreateIncidenciaDto } from './dto/create-incidencia.dto';
import { UpdateIncidenciaDto } from './dto/update-incidencia.dto';
import { ListIncidenciasQueryDto } from './dto/list-incidencias.query.dto';
import type { AuthRequest } from '../types/auth-request.type';

@ApiTags('incidencias')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.COORDINADOR)
@Controller('incidencias')
export class IncidenciasController {
  constructor(private readonly service: IncidenciasService) {}

  @Post()
  create(@Body() dto: CreateIncidenciaDto, @Request() req: AuthRequest) {
    return this.service.create(dto, req.user?.id);
  }

  @Get()
  @Roles(
    UserRole.ADMIN,
    UserRole.COORDINADOR,
    UserRole.OPERARIO,
    UserRole.SUPERVISOR,
  )
  findAll(@Query() q: ListIncidenciasQueryDto) {
    return this.service.findAll(q);
  }

  @Get('numero/:numero')
  @Roles(
    UserRole.ADMIN,
    UserRole.COORDINADOR,
    UserRole.OPERARIO,
    UserRole.SUPERVISOR,
  )
  findByNumber(@Param('numero') numero: string) {
    return this.service.findByNumber(numero);
  }

  @Get(':id')
  @Roles(
    UserRole.ADMIN,
    UserRole.COORDINADOR,
    UserRole.OPERARIO,
    UserRole.SUPERVISOR,
  )
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateIncidenciaDto,
    @Request() req: AuthRequest,
  ) {
    return this.service.update(id, dto, req.user?.id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Get(':id/history')
  @Roles(
    UserRole.ADMIN,
    UserRole.COORDINADOR,
    UserRole.OPERARIO,
    UserRole.SUPERVISOR,
  )
  getHistory(@Param('id') id: string) {
    return this.service.getHistory(id);
  }
}
