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
exports.ReportsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
function toJsonObject(v) {
    return JSON.parse(JSON.stringify(v));
}
function safeDate(s) {
    if (!s)
        return undefined;
    const d = new Date(s);
    if (Number.isNaN(d.getTime()))
        throw new common_1.BadRequestException(`Fecha inválida: ${s}`);
    return d;
}
function parseMaybeJsonValue(s) {
    const t = s.trim();
    if (t === "true")
        return true;
    if (t === "false")
        return false;
    if (!Number.isNaN(Number(t)) && t !== "")
        return Number(t);
    return t;
}
let ReportsService = class ReportsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    buildSearchText(dto) {
        const parts = [
            dto.data.incidencia,
            dto.data.tienda,
            dto.data.ciudadTienda,
            dto.data.departamentoTienda,
            dto.data.nombreTecnico,
            dto.data.cedulaTecnico,
            dto.data.telefonoTecnico,
            dto.data.tipo,
            dto.data.subTipo,
            dto.observaciones ?? "",
            JSON.stringify(dto.extra ?? {}),
        ];
        return parts.join(" | ").toLowerCase();
    }
    async create(dto) {
        const clientCreatedAt = dto.createdAt ? safeDate(dto.createdAt) : undefined;
        const searchText = this.buildSearchText(dto);
        return this.prisma.report.upsert({
            where: { id: dto.id },
            create: {
                id: dto.id,
                tecnicoIp: dto.tecnicoIp,
                clientCreatedAt,
                incidencia: dto.data.incidencia,
                departamentoTienda: dto.data.departamentoTienda,
                ciudadTienda: dto.data.ciudadTienda,
                tienda: dto.data.tienda,
                nombreTecnico: dto.data.nombreTecnico,
                cedulaTecnico: dto.data.cedulaTecnico,
                telefonoTecnico: dto.data.telefonoTecnico,
                tipo: dto.data.tipo,
                subTipo: dto.data.subTipo,
                observaciones: dto.observaciones,
                fotosAntes: dto.fotos.antes ?? [],
                fotosDespues: dto.fotos.despues ?? [],
                firmaTecnicoUrl: dto.firmaTecnicoUrl,
                firmaEncargadoUrl: dto.firmaEncargadoUrl,
                encargadoIp: dto.encargadoIp,
                encargadoSignedAt: dto.encargadoSignedAt ? safeDate(dto.encargadoSignedAt) : undefined,
                responsable: dto.responsable ? toJsonObject(dto.responsable) : undefined,
                checklist: dto.checklist ?? undefined,
                extra: dto.extra ?? {},
                searchText,
            },
            update: {
                tecnicoIp: dto.tecnicoIp,
                clientCreatedAt,
                incidencia: dto.data.incidencia,
                departamentoTienda: dto.data.departamentoTienda,
                ciudadTienda: dto.data.ciudadTienda,
                tienda: dto.data.tienda,
                nombreTecnico: dto.data.nombreTecnico,
                cedulaTecnico: dto.data.cedulaTecnico,
                telefonoTecnico: dto.data.telefonoTecnico,
                tipo: dto.data.tipo,
                subTipo: dto.data.subTipo,
                observaciones: dto.observaciones,
                fotosAntes: dto.fotos.antes ?? [],
                fotosDespues: dto.fotos.despues ?? [],
                firmaTecnicoUrl: dto.firmaTecnicoUrl,
                firmaEncargadoUrl: dto.firmaEncargadoUrl,
                encargadoIp: dto.encargadoIp,
                encargadoSignedAt: dto.encargadoSignedAt ? safeDate(dto.encargadoSignedAt) : undefined,
                responsable: dto.responsable ? toJsonObject(dto.responsable) : undefined,
                checklist: dto.checklist ?? undefined,
                extra: dto.extra ?? {},
                searchText,
            },
        });
    }
    async findAll(q) {
        const page = q.page ?? 1;
        const limit = q.limit ?? 20;
        const skip = (page - 1) * limit;
        const from = safeDate(q.from);
        const to = safeDate(q.to);
        const where = {};
        if (from || to) {
            where.createdAt = {};
            if (from)
                where.createdAt.gte = from;
            if (to)
                where.createdAt.lte = to;
        }
        if (q.tipo)
            where.tipo = q.tipo;
        if (q.subTipo)
            where.subTipo = q.subTipo;
        if (q.incidencia)
            where.incidencia = { contains: q.incidencia, mode: "insensitive" };
        if (q.tienda)
            where.tienda = { contains: q.tienda, mode: "insensitive" };
        if (q.departamentoTienda)
            where.departamentoTienda = { contains: q.departamentoTienda, mode: "insensitive" };
        if (q.ciudadTienda)
            where.ciudadTienda = { contains: q.ciudadTienda, mode: "insensitive" };
        if (q.q) {
            where.searchText = { contains: q.q.toLowerCase() };
        }
        if (q.extraPath && (q.extraEquals || q.extraContains)) {
            const path = [q.extraPath];
            if (q.extraEquals) {
                where.extra = {
                    path,
                    equals: parseMaybeJsonValue(q.extraEquals),
                };
            }
            else if (q.extraContains) {
                where.extra = {
                    path,
                    string_contains: q.extraContains,
                };
            }
        }
        const [total, items] = await Promise.all([
            this.prisma.report.count({ where }),
            this.prisma.report.findMany({
                where,
                orderBy: { createdAt: q.order ?? "desc" },
                skip,
                take: limit,
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
        return this.prisma.report.findUnique({ where: { id } });
    }
    async updateEncargadoSignature(id, dto) {
        return this.prisma.report.update({
            where: { id },
            data: {
                firmaEncargadoUrl: dto.firmaEncargadoUrl,
                encargadoIp: dto.encargadoIp,
                encargadoSignedAt: dto.encargadoSignedAt ? safeDate(dto.encargadoSignedAt) : new Date(),
                estado: "FIRMADO_ENCARGADO",
            },
        });
    }
};
exports.ReportsService = ReportsService;
exports.ReportsService = ReportsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ReportsService);
//# sourceMappingURL=reports.service.js.map