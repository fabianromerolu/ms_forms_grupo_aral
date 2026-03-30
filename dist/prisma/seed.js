"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcrypt"));
const catalog_activities_data_1 = require("./catalog-activities-data");
const prisma = new client_1.PrismaClient();
const testUsers = [
    {
        fullName: 'Administrador Aral',
        email: 'admin@grupoaral.com',
        password: 'Admin123*',
        role: client_1.UserRole.ADMIN,
        document: '900000001',
        phone: '3001234567',
        city: 'Montería',
    },
    {
        fullName: 'Coordinador Aral',
        email: 'coordinador@grupoaral.com',
        password: 'Coord123*',
        role: client_1.UserRole.COORDINADOR,
        document: '900000002',
        phone: '3001234568',
        city: 'Montería',
    },
    {
        fullName: 'Operario Aral',
        email: 'operario@grupoaral.com',
        password: 'Oper123*',
        role: client_1.UserRole.OPERARIO,
        document: '900000003',
        phone: '3001234569',
        city: 'Montería',
    },
    {
        fullName: 'Supervisor Aral',
        email: 'supervisor@grupoaral.com',
        password: 'Super123*',
        role: client_1.UserRole.SUPERVISOR,
        document: '900000004',
        phone: '3001234570',
        city: 'Montería',
    },
];
async function main() {
    console.log('🌱 Seeding test users...');
    for (const u of testUsers) {
        const existing = await prisma.user.findUnique({ where: { email: u.email } });
        if (existing) {
            console.log(`  ⏭  ${u.email} already exists — skipping`);
            continue;
        }
        const hashed = await bcrypt.hash(u.password, 10);
        await prisma.user.create({ data: { ...u, password: hashed } });
        console.log(`  ✅  Created ${u.role}: ${u.email} / ${u.password}`);
    }
    console.log('\n🌱 Seeding catalog activities (722 rows from Excel)...');
    let count = 0;
    for (const a of catalog_activities_data_1.CATALOG_ACTIVITIES_SEED) {
        await prisma.catalogActivity.upsert({
            where: { code: a.code },
            update: {
                specialty: a.specialty,
                chapter: a.chapter,
                name: a.name,
                unit: a.unit ?? undefined,
                brandRef: a.brandRef ?? undefined,
                basePrice: a.basePrice ?? undefined,
            },
            create: {
                code: a.code,
                specialty: a.specialty,
                chapter: a.chapter,
                name: a.name,
                unit: a.unit ?? undefined,
                brandRef: a.brandRef ?? undefined,
                basePrice: a.basePrice ?? undefined,
            },
        });
        count++;
        if (count % 200 === 0)
            console.log(`  ✅  ${count} activities upserted...`);
    }
    console.log(`  ✅  ${count} catalog activities seeded`);
    console.log('\n✅ Seed complete');
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(() => void prisma.$disconnect());
//# sourceMappingURL=seed.js.map