"use client";

import { FormEvent, useMemo, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { useNutritionStore } from "@/hooks/useNutritionStore";
import { Food } from "@/types/nutrition";
import { isFoodComplete, normalizeSearchText } from "@/lib/nutrition";

type AuditFilter = "all" | "todo" | "reviewed" | "suspect";

type EditForm = {
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
  fiber: string;
  sugar: string;
  salt: string;
  notes: string;
};

function parseNumber(value: string) {
  if (value.trim() === "") return null;

  const parsed = Number(value.replace(",", "."));

  return Number.isNaN(parsed) ? null : parsed;
}

function numberToInput(value: number | null | undefined) {
  return value === null || value === undefined ? "" : String(value);
}

function getFoodAuditWarning(food: Food) {
  const calories = food.caloriesPer100g;
  const name = normalizeSearchText(food.name);
  const category = food.category;

  if (calories === null) {
    return "Calories manquantes";
  }

  if (name.includes("huile") && (calories < 800 || calories > 950)) {
    return "Huile avec calories inhabituelles";
  }

  if (
    (name.includes("amande") ||
      name.includes("noix") ||
      name.includes("cacahuete")) &&
    (calories < 400 || calories > 750)
  ) {
    return "Oléagineux avec calories inhabituelles";
  }

  if (
    category === "Féculents & céréales" &&
    (name.includes("cuit") || name.includes("cuite") || name.includes("cuites")) &&
    !name.includes("flocons") &&
    !name.includes("pain") &&
    (calories < 50 || calories > 220)
  ) {
    return "Féculent cuit potentiellement suspect";
  }

  if (
    category === "Légumes" &&
    !name.includes("avocat") &&
    (calories < 5 || calories > 120)
  ) {
    return "Légume avec calories inhabituelles";
  }

  if (
    category === "Fruits" &&
    !name.includes("avocat") &&
    !name.includes("amande") &&
    !name.includes("noix") &&
    (calories < 20 || calories > 180)
  ) {
    return "Fruit avec calories inhabituelles";
  }

  if (category === "Viandes" && (calories < 70 || calories > 350)) {
    return "Viande avec calories inhabituelles";
  }

  if (category === "Poissons" && (calories < 50 || calories > 350)) {
    return "Poisson avec calories inhabituelles";
  }

  if (category === "Œufs" && (calories < 90 || calories > 250)) {
    return "Œuf avec calories inhabituelles";
  }

  if (
    category === "Légumineuses" &&
    (name.includes("cuit") || name.includes("cuite") || name.includes("cuites")) &&
    (calories < 50 || calories > 220)
  ) {
    return "Légumineuse cuite potentiellement suspecte";
  }

  if (!isFoodComplete(food)) {
    return "Macros principales incomplètes";
  }

  return null;
}

function getDataQualityStatus(foodInput: {
  caloriesPer100g: number | null;
  proteinPer100g: number | null;
  carbsPer100g: number | null;
  fatPer100g: number | null;
}) {
  const complete =
    foodInput.caloriesPer100g !== null &&
    foodInput.proteinPer100g !== null &&
    foodInput.carbsPer100g !== null &&
    foodInput.fatPer100g !== null;

  if (complete) return "complete" as const;

  const partial =
    foodInput.caloriesPer100g !== null ||
    foodInput.proteinPer100g !== null ||
    foodInput.carbsPer100g !== null ||
    foodInput.fatPer100g !== null;

  return partial ? ("partial" as const) : ("missing" as const);
}

function foodToEditForm(food: Food): EditForm {
  return {
    calories: numberToInput(food.caloriesPer100g),
    protein: numberToInput(food.proteinPer100g),
    carbs: numberToInput(food.carbsPer100g),
    fat: numberToInput(food.fatPer100g),
    fiber: numberToInput(food.fiberPer100g),
    sugar: numberToInput(food.sugarPer100g),
    salt: numberToInput(food.saltPer100g),
    notes: food.reviewNotes ?? "",
  };
}

export default function AuditFoodsPage() {
  const { foods, updateFood } = useNutritionStore();

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<AuditFilter>("todo");
  const [editingFoodId, setEditingFoodId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditForm | null>(null);
  const [message, setMessage] = useState("");

  const essentialFoods = useMemo(
    () => foods.filter((food) => food.isEssential),
    [foods]
  );

  const auditedCount = essentialFoods.filter((food) => food.reviewed).length;
  const todoCount = essentialFoods.length - auditedCount;
  const suspectCount = essentialFoods.filter(getFoodAuditWarning).length;

  const filteredFoods = useMemo(() => {
    const normalizedQuery = normalizeSearchText(query);

    return essentialFoods
      .filter((food) => {
        const warning = getFoodAuditWarning(food);

        const searchableText = normalizeSearchText(
          `${food.name} ${food.officialName ?? ""} ${food.category} ${food.brand ?? ""}`
        );

        const matchesQuery =
          !normalizedQuery || searchableText.includes(normalizedQuery);

        const matchesFilter =
          filter === "all" ||
          (filter === "todo" && !food.reviewed) ||
          (filter === "reviewed" && food.reviewed) ||
          (filter === "suspect" && warning);

        return matchesQuery && matchesFilter;
      })
      .sort((a, b) => {
        const aWarning = getFoodAuditWarning(a);
        const bWarning = getFoodAuditWarning(b);

        if (aWarning && !bWarning) return -1;
        if (!aWarning && bWarning) return 1;

        if (!a.reviewed && b.reviewed) return -1;
        if (a.reviewed && !b.reviewed) return 1;

        return a.name.localeCompare(b.name);
      });
  }, [essentialFoods, query, filter]);

  function notify(text: string) {
    setMessage(text);
    window.setTimeout(() => setMessage(""), 2500);
  }

  function startEditing(food: Food) {
    setEditingFoodId(food.id);
    setEditForm(foodToEditForm(food));
  }

  function cancelEditing() {
    setEditingFoodId(null);
    setEditForm(null);
  }

  function updateEditField(key: keyof EditForm, value: string) {
    setEditForm((current) =>
      current
        ? {
            ...current,
            [key]: value,
          }
        : current
    );
  }

  function saveFoodAudit(event: FormEvent<HTMLFormElement>, food: Food) {
    event.preventDefault();

    if (!editForm) return;

    const nextValues = {
      caloriesPer100g: parseNumber(editForm.calories),
      proteinPer100g: parseNumber(editForm.protein),
      carbsPer100g: parseNumber(editForm.carbs),
      fatPer100g: parseNumber(editForm.fat),
      fiberPer100g: parseNumber(editForm.fiber),
      sugarPer100g: parseNumber(editForm.sugar),
      saltPer100g: parseNumber(editForm.salt),
    };

    updateFood(food.id, {
      ...nextValues,
      reviewed: true,
      reviewNotes: editForm.notes.trim() || undefined,
      dataQualityStatus: getDataQualityStatus(nextValues),
    });

    cancelEditing();
    notify("Aliment corrigé et validé.");
  }

  function markAsReviewed(food: Food) {
    updateFood(food.id, {
      reviewed: true,
      reviewNotes: food.reviewNotes,
    });

    notify("Aliment marqué comme validé.");
  }

  function markAsTodo(food: Food) {
    updateFood(food.id, {
      reviewed: false,
    });

    notify("Aliment remis à vérifier.");
  }

  return (
    <AppShell>
      <div className="mb-8">
        <p className="text-sm font-medium text-[#E85A0C]">
          Contrôle qualité
        </p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">
          Audit des aliments essentiels
        </h1>
        <p className="mt-2 max-w-3xl text-gray-500">
          Vérifie les aliments les plus utilisés. Quand une valeur est corrigée
          ici, elle se répercute automatiquement dans les repas, les repas types,
          le journal et le dashboard.
        </p>
      </div>

      <section className="mb-6 grid gap-4 md:grid-cols-4">
        <Stat label="Essentiels" value={`${essentialFoods.length}`} />
        <Stat label="Validés" value={`${auditedCount}`} />
        <Stat label="À vérifier" value={`${todoCount}`} />
        <Stat label="Suspects" value={`${suspectCount}`} />
      </section>

      {message && (
        <div className="mb-6 rounded-2xl bg-green-50 p-4 text-sm text-green-800">
          {message}
        </div>
      )}

      <section className="mb-6 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5">
        <div className="grid gap-4 lg:grid-cols-[1fr_0.6fr_auto]">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-gray-700">
              Rechercher
            </span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="input"
              placeholder="Ex : riz, pomme de terre, huile, poulet..."
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-gray-700">
              Filtre
            </span>
            <select
              value={filter}
              onChange={(event) => setFilter(event.target.value as AuditFilter)}
              className="input"
            >
              <option value="all">Tous</option>
              <option value="todo">À vérifier</option>
              <option value="reviewed">Validés</option>
              <option value="suspect">Suspects</option>
            </select>
          </label>

          <div className="flex items-end">
            <button
              onClick={() => {
                setQuery("");
                setFilter("todo");
              }}
              className="w-full rounded-2xl border border-black/10 px-5 py-3 text-sm font-medium text-gray-700 hover:bg-black/5"
            >
              Réinitialiser
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5">
        <div className="flex flex-col justify-between gap-2 md:flex-row md:items-start">
          <div>
            <h2 className="text-xl font-semibold">Aliments à contrôler</h2>
            <p className="mt-1 text-sm text-gray-500">
              {filteredFoods.length} aliment(s) affiché(s).
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          {filteredFoods.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-black/10 bg-[#FAFAF8] p-8 text-center text-sm text-gray-500">
              Aucun aliment ne correspond à ce filtre.
            </div>
          ) : (
            filteredFoods.map((food) => (
              <FoodAuditCard
                key={food.id}
                food={food}
                warning={getFoodAuditWarning(food)}
                isEditing={editingFoodId === food.id}
                editForm={editingFoodId === food.id ? editForm : null}
                onStartEditing={() => startEditing(food)}
                onCancelEditing={cancelEditing}
                onSave={(event) => saveFoodAudit(event, food)}
                onUpdateField={updateEditField}
                onMarkReviewed={() => markAsReviewed(food)}
                onMarkTodo={() => markAsTodo(food)}
              />
            ))
          )}
        </div>
      </section>
    </AppShell>
  );
}

function FoodAuditCard({
  food,
  warning,
  isEditing,
  editForm,
  onStartEditing,
  onCancelEditing,
  onSave,
  onUpdateField,
  onMarkReviewed,
  onMarkTodo,
}: {
  food: Food;
  warning: string | null;
  isEditing: boolean;
  editForm: EditForm | null;
  onStartEditing: () => void;
  onCancelEditing: () => void;
  onSave: (event: FormEvent<HTMLFormElement>) => void;
  onUpdateField: (key: keyof EditForm, value: string) => void;
  onMarkReviewed: () => void;
  onMarkTodo: () => void;
}) {
  return (
    <article className="rounded-2xl border border-black/5 bg-[#FAFAF8] p-5">
      <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-start">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold">{food.name}</h3>

            {food.reviewed ? (
              <span className="rounded-full bg-green-100 px-2 py-1 text-xs text-green-800">
                Validé
              </span>
            ) : (
              <span className="rounded-full bg-orange-100 px-2 py-1 text-xs text-orange-800">
                À vérifier
              </span>
            )}

            {warning && (
              <span className="rounded-full bg-red-100 px-2 py-1 text-xs text-red-800">
                Suspect
              </span>
            )}

            <span className="rounded-full bg-[#E85A0C] px-2 py-1 text-xs text-white">
              Essentiel
            </span>
          </div>

          <p className="mt-1 text-sm text-gray-500">{food.category}</p>

          {food.officialName && food.officialName !== food.name && (
            <p className="mt-2 text-sm text-gray-500">
              Nom officiel :{" "}
              <span className="text-gray-700">{food.officialName}</span>
            </p>
          )}

          {warning && (
            <p className="mt-3 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              {warning}
            </p>
          )}

          {food.reviewNotes && (
            <p className="mt-3 rounded-2xl bg-white p-3 text-sm text-gray-600 ring-1 ring-black/5">
              Note : {food.reviewNotes}
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-2 xl:justify-end">
          <button
            onClick={onStartEditing}
            className="rounded-full border border-black/10 bg-white px-3 py-1.5 text-xs text-gray-700 hover:bg-black/5"
          >
            Corriger
          </button>

          {food.reviewed ? (
            <button
              onClick={onMarkTodo}
              className="rounded-full border border-orange-200 bg-orange-50 px-3 py-1.5 text-xs text-orange-800"
            >
              Remettre à vérifier
            </button>
          ) : (
            <button
              onClick={onMarkReviewed}
              className="rounded-full border border-green-200 bg-green-50 px-3 py-1.5 text-xs text-green-800"
            >
              Valider
            </button>
          )}
        </div>
      </div>

      {!isEditing ? (
        <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
          <Macro label="Calories" value={food.caloriesPer100g} suffix="kcal" />
          <Macro label="Protéines" value={food.proteinPer100g} suffix="g" />
          <Macro label="Glucides" value={food.carbsPer100g} suffix="g" />
          <Macro label="Lipides" value={food.fatPer100g} suffix="g" />
        </div>
      ) : (
        editForm && (
          <form onSubmit={onSave} className="mt-5 rounded-2xl bg-white p-4 ring-1 ring-black/5">
            <p className="mb-4 text-sm font-semibold">Corriger les valeurs pour 100 g</p>

            <div className="grid gap-3 md:grid-cols-4">
              <EditField
                label="Calories"
                value={editForm.calories}
                onChange={(value) => onUpdateField("calories", value)}
              />
              <EditField
                label="Protéines"
                value={editForm.protein}
                onChange={(value) => onUpdateField("protein", value)}
              />
              <EditField
                label="Glucides"
                value={editForm.carbs}
                onChange={(value) => onUpdateField("carbs", value)}
              />
              <EditField
                label="Lipides"
                value={editForm.fat}
                onChange={(value) => onUpdateField("fat", value)}
              />
              <EditField
                label="Fibres"
                value={editForm.fiber}
                onChange={(value) => onUpdateField("fiber", value)}
              />
              <EditField
                label="Sucres"
                value={editForm.sugar}
                onChange={(value) => onUpdateField("sugar", value)}
              />
              <EditField
                label="Sel"
                value={editForm.salt}
                onChange={(value) => onUpdateField("salt", value)}
              />
            </div>

            <label className="mt-4 block">
              <span className="mb-1.5 block text-sm font-medium text-gray-700">
                Note optionnelle
              </span>
              <textarea
                value={editForm.notes}
                onChange={(event) => onUpdateField("notes", event.target.value)}
                className="input min-h-24 resize-none"
                placeholder="Ex : vérifié avec étiquette, valeur Ciqual correcte..."
              />
            </label>

            <div className="mt-4 flex flex-wrap gap-2">
              <button className="rounded-2xl bg-[#10121A] px-5 py-3 text-sm font-medium text-white">
                Enregistrer et valider
              </button>

              <button
                type="button"
                onClick={onCancelEditing}
                className="rounded-2xl border border-black/10 px-5 py-3 text-sm font-medium text-gray-700 hover:bg-black/5"
              >
                Annuler
              </button>
            </div>
          </form>
        )
      )}
    </article>
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

function Macro({
  label,
  value,
  suffix,
}: {
  label: string;
  value: number | null | undefined;
  suffix: string;
}) {
  return (
    <div className="rounded-2xl bg-white p-4 ring-1 ring-black/5">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-1 font-semibold">
        {value ?? "—"} {value !== null && value !== undefined ? suffix : ""}
      </p>
    </div>
  );
}

function EditField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-gray-600">
        {label}
      </span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="input"
      />
    </label>
  );
}