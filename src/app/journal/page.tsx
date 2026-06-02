"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { useConfirm } from "@/components/ui/ConfirmProvider";
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
  const confirm = useConfirm();

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
    window.setTimeout(() => setMessage(""), 2400);
  }

  async function handleDeleteMeal(meal: Meal) {
    const mealName = meal.name || mealTypeLabels[meal.type];

    const confirmed = await confirm({
      title: "Supprimer ce repas ?",
      message: `"${mealName}" sera retiré du journal. Cette action ne modifie pas les aliments enregistrés.`,
      confirmLabel: "Supprimer",
      cancelLabel: "Annuler",
      tone: "danger",
    });

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
        {message && (
          <div className="mt-dashboard-toast">{message}</div>
        )}

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

        <section className="mt-card overflow-hidden rounded-[28px]">
          <div className="mt-red-card bg-gradient-to-br from-[var(--mt-rouge-lit)] via-[var(--mt-rouge)] to-[var(--mt-rouge-deep)] p-5 text-white">
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

            <div className="mt-5 space-y-3">
              <JournalMacroRow label="Protéines" value={protein} target={goals.proteinG} color="#ffb3c6" />
              <JournalMacroRow label="Glucides" value={carbs} target={goals.carbsG} color="#ffd882" />
              <JournalMacroRow label="Lipides" value={fat} target={goals.fatG} color="#b4c8f0" />
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

function JournalMacroRow({
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
  const pct = target > 0 ? Math.min(100, Math.round((value / target) * 100)) : 0;
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-[10.5px] font-bold text-white/55">{label}</span>
        <span className="text-[11px] font-black text-white/80">
          {value}
          <span className="text-white/40 font-semibold">/{target}g</span>
        </span>
      </div>
      <div className="overflow-hidden rounded-full" style={{ height: 5, backgroundColor: "rgba(255,255,255,0.18)" }}>
        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

function MealMacroPill({
  color,
  label,
  value,
}: {
  color: string;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-1.5 rounded-full bg-[var(--mt-card-soft)] px-2.5 py-1 ring-1 ring-[var(--mt-line)]">
      <span className="h-[7px] w-[7px] shrink-0 rounded-full" style={{ backgroundColor: color }} />
      <span className="text-[10.5px] font-black text-[var(--mt-ink-2)]">{label} {value}</span>
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
        aria-hidden="true"
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

        <div className="mt-3 flex gap-1.5">
          <MealMacroPill color="#c53350" label="P" value={`${formatMacro(totals.proteinG, "")}g`} />
          <MealMacroPill color="#d69b3f" label="G" value={`${formatMacro(totals.carbsG, "")}g`} />
          <MealMacroPill color="#6e7ca6" label="L" value={`${formatMacro(totals.fatG, "")}g`} />
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