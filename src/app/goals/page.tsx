"use client";

import { FormEvent, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { useNutritionStore } from "@/hooks/useNutritionStore";

export default function GoalsPage() {
  const { goals, updateGoals } = useNutritionStore();

  const [calories, setCalories] = useState(String(goals.calories));
  const [protein, setProtein] = useState(String(goals.proteinG));
  const [carbs, setCarbs] = useState(String(goals.carbsG));
  const [fat, setFat] = useState(String(goals.fatG));
  const [saved, setSaved] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    updateGoals({
      calories: Number(calories) || 0,
      proteinG: Number(protein) || 0,
      carbsG: Number(carbs) || 0,
      fatG: Number(fat) || 0,
    });

    setSaved(true);

    window.setTimeout(() => setSaved(false), 2000);
  }

  return (
    <AppShell>
      <div className="mb-8">
        <p className="text-sm font-medium text-[#E85A0C]">Objectifs</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">
          Objectifs nutritionnels
        </h1>
        <p className="mt-2 text-gray-500">
          Définis tes cibles journalières pour suivre ta progression.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="max-w-2xl rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Calories">
            <input
              value={calories}
              onChange={(event) => setCalories(event.target.value)}
              className="input"
            />
          </Field>

          <Field label="Protéines en g">
            <input
              value={protein}
              onChange={(event) => setProtein(event.target.value)}
              className="input"
            />
          </Field>

          <Field label="Glucides en g">
            <input
              value={carbs}
              onChange={(event) => setCarbs(event.target.value)}
              className="input"
            />
          </Field>

          <Field label="Lipides en g">
            <input
              value={fat}
              onChange={(event) => setFat(event.target.value)}
              className="input"
            />
          </Field>
        </div>

        <button className="mt-6 rounded-2xl bg-[#10121A] px-5 py-3 text-sm font-medium text-white">
          Enregistrer les objectifs
        </button>

        {saved && (
          <p className="mt-4 rounded-2xl bg-green-50 p-3 text-sm text-green-800">
            Objectifs enregistrés.
          </p>
        )}
      </form>
    </AppShell>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-gray-700">
        {label}
      </span>
      {children}
    </label>
  );
}