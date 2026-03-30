import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
export declare class UsersService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(dto: CreateUserDto): Promise<{
        id: string;
        email: string;
        fullName: string;
        role: import("@prisma/client").$Enums.UserRole;
        document: string | null;
        phone: string | null;
        city: string | null;
        status: import("@prisma/client").$Enums.UserStatus;
        avatarUrl: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    findAll(page?: number, limit_?: number): Promise<import("../utils/pagination.util").PaginatedResponse<{
        id: string;
        email: string;
        fullName: string;
        role: import("@prisma/client").$Enums.UserRole;
        document: string | null;
        phone: string | null;
        city: string | null;
        status: import("@prisma/client").$Enums.UserStatus;
        avatarUrl: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>>;
    findOne(id: string): Promise<{
        id: string;
        email: string;
        fullName: string;
        role: import("@prisma/client").$Enums.UserRole;
        document: string | null;
        phone: string | null;
        city: string | null;
        status: import("@prisma/client").$Enums.UserStatus;
        avatarUrl: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    update(id: string, dto: UpdateUserDto): Promise<{
        id: string;
        email: string;
        fullName: string;
        role: import("@prisma/client").$Enums.UserRole;
        document: string | null;
        phone: string | null;
        city: string | null;
        status: import("@prisma/client").$Enums.UserStatus;
        avatarUrl: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    remove(id: string): Promise<{
        id: string;
        email: string;
        fullName: string;
        role: import("@prisma/client").$Enums.UserRole;
        document: string | null;
        phone: string | null;
        city: string | null;
        status: import("@prisma/client").$Enums.UserStatus;
        avatarUrl: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
