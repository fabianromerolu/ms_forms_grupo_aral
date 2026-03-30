import { AnyObj } from 'src/utils/notifications.utils';
export declare class ReportNotificationsService {
    private readonly logger;
    private readonly resend;
    notifyReportCreated(report: AnyObj): Promise<void>;
}
