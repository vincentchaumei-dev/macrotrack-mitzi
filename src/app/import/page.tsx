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

function getQualityLabel(status: ImportedProduct["dataQualityStatus"]) {
  if (status === "complete") return "Complet";
  if (status === "partial") return "Partiel";
  if (status === "missing") return "Incomplet";
  return "À vérifier";
}

function getQualityClass(status: ImportedProduct["dataQualityStatus"]) {
  if (status === "complete") {
    return "bg-[var(--mt-success-soft)] text-[var(--mt-success)]";
  }

  if (status === "partial") {
    return "bg-[var(--mt-warn-soft)] text-[var(--mt-warn)]";
  }

  return "bg-[var(--mt-rouge-wash)] text-[var(--mt-rouge-deep)]";
}

function formatValue(value: number | null, suffix = "") {
  if (value === null) return "—";
  return `${value}${suffix}`;
}

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
        `/api/openfoodfacts/barcode?barcode=${encodeURIComponent(
          barcode.trim()
        )}`
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
      <div className="space-y-5">
        <section className="pt-2">
          <p className="text-[12px] font-black uppercase tracking-[0.18em] text-[var(--mt-rouge)]">
            Open Food Facts
          </p>

          <div className="mt-3 flex items-start justify-between gap-4">
            <div>
              <h1 className="mt-display text-[50px] font-semibold leading-[0.9] tracking-[-0.055em] text-[var(--mt-ink)]">
                Importer
              </h1>

              <p className="mt-4 max-w-[310px] text-[15px] leading-7 text-[var(--mt-ink-2)]">
                Recherche un produit de marque, vérifie les valeurs, puis ajoute-le
                à ta base aliments.
              </p>
            </div>

            <div className="shrink-0 rounded-[24px] bg-gradient-to-br from-[var(--mt-rouge-lit)] via-[var(--mt-rouge)] to-[var(--mt-rouge-deep)] p-4 text-white shadow-[var(--mt-shadow-red)]">
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-white/62">
                Source
              </p>
              <p className="mt-display mt-2 text-[32px] font-semibold leading-none tracking-[-0.05em]">
                OFF
              </p>
              <p className="mt-1 text-[10px] font-black uppercase text-white/62">
                produits
              </p>
            </div>
          </div>
        </section>

        {message && (
          <div className="rounded-[18px] border border-[var(--mt-success-soft)] bg-[var(--mt-success-soft)] px-4 py-3 text-[13px] font-extrabold text-[var(--mt-success)]">
            {message}
          </div>
        )}

        <section className="mt-card overflow-hidden rounded-[28px]">
          <div className="bg-gradient-to-br from-[var(--mt-rouge-lit)] via-[var(--mt-rouge)] to-[var(--mt-rouge-deep)] p-5 text-white">
            <p className="text-[12px] font-black uppercase tracking-[0.18em] text-white/62">
              Import produit
            </p>

            <h2 className="mt-display mt-2 text-[34px] font-semibold leading-none tracking-[-0.04em]">
              Scanner ou rechercher.
            </h2>

            <p className="mt-4 text-[14px] leading-7 text-white/78">
              Le code-barres est le plus fiable. La recherche par nom reste utile
              quand tu n’as pas le produit sous la main.
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              <span className="rounded-full bg-white/16 px-3 py-1.5 text-[11px] font-black text-white backdrop-blur">
                Code-barres
              </span>
              <span className="rounded-full bg-white/16 px-3 py-1.5 text-[11px] font-black text-white backdrop-blur">
                Nom produit
              </span>
              <span className="rounded-full bg-white/16 px-3 py-1.5 text-[11px] font-black text-white backdrop-blur">
                À vérifier
              </span>
            </div>
          </div>
        </section>

        <section className="grid gap-3">
          <form onSubmit={searchByBarcode} className="mt-card rounded-[28px] p-5">
            <SectionHead
              kicker="Méthode fiable"
              title="Code-barres"
              text="Idéal pour les produits de marque. Copie ou scanne le code présent sur l’emballage."
            />

            <div className="mt-5 grid gap-3">
              <input
                value={barcode}
                onChange={(event) => setBarcode(event.target.value)}
                className="ImportInput"
                inputMode="numeric"
                placeholder="Ex : 3017624010701"
              />

              <button
                type="submit"
                disabled={isLoading || !barcode.trim()}
                className="mt-btn-primary disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isLoading ? "Recherche..." : "Rechercher le code-barres"}
              </button>
            </div>
          </form>

          <form onSubmit={searchByName} className="mt-card rounded-[28px] p-5">
            <SectionHead
              kicker="Recherche libre"
              title="Nom du produit"
              text="Pratique si tu n’as pas le code-barres. Les résultats peuvent être moins précis."
            />

            <div className="mt-5 grid gap-3">
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="ImportInput"
                placeholder="Ex : Carré Frais 0%, Skyr, Toastiligne..."
              />

              <button
                type="submit"
                disabled={isLoading || !query.trim()}
                className="ImportSecondaryButton disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isLoading ? "Recherche..." : "Rechercher par nom"}
              </button>
            </div>
          </form>
        </section>

        <section className="mt-card rounded-[28px] p-5">
          <div className="flex items-end justify-between gap-3">
            <SectionHead
              kicker="Résultats"
              title="Produits trouvés"
              text={
                isLoading
                  ? "Recherche en cours..."
                  : `${products.length} produit(s) affiché(s).`
              }
            />

            {products.length > 0 && (
              <button
                type="button"
                onClick={() => setProducts([])}
                className="shrink-0 rounded-full bg-[var(--mt-card-soft)] px-3 py-2 text-[11px] font-black text-[var(--mt-ink)] ring-1 ring-[var(--mt-line)]"
              >
                Vider
              </button>
            )}
          </div>

          <div className="mt-5 grid gap-3">
            {products.length === 0 && !isLoading ? (
              <div className="rounded-[22px] border border-dashed border-[var(--mt-line-2)] bg-[var(--mt-card-soft)] p-5 text-center">
                <p className="mt-display text-[21px] font-semibold text-[var(--mt-ink)]">
                  Aucun résultat pour le moment
                </p>
                <p className="mt-2 text-[13px] leading-6 text-[var(--mt-ink-2)]">
                  Lance une recherche par code-barres ou par nom pour afficher les
                  produits.
                </p>
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

        <section className="mt-insight">
          <div className="mt-insight-icon">
            <LightIcon />
          </div>
          <p>
            Les données Open Food Facts sont collaboratives. Pour les produits que
            tu utilises souvent, vérifie rapidement les valeurs sur l’étiquette.
          </p>
        </section>

        <div className="h-10" />
      </div>
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
    <article className="rounded-[24px] border border-[var(--mt-line)] bg-white p-4 shadow-[var(--mt-shadow)]">
      <div className="flex gap-3">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.productName}
            className="h-20 w-20 shrink-0 rounded-[20px] object-cover ring-1 ring-[var(--mt-line)]"
          />
        ) : (
          <div className="grid h-20 w-20 shrink-0 place-items-center rounded-[20px] bg-[var(--mt-card-soft)] text-center text-[11px] font-bold text-[var(--mt-ink-3)] ring-1 ring-[var(--mt-line)]">
            Sans image
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap gap-1.5">
            <span
              className={`rounded-full px-2.5 py-1 text-[10px] font-black ${getQualityClass(
                product.dataQualityStatus
              )}`}
            >
              {getQualityLabel(product.dataQualityStatus)}
            </span>

            {alreadyExists && (
              <span className="rounded-full bg-[var(--mt-ink)] px-2.5 py-1 text-[10px] font-black text-white">
                Déjà importé
              </span>
            )}
          </div>

          <h3 className="mt-3 line-clamp-2 text-[17px] font-black leading-tight tracking-[-0.02em] text-[var(--mt-ink)]">
            {product.productName || "Produit sans nom"}
          </h3>

          <p className="mt-1 line-clamp-1 text-[12px] font-bold text-[var(--mt-ink-2)]">
            {product.brands || "Marque inconnue"}
          </p>

          {product.barcode && (
            <p className="mt-1 text-[11px] font-bold text-[var(--mt-ink-3)]">
              {product.barcode}
            </p>
          )}
        </div>

        <div className="shrink-0 text-right">
          <p className="mt-display text-[28px] font-semibold leading-none tracking-[-0.03em] text-[var(--mt-ink)]">
            {product.caloriesPer100g ?? "—"}
          </p>
          <p className="mt-1 text-[9px] font-black uppercase tracking-[0.08em] text-[var(--mt-ink-3)]">
            kcal
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-4 gap-2">
        <MacroMini label="Kcal" value={formatValue(product.caloriesPer100g)} />
        <MacroMini label="Prot." value={formatValue(product.proteinPer100g, "g")} />
        <MacroMini label="Gluc." value={formatValue(product.carbsPer100g, "g")} />
        <MacroMini label="Lip." value={formatValue(product.fatPer100g, "g")} />
      </div>

      {(product.servingSize || product.category) && (
        <div className="mt-4 rounded-[18px] bg-[var(--mt-card-soft)] p-3 ring-1 ring-[var(--mt-line)]">
          {product.servingSize && (
            <p className="text-[12px] font-bold text-[var(--mt-ink-2)]">
              Portion :{" "}
              <span className="font-black text-[var(--mt-ink)]">
                {product.servingSize}
              </span>
            </p>
          )}

          {product.category && (
            <p className="mt-1 line-clamp-2 text-[12px] font-bold text-[var(--mt-ink-2)]">
              Catégorie :{" "}
              <span className="font-black text-[var(--mt-ink)]">
                {product.category}
              </span>
            </p>
          )}
        </div>
      )}

      <div className="mt-4 grid gap-2">
        <button
          type="button"
          onClick={onImport}
          disabled={alreadyExists}
          className="ImportPrimaryButton disabled:cursor-not-allowed disabled:opacity-40"
        >
          {alreadyExists ? "Déjà importé" : "Importer dans aliments"}
        </button>

        {product.externalUrl && (
          <a
            href={product.externalUrl}
            target="_blank"
            rel="noreferrer"
            className="ImportSourceButton text-center"
          >
            Voir la source
          </a>
        )}
      </div>
    </article>
  );
}

function SectionHead({
  kicker,
  title,
  text,
}: {
  kicker: string;
  title: string;
  text: string;
}) {
  return (
    <div>
      <p className="text-[12px] font-black uppercase tracking-[0.18em] text-[var(--mt-rouge)]">
        {kicker}
      </p>
      <h2 className="mt-display mt-1 text-[26px] font-semibold tracking-[-0.03em] text-[var(--mt-ink)]">
        {title}
      </h2>
      <p className="mt-2 text-[13px] leading-6 text-[var(--mt-ink-2)]">
        {text}
      </p>
    </div>
  );
}

function MacroMini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[16px] bg-[var(--mt-card-soft)] p-2.5 text-center ring-1 ring-[var(--mt-line)]">
      <p className="text-[9px] font-black uppercase text-[var(--mt-ink-3)]">
        {label}
      </p>
      <p className="mt-1 text-[12px] font-black text-[var(--mt-ink)]">
        {value}
      </p>
    </div>
  );
}

function LightIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z" />
      <path d="M9 21h6" />
    </svg>
  );
}