// src/reports/reports.service.ts
import { Prisma, type Report } from '@prisma/client';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ReportNotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateReportDto,
  MaintenanceSubTipo,
  MaintenanceTipo,
} from './dto/create-report.dto';
import { ListReportsQueryDto } from './dto/list-reports.query.dto';
import { paginateResponse } from '../utils/pagination.util';
import {
  type AccessActor,
  isRegionalScopedActor,
  scopedIncidentWhere,
  scopedReportWhere,
} from '../auth/access-scope.util';
import {
  CORRECTIVO_SUBTIPOS,
  DerivedFields,
  FindAllResponse,
  firstNonEmpty,
  parseMaybeJsonValue,
  PersistPayloadArgs,
  PREVENTIVO_SUBTIPOS,
  RemoteRecord,
  ReportLike,
  safeDate,
  safeText,
  SerializedReport,
  toJsonObject,
  uniqueEnums,
  uniqueStrings,
} from '../utils/reports.utils';

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifier: ReportNotificationsService,
  ) {}

  private toInputJsonObject(value: object): Prisma.InputJsonObject {
    return toJsonObject(value) as Prisma.InputJsonObject;
  }

  private normalizeJsonObject(
    value: unknown,
  ): Prisma.InputJsonObject | undefined {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      return undefined;
    }

    return this.toInputJsonObject(value);
  }

  private normalizeIncidencias(data: CreateReportDto['data']): string[] {
    const fromArray = Array.isArray(data.incidencias) ? data.incidencias : [];
    const fromSingle = safeText(data.incidencia);
    const splitSingle = fromSingle ? fromSingle.split(/[\n,;|]+/g) : [];

    return uniqueStrings([...fromArray, ...splitSingle]);
  }

  private normalizeSubTipos(
    data: CreateReportDto['data'],
  ): MaintenanceSubTipo[] {
    const arr = Array.isArray(data.subTipos) ? data.subTipos : [];
    const one = data.subTipo ? [data.subTipo] : [];

    return uniqueEnums<MaintenanceSubTipo>([...one, ...arr]);
  }

  private normalizeIncidenciasRemote(
    dto: CreateReportDto,
  ): Prisma.InputJsonObject[] {
    if (Array.isArray(dto.incidenciasRemote)) {
      return dto.incidenciasRemote
        .filter(
          (item): item is object =>
            typeof item === 'object' && item !== null && !Array.isArray(item),
        )
        .map((item) => this.toInputJsonObject(item));
    }

    if (
      typeof dto.incidenciaRemote === 'object' &&
      dto.incidenciaRemote !== null &&
      !Array.isArray(dto.incidenciaRemote)
    ) {
      return [this.toInputJsonObject(dto.incidenciaRemote)];
    }

    return [];
  }

  private firstRemoteValue(
    remotes: readonly RemoteRecord[],
    keys: readonly string[],
  ): string | undefined {
    for (const item of remotes) {
      for (const key of keys) {
        const value = safeText(item[key]);
        if (value) {
          return value;
        }
      }
    }

    return undefined;
  }

  private mergeRemoteDescriptions(
    remotes: readonly RemoteRecord[],
  ): string | undefined {
    const values = uniqueStrings(
      remotes
        .flatMap((item) => [
          safeText(item.descripcionIncidencia),
          safeText(item.descripcion),
          safeText(item.detalle),
        ])
        .filter(Boolean),
    );

    return values.length > 0 ? values.join(' | ') : undefined;
  }

  private assertTipoSubtipos(
    tipo: MaintenanceTipo,
    subTipos: MaintenanceSubTipo[],
  ): void {
    if (subTipos.length === 0) {
      throw new BadRequestException('Debes enviar al menos una especialidad');
    }

    for (const subTipo of subTipos) {
      if (
        tipo === MaintenanceTipo.PREVENTIVO &&
        !PREVENTIVO_SUBTIPOS.has(subTipo)
      ) {
        throw new BadRequestException(
          `subTipo inválido para PREVENTIVO: ${subTipo}`,
        );
      }

      if (
        tipo === MaintenanceTipo.CORRECTIVO &&
        !CORRECTIVO_SUBTIPOS.has(subTipo)
      ) {
        throw new BadRequestException(
          `subTipo inválido para CORRECTIVO: ${subTipo}`,
        );
      }
    }
  }

  private buildSearchText(args: {
    dto: CreateReportDto;
    incidencias: string[];
    subTipos: MaintenanceSubTipo[];
    derived?: DerivedFields;
    incidenciasRemote?: readonly RemoteRecord[];
  }): string {
    const {
      dto,
      incidencias,
      subTipos,
      derived,
      incidenciasRemote = [],
    } = args;

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
      .map((value) => safeText(value))
      .filter(Boolean)
      .join(' | ')
      .toLowerCase();
  }

  private buildPersistPayload({
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
  }: PersistPayloadArgs): Omit<Prisma.ReportUncheckedCreateInput, 'id'> {
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

  private serializeReport<T extends ReportLike>(report: T): SerializedReport<T>;
  private serializeReport(report: null): null;
  private serializeReport(
    report: Report | null,
  ): SerializedReport<Report> | null;
  private serializeReport<T extends ReportLike>(
    report: T | null,
  ): SerializedReport<T> | null {
    if (!report) {
      return null;
    }

    const incidencia =
      report.incidenciaPrincipal ?? report.incidencias[0] ?? null;
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

  private getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }

    return safeText(error) || 'Error desconocido';
  }

  private buildReportWhere(
    q: Partial<ListReportsQueryDto>,
  ): Prisma.ReportWhereInput {
    const from = safeDate(q.from);
    const to = safeDate(q.to);

    const andFilters: Prisma.ReportWhereInput[] = [{ isActive: true }];

    if (from || to) {
      const createdAt: Prisma.DateTimeFilter = {};

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
              mode: Prisma.QueryMode.insensitive,
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
          mode: Prisma.QueryMode.insensitive,
        },
      });
    }

    if (q.departamentoTienda) {
      andFilters.push({
        departamentoTienda: {
          contains: q.departamentoTienda,
          mode: Prisma.QueryMode.insensitive,
        },
      });
    }

    if (q.ciudadTienda) {
      andFilters.push({
        ciudadTienda: {
          contains: q.ciudadTienda,
          mode: Prisma.QueryMode.insensitive,
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

    if (q.hasPdf !== undefined) {
      andFilters.push(
        q.hasPdf
          ? {
              AND: [
                { responsablePdfUrl: { not: null } },
                { responsablePdfUrl: { not: '' } },
              ],
            }
          : {
              OR: [
                { responsablePdfUrl: { equals: null } },
                { responsablePdfUrl: '' },
              ],
            },
      );
    }

    if (q.createdById) {
      andFilters.push({ createdById: q.createdById });
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
      } else if (q.extraContains) {
        andFilters.push({
          extra: {
            path,
            string_contains: q.extraContains,
          },
        });
      }
    }

    return andFilters.length > 0 ? { AND: andFilters } : {};
  }

  private async buildScopedReportWhere(
    q: Partial<ListReportsQueryDto>,
    actor?: AccessActor | null,
  ): Promise<Prisma.ReportWhereInput> {
    const filters: Prisma.ReportWhereInput[] = [this.buildReportWhere(q)];

    if (q.regional?.trim()) {
      const regionalStores = await this.prisma.tienda.findMany({
        where: {
          isActive: true,
          regional: {
            contains: q.regional.trim(),
            mode: Prisma.QueryMode.insensitive,
          },
        },
        select: { storeCode: true, storeName: true },
      });

      const storeCodes = regionalStores
        .map((store) => safeText(store.storeCode))
        .filter(Boolean);
      const storeNames = regionalStores
        .map((store) => safeText(store.storeName))
        .filter(Boolean);

      const incidents = storeCodes.length
        ? await this.prisma.incidencia.findMany({
            where: {
              isDisabled: false,
              storeCode: { in: storeCodes },
            },
            select: { incidentNumber: true },
          })
        : [];

      const incidentNumbers = incidents
        .map((incident) => safeText(incident.incidentNumber))
        .filter(Boolean);

      const regionalReportFilters: Prisma.ReportWhereInput[] = [
        ...(incidentNumbers.length
          ? [
              { incidenciaPrincipal: { in: incidentNumbers } },
              { incidencias: { hasSome: incidentNumbers } },
            ]
          : []),
        ...(storeNames.length ? [{ tienda: { in: storeNames } }] : []),
        ...(storeCodes.length ? [{ tienda: { in: storeCodes } }] : []),
      ];

      filters.push(
        regionalReportFilters.length
          ? { OR: regionalReportFilters }
          : { id: '00000000-0000-0000-0000-000000000000' },
      );
    }

    const scope = await scopedReportWhere(this.prisma, actor);
    if (scope) filters.push(scope);
    return filters.length > 1 ? { AND: filters } : filters[0];
  }

  private async assertReportIncidenciasAllowed(
    incidencias: string[],
    actor?: AccessActor | null,
  ): Promise<void> {
    if (!isRegionalScopedActor(actor)) return;

    const scope = await scopedIncidentWhere(this.prisma, actor, {
      coordinatorOwnOnly: true,
    });

    const total = await this.prisma.incidencia.count({
      where: {
        isDisabled: false,
        incidentNumber: { in: incidencias },
        ...(scope ? { AND: [scope] } : {}),
      },
    });

    if (total !== incidencias.length) {
      throw new ForbiddenException(
        'No puedes crear reportes para incidencias de otra regional',
      );
    }
  }

  async create(
    dto: CreateReportDto,
    actor?: AccessActor | null,
  ): Promise<SerializedReport<Report>> {
    const clientCreatedAt = dto.createdAt ? safeDate(dto.createdAt) : undefined;

    const incidencias = this.normalizeIncidencias(dto.data);
    if (incidencias.length === 0) {
      throw new BadRequestException('Debes enviar al menos una incidencia');
    }
    await this.assertReportIncidenciasAllowed(incidencias, actor);

    const subTipos = this.normalizeSubTipos(dto.data);
    this.assertTipoSubtipos(dto.data.tipo, subTipos);

    const incidenciaPrincipal = incidencias[0];
    const subTipoPrincipal = subTipos[0];

    const incidenciasRemote = this.normalizeIncidenciasRemote(dto);

    const derivedDepartamento = firstNonEmpty(
      dto.data.departamentoTienda,
      this.firstRemoteValue(incidenciasRemote, [
        'departamentoTienda',
        'departamento',
        'dpto',
      ]),
    );

    const derivedCiudad = firstNonEmpty(
      dto.data.ciudadTienda,
      this.firstRemoteValue(incidenciasRemote, [
        'ciudadTienda',
        'ciudad',
        'municipio',
      ]),
    );

    const derivedDescripcion = firstNonEmpty(
      dto.data.descripcionIncidencia,
      this.mergeRemoteDescriptions(incidenciasRemote),
    );

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

    const incidenciasRemoteJson =
      incidenciasRemote.length > 0 ? incidenciasRemote : undefined;

    const wantsPdfNotify = Boolean(dto.responsablePdfUrl?.trim());

    const prev = await this.prisma.report.findUnique({
      where: { id: dto.id },
      select: { id: true, responsablePdfUrl: true, isActive: true },
    });

    if (prev && actor?.role !== 'ADMIN') {
      throw new ForbiddenException(
        'Solo el administrador puede editar reportes existentes',
      );
    }

    if (prev && !prev.isActive) {
      throw new NotFoundException('El reporte no está disponible');
    }

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
        createdById: actor?.id ?? undefined,
      },
      update: persistPayload,
    });

    if (shouldNotify) {
      void this.notifier.notifyReportCreated(saved).catch((error: unknown) => {
        this.logger.error(
          `No se pudo notificar reporte: ${this.getErrorMessage(error)}`,
        );
      });
    }

    // Auto-avanzar incidencias vinculadas a INFORMADA cuando el reporte tiene PDF.
    // Solo aplica para reportes creados a partir del 09/04/2026 (migración a nueva plataforma).
    const AUTO_INFORMADA_SINCE = new Date("2026-04-09T00:00:00.000Z");
    const reportCreatedAt = saved.clientCreatedAt ?? saved.createdAt;
    const isEligibleForAutoInformada =
      wantsPdfNotify &&
      incidencias.length > 0 &&
      new Date(reportCreatedAt) >= AUTO_INFORMADA_SINCE;

    if (isEligibleForAutoInformada) {
      void this.autoAdvanceIncidenciasToInformada(incidencias, AUTO_INFORMADA_SINCE).catch(
        (error: unknown) => {
          this.logger.warn(
            `Auto-INFORMADA falló: ${this.getErrorMessage(error)}`,
          );
        },
      );
    }

    return this.serializeReport(saved);
  }

  /** Avanza a INFORMADA todas las incidencias vinculadas que estén en CREADA o COTIZADA.
   *  Solo procesa incidencias creadas a partir de `since` para evitar ensuciar data histórica. */
  private async autoAdvanceIncidenciasToInformada(
    incidencias: string[],
    since?: Date,
  ): Promise<void> {
    const ELIGIBLE_STATUSES = ['CREADA', 'COTIZADA'];

    for (const numero of incidencias) {
      const inc = await this.prisma.incidencia.findFirst({
        where: { incidentNumber: numero },
        select: { id: true, status: true, createdAt: true },
      });

      if (!inc) continue;
      if (!ELIGIBLE_STATUSES.includes(inc.status)) continue;
      // No tocar incidencias creadas antes de la fecha de migración
      if (since && new Date(inc.createdAt) < since) continue;

      await this.prisma.incidencia.update({
        where: { id: inc.id },
        data: { status: 'INFORMADA' },
      });

      await this.prisma.incidenciaHistoryEvent.create({
        data: {
          incidenciaId: inc.id,
          action: 'ESTADO_CAMBIADO',
          fromStatus: inc.status as any,
          toStatus: 'INFORMADA' as any,
          note: 'Avanzado automáticamente al recibir reporte del operario',
        },
      });

      this.logger.log(
        `Incidencia ${numero} → INFORMADA (reporte del operario)`,
      );
    }
  }

  async findAll(
    q: ListReportsQueryDto,
    actor?: AccessActor | null,
  ): Promise<FindAllResponse> {
    const page = q.page ?? 1;
    const limit = Math.min(q.limit ?? 20, 100);
    const skip = (page - 1) * limit;
    const where = await this.buildScopedReportWhere(q, actor);

    const [total, items] = await Promise.all([
      this.prisma.report.count({ where }),
      this.prisma.report.findMany({
        where,
        orderBy: { createdAt: q.order ?? 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return paginateResponse(
      items.map((item) => this.serializeReport(item)),
      total,
      page,
      limit,
    );
  }

  async getSummary(q: ListReportsQueryDto, actor?: AccessActor | null) {
    const summaryFilters: Partial<ListReportsQueryDto> = {
      q: q.q,
      from: q.from,
      to: q.to,
      subTipo: q.subTipo,
      incidencia: q.incidencia,
      tienda: q.tienda,
      departamentoTienda: q.departamentoTienda,
      ciudadTienda: q.ciudadTienda,
      regional: q.regional,
      extraPath: q.extraPath,
      extraEquals: q.extraEquals,
      extraContains: q.extraContains,
    };

    const baseWhere = await this.buildScopedReportWhere(summaryFilters, actor);

    const total = await this.prisma.report.count({ where: baseWhere });

    const rows = await this.prisma.report.groupBy({
      by: ['tipo'],
      _count: { id: true },
      where: baseWhere,
    });

    const conPdf = await this.prisma.report.count({
      where: await this.buildScopedReportWhere(
        { ...summaryFilters, hasPdf: true },
        actor,
      ),
    });

    const byType = new Map(rows.map((row) => [row.tipo, row._count.id]));

    return {
      total,
      preventivos: byType.get('PREVENTIVO') ?? 0,
      correctivos: byType.get('CORRECTIVO') ?? 0,
      conPdf,
    };
  }

  async findOne(
    id: string,
    actor?: AccessActor | null,
  ): Promise<SerializedReport<Report> | null> {
    const scope = await scopedReportWhere(this.prisma, actor);
    const item = await this.prisma.report.findFirst({
      where: {
        id,
        isActive: true,
        ...(scope ? { AND: [scope] } : {}),
      },
    });

    return this.serializeReport(item);
  }

  async remove(id: string) {
    const item = await this.prisma.report.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!item) {
      throw new NotFoundException('Reporte no encontrado');
    }

    return this.prisma.report.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
