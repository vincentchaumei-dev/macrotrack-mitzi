"use client";

import { ChangeEvent, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { useNutritionStore } from "@/hooks/useNutritionStore";
import { AppData } from "@/types/nutrition";

export default function SettingsPage() {
  const {
    resetData,
    exportData,
    importData,
    setOnboardingCompleted,
  } = useNutritionStore();

  const [message, setMessage] = useState("");

  function handleExport() {
    const data = exportData();

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `macrotrack-export-${new Date()
      .toISOString()
      .slice(0, 10)}.json`;

    link.click();
    URL.revokeObjectURL(url);

    setMessage("Export généré.");
  }

  function handleImport(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as Partial<AppData>;
        importData(parsed);
        setMessage("Import réussi.");
      } catch {
        setMessage("Le fichier importé n’est pas valide.");
      }
    };

    reader.readAsText(file);
  }

  function handleReset() {
    const confirmed = window.confirm(
      "Tu vas supprimer toutes les données locales de MacroTrack. Continuer ?"
    );

    if (!confirmed) return;

    resetData();
    setMessage("Données réinitialisées.");
  }

  function handleRestartOnboarding() {
    setOnboardingCompleted(false);
    window.location.href = "/onboarding";
  }

  return (
    <AppShell>
      <div className="mb-8">
        <p className="text-sm font-medium text-[#E85A0C]">Paramètres</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">
          Paramètres
        </h1>
        <p className="mt-2 text-gray-500">
          Gestion locale de tes données, sauvegardes et configuration.
        </p>
      </div>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5">
          <h2 className="text-xl font-semibold">Sauvegarde</h2>

          <p className="mt-2 text-sm text-gray-500">
            Tes données sont stockées localement dans ton navigateur. Exporte-les
            régulièrement pour éviter de les perdre.
          </p>

          <div className="mt-6 space-y-3">
            <button
              onClick={handleExport}
              className="w-full rounded-2xl bg-[#10121A] px-5 py-3 text-sm font-medium text-white"
            >
              Exporter mes données
            </button>

            <label className="block cursor-pointer rounded-2xl border border-black/10 bg-[#FAFAF8] px-5 py-3 text-center text-sm font-medium text-gray-700">
              Importer une sauvegarde JSON
              <input
                type="file"
                accept="application/json"
                onChange={handleImport}
                className="hidden"
              />
            </label>
          </div>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5">
          <h2 className="text-xl font-semibold">Configuration</h2>

          <p className="mt-2 text-sm text-gray-500">
            Relance le parcours guidé pour modifier le profil, l’objectif et les
            calories/macros proposées.
          </p>

          <button
            onClick={handleRestartOnboarding}
            className="mt-6 w-full rounded-2xl border border-black/10 bg-[#FAFAF8] px-5 py-3 text-sm font-medium text-gray-700"
          >
            Relancer la configuration guidée
          </button>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5 lg:col-span-2">
          <h2 className="text-xl font-semibold">Zone sensible</h2>

          <p className="mt-2 text-sm text-gray-500">
            Cette action remet l’application à zéro sur ce navigateur.
          </p>

          <button
            onClick={handleReset}
            className="mt-6 w-full rounded-2xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-medium text-red-700"
          >
            Réinitialiser les données locales
          </button>
        </div>
      </section>

      {message && (
        <p className="mt-6 rounded-2xl bg-green-50 p-4 text-sm text-green-800">
          {message}
        </p>
      )}
    </AppShell>
  );
}