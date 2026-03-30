import { ActivitiesService } from './activities.service';
export declare class ActivitiesController {
    private readonly service;
    constructor(service: ActivitiesService);
    findAll(page?: string, limit?: string, userId?: string, entity?: string, action?: string, from?: string, to?: string): Promise<{
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
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
            ip: string | null;
            userId: string | null;
        })[];
    }>;
}
