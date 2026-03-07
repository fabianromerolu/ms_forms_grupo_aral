import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { CreateReportDto, MaintenanceSubTipo, MaintenanceTipo } from './dto/create-report.dto';
import { ListReportsQueryDto } from './dto/list-reports.query.dto';
import { PrismaService } from '../prisma/prisma.service';
import { ReportNotificationsService } from '../notifications/report-notifications.service';

function toJsonObject<T extends object>(v: T): Record<string, any> {
  return JSON.parse(JSON.stringify(v));
}

function safeDate(s?: string) {
  if (!s) return undefined;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) throw new BadRequestException(`Fecha inválida: ${s}`);
  return d;
}

function parseMaybeJsonValue(s: string) {
  const t = s.trim();
  if (t === 'true') return true;
  if (t === 'false') return false;
  if (!Number.isNaN(Number(t)) && t !== '') return Number(t);
  return t;
}

function safeText(v: any) {
  if (v == null) return '';
  return typeof v === 'string' ? v.trim() : String(v).trim();
}

function firstNonEmpty(...vals: any[]) {
  for (const v of vals) {
    const t = safeText(v);
    if (t) return t;
  }
  return undefined;
}

function uniqueStrings(values: any[]) {
  const out: string[] = [];
  const seen = new Set<string>();

  for (const v of values) {
    const t = safeText(v);
    if (!t) continue;
    if (seen.has(t)) continue;
    seen.add(t);
    out.push(t);
  }

  return out;
}

function uniqueEnums<T extends string>(values: T[]) {
  const out: T[] = [];
  const seen = new Set<string>();

  for (const v of values) {
    if (!v) continue;
    if (seen.has(v)) continue;
    seen.add(v);
    out.push(v);
  }

  return out;
}

const PREVENTIVO_SUBTIPOS = new Set<MaintenanceSubTipo>([
  MaintenanceSubTipo.CUBIERTA,
  MaintenanceSubTipo.METALMECANICO_TIENDA,
  MaintenanceSubTipo.PUERTA_AUTOMATICA,
  MaintenanceSubTipo.PUNTOS_PAGO,
  MaintenanceSubTipo.REDES_HIDROSANITARIAS,
  MaintenanceSubTipo.REDES_ELECTRICAS,
  MaintenanceSubTipo.ESTIBADOR,
  MaintenanceSubTipo.CORTINA_ENROLLABLE,
  MaintenanceSubTipo.CARRITOS_MERCADO,
]);

