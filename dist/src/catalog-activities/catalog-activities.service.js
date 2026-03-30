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
exports.CatalogActivitiesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const pagination_util_1 = require("../utils/pagination.util");
let CatalogActivitiesService = class CatalogActivitiesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(page = 1, limit_ = 50, q, specialty, chapter) {
        const limit = Math.min(limit_, 200);
        const skip = (page - 1) * limit;
        const where = { isActive: true };
        const and = [];
        if (specialty)
            and.push({ specialty: { equals: specialty, mode: 'insensitive' } });
        if (chapter)
            and.push({ chapter: { equals: chapter, mode: 'insensitive' } });
        if (q)
            and.push({
                OR: [
                    { name: { contains: q, mode: 'insensitive' } },
                    { chapter: { contains: q, mode: 'insensitive' } },
                    { specialty: { contains: q, mode: 'insensitive' } },
                ],
            });
        if (and.length)
            where.AND = and;
        const [total, items] = await Promise.all([
            this.prisma.catalogActivity.count({ where }),
            this.prisma.catalogActivity.findMany({
                where,
                orderBy: [{ specialty: 'asc' }, { chapter: 'asc' }, { name: 'asc' }],
                skip,
                take: limit,
            }),
        ]);
        return (0, pagination_util_1.paginateResponse)(items, total, page, limit);
    }
    async findOne(id) {
        const item = await this.prisma.catalogActivity.findUnique({ where: { id } });
        if (!item)
            throw new common_1.NotFoundException('Actividad no encontrada');
        return item;
    }
    async getSpecialties() {
        const rows = await this.prisma.catalogActivity.groupBy({
            by: ['specialty'],
            where: { isActive: true },
            orderBy: { specialty: 'asc' },
        });
        return rows.map((r) => r.specialty);
    }
    async getChapters(specialty) {
        const where = { isActive: true };
        if (specialty)
            where.specialty = { equals: specialty, mode: 'insensitive' };
        const rows = await this.prisma.catalogActivity.groupBy({
            by: ['chapter'],
            where,
            orderBy: { chapter: 'asc' },
        });
        return rows.map((r) => r.chapter);
    }
    async update(id, dto) {
        await this.findOne(id);
        return this.prisma.catalogActivity.update({
            where: { id },
            data: {
                ...(dto.specialty !== undefined && { specialty: dto.specialty }),
                ...(dto.chapter !== undefined && { chapter: dto.chapter }),
                ...(dto.name !== undefined && { name: dto.name }),
                ...(dto.unit !== undefined && { unit: dto.unit }),
                ...(dto.brandRef !== undefined && { brandRef: dto.brandRef }),
                ...(dto.basePrice !== undefined && { basePrice: dto.basePrice }),
            },
        });
    }
};
exports.CatalogActivitiesService = CatalogActivitiesService;
exports.CatalogActivitiesService = CatalogActivitiesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CatalogActivitiesService);
//# sourceMappingURL=catalog-activities.service.js.map