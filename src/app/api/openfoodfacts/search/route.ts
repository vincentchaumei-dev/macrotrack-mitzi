import { NextRequest, NextResponse } from "next/server";

type OpenFoodFactsProduct = {
  code?: string;
  product_name?: string;
  product_name_fr?: string;
  brands?: string;
  categories?: string;
  image_front_small_url?: string;
  image_url?: string;
  url?: string;
  serving_size?: string;
  nutriments?: Record<string, number | string | undefined>;
};

function toNumber(value: unknown) {
  if (typeof value === "number") return value;

  if (typeof value === "string") {
    const parsed = Number(value.replace(",", "."));
    return Number.isNaN(parsed) ? null : parsed;
  }

  return null;
}

function roundOne(value: number | null) {
  if (value === null) return null;
  return Math.round(value * 10) / 10;
}

function getFirstNumber(
  source: Record<string, number | string | undefined>,
  keys: string[]
) {
  for (const key of keys) {
    const value = toNumber(source[key]);

    if (value !== null) {
      return value;
    }
  }

  return null;
}

function getEnergyKcal(nutriments: Record<string, number | string | undefined>) {
  const kcal = getFirstNumber(nutriments, [
    "energy-kcal_100g",
    "energy-kcal",
    "energy-kcal_value",
  ]);

  if (kcal !== null) {
    return roundOne(kcal);
  }

  const kj = getFirstNumber(nutriments, [
    "energy_100g",
    "energy",
    "energy_value",
  ]);

  if (kj !== null) {
    return roundOne(kj / 4.184);
  }

  return null;
}

function parseServingSize(value?: string) {
  if (!value) return null;

  const match = value.match(/(\d+(?:[.,]\d+)?)/);
  if (!match) return null;

  return toNumber(match[1]);
}

function normalizeProduct(product: OpenFoodFactsProduct) {
  const nutriments = product.nutriments ?? {};

  const calories = getEnergyKcal(nutriments);

  const protein = roundOne(
    getFirstNumber(nutriments, ["proteins_100g", "proteins"])
  );

  const carbs = roundOne(
    getFirstNumber(nutriments, ["carbohydrates_100g", "carbohydrates"])
  );

  const fat = roundOne(getFirstNumber(nutriments, ["fat_100g", "fat"]));

  const saturatedFat = roundOne(
    getFirstNumber(nutriments, ["saturated-fat_100g", "saturated-fat"])
  );

  const sugar = roundOne(
    getFirstNumber(nutriments, ["sugars_100g", "sugars"])
  );

  const fiber = roundOne(
    getFirstNumber(nutriments, ["fiber_100g", "fiber", "fibre_100g"])
  );

  const salt = roundOne(getFirstNumber(nutriments, ["salt_100g", "salt"]));

  const isComplete =
    calories !== null && protein !== null && carbs !== null && fat !== null;

  return {
    barcode: product.code ?? "",
    productName:
      product.product_name_fr || product.product_name || "Produit sans nom",
    brands: product.brands || "",
    category: product.categories?.split(",")?.[0]?.trim() || "Produits importés",
    imageUrl: product.image_front_small_url || product.image_url || "",
    externalUrl: product.url || "",
    servingSize: product.serving_size || "",
    servingSizeG: parseServingSize(product.serving_size),
    caloriesPer100g: calories,
    proteinPer100g: protein,
    carbsPer100g: carbs,
    fatPer100g: fat,
    saturatedFatPer100g: saturatedFat,
    sugarPer100g: sugar,
    fiberPer100g: fiber,
    saltPer100g: salt,
    dataQualityStatus: isComplete ? "complete" : "partial",
  };
}

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim();

  if (!query) {
    return NextResponse.json({ products: [] });
  }

  const fields = [
    "code",
    "product_name",
    "product_name_fr",
    "brands",
    "categories",
    "image_front_small_url",
    "image_url",
    "url",
    "serving_size",
    "nutriments",
  ].join(",");

  const params = new URLSearchParams({
    search_terms: query,
    page_size: "12",
    fields,
  });

  const response = await fetch(
    `https://world.openfoodfacts.org/api/v2/search?${params.toString()}`,
    {
      headers: {
        "User-Agent":
          "MacroTrackPersonal/1.0 - nutrition tracking personal app",
      },
      cache: "no-store",
    }
  );

  if (!response.ok) {
    return NextResponse.json(
      { error: "Open Food Facts est temporairement indisponible." },
      { status: 502 }
    );
  }

  const data = await response.json();

  const products = Array.isArray(data.products)
    ? data.products.map(normalizeProduct)
    : [];

  return NextResponse.json({ products });
}