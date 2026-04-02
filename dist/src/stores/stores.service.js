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
exports.StoresService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
let StoresService = class StoresService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(dto, createdBy) {
        const exists = await this.prisma.tienda.findUnique({
            where: { storeCode: dto.storeCode },
        });
        if (exists)
            throw new common_1.ConflictException('El código de tienda ya existe');
        const tienda = await this.prisma.tienda.create({
            data: {
                storeCode: dto.storeCode,
                storeName: dto.storeName,
                address: dto.address,
                department: dto.department,
                city: dto.city,
                neighborhood: dto.neighborhood,
                phone: dto.phone,
                regional: dto.regional,
                typology: dto.typology,
                responsibleName: dto.responsibleName,
                responsiblePhone: dto.responsiblePhone,
                responsibleEmail: dto.responsibleEmail,
                labels: dto.labels?.length
                    ? { create: dto.labels.map((label) => ({ label })) }
                    : undefined,
            },
            include: { labels: true },
        });
        await this.prisma.tiendaHistoryEvent.create({
            data: {
                tiendaId: tienda.id,
                action: 'CREADA',
                by: createdBy,
            },
        });
        return tienda;
    }
    async findAll(page = 1, limit = 20, q, regional, city) {
        const skip = (page - 1) * limit;
        const where = { isActive: true };
        const and = [];
        if (regional)
            and.push({
                regional: { contains: regional, mode: client_1.Prisma.QueryMode.insensitive },
            });
        if (city)
            and.push({
                city: { contains: city, mode: client_1.Prisma.QueryMode.insensitive },
            });
        if (q) {
            and.push({
                OR: [
                    { storeName: { contains: q, mode: client_1.Prisma.QueryMode.insensitive } },
                    { storeCode: { contains: q, mode: client_1.Prisma.QueryMode.insensitive } },
                    { city: { contains: q, mode: client_1.Prisma.QueryMode.insensitive } },
                ],
            });
        }
        if (and.length > 0)
            where.AND = and;
        const [total, items] = await Promise.all([
            this.prisma.tienda.count({ where }),
            this.prisma.tienda.findMany({
                where,
                skip,
                take: limit,
                orderBy: { storeName: 'asc' },
                include: { labels: true },
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
    async findOne(id) {
        const item = await this.prisma.tienda.findUnique({
            where: { id },
            include: {
                labels: true,
                history: { orderBy: { createdAt: 'desc' }, take: 20 },
            },
        });
        if (!item)
            throw new common_1.NotFoundException('Tienda no encontrada');
        return item;
    }
    async findByCode(code) {
        const item = await this.prisma.tienda.findUnique({
            where: { storeCode: code },
            include: { labels: true },
        });
        if (!item)
            throw new common_1.NotFoundException('Tienda no encontrada');
        return item;
    }
    async update(id, dto, updatedBy) {
        await this.findOne(id);
        return this.prisma.$transaction(async (tx) => {
            if (dto.labels !== undefined) {
                await tx.tiendaLabel.deleteMany({ where: { tiendaId: id } });
            }
            const tienda = await tx.tienda.update({
                where: { id },
                data: {
                    ...(dto.storeName !== undefined && { storeName: dto.storeName }),
                    ...(dto.address !== undefined && { address: dto.address }),
                    ...(dto.department !== undefined && { department: dto.department }),
                    ...(dto.city !== undefined && { city: dto.city }),
                    ...(dto.neighborhood !== undefined && {
                        neighborhood: dto.neighborhood,
                    }),
                    ...(dto.phone !== undefined && { phone: dto.phone }),
                    ...(dto.regional !== undefined && { regional: dto.regional }),
                    ...(dto.typology !== undefined && { typology: dto.typology }),
                    ...(dto.responsibleName !== undefined && {
                        responsibleName: dto.responsibleName,
                    }),
                    ...(dto.responsiblePhone !== undefined && {
                        responsiblePhone: dto.responsiblePhone,
                    }),
                    ...(dto.responsibleEmail !== undefined && {
                        responsibleEmail: dto.responsibleEmail,
                    }),
                    ...(dto.isActive !== undefined && { isActive: dto.isActive }),
                    ...(dto.labels !== undefined && {
                        labels: {
                            create: dto.labels.map((label) => ({ label })),
                        },
                    }),
                },
                include: { labels: true },
            });
            await tx.tiendaHistoryEvent.create({
                data: {
                    tiendaId: id,
                    action: 'ACTUALIZADA',
                    by: updatedBy,
                    data: dto,
                },
            });
            return tienda;
        });
    }
    async remove(id) {
        await this.findOne(id);
        return this.prisma.tienda.update({
            where: { id },
            data: { isActive: false },
        });
    }
};
exports.StoresService = StoresService;
exports.StoresService = StoresService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], StoresService);
//# sourceMappingURL=stores.service.js.map