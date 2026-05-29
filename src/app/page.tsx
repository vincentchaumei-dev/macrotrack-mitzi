"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { useNutritionStore } from "@/hooks/useNutritionStore";
import {
  calculateDayTotals,
  calculateTdee,
  formatMacro,
  goalTypeLabels,
  mealTypeLabels,
  todayLocalDate,
} from "@/lib/nutrition";
import { Meal } from "@/types/nutrition";

function toNumber(value: number | null | undefined) {
  return typeof value === "number" ? value : 0;
}

function getPercent(value: number, target: number) {
  if (target <= 0) return 0;
  return Math.min(100, Math.round((value / target) * 100));
}

function formatWeekDay(date: Date) {
  return new Intl.DateTimeFormat("fr-FR", { weekday: "short" })
    .format(date)
    .slice(0, 1)
    .toUpperCase();
}

function getWeekDays(today: string) {
  const base = new Date(`${today}T12:00:00`);
  const day = base.getDay() === 0 ? 7 : base.getDay();
  const monday = new Date(base);
  monday.setDate(base.getDate() - day + 1);

  return Array.from({ length: 7 }, (_, index) => {
    const current = new Date(monday);
    current.setDate(monday.getDate() + index);

    return {
      label: formatWeekDay(current),
      number: String(current.getDate()).padStart(2, "0"),
      date: current.toISOString().slice(0, 10),
      active: current.toISOString().slice(0, 10) === today,
    };
  });
}

function getMealGradient(index: number) {
  const gradients = [
    "linear-gradient(140deg,#F2C94C,#E8A23D)",
    "linear-gradient(140deg,#A8C66C,#6E9B3E)",
    "linear-gradient(140deg,#E8455F,#B5304B)",
    "linear-gradient(140deg,#6E7CA6,#39446F)",
  ];

  return gradients[index % gradients.length];
}

function getCoachText({
  caloriesRemaining,
  protein,
  proteinTarget,
}: {
  caloriesRemaining: number;
  protein: number;
  proteinTarget: number;
}) {
  const proteinRemaining = Math.max(0, proteinTarget - protein);

  if (caloriesRemaining > 0) {
    return (
      <>
        Il te reste <b>{caloriesRemaining} kcal</b>
        {proteinRemaining > 0 ? (
          <>
            {" "}
            et <b>{proteinRemaining} g de protéines</b>
          </>
        ) : null}{" "}
        pour atteindre ton objectif. Belle journée jusqu’ici.
      </>
    );
  }

  return (
    <>
      Tu es légèrement au-dessus de l’objectif. Rien de grave : on regarde
      surtout la <b>tendance</b>, pas une journée isolée.
    </>
  );
}

