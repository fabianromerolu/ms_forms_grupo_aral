import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { ReportsModule } from './reports/reports.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { IncidentsModule } from './incidents/incidents.module';
import { QuotesModule } from './quotes/quotes.module';
import { RequestsModule } from './requests/requests.module';
import { StoresModule } from './stores/stores.module';
import { TypologiesModule } from './typologies/typologies.module';
import { ActivitiesModule } from './activities/activities.module';
import { CatalogActivitiesModule } from './catalog-activities/catalog-activities.module';
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
    IncidentsModule,
    QuotesModule,
    RequestsModule,
    StoresModule,
    TypologiesModule,
    ActivitiesModule,
    CatalogActivitiesModule,
    MetricsModule,
  ],
})
export class AppModule {}
