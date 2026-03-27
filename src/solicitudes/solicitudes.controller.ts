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
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '@prisma/client';
import { SolicitudesService } from './solicitudes.service';
import { CreateSolicitudDto } from './dto/create-solicitud.dto';
import { UpdateSolicitudDto } from './dto/update-solicitud.dto';
import type { AuthRequest } from '../types/auth-request.type';

@ApiTags('solicitudes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.COORDINADOR)
@Controller('solicitudes')
export class SolicitudesController {
  constructor(private readonly service: SolicitudesService) {}

  @Post()
  create(@Body() dto: CreateSolicitudDto, @Request() req: AuthRequest) {
    return this.service.create(dto, req.user?.id);
  }

  @Get()
  @Roles(
    UserRole.ADMIN,
    UserRole.COORDINADOR,
    UserRole.OPERARIO,
    UserRole.SUPERVISOR,
  )
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'q', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'priority', required: false })
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('q') q?: string,
    @Query('status') status?: string,
    @Query('priority') priority?: string,
  ) {
    return this.service.findAll(
      Number(page) || 1,
      Number(limit) || 20,
      q,
      status,
      priority,
    );
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
  update(@Param('id') id: string, @Body() dto: UpdateSolicitudDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
