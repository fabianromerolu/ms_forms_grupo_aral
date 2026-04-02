require("dotenv").config();

const { execFileSync } = require("node:child_process");
const path = require("node:path");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const DEFAULT_EXCEL_PATH = process.argv[2]
  ? path.resolve(process.argv[2])
  : "C:\\Users\\FROMERO\\Desktop\\Datos Entidades.xlsx";

const TRANSFER_MATRIX = {
  sabana: {
    CIUDAD_PRINCIPAL: 0,
    INTERMEDIA: 165000,
    DIFICIL_ACCESO: 554000,
  },
  "antioquia norte": {
    CIUDAD_PRINCIPAL: 0,
    INTERMEDIA: 172000,
    DIFICIL_ACCESO: 304000,
  },
  "antioquia oriente": {
    CIUDAD_PRINCIPAL: 0,
    INTERMEDIA: 172000,
    DIFICIL_ACCESO: 364000,
  },
  "antioquia sur": {
    CIUDAD_PRINCIPAL: 0,
    INTERMEDIA: 159000,
    DIFICIL_ACCESO: 265000,
  },
  barranquilla: {
    CIUDAD_PRINCIPAL: 0,
    INTERMEDIA: 169000,
    DIFICIL_ACCESO: 0,
  },
  santander: {
    CIUDAD_PRINCIPAL: 0,
    INTERMEDIA: 153000,
    DIFICIL_ACCESO: 446000,
  },
  ibague: {
    CIUDAD_PRINCIPAL: 0,
    INTERMEDIA: 178000,
    DIFICIL_ACCESO: 329000,
  },
  valledupar: {
    CIUDAD_PRINCIPAL: 0,
    INTERMEDIA: 170000,
    DIFICIL_ACCESO: 387000,
  },
};

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function slugify(value) {
  return normalizeText(value)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function mapCategory(value) {
  const normalized = normalizeText(value);
  if (!normalized) return null;
  if (normalized.includes("dificil")) return "DIFICIL_ACCESO";
  if (normalized.includes("intermedia")) return "INTERMEDIA";
  if (normalized.includes("principal")) return "CIUDAD_PRINCIPAL";
  return null;
}

function createCode(city, usedCodes) {
  const base = `AUTO-TYP-${slugify(city).toUpperCase().slice(0, 36) || "CITY"}`;
  let code = base;
  let index = 2;

  while (usedCodes.has(code)) {
    code = `${base}-${index}`;
    index += 1;
  }

  usedCodes.add(code);
  return code;
}

function loadExcelRows(excelPath) {
  const pythonScript = `
import json
import openpyxl
import sys

path = sys.argv[1]
ws = openpyxl.load_workbook(path, data_only=True)['entidad']
rows = []
for row in ws.iter_rows(min_row=2, values_only=True):
    rows.append({
        "store_code": row[1],
        "store_name": row[2],
        "department": row[4],
        "city": row[5],
        "typology": row[6],
        "state": row[10],
        "regional": row[14],
    })
print(json.dumps(rows, ensure_ascii=False))
`;

  const raw = execFileSync("python", ["-c", pythonScript, excelPath], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });

  return JSON.parse(raw);
}

function pickDominantValue(items, getter) {
  const counter = new Map();

  for (const item of items) {
    const value = getter(item);
    if (!value) continue;
    const key = normalizeText(value);
    if (!key) continue;

    const current = counter.get(key) || {
      count: 0,
      value,
    };
    current.count += 1;
    if (String(value).length > String(current.value).length) {
      current.value = value;
    }
    counter.set(key, current);
  }

  return [...counter.values()].sort((a, b) => b.count - a.count)[0]?.value || "";
}

