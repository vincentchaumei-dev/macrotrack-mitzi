"use client";

import Link from "next/link";
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
  calculateDayTotals,
  formatDateFr,
  formatMacro,
  mealTypeLabels,
  todayLocalDate,
} from "@/lib/nutrition";
import { Meal } from "@/types/nutrition";
import { PremiumMealCard } from "@/components/ui/PremiumMealCard";

function toNumber(value: number | null | undefined) {
  return typeof value === "number" ? value : 0;
}

function getPercent(value: number, target: number) {
  if (target <= 0) return 0;
  return Math.min(120, Math.round((value / target) * 100));
}

function shiftDate(date: string, offsetDays: number) {
  const nextDate = new Date(`${date}T12:00:00`);
  nextDate.setDate(nextDate.getDate() + offsetDays);
  return nextDate.toISOString().slice(0, 10);
}

function getPreviousDate(date: string) {
  return shiftDate(date, -1);
}

function getNextDate(date: string) {
  return shiftDate(date, 1);
}

export default function JournalPage() {
  const {
    goals,
    getMealsByDate,
    deleteMeal,
    duplicateMeal,
    copyDay,
    saveMealAsTemplate,
  } = useNutritionStore();

  const [date, setDate] = useState(todayLocalDate());
  const [message, setMessage] = useState("");

  const meals = getMealsByDate(date);

  const totals = useMemo(() => calculateDayTotals(meals), [meals]);

  const calories = toNumber(totals.calories);
  const protein = toNumber(totals.proteinG);
  const carbs = toNumber(totals.carbsG);
  const fat = toNumber(totals.fatG);

  const caloriePercent = getPercent(calories, goals.calories);

  function notify(text: string) {
    setMessage(text);
    window.setTimeout(() => setMessage(""), 2500);
  }

  function handleDeleteMeal(meal: Meal) {
    const confirmed = window.confirm(
      `Supprimer "${meal.name || mealTypeLabels[meal.type]}" du journal ?`
    );

    if (!confirmed) return;

    deleteMeal(meal.id);
    notify("Repas supprimé.");
  }

  function handleDuplicateMeal(meal: Meal) {
    const duplicated = duplicateMeal(meal.id, date);

    if (!duplicated) {
      notify("Impossible de dupliquer ce repas.");
      return;
    }

    notify("Repas dupliqué sur cette journée.");
  }

  function handleSaveAsTemplate(meal: Meal) {
    const template = saveMealAsTemplate(meal.id);

    if (!template) {
      notify("Impossible d’enregistrer ce repas type.");
      return;
    }

    notify("Repas enregistré comme repas type.");
  }

  function handleCopyYesterday() {
    const sourceDate = getPreviousDate(date);
    const copiedCount = copyDay(sourceDate, date);

    if (copiedCount === 0) {
      notify("Aucun repas à copier depuis la veille.");
      return;
    }

    notify(`${copiedCount} repas copié(s) depuis la veille.`);
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl">
        <PageHeader
          eyebrow="Suivi quotidien"
          title="Journal"
          description="Retrouve les repas enregistrés sur la journée, vérifie les calories et ajuste facilement ce qui doit l’être."
          action={
            <PremiumCard className="p-4" tint="white">
              <label className="block">
                <span className="mb-2 block text-xs font-black uppercase tracking-wide text-[#7A746E]">
                  Date du journal
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
          <StatCard
            label="Calories"
            value={formatMacro(totals.calories, " kcal")}
            detail={`${goals.calories} kcal objectif`}
          />
          <StatCard
            label="Protéines"
            value={formatMacro(totals.proteinG, " g")}
            detail={`${goals.proteinG} g objectif`}
          />
          <StatCard
            label="Glucides"
            value={formatMacro(totals.carbsG, " g")}
            detail={`${goals.carbsG} g objectif`}
          />
          <StatCard
            label="Lipides"
            value={formatMacro(totals.fatG, " g")}
            detail={`${goals.fatG} g objectif`}
          />
        </section>

        {message && (
          <div className="mb-5 rounded-[28px] bg-green-50 p-4 text-sm font-black text-green-800 ring-1 ring-green-100">
            {message}
          </div>
        )}

        <section className="mb-5 grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
          <PremiumCard tint="white">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-black text-[#E94B4B]">
                  {formatDateFr(date)}
                </p>
                <h2 className="mt-2 text-3xl font-black tracking-[-0.04em] text-[#171717] md:text-4xl">
                  {meals.length === 0
                    ? "Journée vide"
                    : `${meals.length} repas enregistré(s)`}
                </h2>
                <p className="mt-3 max-w-xl text-sm leading-6 text-[#7A746E]">
                  {meals.length === 0
                    ? "Ajoute un repas ou copie la journée précédente pour aller plus vite."
                    : "Tu peux dupliquer, supprimer ou transformer un repas en repas type."}
                </p>
              </div>

              <ProgressBubble percent={caloriePercent} />
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-3">
              <MacroProgress
                label="Protéines"
                value={protein}
                target={goals.proteinG}
                color="#7DD3FC"
              />
              <MacroProgress
                label="Glucides"
                value={carbs}
                target={goals.carbsG}
                color="#F6C766"
              />
              <MacroProgress
                label="Lipides"
                value={fat}
                target={goals.fatG}
                color="#E94B4B"
              />
            </div>
          </PremiumCard>

          <PremiumCard tint="red">
            <p className="text-sm font-black text-white/70">Actions rapides</p>
            <h2 className="mt-3 text-3xl font-black tracking-[-0.04em]">
              Gagne du temps.
            </h2>
            <p className="mt-3 text-sm leading-6 text-white/82">
              Utilise les repas types, copie la veille ou ajoute un repas
              manuellement selon la journée.
            </p>

            <div className="mt-6 grid gap-3">
              <Link
                href="/add"
                className="rounded-full bg-white px-5 py-3 text-center text-sm font-black text-[#171717] shadow-[0_18px_34px_rgba(0,0,0,0.12)] transition hover:-translate-y-0.5 hover:bg-[#FFF2EE]"
              >
                Ajouter un repas
              </Link>

              <Link
                href="/recipes"
                className="rounded-full bg-white/16 px-5 py-3 text-center text-sm font-black text-white backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/22"
              >
                Utiliser un repas type
              </Link>

              <button
                type="button"
                onClick={handleCopyYesterday}
                className="rounded-full bg-white/16 px-5 py-3 text-sm font-black text-white backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/22"
              >
                Copier la veille
              </button>
            </div>
          </PremiumCard>
        </section>

        <section className="mb-5 flex flex-wrap gap-2">
          <GhostButton onClick={() => setDate(getPreviousDate(date))}>
            ← Jour précédent
          </GhostButton>

          <SoftButton onClick={() => setDate(todayLocalDate())}>
            Aujourd’hui
          </SoftButton>

          <GhostButton onClick={() => setDate(getNextDate(date))}>
            Jour suivant →
          </GhostButton>
        </section>

        <PremiumCard tint="white">
          <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
            <SectionTitle
              title="Repas de la journée"
              text="Chaque repas reste modifiable indirectement : supprime-le, duplique-le ou recrée une version ajustée."
            />

            <PrimaryButton href="/add">Ajouter</PrimaryButton>
          </div>

          <div className="mt-6">
            {meals.length === 0 ? (
              <EmptyState
                title="Aucun repas sur cette journée"
                text="Ajoute un repas, utilise un repas type ou copie la veille si cette journée ressemble à la précédente."
                action={
                  <div className="flex flex-wrap justify-center gap-2">
                    <PrimaryButton href="/add">Ajouter un repas</PrimaryButton>
                    <SoftButton href="/recipes">Voir les repas types</SoftButton>
                  </div>
                }
              />
            ) : (
              <div className="grid gap-5 xl:grid-cols-2">
                {meals.map((meal) => (
                  <MealCard
                    key={meal.id}
                    meal={meal}
                    onDuplicate={() => handleDuplicateMeal(meal)}
                    onSaveAsTemplate={() => handleSaveAsTemplate(meal)}
                    onDelete={() => handleDeleteMeal(meal)}
                  />
                ))}
              </div>
            )}
          </div>
        </PremiumCard>
      </div>
    </AppShell>
  );
}

function ProgressBubble({ percent }: { percent: number }) {
  const displayedPercent = Math.min(120, Math.max(0, percent));

  return (
    <div className="flex h-36 w-36 shrink-0 flex-col items-center justify-center rounded-full bg-[#FFE1DD] shadow-[inset_0_0_0_14px_rgba(233,75,75,0.14)]">
      <p className="text-4xl font-black tracking-[-0.04em] text-[#B92D35]">
        {displayedPercent}%
      </p>
      <p className="mt-1 text-xs font-black text-[#B92D35]/70">calories</p>
    </div>
  );
}

function MacroProgress({
  label,
  value,
  target,
  color,
}: {
  label: string;
  value: number;
  target: number;
  color: string;
}) {
  const percent = Math.min(100, getPercent(value, target));

  return (
    <div className="rounded-[26px] bg-[#FFFAF5] p-4 ring-1 ring-black/[0.055]">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-sm font-black text-[#171717]">{label}</p>
        <p className="text-sm text-[#7A746E]">
          <span className="font-black text-[#171717]">{value}</span> / {target} g
        </p>
      </div>

      <div className="mt-3 h-2 overflow-hidden rounded-full bg-black/5">
        <div
          className="h-full rounded-full"
          style={{ width: `${percent}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

function MealCard({
  meal,
  onDuplicate,
  onSaveAsTemplate,
  onDelete,
}: {
  meal: Meal;
  onDuplicate: () => void;
  onSaveAsTemplate: () => void;
  onDelete: () => void;
}) {
  const totals = calculateDayTotals([meal]);

  return (
    <PremiumMealCard
      eyebrow={`${mealTypeLabels[meal.type]} · ${meal.items.length} aliment(s)`}
      title={meal.name || mealTypeLabels[meal.type]}
      description="Repas enregistré dans le journal. Tu peux le dupliquer, l’enregistrer comme repas type ou le supprimer."
      badges={[
        {
          label: mealTypeLabels[meal.type],
          tone: "red",
        },
      ]}
      totals={{
        calories: totals.calories,
        proteinG: totals.proteinG,
        carbsG: totals.carbsG,
        fatG: totals.fatG,
      }}
      items={meal.items.map((item) => ({
        id: item.id,
        name: item.foodNameSnapshot,
        quantityG: item.quantityG,
        calories: item.calories,
        proteinG: item.proteinG,
      }))}
      actions={[
        {
          label: "Dupliquer",
          tone: "ghost",
          onClick: onDuplicate,
        },
        {
          label: "En repas type",
          tone: "soft",
          onClick: onSaveAsTemplate,
        },
        {
          label: "Supprimer",
          tone: "danger",
          onClick: onDelete,
        },
      ]}
      maxItems={5}
    />
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[24px] bg-white p-4 ring-1 ring-black/[0.055]">
      <p className="text-xs font-bold text-[#7A746E]">{label}</p>
      <p className="mt-1 font-black text-[#171717]">{value}</p>
    </div>
  );
}