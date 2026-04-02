import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { UpdateQuoteDto } from './dto/update-quote.dto';
import { generateUniqueNumber } from '../utils/generate-number.util';
import { paginateResponse } from '../utils/pagination.util';

@Injectable()
export class QuotesService {
  constructor(private readonly prisma: PrismaService) {}

  private calcTotal(
    items: { quantity: number; unitPrice: number; hasIva: boolean }[],
  ): number {
    return items.reduce((acc, item) => {
      const subtotal = item.quantity * item.unitPrice;
      return acc + (item.hasIva ? subtotal * 1.19 : subtotal);
    }, 0);
  }

  async create(dto: CreateQuoteDto, userId?: string) {
    const number = generateUniqueNumber('COT');
    const items = dto.items ?? [];
    const totalAmount = this.calcTotal(
      items.map((i) => ({
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        hasIva: i.hasIva ?? false,
      })),
    );

    return this.prisma.cotizacion.create({
      data: {
        number,
        format: dto.format ?? 'COTIZACION',
        specialty: dto.specialty,
        storeCode: dto.storeCode,
        storeName: dto.storeName,
        storeCity: dto.storeCity,
        typology: dto.typology,
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
  }

  async findAll(page = 1, limit_ = 20, q?: string, format?: string) {
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

    return paginateResponse(items, total, page, limit);
  }

  async findOne(id: string) {
    const item = await this.prisma.cotizacion.findUnique({
      where: { id },
      include: {
        items: { orderBy: { order: 'asc' } },
        incidencias: { include: { incidencia: true } },
      },
    });
    if (!item) throw new NotFoundException('Cotización no encontrada');
    return item;
  }

  async update(id: string, dto: UpdateQuoteDto, userId?: string) {
    await this.findOne(id);

    const items = dto.items ?? [];
    const totalAmount =
      items.length > 0
        ? this.calcTotal(
            items.map((i) => ({
              quantity: i.quantity ?? 0,
              unitPrice: i.unitPrice ?? 0,
              hasIva: i.hasIva ?? false,
            })),
          )
        : undefined;

    return this.prisma.$transaction(async (tx) => {
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
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.cotizacion.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
