// src/reports/reports.service.ts
import { Prisma, type Report } from '@prisma/client';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
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
} from 'src/utils/reports.utils';

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

  async create(dto: CreateReportDto): Promise<SerializedReport<Report>> {
    const clientCreatedAt = dto.createdAt ? safeDate(dto.createdAt) : undefined;

    const incidencias = this.normalizeIncidencias(dto.data);
    if (incidencias.length === 0) {
      throw new BadRequestException('Debes enviar al menos una incidencia');
    }

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
      void this.notifier.notifyReportCreated(saved).catch((error: unknown) => {
        this.logger.error(
          `No se pudo notificar reporte: ${this.getErrorMessage(error)}`,
        );
      });
    }

    return this.serializeReport(saved);
  }

  async findAll(q: ListReportsQueryDto): Promise<FindAllResponse> {
    const page = q.page ?? 1;
    const limit = Math.min(q.limit ?? 20, 100);
    const skip = (page - 1) * limit;

    const from = safeDate(q.from);
    const to = safeDate(q.to);

    const andFilters: Prisma.ReportWhereInput[] = [];

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

    const where: Prisma.ReportWhereInput =
      andFilters.length > 0 ? { AND: andFilters } : {};

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

  async findOne(id: string): Promise<SerializedReport<Report> | null> {
    const item = await this.prisma.report.findUnique({
      where: { id },
    });

    return this.serializeReport(item);
  }
}
