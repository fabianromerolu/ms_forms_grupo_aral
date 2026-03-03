import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { CreateReportDto, MaintenanceSubTipo, MaintenanceTipo } from './dto/create-report.dto';
import { ListReportsQueryDto } from './dto/list-reports.query.dto';
import { UpdateEncargadoSignatureDto } from './dto/update-encargado-signature.dto';
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

const PREVENTIVO_SUBTIPOS = new Set<MaintenanceSubTipo>([
  MaintenanceSubTipo.CUBIERTA,
  MaintenanceSubTipo.METALMECANICO_TIENDA,
  MaintenanceSubTipo.PUERTA_AUTOMATICA,
  MaintenanceSubTipo.PUNTOS_PAGO,
  MaintenanceSubTipo.REDES_HIDROSANITARIAS,
  MaintenanceSubTipo.REDES_ELECTRICAS,
  MaintenanceSubTipo.ESTIBADOR,
  MaintenanceSubTipo.CORTINA_ENROLLABLE,
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

  private assertTipoSubtipo(tipo: MaintenanceTipo, subTipo: MaintenanceSubTipo) {
    if (tipo === MaintenanceTipo.PREVENTIVO && !PREVENTIVO_SUBTIPOS.has(subTipo)) {
      throw new BadRequestException(`subTipo inválido para PREVENTIVO: ${subTipo}`);
    }
    if (tipo === MaintenanceTipo.CORRECTIVO && !CORRECTIVO_SUBTIPOS.has(subTipo)) {
      throw new BadRequestException(`subTipo inválido para CORRECTIVO: ${subTipo}`);
    }
  }

  private buildSearchText(
    dto: CreateReportDto,
    derived?: { ciudadTienda?: string; departamentoTienda?: string; descripcionIncidencia?: string },
  ) {
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

  async create(dto: CreateReportDto) {
    const clientCreatedAt = dto.createdAt ? safeDate(dto.createdAt) : undefined;

    this.assertTipoSubtipo(dto.data.tipo, dto.data.subTipo);

    const derivedDepartamento = firstNonEmpty(
      dto.data.departamentoTienda,
      dto.incidenciaRemote?.departamentoTienda,
      dto.incidenciaRemote?.departamento,
      dto.incidenciaRemote?.dpto,
    );

    const derivedCiudad = firstNonEmpty(
      dto.data.ciudadTienda,
      dto.incidenciaRemote?.ciudadTienda,
      dto.incidenciaRemote?.ciudad,
      dto.incidenciaRemote?.municipio,
    );

    const derivedDescripcion = firstNonEmpty(
      dto.data.descripcionIncidencia,
      dto.incidenciaRemote?.descripcionIncidencia,
      dto.incidenciaRemote?.descripcion,
      dto.incidenciaRemote?.detalle,
    );

    const searchText = this.buildSearchText(dto, {
      ciudadTienda: derivedCiudad,
      departamentoTienda: derivedDepartamento,
      descripcionIncidencia: derivedDescripcion,
    });

    const responsableJson = dto.responsable ? toJsonObject(dto.responsable) : undefined;
    const incidenciaRemoteJson = dto.incidenciaRemote ? toJsonObject(dto.incidenciaRemote) : undefined;

    /**
     * ✅ CLAVE anti-spam:
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

    // ✅ Notificar SOLO cuando ya hay PDF por primera vez
    if (shouldNotify) {
      void this.notifier.notifyReportCreated(saved as any).catch((e: any) => {
        this.logger.error(`No se pudo notificar reporte: ${e?.message}`);
      });
    }

    return saved;
  }

  async findAll(q: ListReportsQueryDto) {
    const page = q.page ?? 1;
    const limit = q.limit ?? 20;
    const skip = (page - 1) * limit;

    const from = safeDate(q.from);
    const to = safeDate(q.to);

    const where: any = {};

    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = from;
      if (to) where.createdAt.lte = to;
    }

    if (q.tipo) where.tipo = q.tipo;
    if (q.subTipo) where.subTipo = q.subTipo;

    if (q.incidencia) where.incidencia = { contains: q.incidencia, mode: 'insensitive' };
    if (q.tienda) where.tienda = { contains: q.tienda, mode: 'insensitive' };

    if (q.departamentoTienda) where.departamentoTienda = { contains: q.departamentoTienda, mode: 'insensitive' };
    if (q.ciudadTienda) where.ciudadTienda = { contains: q.ciudadTienda, mode: 'insensitive' };

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
      } else if (q.extraContains) {
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

  async findOne(id: string) {
    return this.prisma.report.findUnique({ where: { id } });
  }

  async updateEncargadoSignature(id: string, dto: UpdateEncargadoSignatureDto) {
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
}