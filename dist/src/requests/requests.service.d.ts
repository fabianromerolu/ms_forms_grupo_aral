import { PrismaService } from '../prisma/prisma.service';
import { CreateRequestDto } from './dto/create-request.dto';
import { UpdateRequestDto } from './dto/update-request.dto';
export declare class RequestsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(dto: CreateRequestDto, userId?: string): Promise<{
        number: string;
        id: string;
        city: string | null;
        status: import("@prisma/client").$Enums.SolicitudStatus;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        storeCode: string | null;
        storeName: string | null;
        searchText: string;
        createdById: string | null;
        description: string;
        priority: import("@prisma/client").$Enums.IncidenciaPriority;
        note: string | null;
        type: string | null;
        title: string;
        assignedTo: string | null;
        resolvedAt: Date | null;
    }>;
    findAll(page?: number, limit_?: number, q?: string, status?: string, priority?: string, regional?: string): Promise<import("../utils/pagination.util").PaginatedResponse<{
        createdBy: {
            id: string;
            email: string;
            fullName: string;
        } | null;
    } & {
        number: string;
        id: string;
        city: string | null;
        status: import("@prisma/client").$Enums.SolicitudStatus;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        storeCode: string | null;
        storeName: string | null;
        searchText: string;
        createdById: string | null;
        description: string;
        priority: import("@prisma/client").$Enums.IncidenciaPriority;
        note: string | null;
        type: string | null;
        title: string;
        assignedTo: string | null;
        resolvedAt: Date | null;
    }>>;
    findOne(id: string): Promise<{
        createdBy: {
            id: string;
            email: string;
            fullName: string;
        } | null;
    } & {
        number: string;
        id: string;
        city: string | null;
        status: import("@prisma/client").$Enums.SolicitudStatus;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        storeCode: string | null;
        storeName: string | null;
        searchText: string;
        createdById: string | null;
        description: string;
        priority: import("@prisma/client").$Enums.IncidenciaPriority;
        note: string | null;
        type: string | null;
        title: string;
        assignedTo: string | null;
        resolvedAt: Date | null;
    }>;
    update(id: string, dto: UpdateRequestDto): Promise<{
        number: string;
        id: string;
        city: string | null;
        status: import("@prisma/client").$Enums.SolicitudStatus;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        storeCode: string | null;
        storeName: string | null;
        searchText: string;
        createdById: string | null;
        description: string;
        priority: import("@prisma/client").$Enums.IncidenciaPriority;
        note: string | null;
        type: string | null;
        title: string;
        assignedTo: string | null;
        resolvedAt: Date | null;
    }>;
    remove(id: string): Promise<{
        number: string;
        id: string;
        city: string | null;
        status: import("@prisma/client").$Enums.SolicitudStatus;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        storeCode: string | null;
        storeName: string | null;
        searchText: string;
        createdById: string | null;
        description: string;
        priority: import("@prisma/client").$Enums.IncidenciaPriority;
        note: string | null;
        type: string | null;
        title: string;
        assignedTo: string | null;
        resolvedAt: Date | null;
    }>;
}
