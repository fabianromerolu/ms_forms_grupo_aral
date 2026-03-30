// src/incidents/incidents.scheduler.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { ReportNotificationsService } from '../notifications/notifications.service';

@Injectable()
export class IncidentsScheduler {
  private readonly logger = new Logger(IncidentsScheduler.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifier: ReportNotificationsService,
  ) {}

  // Run every hour to check for newly-expired incidents and notify
  @Cron(CronExpression.EVERY_HOUR)
  async checkExpiredIncidents(): Promise<void> {
    const now = new Date();
    // Window: incidents that expired in the last hour (to avoid re-notifying)
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    const expired = await this.prisma.incidencia.findMany({
      where: {
        status: { notIn: ['CERRADA'] },
        isDisabled: false,
        expirationAt: { gte: oneHourAgo, lte: now },
      },
    });

    if (expired.length === 0) return;

    this.logger.log(`Found ${expired.length} newly-expired incident(s), notifying...`);

    for (const incidencia of expired) {
      try {
        await this.notifier.notifyIncidentExpired(incidencia);
      } catch (err) {
        this.logger.error(
          `Failed to notify expired incident ${incidencia.incidentNumber}: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }
  }
}
