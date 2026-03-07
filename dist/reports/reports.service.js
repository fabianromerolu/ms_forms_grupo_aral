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
function uniqueStrings(values) {
    const out = [];
    const seen = new Set();
    for (const v of values) {
        const t = safeText(v);
        if (!t)
            continue;
        if (seen.has(t))
            continue;
        seen.add(t);
        out.push(t);
    }
    return out;
}
function uniqueEnums(values) {
    const out = [];
    const seen = new Set();
    for (const v of values) {
        if (!v)
            continue;
        if (seen.has(v))
            continue;
        seen.add(v);
        out.push(v);
    }
    return out;
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
    create_report_dto_1.MaintenanceSubTipo.CARRITOS_MERCADO,
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
    normalizeIncidencias(data) {
        const fromArray = Array.isArray(data.incidencias) ? data.incidencias : [];
        const fromSingle = safeText(data.incidencia);
        const splitSingle = fromSingle ? fromSingle.split(/[\n,;|]+/g) : [];
        return uniqueStrings([...fromArray, ...splitSingle]);
    }
    normalizeSubTipos(data) {
        const arr = Array.isArray(data.subTipos) ? data.subTipos : [];
        const one = data.subTipo ? [data.subTipo] : [];
        return uniqueEnums([...one, ...arr]);
    }
    normalizeIncidenciasRemote(dto) {
        if (Array.isArray(dto.incidenciasRemote)) {
            return dto.incidenciasRemote.map((x) => toJsonObject(x));
        }
        if (dto.incidenciaRemote && typeof dto.incidenciaRemote === 'object') {
            return [toJsonObject(dto.incidenciaRemote)];
        }
        return [];
    }
    firstRemoteValue(remotes, keys) {
        for (const item of remotes) {
            for (const key of keys) {
                const value = safeText(item?.[key]);
                if (value)
                    return value;
            }
        }
        return undefined;
    }
    mergeRemoteDescriptions(remotes) {
        const values = uniqueStrings(remotes.flatMap((item) => [
            item?.descripcionIncidencia,
            item?.descripcion,
            item?.detalle,
        ]));
        return values.length ? values.join(' | ') : undefined;
    }
    assertTipoSubtipos(tipo, subTipos) {
        if (!subTipos.length) {
            throw new common_1.BadRequestException('Debes enviar al menos una especialidad');
        }
        for (const subTipo of subTipos) {
            if (tipo === create_report_dto_1.MaintenanceTipo.PREVENTIVO && !PREVENTIVO_SUBTIPOS.has(subTipo)) {
                throw new common_1.BadRequestException(`subTipo inválido para PREVENTIVO: ${subTipo}`);
            }
            if (tipo === create_report_dto_1.MaintenanceTipo.CORRECTIVO && !CORRECTIVO_SUBTIPOS.has(subTipo)) {
                throw new common_1.BadRequestException(`subTipo inválido para CORRECTIVO: ${subTipo}`);
            }
        }
    }
    buildSearchText(args) {
        const { dto, incidencias, subTipos, derived, incidenciasRemote = [] } = args;
        const parts = [
            ...incidencias,
            dto.data.tienda,
            derived?.ciudadTienda ?? dto.data.ciudadTienda ?? '',
            derived?.departamentoTienda ?? dto.data.departamentoTienda ?? '',
            derived?.descripcionIncidencia ?? dto.data.descripcionIncidencia ?? '',
            dto.data.nombreTecnico,
            dto.data.cedulaTecnico,
            dto.data.telefonoTecnico,
            dto.data.tipo,
            ...subTipos,
            dto.observaciones ?? '',
            JSON.stringify(dto.extra ?? {}),
            dto.responsablePdfUrl ?? '',
            dto.responsable ? JSON.stringify(dto.responsable) : '',
            incidenciasRemote.length ? JSON.stringify(incidenciasRemote) : '',
        ];
        return parts
            .map((x) => safeText(x))
            .filter(Boolean)
            .join(' | ')
            .toLowerCase();
    }
    serializeReport(report) {
        if (!report)
            return report;
        return {
            ...report,
            incidencia: report.incidenciaPrincipal ?? report.incidencias?.[0] ?? null,
            subTipo: report.subTipoPrincipal ?? report.subTipos?.[0] ?? null,
            incidenciaRemote: Array.isArray(report.incidenciasRemote)
                ? (report.incidenciasRemote[0] ?? null)
                : (report.incidenciasRemote ?? null),
        };
    }
    async create(dto) {
        const clientCreatedAt = dto.createdAt ? safeDate(dto.createdAt) : undefined;
        const incidencias = this.normalizeIncidencias(dto.data);
        if (!incidencias.length) {
            throw new common_1.BadRequestException('Debes enviar al menos una incidencia');
        }
        const subTipos = this.normalizeSubTipos(dto.data);
        this.assertTipoSubtipos(dto.data.tipo, subTipos);
        const incidenciaPrincipal = incidencias[0];
        const subTipoPrincipal = subTipos[0];
        const incidenciasRemote = this.normalizeIncidenciasRemote(dto);
        const derivedDepartamento = firstNonEmpty(dto.data.departamentoTienda, this.firstRemoteValue(incidenciasRemote, ['departamentoTienda', 'departamento', 'dpto']));
        const derivedCiudad = firstNonEmpty(dto.data.ciudadTienda, this.firstRemoteValue(incidenciasRemote, ['ciudadTienda', 'ciudad', 'municipio']));
        const derivedDescripcion = firstNonEmpty(dto.data.descripcionIncidencia, this.mergeRemoteDescriptions(incidenciasRemote));
        const searchText = this.buildSearchText({
            dto,
            incidencias,
            subTipos,
            derived: {
                ciudadTienda: derivedCiudad,
                departamentoTienda: derivedDepartamento,
                descripcionIncidencia: derivedDescripcion,
            },
            incidenciasRemote,
        });
        const responsableJson = dto.responsable ? toJsonObject(dto.responsable) : undefined;
        const incidenciasRemoteJson = incidenciasRemote.length ? incidenciasRemote : undefined;
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
                incidenciaPrincipal,
                incidencias,
                tienda: dto.data.tienda,
                departamentoTienda: derivedDepartamento,
                ciudadTienda: derivedCiudad,
                descripcionIncidencia: derivedDescripcion,
                nombreTecnico: dto.data.nombreTecnico,
                cedulaTecnico: dto.data.cedulaTecnico,
                telefonoTecnico: dto.data.telefonoTecnico,
                tipo: dto.data.tipo,
                subTipoPrincipal,
                subTipos,
                observaciones: dto.observaciones,
                fotosAntes: dto.fotos?.antes ?? [],
                fotosDespues: dto.fotos?.despues ?? [],
                responsable: responsableJson,
                responsablePdfUrl: dto.responsablePdfUrl,
                incidenciasRemote: incidenciasRemoteJson,
                checklist: dto.checklist ?? undefined,
                extra: dto.extra ?? {},
                searchText,
            },
            update: {
                tecnicoIp: dto.tecnicoIp,
                clientCreatedAt,
                incidenciaPrincipal,
                incidencias,
                tienda: dto.data.tienda,
                departamentoTienda: derivedDepartamento,
                ciudadTienda: derivedCiudad,
                descripcionIncidencia: derivedDescripcion,
                nombreTecnico: dto.data.nombreTecnico,
                cedulaTecnico: dto.data.cedulaTecnico,
                telefonoTecnico: dto.data.telefonoTecnico,
                tipo: dto.data.tipo,
                subTipoPrincipal,
                subTipos,
                observaciones: dto.observaciones,
                fotosAntes: dto.fotos?.antes ?? [],
                fotosDespues: dto.fotos?.despues ?? [],
                responsable: responsableJson,
                responsablePdfUrl: dto.responsablePdfUrl,
                incidenciasRemote: incidenciasRemoteJson,
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
        return this.serializeReport(saved);
    }
    async findAll(q) {
        const page = q.page ?? 1;
        const limit = q.limit ?? 20;
        const skip = (page - 1) * limit;
        const from = safeDate(q.from);
        const to = safeDate(q.to);
        const andFilters = [];
        if (from || to) {
            const createdAt = {};
            if (from)
                createdAt.gte = from;
            if (to)
                createdAt.lte = to;
            andFilters.push({ createdAt });
        }
        if (q.tipo) {
            andFilters.push({ tipo: q.tipo });
        }
        if (q.subTipo) {
            andFilters.push({
                OR: [
                    { subTipoPrincipal: q.subTipo },
                    { subTipos: { has: q.subTipo } },
                ],
            });
        }
        if (q.incidencia) {
            andFilters.push({
                OR: [
                    { incidenciaPrincipal: { contains: q.incidencia, mode: 'insensitive' } },
                    { incidencias: { has: q.incidencia } },
                    { searchText: { contains: q.incidencia.toLowerCase() } },
                ],
            });
        }
        if (q.tienda) {
            andFilters.push({ tienda: { contains: q.tienda, mode: 'insensitive' } });
        }
        if (q.departamentoTienda) {
            andFilters.push({
                departamentoTienda: { contains: q.departamentoTienda, mode: 'insensitive' },
            });
        }
        if (q.ciudadTienda) {
            andFilters.push({
                ciudadTienda: { contains: q.ciudadTienda, mode: 'insensitive' },
            });
        }
        if (q.q) {
            andFilters.push({
                searchText: { contains: q.q.toLowerCase() },
            });
        }
        if (q.extraPath && (q.extraEquals || q.extraContains)) {
            const path = [q.extraPath];
            if (q.extraEquals) {
                andFilters.push({
                    extra: {
                        path,
                        equals: parseMaybeJsonValue(q.extraEquals),
                    },
                });
            }
            else if (q.extraContains) {
                andFilters.push({
                    extra: {
                        path,
                        string_contains: q.extraContains,
                    },
                });
            }
        }
        const where = andFilters.length ? { AND: andFilters } : {};
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
            items: items.map((item) => this.serializeReport(item)),
        };
    }
    async findOne(id) {
        const item = await this.prisma.report.findUnique({ where: { id } });
        return this.serializeReport(item);
    }
};
exports.ReportsService = ReportsService;
exports.ReportsService = ReportsService = ReportsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        report_notifications_service_1.ReportNotificationsService])
], ReportsService);
//# sourceMappingURL=reports.service.js.map