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
exports.RequestsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
const generate_number_util_1 = require("../utils/generate-number.util");
const search_text_util_1 = require("../utils/search-text.util");
const pagination_util_1 = require("../utils/pagination.util");
const access_scope_util_1 = require("../auth/access-scope.util");
let RequestsService = class RequestsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(dto, actor) {
        const userId = actor?.id;
        await (0, access_scope_util_1.assertStoreAllowed)(this.prisma, actor, { storeCode: dto.storeCode });
        const number = (0, generate_number_util_1.generateUniqueNumber)('SOL');
        const searchText = (0, search_text_util_1.buildSearchText)([
            dto.title,
            dto.description,
            dto.storeName,
            dto.city,
        ]);
        return this.prisma.solicitud.create({
            data: {
                number,
                title: dto.title,
                description: dto.description,
                priority: dto.priority ?? 'MEDIA',
                storeCode: dto.storeCode,
                storeName: dto.storeName,
                city: dto.city,
                type: dto.type,
                assignedTo: dto.assignedTo,
                createdById: userId,
                searchText,
            },
        });
    }
    async findAll(page = 1, limit_ = 20, q, status, priority, regional, actor) {
        const limit = Math.min(limit_, 100);
        const skip = (page - 1) * limit;
        const where = { isActive: true };
        const and = [];
        if (status)
            and.push({ status: status });
        if (priority)
            and.push({ priority: priority });
        if (q)
            and.push({ searchText: { contains: q.toLowerCase() } });
        if (regional) {
            const tiendas = await this.prisma.tienda.findMany({
                where: { regional: { contains: regional, mode: client_1.Prisma.QueryMode.insensitive } },
                select: { storeCode: true },
            });
            const codes = tiendas.map((t) => t.storeCode);
            and.push({ storeCode: codes.length > 0 ? { in: codes } : { equals: '__NO_MATCH__' } });
        }
        const scope = await (0, access_scope_util_1.scopedRequestWhere)(this.prisma, actor);
        if (scope)
            and.push(scope);
        if (and.length > 0)
            where.AND = and;
        const [total, items] = await Promise.all([
            this.prisma.solicitud.count({ where }),
            this.prisma.solicitud.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    createdBy: { select: { id: true, fullName: true, email: true } },
                },
            }),
        ]);
        return (0, pagination_util_1.paginateResponse)(items, total, page, limit);
    }
    async findOne(id, actor) {
        const scope = await (0, access_scope_util_1.scopedRequestWhere)(this.prisma, actor);
        const item = await this.prisma.solicitud.findFirst({
            where: {
                id,
                ...(scope ? { AND: [scope] } : {}),
            },
            include: {
                createdBy: { select: { id: true, fullName: true, email: true } },
            },
        });
        if (!item)
            throw new common_1.NotFoundException('Solicitud no encontrada');
        return item;
    }
    async update(id, dto, actor) {
        const current = await this.findOne(id, actor);
        if (dto.storeCode !== undefined) {
            await (0, access_scope_util_1.assertStoreAllowed)(this.prisma, actor, { storeCode: dto.storeCode });
        }
        const searchText = (0, search_text_util_1.buildSearchText)([
            dto.title ?? current.title,
            dto.description ?? current.description,
            dto.storeName ?? current.storeName,
            dto.city ?? current.city,
        ]);
        return this.prisma.solicitud.update({
            where: { id },
            data: {
                ...(dto.title !== undefined && { title: dto.title }),
                ...(dto.description !== undefined && { description: dto.description }),
                ...(dto.status !== undefined && { status: dto.status }),
                ...(dto.priority !== undefined && { priority: dto.priority }),
                ...(dto.storeCode !== undefined && { storeCode: dto.storeCode }),
                ...(dto.storeName !== undefined && { storeName: dto.storeName }),
                ...(dto.city !== undefined && { city: dto.city }),
                ...(dto.type !== undefined && { type: dto.type }),
                ...(dto.assignedTo !== undefined && { assignedTo: dto.assignedTo }),
                ...(dto.note !== undefined && { note: dto.note }),
                ...(dto.resolvedAt !== undefined && {
                    resolvedAt: new Date(dto.resolvedAt),
                }),
                ...(dto.status === 'APROBADA' ||
                    dto.status === 'RECHAZADA' ||
                    dto.status === 'OBSERVADA'
                    ? { resolvedAt: new Date() }
                    : {}),
                searchText,
            },
        });
    }
    async remove(id) {
        await this.findOne(id);
        return this.prisma.solicitud.update({
            where: { id },
            data: { isActive: false },
        });
    }
};
exports.RequestsService = RequestsService;
exports.RequestsService = RequestsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], RequestsService);
//# sourceMappingURL=requests.service.js.map