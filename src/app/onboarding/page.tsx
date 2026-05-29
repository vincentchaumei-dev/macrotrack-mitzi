"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  activityLevelLabels,
  calculateBmr,
  calculateRecommendedGoals,
  calculateTdee,
  explainGoal,
  goalSpeedLabels,
  goalTypeLabels,
} from "@/lib/nutrition";
import { useNutritionStore } from "@/hooks/useNutritionStore";
import {
  ActivityLevel,
  GoalSpeed,
  GoalType,
  Sex,
  UserProfile,
} from "@/types/nutrition";

const steps = [
  "Bienvenue",
  "Profil",
  "Objectif",
  "Validation",
];

function parseNumber(value: string) {
  const parsed = Number(value.replace(",", "."));
  return Number.isNaN(parsed) ? 0 : parsed;
}

export default function OnboardingPage() {
  const router = useRouter();
  const { profile, completeOnboarding, hasLoaded } = useNutritionStore();

  const [step, setStep] = useState(0);

  const [sex, setSex] = useState<Sex>(profile.sex);
  const [age, setAge] = useState(String(profile.age));
  const [heightCm, setHeightCm] = useState(String(profile.heightCm));
  const [currentWeightKg, setCurrentWeightKg] = useState(
    String(profile.currentWeightKg)
  );
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>(
    profile.activityLevel
  );
  const [goalType, setGoalType] = useState<GoalType>(profile.goalType);
  const [goalSpeed, setGoalSpeed] = useState<GoalSpeed>(profile.goalSpeed);

  const draftProfile: UserProfile = useMemo(
    () => ({
      sex,
      age: parseNumber(age),
      heightCm: parseNumber(heightCm),
      currentWeightKg: parseNumber(currentWeightKg),
      activityLevel,
      goalType,
      goalSpeed,
    }),
    [sex, age, heightCm, currentWeightKg, activityLevel, goalType, goalSpeed]
  );

  const bmr = calculateBmr(draftProfile);
  const tdee = calculateTdee(draftProfile);
  const recommendedGoals = calculateRecommendedGoals(draftProfile);

  function goNext() {
    setStep((current) => Math.min(current + 1, steps.length - 1));
  }

  function goPrevious() {
    setStep((current) => Math.max(current - 1, 0));
  }

  function finish(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    completeOnboarding(draftProfile, recommendedGoals);
    router.push("/");
  }

  if (!hasLoaded) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F7F4EF] text-[#10121A]">
        <p>Chargement...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F7F4EF] px-5 py-6 text-[#10121A]">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-5xl flex-col">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-[#E85A0C]">MacroTrack</p>
            <h1 className="mt-1 text-xl font-semibold tracking-tight">
              Configuration nutrition
            </h1>
          </div>

          <p className="rounded-full bg-white px-4 py-2 text-sm text-gray-500 shadow-sm ring-1 ring-black/5">
            Étape {step + 1}/{steps.length}
          </p>
        </header>

        <div className="mb-8 grid gap-2 md:grid-cols-4">
          {steps.map((item, index) => (
            <div
              key={item}
              className={`rounded-full px-4 py-2 text-center text-sm font-medium ${
                index <= step
                  ? "bg-[#10121A] text-white"
                  : "bg-white text-gray-400 ring-1 ring-black/5"
              }`}
            >
              {item}
            </div>
          ))}
        </div>

        <form
          onSubmit={finish}
          className="grid flex-1 gap-6 lg:grid-cols-[1fr_0.8fr]"
        >
          <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5">
            {step === 0 && (
              <div>
                <p className="text-sm font-medium text-[#E85A0C]">
                  Bienvenue
                </p>
                <h2 className="mt-2 text-4xl font-semibold tracking-tight">
                  Une app nutrition simple, sans pression.
                </h2>
                <p className="mt-5 max-w-2xl leading-7 text-gray-600">
                  L’objectif n’est pas de tout contrôler parfaitement. L’app
                  sert à comprendre les repas, suivre les calories et les macros,
                  puis ajuster progressivement selon l’objectif.
                </p>

                <div className="mt-8 grid gap-4 md:grid-cols-3">
                  <Feature
                    title="Simple"
                    text="Calories, protéines, glucides et lipides au même endroit."
                  />
                  <Feature
                    title="Progressif"
                    text="Les objectifs s’ajustent avec le profil et la progression."
                  />
                  <Feature
                    title="Sans jugement"
                    text="L’app aide à comprendre, pas à culpabiliser."
                  />
                </div>
              </div>
            )}

            {step === 1 && (
              <div>
                <p className="text-sm font-medium text-[#E85A0C]">Profil</p>
                <h2 className="mt-2 text-3xl font-semibold tracking-tight">
                  On commence par les bases.
                </h2>
                <p className="mt-3 text-gray-500">
                  Ces informations servent uniquement à estimer la dépense
                  journalière.
                </p>

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <Field label="Sexe">
                    <select
                      value={sex}
                      onChange={(event) => setSex(event.target.value as Sex)}
                      className="input"
                    >
                      <option value="female">Femme</option>
                      <option value="male">Homme</option>
                    </select>
                  </Field>

                  <Field label="Âge">
                    <input
                      value={age}
                      onChange={(event) => setAge(event.target.value)}
                      className="input"
                    />
                  </Field>

                  <Field label="Taille en cm">
                    <input
                      value={heightCm}
                      onChange={(event) => setHeightCm(event.target.value)}
                      className="input"
                    />
                  </Field>

                  <Field label="Poids actuel en kg">
                    <input
                      value={currentWeightKg}
                      onChange={(event) =>
                        setCurrentWeightKg(event.target.value)
                      }
                      className="input"
                    />
                  </Field>

                  <Field label="Niveau d’activité">
                    <select
                      value={activityLevel}
                      onChange={(event) =>
                        setActivityLevel(event.target.value as ActivityLevel)
                      }
                      className="input"
                    >
                      {Object.entries(activityLevelLabels).map(
                        ([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        )
                      )}
                    </select>
                  </Field>
                </div>
              </div>
            )}

            {step === 2 && (
              <div>
                <p className="text-sm font-medium text-[#E85A0C]">Objectif</p>
                <h2 className="mt-2 text-3xl font-semibold tracking-tight">
                  Choisis la direction.
                </h2>
                <p className="mt-3 text-gray-500">
                  L’app propose ensuite des calories et macros cohérentes.
                </p>

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <Field label="Objectif principal">
                    <select
                      value={goalType}
                      onChange={(event) =>
                        setGoalType(event.target.value as GoalType)
                      }
                      className="input"
                    >
                      {Object.entries(goalTypeLabels).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Vitesse de progression">
                    <select
                      value={goalSpeed}
                      onChange={(event) =>
                        setGoalSpeed(event.target.value as GoalSpeed)
                      }
                      className="input"
                    >
                      {Object.entries(goalSpeedLabels).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>

                <div className="mt-6 rounded-2xl bg-[#FAFAF8] p-5">
                  <p className="font-medium">Lecture simple</p>
                  <p className="mt-2 text-sm leading-6 text-gray-600">
                    {explainGoal(draftProfile)}
                  </p>
                </div>
              </div>
            )}

            {step === 3 && (
              <div>
                <p className="text-sm font-medium text-[#E85A0C]">Validation</p>
                <h2 className="mt-2 text-3xl font-semibold tracking-tight">
                  Objectifs proposés
                </h2>
                <p className="mt-3 text-gray-500">
                  Tu pourras modifier ces valeurs plus tard dans la page
                  Objectifs.
                </p>

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <ResultCard
                    label="Calories"
                    value={`${recommendedGoals.calories} kcal`}
                  />
                  <ResultCard
                    label="Protéines"
                    value={`${recommendedGoals.proteinG} g`}
                  />
                  <ResultCard
                    label="Glucides"
                    value={`${recommendedGoals.carbsG} g`}
                  />
                  <ResultCard
                    label="Lipides"
                    value={`${recommendedGoals.fatG} g`}
                  />
                </div>

                <div className="mt-6 rounded-2xl border border-orange-200 bg-orange-50 p-4 text-sm leading-6 text-orange-900">
                  Ce sont des estimations de départ. Le plus important sera
                  d’observer l’évolution sur plusieurs semaines, pas de chercher
                  la perfection chaque jour.
                </div>
              </div>
            )}

            <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
              <button
                type="button"
                onClick={goPrevious}
                disabled={step === 0}
                className="rounded-2xl border border-black/10 px-5 py-3 text-sm font-medium text-gray-600 disabled:cursor-not-allowed disabled:opacity-30"
              >
                Retour
              </button>

              {step < steps.length - 1 ? (
                <button
                  type="button"
                  onClick={goNext}
                  className="rounded-2xl bg-[#10121A] px-5 py-3 text-sm font-medium text-white"
                >
                  Continuer
                </button>
              ) : (
                <button className="rounded-2xl bg-[#E85A0C] px-5 py-3 text-sm font-medium text-white">
                  Terminer la configuration
                </button>
              )}
            </div>
          </section>

          <aside className="space-y-6">
            <div className="rounded-3xl bg-[#10121A] p-6 text-white shadow-sm">
              <p className="text-sm text-white/60">Estimation actuelle</p>
              <h2 className="mt-2 text-2xl font-semibold">
                {tdee} kcal / jour
              </h2>

              <div className="mt-6 grid gap-3">
                <DarkStat label="Métabolisme de base" value={`${bmr} kcal`} />
                <DarkStat label="Dépense journalière" value={`${tdee} kcal`} />
                <DarkStat
                  label="Objectif proposé"
                  value={`${recommendedGoals.calories} kcal`}
                />
              </div>
            </div>

            <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5">
              <p className="text-sm font-medium text-[#E85A0C]">
                À retenir
              </p>
              <p className="mt-3 text-sm leading-6 text-gray-600">
                Les calories donnent une direction. Les protéines aident à la
                satiété et à préserver la masse musculaire. La progression se
                regarde sur la moyenne, pas sur une journée isolée.
              </p>
            </div>
          </aside>
        </form>
      </div>
    </main>
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

function Feature({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-2xl bg-[#FAFAF8] p-4">
      <p className="font-semibold">{title}</p>
      <p className="mt-2 text-sm leading-6 text-gray-600">{text}</p>
    </div>
  );
}

function ResultCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-[#FAFAF8] p-5">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}

function DarkStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/10 p-4">
      <p className="text-sm text-white/50">{label}</p>
      <p className="mt-1 font-semibold">{value}</p>
    </div>
  );
}