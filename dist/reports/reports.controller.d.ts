import { ReportsService } from "./reports.service";
import { CreateReportDto } from "./dto/create-report.dto";
import { ListReportsQueryDto } from "./dto/list-reports.query.dto";
export declare class ReportsController {
    private readonly service;
    constructor(service: ReportsService);
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
