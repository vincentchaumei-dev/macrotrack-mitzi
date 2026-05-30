"use client";

import { FormEvent, useMemo, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { useNutritionStore } from "@/hooks/useNutritionStore";
import { NutritionGoals, UserProfile } from "@/types/nutrition";
import { calculateRecommendedGoals, calculateTdee, goalTypeLabels } from "@/lib/nutrition";

const activityLabels: Record<string, string> = {
  sedentary: "Sédentaire · 0 entraînement/semaine",
  light: "Légère",
  moderate: "Modérée",
  active: "Active · 5 entraînements/semaine",
  very_active: "Très active · 6+ entraînements/semaine",
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

function getGoalText(profile: UserProfile) {
  if (profile.goalType === "fat_loss") {
    return "Créer un déficit raisonnable, sans rendre les journées impossibles à tenir.";
  }

  if (profile.goalType === "muscle_gain") {
    return "Avoir assez d’énergie pour progresser, sans partir sur un surplus excessif.";
  }

  return "Stabiliser le poids avec des apports cohérents, simples à suivre.";
}

export default function GoalsPage() {
  const { profile, goals, updateProfile, updateGoals } = useNutritionStore();

  const [message, setMessage] = useState("");

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

  function notify(text: string) {
    setMessage(text);
    window.setTimeout(() => setMessage(""), 2400);
  }

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

    notify("Suggestion appliquée.");
  }

  function resetForms() {
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

    notify("Changements annulés.");
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
    notify("Objectifs enregistrés.");
  }

  return (
    <AppShell>
      <form onSubmit={handleSubmit} className="space-y-5">
        <section className="pt-2">
          <p className="text-[12px] font-black uppercase tracking-[0.18em] text-[var(--mt-rouge)]">
            Objectifs
          </p>

          <div className="mt-3 flex items-start justify-between gap-4">
            <div>
              <h1 className="mt-display text-[50px] font-semibold leading-[0.9] tracking-[-0.055em] text-[var(--mt-ink)]">
                Profil
                <br />
                & macros
              </h1>

              <p className="mt-4 max-w-[300px] text-[15px] leading-7 text-[var(--mt-ink-2)]">
                Une base claire pour suivre un objectif sans se prendre la tête.
              </p>
            </div>

            <div className="shrink-0 rounded-[24px] bg-gradient-to-br from-[var(--mt-rouge-lit)] via-[var(--mt-rouge)] to-[var(--mt-rouge-deep)] p-4 text-white shadow-[var(--mt-shadow-red)]">
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-white/62">
                TDEE
              </p>
              <p className="mt-display mt-2 text-[36px] font-semibold leading-none tracking-[-0.05em]">
                {estimatedTdee}
              </p>
              <p className="mt-1 text-[10px] font-black uppercase text-white/62">
                kcal/j
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
          <MacroMini label="Kcal" value={`${goals.calories}`} />
          <MacroMini label="Prot." value={`${goals.proteinG}g`} />
          <MacroMini label="Gluc." value={`${goals.carbsG}g`} />
          <MacroMini label="Lip." value={`${goals.fatG}g`} />
        </section>

        <section className="mt-card overflow-hidden rounded-[28px]">
          <div className="bg-gradient-to-br from-[var(--mt-rouge-lit)] via-[var(--mt-rouge)] to-[var(--mt-rouge-deep)] p-5 text-white">
            <p className="text-[12px] font-black uppercase tracking-[0.18em] text-white/62">
              Objectif actuel
            </p>

            <h2 className="mt-display mt-2 text-[34px] font-semibold leading-none tracking-[-0.04em]">
              {goalTypeLabels[profileForm.goalType]}
            </h2>

            <p className="mt-4 text-[14px] leading-7 text-white/78">
              {getGoalText(previewProfile)}
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              <span className="rounded-full bg-white/16 px-3 py-1.5 text-[11px] font-black text-white backdrop-blur">
                {activityLabels[profileForm.activityLevel]}
              </span>
              <span className="rounded-full bg-white/16 px-3 py-1.5 text-[11px] font-black text-white backdrop-blur">
                {goalSpeedLabels[profileForm.goalSpeed]}
              </span>
            </div>
          </div>
        </section>

        <section className="mt-card rounded-[28px] p-5">
          <SectionHead
            kicker="Étape 1"
            title="Profil"
            text="Ces informations servent à estimer la dépense journalière."
          />

          <div className="mt-5 grid gap-4">
            <Field label="Sexe">
              <div className="grid grid-cols-2 gap-2">
                <ChoiceButton
                  active={profileForm.sex === "female"}
                  onClick={() => updateProfileField("sex", "female")}
                >
                  Femme
                </ChoiceButton>
                <ChoiceButton
                  active={profileForm.sex === "male"}
                  onClick={() => updateProfileField("sex", "male")}
                >
                  Homme
                </ChoiceButton>
              </div>
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Âge">
                <input
                  value={profileForm.age}
                  onChange={(event) =>
                    updateProfileField("age", event.target.value)
                  }
                  className="GoalInput"
                  placeholder="25"
                />
              </Field>

              <Field label="Taille">
                <input
                  value={profileForm.heightCm}
                  onChange={(event) =>
                    updateProfileField("heightCm", event.target.value)
                  }
                  className="GoalInput"
                  placeholder="165"
                />
              </Field>
            </div>

            <Field label="Poids actuel">
              <input
                value={profileForm.currentWeightKg}
                onChange={(event) =>
                  updateProfileField("currentWeightKg", event.target.value)
                }
                className="GoalInput"
                placeholder="60"
              />
            </Field>
          </div>
        </section>

        <section className="mt-card rounded-[28px] p-5">
          <SectionHead
            kicker="Étape 2"
            title="Direction"
            text="Choisis le sens de progression et le rythme souhaité."
          />

          <div className="mt-5 space-y-5">
            <Field label="Type d’objectif">
              <div className="grid gap-2">
                <ChoiceButton
                  active={profileForm.goalType === "fat_loss"}
                  onClick={() => updateProfileField("goalType", "fat_loss")}
                >
                  Perte de poids
                </ChoiceButton>
                <ChoiceButton
                  active={profileForm.goalType === "maintenance"}
                  onClick={() => updateProfileField("goalType", "maintenance")}
                >
                  Maintien
                </ChoiceButton>
                <ChoiceButton
                  active={profileForm.goalType === "muscle_gain"}
                  onClick={() => updateProfileField("goalType", "muscle_gain")}
                >
                  Prise de masse
                </ChoiceButton>
              </div>
            </Field>

            <Field label="Vitesse">
              <div className="grid grid-cols-3 gap-2">
                <ChoiceButton
                  active={profileForm.goalSpeed === "gentle"}
                  onClick={() => updateProfileField("goalSpeed", "gentle")}
                >
                  Doux
                </ChoiceButton>
                <ChoiceButton
                  active={profileForm.goalSpeed === "moderate"}
                  onClick={() => updateProfileField("goalSpeed", "moderate")}
                >
                  Modéré
                </ChoiceButton>
                <ChoiceButton
                  active={profileForm.goalSpeed === "assertive"}
                  onClick={() => updateProfileField("goalSpeed", "assertive")}
                >
                  Rapide
                </ChoiceButton>
              </div>
            </Field>

            <Field label="Activité">
              <select
                value={profileForm.activityLevel}
                onChange={(event) =>
                  updateProfileField("activityLevel", event.target.value)
                }
                className="GoalInput"
              >
                <option value="sedentary">Sédentaire · 0 entraînement/semaine</option>
                <option value="light">Légère · 1 à 2 entraînements/semaine</option>
                <option value="moderate">Modérée · 3 à 4 entraînements/semaine</option>
                <option value="active">Active · 5 entraînements/semaine</option>
                <option value="very_active">Très active · 6+ entraînements/semaine</option>
              </select>
            </Field>
          </div>
        </section>

        <section className="mt-card rounded-[28px] p-5">
          <div className="flex items-start justify-between gap-3">
            <SectionHead
              kicker="Étape 3"
              title="Cibles"
              text="Applique la suggestion ou ajuste manuellement."
            />

            <button
              type="button"
              onClick={applySuggestedGoals}
              className="shrink-0 rounded-full bg-[var(--mt-rouge-wash)] px-3 py-2 text-[11px] font-black text-[var(--mt-rouge-deep)] ring-1 ring-[var(--mt-rouge-soft)]"
            >
              Suggérer
            </button>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <Field label="Calories">
              <input
                value={goalsForm.calories}
                onChange={(event) =>
                  updateGoalsField("calories", event.target.value)
                }
                className="GoalInput"
              />
            </Field>

            <Field label="Protéines">
              <input
                value={goalsForm.proteinG}
                onChange={(event) =>
                  updateGoalsField("proteinG", event.target.value)
                }
                className="GoalInput"
              />
            </Field>

            <Field label="Glucides">
              <input
                value={goalsForm.carbsG}
                onChange={(event) =>
                  updateGoalsField("carbsG", event.target.value)
                }
                className="GoalInput"
              />
            </Field>

            <Field label="Lipides">
              <input
                value={goalsForm.fatG}
                onChange={(event) =>
                  updateGoalsField("fatG", event.target.value)
                }
                className="GoalInput"
              />
            </Field>
          </div>

          <div className="mt-5 rounded-[24px] bg-[var(--mt-card-soft)] p-4 ring-1 ring-[var(--mt-line)]">
            <p className="text-[12px] font-black uppercase tracking-[0.14em] text-[var(--mt-rouge)]">
              Suggestion actuelle
            </p>

            <div className="mt-4 grid grid-cols-4 gap-2">
              <SuggestionMini label="Kcal" value={`${suggestedGoals.calories}`} />
              <SuggestionMini label="P" value={`${suggestedGoals.proteinG}g`} />
              <SuggestionMini label="G" value={`${suggestedGoals.carbsG}g`} />
              <SuggestionMini label="L" value={`${suggestedGoals.fatG}g`} />
            </div>
          </div>
        </section>

        <section className="grid gap-2">
          <button type="submit" className="mt-btn-primary">
            Enregistrer les objectifs
          </button>

          <button
            type="button"
            onClick={resetForms}
            className="rounded-[18px] bg-white px-4 py-4 text-[13px] font-black text-[var(--mt-ink)] shadow-[var(--mt-shadow-sm)] ring-1 ring-[var(--mt-line)]"
          >
            Annuler les changements
          </button>
        </section>

        <div className="h-10" />
      </form>
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
  children: React.ReactNode;
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

function ChoiceButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-[18px] px-3 py-3 text-[12px] font-black ${
        active
          ? "bg-[var(--mt-rouge)] text-white shadow-[var(--mt-shadow-red)]"
          : "bg-[var(--mt-card-soft)] text-[var(--mt-ink)] ring-1 ring-[var(--mt-line)]"
      }`}
    >
      {children}
    </button>
  );
}

function MacroMini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[18px] bg-white p-3 shadow-[var(--mt-shadow-sm)] ring-1 ring-[var(--mt-line)]">
      <p className="text-[10px] font-black uppercase text-[var(--mt-ink-3)]">
        {label}
      </p>
      <p className="mt-2 text-[17px] font-black leading-none tracking-[-0.03em] text-[var(--mt-ink)]">
        {value}
      </p>
    </div>
  );
}

function SuggestionMini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[16px] bg-white p-3 text-center ring-1 ring-[var(--mt-line)]">
      <p className="text-[10px] font-black uppercase text-[var(--mt-ink-3)]">
        {label}
      </p>
      <p className="mt-1 text-[13px] font-black text-[var(--mt-ink)]">
        {value}
      </p>
    </div>
  );
}