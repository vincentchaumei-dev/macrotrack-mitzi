"use client";

import { FormEvent, ReactNode, useMemo, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { useConfirm } from "@/components/ui/ConfirmProvider";
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

function formatValue(value: number | null | undefined, suffix = "") {
  if (value === null || value === undefined) return "—";
  return `${value}${suffix}`;
}

export default function FoodsPage() {
  const confirm = useConfirm();
  const { foods, addFood, updateFood, deleteFood } = useNutritionStore();

  const [form, setForm] = useState<FoodFormState>(emptyForm);
  const [editingFoodId, setEditingFoodId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("Toutes");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("Tous");
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const [includeFullDatabase, setIncludeFullDatabase] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [message, setMessage] = useState("");

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
  const favoriteFoodsCount = foods.filter((food) => food.isFavorite).length;
  const essentialFoodsCount = foods.filter((food) => food.isEssential).length;

  function notify(text: string) {
    setMessage(text);
    window.setTimeout(() => setMessage(""), 2400);
  }

  function updateFormField(key: keyof FoodFormState, value: string) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function resetForm() {
    setForm(emptyForm);
    setEditingFoodId(null);
    setFormOpen(false);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.name.trim()) return;

    const foodInput = formToFoodInput(form);

    if (editingFoodId) {
      updateFood(editingFoodId, foodInput);
      notify("Aliment modifié.");
    } else {
      addFood({
        ...foodInput,
        isFavorite: false,
        isEssential: false,
      });
      notify("Aliment ajouté.");
    }

    resetForm();
  }

  function startEditing(food: Food) {
    setEditingFoodId(food.id);
    setForm(foodToForm(food));
    setFormOpen(true);
  }

  function openCreateForm() {
    setEditingFoodId(null);
    setForm(emptyForm);
    setFormOpen(true);
  }

  function toggleFavorite(food: Food) {
    updateFood(food.id, {
      isFavorite: !food.isFavorite,
    });

    notify(food.isFavorite ? "Retiré des favoris." : "Ajouté aux favoris.");
  }

  async function confirmDelete(food: Food) {
    const confirmed = await confirm({
      title: "Supprimer cet aliment ?",
      message: `"${food.name}" sera supprimé de la base alimentaire. Les anciens repas garderont leurs valeurs déjà enregistrées.`,
      confirmLabel: "Supprimer",
      cancelLabel: "Annuler",
      tone: "danger",
    });

    if (!confirmed) return;

    deleteFood(food.id);

    if (editingFoodId === food.id) {
      resetForm();
    }

    notify("Aliment supprimé.");
  }

  return (
    <AppShell>
      <div className="space-y-5">
        {message && <div className="mt-dashboard-toast">{message}</div>}

        <section className="pt-2">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[12px] font-black uppercase tracking-[0.18em] text-[var(--mt-rouge)]">
                Base alimentaire
              </p>

              <h1 className="mt-display mt-3 text-[48px] font-semibold leading-[0.9] tracking-[-0.055em] text-[var(--mt-ink)]">
                Aliments
              </h1>

              <p className="mt-4 max-w-[320px] text-[15px] leading-7 text-[var(--mt-ink-2)]">
                Recherche, corrige et organise les aliments utiles au quotidien.
              </p>
            </div>

            <button
              type="button"
              onClick={openCreateForm}
              className="grid h-12 w-12 shrink-0 place-items-center rounded-[18px] bg-[var(--mt-rouge)] text-white shadow-[var(--mt-shadow-red)]"
              aria-label="Ajouter un aliment"
            >
              <PlusIcon />
            </button>
          </div>
        </section>

        <section className="grid grid-cols-3 gap-3">
          <MiniStat label="Total" value={`${foods.length}`} />
          <MiniStat label="Essentiels" value={`${essentialFoodsCount}`} />
          <MiniStat label="Favoris" value={`${favoriteFoodsCount}`} />
        </section>

        <section className="mt-card rounded-[28px] p-4">
          <label className="relative block">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--mt-ink-3)]">
              <SearchIcon />
            </span>

            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="w-full rounded-[20px] border border-[var(--mt-line)] bg-[var(--mt-card-soft)] py-4 pl-12 pr-4 text-[15px] font-bold text-[var(--mt-ink)] outline-none placeholder:text-[var(--mt-ink-3)]"
              placeholder="Œuf, poulet, riz, banane..."
            />
          </label>

          <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
            {statusFilters.map((status) => (
              <FilterChip
                key={status}
                active={statusFilter === status}
                onClick={() => setStatusFilter(status)}
              >
                {status}
              </FilterChip>
            ))}
          </div>

          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            <FilterChip
              active={categoryFilter === "Toutes"}
              onClick={() => setCategoryFilter("Toutes")}
            >
              Toutes
            </FilterChip>

            {categories.map((category) => (
              <FilterChip
                key={category}
                active={categoryFilter === category}
                onClick={() => setCategoryFilter(category)}
              >
                {category}
              </FilterChip>
            ))}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setShowOnlyFavorites((current) => !current)}
              className={`rounded-[18px] px-3 py-3 text-[12px] font-black ${
                showOnlyFavorites
                  ? "bg-[var(--mt-rouge)] text-white shadow-[var(--mt-shadow-red)]"
                  : "bg-white text-[var(--mt-ink)] ring-1 ring-[var(--mt-line)]"
              }`}
            >
              {showOnlyFavorites ? "Favoris actifs" : "Favoris"}
            </button>

            <button
              type="button"
              onClick={() => setIncludeFullDatabase((current) => !current)}
              className={`rounded-[18px] px-3 py-3 text-[12px] font-black ${
                includeFullDatabase
                  ? "bg-[var(--mt-ink)] text-white"
                  : "bg-white text-[var(--mt-ink)] ring-1 ring-[var(--mt-line)]"
              }`}
            >
              {includeFullDatabase ? "Base complète" : "Inclure Ciqual"}
            </button>
          </div>
        </section>

        <section className="mt-card rounded-[28px] p-5">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h2 className="mt-display text-[25px] font-semibold tracking-[-0.03em] text-[var(--mt-ink)]">
                Résultats
              </h2>
              <p className="mt-1 text-[13px] leading-5 text-[var(--mt-ink-2)]">
                {filteredFoods.length} aliment(s) affiché(s).
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setQuery("");
                setCategoryFilter("Toutes");
                setStatusFilter("Tous");
                setShowOnlyFavorites(false);
              }}
              className="rounded-full bg-[var(--mt-card-soft)] px-3 py-2 text-[11px] font-black text-[var(--mt-ink)] ring-1 ring-[var(--mt-line)]"
            >
              Reset
            </button>
          </div>

          <div className="mt-5 grid gap-3">
            {filteredFoods.length === 0 ? (
              <div className="rounded-[22px] border border-dashed border-[var(--mt-line-2)] bg-[var(--mt-card-soft)] p-5 text-center">
                <p className="mt-display text-[21px] font-semibold text-[var(--mt-ink)]">
                  Aucun aliment trouvé
                </p>
                <p className="mt-2 text-[13px] leading-6 text-[var(--mt-ink-2)]">
                  Essaie d’élargir la recherche ou d’inclure la base complète.
                </p>
              </div>
            ) : (
              filteredFoods.map((food) => (
                <FoodCard
                  key={food.id}
                  food={food}
                  onEdit={() => startEditing(food)}
                  onToggleFavorite={() => toggleFavorite(food)}
                  onDelete={() => confirmDelete(food)}
                />
              ))
            )}
          </div>
        </section>

        {formOpen && (
          <div className="fixed inset-0 z-[90]">
            <button
              type="button"
              className="absolute inset-0 bg-black/25 backdrop-blur-sm"
              onClick={resetForm}
              aria-label="Fermer"
            />

            <div className="absolute bottom-0 left-0 right-0 mx-auto max-h-[88svh] max-w-[430px] overflow-y-auto rounded-t-[34px] bg-[var(--mt-bg)] p-5 shadow-[0_-24px_60px_rgba(0,0,0,0.18)]">
              <div className="mb-5 flex items-start justify-between gap-3">
                <div>
                  <p className="text-[12px] font-black uppercase tracking-[0.18em] text-[var(--mt-rouge)]">
                    {editingFood ? "Modification" : "Nouvel aliment"}
                  </p>
                  <h2 className="mt-display mt-2 text-[30px] font-semibold leading-none tracking-[-0.04em] text-[var(--mt-ink)]">
                    {editingFood ? "Modifier" : "Ajouter"}
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={resetForm}
                  className="grid h-11 w-11 place-items-center rounded-[15px] bg-white text-[var(--mt-ink-2)] shadow-[var(--mt-shadow-sm)] ring-1 ring-[var(--mt-line)]"
                >
                  <XIcon />
                </button>
              </div>

              <FoodForm
                form={form}
                editing={Boolean(editingFood)}
                onSubmit={handleSubmit}
                onChange={updateFormField}
              />
            </div>
          </div>
        )}

        <div className="h-10" />
      </div>
    </AppShell>
  );
}

