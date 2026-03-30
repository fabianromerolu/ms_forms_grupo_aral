import { PrismaService } from '../prisma/prisma.service';
import { CreateTypologyDto } from './dto/create-typology.dto';
import { UpdateTypologyDto } from './dto/update-typology.dto';
export declare class TypologiesService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(dto: CreateTypologyDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        code: string;
        unit: string | null;
        isActive: boolean;
        description: string | null;
        unitPrice: number | null;
        category: string | null;
    }>;
    findAll(page?: number, limit?: number, q?: string, category?: string): Promise<{
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            hasPrev: boolean;
            hasNext: boolean;
        };
        items: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            code: string;
            unit: string | null;
            isActive: boolean;
            description: string | null;
            unitPrice: number | null;
            category: string | null;
        }[];
    }>;
    findOne(id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        code: string;
        unit: string | null;
        isActive: boolean;
        description: string | null;
        unitPrice: number | null;
        category: string | null;
    }>;
    update(id: string, dto: UpdateTypologyDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        code: string;
        unit: string | null;
        isActive: boolean;
        description: string | null;
        unitPrice: number | null;
        category: string | null;
    }>;
    remove(id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        code: string;
        unit: string | null;
        isActive: boolean;
        description: string | null;
        unitPrice: number | null;
        category: string | null;
    }>;
}
