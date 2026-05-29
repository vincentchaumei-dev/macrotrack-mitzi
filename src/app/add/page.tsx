"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { useNutritionStore } from "@/hooks/useNutritionStore";
import {
  buildMealItem,
  calculateMealTotals,
  formatMacro,
  isFoodComplete,
  mealTypeLabels,
  todayLocalDate,
} from "@/lib/nutrition";
import { Food, MealItem, MealType } from "@/types/nutrition";

function parseQuantity(value: string) {
  const parsed = Number(value.replace(",", "."));
  return Number.isNaN(parsed) ? 0 : parsed;
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

  const selectedFood = foods.find((food) => food.id === selectedFoodId) ?? null;

  const filteredFoods = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return foods
      .filter((food) => {
        if (!normalizedQuery) return true;

        return (
          food.name.toLowerCase().includes(normalizedQuery) ||
          food.brand?.toLowerCase().includes(normalizedQuery) ||
          food.category.toLowerCase().includes(normalizedQuery)
        );
      })
      .sort((a, b) => {
        if (a.isFavorite && !b.isFavorite) return -1;
        if (!a.isFavorite && b.isFavorite) return 1;
        return a.name.localeCompare(b.name);
      })
      .slice(0, 20);
  }, [foods, query]);

  const favoriteFoods = foods
    .filter((food) => food.isFavorite)
    .sort((a, b) => a.name.localeCompare(b.name))
    .slice(0, 8);

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
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <p className="text-sm font-medium text-[#E85A0C]">Nouveau repas</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            Ajouter un repas
          </h1>
          <p className="mt-2 max-w-2xl text-gray-500">
            Sélectionne les aliments, indique les quantités, puis enregistre le
            repas. Les calculs se font automatiquement.
          </p>
        </div>
      </div>

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-6">
          <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5">
            <h2 className="text-xl font-semibold">Infos du repas</h2>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <Field label="Date">
                <input
                  type="date"
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                  className="input"
                />
              </Field>

              <Field label="Type de repas">
                <select
                  value={type}
                  onChange={(event) => setType(event.target.value as MealType)}
                  className="input"
                >
                  {Object.entries(mealTypeLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <div className="mt-4">
              <Field label="Nom optionnel">
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="input"
                  placeholder="Ex : Post-training, dîner léger, brunch..."
                />
              </Field>
            </div>
          </section>

          <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5">
            <h2 className="text-xl font-semibold">Ajouter un aliment</h2>

            {favoriteFoods.length > 0 && (
              <div className="mt-5">
                <p className="mb-2 text-sm font-medium text-gray-700">
                  Favoris rapides
                </p>

                <div className="flex flex-wrap gap-2">
                  {favoriteFoods.map((food) => (
                    <button
                      key={food.id}
                      type="button"
                      onClick={() => selectFood(food)}
                      className="rounded-full border border-black/10 bg-[#FAFAF8] px-4 py-2 text-sm text-gray-700 hover:bg-black/5"
                    >
                      {food.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <form onSubmit={addItem} className="mt-5 space-y-4">
              <Field label="Rechercher un aliment">
                <input
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value);
                    setSelectedFoodId("");
                  }}
                  className="input"
                  placeholder="Ex : riz, skyr, pain, œuf..."
                />
              </Field>

              {query.trim().length > 0 && (
                <div className="max-h-80 space-y-2 overflow-y-auto rounded-2xl border border-black/5 bg-[#FAFAF8] p-2">
                  {filteredFoods.length === 0 ? (
                    <div className="p-4 text-sm text-gray-500">
                      Aucun aliment trouvé. Ajoute-le d’abord dans la page
                      Aliments.
                    </div>
                  ) : (
                    filteredFoods.map((food) => {
                      const selected = food.id === selectedFoodId;
                      const complete = isFoodComplete(food);

                      return (
                        <button
                          key={food.id}
                          type="button"
                          onClick={() => selectFood(food)}
                          className={`w-full rounded-xl p-3 text-left transition ${
                            selected
                              ? "bg-[#10121A] text-white"
                              : "bg-white hover:bg-black/5"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-medium">{food.name}</p>
                              <p
                                className={`mt-1 text-sm ${
                                  selected ? "text-white/60" : "text-gray-500"
                                }`}
                              >
                                {food.brand ? `${food.brand} · ` : ""}
                                {food.category}
                              </p>
                            </div>

                            <div className="flex shrink-0 flex-col items-end gap-1">
                              {food.isFavorite && (
                                <span
                                  className={`rounded-full px-2 py-1 text-xs ${
                                    selected
                                      ? "bg-white/10 text-white"
                                      : "bg-[#10121A] text-white"
                                  }`}
                                >
                                  Favori
                                </span>
                              )}

                              <span
                                className={`rounded-full px-2 py-1 text-xs ${
                                  complete
                                    ? selected
                                      ? "bg-green-400/20 text-green-100"
                                      : "bg-green-100 text-green-800"
                                    : selected
                                    ? "bg-orange-400/20 text-orange-100"
                                    : "bg-orange-100 text-orange-800"
                                }`}
                              >
                                {complete ? "Complet" : "À compléter"}
                              </span>
                            </div>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              )}

              {selectedFood && (
                <div className="rounded-2xl border border-black/5 bg-[#FAFAF8] p-4">
                  <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                    <div>
                      <p className="text-sm text-gray-500">Aliment sélectionné</p>
                      <h3 className="mt-1 font-semibold">{selectedFood.name}</h3>

                      <p className="mt-1 text-sm text-gray-500">
                        {selectedFood.brand ? `${selectedFood.brand} · ` : ""}
                        {selectedFood.category}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFoodId("");
                        setQuery("");
                        setQuantityG("");
                      }}
                      className="rounded-full border border-black/10 px-3 py-1.5 text-xs text-gray-500 hover:bg-black/5"
                    >
                      Changer
                    </button>
                  </div>

                  <div className="mt-4">
                    <Field label="Quantité en grammes">
                      <input
                        value={quantityG}
                        onChange={(event) => setQuantityG(event.target.value)}
                        className="input"
                        placeholder="Ex : 150"
                      />
                    </Field>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {selectedFood.servingSizeG && (
                      <button
                        type="button"
                        onClick={() => setQuantityG(String(selectedFood.servingSizeG))}
                        className="rounded-full border border-black/10 bg-white px-3 py-1.5 text-xs text-gray-600 hover:bg-black/5"
                      >
                        {selectedFood.servingName || "Portion"} ·{" "}
                        {selectedFood.servingSizeG} g
                      </button>
                    )}

                    {[50, 100, 150, 200].map((quantity) => (
                      <button
                        key={quantity}
                        type="button"
                        onClick={() => setQuantityG(String(quantity))}
                        className="rounded-full border border-black/10 bg-white px-3 py-1.5 text-xs text-gray-600 hover:bg-black/5"
                      >
                        {quantity} g
                      </button>
                    ))}
                  </div>

                  {previewItem && (
                    <div className="mt-4 grid gap-3 sm:grid-cols-4">
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

                  {selectedFood && !isFoodComplete(selectedFood) && (
                    <p className="mt-4 rounded-2xl border border-orange-200 bg-orange-50 p-3 text-sm text-orange-900">
                      Cet aliment a des valeurs nutritionnelles incomplètes. Les
                      totaux du repas peuvent être partiels.
                    </p>
                  )}
                </div>
              )}

              <button
                disabled={!selectedFood || parseQuantity(quantityG) <= 0}
                className="w-full rounded-2xl bg-[#10121A] px-5 py-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                Ajouter au repas
              </button>
            </form>
          </section>
        </div>

        <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
            <div>
              <h2 className="text-xl font-semibold">Repas en cours</h2>
              <p className="mt-1 text-sm text-gray-500">
                {items.length === 0
                  ? "Aucun aliment ajouté."
                  : `${items.length} aliment(s) ajouté(s).`}
              </p>
            </div>

            <div className="rounded-full bg-[#FAFAF8] px-4 py-2 text-sm font-medium text-gray-700">
              {mealTypeLabels[type]}
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
            <Total label="Calories" value={totals.calories} suffix="kcal" />
            <Total label="Protéines" value={totals.proteinG} suffix="g" />
            <Total label="Glucides" value={totals.carbsG} suffix="g" />
            <Total label="Lipides" value={totals.fatG} suffix="g" />
          </div>

          {totals.incompleteItems > 0 && (
            <div className="mt-4 rounded-2xl border border-orange-200 bg-orange-50 p-3 text-sm text-orange-900">
              {totals.incompleteItems} aliment(s) incomplet(s) dans ce repas.
            </div>
          )}

          <div className="mt-6 space-y-3">
            {items.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-black/10 bg-[#FAFAF8] p-8 text-center">
                <p className="font-medium">Ton repas est vide</p>
                <p className="mt-1 text-sm text-gray-500">
                  Recherche un aliment à gauche pour commencer.
                </p>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-black/5 bg-[#FAFAF8] p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium">{item.foodNameSnapshot}</p>
                      {item.brandSnapshot && (
                        <p className="mt-1 text-sm text-gray-500">
                          {item.brandSnapshot}
                        </p>
                      )}
                      <p className="mt-1 text-sm text-gray-500">
                        {item.quantityG} g
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="font-semibold">
                        {formatMacro(item.calories, " kcal")}
                      </p>
                      <p className="mt-1 text-sm text-gray-500">
                        {formatMacro(item.proteinG, " g")} P ·{" "}
                        {formatMacro(item.carbsG, " g")} G ·{" "}
                        {formatMacro(item.fatG, " g")} L
                      </p>

                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="mt-3 rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs text-red-700"
                      >
                        Retirer
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-2">
            <button
              onClick={() => saveMeal("journal")}
              disabled={items.length === 0}
              className="rounded-2xl bg-[#E85A0C] px-5 py-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              Enregistrer et voir le journal
            </button>

            <button
              onClick={() => saveMeal("dashboard")}
              disabled={items.length === 0}
              className="rounded-2xl bg-[#10121A] px-5 py-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              Enregistrer et revenir au dashboard
            </button>
          </div>
        </section>
      </section>
    </AppShell>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-gray-700">
        {label}
      </span>
      {children}
    </label>
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
    <div className="rounded-xl bg-white px-3 py-2">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="font-semibold">
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
    <div className="rounded-2xl bg-[#FAFAF8] p-4">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-1 text-xl font-semibold">
        {value ?? "—"} {value !== null ? suffix : ""}
      </p>
    </div>
  );
}