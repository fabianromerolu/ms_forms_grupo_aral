import { Module } from '@nestjs/common';
import { CatalogActivitiesController } from './catalog-activities.controller';
import { CatalogActivitiesService } from './catalog-activities.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CatalogActivitiesController],
  providers: [CatalogActivitiesService],
  exports: [CatalogActivitiesService],
})
export class CatalogActivitiesModule {}
