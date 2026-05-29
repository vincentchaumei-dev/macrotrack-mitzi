"use client";

import { useMemo, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { useNutritionStore } from "@/hooks/useNutritionStore";
import {
  calculateDayTotals,
  formatMacro,
  todayLocalDate,
} from "@/lib/nutrition";
import { Meal, WeightLog } from "@/types/nutrition";

type Period = 7 | 14 | 30;

function toNumber(value: number | null | undefined) {
  return typeof value === "number" ? value : 0;
}

function shiftDate(date: string, offsetDays: number) {
  const nextDate = new Date(`${date}T12:00:00`);
  nextDate.setDate(nextDate.getDate() + offsetDays);
  return nextDate.toISOString().slice(0, 10);
}

function getPeriodDays(period: Period) {
  const today = todayLocalDate();

  return Array.from({ length: period }, (_, index) => {
    const offset = index - period + 1;
    return shiftDate(today, offset);
  });
}

function getDayLabel(date: string) {
  return new Intl.DateTimeFormat("fr-FR", { weekday: "short" })
    .format(new Date(`${date}T12:00:00`))
    .slice(0, 1)
    .toUpperCase();
}

function getMealsForDate(meals: Meal[], date: string) {
  return meals.filter((meal) => meal.date === date);
}

function getAverage(values: number[]) {
  if (values.length === 0) return 0;

  const total = values.reduce((sum, value) => sum + value, 0);
  return Math.round((total / values.length) * 10) / 10;
}

function getWeightDelta(weightLogs: WeightLog[], days: string[]) {
  const firstDate = days[0];
  const lastDate = days[days.length - 1];

  const logsInPeriod = weightLogs
    .filter((log) => log.date >= firstDate && log.date <= lastDate)
    .sort((a, b) => a.date.localeCompare(b.date));

  const first = logsInPeriod[0];
  const last = logsInPeriod[logsInPeriod.length - 1];

  if (!first || !last || first.id === last.id) return null;

  return Math.round((last.weightKg - first.weightKg) * 10) / 10;
}

function formatDelta(value: number | null) {
  if (value === null) return "Pas assez de données";
  if (value === 0) return "Stable";
  if (value > 0) return `+${value} kg`;
  return `${value} kg`;
}

export default function AnalyticsPage() {
  const { meals, goals, weightLogs } = useNutritionStore();
  const [period, setPeriod] = useState<Period>(7);

  const days = useMemo(() => getPeriodDays(period), [period]);

  const dayStats = useMemo(() => {
    return days.map((date) => {
      const dayMeals = getMealsForDate(meals, date);
      const totals = calculateDayTotals(dayMeals);

      return {
        date,
        label: getDayLabel(date),
        mealsCount: dayMeals.length,
        hasData: dayMeals.length > 0,
        calories: toNumber(totals.calories),
        protein: toNumber(totals.proteinG),
        carbs: toNumber(totals.carbsG),
        fat: toNumber(totals.fatG),
      };
    });
  }, [days, meals]);

  const trackedDays = dayStats.filter((day) => day.hasData);

  const averageCalories = getAverage(trackedDays.map((day) => day.calories));
  const averageProtein = getAverage(trackedDays.map((day) => day.protein));
  const averageCarbs = getAverage(trackedDays.map((day) => day.carbs));
  const averageFat = getAverage(trackedDays.map((day) => day.fat));

  const proteinGoalDays = trackedDays.filter(
    (day) => day.protein >= goals.proteinG
  ).length;

  const caloriesGoalDays = trackedDays.filter(
    (day) => day.calories > 0 && day.calories <= goals.calories
  ).length;

  const maxCalories = Math.max(
    goals.calories,
    ...dayStats.map((day) => day.calories),
    1
  );

  const macroCalories = {
    protein: averageProtein * 4,
    carbs: averageCarbs * 4,
    fat: averageFat * 9,
  };

  const macroTotal =
    macroCalories.protein + macroCalories.carbs + macroCalories.fat;

  const proteinShare =
    macroTotal > 0 ? Math.round((macroCalories.protein / macroTotal) * 100) : 0;
  const carbsShare =
    macroTotal > 0 ? Math.round((macroCalories.carbs / macroTotal) * 100) : 0;
  const fatShare =
    macroTotal > 0 ? Math.max(0, 100 - proteinShare - carbsShare) : 0;

  const weightDelta = getWeightDelta(weightLogs, days);

  return (
    <AppShell>
      <div className="space-y-5">
        <section className="pt-2">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[12px] font-black uppercase tracking-[0.18em] text-[var(--mt-rouge)]">
                Analyse
              </p>

              <h1 className="mt-display mt-3 text-[46px] font-semibold leading-[0.92] tracking-[-0.055em] text-[var(--mt-ink)]">
                Tendances
                <br />
                nutrition
              </h1>

              <p className="mt-4 max-w-[310px] text-[15px] leading-7 text-[var(--mt-ink-2)]">
                Moyennes calories, macros et évolution sur la période.
              </p>
            </div>

            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-[16px] bg-white text-[var(--mt-ink-2)] shadow-[var(--mt-shadow-sm)] ring-1 ring-[var(--mt-line)]">
              <SearchIcon />
            </div>
          </div>
        </section>

        <section className="rounded-full bg-white p-1.5 shadow-[var(--mt-shadow)] ring-1 ring-[var(--mt-line)]">
          <div className="grid grid-cols-3 gap-1">
            {[7, 14, 30].map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setPeriod(item as Period)}
                className={`rounded-full px-4 py-3 text-[14px] font-black transition ${
                  period === item
                    ? "bg-[var(--mt-ink)] text-white"
                    : "text-[var(--mt-ink-2)]"
                }`}
              >
                {item} jours
              </button>
            ))}
          </div>
        </section>

        <section className="grid grid-cols-2 gap-3">
          <AnalyticsStat
            label="Moy. calories"
            value={`${averageCalories || "—"}`}
            unit="kcal"
          />
          <AnalyticsStat
            label="Moy. protéines"
            value={`${averageProtein || "—"}`}
            unit="g"
          />
          <AnalyticsStat
            label="Jours trackés"
            value={`${trackedDays.length}/${period}`}
            unit="jours"
          />
          <AnalyticsStat
            label="Objectif prot."
            value={`${proteinGoalDays}/${trackedDays.length || period}`}
            unit="jours"
          />
        </section>

        <section className="mt-card rounded-[28px] p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="mt-display text-[25px] font-semibold tracking-[-0.03em] text-[var(--mt-ink)]">
                Calories par jour
              </h2>
              <p className="mt-2 text-[13px] leading-6 text-[var(--mt-ink-2)]">
                Les journées sans données restent vides.
              </p>
            </div>

            <span className="rounded-full bg-[var(--mt-rouge-wash)] px-3 py-1.5 text-[11px] font-black text-[var(--mt-rouge-deep)]">
              Moy. {averageCalories || "—"}
            </span>
          </div>

          <div className="mt-6 space-y-4">
            {dayStats.map((day) => (
              <div key={day.date}>
                <div className="mb-2 flex items-center justify-between text-[12px] font-bold text-[var(--mt-ink-2)]">
                  <span>{day.date}</span>
                  <span>
                    {day.hasData ? `${Math.round(day.calories)} kcal` : "—"}
                  </span>
                </div>

                <div className="h-[10px] overflow-hidden rounded-full bg-[var(--mt-bg-warm)]">
                  {day.hasData && (
                    <div
                      className="h-full rounded-full bg-[var(--mt-rouge)] shadow-[var(--mt-shadow-red)]"
                      style={{
                        width: `${Math.min(
                          100,
                          Math.round((day.calories / maxCalories) * 100)
                        )}%`,
                      }}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="grid grid-cols-[1fr_0.82fr] gap-3">
          <section className="rounded-[28px] bg-[var(--mt-ink)] p-5 text-white shadow-[var(--mt-shadow-lift)]">
            <p className="text-[12px] font-black uppercase tracking-[0.16em] text-white/48">
              Résumé macros
            </p>

            <div className="mt-6 space-y-5">
              <MacroSummary
                label="Calories"
                value={`${averageCalories || "—"} kcal`}
                percent={
                  goals.calories > 0
                    ? Math.min(100, Math.round((averageCalories / goals.calories) * 100))
                    : 0
                }
              />
              <MacroSummary
                label="Protéines"
                value={`${averageProtein || "—"} g`}
                percent={
                  goals.proteinG > 0
                    ? Math.min(100, Math.round((averageProtein / goals.proteinG) * 100))
                    : 0
                }
              />
              <MacroSummary
                label="Glucides"
                value={`${averageCarbs || "—"} g`}
                percent={
                  goals.carbsG > 0
                    ? Math.min(100, Math.round((averageCarbs / goals.carbsG) * 100))
                    : 0
                }
              />
              <MacroSummary
                label="Lipides"
                value={`${averageFat || "—"} g`}
                percent={
                  goals.fatG > 0
                    ? Math.min(100, Math.round((averageFat / goals.fatG) * 100))
                    : 0
                }
              />
            </div>
          </section>

          <section className="mt-card rounded-[28px] p-5">
            <p className="text-[13px] font-bold leading-6 text-[var(--mt-ink-2)]">
              Poids sur la période
            </p>

            <p className="mt-display mt-4 text-[34px] font-semibold leading-[1] tracking-[-0.04em] text-[var(--mt-ink)]">
              {formatDelta(weightDelta)}
            </p>

            <p className="mt-4 text-[13px] leading-6 text-[var(--mt-ink-2)]">
              Ajoute au moins deux pesées sur la période pour lire l’évolution.
            </p>
          </section>
        </section>

        <section className="mt-card rounded-[28px] p-5">
          <div className="flex items-center gap-5">
            <MacroDonut
              proteinShare={proteinShare}
              carbsShare={carbsShare}
              fatShare={fatShare}
              averageCalories={averageCalories}
            />

            <div className="min-w-0 flex-1 space-y-3">
              <LegendRow color="var(--mt-prot)" label="Protéines" value={`${proteinShare}%`} />
              <LegendRow color="var(--mt-carb)" label="Glucides" value={`${carbsShare}%`} />
              <LegendRow color="var(--mt-fat)" label="Lipides" value={`${fatShare}%`} />
            </div>
          </div>
        </section>

        <section className="mt-insight">
          <div className="mt-insight-icon">
            <LightIcon />
          </div>
          <p>
            La donnée la plus utile n’est pas une journée parfaite, mais une
            tendance lisible sur plusieurs jours.
          </p>
        </section>

        <div className="h-10" />
      </div>
    </AppShell>
  );
}

function AnalyticsStat({
  label,
  value,
  unit,
}: {
  label: string;
  value: string;
  unit: string;
}) {
  return (
    <div className="mt-card rounded-[22px] p-4">
      <p className="text-[13px] font-bold leading-5 text-[var(--mt-ink-2)]">
        {label}
      </p>
      <p className="mt-4 text-[32px] font-black leading-[0.95] tracking-[-0.04em] text-[var(--mt-ink)]">
        {value}
      </p>
      <p className="mt-2 text-[12px] font-bold text-[var(--mt-ink-2)]">
        {unit}
      </p>
    </div>
  );
}

function MacroSummary({
  label,
  value,
  percent,
}: {
  label: string;
  value: string;
  percent: number;
}) {
  return (
    <div>
      <div className="mb-2 flex items-end justify-between gap-2">
        <p className="text-[13px] font-bold text-white/54">{label}</p>
        <p className="text-right text-[14px] font-black text-white">{value}</p>
      </div>
      <div className="h-[8px] overflow-hidden rounded-full bg-white/12">
        <div
          className="h-full rounded-full bg-white"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

function MacroDonut({
  proteinShare,
  carbsShare,
  fatShare,
  averageCalories,
}: {
  proteinShare: number;
  carbsShare: number;
  fatShare: number;
  averageCalories: number;
}) {
  const radius = 50;
  const circumference = 2 * Math.PI * radius;

  const proteinLength = (proteinShare / 100) * circumference;
  const carbsLength = (carbsShare / 100) * circumference;
  const fatLength = (fatShare / 100) * circumference;

  return (
    <div className="relative h-[128px] w-[128px] shrink-0">
      <svg className="-rotate-90" width="128" height="128" viewBox="0 0 128 128">
        <circle
          cx="64"
          cy="64"
          r={radius}
          fill="none"
          stroke="var(--mt-bg-warm)"
          strokeWidth="16"
        />
        <circle
          cx="64"
          cy="64"
          r={radius}
          fill="none"
          stroke="var(--mt-prot)"
          strokeWidth="16"
          strokeDasharray={`${proteinLength} ${circumference - proteinLength}`}
          strokeDashoffset="0"
        />
        <circle
          cx="64"
          cy="64"
          r={radius}
          fill="none"
          stroke="var(--mt-carb)"
          strokeWidth="16"
          strokeDasharray={`${carbsLength} ${circumference - carbsLength}`}
          strokeDashoffset={-proteinLength}
        />
        <circle
          cx="64"
          cy="64"
          r={radius}
          fill="none"
          stroke="var(--mt-fat)"
          strokeWidth="16"
          strokeDasharray={`${fatLength} ${circumference - fatLength}`}
          strokeDashoffset={-(proteinLength + carbsLength)}
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <p className="mt-display text-[24px] font-semibold tracking-[-0.03em] text-[var(--mt-ink)]">
          {formatMacro(averageCalories, "")}
        </p>
        <p className="text-[10px] font-bold text-[var(--mt-ink-3)]">
          kcal moy.
        </p>
      </div>
    </div>
  );
}

function LegendRow({
  color,
  label,
  value,
}: {
  color: string;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span
        className="h-3 w-3 rounded-[4px]"
        style={{ backgroundColor: color }}
      />
      <span className="flex-1 text-[13px] font-bold text-[var(--mt-ink-2)]">
        {label}
      </span>
      <span className="text-[13px] font-black text-[var(--mt-ink)]">
        {value}
      </span>
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

function LightIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z" />
      <path d="M9 21h6" />
    </svg>
  );
}