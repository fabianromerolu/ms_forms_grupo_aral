import { UserRole } from '@prisma/client';
export declare class CreateUserDto {
    fullName: string;
    email: string;
    password: string;
    role?: UserRole;
    document?: string;
    phone?: string;
    city?: string;
    avatarUrl?: string;
}
