"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { useNutritionStore } from "@/hooks/useNutritionStore";
import {
  calculateDayTotals,
  calculateTdee,
  formatDateFr,
  formatMacro,
  goalTypeLabels,
  mealTypeLabels,
  todayLocalDate,
} from "@/lib/nutrition";

function toNumber(value: number | null | undefined) {
  return typeof value === "number" ? value : 0;
}

function getPercent(value: number, target: number) {
  if (target <= 0) return 0;
  return Math.min(140, Math.round((value / target) * 100));
}

function getCoachMessage({
  calories,
  target,
  protein,
  proteinTarget,
}: {
  calories: number;
  target: number;
  protein: number;
  proteinTarget: number;
}) {
  const caloriePercent = getPercent(calories, target);
  const proteinPercent = getPercent(protein, proteinTarget);

  if (calories === 0) {
    return {
      title: "On commence doucement.",
      text: "Ajoute un premier repas pour lancer la journée. L’objectif, c’est de comprendre, pas de se mettre la pression.",
    };
  }

  if (proteinPercent < 50 && caloriePercent > 45) {
    return {
      title: "Pense aux protéines.",
      text: "Tu avances bien, mais les protéines sont encore basses. Un œuf, du fromage blanc, du thon ou du poulet peuvent aider simplement.",
    };
  }

  if (caloriePercent < 65) {
    return {
      title: "Belle marge aujourd’hui.",
      text: "Tu as encore de la place sur les calories. Continue avec des repas simples, rassasiants et faciles à suivre.",
    };
  }

  if (caloriePercent <= 100) {
    return {
      title: "Journée bien cadrée.",
      text: "Tu es dans une zone cohérente. Le plus important reste la tendance sur plusieurs jours.",
    };
  }

  return {
    title: "Un peu au-dessus, rien de grave.",
    text: "Une journée isolée ne veut pas tout dire. On regarde surtout la moyenne sur la semaine.",
  };
}