export default function Home() {
  const router = useRouter();

  const {
    profile,
    goals,
    getMealsByDate,
    hasLoaded,
    onboardingCompleted,
  } = useNutritionStore();

  const today = todayLocalDate();
  const weekDays = useMemo(() => getWeekDays(today), [today]);
  const meals = getMealsByDate(today);
  const totals = calculateDayTotals(meals);

  const calories = toNumber(totals.calories);
  const protein = toNumber(totals.proteinG);
  const carbs = toNumber(totals.carbsG);
  const fat = toNumber(totals.fatG);

  const caloriesRemaining = goals.calories - calories;

  const caloriePercent = getPercent(calories, goals.calories);
  const proteinPercent = getPercent(protein, goals.proteinG);
  const carbsPercent = getPercent(carbs, goals.carbsG);
  const fatPercent = getPercent(fat, goals.fatG);

  const tdee = calculateTdee(profile);

  useEffect(() => {
    if (hasLoaded && !onboardingCompleted) {
      router.push("/onboarding");
    }
  }, [hasLoaded, onboardingCompleted, router]);

  if (!hasLoaded || !onboardingCompleted) {
    return (
      <AppShell>
        <div className="grid min-h-[100svh] place-items-center">
          <p className="text-sm font-bold text-[var(--mt-ink-2)]">
            Chargement...
          </p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="min-h-[100svh] bg-[var(--mt-bg)]">
        <section className="mt-immersive">
          <div className="mt-immersive-inner">
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-3">
                <div className="grid h-[42px] w-[42px] place-items-center rounded-[14px] border border-white/25 bg-white/20 font-[var(--mt-display)] text-lg font-semibold text-white backdrop-blur">
                  M
                </div>

                <div>
                  <p className="text-[11.5px] font-semibold text-white/75">
                    Bonjour,
                  </p>
                  <p className="font-[var(--mt-display)] text-[18px] font-semibold leading-none tracking-[-0.02em] text-white">
                    MacroTrack
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <Link
                  href="/goals"
                  className="grid h-10 w-10 place-items-center rounded-[13px] border border-white/20 bg-white/16 text-white backdrop-blur"
                >
                  <SettingsIcon />
                </Link>
                <button
                  type="button"
                  className="relative grid h-10 w-10 place-items-center rounded-[13px] border border-white/20 bg-white/16 text-white backdrop-blur"
                >
                  <span className="absolute right-2.5 top-2.5 h-1.5 w-1.5 rounded-full bg-white" />
                  <BellIcon />
                </button>
              </div>
            </div>

            <div className="mt-week">
              {weekDays.map((day) => (
                <div
                  key={day.date}
                  className={`mt-week-day ${day.active ? "mt-week-active" : ""}`}
                >
                  <div className="mt-week-label">{day.label}</div>
                  <div className="mt-week-num">{day.number}</div>
                </div>
              ))}
            </div>

            <div className="mt-big-cal">
              <div className="mt-big-cal-number">
                {Math.max(0, caloriesRemaining)}
              </div>
              <div className="mt-big-cal-label">
                kcal restantes · <b>{calories}</b> / {goals.calories} consommées
              </div>
            </div>

            <div className="mt-progress-line">
              <i style={{ width: `${caloriePercent}%` }} />
            </div>

            <div className="mt-immersive-macros">
              <MacroGlass
                label="Protéines"
                value={protein}
                target={goals.proteinG}
                percent={proteinPercent}
              />
              <MacroGlass
                label="Glucides"
                value={carbs}
                target={goals.carbsG}
                percent={carbsPercent}
              />
              <MacroGlass
                label="Lipides"
                value={fat}
                target={goals.fatG}
                percent={fatPercent}
              />
            </div>
          </div>
        </section>

        <section className="mt-sheet">
          <div className="mt-sheet-grip" />

          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[var(--mt-rouge)]">
                {goalTypeLabels[profile.goalType]} · TDEE {tdee} kcal
              </p>
              <h1 className="mt-display mt-1 text-[24px] font-semibold tracking-[-0.03em] text-[var(--mt-ink)]">
                Aujourd’hui
              </h1>
            </div>

            <Link href="/journal" className="text-[12.5px] font-extrabold text-[var(--mt-rouge)]">
              Tout voir
            </Link>
          </div>

          <div className="mt-section-head">
            <h2>Repas du jour</h2>
            <Link href="/add">Ajouter</Link>
          </div>

          {meals.length === 0 ? (
            <div className="mt-card mb-4 p-5 text-center">
              <p className="mt-display text-xl font-semibold text-[var(--mt-ink)]">
                Aucun repas enregistré
              </p>
              <p className="mt-2 text-sm leading-6 text-[var(--mt-ink-2)]">
                Ajoute un repas ou utilise un repas type pour commencer la
                journée simplement.
              </p>
              <div className="mt-4 grid gap-2">
                <Link href="/add" className="mt-btn-primary">
                  Ajouter un repas
                </Link>
                <Link href="/recipes" className="mt-btn-soft text-center">
                  Voir les repas types
                </Link>
              </div>
            </div>
          ) : (
            meals.map((meal, index) => (
              <MealRow key={meal.id} meal={meal} index={index} />
            ))
          )}

          <div className="mt-insight">
            <div className="mt-insight-icon">
              <LightIcon />
            </div>
            <p>
              {getCoachText({
                caloriesRemaining,
                protein,
                proteinTarget: goals.proteinG,
              })}
            </p>
          </div>

          <div className="h-20" />
        </section>
      </div>
    </AppShell>
  );
}

function MacroGlass({
  label,
  value,
  target,
  percent,
}: {
  label: string;
  value: number;
  target: number;
  percent: number;
}) {
  return (
    <div className="mt-immersive-macro">
      <div className="mt-immersive-macro-label">{label}</div>
      <div className="mt-immersive-macro-value">
        {value}
        <small>/{target}g</small>
      </div>
      <div className="mt-mini-bar">
        <i style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

function MealRow({ meal, index }: { meal: Meal; index: number }) {
  const totals = calculateDayTotals([meal]);

  return (
    <Link href="/journal" className="mt-meal-row">
      <div
        className="mt-meal-thumb"
        style={{ background: getMealGradient(index) }}
      />

      <div className="mt-meal-info">
        <div className="mt-meal-title">
          {meal.name || mealTypeLabels[meal.type]}
        </div>
        <div className="mt-meal-sub">
          <span>
            <b>{formatMacro(totals.proteinG, "g")}</b> P
          </span>
          <span>
            <b>{formatMacro(totals.carbsG, "g")}</b> G
          </span>
          <span>
            <b>{formatMacro(totals.fatG, "g")}</b> L
          </span>
        </div>
      </div>

      <div className="mt-meal-kcal">
        <div className="mt-meal-kcal-number">
          {formatMacro(totals.calories, "")}
        </div>
        <div className="mt-meal-kcal-unit">kcal</div>
      </div>
    </Link>
  );
}

function SettingsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.8 1.8 0 0 0 .36 2l.04.04a2 2 0 1 1-2.83 2.83l-.04-.04a1.8 1.8 0 0 0-2-.36 1.8 1.8 0 0 0-1 1.63V21a2 2 0 1 1-4 0v-.06a1.8 1.8 0 0 0-1-1.63 1.8 1.8 0 0 0-2 .36l-.04.04a2 2 0 1 1-2.83-2.83l.04-.04a1.8 1.8 0 0 0 .36-2 1.8 1.8 0 0 0-1.63-1H3a2 2 0 1 1 0-4h.06a1.8 1.8 0 0 0 1.63-1 1.8 1.8 0 0 0-.36-2l-.04-.04a2 2 0 1 1 2.83-2.83l.04.04a1.8 1.8 0 0 0 2 .36 1.8 1.8 0 0 0 1-1.63V3a2 2 0 1 1 4 0v.06a1.8 1.8 0 0 0 1 1.63 1.8 1.8 0 0 0 2-.36l.04-.04a2 2 0 1 1 2.83 2.83l-.04.04a1.8 1.8 0 0 0-.36 2 1.8 1.8 0 0 0 1.63 1H21a2 2 0 1 1 0 4h-.06a1.8 1.8 0 0 0-1.54 1Z" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.7 21a2 2 0 0 1-3.4 0" />
    </svg>
  );
}

function LightIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z" />
      <path d="M9 21h6" />
    </svg>
  );
}