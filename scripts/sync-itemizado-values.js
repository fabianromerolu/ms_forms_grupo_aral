require("dotenv").config();

const path = require("node:path");
const XLSX = require("xlsx");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const DEFAULT_EXCEL_PATH = "C:\\Users\\FROMERO\\Desktop\\itemizado mantenimiento.xlsx";
const excelPath = process.argv[2] ? path.resolve(process.argv[2]) : DEFAULT_EXCEL_PATH;

const CATEGORY_LABELS = {
  CIUDAD_PRINCIPAL: "Ciudad principal",
  INTERMEDIA: "Intermedia",
  DIFICIL_ACCESO: "Difícil acceso",
};

const REGIONAL_ALIASES = new Map([
  ["REGIONAL SABANA", "SAB"],
  ["SABANA", "SAB"],
  ["ANTIOQUIA NORTE", "ATN"],
  ["ANTIOQUIA ORIENTE", "ATO"],
  ["ANTIOQUIA SUR", "ATS"],
  ["BARRANQUILLA Y COSTA ATLANTICA", "BAQ"],
  ["BARRANQUILLA COSTA ATLANTICA", "BAQ"],
  ["IBAGUE", "IBA"],
  ["REGIONAL SANTANDER", "SAN"],
  ["SANTANDER", "SAN"],
  ["VALLEDUPAR", "VDU"],
]);

const ACTIVITY_SHEETS = [
  {
    match: "CIVIL LOCATIVO",
    prefix: "ACT-CIV-LOC",
    specialty: "civil locativo",
    defaultChapter: "LOCATIVOS",
    type: "standard",
  },
  {
    match: "ELECTRICO",
    prefix: "ACT-ELE",
    specialty: "electrico",
    defaultChapter: "ELECTRICOS",
    type: "standard",
  },
  {
    match: "METALMECANICOS",
    prefix: "ACT-MET",
    specialty: "metalmecanico",
    defaultChapter: "METALMECANICOS",
    type: "standard",
  },
  {
    match: "REPUESTOS AVISOS",
    prefix: "ACT-REP",
    specialty: "repuestos avisos",
    defaultChapter: "no aplica",
    type: "repuestos",
  },
];

function cleanText(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function normalizeText(value) {
  return cleanText(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, " ")
    .trim();
}

function slugify(value) {
  return normalizeText(value).replace(/\s+/g, "-").replace(/^-+|-+$/g, "");
}

function categoryFromLabel(value) {
  const normalized = normalizeText(value);
  if (normalized.includes("DIFICIL")) return "DIFICIL_ACCESO";
  if (normalized.includes("INTERMEDIA")) return "INTERMEDIA";
  if (normalized.includes("PRINCIPAL")) return "CIUDAD_PRINCIPAL";
  return null;
}

function regionalCode(value) {
  const normalized = normalizeText(value);
  return REGIONAL_ALIASES.get(normalized) || normalized;
}

function parseMoney(value) {
  if (value == null || value === "") return null;
  if (typeof value === "number") return Number.isFinite(value) ? Math.round(value) : null;

  const cleaned = String(value).replace(/\s+/g, "").replace(/[^\d.,-]/g, "");
  if (!cleaned || !/\d/.test(cleaned)) return null;

  const sign = cleaned.startsWith("-") ? -1 : 1;
  const unsigned = cleaned.replace(/-/g, "");
  const comma = unsigned.lastIndexOf(",");
  const dot = unsigned.lastIndexOf(".");
  let normalized = unsigned;

  if (comma >= 0 && dot >= 0) {
    const decimalSeparator = comma > dot ? "," : ".";
    const thousandSeparator = decimalSeparator === "," ? "." : ",";
    normalized = unsigned
      .replace(new RegExp(`\\${thousandSeparator}`, "g"), "")
      .replace(decimalSeparator, ".");
  } else if (comma >= 0) {
    const parts = unsigned.split(",");
    normalized =
      parts.length > 1 && parts.slice(1).every((part) => part.length === 3)
        ? parts.join("")
        : unsigned.replace(/\./g, "").replace(",", ".");
  } else if (dot >= 0) {
    const parts = unsigned.split(".");
    normalized =
      parts.length > 1 && parts.slice(1).every((part) => part.length === 3)
        ? parts.join("")
        : unsigned;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? Math.round(parsed * sign) : null;
}

function findSheetName(workbook, expected) {
  const normalizedExpected = normalizeText(expected);
  const name = workbook.SheetNames.find((sheetName) =>
    normalizeText(sheetName).includes(normalizedExpected)
  );
  if (!name) throw new Error(`No se encontró la hoja "${expected}"`);
  return name;
}

function worksheetRows(workbook, expected) {
  const sheetName = findSheetName(workbook, expected);
  return XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
    header: 1,
    defval: null,
    raw: true,
    blankrows: false,
  });
}

