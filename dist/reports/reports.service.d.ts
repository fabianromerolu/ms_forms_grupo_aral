import { CreateReportDto } from './dto/create-report.dto';
import { ListReportsQueryDto } from './dto/list-reports.query.dto';
import { PrismaService } from '../prisma/prisma.service';
import { ReportNotificationsService } from '../notifications/report-notifications.service';
export declare class ReportsService {
    private readonly prisma;
    private readonly notifier;
    private readonly logger;
    constructor(prisma: PrismaService, notifier: ReportNotificationsService);
    private normalizeIncidencias;
    private normalizeSubTipos;
    private normalizeIncidenciasRemote;
    private firstRemoteValue;
    private mergeRemoteDescriptions;
    private assertTipoSubtipos;
    private buildSearchText;
    private serializeReport;
    create(dto: CreateReportDto): Promise<any>;
    findAll(q: ListReportsQueryDto): Promise<{
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            hasPrev: boolean;
            hasNext: boolean;
        };
        items: any[];
    }>;
    findOne(id: string): Promise<any>;
}
