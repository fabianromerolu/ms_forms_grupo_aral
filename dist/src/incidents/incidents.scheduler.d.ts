import { PrismaService } from '../prisma/prisma.service';
import { ReportNotificationsService } from '../notifications/notifications.service';
export declare class IncidentsScheduler {
    private readonly prisma;
    private readonly notifier;
    private readonly logger;
    constructor(prisma: PrismaService, notifier: ReportNotificationsService);
    checkExpiredIncidents(): Promise<void>;
}
