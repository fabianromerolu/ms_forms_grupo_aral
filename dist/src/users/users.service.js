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
exports.UsersService = exports.CreatePrivilegedUserDto = void 0;
const common_1 = require("@nestjs/common");
const bcrypt = __importStar(require("bcrypt"));
const class_validator_1 = require("class-validator");
const prisma_service_1 = require("../prisma/prisma.service");
const notifications_service_1 = require("../notifications/notifications.service");
const pagination_util_1 = require("../utils/pagination.util");
class CreatePrivilegedUserDto {
    fullName;
    email;
    role;
    regional;
    city;
    phone;
    document;
}
exports.CreatePrivilegedUserDto = CreatePrivilegedUserDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(3),
    __metadata("design:type", String)
], CreatePrivilegedUserDto.prototype, "fullName", void 0);
__decorate([
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], CreatePrivilegedUserDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(['COORDINADOR', 'SUPERVISOR']),
    __metadata("design:type", String)
], CreatePrivilegedUserDto.prototype, "role", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePrivilegedUserDto.prototype, "regional", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePrivilegedUserDto.prototype, "city", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePrivilegedUserDto.prototype, "phone", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePrivilegedUserDto.prototype, "document", void 0);
function generatePassword() {
    const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const lower = 'abcdefghjkmnpqrstuvwxyz';
    const digits = '23456789';
    const special = '!@#$&*';
    const all = upper + lower + digits + special;
    let password = upper[Math.floor(Math.random() * upper.length)] +
        lower[Math.floor(Math.random() * lower.length)] +
        digits[Math.floor(Math.random() * digits.length)] +
        special[Math.floor(Math.random() * special.length)];
    for (let i = 0; i < 6; i++) {
        password += all[Math.floor(Math.random() * all.length)];
    }
    return password
        .split('')
        .sort(() => Math.random() - 0.5)
        .join('');
}
const SELECT_SAFE = {
    id: true,
    fullName: true,
    email: true,
    role: true,
    status: true,
    document: true,
    phone: true,
    city: true,
    avatarUrl: true,
    createdAt: true,
    updatedAt: true,
};
let UsersService = class UsersService {
    prisma;
    notifier;
    constructor(prisma, notifier) {
        this.prisma = prisma;
        this.notifier = notifier;
    }
    async create(dto) {
        const exists = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });
        if (exists)
            throw new common_1.ConflictException('El email ya está registrado');
        const hashed = await bcrypt.hash(dto.password, 10);
        return this.prisma.user.create({
            data: {
                fullName: dto.fullName,
                email: dto.email,
                password: hashed,
                role: dto.role ?? 'OPERARIO',
                document: dto.document,
                phone: dto.phone,
                city: dto.city,
                avatarUrl: dto.avatarUrl,
            },
            select: SELECT_SAFE,
        });
    }
    async findAll(page = 1, limit_ = 20) {
        const limit = Math.min(limit_, 100);
        const skip = (page - 1) * limit;
        const [total, items] = await Promise.all([
            this.prisma.user.count(),
            this.prisma.user.findMany({
                skip,
                take: limit,
                select: SELECT_SAFE,
                orderBy: { createdAt: 'desc' },
            }),
        ]);
        return (0, pagination_util_1.paginateResponse)(items, total, page, limit);
    }
    async findOne(id) {
        const user = await this.prisma.user.findUnique({
            where: { id },
            select: SELECT_SAFE,
        });
        if (!user)
            throw new common_1.NotFoundException('Usuario no encontrado');
        return user;
    }
    async update(id, dto) {
        await this.findOne(id);
        const data = { ...dto };
        if (dto.password) {
            data['password'] = await bcrypt.hash(dto.password, 10);
        }
        return this.prisma.user.update({
            where: { id },
            data,
            select: SELECT_SAFE,
        });
    }
    async remove(id) {
        await this.findOne(id);
        return this.prisma.user.update({
            where: { id },
            data: { status: 'DISABLED' },
            select: SELECT_SAFE,
        });
    }
    async createPrivileged(dto) {
        const exists = await this.prisma.user.findUnique({ where: { email: dto.email } });
        if (exists)
            throw new common_1.ConflictException('El email ya está registrado');
        const plainPassword = generatePassword();
        const hashed = await bcrypt.hash(plainPassword, 10);
        const user = await this.prisma.user.create({
            data: {
                fullName: dto.fullName,
                email: dto.email,
                password: hashed,
                role: dto.role,
                regional: dto.regional,
                city: dto.city,
                phone: dto.phone,
                document: dto.document,
            },
            select: SELECT_SAFE,
        });
        void this.notifier
            .notifyUserCreated({ fullName: dto.fullName, email: dto.email, role: dto.role, password: plainPassword })
            .catch(() => { });
        return { ...user, generatedPassword: plainPassword };
    }
    async hardRemove(id) {
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user)
            throw new common_1.NotFoundException('Usuario no encontrado');
        if (user.role === 'ADMIN')
            throw new common_1.ForbiddenException('No se puede eliminar una cuenta administrador');
        await this.prisma.$transaction(async (tx) => {
            await tx.incidencia.updateMany({ where: { createdById: id }, data: { createdById: null } });
            await tx.incidencia.updateMany({ where: { updatedById: id }, data: { updatedById: null } });
            await tx.cotizacion.updateMany({ where: { createdById: id }, data: { createdById: null } });
            await tx.solicitud.updateMany({ where: { createdById: id }, data: { createdById: null } });
            await tx.report.updateMany({ where: { createdById: id }, data: { createdById: null } });
            await tx.actividad.updateMany({ where: { userId: id }, data: { userId: null } });
            await tx.user.delete({ where: { id } });
        });
        return { deleted: true, id };
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notifications_service_1.ReportNotificationsService])
], UsersService);
//# sourceMappingURL=users.service.js.map