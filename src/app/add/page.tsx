"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
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
import { Food, MealItem, MealType } from "@/types/nutrition";

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

export default function AddMealPage() {
  const router = useRouter();
  const { foods, addMeal } = useNutritionStore();

  const [date, setDate] = useState(todayLocalDate());
  const [type, setType] = useState<MealType>("breakfast");
  const [name, setName] = useState("");
  const [query, setQuery] = useState("");
  const [selectedFoodId, setSelectedFoodId] = useState("");
  const [quantityG, setQuantityG] = useState("");
  const [items, setItems] = useState<MealItem[]>([]);
  const [includeFullDatabase, setIncludeFullDatabase] = useState(false);

  const selectedFood = foods.find((food) => food.id === selectedFoodId) ?? null;

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
      .slice(0, hasQuery || includeFullDatabase ? 25 : 12);
  }, [foods, query, includeFullDatabase]);

  const favoriteFoods = foods
    .filter((food) => food.isFavorite)
    .sort((a, b) => compareFoodsForSearch(a, b, ""))
    .slice(0, 10);

  const essentialFoods = foods
    .filter((food) => food.isEssential && !food.isFavorite)
    .sort((a, b) => compareFoodsForSearch(a, b, ""))
    .slice(0, 12);

  const draftMeal = {
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

    if (food.servingSizeG) {
      setQuantityG(String(food.servingSizeG));
    } else {
      setQuantityG("100");
    }
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

  function saveMeal(destination: "journal" | "dashboard") {
    if (items.length === 0) return;

    addMeal({
      date,
      type,
      name: name.trim() || undefined,
      items,
    });

    if (destination === "dashboard") {
      router.push("/");
    } else {
      router.push("/journal");
    }
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl">
        <header className="mb-7 flex flex-col justify-between gap-4 md:flex-row md:items-start">
          <div>
            <p className="text-sm font-bold text-[#E94B4B]">Nouveau repas</p>
            <h1 className="mt-2 text-4xl font-black tracking-tight text-[#171717] md:text-5xl">
              Ajouter un repas
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#7A746E] md:text-base">
              Recherche un aliment, choisis la quantité, puis construis un repas
              simple et clair.
            </p>
          </div>

          <button
            onClick={() => setIncludeFullDatabase((current) => !current)}
            className={`w-fit rounded-full px-5 py-3 text-sm font-bold shadow-sm transition ${
              includeFullDatabase
                ? "bg-[#E94B4B] text-white shadow-[0_16px_30px_rgba(233,75,75,0.22)]"
                : "bg-white text-[#171717] ring-1 ring-black/5 hover:bg-[#FFF2EE]"
            }`}
          >
            {includeFullDatabase ? "Base complète active" : "Inclure Ciqual complet"}
          </button>
        </header>

        <section className="mb-5 grid gap-4 md:grid-cols-3">
          <div className="rounded-[34px] bg-white p-5 shadow-[0_16px_38px_rgba(28,21,18,0.06)] ring-1 ring-black/5">
            <p className="text-sm font-semibold text-[#7A746E]">Date</p>
            <input
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              className="input mt-3"
            />
          </div>

          <div className="rounded-[34px] bg-white p-5 shadow-[0_16px_38px_rgba(28,21,18,0.06)] ring-1 ring-black/5">
            <p className="text-sm font-semibold text-[#7A746E]">Type de repas</p>
            <select
              value={type}
              onChange={(event) => setType(event.target.value as MealType)}
              className="input mt-3"
            >
              {Object.entries(mealTypeLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-[34px] bg-white p-5 shadow-[0_16px_38px_rgba(28,21,18,0.06)] ring-1 ring-black/5">
            <p className="text-sm font-semibold text-[#7A746E]">Nom optionnel</p>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="input mt-3"
              placeholder="Ex : dîner léger, post-training..."
            />
          </div>
        </section>

        <section className="grid gap-5 xl:grid-cols-[1fr_0.82fr]">
          <div className="space-y-5">
            <div className="rounded-[42px] bg-white p-6 shadow-[0_24px_60px_rgba(28,21,18,0.08)] ring-1 ring-black/5">
              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                <div>
                  <h2 className="text-2xl font-black tracking-tight text-[#171717]">
                    Choisir un aliment
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-[#7A746E]">
                    Les aliments essentiels et favoris remontent en premier.
                  </p>
                </div>
              </div>

              {favoriteFoods.length > 0 && (
                <QuickFoodSection
                  title="Favoris rapides"
                  foods={favoriteFoods}
                  onSelect={selectFood}
                  tone="dark"
                />
              )}

              {essentialFoods.length > 0 && (
                <QuickFoodSection
                  title="Essentiels rapides"
                  foods={essentialFoods}
                  onSelect={selectFood}
                  tone="red"
                />
              )}

              <form onSubmit={addItem} className="mt-6 space-y-4">
                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-[#171717]">
                    Rechercher
                  </span>
                  <input
                    value={query}
                    onChange={(event) => {
                      setQuery(event.target.value);
                      setSelectedFoodId("");
                    }}
                    className="input"
                    placeholder="Ex : œuf, poulet, riz, banane..."
                  />
                </label>

                {query.trim().length > 0 && !selectedFood && (
                  <div className="max-h-[420px] space-y-2 overflow-y-auto rounded-[30px] bg-[#FFFAF5] p-2 ring-1 ring-black/5">
                    {filteredFoods.length === 0 ? (
                      <div className="p-5 text-sm text-[#7A746E]">
                        Aucun aliment trouvé. Tu peux l’ajouter dans la page
                        Aliments ou l’importer via Open Food Facts.
                      </div>
                    ) : (
                      filteredFoods.map((food) => (
                        <FoodSearchResult
                          key={food.id}
                          food={food}
                          onSelect={() => selectFood(food)}
                        />
                      ))
                    )}
                  </div>
                )}

                {selectedFood && (
                  <div className="rounded-[34px] bg-[#FFFAF5] p-5 ring-1 ring-black/5">
                    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                      <div>
                        <p className="text-sm font-bold text-[#E94B4B]">
                          Aliment sélectionné
                        </p>

                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <h3 className="text-xl font-black text-[#171717]">
                            {selectedFood.name}
                          </h3>

                          {selectedFood.isEssential && (
                            <Badge tone="red">Essentiel</Badge>
                          )}

                          {selectedFood.isFavorite && (
                            <Badge tone="dark">Favori</Badge>
                          )}
                        </div>

                        <p className="mt-2 text-sm text-[#7A746E]">
                          {selectedFood.brand ? `${selectedFood.brand} · ` : ""}
                          {selectedFood.category}
                        </p>

                        {selectedFood.officialName &&
                          selectedFood.officialName !== selectedFood.name && (
                            <p className="mt-1 text-xs leading-5 text-[#9B948E]">
                              Nom officiel : {selectedFood.officialName}
                            </p>
                          )}

                        <p className="mt-1 text-xs text-[#9B948E]">
                          Source : {getSourceLabel(selectedFood.source)}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedFoodId("");
                          setQuery("");
                          setQuantityG("");
                        }}
                        className="rounded-full bg-white px-4 py-2 text-xs font-bold text-[#171717] shadow-sm ring-1 ring-black/5 hover:bg-[#FFF2EE]"
                      >
                        Changer
                      </button>
                    </div>

                    <div className="mt-5">
                      <label className="block">
                        <span className="mb-2 block text-sm font-bold text-[#171717]">
                          Quantité en grammes
                        </span>
                        <input
                          value={quantityG}
                          onChange={(event) => setQuantityG(event.target.value)}
                          className="input"
                          placeholder="Ex : 150"
                        />
                      </label>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {selectedFood.servingSizeG && (
                        <QuantityButton
                          label={`${selectedFood.servingName || "Portion"} · ${
                            selectedFood.servingSizeG
                          } g`}
                          onClick={() =>
                            setQuantityG(String(selectedFood.servingSizeG))
                          }
                        />
                      )}

                      {[50, 100, 150, 200].map((quantity) => (
                        <QuantityButton
                          key={quantity}
                          label={`${quantity} g`}
                          onClick={() => setQuantityG(String(quantity))}
                        />
                      ))}
                    </div>

                    {previewItem && (
                      <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
                        <PreviewStat
                          label="Calories"
                          value={previewItem.calories}
                          suffix="kcal"
                        />
                        <PreviewStat
                          label="Protéines"
                          value={previewItem.proteinG}
                          suffix="g"
                        />
                        <PreviewStat
                          label="Glucides"
                          value={previewItem.carbsG}
                          suffix="g"
                        />
                        <PreviewStat
                          label="Lipides"
                          value={previewItem.fatG}
                          suffix="g"
                        />
                      </div>
                    )}

                    {!isFoodComplete(selectedFood) && (
                      <p className="mt-4 rounded-[24px] border border-orange-200 bg-orange-50 p-3 text-sm text-orange-900">
                        Cet aliment a des valeurs nutritionnelles incomplètes.
                        Les totaux du repas peuvent être partiels.
                      </p>
                    )}
                  </div>
                )}

                <button
                  disabled={!selectedFood || parseQuantity(quantityG) <= 0}
                  className="w-full rounded-[24px] bg-[#E94B4B] px-5 py-4 text-sm font-black text-white shadow-[0_18px_34px_rgba(233,75,75,0.26)] transition hover:bg-[#B92D35] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Ajouter au repas
                </button>
              </form>
            </div>
          </div>

          <aside className="xl:sticky xl:top-8 xl:self-start">
            <div className="rounded-[42px] bg-white p-6 shadow-[0_24px_60px_rgba(28,21,18,0.08)] ring-1 ring-black/5">
              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start xl:flex-col">
                <div>
                  <p className="text-sm font-bold text-[#E94B4B]">
                    Repas en cours
                  </p>
                  <h2 className="mt-1 text-3xl font-black tracking-tight text-[#171717]">
                    {items.length === 0
                      ? "Encore vide"
                      : `${items.length} aliment(s)`}
                  </h2>
                  <p className="mt-2 text-sm text-[#7A746E]">
                    {mealTypeLabels[type]}
                  </p>
                </div>

                <div className="rounded-full bg-[#FFE1DD] px-4 py-2 text-sm font-black text-[#B92D35]">
                  {formatMacro(totals.calories, " kcal")}
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <Total label="Protéines" value={totals.proteinG} suffix="g" />
                <Total label="Glucides" value={totals.carbsG} suffix="g" />
                <Total label="Lipides" value={totals.fatG} suffix="g" />
                <Total
                  label="Incomplets"
                  value={totals.incompleteItems}
                  suffix=""
                />
              </div>

              <div className="mt-6 space-y-3">
                {items.length === 0 ? (
                  <div className="rounded-[30px] border border-dashed border-black/10 bg-[#FFFAF5] p-8 text-center">
                    <p className="font-black text-[#171717]">
                      Ton repas est vide
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[#7A746E]">
                      Sélectionne un aliment à gauche pour commencer.
                    </p>
                  </div>
                ) : (
                  items.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-[28px] bg-[#FFFAF5] p-4 ring-1 ring-black/5"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-black text-[#171717]">
                            {item.foodNameSnapshot}
                          </p>

                          {item.brandSnapshot && (
                            <p className="mt-1 text-sm text-[#7A746E]">
                              {item.brandSnapshot}
                            </p>
                          )}

                          <p className="mt-1 text-sm text-[#7A746E]">
                            {item.quantityG} g
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="font-black text-[#171717]">
                            {formatMacro(item.calories, " kcal")}
                          </p>
                          <p className="mt-1 text-xs text-[#7A746E]">
                            {formatMacro(item.proteinG, " g")} P
                          </p>

                          <button
                            type="button"
                            onClick={() => removeItem(item.id)}
                            className="mt-3 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-[#B92D35] ring-1 ring-red-100 hover:bg-[#FFE1DD]"
                          >
                            Retirer
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="mt-6 grid gap-3">
                <button
                  onClick={() => saveMeal("dashboard")}
                  disabled={items.length === 0}
                  className="rounded-[24px] bg-[#E94B4B] px-5 py-4 text-sm font-black text-white shadow-[0_18px_34px_rgba(233,75,75,0.26)] transition hover:bg-[#B92D35] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Enregistrer et revenir au dashboard
                </button>

                <button
                  onClick={() => saveMeal("journal")}
                  disabled={items.length === 0}
                  className="rounded-[24px] bg-[#FFFAF5] px-5 py-4 text-sm font-black text-[#171717] ring-1 ring-black/5 transition hover:bg-[#FFE1DD] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Enregistrer et voir le journal
                </button>
              </div>
            </div>
          </aside>
        </section>
      </div>
    </AppShell>
  );
}

function QuickFoodSection({
  title,
  foods,
  onSelect,
  tone,
}: {
  title: string;
  foods: Food[];
  onSelect: (food: Food) => void;
  tone: "red" | "dark";
}) {
  return (
    <div className="mt-6">
      <p className="mb-3 text-sm font-black text-[#171717]">{title}</p>

      <div className="flex flex-wrap gap-2">
        {foods.map((food) => (
          <button
            key={food.id}
            type="button"
            onClick={() => onSelect(food)}
            className={`rounded-full px-4 py-2 text-sm font-bold transition ${
              tone === "red"
                ? "bg-[#FFE1DD] text-[#B92D35] hover:bg-[#FFD2CB]"
                : "bg-[#FFFAF5] text-[#171717] ring-1 ring-black/5 hover:bg-[#FFF2EE]"
            }`}
          >
            {food.name}
          </button>
        ))}
      </div>
    </div>
  );
}

function FoodSearchResult({
  food,
  onSelect,
}: {
  food: Food;
  onSelect: () => void;
}) {
  const complete = isFoodComplete(food);

  return (
    <button
      type="button"
      onClick={onSelect}
      className="w-full rounded-[24px] bg-white p-4 text-left shadow-sm ring-1 ring-black/5 transition hover:bg-[#FFF2EE]"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-black text-[#171717]">{food.name}</p>

            {food.isEssential && <Badge tone="red">Essentiel</Badge>}
            {food.isFavorite && <Badge tone="dark">Favori</Badge>}
          </div>

          <p className="mt-1 text-sm text-[#7A746E]">
            {food.brand ? `${food.brand} · ` : ""}
            {food.category}
          </p>

          {food.officialName && food.officialName !== food.name && (
            <p className="mt-1 text-xs leading-5 text-[#9B948E]">
              Nom officiel : {food.officialName}
            </p>
          )}

          <p className="mt-1 text-xs text-[#9B948E]">
            Source : {getSourceLabel(food.source)}
          </p>
        </div>

        <span
          className={`shrink-0 rounded-full px-2 py-1 text-xs font-bold ${
            complete
              ? "bg-green-100 text-green-800"
              : "bg-orange-100 text-orange-800"
          }`}
        >
          {complete ? "Complet" : "À compléter"}
        </span>
      </div>
    </button>
  );
}

function Badge({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: "red" | "dark";
}) {
  return (
    <span
      className={`rounded-full px-2 py-1 text-xs font-bold ${
        tone === "red"
          ? "bg-[#E94B4B] text-white"
          : "bg-[#171717] text-white"
      }`}
    >
      {children}
    </span>
  );
}

function QuantityButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-[#171717] ring-1 ring-black/5 hover:bg-[#FFF2EE]"
    >
      {label}
    </button>
  );
}

function PreviewStat({
  label,
  value,
  suffix,
}: {
  label: string;
  value: number | null;
  suffix: string;
}) {
  return (
    <div className="rounded-[24px] bg-white p-4 ring-1 ring-black/5">
      <p className="text-xs font-semibold text-[#7A746E]">{label}</p>
      <p className="mt-1 font-black text-[#171717]">
        {value ?? "—"} {value !== null ? suffix : ""}
      </p>
    </div>
  );
}

function Total({
  label,
  value,
  suffix,
}: {
  label: string;
  value: number | null;
  suffix: string;
}) {
  return (
    <div className="rounded-[24px] bg-[#FFFAF5] p-4 ring-1 ring-black/5">
      <p className="text-xs font-semibold text-[#7A746E]">{label}</p>
      <p className="mt-1 text-xl font-black text-[#171717]">
        {value ?? "—"} {value !== null ? suffix : ""}
      </p>
    </div>
  );
}