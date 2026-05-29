"use client";

import { FormEvent, useMemo, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { useNutritionStore } from "@/hooks/useNutritionStore";
import { isFoodComplete } from "@/lib/nutrition";
import { Food, FoodSource } from "@/types/nutrition";

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
  "Légumineuses",
  "Matières grasses",
  "Oléagineux & graines",
  "Sauces & condiments",
  "Produits sucrés",
  "Snacks",
  "Boissons",
  "Compléments",
  "Plats préparés",
  "Autre",
];

type FoodFormState = {
  name: string;
  brand: string;
  category: string;
  servingName: string;
  servingSizeG: string;
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
  saturatedFat: string;
  fiber: string;
  sugar: string;
  salt: string;
};

const emptyForm: FoodFormState = {
  name: "",
  brand: "",
  category: categories[0],
  servingName: "",
  servingSizeG: "",
  calories: "",
  protein: "",
  carbs: "",
  fat: "",
  saturatedFat: "",
  fiber: "",
  sugar: "",
  salt: "",
};

function parseNumber(value: string) {
  if (value.trim() === "") return null;

  const parsed = Number(value.replace(",", "."));

  return Number.isNaN(parsed) ? null : parsed;
}

function foodToForm(food: Food): FoodFormState {
  return {
    name: food.name,
    brand: food.brand ?? "",
    category: food.category,
    servingName: food.servingName ?? "",
    servingSizeG: food.servingSizeG?.toString() ?? "",
    calories: food.caloriesPer100g?.toString() ?? "",
    protein: food.proteinPer100g?.toString() ?? "",
    carbs: food.carbsPer100g?.toString() ?? "",
    fat: food.fatPer100g?.toString() ?? "",
    saturatedFat: food.saturatedFatPer100g?.toString() ?? "",
    fiber: food.fiberPer100g?.toString() ?? "",
    sugar: food.sugarPer100g?.toString() ?? "",
    salt: food.saltPer100g?.toString() ?? "",
  };
}

function formToFoodInput(form: FoodFormState) {
  return {
    name: form.name.trim(),
    brand: form.brand.trim() || undefined,
    category: form.category,
    servingName: form.servingName.trim() || undefined,
    servingSizeG: parseNumber(form.servingSizeG),
    caloriesPer100g: parseNumber(form.calories),
    proteinPer100g: parseNumber(form.protein),
    carbsPer100g: parseNumber(form.carbs),
    fatPer100g: parseNumber(form.fat),
    saturatedFatPer100g: parseNumber(form.saturatedFat),
    fiberPer100g: parseNumber(form.fiber),
    sugarPer100g: parseNumber(form.sugar),
    saltPer100g: parseNumber(form.salt),
    source: "manual" as FoodSource,
    verified: true,
  };
}

