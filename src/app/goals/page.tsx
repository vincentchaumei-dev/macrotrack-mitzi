"use client";

import { FormEvent, useMemo, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import {
  GhostButton,
  PageHeader,
  Pill,
  PremiumCard,
  SectionTitle,
  SoftButton,
  StatCard,
} from "@/components/ui/PremiumUI";
import { useNutritionStore } from "@/hooks/useNutritionStore";
import { NutritionGoals, UserProfile } from "@/types/nutrition";
import { calculateTdee, goalTypeLabels } from "@/lib/nutrition";

const activityLabels: Record<string, string> = {
  sedentary: "Sédentaire",
  light: "Activité légère",
  moderate: "Activité modérée",
  active: "Active",
  very_active: "Très active",
};

const goalSpeedLabels: Record<string, string> = {
  gentle: "Progressif",
  moderate: "Modéré",
  assertive: "Rapide",
};

function parseNumber(value: string) {
  const parsed = Number(value.replace(",", "."));
  return Number.isNaN(parsed) ? 0 : parsed;
}

function calculateSuggestedGoals(profile: UserProfile): NutritionGoals {
  const tdee = calculateTdee(profile);

  let calories = tdee;

  if (profile.goalType === "fat_loss") {
    if (profile.goalSpeed === "gentle") calories = tdee - 250;
    if (profile.goalSpeed === "moderate") calories = tdee - 400;
    if (profile.goalSpeed === "assertive") calories = tdee - 550;
  }

  if (profile.goalType === "muscle_gain") {
    if (profile.goalSpeed === "gentle") calories = tdee + 150;
    if (profile.goalSpeed === "moderate") calories = tdee + 250;
    if (profile.goalSpeed === "assertive") calories = tdee + 350;
  }

  const safeCalories = Math.max(1300, Math.round(calories));

  const proteinG = Math.round(profile.currentWeightKg * 1.8);
  const fatG = Math.round(profile.currentWeightKg * 0.85);
  const remainingCalories = safeCalories - proteinG * 4 - fatG * 9;
  const carbsG = Math.max(80, Math.round(remainingCalories / 4));

  return {
    calories: safeCalories,
    proteinG,
    carbsG,
    fatG,
  };
}

function goalText(profile: UserProfile) {
  if (profile.goalType === "fat_loss") {
    return "Objectif orienté perte de poids : l’idée est de créer un déficit raisonnable, sans rendre les journées impossibles à tenir.";
  }

  if (profile.goalType === "muscle_gain") {
    return "Objectif orienté prise de masse : l’idée est d’avoir assez d’énergie pour progresser, sans partir sur un surplus excessif.";
  }

  return "Objectif maintien : l’idée est de stabiliser le poids tout en gardant des apports cohérents et faciles à suivre.";
}

export default function GoalsPage() {
  const { profile, goals, updateProfile, updateGoals } = useNutritionStore();

  const [profileForm, setProfileForm] = useState({
    sex: profile.sex,
    age: String(profile.age),
    heightCm: String(profile.heightCm),
    currentWeightKg: String(profile.currentWeightKg),
    activityLevel: profile.activityLevel,
    goalType: profile.goalType,
    goalSpeed: profile.goalSpeed,
  });

  const [goalsForm, setGoalsForm] = useState({
    calories: String(goals.calories),
    proteinG: String(goals.proteinG),
    carbsG: String(goals.carbsG),
    fatG: String(goals.fatG),
  });

  const previewProfile: UserProfile = {
    sex: profileForm.sex,
    age: parseNumber(profileForm.age),
    heightCm: parseNumber(profileForm.heightCm),
    currentWeightKg: parseNumber(profileForm.currentWeightKg),
    activityLevel: profileForm.activityLevel,
    goalType: profileForm.goalType,
    goalSpeed: profileForm.goalSpeed,
  } as UserProfile;

  const estimatedTdee = useMemo(
    () => calculateTdee(previewProfile),
    [previewProfile]
  );

  const suggestedGoals = useMemo(
    () => calculateSuggestedGoals(previewProfile),
    [previewProfile]
  );

  function updateProfileField(key: keyof typeof profileForm, value: string) {
    setProfileForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function updateGoalsField(key: keyof typeof goalsForm, value: string) {
    setGoalsForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function applySuggestedGoals() {
    setGoalsForm({
      calories: String(suggestedGoals.calories),
      proteinG: String(suggestedGoals.proteinG),
      carbsG: String(suggestedGoals.carbsG),
      fatG: String(suggestedGoals.fatG),
    });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextProfile: UserProfile = {
      sex: profileForm.sex,
      age: parseNumber(profileForm.age),
      heightCm: parseNumber(profileForm.heightCm),
      currentWeightKg: parseNumber(profileForm.currentWeightKg),
      activityLevel: profileForm.activityLevel,
      goalType: profileForm.goalType,
      goalSpeed: profileForm.goalSpeed,
    } as UserProfile;

    const nextGoals: NutritionGoals = {
      calories: Math.round(parseNumber(goalsForm.calories)),
      proteinG: Math.round(parseNumber(goalsForm.proteinG)),
      carbsG: Math.round(parseNumber(goalsForm.carbsG)),
      fatG: Math.round(parseNumber(goalsForm.fatG)),
    };

    updateProfile(nextProfile);
    updateGoals(nextGoals);
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl">
        <PageHeader
          eyebrow="Objectifs"
          title="Profil & macros"
          description="Définis un objectif clair, accessible et ajustable. Les calculs donnent une base de départ, mais la progression se pilote surtout avec la tendance sur plusieurs semaines."
          action={
            <PremiumCard tint="red" className="max-w-sm">
              <p className="text-sm font-black text-white/70">
                Dépense estimée
              </p>
              <p className="mt-3 text-5xl font-black tracking-[-0.06em]">
                {estimatedTdee}
              </p>
              <p className="mt-1 text-sm font-bold text-white/78">
                kcal / jour
              </p>
              <p className="mt-4 text-sm leading-6 text-white/82">
                Estimation basée sur le profil et le niveau d’activité.
              </p>
            </PremiumCard>
          }
        />

        <section className="mb-5 grid gap-4 md:grid-cols-4">
          <StatCard label="Calories" value={`${goals.calories} kcal`} />
          <StatCard label="Protéines" value={`${goals.proteinG} g`} />
          <StatCard label="Glucides" value={`${goals.carbsG} g`} />
          <StatCard label="Lipides" value={`${goals.fatG} g`} />
        </section>

        <form
          onSubmit={handleSubmit}
          className="grid gap-5 xl:grid-cols-[1fr_0.85fr]"
        >
          <div className="space-y-5">
            <PremiumCard tint="white">
              <SectionTitle
                title="Profil"
                text="Ces informations servent à estimer la dépense journalière et à proposer des objectifs cohérents."
              />

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <Field label="Sexe">
                  <select
                    value={profileForm.sex}
                    onChange={(event) =>
                      updateProfileField("sex", event.target.value)
                    }
                    className="input"
                  >
                    <option value="female">Femme</option>
                    <option value="male">Homme</option>
                  </select>
                </Field>

                <Field label="Âge">
                  <input
                    value={profileForm.age}
                    onChange={(event) =>
                      updateProfileField("age", event.target.value)
                    }
                    className="input"
                    placeholder="Ex : 25"
                  />
                </Field>

                <Field label="Taille en cm">
                  <input
                    value={profileForm.heightCm}
                    onChange={(event) =>
                      updateProfileField("heightCm", event.target.value)
                    }
                    className="input"
                    placeholder="Ex : 165"
                  />
                </Field>

                <Field label="Poids actuel en kg">
                  <input
                    value={profileForm.currentWeightKg}
                    onChange={(event) =>
                      updateProfileField("currentWeightKg", event.target.value)
                    }
                    className="input"
                    placeholder="Ex : 60"
                  />
                </Field>
              </div>
            </PremiumCard>

            <PremiumCard tint="white">
              <SectionTitle
                title="Objectif"
                text="Choisis le sens de progression. L’app propose ensuite une base de calories et de macros."
              />

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <Field label="Type d’objectif">
                  <select
                    value={profileForm.goalType}
                    onChange={(event) =>
                      updateProfileField("goalType", event.target.value)
                    }
                    className="input"
                  >
                    <option value="fat_loss">Perte de poids</option>
                    <option value="maintenance">Maintien</option>
                    <option value="muscle_gain">Prise de masse</option>
                  </select>
                </Field>

                <Field label="Vitesse">
                  <select
                    value={profileForm.goalSpeed}
                    onChange={(event) =>
                      updateProfileField("goalSpeed", event.target.value)
                    }
                    className="input"
                  >
                    <option value="gentle">Progressif</option>
                    <option value="moderate">Modéré</option>
                    <option value="ambitious">Rapide</option>
                  </select>
                </Field>

                <Field label="Niveau d’activité">
                  <select
                    value={profileForm.activityLevel}
                    onChange={(event) =>
                      updateProfileField("activityLevel", event.target.value)
                    }
                    className="input"
                  >
                    <option value="sedentary">Sédentaire</option>
                    <option value="light">Activité légère</option>
                    <option value="moderate">Activité modérée</option>
                    <option value="active">Active</option>
                    <option value="very_active">Très active</option>
                  </select>
                </Field>
              </div>

              <div className="mt-6 rounded-[32px] bg-[#FFFAF5] p-5 ring-1 ring-black/[0.055]">
                <div className="flex flex-wrap gap-2">
                  <Pill tone="red">{goalTypeLabels[profileForm.goalType]}</Pill>
                  <Pill tone="cream">
                    {activityLabels[profileForm.activityLevel]}
                  </Pill>
                  <Pill tone="cream">
                    {goalSpeedLabels[profileForm.goalSpeed]}
                  </Pill>
                </div>

                <p className="mt-4 text-sm leading-7 text-[#7A746E]">
                  {goalText(previewProfile)}
                </p>
              </div>
            </PremiumCard>
          </div>

          <aside className="xl:sticky xl:top-8 xl:self-start">
            <PremiumCard tint="white">
              <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start xl:flex-col">
                <SectionTitle
                  title="Cibles nutrition"
                  text="Tu peux appliquer la suggestion ou ajuster manuellement selon le ressenti."
                />

                <SoftButton onClick={applySuggestedGoals}>
                  Appliquer la suggestion
                </SoftButton>
              </div>

              <div className="mt-6 grid gap-4">
                <Field label="Calories / jour">
                  <input
                    value={goalsForm.calories}
                    onChange={(event) =>
                      updateGoalsField("calories", event.target.value)
                    }
                    className="input"
                  />
                </Field>

                <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-1">
                  <Field label="Protéines">
                    <input
                      value={goalsForm.proteinG}
                      onChange={(event) =>
                        updateGoalsField("proteinG", event.target.value)
                      }
                      className="input"
                    />
                  </Field>

                  <Field label="Glucides">
                    <input
                      value={goalsForm.carbsG}
                      onChange={(event) =>
                        updateGoalsField("carbsG", event.target.value)
                      }
                      className="input"
                    />
                  </Field>

                  <Field label="Lipides">
                    <input
                      value={goalsForm.fatG}
                      onChange={(event) =>
                        updateGoalsField("fatG", event.target.value)
                      }
                      className="input"
                    />
                  </Field>
                </div>
              </div>

              <div className="mt-6 rounded-[34px] bg-[#FFFAF5] p-5 ring-1 ring-black/[0.055]">
                <p className="text-sm font-black text-[#171717]">
                  Suggestion actuelle
                </p>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <MiniStat
                    label="Calories"
                    value={`${suggestedGoals.calories}`}
                  />
                  <MiniStat
                    label="Prot."
                    value={`${suggestedGoals.proteinG} g`}
                  />
                  <MiniStat
                    label="Gluc."
                    value={`${suggestedGoals.carbsG} g`}
                  />
                  <MiniStat
                    label="Lip."
                    value={`${suggestedGoals.fatG} g`}
                  />
                </div>
              </div>

              <div className="mt-6 grid gap-3">
                <button
                  type="submit"
                  className="ui-button-primary w-full px-5 py-4 text-sm"
                >
                  Enregistrer les objectifs
                </button>

                <GhostButton
                  onClick={() => {
                    setProfileForm({
                      sex: profile.sex,
                      age: String(profile.age),
                      heightCm: String(profile.heightCm),
                      currentWeightKg: String(profile.currentWeightKg),
                      activityLevel: profile.activityLevel,
                      goalType: profile.goalType,
                      goalSpeed: profile.goalSpeed,
                    });

                    setGoalsForm({
                      calories: String(goals.calories),
                      proteinG: String(goals.proteinG),
                      carbsG: String(goals.carbsG),
                      fatG: String(goals.fatG),
                    });
                  }}
                  className="w-full"
                >
                  Annuler les changements
                </GhostButton>
              </div>
            </PremiumCard>
          </aside>
        </form>
      </div>
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
      <span className="mb-2 block text-sm font-black text-[#171717]">
        {label}
      </span>
      {children}
    </label>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[24px] bg-white p-4 ring-1 ring-black/[0.055]">
      <p className="text-xs font-bold text-[#7A746E]">{label}</p>
      <p className="mt-1 font-black text-[#171717]">{value}</p>
    </div>
  );
}