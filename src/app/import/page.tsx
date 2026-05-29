"use client";

import { FormEvent, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { useNutritionStore } from "@/hooks/useNutritionStore";

type ImportedProduct = {
  barcode: string;
  productName: string;
  brands: string;
  category: string;
  imageUrl: string;
  externalUrl: string;
  servingSize: string;
  servingSizeG: number | null;
  caloriesPer100g: number | null;
  proteinPer100g: number | null;
  carbsPer100g: number | null;
  fatPer100g: number | null;
  saturatedFatPer100g: number | null;
  sugarPer100g: number | null;
  fiberPer100g: number | null;
  saltPer100g: number | null;
  dataQualityStatus: "complete" | "partial" | "missing" | "needs_review";
};

export default function ImportPage() {
  const { addFood, foods } = useNutritionStore();

  const [barcode, setBarcode] = useState("");
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState<ImportedProduct[]>([]);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const existingBarcodes = new Set(
    foods.map((food) => food.barcode).filter(Boolean)
  );

  function notify(text: string) {
    setMessage(text);
    window.setTimeout(() => setMessage(""), 3000);
  }

  async function searchByBarcode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!barcode.trim()) return;

    setIsLoading(true);
    setProducts([]);

    try {
      const response = await fetch(
        `/api/openfoodfacts/barcode?barcode=${encodeURIComponent(barcode.trim())}`
      );

      const data = await response.json();

      if (!response.ok) {
        notify(data.error || "Produit introuvable.");
        return;
      }

      setProducts([data.product]);
    } catch {
      notify("Erreur pendant la recherche du code-barres.");
    } finally {
      setIsLoading(false);
    }
  }

  async function searchByName(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!query.trim()) return;

    setIsLoading(true);
    setProducts([]);

    try {
      const response = await fetch(
        `/api/openfoodfacts/search?q=${encodeURIComponent(query.trim())}`
      );

      const data = await response.json();

      if (!response.ok) {
        notify(data.error || "Recherche impossible.");
        return;
      }

      setProducts(data.products ?? []);
    } catch {
      notify("Erreur pendant la recherche.");
    } finally {
      setIsLoading(false);
    }
  }

  function importProduct(product: ImportedProduct) {
    if (product.barcode && existingBarcodes.has(product.barcode)) {
      notify("Ce produit semble déjà présent dans ta base.");
      return;
    }

    addFood({
      name: product.productName,
      brand: product.brands || undefined,
      barcode: product.barcode || undefined,
      externalUrl: product.externalUrl || undefined,
      imageUrl: product.imageUrl || undefined,
      dataQualityStatus: product.dataQualityStatus,
      category: product.category || "Produits importés",
      servingName: product.servingSize ? "Portion indiquée" : undefined,
      servingSizeG: product.servingSizeG,
      isFavorite: false,
      caloriesPer100g: product.caloriesPer100g,
      proteinPer100g: product.proteinPer100g,
      carbsPer100g: product.carbsPer100g,
      fatPer100g: product.fatPer100g,
      saturatedFatPer100g: product.saturatedFatPer100g,
      sugarPer100g: product.sugarPer100g,
      fiberPer100g: product.fiberPer100g,
      saltPer100g: product.saltPer100g,
      source: "openfoodfacts",
      verified: false,
    });

    notify("Produit importé dans la base aliments.");
  }

  return (
    <AppShell>
      <div className="mb-8">
        <p className="text-sm font-medium text-[#E85A0C]">Open Food Facts</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">
          Importer un produit
        </h1>
        <p className="mt-2 max-w-3xl text-gray-500">
          Recherche un produit par code-barres ou par nom, puis importe ses
          valeurs nutritionnelles dans ta base. Les données Open Food Facts sont
          collaboratives : vérifie les valeurs si le produit est important dans
          le suivi.
        </p>
      </div>

      <section className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <div className="space-y-6">
          <form
            onSubmit={searchByBarcode}
            className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5"
          >
            <h2 className="text-xl font-semibold">Recherche par code-barres</h2>
            <p className="mt-1 text-sm text-gray-500">
              C’est la méthode la plus fiable pour un produit de marque.
            </p>

            <div className="mt-5 space-y-3">
              <input
                value={barcode}
                onChange={(event) => setBarcode(event.target.value)}
                className="input"
                placeholder="Ex : 3017624010701"
              />

              <button className="w-full rounded-2xl bg-[#10121A] px-5 py-3 text-sm font-medium text-white">
                Rechercher le code-barres
              </button>
            </div>
          </form>

          <form
            onSubmit={searchByName}
            className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5"
          >
            <h2 className="text-xl font-semibold">Recherche par nom</h2>
            <p className="mt-1 text-sm text-gray-500">
              Utile si tu n’as pas le code-barres, mais les résultats peuvent
              être moins précis.
            </p>

            <div className="mt-5 space-y-3">
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="input"
                placeholder="Ex : Carré Frais 0%, Skyr, Toastiligne..."
              />

              <button className="w-full rounded-2xl bg-[#10121A] px-5 py-3 text-sm font-medium text-white">
                Rechercher par nom
              </button>
            </div>
          </form>
        </div>

        <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">Résultats</h2>
              <p className="mt-1 text-sm text-gray-500">
                {isLoading
                  ? "Recherche en cours..."
                  : `${products.length} produit(s) trouvé(s).`}
              </p>
            </div>
          </div>

          {message && (
            <div className="mt-5 rounded-2xl bg-green-50 p-4 text-sm text-green-800">
              {message}
            </div>
          )}

          <div className="mt-6 space-y-4">
            {products.length === 0 && !isLoading ? (
              <div className="rounded-2xl border border-dashed border-black/10 bg-[#FAFAF8] p-8 text-center text-sm text-gray-500">
                Lance une recherche pour afficher les produits.
              </div>
            ) : (
              products.map((product) => (
                <ProductCard
                  key={`${product.barcode}-${product.productName}`}
                  product={product}
                  alreadyExists={
                    Boolean(product.barcode) &&
                    existingBarcodes.has(product.barcode)
                  }
                  onImport={() => importProduct(product)}
                />
              ))
            )}
          </div>
        </section>
      </section>
    </AppShell>
  );
}

