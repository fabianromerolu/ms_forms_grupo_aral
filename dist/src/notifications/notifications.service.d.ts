import { AnyObj } from '../utils/notifications.utils';
import type { Incidencia } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
export declare class ReportNotificationsService {
    private readonly prisma;
    private readonly logger;
    private readonly resend;
    constructor(prisma: PrismaService);
    private getStoreResponsibleEmails;
    notifyReportCreated(report: AnyObj): Promise<void>;
    notifyUserCreated(user: {
        fullName: string;
        email: string;
        role: string;
        password: string;
    }): Promise<void>;
    notifyIncidentCreated(incidencia: Incidencia): Promise<void>;
    notifyIncidentExpired(incidencia: Incidencia): Promise<void>;
}
