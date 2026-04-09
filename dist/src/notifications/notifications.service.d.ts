import { AnyObj } from '../utils/notifications.utils';
import type { Incidencia } from '@prisma/client';
export declare class ReportNotificationsService {
    private readonly logger;
    private readonly resend;
    notifyReportCreated(report: AnyObj): Promise<void>;
    notifyIncidentCreated(incidencia: Incidencia): Promise<void>;
    notifyIncidentExpired(incidencia: Incidencia): Promise<void>;
}
