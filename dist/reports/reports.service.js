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
var ReportsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportsService = void 0;
const common_1 = require("@nestjs/common");
const create_report_dto_1 = require("./dto/create-report.dto");
const prisma_service_1 = require("../prisma/prisma.service");
const report_notifications_service_1 = require("../notifications/report-notifications.service");
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
    if (t === 'true')
        return true;
    if (t === 'false')
        return false;
    if (!Number.isNaN(Number(t)) && t !== '')
        return Number(t);
    return t;
}
function safeText(v) {
    if (v == null)
        return '';
    return typeof v === 'string' ? v.trim() : String(v).trim();
}
function firstNonEmpty(...vals) {
    for (const v of vals) {
        const t = safeText(v);
        if (t)
            return t;
    }
    return undefined;
}
const PREVENTIVO_SUBTIPOS = new Set([
    create_report_dto_1.MaintenanceSubTipo.CUBIERTA,
    create_report_dto_1.MaintenanceSubTipo.METALMECANICO_TIENDA,
    create_report_dto_1.MaintenanceSubTipo.PUERTA_AUTOMATICA,
    create_report_dto_1.MaintenanceSubTipo.PUNTOS_PAGO,
    create_report_dto_1.MaintenanceSubTipo.REDES_HIDROSANITARIAS,
    create_report_dto_1.MaintenanceSubTipo.REDES_ELECTRICAS,
    create_report_dto_1.MaintenanceSubTipo.ESTIBADOR,
    create_report_dto_1.MaintenanceSubTipo.CORTINA_ENROLLABLE,
]);
const CORRECTIVO_SUBTIPOS = new Set([
    create_report_dto_1.MaintenanceSubTipo.OBRA_CIVIL,
    create_report_dto_1.MaintenanceSubTipo.METALMECANICA,
    create_report_dto_1.MaintenanceSubTipo.ELECTRICA,
    create_report_dto_1.MaintenanceSubTipo.EQUIPOS_ESPECIALES,
]);
let ReportsService = ReportsService_1 = class ReportsService {
    prisma;
    notifier;
    logger = new common_1.Logger(ReportsService_1.name);
    constructor(prisma, notifier) {
        this.prisma = prisma;
        this.notifier = notifier;
    }
    assertTipoSubtipo(tipo, subTipo) {
        if (tipo === create_report_dto_1.MaintenanceTipo.PREVENTIVO && !PREVENTIVO_SUBTIPOS.has(subTipo)) {
            throw new common_1.BadRequestException(`subTipo inválido para PREVENTIVO: ${subTipo}`);
        }
        if (tipo === create_report_dto_1.MaintenanceTipo.CORRECTIVO && !CORRECTIVO_SUBTIPOS.has(subTipo)) {
            throw new common_1.BadRequestException(`subTipo inválido para CORRECTIVO: ${subTipo}`);
        }
    }
    buildSearchText(dto, derived) {
        const parts = [
            dto.data.incidencia,
            dto.data.tienda,
            derived?.ciudadTienda ?? dto.data.ciudadTienda ?? '',
            derived?.departamentoTienda ?? dto.data.departamentoTienda ?? '',
            derived?.descripcionIncidencia ?? dto.data.descripcionIncidencia ?? '',
            dto.data.nombreTecnico,
            dto.data.cedulaTecnico,
            dto.data.telefonoTecnico,
            dto.data.tipo,
            dto.data.subTipo,
            dto.observaciones ?? '',
            JSON.stringify(dto.extra ?? {}),
            dto.responsablePdfUrl ?? '',
            dto.responsable ? JSON.stringify(dto.responsable) : '',
        ];
        return parts
            .map((x) => safeText(x))
            .filter(Boolean)
            .join(' | ')
            .toLowerCase();
    }
    async create(dto) {
        const clientCreatedAt = dto.createdAt ? safeDate(dto.createdAt) : undefined;
        this.assertTipoSubtipo(dto.data.tipo, dto.data.subTipo);
        const derivedDepartamento = firstNonEmpty(dto.data.departamentoTienda, dto.incidenciaRemote?.departamentoTienda, dto.incidenciaRemote?.departamento, dto.incidenciaRemote?.dpto);
        const derivedCiudad = firstNonEmpty(dto.data.ciudadTienda, dto.incidenciaRemote?.ciudadTienda, dto.incidenciaRemote?.ciudad, dto.incidenciaRemote?.municipio);
        const derivedDescripcion = firstNonEmpty(dto.data.descripcionIncidencia, dto.incidenciaRemote?.descripcionIncidencia, dto.incidenciaRemote?.descripcion, dto.incidenciaRemote?.detalle);
        const searchText = this.buildSearchText(dto, {
            ciudadTienda: derivedCiudad,
            departamentoTienda: derivedDepartamento,
            descripcionIncidencia: derivedDescripcion,
        });
        const responsableJson = dto.responsable ? toJsonObject(dto.responsable) : undefined;
        const incidenciaRemoteJson = dto.incidenciaRemote ? toJsonObject(dto.incidenciaRemote) : undefined;
        const wantsPdfNotify = !!(dto.responsablePdfUrl && dto.responsablePdfUrl.trim());
        const prev = await this.prisma.report.findUnique({
            where: { id: dto.id },
            select: { id: true, responsablePdfUrl: true },
        });
        const shouldNotify = wantsPdfNotify && !prev?.responsablePdfUrl;
        const saved = await this.prisma.report.upsert({
            where: { id: dto.id },
            create: {
                id: dto.id,
                tecnicoIp: dto.tecnicoIp,
                clientCreatedAt,
                incidencia: dto.data.incidencia,
                tienda: dto.data.tienda,
                departamentoTienda: derivedDepartamento,
                ciudadTienda: derivedCiudad,
                descripcionIncidencia: derivedDescripcion,
                nombreTecnico: dto.data.nombreTecnico,
                cedulaTecnico: dto.data.cedulaTecnico,
                telefonoTecnico: dto.data.telefonoTecnico,
                tipo: dto.data.tipo,
                subTipo: dto.data.subTipo,
                observaciones: dto.observaciones,
                fotosAntes: dto.fotos?.antes ?? [],
                fotosDespues: dto.fotos?.despues ?? [],
                firmaTecnicoUrl: dto.firmaTecnicoUrl,
                firmaEncargadoUrl: dto.firmaEncargadoUrl,
                encargadoIp: dto.encargadoIp,
                encargadoSignedAt: dto.encargadoSignedAt ? safeDate(dto.encargadoSignedAt) : undefined,
                responsable: responsableJson,
                responsablePdfUrl: dto.responsablePdfUrl,
                incidenciaRemote: incidenciaRemoteJson,
                checklist: dto.checklist ?? undefined,
                extra: dto.extra ?? {},
                searchText,
            },
            update: {
                tecnicoIp: dto.tecnicoIp,
                clientCreatedAt,
                incidencia: dto.data.incidencia,
                tienda: dto.data.tienda,
                departamentoTienda: derivedDepartamento,
                ciudadTienda: derivedCiudad,
                descripcionIncidencia: derivedDescripcion,
                nombreTecnico: dto.data.nombreTecnico,
                cedulaTecnico: dto.data.cedulaTecnico,
                telefonoTecnico: dto.data.telefonoTecnico,
                tipo: dto.data.tipo,
                subTipo: dto.data.subTipo,
                observaciones: dto.observaciones,
                fotosAntes: dto.fotos?.antes ?? [],
                fotosDespues: dto.fotos?.despues ?? [],
                firmaTecnicoUrl: dto.firmaTecnicoUrl,
                firmaEncargadoUrl: dto.firmaEncargadoUrl,
                encargadoIp: dto.encargadoIp,
                encargadoSignedAt: dto.encargadoSignedAt ? safeDate(dto.encargadoSignedAt) : undefined,
                responsable: responsableJson,
                responsablePdfUrl: dto.responsablePdfUrl,
                incidenciaRemote: incidenciaRemoteJson,
                checklist: dto.checklist ?? undefined,
                extra: dto.extra ?? {},
                searchText,
            },
        });
        if (shouldNotify) {
            void this.notifier.notifyReportCreated(saved).catch((e) => {
                this.logger.error(`No se pudo notificar reporte: ${e?.message}`);
            });
        }
        return saved;
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
            where.incidencia = { contains: q.incidencia, mode: 'insensitive' };
        if (q.tienda)
            where.tienda = { contains: q.tienda, mode: 'insensitive' };
        if (q.departamentoTienda)
            where.departamentoTienda = { contains: q.departamentoTienda, mode: 'insensitive' };
        if (q.ciudadTienda)
            where.ciudadTienda = { contains: q.ciudadTienda, mode: 'insensitive' };
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
                orderBy: { createdAt: q.order ?? 'desc' },
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
                estado: 'FIRMADO_ENCARGADO',
            },
        });
    }
};
exports.ReportsService = ReportsService;
exports.ReportsService = ReportsService = ReportsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        report_notifications_service_1.ReportNotificationsService])
], ReportsService);
//# sourceMappingURL=reports.service.js.map