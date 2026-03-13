import { Module } from '@nestjs/common';
import { ReportNotificationsService } from './notifications.service';

@Module({
  providers: [ReportNotificationsService],
  exports: [ReportNotificationsService],
})
export class ReportNotificationsModule {}
