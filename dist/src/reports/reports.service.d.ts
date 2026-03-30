import { type Report } from '@prisma/client';
import { ReportNotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReportDto } from './dto/create-report.dto';
import { ListReportsQueryDto } from './dto/list-reports.query.dto';
import { FindAllResponse, SerializedReport } from 'src/utils/reports.utils';
export declare class ReportsService {
    private readonly prisma;
    private readonly notifier;
    private readonly logger;
    constructor(prisma: PrismaService, notifier: ReportNotificationsService);
    private toInputJsonObject;
    private normalizeJsonObject;
    private normalizeIncidencias;
    private normalizeSubTipos;
    private normalizeIncidenciasRemote;
    private firstRemoteValue;
    private mergeRemoteDescriptions;
    private assertTipoSubtipos;
    private buildSearchText;
    private buildPersistPayload;
    private serializeReport;
    private getErrorMessage;
    create(dto: CreateReportDto): Promise<SerializedReport<Report>>;
    findAll(q: ListReportsQueryDto): Promise<FindAllResponse>;
    findOne(id: string): Promise<SerializedReport<Report> | null>;
}
