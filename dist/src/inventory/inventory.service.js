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
exports.InventoryService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
const pagination_util_1 = require("../utils/pagination.util");
const access_scope_util_1 = require("../auth/access-scope.util");
let InventoryService = class InventoryService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    assertAdmin(actor) {
        if (actor?.role !== 'ADMIN') {
            throw new common_1.ForbiddenException('Solo el administrador puede modificar inventario');
        }
    }
    assertRegionalAllowed(regional, actor) {
        if ((0, access_scope_util_1.isRegionalScopedActor)(actor) && !(0, access_scope_util_1.regionalMatches)(regional, actor)) {
            throw new common_1.ForbiddenException('No puedes consultar inventario de otra regional');
        }
    }
    async create(dto, actor) {
        this.assertAdmin(actor);
        return this.prisma.inventoryItem.create({
            data: {
                name: dto.name,
                regional: dto.regional,
                brand: dto.brand,
                value: dto.value,
                purchaseDate: dto.purchaseDate ? new Date(dto.purchaseDate) : undefined,
                photoUrl: dto.photoUrl,
                description: dto.description,
                createdById: actor?.id,
                updatedById: actor?.id,
            },
        });
    }
    async findAll(q, actor) {
        const page = Number(q.page) || 1;
        const limit = Math.min(Number(q.limit) || 20, 100);
        const skip = (page - 1) * limit;
        const where = { isActive: true };
        const and = [];
        if (q.regional?.trim()) {
            this.assertRegionalAllowed(q.regional, actor);
            and.push({ regional: (0, access_scope_util_1.regionalContains)(q.regional.trim()) });
        }
        else if ((0, access_scope_util_1.isRegionalScopedActor)(actor)) {
            if (!actor.regional?.trim()) {
                and.push({ id: '00000000-0000-0000-0000-000000000000' });
            }
            else {
                and.push({ regional: (0, access_scope_util_1.regionalContains)(actor.regional.trim()) });
            }
        }
        if (q.q?.trim()) {
            const query = q.q.trim();
            and.push({
                OR: [
                    { name: { contains: query, mode: client_1.Prisma.QueryMode.insensitive } },
                    { brand: { contains: query, mode: client_1.Prisma.QueryMode.insensitive } },
                    { regional: { contains: query, mode: client_1.Prisma.QueryMode.insensitive } },
                    { description: { contains: query, mode: client_1.Prisma.QueryMode.insensitive } },
                ],
            });
        }
        if (and.length)
            where.AND = and;
        const [total, items] = await Promise.all([
            this.prisma.inventoryItem.count({ where }),
            this.prisma.inventoryItem.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: q.order ?? 'desc' },
            }),
        ]);
        return (0, pagination_util_1.paginateResponse)(items, total, page, limit);
    }
    async findOne(id, actor) {
        const item = await this.prisma.inventoryItem.findFirst({
            where: { id, isActive: true },
        });
        if (!item)
            throw new common_1.NotFoundException('Elemento de inventario no encontrado');
        this.assertRegionalAllowed(item.regional, actor);
        return item;
    }
    async update(id, dto, actor) {
        this.assertAdmin(actor);
        await this.findOne(id, actor);
        return this.prisma.inventoryItem.update({
            where: { id },
            data: {
                ...(dto.name !== undefined && { name: dto.name }),
                ...(dto.regional !== undefined && { regional: dto.regional }),
                ...(dto.brand !== undefined && { brand: dto.brand }),
                ...(dto.value !== undefined && { value: dto.value }),
                ...(dto.purchaseDate !== undefined && {
                    purchaseDate: dto.purchaseDate ? new Date(dto.purchaseDate) : null,
                }),
                ...(dto.photoUrl !== undefined && { photoUrl: dto.photoUrl }),
                ...(dto.description !== undefined && { description: dto.description }),
                ...(dto.isActive !== undefined && { isActive: dto.isActive }),
                updatedById: actor?.id,
            },
        });
    }
    async remove(id, actor) {
        this.assertAdmin(actor);
        await this.findOne(id, actor);
        return this.prisma.inventoryItem.update({
            where: { id },
            data: { isActive: false, updatedById: actor?.id },
        });
    }
};
exports.InventoryService = InventoryService;
exports.InventoryService = InventoryService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], InventoryService);
//# sourceMappingURL=inventory.service.js.map