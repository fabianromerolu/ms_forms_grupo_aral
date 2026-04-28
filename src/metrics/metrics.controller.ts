import { Controller, Get, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '@prisma/client';
import { MetricsService } from './metrics.service';
import type { AuthRequest } from '../types/auth-request.type';

@ApiTags('metrics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(
  UserRole.ADMIN,
  UserRole.COORDINADOR,
  UserRole.OPERARIO,
  UserRole.SUPERVISOR,
)
@Controller('metrics')
export class MetricsController {
  constructor(private readonly service: MetricsService) {}

  @Get('overview')
  @ApiQuery({ name: 'from', required: false, description: 'Filtrar reportes desde esta fecha ISO (opcional)' })
  getOverview(@Query('from') from?: string, @Request() req?: AuthRequest) {
    return this.service.getOverview(from, req?.user ?? null);
  }

  @Get('incidencias/by-status')
  getIncidenciasByStatus(@Request() req?: AuthRequest) {
    return this.service.getIncidenciasByStatus(req?.user ?? null);
  }

  @Get('incidencias/by-type')
  getIncidenciasByType(@Request() req?: AuthRequest) {
    return this.service.getIncidenciasByType(req?.user ?? null);
  }

  @Get('solicitudes/by-status')
  getSolicitudesByStatus(@Request() req?: AuthRequest) {
    return this.service.getSolicitudesByStatus(req?.user ?? null);
  }

  @Get('reports/by-type')
  @ApiQuery({ name: 'from', required: false, description: 'Filtrar desde esta fecha ISO (opcional)' })
  getReportsByType(@Query('from') from?: string, @Request() req?: AuthRequest) {
    return this.service.getReportsByType(from, req?.user ?? null);
  }

  @Get('incidencias/by-regional')
  getIncidenciasByRegional(@Request() req?: AuthRequest) {
    return this.service.getIncidenciasByRegional(req?.user ?? null);
  }

  @Get('time-series')
  @ApiQuery({ name: 'days', required: false, description: 'Últimos N días (default 30)' })
  @ApiQuery({ name: 'from', required: false, description: 'Piso mínimo de fecha ISO para reportes (opcional)' })
  getTimeSeries(
    @Query('days') days?: string,
    @Query('from') from?: string,
    @Request() req?: AuthRequest,
  ) {
    return this.service.getTimeSeries(
      Number(days) || 30,
      from,
      req?.user ?? null,
    );
  }

  @Get('store')
  @ApiQuery({ name: 'storeCode', required: true, description: 'Código de tienda' })
  @ApiQuery({ name: 'year', required: false, description: 'Año (default año actual)' })
  @ApiQuery({ name: 'month', required: false, description: 'Mes 1-12 (default mes actual)' })
  getStoreMetrics(
    @Query('storeCode') storeCode: string,
    @Query('year') year?: string,
    @Query('month') month?: string,
    @Request() req?: AuthRequest,
  ) {
    const now = new Date();
    return this.service.getStoreMetrics(
      storeCode,
      Number(year) || now.getFullYear(),
      Number(month) || now.getMonth() + 1,
      req?.user ?? null,
    );
  }

  @Get('regional')
  @ApiQuery({ name: 'regional', required: true, description: 'Nombre de la regional' })
  @ApiQuery({ name: 'year', required: false, description: 'Año (default año actual)' })
  @ApiQuery({ name: 'month', required: false, description: 'Mes 1-12 (default mes actual)' })
  getRegionalMetrics(
    @Query('regional') regional: string,
    @Query('year') year?: string,
    @Query('month') month?: string,
    @Request() req?: AuthRequest,
  ) {
    const now = new Date();
    return this.service.getRegionalMetrics(
      regional,
      Number(year) || now.getFullYear(),
      Number(month) || now.getMonth() + 1,
      req?.user ?? null,
    );
  }
}
