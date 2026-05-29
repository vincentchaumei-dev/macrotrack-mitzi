import fs from "node:fs";
import path from "node:path";
import XLSX from "xlsx";

const inputPath = process.argv[2];

if (!inputPath) {
  console.error("Usage: npm run import-ciqual -- data-source/ciqual.xlsx");
  process.exit(1);
}

if (!fs.existsSync(inputPath)) {
  console.error(`Fichier introuvable : ${inputPath}`);
  process.exit(1);
}

const outputPath = path.join(
  process.cwd(),
  "src",
  "data",
  "ciqualFoods.generated.ts"
);

function normalizeText(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

function slugify(value) {
  return normalizeText(value)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function parseNutritionNumber(value) {
  if (value === null || value === undefined) return null;

  const raw = String(value).trim();

  if (!raw) return null;
  if (raw === "-") return null;
  if (raw.toLowerCase().includes("traces")) return null;
  if (raw.toLowerCase().includes("nd")) return null;
  if (raw.toLowerCase().includes("non determine")) return null;

  const cleaned = raw
    .replace(",", ".")
    .replace(/\s/g, "")
    .replace("<", "");

  const match = cleaned.match(/-?\d+(\.\d+)?/);

  if (!match) return null;

  const parsed = Number(match[0]);

  if (Number.isNaN(parsed)) return null;

  return Math.round(parsed * 100) / 100;
}

function findHeaderRow(rows) {
  return rows.findIndex((row) => {
    const normalizedCells = row.map(normalizeText);

    const hasFoodName = normalizedCells.some(
      (cell) =>
        cell.includes("alim_nom_fr") ||
        cell.includes("alim nom fr") ||
        (cell.includes("nom") && cell.includes("fr"))
    );

    const hasEnergy = normalizedCells.some(
      (cell) => cell.includes("energie") && cell.includes("kcal")
    );

    const hasProtein = normalizedCells.some(
      (cell) => cell.includes("proteine") || cell.includes("proteines")
    );

    return hasFoodName && hasEnergy && hasProtein;
  });
}

function findColumn(headers, tests) {
  return headers.find((header) => {
    const normalized = normalizeText(header);
    return tests.some((test) => test(normalized));
  });
}

function getExactColumn(headers, exactName) {
    const normalizedExactName = normalizeText(exactName);
  
    return headers.find((header) => normalizeText(header) === normalizedExactName);
  }
  
  function detectColumns(headers) {
    const codeColumn = getExactColumn(headers, "alim_code");
    const nameColumn = getExactColumn(headers, "alim_nom_fr");
    const categoryColumn = getExactColumn(headers, "alim_grp_nom_fr");
    const subcategoryColumn = getExactColumn(headers, "alim_ssgrp_nom_fr");
  
    const caloriesColumn = findColumn(headers, [
      (h) => h.includes("energie") && h.includes("kcal") && h.includes("1169"),
      (h) => h.includes("energie") && h.includes("kcal"),
    ]);
  
    const proteinColumn = findColumn(headers, [
      (h) => h.includes("proteines") && h.includes("jones"),
      (h) => h.includes("proteines"),
      (h) => h.includes("proteine"),
    ]);
  
    const carbsColumn = findColumn(headers, [
      (h) => h.includes("glucides"),
    ]);
  
    const fatColumn = findColumn(headers, [
      (h) => h.includes("lipides"),
    ]);
  
    const saturatedFatColumn = findColumn(headers, [
      (h) => h.includes("acides gras satures"),
      (h) => h.includes("gras satures"),
      (h) => h.includes("satures"),
    ]);
  
    const sugarColumn = findColumn(headers, [
      (h) => h.includes("sucres"),
    ]);
  
    const fiberColumn = findColumn(headers, [
      (h) => h.includes("fibres"),
      (h) => h.includes("fibre"),
    ]);
  
    const saltColumn = findColumn(headers, [
      (h) => h.includes("sel chlorure de sodium"),
      (h) => h.includes("sel") && !h.includes("selenium"),
    ]);
  
    return {
      codeColumn,
      nameColumn,
      categoryColumn,
      subcategoryColumn,
      caloriesColumn,
      proteinColumn,
      carbsColumn,
      fatColumn,
      saturatedFatColumn,
      sugarColumn,
      fiberColumn,
      saltColumn,
    };
  }

function mapCategory(rawCategory, rawSubcategory, foodName) {
  const text = normalizeText(`${rawCategory} ${rawSubcategory} ${foodName}`);

  if (text.includes("fruit")) return "Fruits";

  if (
    text.includes("legume") ||
    text.includes("tomate") ||
    text.includes("carotte") ||
    text.includes("brocoli") ||
    text.includes("courgette") ||
    text.includes("aubergine")
  ) {
    return "Légumes";
  }

  if (
    text.includes("legumineuse") ||
    text.includes("lentille") ||
    text.includes("pois chiche") ||
    text.includes("haricot rouge") ||
    text.includes("haricot blanc") ||
    text.includes("pois casse")
  ) {
    return "Légumineuses";
  }

  if (
    text.includes("cereale") ||
    text.includes("pain") ||
    text.includes("pate") ||
    text.includes("riz") ||
    text.includes("semoule") ||
    text.includes("quinoa") ||
    text.includes("boulgour") ||
    text.includes("avoine") ||
    text.includes("pomme de terre") ||
    text.includes("patate douce")
  ) {
    return "Féculents & céréales";
  }

  if (
    text.includes("viande") ||
    text.includes("poulet") ||
    text.includes("dinde") ||
    text.includes("boeuf") ||
    text.includes("porc") ||
    text.includes("veau") ||
    text.includes("jambon")
  ) {
    return "Viandes";
  }

  if (
    text.includes("poisson") ||
    text.includes("saumon") ||
    text.includes("thon") ||
    text.includes("cabillaud") ||
    text.includes("crevette") ||
    text.includes("crustace")
  ) {
    return "Poissons";
  }

  if (text.includes("oeuf") || text.includes("œuf")) return "Œufs";

  if (
    text.includes("lait") ||
    text.includes("yaourt") ||
    text.includes("fromage blanc") ||
    text.includes("skyr") ||
    text.includes("petit suisse")
  ) {
    return "Produits laitiers";
  }

  if (text.includes("fromage")) return "Fromages";

  if (
    text.includes("huile") ||
    text.includes("beurre") ||
    text.includes("margarine") ||
    text.includes("creme")
  ) {
    return "Matières grasses";
  }

  if (
    text.includes("graine") ||
    text.includes("amande") ||
    text.includes("noix") ||
    text.includes("noisette") ||
    text.includes("cacahuete") ||
    text.includes("pistache")
  ) {
    return "Oléagineux & graines";
  }

  if (
    text.includes("boisson") ||
    text.includes("jus") ||
    text.includes("soda") ||
    text.includes("eau")
  ) {
    return "Boissons";
  }

  if (text.includes("sauce") || text.includes("condiment")) {
    return "Sauces & condiments";
  }

  if (
    text.includes("biscuit") ||
    text.includes("chocolat") ||
    text.includes("sucre") ||
    text.includes("gateau") ||
    text.includes("dessert")
  ) {
    return "Produits sucrés";
  }

  return "Autre";
}

function toFoodObject(record, columns) {
  const name = String(record[columns.nameColumn] ?? "").trim();

  if (!name) return null;

  const code = String(record[columns.codeColumn] ?? slugify(name)).trim();
  const category = String(record[columns.categoryColumn] ?? "").trim();
  const subcategory = String(record[columns.subcategoryColumn] ?? "").trim();

  const calories = parseNutritionNumber(record[columns.caloriesColumn]);
  const protein = parseNutritionNumber(record[columns.proteinColumn]);
  const carbs = parseNutritionNumber(record[columns.carbsColumn]);
  const fat = parseNutritionNumber(record[columns.fatColumn]);

  const saturatedFat = parseNutritionNumber(record[columns.saturatedFatColumn]);
  const sugar = parseNutritionNumber(record[columns.sugarColumn]);
  const fiber = parseNutritionNumber(record[columns.fiberColumn]);
  const salt = parseNutritionNumber(record[columns.saltColumn]);

  const isComplete =
    calories !== null && protein !== null && carbs !== null && fat !== null;

  const createdAt = "2026-01-01T00:00:00.000Z";

  return {
    id: `ciqual-${code || slugify(name)}`,
    name,
    category: mapCategory(category, subcategory, name),
    servingName: "100 g",
    servingSizeG: 100,
    isFavorite: false,
    caloriesPer100g: calories,
    proteinPer100g: protein,
    carbsPer100g: carbs,
    fatPer100g: fat,
    saturatedFatPer100g: saturatedFat,
    sugarPer100g: sugar,
    fiberPer100g: fiber,
    saltPer100g: salt,
    source: "ciqual",
    verified: true,
    dataQualityStatus: isComplete ? "complete" : "partial",
    createdAt,
    updatedAt: createdAt,
  };
}

function readSheet(workbook, sheetName) {
  const sheet = workbook.Sheets[sheetName];

  const rows = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: null,
  });

  const headerRowIndex = findHeaderRow(rows);

  if (headerRowIndex === -1) {
    return {
      sheetName,
      usable: false,
      reason: "Aucune ligne d’en-têtes détectée",
      foods: [],
      headers: [],
      columns: {},
    };
  }

  const headers = rows[headerRowIndex].map((header) =>
    String(header ?? "").trim()
  );

  const columns = detectColumns(headers);

  const requiredColumns = [
    columns.nameColumn,
    columns.caloriesColumn,
    columns.proteinColumn,
    columns.carbsColumn,
    columns.fatColumn,
  ];

  if (requiredColumns.some((column) => !column)) {
    return {
      sheetName,
      usable: false,
      reason: "Colonnes nutritionnelles obligatoires manquantes",
      foods: [],
      headers,
      columns,
    };
  }

  const records = rows.slice(headerRowIndex + 1).map((row) => {
    const record = {};

    headers.forEach((header, index) => {
      record[header] = row[index];
    });

    return record;
  });

  const foods = records
    .map((record) => toFoodObject(record, columns))
    .filter(Boolean)
    .filter((food) => food.name && food.name.length > 1)
    .filter(
      (food) =>
        food.caloriesPer100g !== null ||
        food.proteinPer100g !== null ||
        food.carbsPer100g !== null ||
        food.fatPer100g !== null
    );

  return {
    sheetName,
    usable: true,
    reason: "OK",
    foods,
    headers,
    columns,
  };
}

