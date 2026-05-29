"use client";

import { useMemo, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { useNutritionStore } from "@/hooks/useNutritionStore";
import {
  addDays,
  calculateDayTotals,
  formatMacro,
  todayLocalDate,
} from "@/lib/nutrition";

type Period = 7 | 14 | 30;

function average(values: number[]) {
  if (values.length === 0) return null;

  return Math.round(
    (values.reduce((total, value) => total + value, 0) / values.length) * 10
  ) / 10;
}

export default function AnalyticsPage() {
  const { getMealsByDate, weightLogs, goals } = useNutritionStore();
  const [period, setPeriod] = useState<Period>(7);

  const today = todayLocalDate();

  const days = useMemo(() => {
    return Array.from({ length: period }, (_, index) => {
      const date = addDays(today, -(period - 1 - index));
      const meals = getMealsByDate(date);
      const totals = calculateDayTotals(meals);

      return {
        date,
        mealsCount: meals.length,
        ...totals,
      };
    });
  }, [period, today, getMealsByDate]);

  const stats = useMemo(() => {
    const daysWithCalories = days.filter((day) => day.calories !== null);
    const calories = daysWithCalories.map((day) => day.calories as number);
    const proteins = days
      .filter((day) => day.proteinG !== null)
      .map((day) => day.proteinG as number);
    const carbs = days
      .filter((day) => day.carbsG !== null)
      .map((day) => day.carbsG as number);
    const fats = days
      .filter((day) => day.fatG !== null)
      .map((day) => day.fatG as number);

    const proteinGoalDays = days.filter(
      (day) => day.proteinG !== null && day.proteinG >= goals.proteinG
    ).length;

    return {
      loggedDays: daysWithCalories.length,
      avgCalories: average(calories),
      avgProtein: average(proteins),
      avgCarbs: average(carbs),
      avgFat: average(fats),
      proteinGoalDays,
      maxCalories: Math.max(...calories, 1),
    };
  }, [days, goals.proteinG]);

  const weightStats = useMemo(() => {
    const startDate = addDays(today, -period + 1);
    const logs = [...weightLogs]
      .filter((log) => log.date >= startDate && log.date <= today)
      .sort((a, b) => a.date.localeCompare(b.date));

    if (logs.length < 2) return null;

    const first = logs[0];
    const latest = logs[logs.length - 1];

    return {
      first: first.weightKg,
      latest: latest.weightKg,
      change: Math.round((latest.weightKg - first.weightKg) * 10) / 10,
      count: logs.length,
    };
  }, [weightLogs, today, period]);

  return (
    <AppShell>
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-medium text-[#E85A0C]">Analyse</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            Tendances nutritionnelles
          </h1>
          <p className="mt-2 text-gray-500">
            Moyennes calories, macros et évolution sur la période.
          </p>
        </div>

        <div className="flex rounded-full bg-white p-1 shadow-sm ring-1 ring-black/5">
          {[7, 14, 30].map((item) => (
            <button
              key={item}
              onClick={() => setPeriod(item as Period)}
              className={`rounded-full px-4 py-2 text-sm font-medium ${
                period === item ? "bg-[#10121A] text-white" : "text-gray-500"
              }`}
            >
              {item} jours
            </button>
          ))}
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-4">
        <Stat
          label="Moy. calories"
          value={formatMacro(stats.avgCalories, " kcal")}
        />
        <Stat
          label="Moy. protéines"
          value={formatMacro(stats.avgProtein, " g")}
        />
        <Stat label="Jours trackés" value={`${stats.loggedDays}/${period}`} />
        <Stat
          label="Objectif protéines"
          value={`${stats.proteinGoalDays}/${period} jours`}
        />
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5">
          <h2 className="text-xl font-semibold">Calories par jour</h2>
          <p className="mt-1 text-sm text-gray-500">
            Les journées sans données restent vides.
          </p>

          <div className="mt-6 space-y-3">
            {days.map((day) => {
              const width =
                day.calories === null
                  ? 0
                  : Math.min((day.calories / stats.maxCalories) * 100, 100);

              return (
                <div key={day.date}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="text-gray-500">{day.date}</span>
                    <span className="font-medium">
                      {day.calories === null ? "—" : `${day.calories} kcal`}
                    </span>
                  </div>
                  <div className="h-3 rounded-full bg-[#F7F4EF]">
                    <div
                      className="h-3 rounded-full bg-[#E85A0C]"
                      style={{ width: `${width}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <aside className="space-y-6">
          <div className="rounded-3xl bg-[#10121A] p-6 text-white shadow-sm">
            <p className="text-sm text-white/60">Résumé macros</p>

            <div className="mt-5 space-y-4">
              <MacroLine label="Calories" value={stats.avgCalories} target={goals.calories} suffix="kcal" />
              <MacroLine label="Protéines" value={stats.avgProtein} target={goals.proteinG} suffix="g" />
              <MacroLine label="Glucides" value={stats.avgCarbs} target={goals.carbsG} suffix="g" />
              <MacroLine label="Lipides" value={stats.avgFat} target={goals.fatG} suffix="g" />
            </div>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5">
            <p className="text-sm text-gray-500">Poids sur la période</p>
            <h2 className="mt-2 text-2xl font-semibold">
              {weightStats
                ? `${weightStats.change > 0 ? "+" : ""}${weightStats.change} kg`
                : "Pas assez de données"}
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              {weightStats
                ? `${weightStats.count} pesées · ${weightStats.first} kg → ${weightStats.latest} kg`
                : "Ajoute au moins deux pesées pour voir l’évolution."}
            </p>
          </div>
        </aside>
      </section>
    </AppShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  );
}

function MacroLine({
  label,
  value,
  target,
  suffix,
}: {
  label: string;
  value: number | null;
  target: number;
  suffix: string;
}) {
  const progress = value === null ? 0 : Math.min((value / target) * 100, 100);

  return (
    <div>
      <div className="mb-1 flex justify-between text-sm">
        <span className="text-white/60">{label}</span>
        <span>
          {value ?? "—"} {value !== null ? suffix : ""}
        </span>
      </div>
      <div className="h-2 rounded-full bg-white/10">
        <div
          className="h-2 rounded-full bg-white"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}