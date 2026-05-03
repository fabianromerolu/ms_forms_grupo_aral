import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
export declare class AuthController {
    private readonly service;
    constructor(service: AuthService);
    register(dto: RegisterDto): Promise<{
        id: string;
        email: string | null;
        fullName: string;
        role: import("@prisma/client").$Enums.UserRole;
        regional: string | null;
        status: import("@prisma/client").$Enums.UserStatus;
        createdAt: Date;
    }>;
    login(dto: LoginDto): Promise<{
        accessToken: string;
        user: {
            id: string;
            fullName: string;
            email: string | null;
            role: import("@prisma/client").$Enums.UserRole;
            status: "ACTIVE";
            avatarUrl: string | null;
            regional: string | null;
        };
    }>;
    me(req: {
        user: {
            id: string;
        };
    }): Promise<{
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
    } | null>;
}
