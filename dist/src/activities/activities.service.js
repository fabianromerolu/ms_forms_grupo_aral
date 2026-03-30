"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActivitiesService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
let ActivitiesService = class ActivitiesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async log(dto) {
        return this.prisma.actividad.create({
            data: {
                userId: dto.userId,
                userName: dto.userName,
                userRole: dto.userRole,
                action: dto.action,
                entity: dto.entity,
                entityId: dto.entityId,
                detail: dto.detail,
                metadata: dto.metadata,
                ip: dto.ip,
            },
        });
    }
    async findAll(page = 1, limit = 30, userId, entity, action, from, to) {
        const skip = (page - 1) * limit;
        const where = {};
        const and = [];
        if (userId)
            and.push({ userId });
        if (entity)
            and.push({ entity });
        if (action)
            and.push({
                action: { contains: action, mode: client_1.Prisma.QueryMode.insensitive },
            });
        if (from || to) {
            const createdAt = {};
            if (from)
                createdAt.gte = new Date(from);
            if (to)
                createdAt.lte = new Date(to);
            and.push({ createdAt });
        }
        if (and.length > 0)
            where.AND = and;
        const [total, items] = await Promise.all([
            this.prisma.actividad.count({ where }),
            this.prisma.actividad.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    user: {
                        select: { id: true, fullName: true, email: true, role: true },
                    },
                },
            }),
        ]);
        const totalPages = Math.max(1, Math.ceil(total / limit));
        return {
            meta: {
                page,
                limit,
                total,
                totalPages,
                hasPrev: page > 1,
                hasNext: page < totalPages,
            },
            items,
        };
    }
};
exports.ActivitiesService = ActivitiesService;
exports.ActivitiesService = ActivitiesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ActivitiesService);
//# sourceMappingURL=activities.service.js.map