const CORRECTIVO_SUBTIPOS = new Set<MaintenanceSubTipo>([
  MaintenanceSubTipo.OBRA_CIVIL,
  MaintenanceSubTipo.METALMECANICA,
  MaintenanceSubTipo.ELECTRICA,
  MaintenanceSubTipo.EQUIPOS_ESPECIALES,
]);

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifier: ReportNotificationsService,
  ) {}

  private normalizeIncidencias(data: CreateReportDto['data']) {
    const fromArray = Array.isArray(data.incidencias) ? data.incidencias : [];
    const fromSingle = safeText(data.incidencia);
    const splitSingle = fromSingle ? fromSingle.split(/[\n,;|]+/g) : [];

    return uniqueStrings([...fromArray, ...splitSingle]);
  }

  private normalizeSubTipos(data: CreateReportDto['data']) {
    const arr = Array.isArray(data.subTipos) ? data.subTipos : [];
    const one = data.subTipo ? [data.subTipo] : [];
    return uniqueEnums<MaintenanceSubTipo>([...one, ...arr]);
  }

  private normalizeIncidenciasRemote(dto: CreateReportDto) {
    if (Array.isArray(dto.incidenciasRemote)) {
      return dto.incidenciasRemote.map((x) => toJsonObject(x));
    }

    if (dto.incidenciaRemote && typeof dto.incidenciaRemote === 'object') {
      return [toJsonObject(dto.incidenciaRemote)];
    }

    return [];
  }

  private firstRemoteValue(remotes: Record<string, any>[], keys: string[]) {
    for (const item of remotes) {
      for (const key of keys) {
        const value = safeText(item?.[key]);
        if (value) return value;
      }
    }
    return undefined;
  }

  private mergeRemoteDescriptions(remotes: Record<string, any>[]) {
    const values = uniqueStrings(
      remotes.flatMap((item) => [
        item?.descripcionIncidencia,
        item?.descripcion,
        item?.detalle,
      ]),
    );

    return values.length ? values.join(' | ') : undefined;
  }

  private assertTipoSubtipos(tipo: MaintenanceTipo, subTipos: MaintenanceSubTipo[]) {
    if (!subTipos.length) {
      throw new BadRequestException('Debes enviar al menos una especialidad');
    }

    for (const subTipo of subTipos) {
      if (tipo === MaintenanceTipo.PREVENTIVO && !PREVENTIVO_SUBTIPOS.has(subTipo)) {
        throw new BadRequestException(`subTipo inválido para PREVENTIVO: ${subTipo}`);
      }

      if (tipo === MaintenanceTipo.CORRECTIVO && !CORRECTIVO_SUBTIPOS.has(subTipo)) {
        throw new BadRequestException(`subTipo inválido para CORRECTIVO: ${subTipo}`);
      }
    }
  }

  private buildSearchText(args: {
    dto: CreateReportDto;
    incidencias: string[];
    subTipos: MaintenanceSubTipo[];
    derived?: {
      ciudadTienda?: string;
      departamentoTienda?: string;
      descripcionIncidencia?: string;
    };
    incidenciasRemote?: Record<string, any>[];
  }) {
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

  private serializeReport(report: any) {
    if (!report) return report;

    return {
      ...report,
      incidencia: report.incidenciaPrincipal ?? report.incidencias?.[0] ?? null,
      subTipo: report.subTipoPrincipal ?? report.subTipos?.[0] ?? null,
      incidenciaRemote: Array.isArray(report.incidenciasRemote)
        ? (report.incidenciasRemote[0] ?? null)
        : (report.incidenciasRemote ?? null),
    };
  }

  async create(dto: CreateReportDto) {
    const clientCreatedAt = dto.createdAt ? safeDate(dto.createdAt) : undefined;

    const incidencias = this.normalizeIncidencias(dto.data);
    if (!incidencias.length) {
      throw new BadRequestException('Debes enviar al menos una incidencia');
    }

    const subTipos = this.normalizeSubTipos(dto.data);
    this.assertTipoSubtipos(dto.data.tipo, subTipos);

    const incidenciaPrincipal = incidencias[0];
    const subTipoPrincipal = subTipos[0];

    const incidenciasRemote = this.normalizeIncidenciasRemote(dto);

    const derivedDepartamento = firstNonEmpty(
      dto.data.departamentoTienda,
      this.firstRemoteValue(incidenciasRemote, ['departamentoTienda', 'departamento', 'dpto']),
    );

    const derivedCiudad = firstNonEmpty(
      dto.data.ciudadTienda,
      this.firstRemoteValue(incidenciasRemote, ['ciudadTienda', 'ciudad', 'municipio']),
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

    const responsableJson = dto.responsable ? toJsonObject(dto.responsable) : undefined;
    const incidenciasRemoteJson = incidenciasRemote.length ? incidenciasRemote : undefined;

    /**
     * ✅ anti-spam:
     * solo notificamos cuando el PDF aparece por primera vez.
     */
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
      void this.notifier.notifyReportCreated(saved as any).catch((e: any) => {
        this.logger.error(`No se pudo notificar reporte: ${e?.message}`);
      });
    }

    return this.serializeReport(saved);
  }

  async findAll(q: ListReportsQueryDto) {
    const page = q.page ?? 1;
    const limit = q.limit ?? 20;
    const skip = (page - 1) * limit;

    const from = safeDate(q.from);
    const to = safeDate(q.to);

    const andFilters: any[] = [];

    if (from || to) {
      const createdAt: any = {};
      if (from) createdAt.gte = from;
      if (to) createdAt.lte = to;
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
      } else if (q.extraContains) {
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

  async findOne(id: string) {
    const item = await this.prisma.report.findUnique({ where: { id } });
    return this.serializeReport(item);
  }
}