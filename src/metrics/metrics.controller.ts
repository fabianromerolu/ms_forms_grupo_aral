import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '@prisma/client';
import { MetricsService } from './metrics.service';

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
  getOverview() {
    return this.service.getOverview();
  }

  @Get('incidencias/by-status')
  getIncidenciasByStatus() {
    return this.service.getIncidenciasByStatus();
  }

  @Get('incidencias/by-type')
  getIncidenciasByType() {
    return this.service.getIncidenciasByType();
  }

  @Get('solicitudes/by-status')
  getSolicitudesByStatus() {
    return this.service.getSolicitudesByStatus();
  }

  @Get('reports/by-type')
  getReportsByType() {
    return this.service.getReportsByType();
  }

  @Get('incidencias/by-regional')
  getIncidenciasByRegional() {
    return this.service.getIncidenciasByRegional();
  }

  @Get('time-series')
  @ApiQuery({
    name: 'days',
    required: false,
    description: 'Últimos N días (default 30)',
  })
  getTimeSeries(@Query('days') days?: string) {
    return this.service.getTimeSeries(Number(days) || 30);
  }

  @Get('store')
  @ApiQuery({ name: 'storeCode', required: true, description: 'Código de tienda' })
  @ApiQuery({ name: 'year', required: false, description: 'Año (default año actual)' })
  @ApiQuery({ name: 'month', required: false, description: 'Mes 1-12 (default mes actual)' })
  getStoreMetrics(
    @Query('storeCode') storeCode: string,
    @Query('year') year?: string,
    @Query('month') month?: string,
  ) {
    const now = new Date();
    return this.service.getStoreMetrics(
      storeCode,
      Number(year) || now.getFullYear(),
      Number(month) || now.getMonth() + 1,
    );
  }
}
