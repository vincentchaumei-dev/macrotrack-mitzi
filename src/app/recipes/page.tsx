"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { useNutritionStore } from "@/hooks/useNutritionStore";
import {
  calculateMealTotals,
  formatMacro,
  mealTypeLabels,
  todayLocalDate,
} from "@/lib/nutrition";

export default function RecipesPage() {
  const {
    mealTemplates,
    addTemplateAsMeal,
    deleteMealTemplate,
  } = useNutritionStore();

  const [date, setDate] = useState(todayLocalDate());
  const [message, setMessage] = useState("");

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

  return (
    <AppShell>
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-medium text-[#E85A0C]">Réutilisable</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            Repas types
          </h1>
          <p className="mt-2 max-w-2xl text-gray-500">
            Sauvegarde des repas fréquents depuis le journal, puis réutilise-les
            en un clic.
          </p>
        </div>

        <div>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-gray-700">
              Ajouter à la date
            </span>
            <input
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              className="input max-w-44"
            />
          </label>
        </div>
      </div>

      {message && (
        <div className="mb-5 rounded-2xl bg-green-50 p-4 text-sm text-green-800">
          {message}
        </div>
      )}

      <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5">
        <h2 className="text-xl font-semibold">Mes repas types</h2>
        <p className="mt-1 text-sm text-gray-500">
          {mealTemplates.length} repas type(s) enregistré(s).
        </p>

        <div className="mt-6 space-y-4">
          {mealTemplates.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-black/10 bg-[#FAFAF8] p-8 text-center">
              <p className="font-medium">Aucun repas type pour le moment</p>
              <p className="mt-1 text-sm text-gray-500">
                Va dans le Journal, puis clique sur “Repas type” sur un repas
                déjà enregistré.
              </p>
            </div>
          ) : (
            mealTemplates.map((template) => {
              const totals = calculateMealTotals({
                id: template.id,
                date,
                type: template.type,
                name: template.name,
                items: template.items,
                createdAt: template.createdAt,
                updatedAt: template.updatedAt,
              });

              return (
                <div
                  key={template.id}
                  className="rounded-2xl border border-black/5 bg-[#FAFAF8] p-5"
                >
                  <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                    <div>
                      <h3 className="font-semibold">{template.name}</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        {mealTypeLabels[template.type]} ·{" "}
                        {template.items.length} aliment(s)
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2 md:justify-end">
                      <button
                        onClick={() => handleAddTemplate(template.id)}
                        className="rounded-full bg-[#10121A] px-4 py-2 text-sm font-medium text-white"
                      >
                        Ajouter au journal
                      </button>

                      <button
                        onClick={() => deleteMealTemplate(template.id)}
                        className="rounded-full border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700"
                      >
                        Supprimer
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-4">
                    <MiniStat
                      label="Calories"
                      value={formatMacro(totals.calories, " kcal")}
                    />
                    <MiniStat
                      label="Protéines"
                      value={formatMacro(totals.proteinG, " g")}
                    />
                    <MiniStat
                      label="Glucides"
                      value={formatMacro(totals.carbsG, " g")}
                    />
                    <MiniStat
                      label="Lipides"
                      value={formatMacro(totals.fatG, " g")}
                    />
                  </div>

                  <div className="mt-4 space-y-2">
                    {template.items.map((item) => (
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

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </div>
  );
}