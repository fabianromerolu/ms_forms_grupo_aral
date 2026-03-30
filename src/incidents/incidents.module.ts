import { Module } from '@nestjs/common';
import { IncidentsController } from './incidents.controller';
import { IncidentsService } from './incidents.service';
import { IncidentsScheduler } from './incidents.scheduler';
import { ReportNotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [ReportNotificationsModule],
  controllers: [IncidentsController],
  providers: [IncidentsService, IncidentsScheduler],
  exports: [IncidentsService],
})
export class IncidentsModule {}