function itemCode(prefix, value) {
  const n = Number(String(value ?? "").replace(/[^\d]/g, ""));
  if (!Number.isFinite(n) || n <= 0) return null;
  return `${prefix}-${String(Math.trunc(n)).padStart(3, "0")}`;
}

function parseActivities(workbook) {
  const activities = [];

  for (const config of ACTIVITY_SHEETS) {
    const rows = worksheetRows(workbook, config.match);
    let currentChapter = config.defaultChapter;

    for (const row of rows) {
      const code = itemCode(config.prefix, row[0]);
      if (!code) {
        const possibleChapter = cleanText(row[1]);
        if (possibleChapter && !cleanText(row[2])) currentChapter = possibleChapter;
        continue;
      }

      if (config.type === "repuestos") {
        const repuesto = cleanText(row[1]);
        const description = cleanText(row[2]);
        const price = parseMoney(row[4]);
        if (!repuesto || price == null) continue;

        activities.push({
          code,
          specialty: config.specialty,
          chapter: config.defaultChapter,
          name: [repuesto, description].filter(Boolean).join(" - "),
          unit: "UND",
          brandRef: cleanText(row[3]) || null,
          basePrice: price,
        });
        continue;
      }

      const chapter = cleanText(row[1]) || currentChapter || config.defaultChapter;
      const name = cleanText(row[2]);
      const price = parseMoney(row[5]);
      if (!name || price == null) continue;

      activities.push({
        code,
        specialty: config.specialty,
        chapter,
        name,
        unit: cleanText(row[3]) || "UND",
        brandRef: cleanText(row[4]) || null,
        basePrice: price,
      });
    }
  }

  return activities;
}

function parseTransferCosts(workbook) {
  const rows = worksheetRows(workbook, "COSTOS DE TRASLADOS");
  const costs = new Map();
  let currentRegional = "";

  for (const row of rows.slice(1)) {
    const regionalCell = cleanText(row[0]);
    if (regionalCell && !/^TOTAL/i.test(regionalCell)) {
      currentRegional = regionalCode(regionalCell);
    }

    const category = categoryFromLabel(row[1]);
    if (!currentRegional || !category) continue;

    costs.set(`${currentRegional}|${category}`, parseMoney(row[3]) ?? 0);
  }

  return costs;
}

function parseTypologies(workbook) {
  const costs = parseTransferCosts(workbook);
  const rows = worksheetRows(workbook, "TIPOLOGIA");
  const typologies = [];

  for (const row of rows.slice(2)) {
    const regional = regionalCode(row[0]);
    const category = categoryFromLabel(row[1]);
    const department = cleanText(row[2]);
    const city = cleanText(row[3]);
    if (!regional || !category || !department || !city) continue;

    const unitPrice = costs.get(`${regional}|${category}`);
    if (unitPrice == null) {
      throw new Error(
        `No hay costo de traslado para regional ${regional} y categoría ${category}`
      );
    }

    typologies.push({
      city,
      department,
      regional,
      category,
      unitPrice,
      unit: "COP",
    });
  }

  return typologies;
}

function buildTypologyCodes(rows) {
  const cityCounts = new Map();
  const codeCounts = new Map();

  for (const row of rows) {
    const cityKey = normalizeText(row.city);
    cityCounts.set(cityKey, (cityCounts.get(cityKey) || 0) + 1);
  }

  return rows.map((row) => {
    const citySlug = slugify(row.city).slice(0, 36) || "CITY";
    const departmentSlug = slugify(row.department).slice(0, 18);
    const isUniqueCity = cityCounts.get(normalizeText(row.city)) === 1;
    let base = `AUTO-TYP-${citySlug}`;

    if (!isUniqueCity) {
      base = `AUTO-TYP-${citySlug}-${row.regional}`;
      if (departmentSlug) base = `${base}-${departmentSlug}`;
    }

    const seen = codeCounts.get(base) || 0;
    codeCounts.set(base, seen + 1);

    return {
      ...row,
      code: seen ? `${base}-${seen + 1}` : base,
    };
  });
}

function typologyDescription(row) {
  return [
    `Tipología: ${CATEGORY_LABELS[row.category]}.`,
    `Departamento: ${row.department}.`,
    `Regional: ${row.regional}.`,
    "Fuente: itemizado mantenimiento.xlsx",
  ].join(" ");
}

function sameNullableText(a, b) {
  return (a || null) === (b || null);
}

function sameNumber(a, b) {
  return Number(a ?? 0) === Number(b ?? 0);
}

async function runInChunks(operations, size = 50) {
  for (let i = 0; i < operations.length; i += size) {
    await prisma.$transaction(operations.slice(i, i + size));
  }
}

