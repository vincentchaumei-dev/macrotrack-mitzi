"use client";

import { FormEvent, useMemo, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import {
  DangerButton,
  EmptyState,
  GhostButton,
  PageHeader,
  Pill,
  PremiumCard,
  PrimaryButton,
  SectionTitle,
  SoftButton,
  StatCard,
} from "@/components/ui/PremiumUI";
import { useNutritionStore } from "@/hooks/useNutritionStore";
import {
  compareFoodsForSearch,
  foodMatchesSearch,
  isFoodComplete,
  shouldShowFoodInSimpleMode,
} from "@/lib/nutrition";
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

type StatusFilter = "Tous" | "Complets" | "À compléter";

const statusFilters: StatusFilter[] = ["Tous", "Complets", "À compléter"];

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

function getDataQualityStatus(form: FoodFormState) {
  const calories = parseNumber(form.calories);
  const protein = parseNumber(form.protein);
  const carbs = parseNumber(form.carbs);
  const fat = parseNumber(form.fat);

  if (
    calories !== null &&
    protein !== null &&
    carbs !== null &&
    fat !== null
  ) {
    return "complete" as const;
  }

  if (calories !== null || protein !== null || carbs !== null || fat !== null) {
    return "partial" as const;
  }

  return "missing" as const;
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
    dataQualityStatus: getDataQualityStatus(form),
  };
}

function getSourceLabel(source: FoodSource | undefined) {
  if (source === "ciqual") return "Ciqual";
  if (source === "openfoodfacts") return "Open Food Facts";
  if (source === "label") return "Étiquette";
  if (source === "manual") return "Manuel";
  return "Source inconnue";
}