function FoodForm({
  form,
  editing,
  onSubmit,
  onChange,
}: {
  form: FoodFormState;
  editing: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onChange: (key: keyof FoodFormState, value: string) => void;
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Field label="Nom de l’aliment">
        <input
          value={form.name}
          onChange={(event) => onChange("name", event.target.value)}
          className="FoodInput"
          placeholder="Ex : Riz basmati cuit"
        />
      </Field>

      <Field label="Catégorie">
        <select
          value={form.category}
          onChange={(event) => onChange("category", event.target.value)}
          className="FoodInput"
        >
          {categories.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Marque">
          <input
            value={form.brand}
            onChange={(event) => onChange("brand", event.target.value)}
            className="FoodInput"
            placeholder="Optionnel"
          />
        </Field>

        <Field label="Portion">
          <input
            value={form.servingName}
            onChange={(event) => onChange("servingName", event.target.value)}
            className="FoodInput"
            placeholder="1 tranche"
          />
        </Field>
      </div>

      <Field label="Poids portion en g">
        <input
          value={form.servingSizeG}
          onChange={(event) => onChange("servingSizeG", event.target.value)}
          className="FoodInput"
          placeholder="Ex : 38"
        />
      </Field>

      <div className="rounded-[24px] bg-white p-4 shadow-[var(--mt-shadow-sm)] ring-1 ring-[var(--mt-line)]">
        <p className="text-[13px] font-black text-[var(--mt-ink)]">
          Valeurs pour 100 g
        </p>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <Field label="Calories">
            <input
              value={form.calories}
              onChange={(event) => onChange("calories", event.target.value)}
              className="FoodInput"
              placeholder="226"
            />
          </Field>

          <Field label="Protéines">
            <input
              value={form.protein}
              onChange={(event) => onChange("protein", event.target.value)}
              className="FoodInput"
              placeholder="10"
            />
          </Field>

          <Field label="Glucides">
            <input
              value={form.carbs}
              onChange={(event) => onChange("carbs", event.target.value)}
              className="FoodInput"
              placeholder="39"
            />
          </Field>

          <Field label="Lipides">
            <input
              value={form.fat}
              onChange={(event) => onChange("fat", event.target.value)}
              className="FoodInput"
              placeholder="1,9"
            />
          </Field>

          <Field label="Fibres">
            <input
              value={form.fiber}
              onChange={(event) => onChange("fiber", event.target.value)}
              className="FoodInput"
              placeholder="Optionnel"
            />
          </Field>

          <Field label="Sucres">
            <input
              value={form.sugar}
              onChange={(event) => onChange("sugar", event.target.value)}
              className="FoodInput"
              placeholder="Optionnel"
            />
          </Field>

          <Field label="Saturées">
            <input
              value={form.saturatedFat}
              onChange={(event) => onChange("saturatedFat", event.target.value)}
              className="FoodInput"
              placeholder="Optionnel"
            />
          </Field>

          <Field label="Sel">
            <input
              value={form.salt}
              onChange={(event) => onChange("salt", event.target.value)}
              className="FoodInput"
              placeholder="Optionnel"
            />
          </Field>
        </div>
      </div>

      <button type="submit" className="mt-btn-primary">
        {editing ? "Enregistrer les modifications" : "Ajouter l’aliment"}
      </button>
    </form>
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
    <article className="rounded-[22px] border border-[var(--mt-line)] bg-white p-4 shadow-[var(--mt-shadow)]">
      <div className="flex gap-3">
        <div className="grid h-14 w-14 shrink-0 place-items-center rounded-[18px] bg-gradient-to-br from-[var(--mt-rouge-lit)] to-[var(--mt-rouge-deep)] text-white shadow-[var(--mt-shadow-red)]">
          <span className="mt-display text-[22px] font-semibold">
            {food.name.slice(0, 1).toUpperCase()}
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap gap-1.5">
            {food.isEssential && <Badge tone="red">Essentiel</Badge>}
            {food.isFavorite && <Badge tone="dark">Favori</Badge>}
            <Badge tone={complete ? "green" : "amber"}>
              {complete ? "Complet" : "À compléter"}
            </Badge>
          </div>

          <h3 className="mt-3 line-clamp-2 text-[17px] font-black leading-tight tracking-[-0.02em] text-[var(--mt-ink)]">
            {food.name}
          </h3>

          <p className="mt-1 line-clamp-1 text-[12px] font-bold text-[var(--mt-ink-2)]">
            {food.brand ? `${food.brand} · ` : ""}
            {food.category}
          </p>
        </div>

        <div className="shrink-0 text-right">
          <p className="mt-display text-[26px] font-semibold leading-none tracking-[-0.03em] text-[var(--mt-ink)]">
            {food.caloriesPer100g ?? "—"}
          </p>
          <p className="mt-1 text-[9px] font-black uppercase tracking-[0.08em] text-[var(--mt-ink-3)]">
            kcal
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <MacroBox label="Prot." value={formatValue(food.proteinPer100g, "g")} />
        <MacroBox label="Gluc." value={formatValue(food.carbsPer100g, "g")} />
        <MacroBox label="Lip." value={formatValue(food.fatPer100g, "g")} />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" onClick={onEdit} className="FoodAction">
          Modifier
        </button>

        <button type="button" onClick={onToggleFavorite} className="FoodActionRed">
          {food.isFavorite ? "Retirer favori" : "Favori"}
        </button>

        <button type="button" onClick={onDelete} className="FoodActionDanger">
          Supprimer
        </button>
      </div>

      <p className="mt-3 text-[11px] font-bold text-[var(--mt-ink-3)]">
        Source : {getSourceLabel(food.source)}
      </p>
    </article>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[22px] bg-white p-4 shadow-[var(--mt-shadow-sm)] ring-1 ring-[var(--mt-line)]">
      <p className="text-[12px] font-bold text-[var(--mt-ink-2)]">{label}</p>
      <p className="mt-3 text-[28px] font-black leading-none tracking-[-0.04em] text-[var(--mt-ink)]">
        {value}
      </p>
    </div>
  );
}

function FilterChip({
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

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[12px] font-black uppercase tracking-[0.12em] text-[var(--mt-ink-2)]">
        {label}
      </span>
      {children}
    </label>
  );
}

function Badge({
  children,
  tone,
}: {
  children: ReactNode;
  tone: "red" | "dark" | "green" | "amber";
}) {
  const className =
    tone === "dark"
      ? "bg-[var(--mt-ink)] text-white"
      : tone === "green"
        ? "bg-[var(--mt-success-soft)] text-[var(--mt-success)]"
        : tone === "amber"
          ? "bg-[var(--mt-warn-soft)] text-[var(--mt-warn)]"
          : "bg-[var(--mt-rouge-wash)] text-[var(--mt-rouge-deep)]";

  return (
    <span className={`rounded-full px-2.5 py-1 text-[10px] font-black ${className}`}>
      {children}
    </span>
  );
}

function MacroBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[18px] bg-[var(--mt-card-soft)] p-3 ring-1 ring-[var(--mt-line)]">
      <p className="text-[10.5px] font-bold text-[var(--mt-ink-2)]">{label}</p>
      <p className="mt-1 text-[14px] font-black text-[var(--mt-ink)]">{value}</p>
    </div>
  );
}

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4-4" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}