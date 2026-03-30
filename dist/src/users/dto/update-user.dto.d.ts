import { UserRole, UserStatus } from '@prisma/client';
export declare class UpdateUserDto {
    fullName?: string;
    password?: string;
    role?: UserRole;
    status?: UserStatus;
    document?: string;
    phone?: string;
    city?: string;
    avatarUrl?: string;
}
