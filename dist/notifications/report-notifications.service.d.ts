type AnyObj = Record<string, any>;
export declare class ReportNotificationsService {
    private readonly logger;
    private readonly resend;
    notifyReportCreated(report: AnyObj): Promise<void>;
}
export {};
