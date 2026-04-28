import { StoresService } from './stores.service';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import type { AuthRequest } from '../types/auth-request.type';
export declare class StoresController {
    private readonly service;
    constructor(service: StoresService);
    create(dto: CreateStoreDto, req: AuthRequest): Promise<{
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
    findAll(page?: string, limit?: string, q?: string, regional?: string, city?: string, req?: AuthRequest): Promise<{
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
    findByCode(code: string, req: AuthRequest): Promise<{
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
    findOne(id: string, req: AuthRequest): Promise<{
        labels: {
            id: string;
            tiendaId: string;
            label: string;
        }[];
        history: {
            id: string;
            createdAt: Date;
            data: import("@prisma/client/runtime/library").JsonValue | null;
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
    update(id: string, dto: UpdateStoreDto, req: AuthRequest): Promise<{
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