const workbook = XLSX.readFile(inputPath);

console.log("Feuilles détectées :");
console.table(workbook.SheetNames.map((name) => ({ sheet: name })));

const sheetResults = workbook.SheetNames.map((sheetName) =>
  readSheet(workbook, sheetName)
);

console.log("Analyse des feuilles :");
console.table(
  sheetResults.map((result) => ({
    feuille: result.sheetName,
    exploitable: result.usable,
    aliments: result.foods.length,
    raison: result.reason,
  }))
);

const bestSheet = sheetResults
  .filter((result) => result.usable)
  .sort((a, b) => b.foods.length - a.foods.length)[0];

if (!bestSheet) {
  console.error("Aucune feuille exploitable trouvée.");
  process.exit(1);
}

console.log(`Feuille utilisée : ${bestSheet.sheetName}`);
console.log("Colonnes détectées :");
console.table(bestSheet.columns);

const uniqueFoods = Array.from(
  new Map(bestSheet.foods.map((food) => [food.id, food])).values()
);

const output = `import { Food } from "@/types/nutrition";

export const ciqualFoods: Food[] = ${JSON.stringify(uniqueFoods, null, 2)};
`;

fs.writeFileSync(outputPath, output, "utf8");

console.log(`Import terminé : ${uniqueFoods.length} aliments générés.`);
console.log(`Fichier créé : ${outputPath}`);