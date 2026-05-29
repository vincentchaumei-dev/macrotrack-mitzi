"use client";

import { useMemo, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { useNutritionStore } from "@/hooks/useNutritionStore";
import {
  calculateMealTotals,
  formatMacro,
  mealTypeLabels,
  todayLocalDate,
} from "@/lib/nutrition";
import { MealTemplate, MealType } from "@/types/nutrition";

type MealFilter = "all" | MealType;
type TemplateFilter =
  | "all"
  | "default"
  | "personal"
  | "fat_loss"
  | "muscle_gain"
  | "vegetarian"
  | "protein";

const mealFilters: { label: string; value: MealFilter }[] = [
  { label: "Tous", value: "all" },
  { label: "Petit-déj", value: "breakfast" },
  { label: "Déjeuner", value: "lunch" },
  { label: "Dîner", value: "dinner" },
  { label: "Collation", value: "snack" },
];

const templateFilters: { label: string; value: TemplateFilter }[] = [
  { label: "Tous", value: "all" },
  { label: "Par défaut", value: "default" },
  { label: "Mes repas", value: "personal" },
  { label: "Perte de poids", value: "fat_loss" },
  { label: "Prise de masse", value: "muscle_gain" },
  { label: "Végétarien", value: "vegetarian" },
  { label: "Protéiné", value: "protein" },
];

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

function templateMatchesGoalFilter(
  template: MealTemplate,
  filter: TemplateFilter
) {
  const name = normalize(template.name);
  const itemsText = normalize(
    template.items.map((item) => item.foodNameSnapshot).join(" ")
  );
  const searchableText = `${name} ${itemsText}`;

  if (filter === "all") return true;
  if (filter === "default") return Boolean(template.isDefault);
  if (filter === "personal") return !template.isDefault;

  if (filter === "fat_loss") {
    return (
      searchableText.includes("perte") ||
      searchableText.includes("satiété") ||
      searchableText.includes("satiete")
    );
  }

  if (filter === "muscle_gain") {
    return (
      searchableText.includes("prise de masse") ||
      searchableText.includes("masse")
    );
  }

  if (filter === "vegetarian") {
    return (
      searchableText.includes("vegetarien") ||
      searchableText.includes("lentilles") ||
      searchableText.includes("pois chiches") ||
      searchableText.includes("quinoa")
    );
  }

  if (filter === "protein") {
    return (
      searchableText.includes("proteine") ||
      searchableText.includes("protéine") ||
      searchableText.includes("poulet") ||
      searchableText.includes("thon") ||
      searchableText.includes("oeuf") ||
      searchableText.includes("œuf") ||
      searchableText.includes("fromage blanc")
    );
  }

  return true;
}

function getTemplateBadges(template: MealTemplate) {
  const badges: string[] = [];

  if (template.isDefault) {
    badges.push("Par défaut");
  } else {
    badges.push("Personnel");
  }

  const name = normalize(template.name);
  const itemsText = normalize(
    template.items.map((item) => item.foodNameSnapshot).join(" ")
  );
  const searchableText = `${name} ${itemsText}`;

  if (searchableText.includes("perte") || searchableText.includes("satiete")) {
    badges.push("Perte de poids");
  }

  if (searchableText.includes("prise de masse") || searchableText.includes("masse")) {
    badges.push("Prise de masse");
  }

  if (
    searchableText.includes("vegetarien") ||
    searchableText.includes("lentilles") ||
    searchableText.includes("quinoa")
  ) {
    badges.push("Végétarien");
  }

  if (
    searchableText.includes("poulet") ||
    searchableText.includes("thon") ||
    searchableText.includes("oeuf") ||
    searchableText.includes("œuf") ||
    searchableText.includes("fromage blanc")
  ) {
    badges.push("Protéiné");
  }

  return badges;
}

function getTemplatePurpose(template: MealTemplate) {
  const name = normalize(template.name);

  if (name.includes("perte")) {
    return "Repas pensé pour rester rassasiant avec des aliments simples.";
  }

  if (name.includes("prise de masse")) {
    return "Repas plus dense, utile quand l’objectif est de manger suffisamment.";
  }

  if (name.includes("vegetarien")) {
    return "Option végétarienne simple, basée sur légumineuses et féculents.";
  }

  if (template.type === "breakfast") {
    return "Base de petit-déjeuner réutilisable et facile à ajuster.";
  }

  if (template.type === "snack") {
    return "Collation pratique pour compléter la journée sans faire un gros repas.";
  }

  return "Repas équilibré à utiliser tel quel ou à adapter selon les besoins.";
}

function buildMealFromTemplate(template: MealTemplate, date: string) {
  return {
    id: template.id,
    date,
    type: template.type,
    name: template.name,
    items: template.items,
    createdAt: template.createdAt,
    updatedAt: template.updatedAt,
  };
}

export default function RecipesPage() {
  const { mealTemplates, addTemplateAsMeal, deleteMealTemplate } =
    useNutritionStore();

  const [date, setDate] = useState(todayLocalDate());
  const [message, setMessage] = useState("");
  const [query, setQuery] = useState("");
  const [mealFilter, setMealFilter] = useState<MealFilter>("all");
  const [templateFilter, setTemplateFilter] = useState<TemplateFilter>("all");

  const filteredTemplates = useMemo(() => {
    const normalizedQuery = normalize(query);

    return mealTemplates
      .filter((template) => {
        const matchesMealType =
          mealFilter === "all" || template.type === mealFilter;

        const matchesTemplateFilter = templateMatchesGoalFilter(
          template,
          templateFilter
        );

        const searchableText = normalize(
          `${template.name} ${template.items
            .map((item) => item.foodNameSnapshot)
            .join(" ")}`
        );

        const matchesQuery =
          !normalizedQuery || searchableText.includes(normalizedQuery);

        return matchesMealType && matchesTemplateFilter && matchesQuery;
      })
      .sort((a, b) => {
        if (a.isDefault && !b.isDefault) return -1;
        if (!a.isDefault && b.isDefault) return 1;
        return a.name.localeCompare(b.name);
      });
  }, [mealTemplates, mealFilter, templateFilter, query]);

  const defaultTemplatesCount = mealTemplates.filter(
    (template) => template.isDefault
  ).length;

  const personalTemplatesCount = mealTemplates.length - defaultTemplatesCount;

  function notify(text: string) {
    setMessage(text);
    window.setTimeout(() => setMessage(""), 2500);
  }

  function handleAddTemplate(templateId: string) {
    const meal = addTemplateAsMeal(templateId, date);

    if (!meal) {
      notify("Impossible d’ajouter ce repas type.");
      return;
    }

    notify("Repas type ajouté au journal.");
  }

  function handleDeleteTemplate(template: MealTemplate) {
    const confirmed = window.confirm(
      template.isDefault
        ? `Supprimer le repas type par défaut "${template.name}" ? Il ne reviendra pas automatiquement.`
        : `Supprimer le repas type "${template.name}" ?`
    );

    if (!confirmed) return;

    deleteMealTemplate(template.id);
    notify("Repas type supprimé.");
  }

  function resetFilters() {
    setQuery("");
    setMealFilter("all");
    setTemplateFilter("all");
  }

  return (
    <AppShell>
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-medium text-[#E85A0C]">Réutilisable</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            Repas types
          </h1>
          <p className="mt-2 max-w-2xl text-gray-500">
            Des repas prêts à utiliser, pensés pour gagner du temps et rendre le
            suivi nutritionnel plus simple au quotidien.
          </p>
        </div>

        <div>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-gray-700">
              Ajouter à la date
            </span>
            <input
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              className="input max-w-44"
            />
          </label>
        </div>
      </div>

      <section className="mb-6 grid gap-4 md:grid-cols-4">
        <Stat label="Repas types" value={`${mealTemplates.length}`} />
        <Stat label="Par défaut" value={`${defaultTemplatesCount}`} />
        <Stat label="Personnels" value={`${personalTemplatesCount}`} />
        <Stat label="Affichés" value={`${filteredTemplates.length}`} />
      </section>

      <section className="mb-6 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5">
        <div className="grid gap-4 lg:grid-cols-[1fr_0.8fr_0.8fr_auto]">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-gray-700">
              Rechercher
            </span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="input"
              placeholder="Ex : poulet, végétarien, collation..."
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-gray-700">
              Type de repas
            </span>
            <select
              value={mealFilter}
              onChange={(event) => setMealFilter(event.target.value as MealFilter)}
              className="input"
            >
              {mealFilters.map((filter) => (
                <option key={filter.value} value={filter.value}>
                  {filter.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-gray-700">
              Objectif
            </span>
            <select
              value={templateFilter}
              onChange={(event) =>
                setTemplateFilter(event.target.value as TemplateFilter)
              }
              className="input"
            >
              {templateFilters.map((filter) => (
                <option key={filter.value} value={filter.value}>
                  {filter.label}
                </option>
              ))}
            </select>
          </label>

          <div className="flex items-end">
            <button
              onClick={resetFilters}
              className="w-full rounded-2xl border border-black/10 px-5 py-3 text-sm font-medium text-gray-700 hover:bg-black/5"
            >
              Réinitialiser
            </button>
          </div>
        </div>
      </section>

      {message && (
        <div className="mb-5 rounded-2xl bg-green-50 p-4 text-sm text-green-800">
          {message}
        </div>
      )}

      <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5">
        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
          <div>
            <h2 className="text-xl font-semibold">Bibliothèque de repas</h2>
            <p className="mt-1 text-sm text-gray-500">
              Ajoute un repas type au journal, puis adapte-le si besoin dans ton
              suivi quotidien.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 xl:grid-cols-2">
          {filteredTemplates.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-black/10 bg-[#FAFAF8] p-8 text-center xl:col-span-2">
              <p className="font-medium">Aucun repas type trouvé</p>
              <p className="mt-1 text-sm text-gray-500">
                Essaie de modifier les filtres ou de réinitialiser la recherche.
              </p>
            </div>
          ) : (
            filteredTemplates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                date={date}
                onAdd={() => handleAddTemplate(template.id)}
                onDelete={() => handleDeleteTemplate(template)}
              />
            ))
          )}
        </div>
      </section>
    </AppShell>
  );
}

function TemplateCard({
  template,
  date,
  onAdd,
  onDelete,
}: {
  template: MealTemplate;
  date: string;
  onAdd: () => void;
  onDelete: () => void;
}) {
  const meal = buildMealFromTemplate(template, date);
  const totals = calculateMealTotals(meal);
  const badges = getTemplateBadges(template);

  return (
    <article className="rounded-3xl border border-black/5 bg-[#FAFAF8] p-5">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold">{template.name}</h3>

            {badges.map((badge) => (
              <span
                key={badge}
                className={`rounded-full px-2 py-1 text-xs ${
                  badge === "Par défaut"
                    ? "bg-[#10121A] text-white"
                    : badge === "Personnel"
                    ? "bg-white text-gray-600 ring-1 ring-black/5"
                    : "bg-orange-100 text-orange-900"
                }`}
              >
                {badge}
              </span>
            ))}
          </div>

          <p className="mt-2 text-sm text-gray-500">
            {mealTypeLabels[template.type]} · {template.items.length} aliment(s)
          </p>

          <p className="mt-3 text-sm leading-6 text-gray-600">
            {getTemplatePurpose(template)}
          </p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        <MiniStat label="Calories" value={formatMacro(totals.calories, " kcal")} />
        <MiniStat label="Protéines" value={formatMacro(totals.proteinG, " g")} />
        <MiniStat label="Glucides" value={formatMacro(totals.carbsG, " g")} />
        <MiniStat label="Lipides" value={formatMacro(totals.fatG, " g")} />
      </div>

      <div className="mt-5 space-y-2">
        {template.items.map((item) => (
          <div
            key={item.id}
            className="flex flex-col justify-between gap-1 rounded-xl bg-white px-4 py-3 text-sm md:flex-row"
          >
            <span>
              {item.foodNameSnapshot} · {item.quantityG} g
            </span>
            <span className="text-gray-500">
              {item.calories ?? "—"} kcal · {item.proteinG ?? "—"} P
            </span>
          </div>
        ))}
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <button
          onClick={onAdd}
          className="rounded-2xl bg-[#10121A] px-5 py-3 text-sm font-medium text-white"
        >
          Ajouter au journal
        </button>

        <button
          onClick={onDelete}
          className="rounded-2xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-medium text-red-700"
        >
          Supprimer
        </button>
      </div>
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

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-1 font-semibold">{value}</p>
    </div>
  );
}