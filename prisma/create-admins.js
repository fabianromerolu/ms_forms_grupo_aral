// prisma/create-admins.js
// Run with: node prisma/create-admins.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

const admins = [
  { fullName: 'Admin Aral Uno',   email: 'admin1@grupoaral.com', password: 'Aral@Admin1!' },
  { fullName: 'Admin Aral Dos',   email: 'admin2@grupoaral.com', password: 'Aral@Admin2!' },
  { fullName: 'Admin Aral Tres',  email: 'admin3@grupoaral.com', password: 'Aral@Admin3!' },
];

async function main() {
  for (const admin of admins) {
    const existing = await prisma.user.findUnique({ where: { email: admin.email } });
    if (existing) {
      console.log(`Ya existe: ${admin.email}`);
      continue;
    }
    const hashed = await bcrypt.hash(admin.password, 10);
    const user = await prisma.user.create({
      data: {
        fullName: admin.fullName,
        email: admin.email,
        password: hashed,
        role: 'ADMIN',
        status: 'ACTIVE',
      },
    });
    console.log(`✓ Creado: ${user.email} (id: ${user.id})`);
  }
  console.log('\nCredenciales de los 3 admins:');
  for (const admin of admins) {
    console.log(`  ${admin.email}  →  ${admin.password}`);
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
