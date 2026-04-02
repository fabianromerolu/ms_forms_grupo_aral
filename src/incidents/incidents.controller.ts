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
import { IncidentsService } from './incidents.service';
import { CreateIncidentDto } from './dto/create-incident.dto';
import { UpdateIncidentDto } from './dto/update-incident.dto';
import { ListIncidentsQueryDto } from './dto/list-incidents.query.dto';
import type { AuthRequest } from '../types/auth-request.type';

@ApiTags('incidencias')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.COORDINADOR)
@Controller('incidencias')
export class IncidentsController {
  constructor(private readonly service: IncidentsService) {}

  @Post()
  create(@Body() dto: CreateIncidentDto, @Request() req: AuthRequest) {
    return this.service.create(dto, req.user?.id);
  }

  @Get()
  @Roles(
    UserRole.ADMIN,
    UserRole.COORDINADOR,
    UserRole.OPERARIO,
    UserRole.SUPERVISOR,
  )
  findAll(@Query() q: ListIncidentsQueryDto) {
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
    @Body() dto: UpdateIncidentDto,
    @Request() req: AuthRequest,
  ) {
    return this.service.update(id, dto, req.user?.id);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
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
