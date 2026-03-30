import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
export interface CreateActivityDto {
    userId?: string;
    userName?: string;
    userRole?: string;
    action: string;
    entity?: string;
    entityId?: string;
    detail?: string;
    metadata?: Record<string, unknown>;
    ip?: string;
}
export declare class ActivitiesService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    log(dto: CreateActivityDto): Promise<{
        id: string;
        createdAt: Date;
        action: string;
        userName: string | null;
        userRole: string | null;
        entity: string | null;
        entityId: string | null;
        detail: string | null;
        metadata: Prisma.JsonValue | null;
        ip: string | null;
        userId: string | null;
    }>;
    findAll(page?: number, limit?: number, userId?: string, entity?: string, action?: string, from?: string, to?: string): Promise<{
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            hasPrev: boolean;
            hasNext: boolean;
        };
        items: ({
            user: {
                id: string;
                email: string;
                fullName: string;
                role: import("@prisma/client").$Enums.UserRole;
            } | null;
        } & {
            id: string;
            createdAt: Date;
            action: string;
            userName: string | null;
            userRole: string | null;
            entity: string | null;
            entityId: string | null;
            detail: string | null;
            metadata: Prisma.JsonValue | null;
            ip: string | null;
            userId: string | null;
        })[];
    }>;
}
