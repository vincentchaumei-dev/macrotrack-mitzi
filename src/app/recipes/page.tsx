"use client";

import { ReactNode, useMemo, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { useConfirm } from "@/components/ui/ConfirmProvider";
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
    return searchableText.includes("perte") || searchableText.includes("satiete");
  }

  if (filter === "muscle_gain") {
    return searchableText.includes("prise de masse") || searchableText.includes("masse");
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

  const searchableText = normalize(
    `${template.name} ${template.items
      .map((item) => item.foodNameSnapshot)
      .join(" ")}`
  );

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
    return "Simple, rassasiant, pensé pour tenir sans frustration.";
  }

  if (name.includes("prise de masse")) {
    return "Plus dense, pratique quand il faut manger suffisamment.";
  }

  if (name.includes("vegetarien")) {
    return "Une option végétarienne facile à suivre au quotidien.";
  }

  if (template.type === "breakfast") {
    return "Une base de petit-déjeuner rapide et facile à adapter.";
  }

  if (template.type === "snack") {
    return "Une collation pratique pour compléter la journée.";
  }

  return "Un repas équilibré, prêt à utiliser ou à ajuster.";
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
  const confirm = useConfirm();

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
    window.setTimeout(() => setMessage(""), 2400);
  }

  function handleAddTemplate(templateId: string) {
    const meal = addTemplateAsMeal(templateId, date);

    if (!meal) {
      notify("Impossible d’ajouter ce repas type.");
      return;
    }

    notify("Repas type ajouté au journal.");
  }

  async function handleDeleteTemplate(template: MealTemplate) {
    const confirmed = await confirm({
      title: "Supprimer ce repas type ?",
      message: template.isDefault
        ? `"${template.name}" est un repas type par défaut. Il sera retiré de la bibliothèque, mais les repas déjà ajoutés au journal ne changeront pas.`
        : `"${template.name}" sera retiré de tes repas types. Les repas déjà ajoutés au journal ne changeront pas.`,
      confirmLabel: "Supprimer",
      cancelLabel: "Annuler",
      tone: "danger",
    });

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
      <div className="space-y-5">
        {message && <div className="mt-dashboard-toast">{message}</div>}

        <section className="pt-2">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[12px] font-black uppercase tracking-[0.18em] text-[var(--mt-rouge)]">
                Réutilisable
              </p>

              <h1 className="mt-display mt-3 text-[48px] font-semibold leading-[0.9] tracking-[-0.055em] text-[var(--mt-ink)]">
                Repas
                <br />
                types
              </h1>

              <p className="mt-4 max-w-[310px] text-[15px] leading-7 text-[var(--mt-ink-2)]">
                Des repas prêts à ajouter pour gagner du temps et rester
                régulière.
              </p>
            </div>

            <label className="mt-card shrink-0 rounded-[22px] p-3">
              <span className="block text-[10px] font-black uppercase tracking-[0.14em] text-[var(--mt-ink-2)]">
                Date
              </span>
              <input
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                className="mt-2 w-[138px] rounded-[16px] border border-[var(--mt-line)] bg-[var(--mt-card-soft)] px-3 py-2 text-[13px] font-extrabold text-[var(--mt-ink)] outline-none"
              />
            </label>
          </div>
        </section>

        <section className="grid grid-cols-3 gap-3">
          <MiniStat label="Total" value={`${mealTemplates.length}`} />
          <MiniStat label="Défaut" value={`${defaultTemplatesCount}`} />
          <MiniStat label="Perso" value={`${personalTemplatesCount}`} />
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
              placeholder="Poulet, végétarien, collation..."
            />
          </label>

          <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
            {mealFilters.map((filter) => (
              <FilterChip
                key={filter.value}
                active={mealFilter === filter.value}
                onClick={() => setMealFilter(filter.value)}
              >
                {filter.label}
              </FilterChip>
            ))}
          </div>

          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {templateFilters.map((filter) => (
              <FilterChip
                key={filter.value}
                active={templateFilter === filter.value}
                onClick={() => setTemplateFilter(filter.value)}
              >
                {filter.label}
              </FilterChip>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between gap-3">
            <p className="text-[12px] font-bold text-[var(--mt-ink-2)]">
              {filteredTemplates.length} résultat(s)
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

        {filteredTemplates.length === 0 ? (
          <section className="mt-card rounded-[28px] p-5 text-center">
            <p className="mt-display text-[23px] font-semibold tracking-[-0.03em] text-[var(--mt-ink)]">
              Aucun repas trouvé
            </p>
            <p className="mt-2 text-[13px] leading-6 text-[var(--mt-ink-2)]">
              Essaie de modifier les filtres ou de réinitialiser la recherche.
            </p>

            <button
              type="button"
              onClick={resetFilters}
              className="mt-btn-soft mt-4"
            >
              Réinitialiser
            </button>
          </section>
        ) : (
          <>
            <section>
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="text-[12px] font-black uppercase tracking-[0.18em] text-[var(--mt-rouge)]">
                    Suggestions
                  </p>
                  <h2 className="mt-display mt-1 text-[26px] font-semibold tracking-[-0.03em] text-[var(--mt-ink)]">
                    À ajouter vite
                  </h2>
                </div>
              </div>

              <div className="flex gap-3 overflow-x-auto pb-1">
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

            <section className="mt-card rounded-[28px] p-5">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <p className="text-[12px] font-black uppercase tracking-[0.18em] text-[var(--mt-rouge)]">
                    Bibliothèque
                  </p>
                  <h2 className="mt-display mt-1 text-[26px] font-semibold tracking-[-0.03em] text-[var(--mt-ink)]">
                    Tous les repas
                  </h2>
                </div>

                <span className="rounded-full bg-[var(--mt-rouge-wash)] px-3 py-2 text-[11px] font-black text-[var(--mt-rouge-deep)]">
                  {remainingTemplates.length}
                </span>
              </div>

              <div className="mt-5 grid gap-3">
                {remainingTemplates.length === 0 ? (
                  <div className="rounded-[22px] border border-dashed border-[var(--mt-line-2)] bg-[var(--mt-card-soft)] p-5 text-center">
                    <p className="mt-display text-[21px] font-semibold text-[var(--mt-ink)]">
                      Tout est déjà en suggestions
                    </p>
                    <p className="mt-2 text-[13px] leading-6 text-[var(--mt-ink-2)]">
                      Change les filtres pour afficher d’autres repas.
                    </p>
                  </div>
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
            </section>
          </>
        )}

        <div className="h-10" />
      </div>
    </AppShell>
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

  const gradients = [
    "from-[var(--mt-rouge-lit)] via-[var(--mt-rouge)] to-[var(--mt-rouge-deep)]",
    "from-[var(--mt-ink)] via-[#31292c] to-[#4a3038]",
    "from-[#D69B3F] via-[var(--mt-rouge-lit)] to-[var(--mt-rouge-deep)]",
  ];

  return (
    <article
      className={`relative w-[270px] shrink-0 overflow-hidden rounded-[30px] bg-gradient-to-br ${
        gradients[index % gradients.length]
      } p-5 text-white shadow-[var(--mt-shadow-lift)]`}
    >
      <div
        aria-hidden="true"
        className="absolute -right-14 -top-14 h-40 w-40 rounded-full bg-white/14"
      />
      <div
        aria-hidden="true"
        className="absolute -bottom-20 left-6 h-44 w-44 rounded-full bg-white/10"
      />

      <div className="relative">
        <div className="flex flex-wrap gap-1.5">
          {badges.slice(0, 2).map((badge) => (
            <span
              key={badge}
              className="rounded-full bg-white/16 px-2.5 py-1 text-[10px] font-black text-white backdrop-blur"
            >
              {badge}
            </span>
          ))}
        </div>

        <p className="mt-5 text-[11px] font-black uppercase tracking-[0.16em] text-white/58">
          {mealTypeLabels[template.type]}
        </p>

        <h3 className="mt-display mt-2 line-clamp-2 text-[27px] font-semibold leading-[1] tracking-[-0.04em]">
          {template.name}
        </h3>

        <p className="mt-3 line-clamp-2 text-[13px] leading-6 text-white/76">
          {getTemplatePurpose(template)}
        </p>

        <div className="mt-5 grid grid-cols-3 gap-2">
          <GlassMini label="Kcal" value={formatMacro(totals.calories, "")} />
          <GlassMini label="Prot." value={formatMacro(totals.proteinG, "g")} />
          <GlassMini label="Items" value={`${template.items.length}`} />
        </div>

        <button
          type="button"
          onClick={onAdd}
          className="mt-5 w-full rounded-full bg-white px-4 py-3 text-[13px] font-black text-[var(--mt-ink)] shadow-[0_18px_34px_rgba(0,0,0,0.12)]"
        >
          Ajouter au journal
        </button>
      </div>
    </article>
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
    <article className="rounded-[24px] border border-[var(--mt-line)] bg-white p-4 shadow-[var(--mt-shadow)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap gap-1.5">
            {badges.slice(0, 3).map((badge) => (
              <Badge key={badge}>{badge}</Badge>
            ))}
          </div>

          <p className="mt-3 text-[11px] font-black uppercase tracking-[0.13em] text-[var(--mt-rouge)]">
            {mealTypeLabels[template.type]} · {template.items.length} aliment(s)
          </p>

          <h3 className="mt-1 line-clamp-2 text-[18px] font-black leading-tight tracking-[-0.025em] text-[var(--mt-ink)]">
            {template.name}
          </h3>

          <p className="mt-2 line-clamp-2 text-[13px] leading-6 text-[var(--mt-ink-2)]">
            {getTemplatePurpose(template)}
          </p>
        </div>

        <div className="shrink-0 text-right">
          <p className="mt-display text-[28px] font-semibold leading-none tracking-[-0.03em] text-[var(--mt-ink)]">
            {formatMacro(totals.calories, "")}
          </p>
          <p className="mt-1 text-[9px] font-black uppercase tracking-[0.08em] text-[var(--mt-ink-3)]">
            kcal
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <MacroBox label="Prot." value={formatMacro(totals.proteinG, "g")} />
        <MacroBox label="Gluc." value={formatMacro(totals.carbsG, "g")} />
        <MacroBox label="Lip." value={formatMacro(totals.fatG, "g")} />
      </div>

      <div className="mt-4 space-y-2">
        {template.items.slice(0, 3).map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between gap-3 rounded-[16px] bg-[var(--mt-card-soft)] px-3 py-2.5 ring-1 ring-[var(--mt-line)]"
          >
            <span className="line-clamp-1 text-[12px] font-black text-[var(--mt-ink)]">
              {item.foodNameSnapshot}
            </span>
            <span className="shrink-0 text-[12px] font-bold text-[var(--mt-ink-2)]">
              {item.quantityG}g
            </span>
          </div>
        ))}

        {template.items.length > 3 && (
          <div className="rounded-[16px] bg-[var(--mt-card-soft)] px-3 py-2.5 text-[12px] font-black text-[var(--mt-ink-2)] ring-1 ring-[var(--mt-line)]">
            +{template.items.length - 3} autre(s) aliment(s)
          </div>
        )}
      </div>

      <div className="mt-4 grid grid-cols-[1fr_auto] gap-2">
        <button type="button" onClick={onAdd} className="RecipePrimary">
          Ajouter
        </button>

        <button type="button" onClick={onDelete} className="RecipeDanger">
          Supprimer
        </button>
      </div>
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
          ? "bg-[var(--mt-ink)] text-[var(--mt-bg)]"
          : "bg-[var(--mt-card-soft)] text-[var(--mt-ink-2)] ring-1 ring-[var(--mt-line)]"
      }`}
    >
      {children}
    </button>
  );
}

function Badge({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full bg-[var(--mt-rouge-wash)] px-2.5 py-1 text-[10px] font-black text-[var(--mt-rouge-deep)]">
      {children}
    </span>
  );
}

function MacroBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[17px] bg-[var(--mt-card-soft)] p-3 ring-1 ring-[var(--mt-line)]">
      <p className="text-[10.5px] font-bold text-[var(--mt-ink-2)]">{label}</p>
      <p className="mt-1 text-[14px] font-black text-[var(--mt-ink)]">{value}</p>
    </div>
  );
}

function GlassMini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[17px] bg-white/14 p-3 backdrop-blur">
      <p className="text-[10px] font-bold text-white/62">{label}</p>
      <p className="mt-1 text-[14px] font-black text-white">{value}</p>
    </div>
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