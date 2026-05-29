"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { useNutritionStore } from "@/hooks/useNutritionStore";
import {
  buildMealItem,
  calculateMealTotals,
  mealTypeLabels,
  todayLocalDate,
} from "@/lib/nutrition";
import { MealItem, MealType } from "@/types/nutrition";

export default function AddMealPage() {
  const router = useRouter();
  const { foods, addMeal } = useNutritionStore();

  const [date, setDate] = useState(todayLocalDate());
  const [type, setType] = useState<MealType>("breakfast");
  const [name, setName] = useState("");
  const [selectedFoodId, setSelectedFoodId] = useState("");
  const [quantityG, setQuantityG] = useState("");
  const [items, setItems] = useState<MealItem[]>([]);

  const selectedFood = foods.find((food) => food.id === selectedFoodId);

  const previewItem = useMemo(() => {
    if (!selectedFood || !Number(quantityG)) {
      return null;
    }

    return buildMealItem(selectedFood, Number(quantityG));
  }, [selectedFood, quantityG]);

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

  function addItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedFood || !Number(quantityG)) {
      return;
    }

    setItems((current) => [...current, buildMealItem(selectedFood, Number(quantityG))]);
    setSelectedFoodId("");
    setQuantityG("");
  }

  function saveMeal() {
    if (items.length === 0) {
      return;
    }

    addMeal({
      date,
      type,
      name: name.trim() || undefined,
      items,
    });

    router.push("/journal");
  }

  return (
    <AppShell>
      <div className="mb-8">
        <p className="text-sm font-medium text-[#E85A0C]">Nouveau repas</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">
          Ajouter un repas
        </h1>
        <p className="mt-2 text-gray-500">
          Sélectionne des aliments, indique les quantités, puis enregistre le repas.
        </p>
      </div>

      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5">
          <h2 className="text-xl font-semibold">Informations repas</h2>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <Field label="Date">
              <input
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                className="input"
              />
            </Field>

            <Field label="Type">
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
                placeholder="Ex : Post-training, repas rapide..."
              />
            </Field>
          </div>

          <form onSubmit={addItem} className="mt-8 border-t border-black/5 pt-6">
            <h3 className="font-semibold">Ajouter un aliment</h3>

            <div className="mt-4 space-y-4">
              <Field label="Aliment">
                <select
                  value={selectedFoodId}
                  onChange={(event) => setSelectedFoodId(event.target.value)}
                  className="input"
                >
                  <option value="">Sélectionner un aliment</option>
                  {foods.map((food) => (
                    <option key={food.id} value={food.id}>
                      {food.brand ? `${food.brand} · ` : ""}
                      {food.name}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Quantité en grammes">
                <input
                  value={quantityG}
                  onChange={(event) => setQuantityG(event.target.value)}
                  className="input"
                  placeholder="Ex : 150"
                />
              </Field>

              {selectedFood?.servingSizeG && (
                <button
                  type="button"
                  onClick={() => setQuantityG(String(selectedFood.servingSizeG))}
                  className="rounded-full border border-black/10 px-4 py-2 text-sm text-gray-600"
                >
                  Utiliser la portion : {selectedFood.servingName} ·{" "}
                  {selectedFood.servingSizeG} g
                </button>
              )}

              {previewItem && (
                <div className="rounded-2xl bg-[#FAFAF8] p-4 text-sm">
                  <p className="font-medium">Prévisualisation</p>
                  <p className="mt-1 text-gray-500">
                    {previewItem.calories ?? "—"} kcal ·{" "}
                    {previewItem.proteinG ?? "—"} g protéines ·{" "}
                    {previewItem.carbsG ?? "—"} g glucides ·{" "}
                    {previewItem.fatG ?? "—"} g lipides
                  </p>
                </div>
              )}

              <button className="w-full rounded-2xl bg-[#10121A] px-5 py-3 text-sm font-medium text-white">
                Ajouter au repas
              </button>
            </div>
          </form>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5">
          <h2 className="text-xl font-semibold">Repas en cours</h2>
          <p className="mt-1 text-sm text-gray-500">
            {items.length} aliment(s) ajouté(s).
          </p>

          <div className="mt-5 grid grid-cols-4 gap-3">
            <Total label="Calories" value={totals.calories} suffix="kcal" />
            <Total label="Protéines" value={totals.proteinG} suffix="g" />
            <Total label="Glucides" value={totals.carbsG} suffix="g" />
            <Total label="Lipides" value={totals.fatG} suffix="g" />
          </div>

          <div className="mt-6 space-y-3">
            {items.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-black/10 bg-[#FAFAF8] p-6 text-center text-sm text-gray-500">
                Aucun aliment ajouté pour le moment.
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-black/5 bg-[#FAFAF8] p-4"
                >
                  <div className="flex justify-between gap-4">
                    <div>
                      <p className="font-medium">{item.foodNameSnapshot}</p>
                      <p className="mt-1 text-sm text-gray-500">
                        {item.quantityG} g
                      </p>
                    </div>

                    <div className="text-right text-sm">
                      <p>{item.calories ?? "—"} kcal</p>
                      <p className="text-gray-500">
                        {item.proteinG ?? "—"} P · {item.carbsG ?? "—"} G ·{" "}
                        {item.fatG ?? "—"} L
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <button
            onClick={saveMeal}
            disabled={items.length === 0}
            className="mt-6 w-full rounded-2xl bg-[#E85A0C] px-5 py-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            Enregistrer le repas
          </button>
        </div>
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
    <div className="rounded-2xl bg-[#FAFAF8] p-3">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-1 font-semibold">
        {value ?? "—"} {value !== null ? suffix : ""}
      </p>
    </div>
  );
}