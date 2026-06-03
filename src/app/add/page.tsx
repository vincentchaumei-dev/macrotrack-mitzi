"use client";

import { FormEvent, ReactNode, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { BarcodeScanner } from "@/components/ui/BarcodeScanner";
import { RestaurantSheet } from "@/components/ui/RestaurantSheet";
import { useNutritionStore } from "@/hooks/useNutritionStore";
import {
  buildMealItem,
  calculateMealTotals,
  compareFoodsForSearch,
  foodMatchesSearch,
  formatMacro,
  isFoodComplete,
  mealTypeLabels,
  shouldShowFoodInSimpleMode,
  todayLocalDate,
} from "@/lib/nutrition";
import { Food, Meal, MealItem, MealType } from "@/types/nutrition";

const mealTypeOrder: MealType[] = ["breakfast", "lunch", "dinner", "snack"];

type QuickMode = "favorites" | "recent" | "frequent" | "essentials";

const quickModes: { label: string; value: QuickMode }[] = [
  { label: "Favoris", value: "favorites" },
  { label: "Récents", value: "recent" },
  { label: "Fréquents", value: "frequent" },
  { label: "Essentiels", value: "essentials" },
];

function parseQuantity(value: string) {
  const parsed = Number(value.replace(",", "."));
  return Number.isNaN(parsed) ? 0 : parsed;
}

function getSourceLabel(source: Food["source"]) {
  if (source === "ciqual") return "Ciqual";
  if (source === "openfoodfacts") return "Open Food Facts";
  if (source === "label") return "Étiquette";
  if (source === "manual") return "Manuel";
  return "Source inconnue";
}

function getFoodsById(foods: Food[]) {
  return new Map(foods.map((food) => [food.id, food]));
}

function getRecentFoods(meals: Meal[], foods: Food[], limit = 12) {
  const foodsById = getFoodsById(foods);
  const seen = new Set<string>();
  const recentFoods: Food[] = [];

  const sortedMeals = [...meals].sort((a, b) => {
    const aTime = a.updatedAt || a.createdAt;
    const bTime = b.updatedAt || b.createdAt;
    return bTime.localeCompare(aTime);
  });

  for (const meal of sortedMeals) {
    const reversedItems = [...meal.items].reverse();

    for (const item of reversedItems) {
      if (seen.has(item.foodId)) continue;

      const food = foodsById.get(item.foodId);

      if (!food) continue;

      seen.add(item.foodId);
      recentFoods.push(food);

      if (recentFoods.length >= limit) {
        return recentFoods;
      }
    }
  }

  return recentFoods;
}

function getFrequentFoods(meals: Meal[], foods: Food[], limit = 12) {
  const foodsById = getFoodsById(foods);
  const counts = new Map<string, number>();

  meals.forEach((meal) => {
    meal.items.forEach((item) => {
      counts.set(item.foodId, (counts.get(item.foodId) ?? 0) + 1);
    });
  });

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([foodId]) => foodsById.get(foodId))
    .filter((food): food is Food => Boolean(food))
    .slice(0, limit);
}

