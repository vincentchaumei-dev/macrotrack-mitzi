"use client";

import { FormEvent, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { useNutritionStore } from "@/hooks/useNutritionStore";
import { isFoodComplete } from "@/lib/nutrition";
import { FoodSource } from "@/types/nutrition";

const categories = [
  "Féculents & céréales",
  "Pains & boulangerie",
  "Viandes",
  "Poissons",
  "Œufs",
  "Produits laitiers",
  "Fromages",
  "Fruits",
  "Légumes",
  "Matières grasses",
  "Compléments",
  "Autre",
];

function parseNumber(value: string) {
  if (value.trim() === "") {
    return null;
  }

  const parsed = Number(value.replace(",", "."));

  return Number.isNaN(parsed) ? null : parsed;
}

export default function FoodsPage() {
  const { foods, addFood, deleteFood } = useNutritionStore();

  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [category, setCategory] = useState(categories[0]);
  const [servingName, setServingName] = useState("");
  const [servingSizeG, setServingSizeG] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [fiber, setFiber] = useState("");
  const [sugar, setSugar] = useState("");
  const [salt, setSalt] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!name.trim()) {
      return;
    }

    addFood({
      name: name.trim(),
      brand: brand.trim() || undefined,
      category,
      servingName: servingName.trim() || undefined,
      servingSizeG: parseNumber(servingSizeG),
      caloriesPer100g: parseNumber(calories),
      proteinPer100g: parseNumber(protein),
      carbsPer100g: parseNumber(carbs),
      fatPer100g: parseNumber(fat),
      fiberPer100g: parseNumber(fiber),
      sugarPer100g: parseNumber(sugar),
      saltPer100g: parseNumber(salt),
      saturatedFatPer100g: null,
      source: "manual" as FoodSource,
      verified: true,
    });

    setName("");
    setBrand("");
    setServingName("");
    setServingSizeG("");
    setCalories("");
    setProtein("");
    setCarbs("");
    setFat("");
    setFiber("");
    setSugar("");
    setSalt("");
  }

  return (
    <AppShell>
      <div className="mb-8">
        <p className="text-sm font-medium text-[#E85A0C]">Base alimentaire</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Aliments</h1>
        <p className="mt-2 text-gray-500">
          Ajoute tes aliments avec leurs valeurs pour 100 g. Une valeur vide
          reste inconnue, elle n’est pas considérée comme zéro.
        </p>
      </div>

      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.2fr]">
        <form
          onSubmit={handleSubmit}
          className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5"
        >
          <h2 className="text-xl font-semibold">Ajouter un aliment</h2>

          <div className="mt-5 space-y-4">
            <Field label="Nom">
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="input"
                placeholder="Ex : Riz basmati cuit"
              />
            </Field>

            <Field label="Marque optionnelle">
              <input
                value={brand}
                onChange={(event) => setBrand(event.target.value)}
                className="input"
                placeholder="Ex : La Boulangère"
              />
            </Field>

            <Field label="Catégorie">
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className="input"
              >
                {categories.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </Field>

            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Nom portion">
                <input
                  value={servingName}
                  onChange={(event) => setServingName(event.target.value)}
                  className="input"
                  placeholder="Ex : 1 tranche"
                />
              </Field>

              <Field label="Poids portion en g">
                <input
                  value={servingSizeG}
                  onChange={(event) => setServingSizeG(event.target.value)}
                  className="input"
                  placeholder="Ex : 38"
                />
              </Field>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Calories / 100 g">
                <input value={calories} onChange={(e) => setCalories(e.target.value)} className="input" />
              </Field>
              <Field label="Protéines / 100 g">
                <input value={protein} onChange={(e) => setProtein(e.target.value)} className="input" />
              </Field>
              <Field label="Glucides / 100 g">
                <input value={carbs} onChange={(e) => setCarbs(e.target.value)} className="input" />
              </Field>
              <Field label="Lipides / 100 g">
                <input value={fat} onChange={(e) => setFat(e.target.value)} className="input" />
              </Field>
              <Field label="Fibres / 100 g">
                <input value={fiber} onChange={(e) => setFiber(e.target.value)} className="input" />
              </Field>
              <Field label="Sucres / 100 g">
                <input value={sugar} onChange={(e) => setSugar(e.target.value)} className="input" />
              </Field>
              <Field label="Sel / 100 g">
                <input value={salt} onChange={(e) => setSalt(e.target.value)} className="input" />
              </Field>
            </div>

            <button className="w-full rounded-2xl bg-[#10121A] px-5 py-3 text-sm font-medium text-white">
              Ajouter l’aliment
            </button>
          </div>
        </form>

        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5">
          <h2 className="text-xl font-semibold">Mes aliments</h2>
          <p className="mt-1 text-sm text-gray-500">
            {foods.length} aliment(s) enregistrés.
          </p>

          <div className="mt-5 space-y-3">
            {foods.map((food) => {
              const complete = isFoodComplete(food);

              return (
                <div
                  key={food.id}
                  className="rounded-2xl border border-black/5 bg-[#FAFAF8] p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-medium">{food.name}</h3>
                        <span
                          className={`rounded-full px-2 py-1 text-xs ${
                            complete
                              ? "bg-green-100 text-green-800"
                              : "bg-orange-100 text-orange-800"
                          }`}
                        >
                          {complete ? "Complet" : "À compléter"}
                        </span>
                      </div>

                      <p className="mt-1 text-sm text-gray-500">
                        {food.brand ? `${food.brand} · ` : ""}
                        {food.category}
                      </p>

                      <p className="mt-2 text-sm">
                        {food.caloriesPer100g ?? "—"} kcal ·{" "}
                        {food.proteinPer100g ?? "—"} P ·{" "}
                        {food.carbsPer100g ?? "—"} G ·{" "}
                        {food.fatPer100g ?? "—"} L / 100 g
                      </p>
                    </div>

                    <button
                      onClick={() => deleteFood(food.id)}
                      className="rounded-full border border-black/10 px-3 py-1.5 text-xs text-gray-500 hover:bg-black/5"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
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