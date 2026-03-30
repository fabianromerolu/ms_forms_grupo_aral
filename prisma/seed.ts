// prisma/seed.ts
import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { CATALOG_ACTIVITIES_SEED } from './catalog-activities-data';
import { STORES_SEED } from './stores-data';

const prisma = new PrismaClient();

const testUsers = [
  {
    fullName: 'Administrador Aral',
    email: 'admin@grupoaral.com',
    password: 'Admin123*',
    role: UserRole.ADMIN,
    document: '900000001',
    phone: '3001234567',
    city: 'Montería',
  },
  {
    fullName: 'Coordinador Aral',
    email: 'coordinador@grupoaral.com',
    password: 'Coord123*',
    role: UserRole.COORDINADOR,
    document: '900000002',
    phone: '3001234568',
    city: 'Montería',
  },
  {
    fullName: 'Operario Aral',
    email: 'operario@grupoaral.com',
    password: 'Oper123*',
    role: UserRole.OPERARIO,
    document: '900000003',
    phone: '3001234569',
    city: 'Montería',
  },
  {
    fullName: 'Supervisor Aral',
    email: 'supervisor@grupoaral.com',
    password: 'Super123*',
    role: UserRole.SUPERVISOR,
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
  for (const a of CATALOG_ACTIVITIES_SEED) {
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
    if (count % 200 === 0) console.log(`  ✅  ${count} activities upserted...`);
  }
  console.log(`  ✅  ${count} catalog activities seeded`);

  console.log('\n🌱 Seeding stores (1169 rows from Excel)...');

  let storeCount = 0;
  for (const s of STORES_SEED) {
    await prisma.tienda.upsert({
      where: { storeCode: s.storeCode },
      update: {
        storeName: s.storeName,
        address: s.address,
        department: s.department,
        city: s.city,
        neighborhood: s.neighborhood,
        phone: s.phone,
        regional: s.regional,
      },
      create: {
        storeCode: s.storeCode,
        storeName: s.storeName,
        address: s.address,
        department: s.department,
        city: s.city,
        neighborhood: s.neighborhood,
        phone: s.phone,
        regional: s.regional,
        responsibleName: s.responsibleName,
        responsiblePhone: s.responsiblePhone,
        responsibleEmail: s.responsibleEmail,
      },
    });
    storeCount++;
    if (storeCount % 200 === 0) console.log(`  ✅  ${storeCount} stores upserted...`);
  }
  console.log(`  ✅  ${storeCount} stores seeded`);

  console.log('\n✅ Seed complete');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => void prisma.$disconnect());