function ProductCard({
  product,
  alreadyExists,
  onImport,
}: {
  product: ImportedProduct;
  alreadyExists: boolean;
  onImport: () => void;
}) {
  return (
    <div className="rounded-2xl border border-black/5 bg-[#FAFAF8] p-4">
      <div className="flex flex-col gap-4 md:flex-row">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.productName}
            className="h-24 w-24 rounded-2xl object-cover ring-1 ring-black/5"
          />
        ) : (
          <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl bg-white text-xs text-gray-400 ring-1 ring-black/5">
            Sans image
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
            <div>
              <h3 className="font-semibold">{product.productName}</h3>
              <p className="mt-1 text-sm text-gray-500">
                {product.brands || "Marque inconnue"}
              </p>
              {product.barcode && (
                <p className="mt-1 text-xs text-gray-400">
                  Code-barres : {product.barcode}
                </p>
              )}
            </div>

            <span
              className={`w-fit rounded-full px-3 py-1 text-xs ${
                product.dataQualityStatus === "complete"
                  ? "bg-green-100 text-green-800"
                  : "bg-orange-100 text-orange-800"
              }`}
            >
              {product.dataQualityStatus === "complete"
                ? "Complet"
                : "Partiel"}
            </span>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
            <MacroMini
              label="kcal"
              value={product.caloriesPer100g}
              suffix=""
            />
            <MacroMini
              label="Prot."
              value={product.proteinPer100g}
              suffix="g"
            />
            <MacroMini
              label="Gluc."
              value={product.carbsPer100g}
              suffix="g"
            />
            <MacroMini
              label="Lip."
              value={product.fatPer100g}
              suffix="g"
            />
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={onImport}
              disabled={alreadyExists}
              className="rounded-full bg-[#10121A] px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              {alreadyExists ? "Déjà importé" : "Importer"}
            </button>

            {product.externalUrl && (
              <a
                href={product.externalUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-black/10 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-black/5"
              >
                Voir la source
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MacroMini({
  label,
  value,
  suffix,
}: {
  label: string;
  value: number | null;
  suffix: string;
}) {
  return (
    <div className="rounded-xl bg-white px-3 py-2">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="font-medium">
        {value ?? "—"}
        {value !== null ? suffix : ""}
      </p>
    </div>
  );
}