export default function FoodsPage() {
  const { foods, addFood, updateFood, deleteFood } = useNutritionStore();

  const [form, setForm] = useState<FoodFormState>(emptyForm);
  const [editingFoodId, setEditingFoodId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("Toutes");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("Tous");
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const [includeFullDatabase, setIncludeFullDatabase] = useState(false);

  const editingFood = foods.find((food) => food.id === editingFoodId) ?? null;

  const filteredFoods = useMemo(() => {
    const hasQuery = query.trim().length > 0;

    return foods
      .filter((food) => {
        const complete = isFoodComplete(food);

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

        const matchesCategory =
          categoryFilter === "Toutes" || food.category === categoryFilter;

        const matchesStatus =
          statusFilter === "Tous" ||
          (statusFilter === "Complets" && complete) ||
          (statusFilter === "À compléter" && !complete);

        const matchesFavorite = !showOnlyFavorites || food.isFavorite;

        return (
          matchesSimpleMode &&
          matchesQuery &&
          matchesCategory &&
          matchesStatus &&
          matchesFavorite
        );
      })
      .sort((a, b) => compareFoodsForSearch(a, b, query))
      .slice(0, hasQuery || showOnlyFavorites || includeFullDatabase ? 90 : 42);
  }, [
    foods,
    query,
    categoryFilter,
    statusFilter,
    showOnlyFavorites,
    includeFullDatabase,
  ]);

  const completeFoodsCount = foods.filter(isFoodComplete).length;
  const incompleteFoodsCount = foods.length - completeFoodsCount;
  const favoriteFoodsCount = foods.filter((food) => food.isFavorite).length;
  const essentialFoodsCount = foods.filter((food) => food.isEssential).length;

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
        isEssential: false,
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
      <div className="mx-auto max-w-6xl">
        <PageHeader
          eyebrow="Base alimentaire"
          title="Aliments"
          description="Recherche, ajoute, corrige et organise les aliments. La base simplifiée privilégie les essentiels, favoris et produits ajoutés pour éviter de noyer l’expérience."
          action={
            <div className="flex flex-wrap gap-2">
              <SoftButton
                onClick={() => setShowOnlyFavorites((current) => !current)}
              >
                {showOnlyFavorites ? "Tous les aliments" : "Favoris"}
              </SoftButton>

              <GhostButton
                onClick={() => setIncludeFullDatabase((current) => !current)}
              >
                {includeFullDatabase
                  ? "Base complète active"
                  : "Inclure Ciqual"}
              </GhostButton>
            </div>
          }
        />

        <section className="mb-5 grid gap-4 md:grid-cols-4">
          <StatCard label="Total aliments" value={`${foods.length}`} />
          <StatCard label="Essentiels" value={`${essentialFoodsCount}`} />
          <StatCard label="Complets" value={`${completeFoodsCount}`} />
          <StatCard label="Favoris" value={`${favoriteFoodsCount}`} />
        </section>

        {incompleteFoodsCount > 0 && (
          <div className="mb-5 rounded-[30px] bg-orange-50 p-4 text-sm font-bold text-orange-900 ring-1 ring-orange-100">
            {incompleteFoodsCount} aliment(s) ont des valeurs incomplètes. Ils
            restent utilisables, mais certains totaux peuvent être partiels.
          </div>
        )}

        <section className="grid gap-5 xl:grid-cols-[0.92fr_1.08fr]">
          <PremiumCard tint="white">
            <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
              <SectionTitle
                title={editingFood ? "Modifier l’aliment" : "Ajouter un aliment"}
                text={
                  editingFood
                    ? "Les modifications se répercutent automatiquement dans les repas et repas types qui utilisent cet aliment."
                    : "Ajoute une référence manuelle avec les valeurs pour 100 g."
                }
              />

              {editingFood && (
                <GhostButton onClick={resetForm}>Annuler</GhostButton>
              )}
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Nom de l’aliment">
                  <input
                    value={form.name}
                    onChange={(event) =>
                      updateFormField("name", event.target.value)
                    }
                    className="input"
                    placeholder="Ex : Riz basmati cuit"
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

                <Field label="Nom de portion">
                  <input
                    value={form.servingName}
                    onChange={(event) =>
                      updateFormField("servingName", event.target.value)
                    }
                    className="input"
                    placeholder="Ex : 1 tranche, 1 portion"
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

              <div className="ui-card-soft p-5">
                <p className="text-sm font-black text-[#171717]">
                  Valeurs pour 100 g
                </p>
                <p className="mt-1 text-sm leading-6 text-[#7A746E]">
                  Les calories, protéines, glucides et lipides permettent de
                  calculer correctement les repas.
                </p>

                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <Field label="Calories">
                    <input
                      value={form.calories}
                      onChange={(event) =>
                        updateFormField("calories", event.target.value)
                      }
                      className="input"
                      placeholder="Ex : 226"
                    />
                  </Field>

                  <Field label="Protéines">
                    <input
                      value={form.protein}
                      onChange={(event) =>
                        updateFormField("protein", event.target.value)
                      }
                      className="input"
                      placeholder="Ex : 10"
                    />
                  </Field>

                  <Field label="Glucides">
                    <input
                      value={form.carbs}
                      onChange={(event) =>
                        updateFormField("carbs", event.target.value)
                      }
                      className="input"
                      placeholder="Ex : 39"
                    />
                  </Field>

                  <Field label="Lipides">
                    <input
                      value={form.fat}
                      onChange={(event) =>
                        updateFormField("fat", event.target.value)
                      }
                      className="input"
                      placeholder="Ex : 1,9"
                    />
                  </Field>

                  <Field label="Graisses saturées">
                    <input
                      value={form.saturatedFat}
                      onChange={(event) =>
                        updateFormField("saturatedFat", event.target.value)
                      }
                      className="input"
                      placeholder="Optionnel"
                    />
                  </Field>

                  <Field label="Fibres">
                    <input
                      value={form.fiber}
                      onChange={(event) =>
                        updateFormField("fiber", event.target.value)
                      }
                      className="input"
                      placeholder="Optionnel"
                    />
                  </Field>

                  <Field label="Sucres">
                    <input
                      value={form.sugar}
                      onChange={(event) =>
                        updateFormField("sugar", event.target.value)
                      }
                      className="input"
                      placeholder="Optionnel"
                    />
                  </Field>

                  <Field label="Sel">
                    <input
                      value={form.salt}
                      onChange={(event) =>
                        updateFormField("salt", event.target.value)
                      }
                      className="input"
                      placeholder="Optionnel"
                    />
                  </Field>
                </div>
              </div>

              <button
                type="submit"
                className="ui-button-primary w-full px-5 py-4 text-sm"
              >
                {editingFood
                  ? "Enregistrer les modifications"
                  : "Ajouter l’aliment"}
              </button>
            </form>
          </PremiumCard>

          <div className="space-y-5">
            <PremiumCard tint="white">
              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                <SectionTitle
                  title="Mes aliments"
                  text={`${filteredFoods.length} résultat(s) affiché(s). Les aliments simples et vérifiés remontent en premier.`}
                />
              </div>

              <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
                <Field label="Rechercher">
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    className="input"
                    placeholder="Ex : œuf, poulet, riz, banane..."
                  />
                </Field>

                <GhostButton
                  onClick={() => {
                    setQuery("");
                    setCategoryFilter("Toutes");
                    setStatusFilter("Tous");
                    setShowOnlyFavorites(false);
                  }}
                >
                  Réinitialiser
                </GhostButton>
              </div>

              <div className="mt-6">
                <p className="mb-3 text-sm font-black text-[#171717]">
                  Statut
                </p>
                <div className="flex flex-wrap gap-2">
                  {statusFilters.map((status) => (
                    <FilterPill
                      key={status}
                      active={statusFilter === status}
                      onClick={() => setStatusFilter(status)}
                    >
                      {status}
                    </FilterPill>
                  ))}
                </div>
              </div>

              <div className="mt-5">
                <p className="mb-3 text-sm font-black text-[#171717]">
                  Catégorie
                </p>
                <div className="flex max-h-32 flex-wrap gap-2 overflow-y-auto pr-1">
                  {["Toutes", ...categories].map((category) => (
                    <FilterPill
                      key={category}
                      active={categoryFilter === category}
                      onClick={() => setCategoryFilter(category)}
                    >
                      {category}
                    </FilterPill>
                  ))}
                </div>
              </div>
            </PremiumCard>

            <PremiumCard tint="white">
              {filteredFoods.length === 0 ? (
                <EmptyState
                  title="Aucun aliment trouvé"
                  text="Essaie de modifier les filtres, d’inclure la base Ciqual complète ou d’ajouter un aliment manuel."
                  action={
                    <SoftButton
                      onClick={() => {
                        setIncludeFullDatabase(true);
                        setShowOnlyFavorites(false);
                      }}
                    >
                      Inclure Ciqual complet
                    </SoftButton>
                  }
                />
              ) : (
                <div className="grid gap-4">
                  {filteredFoods.map((food) => (
                    <FoodCard
                      key={food.id}
                      food={food}
                      onEdit={() => startEditing(food)}
                      onToggleFavorite={() => toggleFavorite(food)}
                      onDelete={() => confirmDelete(food)}
                    />
                  ))}
                </div>
              )}
            </PremiumCard>
          </div>
        </section>
      </div>
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
      <span className="mb-2 block text-sm font-black text-[#171717]">
        {label}
      </span>
      {children}
    </label>
  );
}

