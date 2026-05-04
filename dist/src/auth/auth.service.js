"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const bcrypt = __importStar(require("bcrypt"));
const prisma_service_1 = require("../prisma/prisma.service");
function normalizeEmail(value) {
    const email = value?.trim().toLowerCase();
    return email || null;
}
function normalizePhoneDigits(value) {
    const digits = String(value ?? '').replace(/\D/g, '');
    return digits.startsWith('57') && digits.length === 12
        ? digits.slice(2)
        : digits;
}
let AuthService = class AuthService {
    prisma;
    jwt;
    config;
    constructor(prisma, jwt, config) {
        this.prisma = prisma;
        this.jwt = jwt;
        this.config = config;
    }
    async findUserByPhone(phone) {
        const phoneDigits = normalizePhoneDigits(phone);
        if (!phoneDigits)
            return null;
        const users = await this.prisma.user.findMany({
            where: { phone: { not: null } },
        });
        const matches = users.filter((user) => normalizePhoneDigits(user.phone) === phoneDigits);
        if (matches.length > 1) {
            throw new common_1.UnauthorizedException('Hay más de una cuenta con este teléfono. Contacta al administrador.');
        }
        return matches[0] ?? null;
    }
    async assertPhoneAvailable(phone) {
        const phoneDigits = normalizePhoneDigits(phone);
        if (!phoneDigits)
            return;
        const users = await this.prisma.user.findMany({
            where: { phone: { not: null } },
            select: { id: true, phone: true },
        });
        const exists = users.some((user) => normalizePhoneDigits(user.phone) === phoneDigits);
        if (exists) {
            throw new common_1.ConflictException('El teléfono ya está registrado');
        }
    }
    async register(dto) {
        const email = normalizeEmail(dto.email);
        const phone = dto.phone?.trim();
        if (!email && !phone) {
            throw new common_1.BadRequestException('Debes registrar un correo o un teléfono para iniciar sesión');
        }
        if (email) {
            const exists = await this.prisma.user.findUnique({
                where: { email },
            });
            if (exists) {
                throw new common_1.ConflictException('El email ya está registrado');
            }
        }
        await this.assertPhoneAvailable(phone);
        const hashed = await bcrypt.hash(dto.password, 10);
        const user = await this.prisma.user.create({
            data: {
                fullName: dto.fullName,
                email,
                password: hashed,
                role: 'OPERARIO',
                document: dto.document,
                phone,
                city: dto.city,
                regional: dto.regional,
            },
            select: {
                id: true,
                fullName: true,
                email: true,
                phone: true,
                role: true,
                status: true,
                regional: true,
                createdAt: true,
            },
        });
        return user;
    }
    async login(dto) {
        const identifier = (dto.identifier ?? dto.email ?? '').trim();
        if (!identifier) {
            throw new common_1.UnauthorizedException('Credenciales inválidas');
        }
        const email = normalizeEmail(identifier);
        const user = identifier.includes('@')
            ? await this.prisma.user.findUnique({
                where: { email: email ?? '' },
            })
            : await this.findUserByPhone(identifier);
        if (!user) {
            throw new common_1.UnauthorizedException('Credenciales inválidas');
        }
        if (user.status === 'DISABLED') {
            throw new common_1.UnauthorizedException('Usuario deshabilitado');
        }
        const valid = await bcrypt.compare(dto.password, user.password);
        if (!valid) {
            throw new common_1.UnauthorizedException('Credenciales inválidas');
        }
        const payload = {
            sub: user.id,
            email: user.email,
            phone: user.phone,
            role: user.role,
            regional: user.regional,
        };
        const secret = this.config.get('JWT_SECRET');
        if (!secret) {
            throw new Error('JWT_SECRET environment variable is not defined');
        }
        const expiresIn = this.config.get('JWT_EXPIRES_IN') ?? '7d';
        const token = this.jwt.sign(payload, {
            secret,
            expiresIn: expiresIn,
        });
        return {
            accessToken: token,
            user: {
                id: user.id,
                fullName: user.fullName,
                email: user.email,
                phone: user.phone,
                role: user.role,
                status: user.status,
                avatarUrl: user.avatarUrl,
                regional: user.regional,
            },
        };
    }
    async me(userId) {
        return this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                fullName: true,
                email: true,
                role: true,
                status: true,
                document: true,
                phone: true,
                city: true,
                regional: true,
                avatarUrl: true,
                createdAt: true,
            },
        });
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService,
        config_1.ConfigService])
], AuthService);
//# sourceMappingURL=auth.service.js.map