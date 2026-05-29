"use client";

import { useMemo, useState } from "react";
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
  calculateMealTotals,
  formatMacro,
  mealTypeLabels,
  todayLocalDate,
} from "@/lib/nutrition";
import { MealTemplate, MealType } from "@/types/nutrition";
import { PremiumMealCard } from "@/components/ui/PremiumMealCard";

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
      searchableText.includes("satiete") ||
      searchableText.includes("satiété")
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

  badges.push(template.isDefault ? "Par défaut" : "Personnel");

  const name = normalize(template.name);
  const itemsText = normalize(
    template.items.map((item) => item.foodNameSnapshot).join(" ")
  );
  const searchableText = `${name} ${itemsText}`;

  if (searchableText.includes("perte") || searchableText.includes("satiete")) {
    badges.push("Perte de poids");
  }

  if (
    searchableText.includes("prise de masse") ||
    searchableText.includes("masse")
  ) {
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
    return "Un repas simple et rassasiant, pensé pour tenir sans frustration.";
  }

  if (name.includes("prise de masse")) {
    return "Un repas plus dense, pratique quand il faut manger suffisamment.";
  }

  if (name.includes("vegetarien")) {
    return "Une option végétarienne facile à suivre, avec légumineuses et féculents.";
  }

  if (template.type === "breakfast") {
    return "Une base de petit-déjeuner rapide, facile à adapter.";
  }

  if (template.type === "snack") {
    return "Une collation pratique pour compléter la journée sans faire un gros repas.";
  }

  return "Un repas équilibré, prêt à utiliser ou à ajuster selon les envies.";
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

  const featuredTemplates = filteredTemplates.slice(0, 3);
  const remainingTemplates = filteredTemplates.slice(3);

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
      <div className="mx-auto max-w-6xl">
        <PageHeader
          eyebrow="Réutilisable"
          title="Repas types"
          description="Des repas prêts à utiliser, pensés pour gagner du temps, rester régulière et ne pas repartir de zéro à chaque journée."
          action={
            <PremiumCard className="p-4" tint="white">
              <label className="block">
                <span className="mb-2 block text-xs font-black uppercase tracking-wide text-[#7A746E]">
                  Ajouter à la date
                </span>
                <input
                  type="date"
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                  className="input min-w-48"
                />
              </label>
            </PremiumCard>
          }
        />

        <section className="mb-5 grid gap-4 md:grid-cols-4">
          <StatCard label="Repas types" value={`${mealTemplates.length}`} />
          <StatCard label="Par défaut" value={`${defaultTemplatesCount}`} />
          <StatCard label="Personnels" value={`${personalTemplatesCount}`} />
          <StatCard label="Affichés" value={`${filteredTemplates.length}`} />
        </section>

        <PremiumCard className="mb-5" tint="white">
          <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
            <label className="block">
              <span className="mb-2 block text-sm font-black text-[#171717]">
                Rechercher un repas
              </span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="input"
                placeholder="Ex : poulet, végétarien, collation..."
              />
            </label>

            <GhostButton onClick={resetFilters} className="h-fit">
              Réinitialiser
            </GhostButton>
          </div>

          <div className="mt-6">
            <p className="mb-3 text-sm font-black text-[#171717]">
              Type de repas
            </p>
            <div className="flex flex-wrap gap-2">
              {mealFilters.map((filter) => (
                <FilterPill
                  key={filter.value}
                  active={mealFilter === filter.value}
                  onClick={() => setMealFilter(filter.value)}
                >
                  {filter.label}
                </FilterPill>
              ))}
            </div>
          </div>

          <div className="mt-5">
            <p className="mb-3 text-sm font-black text-[#171717]">Objectif</p>
            <div className="flex flex-wrap gap-2">
              {templateFilters.map((filter) => (
                <FilterPill
                  key={filter.value}
                  active={templateFilter === filter.value}
                  onClick={() => setTemplateFilter(filter.value)}
                >
                  {filter.label}
                </FilterPill>
              ))}
            </div>
          </div>
        </PremiumCard>

        {message && (
          <div className="mb-5 rounded-[28px] bg-green-50 p-4 text-sm font-black text-green-800 ring-1 ring-green-100">
            {message}
          </div>
        )}

        {filteredTemplates.length === 0 ? (
          <PremiumCard tint="white">
            <EmptyState
              title="Aucun repas type trouvé"
              text="Essaie de modifier les filtres ou de réinitialiser la recherche."
              action={<SoftButton onClick={resetFilters}>Réinitialiser</SoftButton>}
            />
          </PremiumCard>
        ) : (
          <>
            <section className="mb-5">
              <SectionTitle
                title="Suggestions rapides"
                text="Les premiers repas disponibles selon tes filtres actuels."
              />

              <div className="mt-5 grid gap-5 xl:grid-cols-3">
                {featuredTemplates.map((template, index) => (
                  <FeaturedTemplateCard
                    key={template.id}
                    template={template}
                    date={date}
                    index={index}
                    onAdd={() => handleAddTemplate(template.id)}
                  />
                ))}
              </div>
            </section>

            <PremiumCard tint="white">
              <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
                <SectionTitle
                  title="Bibliothèque de repas"
                  text="Ajoute un repas type au journal, puis ajuste-le ensuite selon la journée."
                />
              </div>

              <div className="mt-6 grid gap-5 xl:grid-cols-2">
                {remainingTemplates.length === 0 ? (
                  <EmptyState
                    title="Tous les résultats sont déjà en suggestions"
                    text="Modifie les filtres pour afficher d’autres repas types."
                  />
                ) : (
                  remainingTemplates.map((template) => (
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
            </PremiumCard>
          </>
        )}
      </div>
    </AppShell>
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
          ? "bg-[#E94B4B] text-white shadow-[0_14px_28px_rgba(233,75,75,0.22)]"
          : "bg-[#FFFAF5] text-[#7A746E] ring-1 ring-black/[0.055] hover:bg-[#FFE1DD] hover:text-[#B92D35]"
      }`}
    >
      {children}
    </button>
  );
}

function FeaturedTemplateCard({
  template,
  date,
  index,
  onAdd,
}: {
  template: MealTemplate;
  date: string;
  index: number;
  onAdd: () => void;
}) {
  const meal = buildMealFromTemplate(template, date);
  const totals = calculateMealTotals(meal);
  const badges = getTemplateBadges(template);

  return (
    <PremiumMealCard
      variant="featured"
      accentIndex={index}
      eyebrow={`${mealTypeLabels[template.type]} · ${template.items.length} aliment(s)`}
      title={template.name}
      description={getTemplatePurpose(template)}
      badges={badges.map((badge) => ({
        label: badge,
        tone:
          badge === "Par défaut"
            ? "dark"
            : badge === "Personnel"
            ? "cream"
            : "red",
      }))}
      totals={{
        calories: totals.calories,
        proteinG: totals.proteinG,
        carbsG: totals.carbsG,
        fatG: totals.fatG,
      }}
      items={template.items.map((item) => ({
        id: item.id,
        name: item.foodNameSnapshot,
        quantityG: item.quantityG,
        calories: item.calories,
        proteinG: item.proteinG,
      }))}
      actions={[
        {
          label: "Ajouter au journal",
          tone: "primary",
          onClick: onAdd,
        },
      ]}
      maxItems={3}
    />
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
    <PremiumMealCard
      eyebrow={`${mealTypeLabels[template.type]} · ${template.items.length} aliment(s)`}
      title={template.name}
      description={getTemplatePurpose(template)}
      badges={badges.map((badge) => ({
        label: badge,
        tone:
          badge === "Par défaut"
            ? "dark"
            : badge === "Personnel"
            ? "cream"
            : "red",
      }))}
      totals={{
        calories: totals.calories,
        proteinG: totals.proteinG,
        carbsG: totals.carbsG,
        fatG: totals.fatG,
      }}
      items={template.items.map((item) => ({
        id: item.id,
        name: item.foodNameSnapshot,
        quantityG: item.quantityG,
        calories: item.calories,
        proteinG: item.proteinG,
      }))}
      actions={[
        {
          label: "Ajouter au journal",
          tone: "primary",
          onClick: onAdd,
        },
        {
          label: "Supprimer",
          tone: "danger",
          onClick: onDelete,
        },
      ]}
      maxItems={4}
    />
  );
}

function TemplateBadge({ label }: { label: string }) {
  if (label === "Par défaut") {
    return <Pill tone="dark">{label}</Pill>;
  }

  if (label === "Personnel") {
    return <Pill tone="cream">{label}</Pill>;
  }

  return <Pill tone="red">{label}</Pill>;
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[24px] bg-white p-4 ring-1 ring-black/[0.055]">
      <p className="text-xs font-bold text-[#7A746E]">{label}</p>
      <p className="mt-1 font-black text-[#171717]">{value}</p>
    </div>
  );
}

function FeaturedMini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[22px] bg-white/14 p-3 backdrop-blur">
      <p className="text-[11px] font-bold text-white/68">{label}</p>
      <p className="mt-1 text-lg font-black text-white">{value}</p>
    </div>
  );
}