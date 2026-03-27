// prisma/seed.ts
import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

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

  console.log('✅ Seed complete');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => void prisma.$disconnect());
