"use client";

import { FormEvent, useMemo, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import {
  DangerButton,
  EmptyState,
  GhostButton,
  PageHeader,
  Pill,
  PremiumCard,
  SectionTitle,
  SoftButton,
  StatCard,
} from "@/components/ui/PremiumUI";
import { useNutritionStore } from "@/hooks/useNutritionStore";
import { todayLocalDate } from "@/lib/nutrition";
import { WeightLog } from "@/types/nutrition";

function parseNumber(value: string) {
  const parsed = Number(value.replace(",", "."));
  return Number.isNaN(parsed) ? 0 : parsed;
}

function formatWeight(value: number | null | undefined) {
  if (value === null || value === undefined) return "—";
  return `${Math.round(value * 10) / 10} kg`;
}

function formatDelta(value: number) {
  const rounded = Math.round(value * 10) / 10;

  if (rounded === 0) return "Stable";
  if (rounded > 0) return `+${rounded} kg`;
  return `${rounded} kg`;
}

function sortLogsAsc(logs: WeightLog[]) {
  return [...logs].sort((a, b) => a.date.localeCompare(b.date));
}

function sortLogsDesc(logs: WeightLog[]) {
  return [...logs].sort((a, b) => b.date.localeCompare(a.date));
}

function getLast7Logs(logs: WeightLog[]) {
  return sortLogsAsc(logs).slice(-7);
}

function getAverage(logs: WeightLog[]) {
  if (logs.length === 0) return null;

  const total = logs.reduce((sum, log) => sum + log.weightKg, 0);
  return Math.round((total / logs.length) * 10) / 10;
}

function getTrendLabel(delta: number | null) {
  if (delta === null) {
    return "Pas encore assez de données";
  }

  if (Math.abs(delta) < 0.2) {
    return "Tendance stable";
  }

  if (delta < 0) {
    return "Tendance à la baisse";
  }

  return "Tendance à la hausse";
}

function getTrendText(delta: number | null) {
  if (delta === null) {
    return "Ajoute quelques pesées pour voir une vraie tendance. Une seule mesure ne veut pas dire grand-chose.";
  }

  if (Math.abs(delta) < 0.2) {
    return "Le poids semble stable sur les dernières mesures. C’est souvent plus parlant que le chiffre d’un seul jour.";
  }

  if (delta < 0) {
    return "La tendance récente descend. À confirmer sur plusieurs jours, sans tirer de conclusion trop vite.";
  }

  return "La tendance récente monte. Ce n’est pas forcément négatif : cycle, digestion, sel, entraînement et eau peuvent jouer.";
}

export default function WeightPage() {
  const {
    profile,
    weightLogs,
    addWeightLog,
    deleteWeightLog,
    updateProfile,
  } = useNutritionStore();

  const [date, setDate] = useState(todayLocalDate());
  const [weightKg, setWeightKg] = useState(
    profile.currentWeightKg ? String(profile.currentWeightKg) : ""
  );
  const [message, setMessage] = useState("");

  const sortedLogsDesc = useMemo(() => sortLogsDesc(weightLogs), [weightLogs]);
  const sortedLogsAsc = useMemo(() => sortLogsAsc(weightLogs), [weightLogs]);
  const last7Logs = useMemo(() => getLast7Logs(weightLogs), [weightLogs]);

  const latestLog = sortedLogsDesc[0] ?? null;
  const previousLog = sortedLogsDesc[1] ?? null;

  const currentWeight = latestLog?.weightKg ?? profile.currentWeightKg;
  const previousWeight = previousLog?.weightKg ?? null;

  const deltaFromPrevious =
    latestLog && previousLog ? latestLog.weightKg - previousLog.weightKg : null;

  const firstLog = sortedLogsAsc[0] ?? null;
  const globalDelta = firstLog && latestLog ? latestLog.weightKg - firstLog.weightKg : null;

  const average7 = getAverage(last7Logs);

  function notify(text: string) {
    setMessage(text);
    window.setTimeout(() => setMessage(""), 2500);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const parsedWeight = parseNumber(weightKg);

    if (parsedWeight <= 0) {
      notify("Renseigne un poids valide.");
      return;
    }

    addWeightLog({
      date,
      weightKg: parsedWeight,
    });

    updateProfile({
      ...profile,
      currentWeightKg: parsedWeight,
    });

    notify("Pesée ajoutée.");
  }

  function handleDelete(log: WeightLog) {
    const confirmed = window.confirm(
      `Supprimer la pesée du ${log.date} (${log.weightKg} kg) ?`
    );

    if (!confirmed) return;

    deleteWeightLog(log.id);
    notify("Pesée supprimée.");
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl">
        <PageHeader
          eyebrow="Progression"
          title="Poids"
          description="Suis la tendance sans te laisser piéger par une seule mesure. Le poids varie naturellement avec l’eau, le sel, le cycle, la digestion et l’entraînement."
          action={
            <PremiumCard tint="red" className="max-w-sm">
              <p className="text-sm font-black text-white/70">
                Poids actuel
              </p>
              <p className="mt-3 text-6xl font-black tracking-[-0.06em]">
                {formatWeight(currentWeight).replace(" kg", "")}
              </p>
              <p className="mt-1 text-sm font-bold text-white/78">kg</p>

              <div className="mt-5 flex flex-wrap gap-2">
                <span className="rounded-full bg-white/16 px-3 py-1 text-xs font-black text-white backdrop-blur">
                  {latestLog ? latestLog.date : "Profil"}
                </span>
                <span className="rounded-full bg-white/16 px-3 py-1 text-xs font-black text-white backdrop-blur">
                  {deltaFromPrevious === null
                    ? "Première donnée"
                    : formatDelta(deltaFromPrevious)}
                </span>
              </div>
            </PremiumCard>
          }
        />

        <section className="mb-5 grid gap-4 md:grid-cols-4">
          <StatCard
            label="Poids actuel"
            value={formatWeight(currentWeight)}
            detail={latestLog ? `Dernière pesée : ${latestLog.date}` : "Depuis le profil"}
          />
          <StatCard
            label="Moyenne récente"
            value={formatWeight(average7)}
            detail="Moyenne des 7 dernières pesées"
          />
          <StatCard
            label="Depuis le début"
            value={globalDelta === null ? "—" : formatDelta(globalDelta)}
            detail={firstLog ? `Depuis le ${firstLog.date}` : "Pas encore d’historique"}
          />
          <StatCard
            label="Pesées"
            value={`${weightLogs.length}`}
            detail="Mesures enregistrées"
          />
        </section>

        {message && (
          <div className="mb-5 rounded-[28px] bg-green-50 p-4 text-sm font-black text-green-800 ring-1 ring-green-100">
            {message}
          </div>
        )}

        <section className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="space-y-5">
            <PremiumCard tint="white">
              <SectionTitle
                title="Ajouter une pesée"
                text="Idéalement, pèse-toi dans des conditions similaires : matin, à jeun, après passage aux toilettes."
              />

              <form onSubmit={handleSubmit} className="mt-6 grid gap-4 md:grid-cols-2">
                <Field label="Date">
                  <input
                    type="date"
                    value={date}
                    onChange={(event) => setDate(event.target.value)}
                    className="input"
                  />
                </Field>

                <Field label="Poids en kg">
                  <input
                    value={weightKg}
                    onChange={(event) => setWeightKg(event.target.value)}
                    className="input"
                    placeholder="Ex : 60,4"
                  />
                </Field>

                <button
                  type="submit"
                  className="ui-button-primary px-5 py-4 text-sm md:col-span-2"
                >
                  Ajouter la pesée
                </button>
              </form>
            </PremiumCard>

            <PremiumCard tint="white">
              <SectionTitle
                title="Lecture douce"
                text="La tendance compte plus que le chiffre isolé. Une variation de quelques centaines de grammes est normale."
              />

              <div className="mt-6 rounded-[34px] bg-[#FFFAF5] p-5 ring-1 ring-black/[0.055]">
                <div className="flex flex-wrap items-center gap-2">
                  <Pill tone="red">{getTrendLabel(deltaFromPrevious)}</Pill>
                  {deltaFromPrevious !== null && (
                    <Pill tone="cream">{formatDelta(deltaFromPrevious)}</Pill>
                  )}
                </div>

                <p className="mt-4 text-sm leading-7 text-[#7A746E]">
                  {getTrendText(deltaFromPrevious)}
                </p>
              </div>
            </PremiumCard>
          </div>

          <div className="space-y-5">
            <PremiumCard tint="white">
              <SectionTitle
                title="Tendance récente"
                text="Vue simplifiée des dernières pesées enregistrées."
              />

              <div className="mt-6">
                {last7Logs.length < 2 ? (
                  <EmptyState
                    title="Pas encore assez de données"
                    text="Ajoute au moins deux pesées pour voir une tendance récente."
                  />
                ) : (
                  <WeightTrend logs={last7Logs} />
                )}
              </div>
            </PremiumCard>

            <PremiumCard tint="white">
              <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
                <SectionTitle
                  title="Historique"
                  text="Toutes les pesées enregistrées, de la plus récente à la plus ancienne."
                />

                <GhostButton
                  onClick={() => {
                    setDate(todayLocalDate());
                    setWeightKg(currentWeight ? String(currentWeight) : "");
                  }}
                >
                  Aujourd’hui
                </GhostButton>
              </div>

              <div className="mt-6">
                {sortedLogsDesc.length === 0 ? (
                  <EmptyState
                    title="Aucune pesée enregistrée"
                    text="Ajoute une première mesure pour commencer à suivre la tendance."
                  />
                ) : (
                  <div className="grid gap-3">
                    {sortedLogsDesc.map((log, index) => {
                      const previous = sortedLogsDesc[index + 1];
                      const delta = previous ? log.weightKg - previous.weightKg : null;

                      return (
                        <WeightHistoryRow
                          key={log.id}
                          log={log}
                          delta={delta}
                          onDelete={() => handleDelete(log)}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            </PremiumCard>
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function WeightTrend({ logs }: { logs: WeightLog[] }) {
  const weights = logs.map((log) => log.weightKg);
  const min = Math.min(...weights);
  const max = Math.max(...weights);
  const range = Math.max(0.1, max - min);

  return (
    <div className="rounded-[34px] bg-[#FFFAF5] p-5 ring-1 ring-black/[0.055]">
      <div className="flex h-56 items-end gap-3">
        {logs.map((log) => {
          const height = 28 + ((log.weightKg - min) / range) * 140;

          return (
            <div key={log.id} className="flex flex-1 flex-col items-center gap-3">
              <div className="flex h-40 w-full items-end justify-center">
                <div
                  className="w-full max-w-12 rounded-full bg-gradient-to-t from-[#E94B4B] to-[#FFE1DD] shadow-[0_12px_28px_rgba(233,75,75,0.18)]"
                  style={{ height }}
                />
              </div>

              <div className="text-center">
                <p className="text-xs font-black text-[#171717]">
                  {formatWeight(log.weightKg)}
                </p>
                <p className="mt-1 text-[10px] font-bold text-[#7A746E]">
                  {log.date.slice(5)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function WeightHistoryRow({
  log,
  delta,
  onDelete,
}: {
  log: WeightLog;
  delta: number | null;
  onDelete: () => void;
}) {
  return (
    <div className="ui-card-soft ui-float p-4">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xl font-black tracking-[-0.04em] text-[#171717]">
              {formatWeight(log.weightKg)}
            </p>

            {delta !== null && (
              <Pill tone={Math.abs(delta) < 0.2 ? "cream" : "red"}>
                {formatDelta(delta)}
              </Pill>
            )}
          </div>

          <p className="mt-1 text-sm font-bold text-[#7A746E]">{log.date}</p>
        </div>

        <DangerButton onClick={onDelete}>Supprimer</DangerButton>
      </div>
    </div>
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
      <span className="mb-2 block text-sm font-black text-[#171717]">
        {label}
      </span>
      {children}
    </label>
  );
}