export default function AddMealPage() {
  const router = useRouter();
  const { foods, meals, addMeal, addFood, createMealTemplate } = useNutritionStore();

  const [date, setDate] = useState(todayLocalDate());
  const [type, setType] = useState<MealType>("breakfast");
  const [name, setName] = useState("");
  const [query, setQuery] = useState("");
  const [selectedFoodId, setSelectedFoodId] = useState("");
  const [quantityG, setQuantityG] = useState("");
  const [items, setItems] = useState<MealItem[]>([]);
  const [includeFullDatabase, setIncludeFullDatabase] = useState(false);
  const [quickMode, setQuickMode] = useState<QuickMode>("favorites");
  const [showScanner, setShowScanner] = useState(false);
  const [scanFlash, setScanFlash] = useState("");
  const [showRestaurantSheet, setShowRestaurantSheet] = useState(false);
  const [showRecipeForm, setShowRecipeForm] = useState(false);
  const [recipeName, setRecipeName] = useState("");
  const [recipeFlash, setRecipeFlash] = useState("");

  const selectedFood = foods.find((food) => food.id === selectedFoodId) ?? null;

  const favoriteFoods = useMemo(
    () =>
      foods
        .filter((food) => food.isFavorite)
        .sort((a, b) => compareFoodsForSearch(a, b, ""))
        .slice(0, 12),
    [foods]
  );

  const recentFoods = useMemo(
    () => getRecentFoods(meals, foods, 12),
    [meals, foods]
  );

  const frequentFoods = useMemo(
    () => getFrequentFoods(meals, foods, 12),
    [meals, foods]
  );

  const essentialFoods = useMemo(
    () =>
      foods
        .filter((food) => food.isEssential)
        .sort((a, b) => compareFoodsForSearch(a, b, ""))
        .slice(0, 16),
    [foods]
  );

  const quickFoods = {
    favorites: favoriteFoods,
    recent: recentFoods,
    frequent: frequentFoods,
    essentials: essentialFoods,
  }[quickMode];

  const filteredFoods = useMemo(() => {
    const hasQuery = query.trim().length > 0;

    return foods
      .filter((food) => {
        const matchesSimpleMode =
          includeFullDatabase || shouldShowFoodInSimpleMode(food, query);

        const matchesQuery =
          !hasQuery ||
          foodMatchesSearch({
            foodName: food.name,
            brand: food.brand,
            category: food.category,
            query,
          });

        return matchesSimpleMode && matchesQuery;
      })
      .sort((a, b) => compareFoodsForSearch(a, b, query))
      .slice(0, hasQuery || includeFullDatabase ? 24 : 10);
  }, [foods, query, includeFullDatabase]);

  const draftMeal: Meal = {
    id: "draft",
    date,
    type,
    name,
    items,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const totals = calculateMealTotals(draftMeal);

  const previewItem =
    selectedFood && parseQuantity(quantityG) > 0
      ? buildMealItem(selectedFood, parseQuantity(quantityG))
      : null;

  function selectFood(food: Food) {
    setSelectedFoodId(food.id);
    setQuery(food.name);
    setQuantityG(food.servingSizeG ? String(food.servingSizeG) : "100");
  }

  function addItem(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();

    if (!selectedFood) return;

    const quantity = parseQuantity(quantityG);

    if (quantity <= 0) return;

    const item = buildMealItem(selectedFood, quantity);

    setItems((current) => [...current, item]);
    setSelectedFoodId("");
    setQuantityG("");
    setQuery("");
  }

  function removeItem(itemId: string) {
    setItems((current) => current.filter((item) => item.id !== itemId));
  }

  async function handleBarcodeScan(barcode: string) {
    setShowScanner(false);

    // Déjà dans la bibliothèque ?
    const existing = foods.find((f) => f.barcode === barcode);
    if (existing) {
      selectFood(existing);
      setScanFlash(`${existing.name} trouvé dans ta bibliothèque ✓`);
      window.setTimeout(() => setScanFlash(""), 3000);
      return;
    }

    setScanFlash("Recherche du produit…");

    try {
      const res = await fetch(
        `/api/openfoodfacts/barcode?barcode=${encodeURIComponent(barcode)}`
      );

      if (!res.ok) {
        setScanFlash("Produit non trouvé dans Open Food Facts.");
        window.setTimeout(() => setScanFlash(""), 4000);
        return;
      }

      const data = await res.json();
      const p = data.product;

      const newFood = addFood({
        name: p.productName,
        brand: p.brands || undefined,
        barcode: p.barcode || barcode,
        imageUrl: p.imageUrl || undefined,
        externalUrl: p.externalUrl || undefined,
        dataQualityStatus: p.dataQualityStatus ?? "partial",
        category: p.category || "Produits importés",
        servingSizeG: p.servingSizeG ?? null,
        caloriesPer100g: p.caloriesPer100g,
        proteinPer100g: p.proteinPer100g,
        carbsPer100g: p.carbsPer100g,
        fatPer100g: p.fatPer100g,
        saturatedFatPer100g: p.saturatedFatPer100g ?? null,
        sugarPer100g: p.sugarPer100g ?? null,
        fiberPer100g: p.fiberPer100g ?? null,
        saltPer100g: p.saltPer100g ?? null,
        source: "openfoodfacts",
        verified: false,
      });

      selectFood(newFood);
      setScanFlash(`${newFood.name} ajouté depuis Open Food Facts ✓`);
      window.setTimeout(() => setScanFlash(""), 3000);
    } catch {
      setScanFlash("Erreur de connexion. Réessaie.");
      window.setTimeout(() => setScanFlash(""), 4000);
    }
  }

  function handleSaveAsRecipe() {
    if (items.length === 0) return;

    const templateName = recipeName.trim() || name.trim() || "Ma recette";

    createMealTemplate({ name: templateName, type, items });

    setShowRecipeForm(false);
    setRecipeName("");
    setRecipeFlash(`"${templateName}" ajoutée aux recettes ✓`);
    window.setTimeout(() => setRecipeFlash(""), 3000);
  }

  function saveMeal(destination: "journal" | "dashboard") {
    if (items.length === 0) return;

    addMeal({
      date,
      type,
      name: name.trim() || undefined,
      items,
    });

    router.push(destination === "dashboard" ? "/" : "/journal");
  }

  return (
    <AppShell>
      {showScanner && (
        <BarcodeScanner
          onScan={handleBarcodeScan}
          onClose={() => setShowScanner(false)}
        />
      )}

      {showRestaurantSheet && (
        <RestaurantSheet
          onAdd={(item) => {
            setItems((current) => [...current, item]);
            setShowRestaurantSheet(false);
          }}
          onClose={() => setShowRestaurantSheet(false)}
        />
      )}

      <div className="space-y-5">
        <section className="pt-2">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[var(--mt-rouge)]">
            Nouveau repas
          </p>

          <div className="mt-3 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="mt-display text-[42px] font-black leading-[0.96] tracking-[-0.055em] text-[var(--mt-ink)]">
                Ajouter
              </h1>
              <p className="mt-3 max-w-[300px] text-[14px] font-semibold leading-6 text-[var(--mt-ink-2)]">
                Choisis un aliment, ajuste la quantité, puis enregistre le repas.
              </p>
            </div>

            <div className="mt-card shrink-0 rounded-[22px] px-4 py-3 text-center">
              <p className="text-[9px] font-black uppercase tracking-[0.14em] text-[var(--mt-ink-3)]">
                Total
              </p>
              <p className="mt-1 text-[28px] font-black leading-none tracking-[-0.05em] text-[var(--mt-ink)]">
                {formatMacro(totals.calories, "")}
              </p>
              <p className="mt-1 text-[9px] font-black uppercase text-[var(--mt-ink-3)]">
                kcal
              </p>
            </div>
          </div>
        </section>

        <section className="mt-card overflow-hidden rounded-[28px]">
          <div className="bg-gradient-to-br from-[var(--mt-rouge-lit)] via-[var(--mt-rouge)] to-[var(--mt-rouge-deep)] p-5 text-white">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-white/64">
                  Repas en cours
                </p>
                <h2 className="mt-2 text-[26px] font-black leading-none tracking-[-0.045em]">
                  {items.length === 0
                    ? "Encore vide"
                    : `${items.length} aliment${items.length > 1 ? "s" : ""}`}
                </h2>
              </div>

              <div className="rounded-full bg-white/16 px-3 py-2 text-[11px] font-black text-white ring-1 ring-white/18">
                {mealTypeLabels[type]}
              </div>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-2">
              <SummaryGlass
                label="Prot."
                value={formatMacro(totals.proteinG, "g")}
              />
              <SummaryGlass
                label="Gluc."
                value={formatMacro(totals.carbsG, "g")}
              />
              <SummaryGlass
                label="Lip."
                value={formatMacro(totals.fatG, "g")}
              />
            </div>
          </div>

          <div className="p-4">
            <p className="mb-2 text-[11px] font-black uppercase tracking-[0.12em] text-[var(--mt-ink-2)]">
              Type de repas
            </p>

            <div className="grid grid-cols-4 gap-2">
              {mealTypeOrder.map((mealType) => (
                <button
                  key={mealType}
                  type="button"
                  onClick={() => setType(mealType)}
                  className={`rounded-[16px] px-2 py-3 text-[11px] font-black leading-tight ${
                    type === mealType
                      ? "bg-[var(--mt-rouge)] text-white shadow-[var(--mt-shadow-red)]"
                      : "bg-[var(--mt-card-soft)] text-[var(--mt-ink)] ring-1 ring-[var(--mt-line)]"
                  }`}
                >
                  {mealTypeLabels[mealType]}
                </button>
              ))}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <label>
                <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.12em] text-[var(--mt-ink-2)]">
                  Date
                </span>
                <input
                  type="date"
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                  className="AddInput"
                />
              </label>

              <label>
                <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.12em] text-[var(--mt-ink-2)]">
                  Nom
                </span>
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="AddInput"
                  placeholder="Optionnel"
                />
              </label>
            </div>
          </div>
        </section>

        <section className="mt-card rounded-[28px] p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[var(--mt-rouge)]">
                Aliment
              </p>
              <h2 className="mt-1 text-[24px] font-black tracking-[-0.04em] text-[var(--mt-ink)]">
                Que veux-tu ajouter ?
              </h2>
            </div>

            <button
              type="button"
              onClick={() => setIncludeFullDatabase((current) => !current)}
              className={`shrink-0 rounded-full px-3 py-2 text-[10.5px] font-black ${
                includeFullDatabase
                  ? "bg-[var(--mt-ink)] text-white"
                  : "bg-[var(--mt-rouge-wash)] text-[var(--mt-rouge-deep)] ring-1 ring-[var(--mt-rouge-soft)]"
              }`}
            >
              {includeFullDatabase ? "Base complète" : "Simple"}
            </button>
          </div>

          {scanFlash && (
            <div className={`mt-4 rounded-[14px] px-3 py-2.5 text-center text-[12px] font-bold ${
              scanFlash.includes("non trouvé") || scanFlash.includes("Erreur")
                ? "bg-[var(--mt-warn-soft)] text-[var(--mt-warn)]"
                : scanFlash === "Recherche du produit…"
                  ? "bg-[var(--mt-card-soft)] text-[var(--mt-ink-2)]"
                  : "bg-[var(--mt-success-soft)] text-[var(--mt-success)]"
            }`}>
              {scanFlash}
            </div>
          )}

          <label className="relative mt-4 block">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--mt-ink-3)]">
              <SearchIcon />
            </span>

            <input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setSelectedFoodId("");
              }}
              className="w-full rounded-[21px] border border-[var(--mt-line)] bg-[var(--mt-card-soft)] py-4 pl-12 pr-14 text-[15px] font-black text-[var(--mt-ink)] outline-none placeholder:text-[var(--mt-ink-3)]"
              placeholder="Rechercher un aliment..."
            />

            <button
              type="button"
              onClick={() => setShowScanner(true)}
              className="absolute right-3 top-1/2 -translate-y-1/2 grid h-9 w-9 place-items-center rounded-full bg-[var(--mt-rouge)] text-white shadow-[var(--mt-shadow-red)]"
              aria-label="Scanner un code-barres"
            >
              <BarcodeIcon />
            </button>
          </label>

          {!selectedFood && query.trim().length === 0 && (
            <div className="mt-4">
              {/* Restaurant mode banner */}
              <button
                type="button"
                onClick={() => setShowRestaurantSheet(true)}
                className="mb-4 flex w-full items-center gap-3 rounded-[22px] bg-gradient-to-r from-[#1a1208] to-[#2a1d0a] p-4 text-left"
              >
                <span className="text-[32px] leading-none">🍽️</span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-black text-white">Mode restaurant</p>
                  <p className="mt-0.5 text-[11px] font-semibold text-white/60">
                    Pizza, burger, sushi… sans peser
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-white/14 px-3 py-1.5 text-[11px] font-black text-white/80">
                  Ouvrir →
                </span>
              </button>

              <div className="flex gap-2 overflow-x-auto py-[2px] pb-1">
                {quickModes.map((mode) => (
                  <QuickTab
                    key={mode.value}
                    active={quickMode === mode.value}
                    onClick={() => setQuickMode(mode.value)}
                  >
                    {mode.label}
                  </QuickTab>
                ))}
              </div>

              <div className="mt-4">
                <QuickFoodsRail
                  foods={quickFoods}
                  mode={quickMode}
                  onSelect={selectFood}
                />
              </div>
            </div>
          )}

          {query.trim().length > 0 && !selectedFood && (
            <div className="mt-4 grid gap-2">
              {filteredFoods.length === 0 ? (
                <div className="rounded-[22px] border border-dashed border-[var(--mt-line-2)] bg-[var(--mt-card-soft)] p-5 text-center">
                  <p className="text-[20px] font-black text-[var(--mt-ink)]">
                    Aucun aliment
                  </p>
                  <p className="mt-2 text-[13px] font-semibold leading-6 text-[var(--mt-ink-2)]">
                    Essaie d’élargir la recherche ou d’inclure la base complète.
                  </p>
                </div>
              ) : (
                filteredFoods.map((food) => (
                  <FoodResult
                    key={food.id}
                    food={food}
                    onSelect={() => selectFood(food)}
                  />
                ))
              )}
            </div>
          )}

          {selectedFood && (
            <form onSubmit={addItem} className="mt-4">
              <SelectedFoodCard
                food={selectedFood}
                quantityG={quantityG}
                onChangeQuantity={setQuantityG}
                previewItem={previewItem}
                onClear={() => {
                  setSelectedFoodId("");
                  setQuery("");
                  setQuantityG("");
                }}
              />

              <button
                type="submit"
                disabled={!selectedFood || parseQuantity(quantityG) <= 0}
                className="mt-btn-primary mt-4 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Ajouter au repas
              </button>
            </form>
          )}
        </section>

        <section className="mt-card rounded-[28px] p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[var(--mt-rouge)]">
                Récap
              </p>
              <h2 className="mt-1 text-[24px] font-black tracking-[-0.04em] text-[var(--mt-ink)]">
                Repas en cours
              </h2>
            </div>

            <div className="shrink-0 rounded-full bg-[var(--mt-rouge-wash)] px-3 py-2 text-[12px] font-black text-[var(--mt-rouge-deep)]">
              {formatMacro(totals.calories, " kcal")}
            </div>
          </div>

          <div className="mt-5">
            {items.length === 0 ? (
              <div className="rounded-[22px] border border-dashed border-[var(--mt-line-2)] bg-[var(--mt-card-soft)] p-5 text-center">
                <p className="text-[20px] font-black text-[var(--mt-ink)]">
                  Aucun aliment ajouté
                </p>
                <p className="mt-2 text-[13px] font-semibold leading-6 text-[var(--mt-ink-2)]">
                  Sélectionne un aliment plus haut pour commencer le repas.
                </p>
              </div>
            ) : (
              <div className="grid gap-3">
                {items.map((item) => (
                  <MealItemRow
                    key={item.id}
                    item={item}
                    onRemove={() => removeItem(item.id)}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="mt-5 grid gap-2">
            <button
              type="button"
              onClick={() => saveMeal("dashboard")}
              disabled={items.length === 0}
              className="mt-btn-primary disabled:cursor-not-allowed disabled:opacity-40"
            >
              Enregistrer le repas
            </button>

            <button
              type="button"
              onClick={() => saveMeal("journal")}
              disabled={items.length === 0}
              className="rounded-[18px] bg-white px-4 py-4 text-[13px] font-black text-[var(--mt-ink)] shadow-[var(--mt-shadow-sm)] ring-1 ring-[var(--mt-line)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Enregistrer et voir le journal
            </button>

            {recipeFlash && (
              <p className="rounded-[14px] bg-[var(--mt-success-soft)] px-3 py-2.5 text-center text-[12px] font-bold text-[var(--mt-success)]">
                {recipeFlash}
              </p>
            )}

            {items.length > 0 && !showRecipeForm && !recipeFlash && (
              <button
                type="button"
                onClick={() => {
                  setRecipeName(name.trim());
                  setShowRecipeForm(true);
                }}
                className="rounded-[18px] bg-[var(--mt-card-soft)] px-4 py-3.5 text-[13px] font-black text-[var(--mt-ink-2)] ring-1 ring-[var(--mt-line)]"
              >
                Sauvegarder en recette…
              </button>
            )}

            {showRecipeForm && (
              <div className="rounded-[20px] bg-[var(--mt-card-soft)] p-4 ring-1 ring-[var(--mt-line)]">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-[var(--mt-rouge)]">
                  Nom de la recette
                </p>
                <input
                  value={recipeName}
                  onChange={(e) => setRecipeName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSaveAsRecipe()}
                  className="AddInput mt-3"
                  placeholder="Ex : Tortillas au poulet"
                  autoFocus
                />
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleSaveAsRecipe}
                    className="mt-btn-primary py-3 text-[13px]"
                  >
                    Sauvegarder
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowRecipeForm(false)}
                    className="rounded-[18px] bg-white px-4 py-3 text-[13px] font-black text-[var(--mt-ink)] ring-1 ring-[var(--mt-line)]"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        <div className="h-10" />
      </div>
    </AppShell>
  );
}

function SummaryGlass({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[18px] border border-white/18 bg-white/14 p-3 backdrop-blur">
      <p className="text-[10.5px] font-bold text-white/72">{label}</p>
      <p className="mt-1 text-[19px] font-black leading-none tracking-[-0.04em]">
        {value}
      </p>
    </div>
  );
}

function QuickTab({
  children,
  active,
  onClick,
}: {
  children: ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-full px-4 py-2.5 text-[12px] font-black ${
        active
          ? "bg-[var(--mt-ink)] text-white"
          : "bg-white text-[var(--mt-ink-2)] ring-1 ring-[var(--mt-line)]"
      }`}
    >
      {children}
    </button>
  );
}

function QuickFoodsRail({
  foods,
  mode,
  onSelect,
}: {
  foods: Food[];
  mode: QuickMode;
  onSelect: (food: Food) => void;
}) {
  const emptyText = {
    favorites: "Aucun favori pour le moment.",
    recent: "Les aliments récents apparaîtront après les premiers repas.",
    frequent: "Les aliments fréquents apparaîtront avec l’usage.",
    essentials: "Aucun aliment essentiel disponible.",
  }[mode];

  if (foods.length === 0) {
    return (
      <div className="rounded-[22px] border border-dashed border-[var(--mt-line-2)] bg-[var(--mt-card-soft)] p-4 text-center">
        <p className="text-[13px] font-bold leading-6 text-[var(--mt-ink-2)]">
          {emptyText}
        </p>
      </div>
    );
  }

  return (
    <div className="flex gap-2 overflow-x-auto py-[2px] pb-1">
      {foods.map((food) => (
        <button
          key={food.id}
          type="button"
          onClick={() => onSelect(food)}
          className="w-[150px] shrink-0 rounded-[20px] bg-white p-3 text-left shadow-[var(--mt-shadow-sm)] ring-1 ring-[var(--mt-line)]"
        >
          <div className="grid h-10 w-10 place-items-center rounded-[14px] bg-[var(--mt-rouge-wash)] text-[var(--mt-rouge-deep)]">
            <span className="text-[16px] font-black">
              {food.name.slice(0, 1).toUpperCase()}
            </span>
          </div>

          <p className="mt-3 line-clamp-2 text-[12px] font-black leading-tight text-[var(--mt-ink)]">
            {food.name}
          </p>
          <p className="mt-2 text-[10px] font-bold text-[var(--mt-ink-3)]">
            {food.servingSizeG
              ? `${food.servingName || "Portion"} · ${food.servingSizeG}g`
              : `${food.caloriesPer100g ?? "—"} kcal`}
          </p>
        </button>
      ))}
    </div>
  );
}

function FoodResult({ food, onSelect }: { food: Food; onSelect: () => void }) {
  const complete = isFoodComplete(food);

  return (
    <button
      type="button"
      onClick={onSelect}
      className="flex w-full items-center gap-3 rounded-[22px] border border-[var(--mt-line)] bg-white p-3 text-left shadow-[var(--mt-shadow-sm)]"
    >
      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-[16px] bg-gradient-to-br from-[var(--mt-rouge-lit)] to-[var(--mt-rouge-deep)] text-white">
        <span className="text-[19px] font-black">
          {food.name.slice(0, 1).toUpperCase()}
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <p className="line-clamp-1 text-[14px] font-black text-[var(--mt-ink)]">
          {food.name}
        </p>
        <p className="mt-1 line-clamp-1 text-[11px] font-bold text-[var(--mt-ink-2)]">
          {food.brand ? `${food.brand} · ` : ""}
          {food.category}
        </p>
      </div>

      <div className="text-right">
        <p className="text-[20px] font-black leading-none text-[var(--mt-ink)]">
          {food.caloriesPer100g ?? "—"}
        </p>
        <p className="mt-1 text-[9px] font-black uppercase text-[var(--mt-ink-3)]">
          kcal
        </p>
        <p
          className={`mt-2 rounded-full px-2 py-1 text-[9px] font-black ${
            complete
              ? "bg-[var(--mt-success-soft)] text-[var(--mt-success)]"
              : "bg-[var(--mt-rouge-wash)] text-[var(--mt-rouge-deep)]"
          }`}
        >
          {complete ? "OK" : "Partiel"}
        </p>
      </div>
    </button>
  );
}

function SelectedFoodCard({
  food,
  quantityG,
  onChangeQuantity,
  previewItem,
  onClear,
}: {
  food: Food;
  quantityG: string;
  onChangeQuantity: (value: string) => void;
  previewItem: MealItem | null;
  onClear: () => void;
}) {
  return (
    <div className="rounded-[24px] bg-[var(--mt-card-soft)] p-4 ring-1 ring-[var(--mt-line)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-black uppercase tracking-[0.14em] text-[var(--mt-rouge)]">
            Sélectionné
          </p>
          <h3 className="mt-2 text-[18px] font-black leading-tight tracking-[-0.02em] text-[var(--mt-ink)]">
            {food.name}
          </h3>
          <p className="mt-1 text-[12px] font-bold text-[var(--mt-ink-2)]">
            {food.brand ? `${food.brand} · ` : ""}
            {getSourceLabel(food.source)}
          </p>
        </div>

        <button
          type="button"
          onClick={onClear}
          className="shrink-0 rounded-full bg-white px-3 py-2 text-[11px] font-black text-[var(--mt-ink)] ring-1 ring-[var(--mt-line)]"
        >
          Changer
        </button>
      </div>

      {/* Stepper de portions — seulement si l'aliment a une portion définie */}
      {food.servingSizeG ? (
        <>
          <div className="mt-4">
            <p className="mb-3 text-[11px] font-black uppercase tracking-[0.12em] text-[var(--mt-ink-2)]">
              Portions
            </p>
            <div className="flex items-center overflow-hidden rounded-[18px] ring-1 ring-[var(--mt-line)]">
              <button
                type="button"
                onClick={() => {
                  const count = Math.max(1, Math.round(parseQuantity(quantityG) / food.servingSizeG!));
                  const next = Math.max(1, count - 1);
                  onChangeQuantity(String(next * food.servingSizeG!));
                }}
                className="flex h-[64px] w-[64px] shrink-0 items-center justify-center bg-[var(--mt-card-soft)] text-[28px] font-black text-[var(--mt-ink-2)]"
              >
                −
              </button>

              <div className="flex-1 border-x border-[var(--mt-line)] bg-[var(--mt-card-soft)] py-2 text-center">
                <p className="text-[34px] font-black leading-none tracking-[-0.04em] text-[var(--mt-ink)]">
                  {Math.max(1, Math.round(parseQuantity(quantityG) / food.servingSizeG!))}
                </p>
                <p className="mt-1 text-[11px] font-bold text-[var(--mt-ink-3)]">
                  {(() => {
                    const count = Math.max(1, Math.round(parseQuantity(quantityG) / food.servingSizeG!));
                    const label = food.servingName || "portion";
                    const actualG = parseQuantity(quantityG) > 0 ? parseQuantity(quantityG) : count * food.servingSizeG!;
                    return `${label} · ${actualG}g`;
                  })()}
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  const count = Math.max(1, Math.round(parseQuantity(quantityG) / food.servingSizeG!));
                  onChangeQuantity(String((count + 1) * food.servingSizeG!));
                }}
                className="flex h-[64px] w-[64px] shrink-0 items-center justify-center bg-[var(--mt-card-soft)] text-[28px] font-black text-[var(--mt-ink-2)]"
              >
                +
              </button>
            </div>
          </div>

          <div className="my-4 flex items-center gap-3">
            <div className="h-px flex-1 bg-[var(--mt-line)]" />
            <p className="text-[11px] font-bold text-[var(--mt-ink-3)]">ou en grammes précis</p>
            <div className="h-px flex-1 bg-[var(--mt-line)]" />
          </div>
        </>
      ) : (
        <p className="mb-2 mt-4 text-[11px] font-black uppercase tracking-[0.12em] text-[var(--mt-ink-2)]">
          Quantité
        </p>
      )}

      <input
        value={quantityG}
        onChange={(event) => onChangeQuantity(event.target.value)}
        className="AddInput"
        placeholder="Ex : 150"
      />

      <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
        {[50, 100, 150, 200].map((quantity) => (
          <QuantityChip
            key={quantity}
            label={`${quantity}g`}
            onClick={() => onChangeQuantity(String(quantity))}
          />
        ))}
      </div>

      {previewItem && (
        <div className="mt-4 grid grid-cols-4 gap-2">
          <PreviewMini
            label="Kcal"
            value={formatMacro(previewItem.calories, "")}
          />
          <PreviewMini
            label="Prot."
            value={formatMacro(previewItem.proteinG, "g")}
          />
          <PreviewMini
            label="Gluc."
            value={formatMacro(previewItem.carbsG, "g")}
          />
          <PreviewMini
            label="Lip."
            value={formatMacro(previewItem.fatG, "g")}
          />
        </div>
      )}

      {!isFoodComplete(food) && (
        <p className="mt-4 rounded-[18px] bg-[var(--mt-warn-soft)] p-3 text-[12px] font-bold leading-5 text-[var(--mt-warn)]">
          Valeurs nutritionnelles incomplètes : les totaux peuvent être partiels.
        </p>
      )}
    </div>
  );
}

function QuantityChip({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="shrink-0 rounded-full bg-white px-3 py-2 text-[11px] font-black text-[var(--mt-ink)] ring-1 ring-[var(--mt-line)]"
    >
      {label}
    </button>
  );
}

function PreviewMini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[16px] bg-white p-2.5 text-center ring-1 ring-[var(--mt-line)]">
      <p className="text-[9px] font-black uppercase text-[var(--mt-ink-3)]">
        {label}
      </p>
      <p className="mt-1 text-[12px] font-black text-[var(--mt-ink)]">{value}</p>
    </div>
  );
}

function MealItemRow({
  item,
  onRemove,
}: {
  item: MealItem;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-[22px] border border-[var(--mt-line)] bg-white p-3 shadow-[var(--mt-shadow-sm)]">
      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-[15px] bg-[var(--mt-rouge-wash)] text-[var(--mt-rouge-deep)]">
        <span className="text-[17px] font-black">
          {item.foodNameSnapshot.slice(0, 1).toUpperCase()}
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <p className="line-clamp-1 text-[14px] font-black text-[var(--mt-ink)]">
          {item.foodNameSnapshot}
        </p>
        <p className="mt-1 text-[12px] font-bold text-[var(--mt-ink-2)]">
          {item.quantityG} g · {formatMacro(item.proteinG, "g")} P
        </p>
      </div>

      <div className="text-right">
        <p className="text-[19px] font-black leading-none text-[var(--mt-ink)]">
          {formatMacro(item.calories, "")}
        </p>
        <p className="mt-1 text-[9px] font-black uppercase text-[var(--mt-ink-3)]">
          kcal
        </p>

        <button
          type="button"
          onClick={onRemove}
          className="mt-2 rounded-full bg-[var(--mt-rouge-wash)] px-3 py-2 text-[11px] font-black text-[var(--mt-rouge-deep)]"
        >
          Retirer
        </button>
      </div>
    </div>
  );
}

function SearchIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4-4" />
    </svg>
  );
}

function BarcodeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 5v14" /><path d="M8 5v14" /><path d="M12 5v14" />
      <path d="M17 5v14" /><path d="M21 5v14" />
    </svg>
  );
}