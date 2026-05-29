"use client";

import { ChangeEvent, useRef, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
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
  const {
    foods,
    meals,
    mealTemplates,
    weightLogs,
    exportData,
    importData,
    resetData,
    setOnboardingCompleted,
  } = useNutritionStore();

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

      const confirmed = window.confirm(
        "Importer cette sauvegarde ? Les données actuelles seront remplacées."
      );

      if (!confirmed) return;

      importData(parsed);
      notify("Sauvegarde importée.");
    } catch {
      notify("Impossible d’importer ce fichier.");
    } finally {
      event.target.value = "";
    }
  }

  function handleReset() {
    const firstConfirm = window.confirm(
      "Réinitialiser toutes les données ? Cette action supprimera les repas, aliments ajoutés, objectifs et pesées."
    );

    if (!firstConfirm) return;

    const secondConfirm = window.confirm(
      "Dernière confirmation : cette action est irréversible si tu n’as pas exporté une sauvegarde."
    );

    if (!secondConfirm) return;

    resetData();
    notify("Données réinitialisées.");
  }

  function handleRestartOnboarding() {
    const confirmed = window.confirm(
      "Relancer la configuration guidée ? Les données ne seront pas supprimées."
    );

    if (!confirmed) return;

    setOnboardingCompleted(false);
    window.location.href = "/onboarding";
  }

  return (
    <AppShell>
      <div className="space-y-5">
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

        {message && (
          <div className="rounded-[18px] border border-[var(--mt-success-soft)] bg-[var(--mt-success-soft)] px-4 py-3 text-[13px] font-extrabold text-[var(--mt-success)]">
            {message}
          </div>
        )}

        <section className="grid grid-cols-4 gap-2">
          <SettingsMiniStat label="Aliments" value={`${foods.length}`} />
          <SettingsMiniStat label="Repas" value={`${meals.length}`} />
          <SettingsMiniStat label="Types" value={`${mealTemplates.length}`} />
          <SettingsMiniStat label="Pesées" value={`${weightLogs.length}`} />
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

        <section className="mt-card rounded-[28px] p-5">
          <SectionHead
            kicker="Stockage"
            title="Ce qu’il faut savoir"
            text="Cette première version ne nécessite pas de compte. Les données restent dans le navigateur utilisé."
          />

          <div className="mt-5 grid gap-3">
            <InfoRow
              title="Pas de compte utilisateur"
              text="Les données ne sont pas synchronisées entre plusieurs appareils."
            />

            <InfoRow
              title="Sauvegarde recommandée"
              text="Avant de changer de téléphone ou de navigateur, exporte les données."
            />

            <InfoRow
              title="Confidentialité"
              text="Les repas, objectifs et pesées restent stockés localement."
            />
          </div>
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

function InfoRow({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-[20px] bg-[var(--mt-card-soft)] p-4 ring-1 ring-[var(--mt-line)]">
      <p className="text-[14px] font-black text-[var(--mt-ink)]">{title}</p>
      <p className="mt-1 text-[13px] leading-6 text-[var(--mt-ink-2)]">
        {text}
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