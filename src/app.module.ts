import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { ReportsModule } from './reports/reports.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { IncidenciasModule } from './incidencias/incidencias.module';
import { CotizacionesModule } from './cotizaciones/cotizaciones.module';
import { SolicitudesModule } from './solicitudes/solicitudes.module';
import { TiendasModule } from './tiendas/tiendas.module';
import { TipologiasModule } from './tipologias/tipologias.module';
import { ActividadesModule } from './actividades/actividades.module';
import { MetricsModule } from './metrics/metrics.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    // Módulo original de reportes de campo
    ReportsModule,
    // Auth
    AuthModule,
    // Gestión
    UsersModule,
    IncidenciasModule,
    CotizacionesModule,
    SolicitudesModule,
    TiendasModule,
    TipologiasModule,
    ActividadesModule,
    MetricsModule,
  ],
})
export class AppModule {}
