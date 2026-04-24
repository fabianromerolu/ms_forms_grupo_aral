// prisma/migrate-data.js
// Ejecutar: node prisma/migrate-data.js
// Tareas:
//   1. Upsert Tipologia records para cada ciudad en tiendas.xlsx
//   2. Actualizar Tienda.typology para todas las tiendas
//   3. Eliminar todas las CatalogActivity y re-insertar desde actividades.xlsx

const { PrismaClient } = require('@prisma/client');
const XLSX = require('xlsx');
const path = require('path');

const prisma = new PrismaClient();

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toSlug(name) {
  return name
    .toString()
    .toUpperCase()
    .trim()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')  // remove diacritics
    .replace(/[^A-Z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function normalizeTipologia(raw) {
  if (!raw) return null;
  const v = raw.toString().trim().toLowerCase();
  if (v.includes('ciudad') || v.includes('principal')) return 'Ciudad principal';
  if (v.includes('dificil') || v.includes('difícil') || v.includes('acceso')) return 'Difícil acceso';
  if (v.includes('intermedia')) return 'Intermedia';
  return null;
}

function tipologiaToCategory(tip) {
  if (!tip) return 'INTERMEDIA';
  if (tip === 'Ciudad principal') return 'CIUDAD_PRINCIPAL';
  if (tip === 'Difícil acceso') return 'DIFICIL_ACCESO';
  return 'INTERMEDIA';
}

function defaultPrice(category) {
  if (category === 'CIUDAD_PRINCIPAL') return 0;
  if (category === 'DIFICIL_ACCESO') return 400000;
  return 165000;
}

function padNum(n, len = 3) {
  return String(n).padStart(len, '0');
}

// ─── 1. Tipologías ─────────────────────────────────────────────────────────────

async function migrateTipologias() {
  console.log('\n=== TIPOLOGÍAS ===');

  const wb = XLSX.readFile('C:/Users/FROMERO/Desktop/tiendas.xlsx');
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

  // Build city → canonical tipología map (last seen wins)
  const cityTipMap = {};
  for (const row of rows) {
    const city = row.city ? row.city.toString().trim().toUpperCase() : null;
    const tip = normalizeTipologia(row.tipologia);
    if (city && tip) {
      cityTipMap[city] = tip;
    }
  }

  const uniqueCities = Object.entries(cityTipMap);
  console.log(`Ciudades únicas con tipología en Excel: ${uniqueCities.length}`);

  // Load all existing tipologías for reference (to preserve unitPrice)
  const existing = await prisma.tipologia.findMany({
    select: { code: true, unitPrice: true, category: true },
  });
  const existingByCode = {};
  for (const e of existing) existingByCode[e.code] = e;

  let created = 0;
  let updated = 0;

  for (const [city, tip] of uniqueCities) {
    const slug = toSlug(city);
    const code = `AUTO-TYP-${slug}`;
    const category = tipologiaToCategory(tip);
    const existingRecord = existingByCode[code];
    const unitPrice = existingRecord ? existingRecord.unitPrice : defaultPrice(category);

    await prisma.tipologia.upsert({
      where: { code },
      create: {
        code,
        name: city,
        description: `Tipología: ${tip}. Fuente: tiendas.xlsx`,
        category,
        unitPrice,
        unit: 'COP',
        isActive: true,
      },
      update: {
        name: city,
        description: `Tipología: ${tip}. Fuente: tiendas.xlsx`,
        category,
      },
    });

    if (existingRecord) {
      updated++;
    } else {
      created++;
    }
  }

  console.log(`  Creadas: ${created} | Actualizadas: ${updated}`);
  return cityTipMap;
}

// ─── 2. Actualizar Tienda.typology ────────────────────────────────────────────

async function updateTiendas(cityTipMap) {
  console.log('\n=== TIENDAS → TIPOLOGÍA ===');

  const tiendas = await prisma.tienda.findMany({
    select: { id: true, city: true, typology: true, storeCode: true },
  });

  let updated = 0;
  let noMatch = 0;

  for (const tienda of tiendas) {
    const city = tienda.city ? tienda.city.toString().trim().toUpperCase() : null;
    const tip = city ? cityTipMap[city] : null;

    if (tip && tienda.typology !== tip) {
      await prisma.tienda.update({
        where: { id: tienda.id },
        data: { typology: tip },
      });
      updated++;
    } else if (!tip) {
      noMatch++;
    }
  }

  console.log(`  Tiendas actualizadas: ${updated} | Sin match: ${noMatch}`);
}

// ─── 3. CatalogActivity re-seed ───────────────────────────────────────────────

async function reseedActivities() {
  console.log('\n=== CATALOG ACTIVITIES ===');

  const wb = XLSX.readFile('C:/Users/FROMERO/Desktop/actividades.xlsx');

  const activities = [];

  // Sheet 1: CIVIL-LOCATIVO
  const civSheet = wb.Sheets['2.1.1-CIVIL-LOCATIVO'];
  const civRaw = XLSX.utils.sheet_to_json(civSheet, { defval: '', header: 1 });
  for (const row of civRaw) {
    if (typeof row[0] !== 'number') continue;
    const item = row[0];
    const chapter = row[1] ? String(row[1]).trim() : 'no aplica';
    const name = row[2] ? String(row[2]).trim() : '';
    const unit = row[3] ? String(row[3]).trim() : 'no aplica';
    const brandRef = row[4] ? String(row[4]).trim() || null : null;
    const basePrice = typeof row[5] === 'number' ? row[5] : null;
    if (!name) continue;
    activities.push({
      code: `ACT-CIV-LOC-${padNum(item)}`,
      specialty: 'civil locativo',
      chapter: chapter || 'no aplica',
      name,
      unit: unit || 'no aplica',
      brandRef: brandRef || null,
      basePrice: basePrice ?? null,
    });
  }
  console.log(`  Civil-Locativo: ${activities.length} actividades`);

  const eleStart = activities.length;
  // Sheet 2: ELÉCTRICO
  const eleSheet = wb.Sheets['2.1.2-ELÉCTRICO'];
  const eleRaw = XLSX.utils.sheet_to_json(eleSheet, { defval: '', header: 1 });
  for (const row of eleRaw) {
    if (typeof row[0] !== 'number') continue;
    const item = row[0];
    const chapter = row[1] ? String(row[1]).trim() : 'no aplica';
    const name = row[2] ? String(row[2]).trim() : '';
    const unit = row[3] ? String(row[3]).trim() : 'no aplica';
    const brandRef = row[4] ? String(row[4]).trim() || null : null;
    const basePrice = typeof row[5] === 'number' ? row[5] : null;
    if (!name) continue;
    activities.push({
      code: `ACT-ELE-${padNum(item)}`,
      specialty: 'electrico',
      chapter: chapter || 'no aplica',
      name,
      unit: unit || 'no aplica',
      brandRef: brandRef || null,
      basePrice: basePrice ?? null,
    });
  }
  console.log(`  Eléctrico: ${activities.length - eleStart} actividades`);

  const metStart = activities.length;
  // Sheet 3: METALMECÁNICOS
  const metSheet = wb.Sheets['2.1.3-METALMECÁNICOS'];
  const metRaw = XLSX.utils.sheet_to_json(metSheet, { defval: '', header: 1 });
  for (const row of metRaw) {
    if (typeof row[0] !== 'number') continue;
    const item = row[0];
    const chapter = row[1] ? String(row[1]).trim() : 'no aplica';
    const name = row[2] ? String(row[2]).trim() : '';
    const unit = row[3] ? String(row[3]).trim() : 'no aplica';
    const brandRef = row[4] ? String(row[4]).trim() || null : null;
    const basePrice = typeof row[5] === 'number' ? row[5] : null;
    if (!name) continue;
    activities.push({
      code: `ACT-MET-${padNum(item)}`,
      specialty: 'metalmecanico',
      chapter: chapter || 'no aplica',
      name,
      unit: unit || 'no aplica',
      brandRef: brandRef || null,
      basePrice: basePrice ?? null,
    });
  }
  console.log(`  Metalmecánicos: ${activities.length - metStart} actividades`);

  const repStart = activities.length;
  // Sheet 4: REPUESTOS AVISOS (estructura diferente)
  const repSheet = wb.Sheets['2.1.4- REPUESTOS AVISOS'];
  const repRaw = XLSX.utils.sheet_to_json(repSheet, { defval: '', header: 1 });
  for (const row of repRaw) {
    if (typeof row[0] !== 'number') continue;
    const item = row[0];
    const repuesto = row[1] ? String(row[1]).trim() : '';
    const desc = row[2] ? String(row[2]).trim() : '';
    const brand = row[3] ? String(row[3]).trim() || null : null;
    const basePrice = typeof row[4] === 'number' ? row[4] : null;
    const name = [repuesto, desc].filter(Boolean).join(' - ');
    if (!name) continue;
    activities.push({
      code: `ACT-REP-${padNum(item)}`,
      specialty: 'repuestos avisos',
      chapter: 'no aplica',
      name,
      unit: 'no aplica',
      brandRef: brand || null,
      basePrice: basePrice ?? null,
    });
  }
  console.log(`  Repuestos Avisos: ${activities.length - repStart} actividades`);
  console.log(`  TOTAL a insertar: ${activities.length}`);

  // Delete all existing
  const deleted = await prisma.catalogActivity.deleteMany();
  console.log(`  Eliminadas: ${deleted.count} actividades previas`);

  // Batch insert
  const BATCH = 100;
  let inserted = 0;
  for (let i = 0; i < activities.length; i += BATCH) {
    const batch = activities.slice(i, i + BATCH);
    await prisma.catalogActivity.createMany({ data: batch, skipDuplicates: true });
    inserted += batch.length;
  }
  console.log(`  Insertadas: ${inserted}`);
}

// ─── 4. Verificación ─────────────────────────────────────────────────────────

async function verify() {
  console.log('\n=== VERIFICACIÓN ===');

  const totalTip = await prisma.tipologia.count();
  const totalAct = await prisma.catalogActivity.count();
  const totalTiendas = await prisma.tienda.count();
  const tiendaConTip = await prisma.tienda.count({ where: { typology: { not: null } } });

  console.log(`Tipologías en DB: ${totalTip}`);
  console.log(`CatalogActivities en DB: ${totalAct}`);
  console.log(`Tiendas total: ${totalTiendas} | con tipología: ${tiendaConTip} | sin: ${totalTiendas - tiendaConTip}`);

  // Check activities per specialty
  const bySpecialty = await prisma.catalogActivity.groupBy({
    by: ['specialty'],
    _count: { id: true },
  });
  console.log('Actividades por especialidad:');
  for (const s of bySpecialty) {
    console.log(`  ${s.specialty}: ${s._count.id}`);
  }

  // Check tipologías por categoría
  const byCategory = await prisma.tipologia.groupBy({
    by: ['category'],
    _count: { id: true },
  });
  console.log('Tipologías por categoría:');
  for (const c of byCategory) {
    console.log(`  ${c.category}: ${c._count.id}`);
  }

  // Sample cities without typology
  const sinTip = await prisma.tienda.findMany({
    where: { typology: null },
    select: { storeCode: true, city: true },
    take: 10,
  });
  if (sinTip.length > 0) {
    console.log('Tiendas SIN tipología (muestra):');
    sinTip.forEach(t => console.log(`  ${t.storeCode} | ${t.city}`));
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  try {
    const cityTipMap = await migrateTipologias();
    await updateTiendas(cityTipMap);
    await reseedActivities();
    await verify();
    console.log('\n✓ Migración completada');
  } catch (e) {
    console.error('ERROR:', e.message);
    console.error(e.stack);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
