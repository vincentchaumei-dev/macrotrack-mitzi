"use client";

import { FormEvent, useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { useNutritionStore } from "@/hooks/useNutritionStore";
import {
  activityLevelLabels,
  calculateBmr,
  calculateRecommendedGoals,
  calculateTdee,
  explainGoal,
  goalSpeedLabels,
  goalTypeLabels,
} from "@/lib/nutrition";
import {
  ActivityLevel,
  GoalSpeed,
  GoalType,
  Sex,
  UserProfile,
} from "@/types/nutrition";

export default function GoalsPage() {
  const { profile, goals, updateProfile, updateGoals } = useNutritionStore();

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

  const [manualCalories, setManualCalories] = useState(String(goals.calories));
  const [manualProtein, setManualProtein] = useState(String(goals.proteinG));
  const [manualCarbs, setManualCarbs] = useState(String(goals.carbsG));
  const [manualFat, setManualFat] = useState(String(goals.fatG));

  const [saved, setSaved] = useState(false);

  const draftProfile: UserProfile = {
    sex,
    age: Number(age) || 0,
    heightCm: Number(heightCm) || 0,
    currentWeightKg: Number(currentWeightKg.replace(",", ".")) || 0,
    activityLevel,
    goalType,
    goalSpeed,
  };

  const bmr = calculateBmr(draftProfile);
  const tdee = calculateTdee(draftProfile);
  const recommendedGoals = calculateRecommendedGoals(draftProfile);

  useEffect(() => {
    setManualCalories(String(recommendedGoals.calories));
    setManualProtein(String(recommendedGoals.proteinG));
    setManualCarbs(String(recommendedGoals.carbsG));
    setManualFat(String(recommendedGoals.fatG));
  }, [
    sex,
    age,
    heightCm,
    currentWeightKg,
    activityLevel,
    goalType,
    goalSpeed,
  ]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextProfile: UserProfile = {
      ...draftProfile,
      age: Math.max(draftProfile.age, 0),
      heightCm: Math.max(draftProfile.heightCm, 0),
      currentWeightKg: Math.max(draftProfile.currentWeightKg, 0),
    };

    updateProfile(nextProfile);

    updateGoals({
      calories: Number(manualCalories) || recommendedGoals.calories,
      proteinG: Number(manualProtein) || recommendedGoals.proteinG,
      carbsG: Number(manualCarbs) || recommendedGoals.carbsG,
      fatG: Number(manualFat) || recommendedGoals.fatG,
    });

    setSaved(true);
    window.setTimeout(() => setSaved(false), 2500);
  }

  return (
    <AppShell>
      <div className="mb-8">
        <p className="text-sm font-medium text-[#E85A0C]">
          Profil & objectifs
        </p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">
          Calculateur nutritionnel
        </h1>
        <p className="mt-2 text-gray-500">
          Définis un profil, estime la dépense journalière, puis ajuste les
          objectifs calories et macros.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
        <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5">
          <h2 className="text-xl font-semibold">Profil</h2>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
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
                onChange={(event) => setCurrentWeightKg(event.target.value)}
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
                {Object.entries(activityLevelLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Objectif">
              <select
                value={goalType}
                onChange={(event) => setGoalType(event.target.value as GoalType)}
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
        </section>

        <section className="space-y-6">
          <div className="rounded-3xl bg-[#10121A] p-6 text-white shadow-sm">
            <p className="text-sm text-white/60">Estimation</p>
            <h2 className="mt-2 text-2xl font-semibold">
              Dépense journalière estimée
            </h2>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <DarkStat label="Métabolisme de base" value={`${bmr} kcal`} />
              <DarkStat label="Dépense journalière" value={`${tdee} kcal`} />
            </div>

            <p className="mt-5 text-sm leading-6 text-white/60">
              Ces chiffres sont des estimations. Ils doivent être ajustés avec
              l’évolution réelle du poids, de l’énergie, de la faim et de
              l’activité.
            </p>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5">
            <h2 className="text-xl font-semibold">Objectifs proposés</h2>
            <p className="mt-1 text-sm text-gray-500">
              Tu peux les modifier manuellement avant d’enregistrer.
            </p>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <Field label="Calories / jour">
                <input
                  value={manualCalories}
                  onChange={(event) => setManualCalories(event.target.value)}
                  className="input"
                />
              </Field>

              <Field label="Protéines / jour">
                <input
                  value={manualProtein}
                  onChange={(event) => setManualProtein(event.target.value)}
                  className="input"
                />
              </Field>

              <Field label="Glucides / jour">
                <input
                  value={manualCarbs}
                  onChange={(event) => setManualCarbs(event.target.value)}
                  className="input"
                />
              </Field>

              <Field label="Lipides / jour">
                <input
                  value={manualFat}
                  onChange={(event) => setManualFat(event.target.value)}
                  className="input"
                />
              </Field>
            </div>

            <button className="mt-6 w-full rounded-2xl bg-[#E85A0C] px-5 py-3 text-sm font-medium text-white">
              Enregistrer le profil et les objectifs
            </button>

            {saved && (
              <p className="mt-4 rounded-2xl bg-green-50 p-3 text-sm text-green-800">
                Profil et objectifs enregistrés.
              </p>
            )}
          </div>
        </section>
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

function DarkStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/10 p-4">
      <p className="text-sm text-white/50">{label}</p>
      <p className="mt-1 text-xl font-semibold">{value}</p>
    </div>
  );
}