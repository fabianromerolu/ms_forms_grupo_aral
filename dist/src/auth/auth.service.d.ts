import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
export declare class AuthService {
    private readonly prisma;
    private readonly jwt;
    private readonly config;
    constructor(prisma: PrismaService, jwt: JwtService, config: ConfigService);
    private findUserByPhone;
    private assertPhoneAvailable;
    register(dto: RegisterDto): Promise<{
        id: string;
        email: string | null;
        fullName: string;
        role: import("@prisma/client").$Enums.UserRole;
        document: string | null;
        phone: string | null;
        city: string | null;
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
            document: string | null;
            phone: string | null;
            city: string | null;
            role: import("@prisma/client").$Enums.UserRole;
            status: "ACTIVE";
            avatarUrl: string | null;
            regional: string | null;
        };
    }>;
    me(userId: string): Promise<{
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
