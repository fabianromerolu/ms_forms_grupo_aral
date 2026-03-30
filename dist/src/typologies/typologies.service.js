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
exports.TypologiesService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
let TypologiesService = class TypologiesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(dto) {
        const exists = await this.prisma.tipologia.findUnique({
            where: { code: dto.code },
        });
        if (exists)
            throw new common_1.ConflictException('El código de tipología ya existe');
        return this.prisma.tipologia.create({ data: dto });
    }
    async findAll(page = 1, limit = 50, q, category) {
        const skip = (page - 1) * limit;
        const where = { isActive: true };
        const and = [];
        if (category)
            and.push({
                category: { contains: category, mode: client_1.Prisma.QueryMode.insensitive },
            });
        if (q) {
            and.push({
                OR: [
                    { name: { contains: q, mode: client_1.Prisma.QueryMode.insensitive } },
                    { code: { contains: q, mode: client_1.Prisma.QueryMode.insensitive } },
                    { description: { contains: q, mode: client_1.Prisma.QueryMode.insensitive } },
                ],
            });
        }
        if (and.length > 0)
            where.AND = and;
        const [total, items] = await Promise.all([
            this.prisma.tipologia.count({ where }),
            this.prisma.tipologia.findMany({
                where,
                skip,
                take: limit,
                orderBy: { code: 'asc' },
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
        const item = await this.prisma.tipologia.findUnique({ where: { id } });
        if (!item)
            throw new common_1.NotFoundException('Tipología no encontrada');
        return item;
    }
    async update(id, dto) {
        await this.findOne(id);
        return this.prisma.tipologia.update({ where: { id }, data: dto });
    }
    async remove(id) {
        await this.findOne(id);
        return this.prisma.tipologia.update({
            where: { id },
            data: { isActive: false },
        });
    }
};
exports.TypologiesService = TypologiesService;
exports.TypologiesService = TypologiesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TypologiesService);
//# sourceMappingURL=typologies.service.js.map