"use client";

import { FormEvent, ReactNode, useMemo, useState } from "react";
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

const auditFilters: { label: string; value: AuditFilter }[] = [
  { label: "À vérifier", value: "todo" },
  { label: "Suspects", value: "suspect" },
  { label: "Validés", value: "reviewed" },
  { label: "Tous", value: "all" },
];

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

function formatValue(value: number | null | undefined, suffix = "") {
  if (value === null || value === undefined) return "—";
  return `${value}${suffix}`;
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
          `${food.name} ${food.officialName ?? ""} ${food.category} ${
            food.brand ?? ""
          }`
        );

        const matchesQuery =
          !normalizedQuery || searchableText.includes(normalizedQuery);

        const matchesFilter =
          filter === "all" ||
          (filter === "todo" && !food.reviewed) ||
          (filter === "reviewed" && food.reviewed) ||
          (filter === "suspect" && Boolean(warning));

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

  function resetFilters() {
    setQuery("");
    setFilter("todo");
  }

  return (
    <AppShell>
      <div className="space-y-5">
        <section className="pt-2">
          <p className="text-[12px] font-black uppercase tracking-[0.18em] text-[var(--mt-rouge)]">
            Contrôle qualité
          </p>

          <div className="mt-3 flex items-start justify-between gap-4">
            <div>
              <h1 className="mt-display text-[48px] font-semibold leading-[0.9] tracking-[-0.055em] text-[var(--mt-ink)]">
                Audit
                <br />
                aliments
              </h1>

              <p className="mt-4 max-w-[310px] text-[15px] leading-7 text-[var(--mt-ink-2)]">
                Vérifie les aliments essentiels. Les corrections se répercutent
                automatiquement partout dans l’app.
              </p>
            </div>

            <div className="shrink-0 rounded-[24px] bg-gradient-to-br from-[var(--mt-rouge-lit)] via-[var(--mt-rouge)] to-[var(--mt-rouge-deep)] p-4 text-white shadow-[var(--mt-shadow-red)]">
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-white/62">
                Restants
              </p>
              <p className="mt-display mt-2 text-[40px] font-semibold leading-none tracking-[-0.055em]">
                {todoCount}
              </p>
              <p className="mt-1 text-[10px] font-black uppercase text-white/62">
                à vérifier
              </p>
            </div>
          </div>
        </section>

        {message && (
          <div className="rounded-[18px] border border-[var(--mt-success-soft)] bg-[var(--mt-success-soft)] px-4 py-3 text-[13px] font-extrabold text-[var(--mt-success)]">
            {message}
          </div>
        )}

        <section className="grid grid-cols-4 gap-2">
          <AuditMiniStat label="Essentiels" value={`${essentialFoods.length}`} />
          <AuditMiniStat label="Validés" value={`${auditedCount}`} />
          <AuditMiniStat label="À faire" value={`${todoCount}`} />
          <AuditMiniStat label="Suspects" value={`${suspectCount}`} />
        </section>

        <section className="mt-card overflow-hidden rounded-[28px]">
          <div className="bg-gradient-to-br from-[var(--mt-rouge-lit)] via-[var(--mt-rouge)] to-[var(--mt-rouge-deep)] p-5 text-white">
            <p className="text-[12px] font-black uppercase tracking-[0.18em] text-white/62">
              Audit automatique
            </p>

            <h2 className="mt-display mt-2 text-[34px] font-semibold leading-none tracking-[-0.04em]">
              On sécurise la base.
            </h2>

            <p className="mt-4 text-[14px] leading-7 text-white/78">
              L’objectif n’est pas de tout contrôler à la main, mais de repérer
              les valeurs manquantes ou incohérentes.
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              <span className="rounded-full bg-white/16 px-3 py-1.5 text-[11px] font-black text-white backdrop-blur">
                Essentiels
              </span>
              <span className="rounded-full bg-white/16 px-3 py-1.5 text-[11px] font-black text-white backdrop-blur">
                Macros
              </span>
              <span className="rounded-full bg-white/16 px-3 py-1.5 text-[11px] font-black text-white backdrop-blur">
                Cohérence kcal
              </span>
            </div>
          </div>
        </section>

        <section className="mt-card rounded-[28px] p-4">
          <label className="relative block">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--mt-ink-3)]">
              <SearchIcon />
            </span>

            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="AuditInput pl-12"
              placeholder="Riz, huile, pomme de terre, poulet..."
            />
          </label>

          <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
            {auditFilters.map((item) => (
              <FilterChip
                key={item.value}
                active={filter === item.value}
                onClick={() => setFilter(item.value)}
              >
                {item.label}
              </FilterChip>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between gap-3">
            <p className="text-[12px] font-bold text-[var(--mt-ink-2)]">
              {filteredFoods.length} aliment(s) affiché(s)
            </p>

            <button
              type="button"
              onClick={resetFilters}
              className="rounded-full bg-white px-3 py-2 text-[11px] font-black text-[var(--mt-ink)] shadow-[var(--mt-shadow-sm)] ring-1 ring-[var(--mt-line)]"
            >
              Reset
            </button>
          </div>
        </section>

        <section className="mt-card rounded-[28px] p-5">
          <div className="flex items-end justify-between gap-3">
            <SectionHead
              kicker="Liste"
              title="À contrôler"
              text="Les aliments suspects remontent en premier."
            />

            <span className="rounded-full bg-[var(--mt-rouge-wash)] px-3 py-2 text-[11px] font-black text-[var(--mt-rouge-deep)]">
              {filteredFoods.length}
            </span>
          </div>

          <div className="mt-5 grid gap-3">
            {filteredFoods.length === 0 ? (
              <div className="rounded-[22px] border border-dashed border-[var(--mt-line-2)] bg-[var(--mt-card-soft)] p-5 text-center">
                <p className="mt-display text-[21px] font-semibold text-[var(--mt-ink)]">
                  Aucun aliment
                </p>
                <p className="mt-2 text-[13px] leading-6 text-[var(--mt-ink-2)]">
                  Aucun aliment ne correspond à ce filtre.
                </p>
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

        <section className="mt-insight">
          <div className="mt-insight-icon">
            <LightIcon />
          </div>
          <p>
            Une correction ici met à jour les repas, les repas types, le journal
            et le dashboard. C’est le bon endroit pour fiabiliser la base.
          </p>
        </section>

        <div className="h-10" />
      </div>
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
    <article className="rounded-[24px] border border-[var(--mt-line)] bg-white p-4 shadow-[var(--mt-shadow)]">
      <div className="flex gap-3">
        <div className="grid h-14 w-14 shrink-0 place-items-center rounded-[18px] bg-gradient-to-br from-[var(--mt-rouge-lit)] to-[var(--mt-rouge-deep)] text-white shadow-[var(--mt-shadow-red)]">
          <span className="mt-display text-[22px] font-semibold">
            {food.name.slice(0, 1).toUpperCase()}
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap gap-1.5">
            <Badge tone="red">Essentiel</Badge>

            {food.reviewed ? (
              <Badge tone="green">Validé</Badge>
            ) : (
              <Badge tone="warn">À vérifier</Badge>
            )}

            {warning && <Badge tone="red">Suspect</Badge>}
          </div>

          <h3 className="mt-3 line-clamp-2 text-[17px] font-black leading-tight tracking-[-0.02em] text-[var(--mt-ink)]">
            {food.name}
          </h3>

          <p className="mt-1 line-clamp-1 text-[12px] font-bold text-[var(--mt-ink-2)]">
            {food.category}
          </p>
        </div>

        <div className="shrink-0 text-right">
          <p className="mt-display text-[28px] font-semibold leading-none tracking-[-0.03em] text-[var(--mt-ink)]">
            {food.caloriesPer100g ?? "—"}
          </p>
          <p className="mt-1 text-[9px] font-black uppercase tracking-[0.08em] text-[var(--mt-ink-3)]">
            kcal
          </p>
        </div>
      </div>

      {food.officialName && food.officialName !== food.name && (
        <p className="mt-3 rounded-[18px] bg-[var(--mt-card-soft)] p-3 text-[12px] font-bold leading-5 text-[var(--mt-ink-2)] ring-1 ring-[var(--mt-line)]">
          Nom officiel :{" "}
          <span className="text-[var(--mt-ink)]">{food.officialName}</span>
        </p>
      )}

      {warning && (
        <p className="mt-3 rounded-[18px] bg-[var(--mt-rouge-wash)] p-3 text-[12px] font-bold leading-5 text-[var(--mt-rouge-deep)] ring-1 ring-[var(--mt-rouge-soft)]">
          {warning}
        </p>
      )}

      {food.reviewNotes && (
        <p className="mt-3 rounded-[18px] bg-[var(--mt-card-soft)] p-3 text-[12px] font-bold leading-5 text-[var(--mt-ink-2)] ring-1 ring-[var(--mt-line)]">
          Note : {food.reviewNotes}
        </p>
      )}

      {!isEditing ? (
        <>
          <div className="mt-4 grid grid-cols-4 gap-2">
            <Macro label="Kcal" value={food.caloriesPer100g} suffix="" />
            <Macro label="Prot." value={food.proteinPer100g} suffix="g" />
            <Macro label="Gluc." value={food.carbsPer100g} suffix="g" />
            <Macro label="Lip." value={food.fatPer100g} suffix="g" />
          </div>

          <div className="mt-4 grid gap-2">
            <button
              type="button"
              onClick={onStartEditing}
              className="AuditPrimaryButton"
            >
              Corriger les valeurs
            </button>

            {food.reviewed ? (
              <button
                type="button"
                onClick={onMarkTodo}
                className="AuditNeutralButton"
              >
                Remettre à vérifier
              </button>
            ) : (
              <button
                type="button"
                onClick={onMarkReviewed}
                className="AuditSoftButton"
              >
                Marquer comme validé
              </button>
            )}
          </div>
        </>
      ) : (
        editForm && (
          <form
            onSubmit={onSave}
            className="mt-5 rounded-[24px] bg-[var(--mt-card-soft)] p-4 ring-1 ring-[var(--mt-line)]"
          >
            <p className="text-[12px] font-black uppercase tracking-[0.16em] text-[var(--mt-rouge)]">
              Correction
            </p>

            <h4 className="mt-display mt-1 text-[23px] font-semibold tracking-[-0.03em] text-[var(--mt-ink)]">
              Valeurs pour 100 g
            </h4>

            <div className="mt-4 grid grid-cols-2 gap-3">
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
              <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.12em] text-[var(--mt-ink-2)]">
                Note optionnelle
              </span>
              <textarea
                value={editForm.notes}
                onChange={(event) => onUpdateField("notes", event.target.value)}
                className="AuditInput min-h-24 resize-none"
                placeholder="Ex : vérifié avec étiquette, valeur Ciqual correcte..."
              />
            </label>

            <div className="mt-4 grid gap-2">
              <button type="submit" className="AuditPrimaryButton">
                Enregistrer et valider
              </button>

              <button
                type="button"
                onClick={onCancelEditing}
                className="AuditNeutralButton"
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

function AuditMiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[18px] bg-white p-3 shadow-[var(--mt-shadow-sm)] ring-1 ring-[var(--mt-line)]">
      <p className="text-[10px] font-black uppercase text-[var(--mt-ink-3)]">
        {label}
      </p>
      <p className="mt-2 text-[20px] font-black leading-none tracking-[-0.04em] text-[var(--mt-ink)]">
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

function Badge({
  children,
  tone,
}: {
  children: ReactNode;
  tone: "red" | "green" | "warn";
}) {
  const className =
    tone === "green"
      ? "bg-[var(--mt-success-soft)] text-[var(--mt-success)]"
      : tone === "warn"
      ? "bg-[var(--mt-warn-soft)] text-[var(--mt-warn)]"
      : "bg-[var(--mt-rouge-wash)] text-[var(--mt-rouge-deep)]";

  return (
    <span className={`rounded-full px-2.5 py-1 text-[10px] font-black ${className}`}>
      {children}
    </span>
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
    <div className="rounded-[16px] bg-[var(--mt-card-soft)] p-2.5 text-center ring-1 ring-[var(--mt-line)]">
      <p className="text-[9px] font-black uppercase text-[var(--mt-ink-3)]">
        {label}
      </p>
      <p className="mt-1 text-[12px] font-black text-[var(--mt-ink)]">
        {formatValue(value, suffix)}
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
      <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.12em] text-[var(--mt-ink-2)]">
        {label}
      </span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="AuditInput"
      />
    </label>
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