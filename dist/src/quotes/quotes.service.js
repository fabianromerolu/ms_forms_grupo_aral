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
exports.QuotesService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
const generate_number_util_1 = require("../utils/generate-number.util");
const pagination_util_1 = require("../utils/pagination.util");
let QuotesService = class QuotesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    calcTotal(items) {
        return items.reduce((acc, item) => {
            const subtotal = item.quantity * item.unitPrice;
            return acc + (item.hasIva ? subtotal * 1.19 : subtotal);
        }, 0);
    }
    async create(dto, userId) {
        const number = (0, generate_number_util_1.generateUniqueNumber)('COT');
        const items = dto.items ?? [];
        const totalAmount = this.calcTotal(items.map((i) => ({
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            hasIva: i.hasIva ?? false,
        })));
        return this.prisma.cotizacion.create({
            data: {
                number,
                format: dto.format ?? 'COTIZACION',
                specialty: dto.specialty,
                storeCode: dto.storeCode,
                storeName: dto.storeName,
                storeCity: dto.storeCity,
                typology: dto.typology,
                maintenanceType: dto.maintenanceType,
                note: dto.note,
                invoiceMode: dto.invoiceMode ?? 'IVA',
                aiuAdministration: dto.aiuAdministration ?? 0,
                aiuUnexpected: dto.aiuUnexpected ?? 0,
                aiuUtility: dto.aiuUtility ?? 0,
                aiuIva: dto.aiuIva ?? 0,
                quoteDocumentUrl: dto.quoteDocumentUrl,
                quoteDocumentName: dto.quoteDocumentName,
                totalAmount,
                createdById: userId,
                items: {
                    create: items.map((item, idx) => ({
                        tipologiaId: item.tipologiaId,
                        activityCode: item.activityCode,
                        description: item.description,
                        unit: item.unit,
                        quantity: item.quantity,
                        unitPrice: item.unitPrice,
                        hasIva: item.hasIva ?? false,
                        reference: item.reference,
                        subtotal: item.quantity * item.unitPrice,
                        order: item.order ?? idx,
                    })),
                },
                incidencias: dto.incidenciaIds?.length
                    ? {
                        create: dto.incidenciaIds.map((incId) => ({
                            incidencia: { connect: { id: incId } },
                        })),
                    }
                    : undefined,
            },
            include: {
                items: { orderBy: { order: 'asc' } },
                incidencias: { include: { incidencia: true } },
            },
        });
    }
    async findAll(page = 1, limit_ = 20, q, format) {
        const limit = Math.min(limit_, 100);
        const skip = (page - 1) * limit;
        const where = {};
        if (format)
            where.format = format;
        if (q) {
            where.OR = [
                { number: { contains: q, mode: client_1.Prisma.QueryMode.insensitive } },
                { storeName: { contains: q, mode: client_1.Prisma.QueryMode.insensitive } },
                { specialty: { contains: q, mode: client_1.Prisma.QueryMode.insensitive } },
            ];
        }
        const [total, items] = await Promise.all([
            this.prisma.cotizacion.count({ where }),
            this.prisma.cotizacion.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    items: { orderBy: { order: 'asc' } },
                    incidencias: {
                        include: {
                            incidencia: {
                                select: { id: true, incidentNumber: true, storeName: true },
                            },
                        },
                    },
                },
            }),
        ]);
        return (0, pagination_util_1.paginateResponse)(items, total, page, limit);
    }
    async findOne(id) {
        const item = await this.prisma.cotizacion.findUnique({
            where: { id },
            include: {
                items: { orderBy: { order: 'asc' } },
                incidencias: { include: { incidencia: true } },
            },
        });
        if (!item)
            throw new common_1.NotFoundException('Cotización no encontrada');
        return item;
    }
    async update(id, dto, userId) {
        await this.findOne(id);
        const items = dto.items ?? [];
        const totalAmount = items.length > 0
            ? this.calcTotal(items.map((i) => ({
                quantity: i.quantity ?? 0,
                unitPrice: i.unitPrice ?? 0,
                hasIva: i.hasIva ?? false,
            })))
            : undefined;
        return this.prisma.$transaction(async (tx) => {
            if (dto.items !== undefined) {
                await tx.cotizacionItem.deleteMany({ where: { cotizacionId: id } });
            }
            if (dto.incidenciaIds !== undefined) {
                await tx.cotizacionIncidencia.deleteMany({
                    where: { cotizacionId: id },
                });
            }
            return tx.cotizacion.update({
                where: { id },
                data: {
                    ...(dto.format !== undefined && { format: dto.format }),
                    ...(dto.specialty !== undefined && { specialty: dto.specialty }),
                    ...(dto.storeCode !== undefined && { storeCode: dto.storeCode }),
                    ...(dto.storeName !== undefined && { storeName: dto.storeName }),
                    ...(dto.storeCity !== undefined && { storeCity: dto.storeCity }),
                    ...(dto.typology !== undefined && { typology: dto.typology }),
                    ...(dto.maintenanceType !== undefined && {
                        maintenanceType: dto.maintenanceType,
                    }),
                    ...(dto.note !== undefined && { note: dto.note }),
                    ...(dto.invoiceMode !== undefined && {
                        invoiceMode: dto.invoiceMode,
                    }),
                    ...(dto.aiuAdministration !== undefined && {
                        aiuAdministration: dto.aiuAdministration,
                    }),
                    ...(dto.aiuUnexpected !== undefined && {
                        aiuUnexpected: dto.aiuUnexpected,
                    }),
                    ...(dto.aiuUtility !== undefined && { aiuUtility: dto.aiuUtility }),
                    ...(dto.aiuIva !== undefined && { aiuIva: dto.aiuIva }),
                    ...(dto.quoteDocumentUrl !== undefined && {
                        quoteDocumentUrl: dto.quoteDocumentUrl,
                    }),
                    ...(dto.quoteDocumentName !== undefined && {
                        quoteDocumentName: dto.quoteDocumentName,
                    }),
                    ...(totalAmount !== undefined && { totalAmount }),
                    ...(dto.items !== undefined && {
                        items: {
                            create: dto.items.map((item, idx) => ({
                                tipologiaId: item.tipologiaId,
                                activityCode: item.activityCode,
                                description: item.description ?? '',
                                unit: item.unit,
                                quantity: item.quantity ?? 1,
                                unitPrice: item.unitPrice ?? 0,
                                hasIva: item.hasIva ?? false,
                                reference: item.reference,
                                subtotal: (item.quantity ?? 1) * (item.unitPrice ?? 0),
                                order: item.order ?? idx,
                            })),
                        },
                    }),
                    ...(dto.incidenciaIds !== undefined && {
                        incidencias: {
                            create: dto.incidenciaIds.map((incId) => ({
                                incidencia: { connect: { id: incId } },
                            })),
                        },
                    }),
                },
                include: {
                    items: { orderBy: { order: 'asc' } },
                    incidencias: { include: { incidencia: true } },
                },
            });
        });
    }
    async remove(id) {
        await this.findOne(id);
        return this.prisma.cotizacion.delete({ where: { id } });
    }
};
exports.QuotesService = QuotesService;
exports.QuotesService = QuotesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], QuotesService);
//# sourceMappingURL=quotes.service.js.map