export default function Home() {
  const router = useRouter();

  const { profile, goals, getMealsByDate, hasLoaded, onboardingCompleted } =
    useNutritionStore();

  const today = todayLocalDate();
  const meals = getMealsByDate(today);
  const totals = calculateDayTotals(meals);

  const calories = toNumber(totals.calories);
  const protein = toNumber(totals.proteinG);
  const carbs = toNumber(totals.carbsG);
  const fat = toNumber(totals.fatG);

  const calorieTarget = goals.calories;
  const proteinTarget = goals.proteinG;
  const carbsTarget = goals.carbsG;
  const fatTarget = goals.fatG;

  const caloriesRemaining = calorieTarget - calories;
  const caloriePercent = getPercent(calories, calorieTarget);
  const tdee = calculateTdee(profile);

  const coach = useMemo(
    () =>
      getCoachMessage({
        calories,
        target: calorieTarget,
        protein,
        proteinTarget,
      }),
    [calories, calorieTarget, protein, proteinTarget]
  );

  useEffect(() => {
    if (hasLoaded && !onboardingCompleted) {
      router.push("/onboarding");
    }
  }, [hasLoaded, onboardingCompleted, router]);

  if (!hasLoaded || !onboardingCompleted) {
    return (
      <AppShell>
        <div className="flex min-h-[50vh] items-center justify-center">
          <p className="text-sm text-[#7A746E]">Chargement...</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl">
        <header className="mb-7 flex flex-col justify-between gap-4 md:flex-row md:items-start">
          <div>
            <p className="text-sm font-bold text-[#E94B4B]">
              {formatDateFr(today)}
            </p>
            <h1 className="mt-2 text-4xl font-black tracking-tight text-[#171717] md:text-5xl">
              Dashboard nutrition
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#7A746E] md:text-base">
              Objectif actuel : {goalTypeLabels[profile.goalType]} · dépense
              journalière estimée : {tdee} kcal.
            </p>
          </div>

          <Link
            href="/add"
            className="w-fit rounded-full bg-[#E94B4B] px-5 py-3 text-sm font-bold text-white shadow-[0_18px_32px_rgba(233,75,75,0.24)] transition hover:bg-[#B92D35]"
          >
            Ajouter un repas
          </Link>
        </header>

        <section className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
          <div
            className="overflow-hidden rounded-[42px] p-6 md:p-8"
            style={{
              background:
                "linear-gradient(180deg, #FFFFFF 0%, #FFF8F5 100%)",
              boxShadow: "0 24px 60px rgba(28, 21, 18, 0.09)",
              border: "1px solid rgba(23,23,23,0.06)",
            }}
          >
            <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm font-bold text-[#7A746E]">
                  Calories restantes
                </p>

                <div className="mt-3 flex items-end gap-2">
                  <p className="text-7xl font-black tracking-tight text-[#171717]">
                    {Math.max(0, caloriesRemaining)}
                  </p>
                  <p className="mb-3 text-xl font-bold text-[#7A746E]">kcal</p>
                </div>

                <p className="mt-3 text-sm leading-6 text-[#7A746E]">
                  {calories} kcal consommées sur {calorieTarget} kcal.
                </p>

                {caloriesRemaining < 0 && (
                  <p className="mt-4 rounded-[24px] bg-[#FFE1DD] px-4 py-3 text-sm font-semibold text-[#B92D35]">
                    +{Math.abs(caloriesRemaining)} kcal au-dessus de l’objectif.
                    Pas grave, on regarde surtout la moyenne.
                  </p>
                )}
              </div>

              <ProgressRing percent={caloriePercent} label={`${caloriePercent}%`} />
            </div>

            <div className="mt-8 grid gap-3 md:grid-cols-3">
              <MacroBar
                label="Protéines"
                value={protein}
                target={proteinTarget}
                suffix="g"
                color="#7DD3FC"
              />
              <MacroBar
                label="Glucides"
                value={carbs}
                target={carbsTarget}
                suffix="g"
                color="#F6C766"
              />
              <MacroBar
                label="Lipides"
                value={fat}
                target={fatTarget}
                suffix="g"
                color="#E94B4B"
              />
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-1">
            <div
              className="rounded-[38px] p-6 text-white"
              style={{
                background: "linear-gradient(135deg, #E94B4B 0%, #B92D35 100%)",
                boxShadow: "0 24px 60px rgba(233,75,75,0.28)",
              }}
            >
              <p className="text-sm font-semibold text-white/70">
                Coach nutrition
              </p>
              <h2 className="mt-3 text-2xl font-black tracking-tight">
                {coach.title}
              </h2>
              <p className="mt-3 text-sm leading-6 text-white/85">
                {coach.text}
              </p>
            </div>

            <div
              className="rounded-[38px] bg-white p-6"
              style={{
                boxShadow: "0 18px 44px rgba(28, 21, 18, 0.07)",
                border: "1px solid rgba(23,23,23,0.06)",
              }}
            >
              <p className="text-sm font-bold text-[#E94B4B]">Conseil simple</p>
              <p className="mt-3 text-sm leading-6 text-[#7A746E]">
                Pour progresser sans pression, vise surtout la régularité :
                assez de protéines, des repas rassasiants, et une moyenne
                cohérente sur plusieurs jours.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-5 grid gap-4 md:grid-cols-3">
          <SmallStat
            label="Dépense estimée"
            value={`${tdee} kcal`}
            text="Estimation selon le profil et l’activité."
          />
          <SmallStat
            label="Objectif calories"
            value={`${calorieTarget} kcal`}
            text="Modifiable dans la page Objectifs."
          />
          <SmallStat
            label="Repas aujourd’hui"
            value={`${meals.length}`}
            text="Repas enregistrés sur la journée."
          />
        </section>

        <section className="mt-5 grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
          <div
            className="rounded-[42px] bg-white p-6"
            style={{
              boxShadow: "0 18px 44px rgba(28, 21, 18, 0.07)",
              border: "1px solid rgba(23,23,23,0.06)",
            }}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl font-black tracking-tight text-[#171717]">
                  Repas du jour
                </h2>
                <p className="mt-1 text-sm text-[#7A746E]">
                  {meals.length === 0
                    ? "Aucun repas enregistré aujourd’hui."
                    : `${meals.length} repas enregistré(s).`}
                </p>
              </div>

              <Link
                href="/add"
                className="rounded-full bg-[#E94B4B] px-4 py-2 text-sm font-bold text-white shadow-lg shadow-red-100"
              >
                Ajouter
              </Link>
            </div>

            <div className="mt-5 space-y-3">
              {meals.length === 0 ? (
                <div className="rounded-[32px] border border-dashed border-black/10 bg-[#FFFAF5] p-8 text-center">
                  <p className="font-bold">Commence avec un repas simple</p>
                  <p className="mt-2 text-sm leading-6 text-[#7A746E]">
                    Tu peux ajouter un repas manuellement ou utiliser un repas
                    type déjà prêt.
                  </p>

                  <div className="mt-5 flex flex-wrap justify-center gap-2">
                    <Link
                      href="/add"
                      className="rounded-full bg-[#E94B4B] px-5 py-3 text-sm font-bold text-white"
                    >
                      Ajouter un repas
                    </Link>
                    <Link
                      href="/recipes"
                      className="rounded-full border border-black/10 bg-white px-5 py-3 text-sm font-bold text-[#171717]"
                    >
                      Voir les repas types
                    </Link>
                  </div>
                </div>
              ) : (
                meals.map((meal) => {
                  const mealTotals = calculateDayTotals([meal]);

                  return (
                    <div
                      key={meal.id}
                      className="rounded-[30px] bg-[#FFFAF5] p-4 ring-1 ring-black/5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-bold text-[#171717]">
                            {meal.name || mealTypeLabels[meal.type]}
                          </p>
                          <p className="mt-1 text-sm text-[#7A746E]">
                            {meal.items.length} aliment(s)
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="font-black text-[#171717]">
                            {formatMacro(mealTotals.calories, " kcal")}
                          </p>
                          <p className="mt-1 text-xs text-[#7A746E]">
                            {formatMacro(mealTotals.proteinG, " g")} prot.
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div
            className="rounded-[42px] bg-white p-6"
            style={{
              boxShadow: "0 18px 44px rgba(28, 21, 18, 0.07)",
              border: "1px solid rgba(23,23,23,0.06)",
            }}
          >
            <h2 className="text-2xl font-black tracking-tight text-[#171717]">
              Raccourcis
            </h2>

            <div className="mt-5 grid gap-3">
              <QuickLink href="/recipes" label="Ajouter un repas type" />
              <QuickLink href="/import" label="Scanner ou importer un produit" />
              <QuickLink href="/weight" label="Suivre le poids" />
              <QuickLink href="/analytics" label="Voir l’analyse" />
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function ProgressRing({ percent, label }: { percent: number; label: string }) {
  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(100, Math.max(0, percent));
  const dashOffset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative flex h-48 w-48 shrink-0 items-center justify-center">
      <svg className="h-full w-full -rotate-90" viewBox="0 0 140 140">
        <circle
          cx="70"
          cy="70"
          r={radius}
          stroke="#FFE1DD"
          strokeWidth="14"
          fill="none"
        />
        <circle
          cx="70"
          cy="70"
          r={radius}
          stroke="#E94B4B"
          strokeWidth="14"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
        />
      </svg>

      <div className="absolute text-center">
        <p className="text-4xl font-black text-[#171717]">{label}</p>
        <p className="mt-1 text-xs font-bold text-[#7A746E]">complété</p>
      </div>
    </div>
  );
}

function MacroBar({
  label,
  value,
  target,
  suffix,
  color,
}: {
  label: string;
  value: number;
  target: number;
  suffix: string;
  color: string;
}) {
  const percent = Math.min(100, getPercent(value, target));

  return (
    <div className="rounded-[28px] bg-[#FFFAF5] p-4 ring-1 ring-black/5">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-sm font-bold text-[#171717]">{label}</p>
        <p className="text-sm text-[#7A746E]">
          <span className="font-black text-[#171717]">{value}</span> / {target}{" "}
          {suffix}
        </p>
      </div>

      <div className="mt-3 h-2 overflow-hidden rounded-full bg-black/5">
        <div
          className="h-full rounded-full"
          style={{ width: `${percent}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

function SmallStat({
  label,
  value,
  text,
}: {
  label: string;
  value: string;
  text: string;
}) {
  return (
    <div
      className="rounded-[34px] bg-white p-5"
      style={{
        boxShadow: "0 16px 38px rgba(28, 21, 18, 0.06)",
        border: "1px solid rgba(23,23,23,0.06)",
      }}
    >
      <p className="text-sm font-semibold text-[#7A746E]">{label}</p>
      <p className="mt-2 text-3xl font-black tracking-tight text-[#171717]">
        {value}
      </p>
      <p className="mt-2 text-sm leading-5 text-[#7A746E]">{text}</p>
    </div>
  );
}

function QuickLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between rounded-[28px] bg-[#FFFAF5] px-4 py-4 text-sm font-bold text-[#171717] ring-1 ring-black/5 transition hover:bg-[#FFE1DD]"
    >
      <span>{label}</span>
      <span className="text-[#E94B4B]">→</span>
    </Link>
  );
}