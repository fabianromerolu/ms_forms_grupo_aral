import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { UpdateQuoteDto } from './dto/update-quote.dto';
import { paginateResponse } from '../utils/pagination.util';
import {
  assertStoreAllowed,
  type AccessActor,
  scopedQuoteWhere,
} from '../auth/access-scope.util';

@Injectable()
export class QuotesService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly documentDataFields: (keyof UpdateQuoteDto)[] = [
    'format',
    'specialty',
    'storeCode',
    'storeName',
    'storeCity',
    'typology',
    'typologyUnitPrice',
    'typologyUnit',
    'maintenanceType',
    'note',
    'invoiceMode',
    'aiuAdministration',
    'aiuUnexpected',
    'aiuUtility',
    'aiuIva',
    'items',
    'incidenciaIds',
  ];

  private withDocumentNumber<T extends { number: string }>(
    quote: T,
  ): T & { documentNumber: string; quoteNumber: string } {
    return {
      ...quote,
      documentNumber: quote.number,
      quoteNumber: quote.number,
    };
  }

  private withDocumentNumbers<T extends { number: string }>(
    quotes: T[],
  ): (T & { documentNumber: string; quoteNumber: string })[] {
    return quotes.map((quote) => this.withDocumentNumber(quote));
  }

  private hasDocumentDataChange(dto: UpdateQuoteDto): boolean {
    return this.documentDataFields.some((field) => dto[field] !== undefined);
  }

  private calcTotal(
    items: { quantity: number; unitPrice: number; hasIva: boolean }[],
  ): number {
    return items.reduce((acc, item) => {
      const subtotal = item.quantity * item.unitPrice;
      return acc + (item.hasIva ? subtotal * 1.19 : subtotal);
    }, 0);
  }

  async create(dto: CreateQuoteDto, actor?: AccessActor | null) {
    const userId = actor?.id;
    await assertStoreAllowed(this.prisma, actor, { storeCode: dto.storeCode });

    const items = dto.items ?? [];

    const maxSeq = await this.prisma.cotizacion.aggregate({
      _max: { sequentialId: true },
    });
    const sequentialId = (maxSeq._max.sequentialId ?? 2999) + 1;
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const numIncidencias = dto.incidenciaIds?.length ?? 0;
    const number = `COT-${sequentialId}-${dateStr}-${numIncidencias}`;

    const totalAmount = this.calcTotal(
      items.map((i) => ({
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        hasIva: i.hasIva ?? false,
      })),
    );

    const quote = await this.prisma.cotizacion.create({
      data: {
        number,
        sequentialId,
        format: dto.format ?? 'COTIZACION',
        specialty: dto.specialty,
        storeCode: dto.storeCode,
        storeName: dto.storeName,
        storeCity: dto.storeCity,
        typology: dto.typology,
        typologyUnitPrice: dto.typologyUnitPrice ?? null,
        typologyUnit: dto.typologyUnit ?? null,
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

    return this.withDocumentNumber(quote);
  }

  async findAll(
    page = 1,
    limit_ = 20,
    q?: string,
    format?: string,
    actor?: AccessActor | null,
  ) {
    const limit = Math.min(limit_, 100);
    const skip = (page - 1) * limit;
    const where: Prisma.CotizacionWhereInput = { isActive: true };

    if (format) where.format = format as 'COTIZACION' | 'FACTURA';
    if (q) {
      where.OR = [
        { number: { contains: q, mode: Prisma.QueryMode.insensitive } },
        { storeName: { contains: q, mode: Prisma.QueryMode.insensitive } },
        { specialty: { contains: q, mode: Prisma.QueryMode.insensitive } },
      ];
    }

    const scope = await scopedQuoteWhere(this.prisma, actor);
    if (scope) where.AND = [scope];

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

    return paginateResponse(this.withDocumentNumbers(items), total, page, limit);
  }

  async findOne(id: string, actor?: AccessActor | null) {
    const scope = await scopedQuoteWhere(this.prisma, actor);
    const item = await this.prisma.cotizacion.findFirst({
      where: {
        id,
        ...(scope ? { AND: [scope] } : {}),
      },
      include: {
        items: { orderBy: { order: 'asc' } },
        incidencias: { include: { incidencia: true } },
      },
    });
    if (!item) throw new NotFoundException('Cotización no encontrada');
    return this.withDocumentNumber(item);
  }

  async update(id: string, dto: UpdateQuoteDto, actor?: AccessActor | null) {
    await this.findOne(id, actor);

    if (dto.storeCode !== undefined) {
      await assertStoreAllowed(this.prisma, actor, { storeCode: dto.storeCode });
    }

    const items = dto.items ?? [];
    const totalAmount =
      items.length > 0
        ? this.calcTotal(
            items.map((i) => ({
              quantity: i.quantity ?? 1,
              unitPrice: i.unitPrice ?? 0,
              hasIva: i.hasIva ?? false,
            })),
          )
        : undefined;
    const shouldInvalidateDocument =
      this.hasDocumentDataChange(dto) &&
      dto.quoteDocumentUrl === undefined &&
      dto.quoteDocumentName === undefined;

    const quote = await this.prisma.$transaction(async (tx) => {
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
          ...(dto.typologyUnitPrice !== undefined && { typologyUnitPrice: dto.typologyUnitPrice }),
          ...(dto.typologyUnit !== undefined && { typologyUnit: dto.typologyUnit }),
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
          ...(shouldInvalidateDocument && {
            quoteDocumentUrl: null,
            quoteDocumentName: null,
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

    return this.withDocumentNumber(quote);
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.cotizacion.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
