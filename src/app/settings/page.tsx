"use client";

import { ChangeEvent, useRef, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { useConfirm } from "@/components/ui/ConfirmProvider";
import { useTheme, type Theme } from "@/components/ui/ThemeProvider";
import { useNutritionStore } from "@/hooks/useNutritionStore";
import { AppData } from "@/types/nutrition";

function downloadJson(data: AppData) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  const date = new Date().toISOString().slice(0, 10);

  link.href = url;
  link.download = `macrotrack-sauvegarde-${date}.json`;
  link.click();

  URL.revokeObjectURL(url);
}

export default function SettingsPage() {
  const confirm = useConfirm();

  const {
    foods,
    meals,
    mealTemplates,
    weightLogs,
    exportData,
    importData,
    resetData,
    setOnboardingCompleted,
    syncEssentialFoods,
  } = useNutritionStore();

  const { theme, setTheme } = useTheme();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [message, setMessage] = useState("");

  function notify(text: string) {
    setMessage(text);
    window.setTimeout(() => setMessage(""), 2600);
  }

  function handleExport() {
    const data = exportData();
    downloadJson(data);
    notify("Sauvegarde exportée.");
  }

  async function handleImport(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as Partial<AppData>;

      const confirmed = await confirm({
        title: "Importer cette sauvegarde ?",
        message:
          "Les données actuelles seront remplacées par le contenu du fichier importé. Pense à exporter une sauvegarde avant si tu veux garder l’état actuel.",
        confirmLabel: "Importer",
        cancelLabel: "Annuler",
        tone: "danger",
      });

      if (!confirmed) return;

      importData(parsed);
      notify("Sauvegarde importée.");
    } catch {
      notify("Impossible d’importer ce fichier.");
    } finally {
      event.target.value = "";
    }
  }

  async function handleSyncEssentialFoods() {
    const confirmed = await confirm({
      title: "Mettre à jour les essentiels ?",
      message:
        "Les aliments essentiels seront mis à jour dans la base alimentaire. Les repas déjà enregistrés dans le journal garderont leurs valeurs historiques.",
      confirmLabel: "Mettre à jour",
      cancelLabel: "Annuler",
      tone: "default",
    });

    if (!confirmed) return;

    syncEssentialFoods();
    notify("Aliments essentiels mis à jour.");
  }

  async function handleReset() {
    const firstConfirm = await confirm({
      title: "Réinitialiser toutes les données ?",
      message:
        "Cette action supprimera les repas, aliments ajoutés, objectifs, repas types personnels et pesées stockés localement.",
      confirmLabel: "Continuer",
      cancelLabel: "Annuler",
      tone: "danger",
    });

    if (!firstConfirm) return;

    const secondConfirm = await confirm({
      title: "Dernière confirmation",
      message:
        "Cette action est irréversible si tu n’as pas exporté une sauvegarde. Tu veux vraiment repartir de zéro ?",
      confirmLabel: "Tout réinitialiser",
      cancelLabel: "Annuler",
      tone: "danger",
    });

    if (!secondConfirm) return;

    resetData();
    notify("Données réinitialisées.");
  }

  async function handleRestartOnboarding() {
    const confirmed = await confirm({
      title: "Relancer la configuration ?",
      message:
        "La configuration guidée va se rouvrir. Les repas, aliments, pesées et sauvegardes locales ne seront pas supprimés.",
      confirmLabel: "Relancer",
      cancelLabel: "Annuler",
      tone: "default",
    });

    if (!confirmed) return;

    setOnboardingCompleted(false);
    window.location.href = "/onboarding";
  }

  return (
    <AppShell>
      <div className="space-y-5">
        {message && <div className="mt-dashboard-toast">{message}</div>}

        <section className="pt-2">
          <p className="text-[12px] font-black uppercase tracking-[0.18em] text-[var(--mt-rouge)]">
            Paramètres
          </p>

          <div className="mt-3 flex items-start justify-between gap-4">
            <div>
              <h1 className="mt-display text-[50px] font-semibold leading-[0.9] tracking-[-0.055em] text-[var(--mt-ink)]">
                Réglages
              </h1>

              <p className="mt-4 max-w-[310px] text-[15px] leading-7 text-[var(--mt-ink-2)]">
                Gère les données, la sauvegarde et la configuration de l’app.
              </p>
            </div>

            <div className="shrink-0 rounded-[24px] bg-gradient-to-br from-[var(--mt-rouge-lit)] via-[var(--mt-rouge)] to-[var(--mt-rouge-deep)] p-4 text-white shadow-[var(--mt-shadow-red)]">
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-white/62">
                App
              </p>
              <p className="mt-display mt-2 text-[34px] font-semibold leading-none tracking-[-0.05em]">
                v1
              </p>
              <p className="mt-1 text-[10px] font-black uppercase text-white/62">
                perso
              </p>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-4 gap-2">
          <SettingsMiniStat label="Aliments" value={`${foods.length}`} />
          <SettingsMiniStat label="Repas" value={`${meals.length}`} />
          <SettingsMiniStat label="Types" value={`${mealTemplates.length}`} />
          <SettingsMiniStat label="Pesées" value={`${weightLogs.length}`} />
        </section>

        {/* ---- Thème ---- */}
        <section className="mt-card rounded-[28px] p-5">
          <SectionHead
            kicker="Apparence"
            title="Thème"
            text="Clair pour la journée, sombre le soir. Auto suit les réglages de ton téléphone."
          />

          <div className="mt-5 rounded-full bg-[var(--mt-card-soft)] p-1 ring-1 ring-[var(--mt-line)]">
            <div className="grid grid-cols-3">
              {(
                [
                  { value: "light", label: "☀️ Clair" },
                  { value: "dark",  label: "🌙 Sombre" },
                  { value: "system", label: "Auto" },
                ] as { value: Theme; label: string }[]
              ).map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setTheme(opt.value)}
                  className={`rounded-full py-2.5 text-[13px] font-black transition-colors ${
                    theme === opt.value
                      ? "bg-[var(--mt-ink)] text-[var(--mt-bg)]"
                      : "text-[var(--mt-ink-2)]"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-card overflow-hidden rounded-[28px]">
          <div className="bg-gradient-to-br from-[var(--mt-rouge-lit)] via-[var(--mt-rouge)] to-[var(--mt-rouge-deep)] p-5 text-white">
            <p className="text-[12px] font-black uppercase tracking-[0.18em] text-white/62">
              Sauvegarde
            </p>

            <h2 className="mt-display mt-2 text-[34px] font-semibold leading-none tracking-[-0.04em]">
              Tes données restent à toi.
            </h2>

            <p className="mt-4 text-[14px] leading-7 text-white/78">
              L’app fonctionne en stockage local. Pense à exporter une sauvegarde
              de temps en temps pour éviter toute perte.
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              <span className="rounded-full bg-white/16 px-3 py-1.5 text-[11px] font-black text-white backdrop-blur">
                LocalStorage
              </span>
              <span className="rounded-full bg-white/16 px-3 py-1.5 text-[11px] font-black text-white backdrop-blur">
                Export JSON
              </span>
            </div>
          </div>
        </section>

        <section className="mt-card rounded-[28px] p-5">
          <SectionHead
            kicker="Données"
            title="Sauvegarder"
            text="Exporte une copie complète des aliments, repas, objectifs, repas types et pesées."
          />

          <div className="mt-5 grid gap-2">
            <button type="button" onClick={handleExport} className="mt-btn-primary">
              Exporter mes données
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="SettingsNeutralButton"
            >
              Importer une sauvegarde
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              onChange={handleImport}
              className="hidden"
            />
          </div>
        </section>

        <section className="mt-card rounded-[28px] p-5">
          <SectionHead
            kicker="Base alimentaire"
            title="Mettre à jour les essentiels"
            text="Ajoute les nouveaux aliments de base et met à jour les noms ou portions de référence. Le journal déjà enregistré ne sera pas recalculé."
          />

          <button
            type="button"
            onClick={handleSyncEssentialFoods}
            className="SettingsSoftButton mt-5"
          >
            Mettre à jour les aliments essentiels
          </button>
        </section>

        <section className="mt-card rounded-[28px] p-5">
          <SectionHead
            kicker="Configuration"
            title="Reprendre le départ"
            text="Relance la configuration guidée pour modifier le profil, l’objectif et les bases de départ."
          />

          <button
            type="button"
            onClick={handleRestartOnboarding}
            className="SettingsSoftButton mt-5"
          >
            Relancer la configuration guidée
          </button>
        </section>

        <section className="rounded-[28px] border border-[var(--mt-rouge-soft)] bg-[var(--mt-rouge-wash)] p-5">
          <SectionHead
            kicker="Zone sensible"
            title="Réinitialiser"
            text="Supprime toutes les données locales. À utiliser uniquement si tu veux repartir de zéro."
          />

          <button
            type="button"
            onClick={handleReset}
            className="SettingsDangerButton mt-5"
          >
            Réinitialiser toutes les données
          </button>
        </section>

        <section className="mt-insight">
          <div className="mt-insight-icon">
            <LightIcon />
          </div>
          <p>
            Pour une app personnelle fiable, le plus important est de garder une
            sauvegarde régulière. L’export est là pour ça.
          </p>
        </section>

        <div className="h-10" />
      </div>
    </AppShell>
  );
}

function SectionHead({
  kicker,
  title,
  text,
}: {
  kicker: string;
  title: string;
  text: string;
}) {
  return (
    <div>
      <p className="text-[12px] font-black uppercase tracking-[0.18em] text-[var(--mt-rouge)]">
        {kicker}
      </p>
      <h2 className="mt-display mt-1 text-[26px] font-semibold tracking-[-0.03em] text-[var(--mt-ink)]">
        {title}
      </h2>
      <p className="mt-2 text-[13px] leading-6 text-[var(--mt-ink-2)]">
        {text}
      </p>
    </div>
  );
}

function SettingsMiniStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[18px] bg-white p-3 shadow-[var(--mt-shadow-sm)] ring-1 ring-[var(--mt-line)]">
      <p className="text-[10px] font-black uppercase text-[var(--mt-ink-3)]">
        {label}
      </p>
      <p className="mt-2 text-[20px] font-black leading-none tracking-[-0.04em] text-[var(--mt-ink)]">
        {value}
      </p>
    </div>
  );
}

function LightIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z" />
      <path d="M9 21h6" />
    </svg>
  );
}