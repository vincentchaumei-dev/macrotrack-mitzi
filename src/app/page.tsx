"use client";

import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { useNutritionStore } from "@/hooks/useNutritionStore";
import {
  calculateDayTotals,
  calculateTdee,
  formatDateFr,
  formatMacro,
  getDayCoachMessage,
  getGoalLabel,
  getProgress,
  getSimpleNutritionTip,
  mealTypeLabels,
  todayLocalDate,
  calculateMealTotals,
} from "@/lib/nutrition";

export default function Home() {
  const { profile, goals, getMealsByDate, hasLoaded } = useNutritionStore();

  const today = todayLocalDate();
  const meals = getMealsByDate(today);
  const totals = calculateDayTotals(meals);
  const tdee = calculateTdee(profile);

  const coachMessage = getDayCoachMessage({
    calories: totals.calories,
    proteinG: totals.proteinG,
    carbsG: totals.carbsG,
    fatG: totals.fatG,
    goals,
    profile,
  });

  if (!hasLoaded) {
    return (
      <AppShell>
        <p>Chargement...</p>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <p className="text-sm font-medium text-[#E85A0C]">
            {formatDateFr(today)}
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            Dashboard nutrition
          </h1>
          <p className="mt-2 max-w-2xl text-gray-500">
            Objectif actuel : {getGoalLabel(profile).toLowerCase()} · dépense
            journalière estimée : {tdee} kcal.
          </p>
        </div>

        <Link
          href="/add"
          className="rounded-full bg-[#10121A] px-5 py-3 text-center text-sm font-medium text-white shadow-sm"
        >
          Ajouter un repas
        </Link>
      </div>

      <section className="grid gap-4 md:grid-cols-4">
        <StatCard
          label="Calories"
          value={formatMacro(totals.calories, "")}
          target={`/ ${goals.calories} kcal`}
          progress={getProgress(totals.calories, goals.calories)}
          suffix="kcal"
        />
        <StatCard
          label="Protéines"
          value={formatMacro(totals.proteinG, " g")}
          target={`/ ${goals.proteinG} g`}
          progress={getProgress(totals.proteinG, goals.proteinG)}
        />
        <StatCard
          label="Glucides"
          value={formatMacro(totals.carbsG, " g")}
          target={`/ ${goals.carbsG} g`}
          progress={getProgress(totals.carbsG, goals.carbsG)}
        />
        <StatCard
          label="Lipides"
          value={formatMacro(totals.fatG, " g")}
          target={`/ ${goals.fatG} g`}
          progress={getProgress(totals.fatG, goals.fatG)}
        />
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-3">
        <InfoCard
          label="Dépense estimée"
          value={`${tdee} kcal`}
          description="Estimation de maintien selon le profil et l’activité."
        />
        <InfoCard
          label="Objectif calories"
          value={`${goals.calories} kcal`}
          description="Cible journalière actuelle, modifiable dans Objectifs."
        />
        <InfoCard
          label="Calories restantes"
          value={
            totals.calories === null
              ? "—"
              : `${Math.max(goals.calories - totals.calories, 0)} kcal`
          }
          description="À interpréter sur la moyenne de plusieurs jours."
        />
      </section>

      {totals.incompleteItems > 0 && (
        <div className="mt-5 rounded-2xl border border-orange-200 bg-orange-50 p-4 text-sm text-orange-900">
          {totals.incompleteItems} aliment(s) du jour ont des valeurs
          nutritionnelles incomplètes. Les totaux peuvent être partiels.
        </div>
      )}

      <section className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Repas du jour</h2>
              <p className="text-sm text-gray-500">
                {meals.length === 0
                  ? "Aucun repas enregistré pour le moment."
                  : `${meals.length} repas enregistré(s) aujourd’hui.`}
              </p>
            </div>

            <Link
              href="/add"
              className="rounded-full bg-[#10121A] px-4 py-2 text-sm font-medium text-white"
            >
              Ajouter
            </Link>
          </div>

          {meals.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-black/10 bg-[#FAFAF8] p-6 text-center">
              <p className="font-medium">Commence le suivi nutritionnel</p>
              <p className="mt-1 text-sm text-gray-500">
                Ajoute un premier repas pour calculer calories, protéines,
                glucides et lipides.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {meals.map((meal) => {
                const mealTotals = calculateMealTotals(meal);

                return (
                  <div
                    key={meal.id}
                    className="rounded-2xl border border-black/5 bg-[#FAFAF8] p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-medium">
                          {meal.name || mealTypeLabels[meal.type]}
                        </h3>
                        <p className="mt-1 text-sm text-gray-500">
                          {meal.items.length} aliment(s)
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="font-medium">
                          {formatMacro(mealTotals.calories, " kcal")}
                        </p>
                        <p className="mt-1 text-sm text-gray-500">
                          {formatMacro(mealTotals.proteinG, " g")} prot.
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <aside className="space-y-6">
          <div
            className={`rounded-3xl p-6 shadow-sm ${
              coachMessage.tone === "success"
                ? "bg-green-900 text-white"
                : coachMessage.tone === "warning"
                ? "bg-orange-900 text-white"
                : "bg-[#10121A] text-white"
            }`}
          >
            <p className="text-sm text-white/60">Coach nutrition</p>
            <h2 className="mt-2 text-2xl font-semibold">
              {coachMessage.title}
            </h2>
            <p className="mt-4 text-sm leading-6 text-white/70">
              {coachMessage.description}
            </p>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5">
            <p className="text-sm font-medium text-[#E85A0C]">
              Conseil simple
            </p>
            <p className="mt-3 text-sm leading-6 text-gray-600">
              {getSimpleNutritionTip(profile)}
            </p>
          </div>
        </aside>
      </section>
    </AppShell>
  );
}

function StatCard({
  label,
  value,
  target,
  progress,
  suffix,
}: {
  label: string;
  value: string;
  target: string;
  progress: number;
  suffix?: string;
}) {
  return (
    <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5">
      <p className="text-sm text-gray-500">{label}</p>
      <div className="mt-3 flex items-end gap-2">
        <p className="text-3xl font-semibold">
          {value}
          {suffix && value !== "—" ? ` ${suffix}` : ""}
        </p>
        <p className="pb-1 text-sm text-gray-500">{target}</p>
      </div>
      <div className="mt-4 h-2 rounded-full bg-gray-100">
        <div
          className="h-2 rounded-full bg-[#E85A0C]"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

function InfoCard({
  label,
  value,
  description,
}: {
  label: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
      <p className="mt-2 text-sm text-gray-500">{description}</p>
    </div>
  );
}