export default function FoodsPage() {
  const { foods, addFood, updateFood, deleteFood } = useNutritionStore();

  const [form, setForm] = useState<FoodFormState>(emptyForm);
  const [editingFoodId, setEditingFoodId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("Toutes");
  const [statusFilter, setStatusFilter] = useState("Tous");
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);

  const editingFood = foods.find((food) => food.id === editingFoodId) ?? null;

  const filteredFoods = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return foods.filter((food) => {
      const complete = isFoodComplete(food);

      const matchesQuery =
        normalizedQuery.length === 0 ||
        food.name.toLowerCase().includes(normalizedQuery) ||
        food.brand?.toLowerCase().includes(normalizedQuery) ||
        food.category.toLowerCase().includes(normalizedQuery);

      const matchesCategory =
        categoryFilter === "Toutes" || food.category === categoryFilter;

      const matchesStatus =
        statusFilter === "Tous" ||
        (statusFilter === "Complets" && complete) ||
        (statusFilter === "À compléter" && !complete);

      const matchesFavorite = !showOnlyFavorites || food.isFavorite;

      return matchesQuery && matchesCategory && matchesStatus && matchesFavorite;
    });
  }, [foods, query, categoryFilter, statusFilter, showOnlyFavorites]);

  const completeFoodsCount = foods.filter(isFoodComplete).length;
  const incompleteFoodsCount = foods.length - completeFoodsCount;
  const favoriteFoodsCount = foods.filter((food) => food.isFavorite).length;

  function updateFormField(key: keyof FoodFormState, value: string) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function resetForm() {
    setForm(emptyForm);
    setEditingFoodId(null);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.name.trim()) return;

    const foodInput = formToFoodInput(form);

    if (editingFoodId) {
      updateFood(editingFoodId, foodInput);
    } else {
      addFood({
        ...foodInput,
        isFavorite: false,
      });
    }

    resetForm();
  }

  function startEditing(food: Food) {
    setEditingFoodId(food.id);
    setForm(foodToForm(food));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function toggleFavorite(food: Food) {
    updateFood(food.id, {
      isFavorite: !food.isFavorite,
    });
  }

  function confirmDelete(food: Food) {
    const confirmed = window.confirm(
      `Supprimer l’aliment "${food.name}" ? Les anciens repas garderont leurs valeurs déjà enregistrées.`
    );

    if (!confirmed) return;

    deleteFood(food.id);

    if (editingFoodId === food.id) {
      resetForm();
    }
  }

  return (
    <AppShell>
      <div className="mb-8">
        <p className="text-sm font-medium text-[#E85A0C]">Base alimentaire</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Aliments</h1>
        <p className="mt-2 max-w-3xl text-gray-500">
          Gère les aliments, leurs portions et leurs valeurs nutritionnelles.
          Une valeur vide reste inconnue : l’app ne la transforme jamais en zéro.
        </p>
      </div>

      <section className="mb-6 grid gap-4 md:grid-cols-4">
        <Stat label="Total aliments" value={`${foods.length}`} />
        <Stat label="Complets" value={`${completeFoodsCount}`} />
        <Stat label="À compléter" value={`${incompleteFoodsCount}`} />
        <Stat label="Favoris" value={`${favoriteFoodsCount}`} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.25fr]">
        <form
          onSubmit={handleSubmit}
          className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">
                {editingFood ? "Modifier l’aliment" : "Ajouter un aliment"}
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Renseigne les valeurs pour 100 g depuis une étiquette ou une
                source fiable.
              </p>
            </div>

            {editingFood && (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-full border border-black/10 px-3 py-1.5 text-xs text-gray-500 hover:bg-black/5"
              >
                Annuler
              </button>
            )}
          </div>

          <div className="mt-5 space-y-4">
            <Field label="Nom de l’aliment">
              <input
                value={form.name}
                onChange={(event) => updateFormField("name", event.target.value)}
                className="input"
                placeholder="Ex : Riz basmati cuit"
              />
            </Field>

            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Marque optionnelle">
                <input
                  value={form.brand}
                  onChange={(event) =>
                    updateFormField("brand", event.target.value)
                  }
                  className="input"
                  placeholder="Ex : La Boulangère"
                />
              </Field>

              <Field label="Catégorie">
                <select
                  value={form.category}
                  onChange={(event) =>
                    updateFormField("category", event.target.value)
                  }
                  className="input"
                >
                  {categories.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </Field>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Nom de portion">
                <input
                  value={form.servingName}
                  onChange={(event) =>
                    updateFormField("servingName", event.target.value)
                  }
                  className="input"
                  placeholder="Ex : 1 tranche, 1 portion, 1 scoop"
                />
              </Field>

              <Field label="Poids portion en g">
                <input
                  value={form.servingSizeG}
                  onChange={(event) =>
                    updateFormField("servingSizeG", event.target.value)
                  }
                  className="input"
                  placeholder="Ex : 38"
                />
              </Field>
            </div>

            <div className="rounded-2xl bg-[#FAFAF8] p-4">
              <p className="text-sm font-semibold">Valeurs pour 100 g</p>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <Field label="Calories">
                  <input
                    value={form.calories}
                    onChange={(e) => updateFormField("calories", e.target.value)}
                    className="input"
                    placeholder="Ex : 226"
                  />
                </Field>

                <Field label="Protéines">
                  <input
                    value={form.protein}
                    onChange={(e) => updateFormField("protein", e.target.value)}
                    className="input"
                    placeholder="Ex : 10"
                  />
                </Field>

                <Field label="Glucides">
                  <input
                    value={form.carbs}
                    onChange={(e) => updateFormField("carbs", e.target.value)}
                    className="input"
                    placeholder="Ex : 39"
                  />
                </Field>

                <Field label="Lipides">
                  <input
                    value={form.fat}
                    onChange={(e) => updateFormField("fat", e.target.value)}
                    className="input"
                    placeholder="Ex : 1,9"
                  />
                </Field>

                <Field label="Graisses saturées">
                  <input
                    value={form.saturatedFat}
                    onChange={(e) =>
                      updateFormField("saturatedFat", e.target.value)
                    }
                    className="input"
                    placeholder="Optionnel"
                  />
                </Field>

                <Field label="Fibres">
                  <input
                    value={form.fiber}
                    onChange={(e) => updateFormField("fiber", e.target.value)}
                    className="input"
                    placeholder="Optionnel"
                  />
                </Field>

                <Field label="Sucres">
                  <input
                    value={form.sugar}
                    onChange={(e) => updateFormField("sugar", e.target.value)}
                    className="input"
                    placeholder="Optionnel"
                  />
                </Field>

                <Field label="Sel">
                  <input
                    value={form.salt}
                    onChange={(e) => updateFormField("salt", e.target.value)}
                    className="input"
                    placeholder="Optionnel"
                  />
                </Field>
              </div>
            </div>

            <button className="w-full rounded-2xl bg-[#10121A] px-5 py-3 text-sm font-medium text-white">
              {editingFood ? "Enregistrer les modifications" : "Ajouter l’aliment"}
            </button>
          </div>
        </form>

        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
            <div>
              <h2 className="text-xl font-semibold">Mes aliments</h2>
              <p className="mt-1 text-sm text-gray-500">
                {filteredFoods.length} résultat(s) affiché(s).
              </p>
            </div>

            <button
              onClick={() => setShowOnlyFavorites((current) => !current)}
              className={`rounded-full px-4 py-2 text-sm font-medium ${
                showOnlyFavorites
                  ? "bg-[#10121A] text-white"
                  : "border border-black/10 text-gray-600 hover:bg-black/5"
              }`}
            >
              Favoris
            </button>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-[1fr_0.7fr_0.6fr]">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="input"
              placeholder="Rechercher un aliment, une marque..."
            />

            <select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
              className="input"
            >
              <option>Toutes</option>
              {categories.map((category) => (
                <option key={category}>{category}</option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="input"
            >
              <option>Tous</option>
              <option>Complets</option>
              <option>À compléter</option>
            </select>
          </div>

          <div className="mt-5 space-y-3">
            {filteredFoods.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-black/10 bg-[#FAFAF8] p-8 text-center text-sm text-gray-500">
                Aucun aliment ne correspond à cette recherche.
              </div>
            ) : (
              filteredFoods.map((food) => {
                const complete = isFoodComplete(food);

                return (
                  <div
                    key={food.id}
                    className="rounded-2xl border border-black/5 bg-[#FAFAF8] p-4"
                  >
                    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
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

                          {food.isFavorite && (
                            <span className="rounded-full bg-[#10121A] px-2 py-1 text-xs text-white">
                              Favori
                            </span>
                          )}
                        </div>

                        <p className="mt-1 text-sm text-gray-500">
                          {food.brand ? `${food.brand} · ` : ""}
                          {food.category}
                        </p>

                        {food.servingName && food.servingSizeG && (
                          <p className="mt-1 text-sm text-gray-500">
                            Portion : {food.servingName} · {food.servingSizeG} g
                          </p>
                        )}

                        <div className="mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
                          <MacroMini
                            label="kcal"
                            value={food.caloriesPer100g}
                            suffix=""
                          />
                          <MacroMini
                            label="Prot."
                            value={food.proteinPer100g}
                            suffix="g"
                          />
                          <MacroMini
                            label="Gluc."
                            value={food.carbsPer100g}
                            suffix="g"
                          />
                          <MacroMini
                            label="Lip."
                            value={food.fatPer100g}
                            suffix="g"
                          />
                        </div>
                      </div>

                      <div className="flex shrink-0 flex-wrap gap-2 md:justify-end">
                        <button
                          onClick={() => toggleFavorite(food)}
                          className="rounded-full border border-black/10 px-3 py-1.5 text-xs text-gray-600 hover:bg-black/5"
                        >
                          {food.isFavorite ? "Retirer favori" : "Favori"}
                        </button>

                        <button
                          onClick={() => startEditing(food)}
                          className="rounded-full border border-black/10 px-3 py-1.5 text-xs text-gray-600 hover:bg-black/5"
                        >
                          Modifier
                        </button>

                        <button
                          onClick={() => confirmDelete(food)}
                          className="rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs text-red-700"
                        >
                          Supprimer
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
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

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold">{value}</p>
    </div>
  );
}

function MacroMini({
  label,
  value,
  suffix,
}: {
  label: string;
  value: number | null | undefined;
  suffix: string;
}) {
  return (
    <div className="rounded-xl bg-white px-3 py-2">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="font-medium">
        {value ?? "—"}
        {value !== null && value !== undefined ? suffix : ""}
      </p>
    </div>
  );
}