function buildCitySources(rows) {
  const groupedByCity = new Map();

  for (const row of rows) {
    const city = String(row.city || "").trim();
    const department = String(row.department || "").trim();
    const regional = String(row.regional || "").trim();
    const category = mapCategory(row.typology);
    const state = normalizeText(row.state);
    const cityKey = normalizeText(city);

    if (!cityKey || !regional || !category) continue;
    if (state && state !== "activo") continue;

    const bucket = groupedByCity.get(cityKey) || [];
    bucket.push({
      city,
      department,
      regional,
      category,
      storeCode: row.store_code,
      storeName: row.store_name,
    });
    groupedByCity.set(cityKey, bucket);
  }

  const resolved = [];
  const conflicts = [];
  const missingTransferValues = [];

  for (const [cityKey, items] of groupedByCity.entries()) {
    const combos = new Map();

    for (const item of items) {
      const regionalKey = normalizeText(item.regional);
      const comboKey = `${item.category}__${regionalKey}`;
      const current = combos.get(comboKey) || {
        count: 0,
        category: item.category,
        regional: item.regional,
        regionalKey,
        items: [],
      };
      current.count += 1;
      current.items.push(item);
      combos.set(comboKey, current);
    }

    const sortedCombos = [...combos.values()].sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;

      const transferA =
        TRANSFER_MATRIX[a.regionalKey]?.[a.category] ?? Number.MIN_SAFE_INTEGER;
      const transferB =
        TRANSFER_MATRIX[b.regionalKey]?.[b.category] ?? Number.MIN_SAFE_INTEGER;

      if (transferB !== transferA) return transferB - transferA;
      return a.regional.localeCompare(b.regional, "es-CO");
    });

    const winner = sortedCombos[0];
    const dominantItems = winner.items;
    const city = pickDominantValue(dominantItems, (item) => item.city);
    const department = pickDominantValue(dominantItems, (item) => item.department);
    const transferValue = TRANSFER_MATRIX[winner.regionalKey]?.[winner.category];

    if (sortedCombos.length > 1) {
      conflicts.push({
        city,
        options: sortedCombos.map((combo) => ({
          regional: combo.regional,
          category: combo.category,
          count: combo.count,
        })),
        selected: {
          regional: winner.regional,
          category: winner.category,
          count: winner.count,
        },
      });
    }

    if (transferValue === undefined) {
      missingTransferValues.push({
        city,
        regional: winner.regional,
        category: winner.category,
      });
      continue;
    }

    resolved.push({
      cityKey,
      city,
      department,
      regional: winner.regional,
      regionalKey: winner.regionalKey,
      category: winner.category,
      transferValue,
      storesCount: items.length,
    });
  }

  return { resolved, conflicts, missingTransferValues };
}

async function main() {
  const excelRows = loadExcelRows(DEFAULT_EXCEL_PATH);
  const { resolved, conflicts, missingTransferValues } = buildCitySources(excelRows);

  const existing = await prisma.tipologia.findMany({
    where: {},
    orderBy: [{ isActive: "desc" }, { createdAt: "asc" }],
  });

  const existingByCity = new Map();
  const usedCodes = new Set(existing.map((item) => item.code));

  for (const record of existing) {
    const key = normalizeText(record.name);
    if (!key) continue;

    const bucket = existingByCity.get(key) || [];
    bucket.push(record);
    existingByCity.set(key, bucket);
  }

  let created = 0;
  let updated = 0;
  let reactivated = 0;
  let deactivatedDuplicates = 0;
  let deactivatedOutOfSource = 0;
  const skipped = [];

  for (const source of resolved) {
    const matches = existingByCity.get(source.cityKey) || [];
    const primary = matches[0];
    const duplicates = matches.slice(1);
    const description = `Regional dominante: ${source.regional}. Departamento dominante: ${source.department || "Sin dato"}. Fuente: Datos Entidades.xlsx. Tiendas activas detectadas: ${source.storesCount}.`;
    const nextData = {
      name: source.city,
      category: source.category,
      description,
      unitPrice: source.transferValue,
      unit: "COP",
      isActive: true,
    };

    if (primary) {
      const needsUpdate =
        primary.name !== nextData.name ||
        primary.category !== nextData.category ||
        primary.description !== nextData.description ||
        primary.unitPrice !== nextData.unitPrice ||
        primary.unit !== nextData.unit ||
        primary.isActive !== nextData.isActive;

      if (needsUpdate) {
        await prisma.tipologia.update({
          where: { id: primary.id },
          data: nextData,
        });
        updated += 1;
        if (!primary.isActive) reactivated += 1;
      }

      for (const duplicate of duplicates) {
        if (duplicate.isActive) {
          await prisma.tipologia.update({
            where: { id: duplicate.id },
            data: { isActive: false },
          });
          deactivatedDuplicates += 1;
        }
      }

      continue;
    }

    try {
      await prisma.tipologia.create({
        data: {
          code: createCode(source.city, usedCodes),
          ...nextData,
        },
      });
      created += 1;
    } catch (error) {
      skipped.push({
        city: source.city,
        reason: error instanceof Error ? error.message : String(error),
      });
    }
  }

  const sourceCityKeys = new Set(resolved.map((item) => item.cityKey));
  const activeOutOfSource = existing.filter(
    (item) => item.isActive && !sourceCityKeys.has(normalizeText(item.name))
  );

  for (const stale of activeOutOfSource) {
    await prisma.tipologia.update({
      where: { id: stale.id },
      data: { isActive: false },
    });
    deactivatedOutOfSource += 1;
  }

  const summary = {
    excelPath: DEFAULT_EXCEL_PATH,
    rowsRead: excelRows.length,
    citiesResolved: resolved.length,
    created,
    updated,
    reactivated,
    deactivatedDuplicates,
    deactivatedOutOfSource,
    conflictsDetected: conflicts.length,
    missingTransferValues,
    sampleConflicts: conflicts.slice(0, 15),
    skipped,
  };

  console.log(JSON.stringify(summary, null, 2));
}

main()
  .catch((error) => {
    console.error(
      JSON.stringify(
        {
          ok: false,
          message: error instanceof Error ? error.message : String(error),
        },
        null,
        2
      )
    );
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