function FilterPill({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-4 py-2 text-sm font-black transition ${
        active
          ? "ui-button-primary text-white"
          : "bg-[#FFFAF5] text-[#7A746E] ring-1 ring-black/[0.055] hover:bg-[#FFE1DD] hover:text-[#B92D35]"
      }`}
    >
      {children}
    </button>
  );
}

function FoodCard({
  food,
  onEdit,
  onToggleFavorite,
  onDelete,
}: {
  food: Food;
  onEdit: () => void;
  onToggleFavorite: () => void;
  onDelete: () => void;
}) {
  const complete = isFoodComplete(food);

  return (
    <article className="ui-card-soft ui-float p-5">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            {food.isEssential && <Pill tone="red">Essentiel</Pill>}
            {food.isFavorite && <Pill tone="dark">Favori</Pill>}
            {complete ? (
              <Pill tone="green">Complet</Pill>
            ) : (
              <Pill tone="red">À compléter</Pill>
            )}
            <Pill tone="cream">{getSourceLabel(food.source)}</Pill>
          </div>

          <h3 className="mt-4 text-2xl font-black tracking-[-0.055em] text-[#171717]">
            {food.name}
          </h3>

          <p className="mt-2 text-sm font-bold text-[#7A746E]">
            {food.brand ? `${food.brand} · ` : ""}
            {food.category}
          </p>

          {food.officialName && food.officialName !== food.name && (
            <p className="mt-2 text-xs leading-5 text-[#9B948E]">
              Nom officiel : {food.officialName}
            </p>
          )}

          {food.servingName && food.servingSizeG && (
            <p className="mt-2 text-sm text-[#7A746E]">
              Portion : {food.servingName} · {food.servingSizeG} g
            </p>
          )}
        </div>

        <div className="shrink-0 rounded-full bg-[#FFE1DD] px-4 py-2 text-sm font-black text-[#B92D35]">
          {food.caloriesPer100g ?? "—"} kcal / 100 g
        </div>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3">
        <MacroMini label="Prot." value={food.proteinPer100g} suffix="g" />
        <MacroMini label="Gluc." value={food.carbsPer100g} suffix="g" />
        <MacroMini label="Lip." value={food.fatPer100g} suffix="g" />
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <GhostButton onClick={onEdit} className="w-full">
          Modifier
        </GhostButton>

        <SoftButton onClick={onToggleFavorite} className="w-full">
          {food.isFavorite ? "Retirer favori" : "Favori"}
        </SoftButton>

        <DangerButton onClick={onDelete} className="w-full">
          Supprimer
        </DangerButton>
      </div>

      {food.externalUrl && (
        <a
          href={food.externalUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-flex text-sm font-black text-[#E94B4B]"
        >
          Voir la source →
        </a>
      )}
    </article>
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
    <div className="rounded-[24px] bg-white p-4 ring-1 ring-black/[0.055]">
      <p className="text-xs font-bold text-[#7A746E]">{label}</p>
      <p className="mt-1 font-black text-[#171717]">
        {value ?? "—"} {value !== null && value !== undefined ? suffix : ""}
      </p>
    </div>
  );
}