import { CatalogActivitiesService } from './catalog-activities.service';
import { ListCatalogActivitiesQueryDto } from './dto/list-catalog-activities.query.dto';
import { UpdateCatalogActivityDto } from './dto/update-catalog-activity.dto';
export declare class CatalogActivitiesController {
    private readonly service;
    constructor(service: CatalogActivitiesService);
    findAll(q: ListCatalogActivitiesQueryDto): Promise<import("../utils/pagination.util").PaginatedResponse<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        code: string;
        specialty: string;
        chapter: string;
        unit: string | null;
        brandRef: string | null;
        basePrice: number | null;
        isActive: boolean;
    }>>;
    getSpecialties(): Promise<string[]>;
    getChapters(specialty?: string): Promise<string[]>;
    update(id: string, dto: UpdateCatalogActivityDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        code: string;
        specialty: string;
        chapter: string;
        unit: string | null;
        brandRef: string | null;
        basePrice: number | null;
        isActive: boolean;
    }>;
    findOne(id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        code: string;
        specialty: string;
        chapter: string;
        unit: string | null;
        brandRef: string | null;
        basePrice: number | null;
        isActive: boolean;
    }>;
}
