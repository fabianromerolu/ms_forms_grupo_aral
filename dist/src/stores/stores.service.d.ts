import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { type AccessActor } from '../auth/access-scope.util';
export declare class StoresService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(dto: CreateStoreDto, actor?: AccessActor | null): Promise<{
        labels: {
            id: string;
            tiendaId: string;
            label: string;
        }[];
    } & {
        id: string;
        phone: string | null;
        city: string | null;
        regional: string | null;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        storeCode: string;
        storeName: string;
        address: string | null;
        department: string | null;
        neighborhood: string | null;
        typology: string | null;
        responsibleName: string | null;
        responsiblePhone: string | null;
        responsibleEmail: string | null;
    }>;
    findAll(page?: number, limit?: number, q?: string, regional?: string, city?: string, actor?: AccessActor | null): Promise<{
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            hasPrev: boolean;
            hasNext: boolean;
        };
        items: ({
            labels: {
                id: string;
                tiendaId: string;
                label: string;
            }[];
        } & {
            id: string;
            phone: string | null;
            city: string | null;
            regional: string | null;
            createdAt: Date;
            updatedAt: Date;
            isActive: boolean;
            storeCode: string;
            storeName: string;
            address: string | null;
            department: string | null;
            neighborhood: string | null;
            typology: string | null;
            responsibleName: string | null;
            responsiblePhone: string | null;
            responsibleEmail: string | null;
        })[];
    }>;
    findOne(id: string, actor?: AccessActor | null): Promise<{
        labels: {
            id: string;
            tiendaId: string;
            label: string;
        }[];
        history: {
            id: string;
            createdAt: Date;
            data: Prisma.JsonValue | null;
            tiendaId: string;
            action: string;
            by: string | null;
        }[];
    } & {
        id: string;
        phone: string | null;
        city: string | null;
        regional: string | null;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        storeCode: string;
        storeName: string;
        address: string | null;
        department: string | null;
        neighborhood: string | null;
        typology: string | null;
        responsibleName: string | null;
        responsiblePhone: string | null;
        responsibleEmail: string | null;
    }>;
    findByCode(code: string, actor?: AccessActor | null): Promise<{
        labels: {
            id: string;
            tiendaId: string;
            label: string;
        }[];
    } & {
        id: string;
        phone: string | null;
        city: string | null;
        regional: string | null;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        storeCode: string;
        storeName: string;
        address: string | null;
        department: string | null;
        neighborhood: string | null;
        typology: string | null;
        responsibleName: string | null;
        responsiblePhone: string | null;
        responsibleEmail: string | null;
    }>;
    update(id: string, dto: UpdateStoreDto, actor?: AccessActor | null): Promise<{
        labels: {
            id: string;
            tiendaId: string;
            label: string;
        }[];
    } & {
        id: string;
        phone: string | null;
        city: string | null;
        regional: string | null;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        storeCode: string;
        storeName: string;
        address: string | null;
        department: string | null;
        neighborhood: string | null;
        typology: string | null;
        responsibleName: string | null;
        responsiblePhone: string | null;
        responsibleEmail: string | null;
    }>;
    remove(id: string): Promise<{
        id: string;
        phone: string | null;
        city: string | null;
        regional: string | null;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        storeCode: string;
        storeName: string;
        address: string | null;
        department: string | null;
        neighborhood: string | null;
        typology: string | null;
        responsibleName: string | null;
        responsiblePhone: string | null;
        responsibleEmail: string | null;
    }>;
}
