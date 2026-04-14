import { UserRole } from '@prisma/client';
export declare class RegisterDto {
    fullName: string;
    email: string;
    password: string;
    role?: UserRole;
    document?: string;
    phone?: string;
    city?: string;
    regional?: string;
}
