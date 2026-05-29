"use client";

import { FormEvent, useMemo, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { useNutritionStore } from "@/hooks/useNutritionStore";
import { todayLocalDate } from "@/lib/nutrition";

function parseWeight(value: string) {
  const parsed = Number(value.replace(",", "."));
  return Number.isNaN(parsed) ? null : parsed;
}

export default function WeightPage() {
  const { weightLogs, addWeightLog, deleteWeightLog } = useNutritionStore();

  const [date, setDate] = useState(todayLocalDate());
  const [weightKg, setWeightKg] = useState("");
  const [notes, setNotes] = useState("");

  const latestWeight = weightLogs[0];

  const stats = useMemo(() => {
    if (weightLogs.length < 2) {
      return null;
    }

    const sortedAsc = [...weightLogs].sort((a, b) => a.date.localeCompare(b.date));
    const first = sortedAsc[0];
    const latest = sortedAsc[sortedAsc.length - 1];

    return {
      firstWeight: first.weightKg,
      latestWeight: latest.weightKg,
      change: Math.round((latest.weightKg - first.weightKg) * 10) / 10,
    };
  }, [weightLogs]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const parsedWeight = parseWeight(weightKg);

    if (!parsedWeight || parsedWeight <= 0) {
      return;
    }

    addWeightLog({
      date,
      weightKg: parsedWeight,
      notes: notes.trim() || undefined,
    });

    setWeightKg("");
    setNotes("");
  }

  return (
    <AppShell>
      <div className="mb-8">
        <p className="text-sm font-medium text-[#E85A0C]">Suivi corporel</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Poids</h1>
        <p className="mt-2 text-gray-500">
          Suis ton poids dans le temps et observe les tendances.
        </p>
      </div>

      <section className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <form
          onSubmit={handleSubmit}
          className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5"
        >
          <h2 className="text-xl font-semibold">Ajouter une pesée</h2>

          <div className="mt-5 space-y-4">
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
                placeholder="Ex : 80,2"
              />
            </Field>

            <Field label="Notes optionnelles">
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                className="input min-h-24 resize-none"
                placeholder="Ex : pesée à jeun, après entraînement..."
              />
            </Field>

            <button className="w-full rounded-2xl bg-[#10121A] px-5 py-3 text-sm font-medium text-white">
              Enregistrer la pesée
            </button>
          </div>
        </form>

        <div className="space-y-6">
          <section className="grid gap-4 md:grid-cols-3">
            <Stat
              label="Dernier poids"
              value={latestWeight ? `${latestWeight.weightKg} kg` : "—"}
            />
            <Stat
              label="Évolution totale"
              value={stats ? `${stats.change > 0 ? "+" : ""}${stats.change} kg` : "—"}
            />
            <Stat label="Pesées" value={`${weightLogs.length}`} />
          </section>

          <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5">
            <h2 className="text-xl font-semibold">Historique</h2>

            <div className="mt-5 space-y-3">
              {weightLogs.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-black/10 bg-[#FAFAF8] p-8 text-center text-sm text-gray-500">
                  Aucune pesée enregistrée.
                </div>
              ) : (
                weightLogs.map((log) => (
                  <div
                    key={log.id}
                    className="rounded-2xl border border-black/5 bg-[#FAFAF8] p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-semibold">{log.weightKg} kg</p>
                        <p className="mt-1 text-sm text-gray-500">{log.date}</p>
                        {log.notes && (
                          <p className="mt-2 text-sm text-gray-600">{log.notes}</p>
                        )}
                      </div>

                      <button
                        onClick={() => deleteWeightLog(log.id)}
                        className="rounded-full border border-black/10 px-3 py-1.5 text-xs text-gray-500 hover:bg-black/5"
                      >
                        Supprimer
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </section>
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

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold">{value}</p>
    </div>
  );
}