import { PrismaService } from '../prisma/prisma.service';
import { ReportNotificationsService } from '../notifications/notifications.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
export declare class CreatePrivilegedUserDto {
    fullName: string;
    email: string;
    role: 'COORDINADOR' | 'SUPERVISOR';
    regional?: string;
    city?: string;
    phone?: string;
    document?: string;
}
export declare class UsersService {
    private readonly prisma;
    private readonly notifier;
    constructor(prisma: PrismaService, notifier: ReportNotificationsService);
    create(dto: CreateUserDto): Promise<{
        id: string;
        email: string | null;
        fullName: string;
        role: import("@prisma/client").$Enums.UserRole;
        document: string | null;
        phone: string | null;
        city: string | null;
        regional: string | null;
        status: import("@prisma/client").$Enums.UserStatus;
        avatarUrl: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    findAll(page?: number, limit_?: number): Promise<import("../utils/pagination.util").PaginatedResponse<{
        id: string;
        email: string | null;
        fullName: string;
        role: import("@prisma/client").$Enums.UserRole;
        document: string | null;
        phone: string | null;
        city: string | null;
        regional: string | null;
        status: import("@prisma/client").$Enums.UserStatus;
        avatarUrl: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>>;
    findOne(id: string): Promise<{
        id: string;
        email: string | null;
        fullName: string;
        role: import("@prisma/client").$Enums.UserRole;
        document: string | null;
        phone: string | null;
        city: string | null;
        regional: string | null;
        status: import("@prisma/client").$Enums.UserStatus;
        avatarUrl: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    update(id: string, dto: UpdateUserDto): Promise<{
        id: string;
        email: string | null;
        fullName: string;
        role: import("@prisma/client").$Enums.UserRole;
        document: string | null;
        phone: string | null;
        city: string | null;
        regional: string | null;
        status: import("@prisma/client").$Enums.UserStatus;
        avatarUrl: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    remove(id: string): Promise<{
        id: string;
        email: string | null;
        fullName: string;
        role: import("@prisma/client").$Enums.UserRole;
        document: string | null;
        phone: string | null;
        city: string | null;
        regional: string | null;
        status: import("@prisma/client").$Enums.UserStatus;
        avatarUrl: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    createPrivileged(dto: CreatePrivilegedUserDto): Promise<{
        generatedPassword: string;
        id: string;
        email: string | null;
        fullName: string;
        role: import("@prisma/client").$Enums.UserRole;
        document: string | null;
        phone: string | null;
        city: string | null;
        regional: string | null;
        status: import("@prisma/client").$Enums.UserStatus;
        avatarUrl: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    hardRemove(id: string): Promise<{
        deleted: boolean;
        id: string;
    }>;
}
