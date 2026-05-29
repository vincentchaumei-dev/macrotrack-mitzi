"use client";

import { useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { useNutritionStore } from "@/hooks/useNutritionStore";
import {
  addDays,
  calculateDayTotals,
  calculateMealTotals,
  formatDateFr,
  formatMacro,
  mealTypeLabels,
  todayLocalDate,
} from "@/lib/nutrition";

export default function JournalPage() {
  const {
    getMealsByDate,
    deleteMeal,
    duplicateMeal,
    copyDay,
    saveMealAsTemplate,
  } = useNutritionStore();

  const [date, setDate] = useState(todayLocalDate());
  const [message, setMessage] = useState("");

  const meals = getMealsByDate(date);
  const totals = calculateDayTotals(meals);

  function notify(text: string) {
    setMessage(text);
    window.setTimeout(() => setMessage(""), 2500);
  }

  function handleCopyPreviousDay() {
    const previousDate = addDays(date, -1);
    const copiedCount = copyDay(previousDate, date);

    if (copiedCount === 0) {
      notify("Aucun repas trouvé sur la journée précédente.");
      return;
    }

    notify(`${copiedCount} repas copié(s) depuis la veille.`);
  }

  function handleDuplicateMeal(mealId: string) {
    const duplicated = duplicateMeal(mealId, date);

    if (!duplicated) {
      notify("Impossible de dupliquer ce repas.");
      return;
    }

    notify("Repas dupliqué sur cette journée.");
  }

  function handleSaveTemplate(mealId: string) {
    const template = saveMealAsTemplate(mealId);

    if (!template) {
      notify("Impossible de sauvegarder ce repas type.");
      return;
    }

    notify("Repas sauvegardé comme repas type.");
  }

  return (
    <AppShell>
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-medium text-[#E85A0C]">Journal</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            {formatDateFr(date)}
          </h1>
          <p className="mt-2 text-gray-500">
            Consulte, copie et réutilise les repas par journée.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setDate(addDays(date, -1))}
            className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm"
          >
            Précédent
          </button>

          <input
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className="input max-w-40"
          />

          <button
            onClick={() => setDate(addDays(date, 1))}
            className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm"
          >
            Suivant
          </button>
        </div>
      </div>

      <section className="mb-5 flex flex-wrap gap-3">
        <Link
          href="/add"
          className="rounded-full bg-[#10121A] px-4 py-2 text-sm font-medium text-white"
        >
          Ajouter un repas
        </Link>

        <button
          onClick={handleCopyPreviousDay}
          className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-black/5"
        >
          Copier la veille
        </button>
      </section>

      {message && (
        <div className="mb-5 rounded-2xl bg-green-50 p-4 text-sm text-green-800">
          {message}
        </div>
      )}

      <section className="grid gap-4 md:grid-cols-4">
        <Summary label="Calories" value={formatMacro(totals.calories, " kcal")} />
        <Summary label="Protéines" value={formatMacro(totals.proteinG, " g")} />
        <Summary label="Glucides" value={formatMacro(totals.carbsG, " g")} />
        <Summary label="Lipides" value={formatMacro(totals.fatG, " g")} />
      </section>

      <section className="mt-8 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5">
        <h2 className="text-xl font-semibold">Repas</h2>

        <div className="mt-5 space-y-4">
          {meals.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-black/10 bg-[#FAFAF8] p-8 text-center text-gray-500">
              Aucun repas enregistré sur cette journée.
            </div>
          ) : (
            meals.map((meal) => {
              const mealTotals = calculateMealTotals(meal);

              return (
                <div
                  key={meal.id}
                  className="rounded-2xl border border-black/5 bg-[#FAFAF8] p-5"
                >
                  <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                    <div>
                      <h3 className="font-semibold">
                        {meal.name || mealTypeLabels[meal.type]}
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">
                        {meal.items.length} aliment(s)
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2 md:justify-end">
                      <button
                        onClick={() => handleDuplicateMeal(meal.id)}
                        className="rounded-full border border-black/10 bg-white px-3 py-1.5 text-xs text-gray-600 hover:bg-black/5"
                      >
                        Dupliquer
                      </button>

                      <button
                        onClick={() => handleSaveTemplate(meal.id)}
                        className="rounded-full border border-black/10 bg-white px-3 py-1.5 text-xs text-gray-600 hover:bg-black/5"
                      >
                        Repas type
                      </button>

                      <button
                        onClick={() => deleteMeal(meal.id)}
                        className="rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs text-red-700"
                      >
                        Supprimer
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-4">
                    <Summary
                      label="Calories"
                      value={formatMacro(mealTotals.calories, " kcal")}
                    />
                    <Summary
                      label="Protéines"
                      value={formatMacro(mealTotals.proteinG, " g")}
                    />
                    <Summary
                      label="Glucides"
                      value={formatMacro(mealTotals.carbsG, " g")}
                    />
                    <Summary
                      label="Lipides"
                      value={formatMacro(mealTotals.fatG, " g")}
                    />
                  </div>

                  <div className="mt-4 space-y-2">
                    {meal.items.map((item) => (
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
                </div>
              );
            })
          )}
        </div>
      </section>
    </AppShell>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-1 text-xl font-semibold">{value}</p>
    </div>
  );
}