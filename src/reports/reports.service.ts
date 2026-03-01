import { BadRequestException, Injectable } from "@nestjs/common";
import { CreateReportDto } from "./dto/create-report.dto";
import { ListReportsQueryDto } from "./dto/list-reports.query.dto";
import { UpdateEncargadoSignatureDto } from "./dto/update-encargado-signature.dto";
import { PrismaService } from "../prisma/prisma.service";

function toJsonObject<T extends object>(v: T): Record<string, any> {
  // quita métodos/prototipo, deja JSON plano
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
  if (t === "true") return true;
  if (t === "false") return false;
  if (!Number.isNaN(Number(t)) && t !== "") return Number(t);
  return t;
}

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  private buildSearchText(dto: CreateReportDto) {
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

  async create(dto: CreateReportDto) {
    const clientCreatedAt = dto.createdAt ? safeDate(dto.createdAt) : undefined;

    const searchText = this.buildSearchText(dto);

    // Upsert = si re-envías el mismo id, actualiza (te salva de duplicados)
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

    if (q.incidencia) where.incidencia = { contains: q.incidencia, mode: "insensitive" };
    if (q.tienda) where.tienda = { contains: q.tienda, mode: "insensitive" };
    if (q.departamentoTienda) where.departamentoTienda = { contains: q.departamentoTienda, mode: "insensitive" };
    if (q.ciudadTienda) where.ciudadTienda = { contains: q.ciudadTienda, mode: "insensitive" };

    if (q.q) {
      where.searchText = { contains: q.q.toLowerCase() };
    }

    // Filtro dinámico por extra JSON path
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
        estado: "FIRMADO_ENCARGADO",
      },
    });
  }
}