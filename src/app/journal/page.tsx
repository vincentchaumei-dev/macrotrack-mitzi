"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { useNutritionStore } from "@/hooks/useNutritionStore";
import {
  calculateDayTotals,
  formatDateFr,
  formatMacro,
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

function shiftDate(date: string, offsetDays: number) {
  const nextDate = new Date(`${date}T12:00:00`);
  nextDate.setDate(nextDate.getDate() + offsetDays);
  return nextDate.toISOString().slice(0, 10);
}

function getMealColor(index: number) {
  const colors = ["#F2C94C", "#94B857", "#E8455F", "#6E7CA6", "#D69B3F"];
  return colors[index % colors.length];
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
  const proteinPercent = getPercent(protein, goals.proteinG);
  const carbsPercent = getPercent(carbs, goals.carbsG);
  const fatPercent = getPercent(fat, goals.fatG);

  function notify(text: string) {
    setMessage(text);
    window.setTimeout(() => setMessage(""), 2400);
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
    const sourceDate = shiftDate(date, -1);
    const copiedCount = copyDay(sourceDate, date);

    if (copiedCount === 0) {
      notify("Aucun repas à copier depuis la veille.");
      return;
    }

    notify(`${copiedCount} repas copié(s) depuis la veille.`);
  }

  return (
    <AppShell>
      <div className="space-y-5">
        <section className="pt-2">
          <p className="text-[12px] font-black uppercase tracking-[0.18em] text-[var(--mt-rouge)]">
            Suivi quotidien
          </p>

          <div className="mt-3 flex items-start justify-between gap-4">
            <div>
              <h1 className="mt-display text-[52px] font-semibold leading-[0.9] tracking-[-0.055em] text-[var(--mt-ink)]">
                Journal
              </h1>
              <p className="mt-4 max-w-[260px] text-[15px] leading-7 text-[var(--mt-ink-2)]">
                Les repas de la journée, simplement regroupés et faciles à
                ajuster.
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

        {message && (
          <div className="rounded-[18px] border border-[var(--mt-success-soft)] bg-[var(--mt-success-soft)] px-4 py-3 text-[13px] font-extrabold text-[var(--mt-success)]">
            {message}
          </div>
        )}

        <section className="mt-card overflow-hidden rounded-[28px]">
          <div className="bg-gradient-to-br from-[var(--mt-rouge-lit)] via-[var(--mt-rouge)] to-[var(--mt-rouge-deep)] p-5 text-white">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[12px] font-black uppercase tracking-[0.18em] text-white/68">
                  {formatDateFr(date)}
                </p>
                <h2 className="mt-display mt-2 text-[34px] font-semibold leading-none tracking-[-0.04em]">
                  {meals.length === 0
                    ? "Journée vide"
                    : `${meals.length} repas`}
                </h2>
              </div>

              <div className="rounded-full bg-white/18 px-3 py-2 text-center backdrop-blur">
                <p className="text-[22px] font-black leading-none">
                  {caloriePercent}%
                </p>
                <p className="mt-1 text-[9px] font-black uppercase text-white/66">
                  calories
                </p>
              </div>
            </div>

            <div className="mt-6">
              <div className="flex items-end gap-2">
                <p className="mt-display text-[56px] font-semibold leading-[0.82] tracking-[-0.06em]">
                  {calories}
                </p>
                <p className="mb-1 text-[15px] font-bold text-white/72">
                  / {goals.calories} kcal
                </p>
              </div>

              <div className="mt-4 h-[9px] overflow-hidden rounded-full bg-white/22">
                <div
                  className="h-full rounded-full bg-white shadow-[0_0_14px_rgba(255,255,255,0.5)]"
                  style={{ width: `${caloriePercent}%` }}
                />
              </div>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-2">
              <MacroGlass
                label="Prot."
                value={protein}
                target={goals.proteinG}
                percent={proteinPercent}
              />
              <MacroGlass
                label="Gluc."
                value={carbs}
                target={goals.carbsG}
                percent={carbsPercent}
              />
              <MacroGlass
                label="Lip."
                value={fat}
                target={goals.fatG}
                percent={fatPercent}
              />
            </div>
          </div>
        </section>

        <section className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => setDate(shiftDate(date, -1))}
            className="rounded-[18px] bg-white px-3 py-3 text-[12px] font-black text-[var(--mt-ink)] shadow-[var(--mt-shadow-sm)] ring-1 ring-[var(--mt-line)]"
          >
            ← Veille
          </button>

          <button
            type="button"
            onClick={() => setDate(todayLocalDate())}
            className="rounded-[18px] bg-[var(--mt-rouge-wash)] px-3 py-3 text-[12px] font-black text-[var(--mt-rouge-deep)] ring-1 ring-[var(--mt-rouge-soft)]"
          >
            Aujourd’hui
          </button>

          <button
            type="button"
            onClick={() => setDate(shiftDate(date, 1))}
            className="rounded-[18px] bg-white px-3 py-3 text-[12px] font-black text-[var(--mt-ink)] shadow-[var(--mt-shadow-sm)] ring-1 ring-[var(--mt-line)]"
          >
            Demain →
          </button>
        </section>

        <section className="mt-card rounded-[28px] p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="mt-display text-[24px] font-semibold tracking-[-0.03em] text-[var(--mt-ink)]">
                Repas du jour
              </h2>
              <p className="mt-1 text-[13px] leading-5 text-[var(--mt-ink-2)]">
                Timeline de la journée.
              </p>
            </div>

            <Link
              href="/add"
              className="rounded-full bg-[var(--mt-rouge)] px-4 py-2 text-[12px] font-black text-white shadow-[var(--mt-shadow-red)]"
            >
              Ajouter
            </Link>
          </div>

          <div className="mt-5">
            {meals.length === 0 ? (
              <div className="rounded-[22px] border border-dashed border-[var(--mt-line-2)] bg-[var(--mt-card-soft)] p-5 text-center">
                <p className="mt-display text-[21px] font-semibold text-[var(--mt-ink)]">
                  Aucun repas
                </p>
                <p className="mt-2 text-[13px] leading-6 text-[var(--mt-ink-2)]">
                  Ajoute un repas, utilise un repas type ou copie la veille.
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
              <div className="relative space-y-3">
                <div className="absolute bottom-5 left-[23px] top-5 w-px bg-[var(--mt-line-2)]" />

                {meals.map((meal, index) => (
                  <MealTimelineCard
                    key={meal.id}
                    meal={meal}
                    index={index}
                    onDuplicate={() => handleDuplicateMeal(meal)}
                    onSaveAsTemplate={() => handleSaveAsTemplate(meal)}
                    onDelete={() => handleDeleteMeal(meal)}
                  />
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="mt-card rounded-[28px] p-5">
          <p className="text-[12px] font-black uppercase tracking-[0.18em] text-[var(--mt-rouge)]">
            Actions rapides
          </p>

          <div className="mt-4 grid gap-2">
            <Link href="/add" className="JournalAction">
              <span>Ajouter un repas</span>
              <span>→</span>
            </Link>

            <Link href="/recipes" className="JournalAction">
              <span>Utiliser un repas type</span>
              <span>→</span>
            </Link>

            <button
              type="button"
              onClick={handleCopyYesterday}
              className="JournalAction text-left"
            >
              <span>Copier la veille</span>
              <span>→</span>
            </button>
          </div>
        </section>

        <div className="h-10" />
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
    <div className="rounded-[18px] border border-white/18 bg-white/14 p-3 backdrop-blur">
      <p className="text-[10.5px] font-bold text-white/72">{label}</p>
      <p className="mt-1 font-[var(--mt-display)] text-[20px] font-semibold leading-none">
        {value}
        <span className="font-[var(--mt-sans)] text-[10px] text-white/60">
          /{target}
        </span>
      </p>
      <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/22">
        <div
          className="h-full rounded-full bg-white"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

function MealTimelineCard({
  meal,
  index,
  onDuplicate,
  onSaveAsTemplate,
  onDelete,
}: {
  meal: Meal;
  index: number;
  onDuplicate: () => void;
  onSaveAsTemplate: () => void;
  onDelete: () => void;
}) {
  const totals = calculateDayTotals([meal]);
  const color = getMealColor(index);

  return (
    <article className="relative flex gap-3">
      <div
        className="relative z-10 mt-4 h-12 w-12 shrink-0 rounded-[16px] shadow-[var(--mt-shadow-sm)]"
        style={{ background: color }}
      />

      <div className="min-w-0 flex-1 rounded-[22px] border border-[var(--mt-line)] bg-white p-4 shadow-[var(--mt-shadow)]">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-black uppercase tracking-[0.12em] text-[var(--mt-rouge)]">
              {mealTypeLabels[meal.type]}
            </p>
            <h3 className="mt-1 truncate text-[17px] font-black tracking-[-0.02em] text-[var(--mt-ink)]">
              {meal.name || mealTypeLabels[meal.type]}
            </h3>
            <p className="mt-1 text-[12px] font-bold text-[var(--mt-ink-3)]">
              {meal.items.length} aliment(s)
            </p>
          </div>

          <div className="text-right">
            <p className="mt-display text-[26px] font-semibold leading-none tracking-[-0.03em] text-[var(--mt-ink)]">
              {formatMacro(totals.calories, "")}
            </p>
            <p className="mt-1 text-[9px] font-black uppercase tracking-[0.08em] text-[var(--mt-ink-3)]">
              kcal
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2 text-[12px] font-bold text-[var(--mt-ink-2)]">
          <span>
            <b className="text-[var(--mt-ink)]">
              {formatMacro(totals.proteinG, "g")}
            </b>{" "}
            P
          </span>
          <span>
            <b className="text-[var(--mt-ink)]">
              {formatMacro(totals.carbsG, "g")}
            </b>{" "}
            G
          </span>
          <span>
            <b className="text-[var(--mt-ink)]">
              {formatMacro(totals.fatG, "g")}
            </b>{" "}
            L
          </span>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onDuplicate}
            className="rounded-full bg-[var(--mt-card-soft)] px-3 py-2 text-[11px] font-black text-[var(--mt-ink)] ring-1 ring-[var(--mt-line)]"
          >
            Dupliquer
          </button>

          <button
            type="button"
            onClick={onSaveAsTemplate}
            className="rounded-full bg-[var(--mt-rouge-wash)] px-3 py-2 text-[11px] font-black text-[var(--mt-rouge-deep)] ring-1 ring-[var(--mt-rouge-soft)]"
          >
            En type
          </button>

          <button
            type="button"
            onClick={onDelete}
            className="rounded-full bg-white px-3 py-2 text-[11px] font-black text-[var(--mt-rouge-deep)] ring-1 ring-[var(--mt-rouge-soft)]"
          >
            Supprimer
          </button>
        </div>
      </div>
    </article>
  );
}