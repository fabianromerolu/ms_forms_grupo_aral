import { Injectable, NotFoundException } from '@nestjs/common';
import { InvoiceMode, Prisma } from '@prisma/client';
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
    'createdAt',
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
    options: {
      invoiceMode?: InvoiceMode;
      typologyUnitPrice?: number | null;
      aiuAdministration?: number;
      aiuUnexpected?: number;
      aiuUtility?: number;
      aiuIva?: number;
    } = {},
  ): number {
    const typologyUnitPrice = Number(options.typologyUnitPrice ?? 0);
    const subtotal =
      items.reduce((acc, item) => {
        return acc + item.quantity * item.unitPrice;
      }, 0) + typologyUnitPrice;

    if ((options.invoiceMode ?? InvoiceMode.IVA) === InvoiceMode.AIU) {
      const administrationValue =
        subtotal * ((options.aiuAdministration ?? 0) / 100);
      const unexpectedValue = subtotal * ((options.aiuUnexpected ?? 0) / 100);
      const utilityValue = subtotal * ((options.aiuUtility ?? 0) / 100);
      const aiuVatValue = utilityValue * ((options.aiuIva ?? 0) / 100);

      return this.roundMoney(
        subtotal +
          administrationValue +
          unexpectedValue +
          utilityValue +
          aiuVatValue,
      );
    }

    const itemsIva = items.reduce((acc, item) => {
      const subtotal = item.quantity * item.unitPrice;
      return acc + (item.hasIva ? subtotal * 0.19 : 0);
    }, 0);
    const transferIva = typologyUnitPrice * 0.19;

    return this.roundMoney(subtotal + itemsIva + transferIva);
  }

  private roundMoney(value: number): number {
    return Math.round(Number.isFinite(value) ? value : 0);
  }

  private calcSubtotal(quantity: number, unitPrice: number): number {
    return this.roundMoney(quantity * unitPrice);
  }

  async create(dto: CreateQuoteDto, actor?: AccessActor | null) {
    const userId = actor?.id;
    await assertStoreAllowed(this.prisma, actor, { storeCode: dto.storeCode });

    const items = dto.items ?? [];
    const invoiceMode = dto.invoiceMode ?? InvoiceMode.IVA;
    const aiuAdministration = dto.aiuAdministration ?? 0;
    const aiuUnexpected = dto.aiuUnexpected ?? 0;
    const aiuUtility = dto.aiuUtility ?? 0;
    const aiuIva = dto.aiuIva ?? 0;

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
      {
        invoiceMode,
        typologyUnitPrice: dto.typologyUnitPrice ?? null,
        aiuAdministration,
        aiuUnexpected,
        aiuUtility,
        aiuIva,
      },
    );

    const quote = await this.prisma.cotizacion.create({
      data: {
        number,
        sequentialId,
        ...(dto.createdAt && { createdAt: new Date(dto.createdAt) }),
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
        invoiceMode,
        aiuAdministration,
        aiuUnexpected,
        aiuUtility,
        aiuIva,
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
            subtotal: this.calcSubtotal(item.quantity, item.unitPrice),
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
    regional?: string,
    actor?: AccessActor | null,
  ) {
    const limit = Math.min(limit_, 100);
    const skip = (page - 1) * limit;
    const where: Prisma.CotizacionWhereInput = { isActive: true };

    const and: Prisma.CotizacionWhereInput[] = [];

    if (format) where.format = format as 'COTIZACION' | 'FACTURA';
    if (q) {
      where.OR = [
        { number: { contains: q, mode: Prisma.QueryMode.insensitive } },
        { storeName: { contains: q, mode: Prisma.QueryMode.insensitive } },
        { specialty: { contains: q, mode: Prisma.QueryMode.insensitive } },
      ];
    }

    if (regional?.trim()) {
      const stores = await this.prisma.tienda.findMany({
        where: {
          isActive: true,
          regional: {
            contains: regional.trim(),
            mode: Prisma.QueryMode.insensitive,
          },
        },
        select: { storeCode: true },
      });
      const storeCodes = stores
        .map((store) => store.storeCode)
        .filter(Boolean);
      and.push(
        storeCodes.length
          ? { storeCode: { in: storeCodes } }
          : { id: '00000000-0000-0000-0000-000000000000' },
      );
    }

    const scope = await scopedQuoteWhere(this.prisma, actor);
    if (scope) and.push(scope);
    if (and.length) where.AND = and;

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
    const currentQuote = await this.findOne(id, actor);

    if (dto.storeCode !== undefined) {
      await assertStoreAllowed(this.prisma, actor, { storeCode: dto.storeCode });
    }

    const shouldRecalculateTotal =
      dto.items !== undefined ||
      dto.typologyUnitPrice !== undefined ||
      dto.invoiceMode !== undefined ||
      dto.aiuAdministration !== undefined ||
      dto.aiuUnexpected !== undefined ||
      dto.aiuUtility !== undefined ||
      dto.aiuIva !== undefined;
    const totalItems =
      dto.items !== undefined
        ? dto.items.map((i) => ({
            quantity: i.quantity ?? 1,
            unitPrice: i.unitPrice ?? 0,
            hasIva: i.hasIva ?? false,
          }))
        : currentQuote.items.map((i) => ({
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            hasIva: i.hasIva,
          }));
    const totalAmount =
      shouldRecalculateTotal
        ? this.calcTotal(
            totalItems,
            {
              invoiceMode: dto.invoiceMode ?? currentQuote.invoiceMode,
              typologyUnitPrice:
                dto.typologyUnitPrice !== undefined
                  ? dto.typologyUnitPrice
                  : currentQuote.typologyUnitPrice,
              aiuAdministration:
                dto.aiuAdministration ?? currentQuote.aiuAdministration,
              aiuUnexpected: dto.aiuUnexpected ?? currentQuote.aiuUnexpected,
              aiuUtility: dto.aiuUtility ?? currentQuote.aiuUtility,
              aiuIva: dto.aiuIva ?? currentQuote.aiuIva,
            },
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
          ...(dto.createdAt !== undefined && { createdAt: new Date(dto.createdAt) }),
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
                subtotal: this.calcSubtotal(
                  item.quantity ?? 1,
                  item.unitPrice ?? 0,
                ),
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
