import { PrismaService } from '../prisma/prisma.service';
import { UpdateCatalogActivityDto } from './dto/update-catalog-activity.dto';
export declare class CatalogActivitiesService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAll(page?: number, limit_?: number, q?: string, specialty?: string, chapter?: string): Promise<import("../utils/pagination.util").PaginatedResponse<{
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
}
