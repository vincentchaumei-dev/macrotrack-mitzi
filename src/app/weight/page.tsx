"use client";

import { FormEvent, ReactNode, useMemo, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { useConfirm } from "@/components/ui/ConfirmProvider";
import { useNutritionStore } from "@/hooks/useNutritionStore";
import { todayLocalDate } from "@/lib/nutrition";
import { WeightLog } from "@/types/nutrition";

function parseNumber(value: string) {
  const parsed = Number(value.replace(",", "."));
  return Number.isNaN(parsed) ? 0 : parsed;
}

function formatWeight(value: number | null | undefined) {
  if (value === null || value === undefined) return "—";
  return `${Math.round(value * 10) / 10}`;
}

function formatDelta(value: number | null) {
  if (value === null) return "—";

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

function getLastLogs(logs: WeightLog[], count = 7) {
  return sortLogsAsc(logs).slice(-count);
}

function getAverage(logs: WeightLog[]) {
  if (logs.length === 0) return null;

  const total = logs.reduce((sum, log) => sum + log.weightKg, 0);
  return Math.round((total / logs.length) * 10) / 10;
}

function getTrendLabel(delta: number | null) {
  if (delta === null) return "Tendance à venir";
  if (Math.abs(delta) < 0.2) return "Stable";
  if (delta < 0) return "En baisse";
  return "En hausse";
}

function getTrendText(delta: number | null) {
  if (delta === null) {
    return "Ajoute plusieurs pesées pour lire une vraie tendance. Une seule mesure ne raconte pas toute l’histoire.";
  }

  if (Math.abs(delta) < 0.2) {
    return "La tendance récente est stable. C’est souvent plus parlant qu’un chiffre isolé.";
  }

  if (delta < 0) {
    return "La tendance récente descend. À confirmer sur plusieurs jours, sans tirer de conclusion trop vite.";
  }

  return "La tendance récente monte. Ce n’est pas forcément négatif : eau, cycle, digestion, sel et entraînement peuvent jouer.";
}

export default function WeightPage() {
  const confirm = useConfirm();

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
  const last7Logs = useMemo(() => getLastLogs(weightLogs, 7), [weightLogs]);

  const latestLog = sortedLogsDesc[0] ?? null;
  const previousLog = sortedLogsDesc[1] ?? null;
  const firstLog = sortedLogsAsc[0] ?? null;

  const currentWeight = latestLog?.weightKg ?? profile.currentWeightKg;
  const average7 = getAverage(last7Logs);

  const deltaFromPrevious =
    latestLog && previousLog ? latestLog.weightKg - previousLog.weightKg : null;

  const globalDelta =
    firstLog && latestLog ? latestLog.weightKg - firstLog.weightKg : null;

  function notify(text: string) {
    setMessage(text);
    window.setTimeout(() => setMessage(""), 2400);
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

  async function handleDelete(log: WeightLog) {
    const confirmed = await confirm({
      title: "Supprimer cette pesée ?",
      message: `La pesée du ${log.date} (${formatWeight(
        log.weightKg
      )} kg) sera retirée de l’historique.`,
      confirmLabel: "Supprimer",
      cancelLabel: "Annuler",
      tone: "danger",
    });

    if (!confirmed) return;

    deleteWeightLog(log.id);
    notify("Pesée supprimée.");
  }

  return (
    <AppShell>
      <div className="space-y-5">
        {message && <div className="mt-dashboard-toast">{message}</div>}

        <section className="pt-2">
          <p className="text-[12px] font-black uppercase tracking-[0.18em] text-[var(--mt-rouge)]">
            Progression
          </p>

          <div className="mt-3 flex items-start justify-between gap-4">
            <div>
              <h1 className="mt-display text-[52px] font-semibold leading-[0.9] tracking-[-0.055em] text-[var(--mt-ink)]">
                Poids
              </h1>

              <p className="mt-4 max-w-[290px] text-[15px] leading-7 text-[var(--mt-ink-2)]">
                Suis la tendance sans te laisser piéger par une seule mesure.
              </p>
            </div>

            <div className="shrink-0 rounded-[24px] bg-gradient-to-br from-[var(--mt-rouge-lit)] via-[var(--mt-rouge)] to-[var(--mt-rouge-deep)] p-4 text-white shadow-[var(--mt-shadow-red)]">
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-white/62">
                Actuel
              </p>
              <p className="mt-display mt-2 text-[42px] font-semibold leading-none tracking-[-0.055em]">
                {formatWeight(currentWeight)}
              </p>
              <p className="mt-1 text-[10px] font-black uppercase text-white/62">
                kg
              </p>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-3 gap-3">
          <WeightMiniStat
            label="Moy. 7"
            value={average7 === null ? "—" : `${formatWeight(average7)}`}
            unit="kg"
          />
          <WeightMiniStat
            label="Dernière"
            value={latestLog ? latestLog.date.slice(5) : "—"}
            unit="date"
          />
          <WeightMiniStat
            label="Pesées"
            value={`${weightLogs.length}`}
            unit="total"
          />
        </section>

        <section className="mt-card overflow-hidden rounded-[28px]">
          <div className="mt-red-card bg-gradient-to-br from-[var(--mt-rouge-lit)] via-[var(--mt-rouge)] to-[var(--mt-rouge-deep)] p-5 text-white">
            <p className="text-[12px] font-black uppercase tracking-[0.18em] text-white/62">
              Tendance récente
            </p>

            <div className="mt-3 flex items-end justify-between gap-4">
              <div>
                <h2 className="mt-display text-[34px] font-semibold leading-none tracking-[-0.04em]">
                  {getTrendLabel(deltaFromPrevious)}
                </h2>
                <p className="mt-3 text-[14px] leading-7 text-white/78">
                  {getTrendText(deltaFromPrevious)}
                </p>
              </div>

              <div className="shrink-0 rounded-full bg-white/16 px-3 py-2 text-center backdrop-blur">
                <p className="text-[20px] font-black leading-none">
                  {formatDelta(deltaFromPrevious)}
                </p>
                <p className="mt-1 text-[9px] font-black uppercase text-white/62">
                  vs dernière
                </p>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <span className="rounded-full bg-white/16 px-3 py-1.5 text-[11px] font-black text-white backdrop-blur">
                Depuis début : {formatDelta(globalDelta)}
              </span>
              <span className="rounded-full bg-white/16 px-3 py-1.5 text-[11px] font-black text-white backdrop-blur">
                Moyenne 7 :{" "}
                {average7 === null ? "—" : `${formatWeight(average7)} kg`}
              </span>
            </div>
          </div>
        </section>

        <section className="mt-card rounded-[28px] p-5">
          <SectionHead
            kicker="Ajouter"
            title="Nouvelle pesée"
            text="Essaie de garder des conditions similaires : matin, à jeun, après passage aux toilettes."
          />

          <form onSubmit={handleSubmit} className="mt-5 grid gap-4">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Date">
                <input
                  type="date"
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                  className="WeightInput"
                />
              </Field>

              <Field label="Poids">
                <input
                  value={weightKg}
                  onChange={(event) => setWeightKg(event.target.value)}
                  className="WeightInput"
                  placeholder="60,4"
                />
              </Field>
            </div>

            <button type="submit" className="mt-btn-primary">
              Ajouter la pesée
            </button>
          </form>
        </section>

        <section className="mt-card rounded-[28px] p-5">
          <div className="flex items-end justify-between gap-3">
            <SectionHead
              kicker="Graphique"
              title="7 dernières"
              text="Une lecture visuelle, volontairement simple."
            />

            <button
              type="button"
              onClick={() => {
                setDate(todayLocalDate());
                setWeightKg(currentWeight ? String(currentWeight) : "");
              }}
              className="shrink-0 rounded-full bg-[var(--mt-rouge-wash)] px-3 py-2 text-[11px] font-black text-[var(--mt-rouge-deep)] ring-1 ring-[var(--mt-rouge-soft)]"
            >
              Aujourd’hui
            </button>
          </div>

          <div className="mt-5">
            {last7Logs.length < 2 ? (
              <div className="rounded-[22px] border border-dashed border-[var(--mt-line-2)] bg-[var(--mt-card-soft)] p-5 text-center">
                <p className="mt-display text-[21px] font-semibold text-[var(--mt-ink)]">
                  Pas encore assez de données
                </p>
                <p className="mt-2 text-[13px] leading-6 text-[var(--mt-ink-2)]">
                  Ajoute au moins deux pesées pour voir une tendance.
                </p>
              </div>
            ) : (
              <WeightBars logs={last7Logs} />
            )}
          </div>
        </section>

        <section className="mt-card rounded-[28px] p-5">
          <div className="flex items-end justify-between gap-3">
            <SectionHead
              kicker="Historique"
              title="Toutes les pesées"
              text="De la plus récente à la plus ancienne."
            />

            <span className="rounded-full bg-[var(--mt-card-soft)] px-3 py-2 text-[11px] font-black text-[var(--mt-ink-2)] ring-1 ring-[var(--mt-line)]">
              {sortedLogsDesc.length}
            </span>
          </div>

          <div className="mt-5 grid gap-3">
            {sortedLogsDesc.length === 0 ? (
              <div className="rounded-[22px] border border-dashed border-[var(--mt-line-2)] bg-[var(--mt-card-soft)] p-5 text-center">
                <p className="mt-display text-[21px] font-semibold text-[var(--mt-ink)]">
                  Aucune pesée
                </p>
                <p className="mt-2 text-[13px] leading-6 text-[var(--mt-ink-2)]">
                  Ajoute une première mesure pour commencer le suivi.
                </p>
              </div>
            ) : (
              sortedLogsDesc.map((log, index) => {
                const previous = sortedLogsDesc[index + 1];
                const delta = previous ? log.weightKg - previous.weightKg : null;

                return (
                  <WeightRow
                    key={log.id}
                    log={log}
                    delta={delta}
                    onDelete={() => handleDelete(log)}
                  />
                );
              })
            )}
          </div>
        </section>

        <section className="mt-insight">
          <div className="mt-insight-icon">
            <LightIcon />
          </div>
          <p>
            Le poids varie naturellement. La tendance sur plusieurs mesures est
            plus utile qu’un chiffre isolé.
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

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.12em] text-[var(--mt-ink-2)]">
        {label}
      </span>
      {children}
    </label>
  );
}

function WeightMiniStat({
  label,
  value,
  unit,
}: {
  label: string;
  value: string;
  unit: string;
}) {
  return (
    <div className="rounded-[22px] bg-white p-4 shadow-[var(--mt-shadow-sm)] ring-1 ring-[var(--mt-line)]">
      <p className="text-[12px] font-bold text-[var(--mt-ink-2)]">{label}</p>
      <p className="mt-3 text-[24px] font-black leading-none tracking-[-0.04em] text-[var(--mt-ink)]">
        {value}
      </p>
      <p className="mt-2 text-[10px] font-black uppercase text-[var(--mt-ink-3)]">
        {unit}
      </p>
    </div>
  );
}

function WeightBars({ logs }: { logs: WeightLog[] }) {
  const weights = logs.map((log) => log.weightKg);
  const min = Math.min(...weights);
  const max = Math.max(...weights);
  const range = Math.max(0.1, max - min);

  return (
    <div className="flex items-end gap-2">
      {logs.map((log, index) => {
        const ratio = range === 0 ? 0.6 : (log.weightKg - min) / range;
        const heightPct = 20 + ratio * 80;
        const isLast = index === logs.length - 1;

        return (
          <div key={log.id} className="flex flex-1 flex-col items-center gap-2">
            <div
              className="relative w-full overflow-hidden rounded-[10px] bg-[var(--mt-card-soft)] ring-1 ring-[var(--mt-line)]"
              style={{ height: 100 }}
            >
              <div
                className={`absolute bottom-0 left-0 right-0 ${
                  isLast
                    ? "bg-[var(--mt-rouge)] shadow-[var(--mt-shadow-red)]"
                    : "bg-[var(--mt-rouge-soft)]"
                }`}
                style={{ height: `${heightPct}%` }}
              />
            </div>
            <div className="text-center">
              <p className="text-[11px] font-black text-[var(--mt-ink)]">
                {formatWeight(log.weightKg)}
              </p>
              <p className="text-[9px] font-bold text-[var(--mt-ink-3)]">
                {log.date.slice(5)}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function WeightRow({
  log,
  delta,
  onDelete,
}: {
  log: WeightLog;
  delta: number | null;
  onDelete: () => void;
}) {
  return (
    <article className="rounded-[22px] border border-[var(--mt-line)] bg-white p-4 shadow-[var(--mt-shadow-sm)]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <p className="mt-display text-[28px] font-semibold leading-none tracking-[-0.03em] text-[var(--mt-ink)]">
              {formatWeight(log.weightKg)}
            </p>
            <p className="text-[13px] font-black text-[var(--mt-ink-2)]">kg</p>
          </div>

          <p className="mt-2 text-[12px] font-bold text-[var(--mt-ink-2)]">
            {log.date}
          </p>
        </div>

        <div className="text-right">
          {delta !== null && (
            <span className="rounded-full bg-[var(--mt-rouge-wash)] px-3 py-1.5 text-[11px] font-black text-[var(--mt-rouge-deep)]">
              {formatDelta(delta)}
            </span>
          )}

          <button
            type="button"
            onClick={onDelete}
            className="mt-3 block text-[11px] font-black text-[var(--mt-rouge)]"
          >
            Supprimer
          </button>
        </div>
      </div>
    </article>
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