async function syncActivities(activities) {
  const existing = new Map(
    (
      await prisma.catalogActivity.findMany({
        select: {
          code: true,
          specialty: true,
          chapter: true,
          name: true,
          unit: true,
          brandRef: true,
          basePrice: true,
          isActive: true,
        },
      })
    ).map((item) => [item.code, item])
  );
  const operations = [];
  let created = 0;
  let updated = 0;
  let unchanged = 0;

  for (const activity of activities) {
    const current = existing.get(activity.code);
    if (!current) {
      created += 1;
      operations.push(
        prisma.catalogActivity.create({
          data: { ...activity, isActive: true },
        })
      );
      continue;
    }

    const changed =
      current.specialty !== activity.specialty ||
      current.chapter !== activity.chapter ||
      current.name !== activity.name ||
      !sameNullableText(current.unit, activity.unit) ||
      !sameNullableText(current.brandRef, activity.brandRef) ||
      !sameNumber(current.basePrice, activity.basePrice) ||
      current.isActive !== true;

    if (!changed) {
      unchanged += 1;
      continue;
    }

    updated += 1;
    operations.push(
      prisma.catalogActivity.update({
        where: { code: activity.code },
        data: { ...activity, isActive: true },
      })
    );
  }

  await runInChunks(operations);
  return { total: activities.length, created, updated, unchanged };
}

async function syncTypologies(typologyRows) {
  const typologies = buildTypologyCodes(typologyRows);
  const existing = new Map(
    (
      await prisma.tipologia.findMany({
        select: {
          code: true,
          name: true,
          description: true,
          category: true,
          unitPrice: true,
          unit: true,
          isActive: true,
        },
      })
    ).map((item) => [item.code, item])
  );
  const operations = [];
  let created = 0;
  let updated = 0;
  let unchanged = 0;

  for (const row of typologies) {
    const data = {
      name: row.city,
      description: typologyDescription(row),
      category: row.category,
      unitPrice: row.unitPrice,
      unit: row.unit,
      isActive: true,
    };
    const current = existing.get(row.code);

    if (!current) {
      created += 1;
      operations.push(
        prisma.tipologia.create({
          data: { code: row.code, ...data },
        })
      );
      continue;
    }

    const changed =
      current.name !== data.name ||
      current.description !== data.description ||
      current.category !== data.category ||
      !sameNumber(current.unitPrice, data.unitPrice) ||
      !sameNullableText(current.unit, data.unit) ||
      current.isActive !== true;

    if (!changed) {
      unchanged += 1;
      continue;
    }

    updated += 1;
    operations.push(
      prisma.tipologia.update({
        where: { code: row.code },
        data,
      })
    );
  }

  await runInChunks(operations);
  return { total: typologies.length, created, updated, unchanged };
}

function storeTypologyKey(city, department, regional) {
  return [
    normalizeText(city),
    normalizeText(department),
    regionalCode(regional),
  ].join("|");
}

async function syncStoreTypologies(typologyRows) {
  const typologyByStoreKey = new Map();
  const typologyByCityRegionalKey = new Map();

  for (const row of typologyRows) {
    typologyByStoreKey.set(
      storeTypologyKey(row.city, row.department, row.regional),
      CATEGORY_LABELS[row.category]
    );
    const cityRegionalKey = storeTypologyKey(row.city, "", row.regional);
    if (!typologyByCityRegionalKey.has(cityRegionalKey)) {
      typologyByCityRegionalKey.set(cityRegionalKey, CATEGORY_LABELS[row.category]);
    }
  }

  const stores = await prisma.tienda.findMany({
    select: {
      id: true,
      city: true,
      department: true,
      regional: true,
      typology: true,
    },
  });
  const operations = [];
  let updated = 0;
  let matched = 0;
  let missing = 0;

  for (const store of stores) {
    const nextTypology =
      typologyByStoreKey.get(
        storeTypologyKey(store.city, store.department, store.regional)
      ) ||
      typologyByCityRegionalKey.get(
        storeTypologyKey(store.city, "", store.regional)
      );

    if (!nextTypology) {
      missing += 1;
      continue;
    }

    matched += 1;
    if (store.typology === nextTypology) continue;

    updated += 1;
    operations.push(
      prisma.tienda.update({
        where: { id: store.id },
        data: { typology: nextTypology },
      })
    );
  }

  await runInChunks(operations);
  return { total: stores.length, matched, updated, missing };
}

async function main() {
  const workbook = XLSX.readFile(excelPath, { cellDates: false });
  const activities = parseActivities(workbook);
  const typologies = parseTypologies(workbook);

  const activityResult = await syncActivities(activities);
  const typologyResult = await syncTypologies(typologies);
  const storeResult = await syncStoreTypologies(typologies);

  console.log(
    JSON.stringify(
      {
        excelPath,
        activities: activityResult,
        typologies: typologyResult,
        stores: storeResult,
      },
      null,
      2
    )
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
