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
const client_1 = require("@prisma/client");
const common_1 = require("@nestjs/common");
const notifications_service_1 = require("../notifications/notifications.service");
const prisma_service_1 = require("../prisma/prisma.service");
const create_report_dto_1 = require("./dto/create-report.dto");
const pagination_util_1 = require("../utils/pagination.util");
const reports_utils_1 = require("../utils/reports.utils");
let ReportsService = ReportsService_1 = class ReportsService {
    prisma;
    notifier;
    logger = new common_1.Logger(ReportsService_1.name);
    constructor(prisma, notifier) {
        this.prisma = prisma;
        this.notifier = notifier;
    }
    toInputJsonObject(value) {
        return (0, reports_utils_1.toJsonObject)(value);
    }
    normalizeJsonObject(value) {
        if (typeof value !== 'object' || value === null || Array.isArray(value)) {
            return undefined;
        }
        return this.toInputJsonObject(value);
    }
    normalizeIncidencias(data) {
        const fromArray = Array.isArray(data.incidencias) ? data.incidencias : [];
        const fromSingle = (0, reports_utils_1.safeText)(data.incidencia);
        const splitSingle = fromSingle ? fromSingle.split(/[\n,;|]+/g) : [];
        return (0, reports_utils_1.uniqueStrings)([...fromArray, ...splitSingle]);
    }
    normalizeSubTipos(data) {
        const arr = Array.isArray(data.subTipos) ? data.subTipos : [];
        const one = data.subTipo ? [data.subTipo] : [];
        return (0, reports_utils_1.uniqueEnums)([...one, ...arr]);
    }
    normalizeIncidenciasRemote(dto) {
        if (Array.isArray(dto.incidenciasRemote)) {
            return dto.incidenciasRemote
                .filter((item) => typeof item === 'object' && item !== null && !Array.isArray(item))
                .map((item) => this.toInputJsonObject(item));
        }
        if (typeof dto.incidenciaRemote === 'object' &&
            dto.incidenciaRemote !== null &&
            !Array.isArray(dto.incidenciaRemote)) {
            return [this.toInputJsonObject(dto.incidenciaRemote)];
        }
        return [];
    }
    firstRemoteValue(remotes, keys) {
        for (const item of remotes) {
            for (const key of keys) {
                const value = (0, reports_utils_1.safeText)(item[key]);
                if (value) {
                    return value;
                }
            }
        }
        return undefined;
    }
    mergeRemoteDescriptions(remotes) {
        const values = (0, reports_utils_1.uniqueStrings)(remotes
            .flatMap((item) => [
            (0, reports_utils_1.safeText)(item.descripcionIncidencia),
            (0, reports_utils_1.safeText)(item.descripcion),
            (0, reports_utils_1.safeText)(item.detalle),
        ])
            .filter(Boolean));
        return values.length > 0 ? values.join(' | ') : undefined;
    }
    assertTipoSubtipos(tipo, subTipos) {
        if (subTipos.length === 0) {
            throw new common_1.BadRequestException('Debes enviar al menos una especialidad');
        }
        for (const subTipo of subTipos) {
            if (tipo === create_report_dto_1.MaintenanceTipo.PREVENTIVO &&
                !reports_utils_1.PREVENTIVO_SUBTIPOS.has(subTipo)) {
                throw new common_1.BadRequestException(`subTipo inválido para PREVENTIVO: ${subTipo}`);
            }
            if (tipo === create_report_dto_1.MaintenanceTipo.CORRECTIVO &&
                !reports_utils_1.CORRECTIVO_SUBTIPOS.has(subTipo)) {
                throw new common_1.BadRequestException(`subTipo inválido para CORRECTIVO: ${subTipo}`);
            }
        }
    }
    buildSearchText(args) {
        const { dto, incidencias, subTipos, derived, incidenciasRemote = [], } = args;
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
            incidenciasRemote.length > 0 ? JSON.stringify(incidenciasRemote) : '',
        ];
        return parts
            .map((value) => (0, reports_utils_1.safeText)(value))
            .filter(Boolean)
            .join(' | ')
            .toLowerCase();
    }
    buildPersistPayload({ dto, clientCreatedAt, incidenciaPrincipal, incidencias, derivedCiudad, derivedDepartamento, derivedDescripcion, responsableJson, incidenciasRemoteJson, searchText, subTipoPrincipal, subTipos, }) {
        return {
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
            checklist: this.normalizeJsonObject(dto.checklist),
            extra: this.normalizeJsonObject(dto.extra) ?? {},
            searchText,
        };
    }
    serializeReport(report) {
        if (!report) {
            return null;
        }
        const incidencia = report.incidenciaPrincipal ?? report.incidencias[0] ?? null;
        const subTipo = report.subTipoPrincipal ?? report.subTipos[0] ?? null;
        const incidenciaRemote = Array.isArray(report.incidenciasRemote)
            ? (report.incidenciasRemote[0] ?? null)
            : (report.incidenciasRemote ?? null);
        return {
            ...report,
            incidencia,
            subTipo,
            incidenciaRemote,
            report,
        };
    }
    getErrorMessage(error) {
        if (error instanceof Error) {
            return error.message;
        }
        return (0, reports_utils_1.safeText)(error) || 'Error desconocido';
    }
    async create(dto) {
        const clientCreatedAt = dto.createdAt ? (0, reports_utils_1.safeDate)(dto.createdAt) : undefined;
        const incidencias = this.normalizeIncidencias(dto.data);
        if (incidencias.length === 0) {
            throw new common_1.BadRequestException('Debes enviar al menos una incidencia');
        }
        const subTipos = this.normalizeSubTipos(dto.data);
        this.assertTipoSubtipos(dto.data.tipo, subTipos);
        const incidenciaPrincipal = incidencias[0];
        const subTipoPrincipal = subTipos[0];
        const incidenciasRemote = this.normalizeIncidenciasRemote(dto);
        const derivedDepartamento = (0, reports_utils_1.firstNonEmpty)(dto.data.departamentoTienda, this.firstRemoteValue(incidenciasRemote, [
            'departamentoTienda',
            'departamento',
            'dpto',
        ]));
        const derivedCiudad = (0, reports_utils_1.firstNonEmpty)(dto.data.ciudadTienda, this.firstRemoteValue(incidenciasRemote, [
            'ciudadTienda',
            'ciudad',
            'municipio',
        ]));
        const derivedDescripcion = (0, reports_utils_1.firstNonEmpty)(dto.data.descripcionIncidencia, this.mergeRemoteDescriptions(incidenciasRemote));
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
        const responsableJson = this.normalizeJsonObject(dto.responsable);
        const incidenciasRemoteJson = incidenciasRemote.length > 0 ? incidenciasRemote : undefined;
        const wantsPdfNotify = Boolean(dto.responsablePdfUrl?.trim());
        const prev = await this.prisma.report.findUnique({
            where: { id: dto.id },
            select: { id: true, responsablePdfUrl: true },
        });
        const shouldNotify = wantsPdfNotify && !prev?.responsablePdfUrl;
        const persistPayload = this.buildPersistPayload({
            dto,
            clientCreatedAt,
            incidenciaPrincipal,
            incidencias,
            derivedCiudad,
            derivedDepartamento,
            derivedDescripcion,
            responsableJson,
            incidenciasRemoteJson,
            searchText,
            subTipoPrincipal,
            subTipos,
        });
        const saved = await this.prisma.report.upsert({
            where: { id: dto.id },
            create: {
                id: dto.id,
                ...persistPayload,
            },
            update: persistPayload,
        });
        if (shouldNotify) {
            void this.notifier.notifyReportCreated(saved).catch((error) => {
                this.logger.error(`No se pudo notificar reporte: ${this.getErrorMessage(error)}`);
            });
        }
        return this.serializeReport(saved);
    }
    async findAll(q) {
        const page = q.page ?? 1;
        const limit = Math.min(q.limit ?? 20, 100);
        const skip = (page - 1) * limit;
        const from = (0, reports_utils_1.safeDate)(q.from);
        const to = (0, reports_utils_1.safeDate)(q.to);
        const andFilters = [];
        if (from || to) {
            const createdAt = {};
            if (from) {
                createdAt.gte = from;
            }
            if (to) {
                createdAt.lte = to;
            }
            andFilters.push({ createdAt });
        }
        if (q.tipo) {
            andFilters.push({ tipo: q.tipo });
        }
        if (q.subTipo) {
            andFilters.push({
                OR: [{ subTipoPrincipal: q.subTipo }, { subTipos: { has: q.subTipo } }],
            });
        }
        if (q.incidencia) {
            andFilters.push({
                OR: [
                    {
                        incidenciaPrincipal: {
                            contains: q.incidencia,
                            mode: client_1.Prisma.QueryMode.insensitive,
                        },
                    },
                    { incidencias: { has: q.incidencia } },
                    { searchText: { contains: q.incidencia.toLowerCase() } },
                ],
            });
        }
        if (q.tienda) {
            andFilters.push({
                tienda: {
                    contains: q.tienda,
                    mode: client_1.Prisma.QueryMode.insensitive,
                },
            });
        }
        if (q.departamentoTienda) {
            andFilters.push({
                departamentoTienda: {
                    contains: q.departamentoTienda,
                    mode: client_1.Prisma.QueryMode.insensitive,
                },
            });
        }
        if (q.ciudadTienda) {
            andFilters.push({
                ciudadTienda: {
                    contains: q.ciudadTienda,
                    mode: client_1.Prisma.QueryMode.insensitive,
                },
            });
        }
        if (q.q) {
            andFilters.push({
                searchText: {
                    contains: q.q.toLowerCase(),
                },
            });
        }
        if (q.extraPath && (q.extraEquals || q.extraContains)) {
            const path = [q.extraPath];
            if (q.extraEquals) {
                andFilters.push({
                    extra: {
                        path,
                        equals: (0, reports_utils_1.parseMaybeJsonValue)(q.extraEquals),
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
        const where = andFilters.length > 0 ? { AND: andFilters } : {};
        const [total, items] = await Promise.all([
            this.prisma.report.count({ where }),
            this.prisma.report.findMany({
                where,
                orderBy: { createdAt: q.order ?? 'desc' },
                skip,
                take: limit,
            }),
        ]);
        return (0, pagination_util_1.paginateResponse)(items.map((item) => this.serializeReport(item)), total, page, limit);
    }
    async findOne(id) {
        const item = await this.prisma.report.findUnique({
            where: { id },
        });
        return this.serializeReport(item);
    }
};
exports.ReportsService = ReportsService;
exports.ReportsService = ReportsService = ReportsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notifications_service_1.ReportNotificationsService])
], ReportsService);
//# sourceMappingURL=reports.service.js.map