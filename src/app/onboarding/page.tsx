"use client";

import { useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useNutritionStore } from "@/hooks/useNutritionStore";
import { NutritionGoals, UserProfile } from "@/types/nutrition";
import { calculateTdee, goalTypeLabels } from "@/lib/nutrition";

type Step = 0 | 1 | 2 | 3 | 4 | 5;

type ProfileFormState = {
  sex: string;
  age: string;
  heightCm: string;
  currentWeightKg: string;
  activityLevel: string;
  goalType: string;
  goalSpeed: string;
};

type ProfileFormKey = keyof ProfileFormState;
type UpdateProfileField = (key: ProfileFormKey, value: string) => void;

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

const activities = [
  {
    value: "sedentary",
    label: "Sédentaire",
    text: "Peu de marche ou activité physique.",
  },
  {
    value: "light",
    label: "Légère",
    text: "Un peu de marche, quelques entraînements.",
  },
  {
    value: "moderate",
    label: "Modérée",
    text: "Activité régulière dans la semaine.",
  },
  {
    value: "active",
    label: "Active",
    text: "Sport fréquent ou journées actives.",
  },
  {
    value: "very_active",
    label: "Très active",
    text: "Sport intense ou activité physique élevée.",
  },
];

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

function getGoalLabel(goalType: string) {
  return goalTypeLabels[goalType as keyof typeof goalTypeLabels] ?? "Objectif";
}

function getGoalText(profile: UserProfile) {
  if (profile.goalType === "fat_loss") {
    return "On part sur une base douce, avec un déficit raisonnable et ajustable.";
  }

  if (profile.goalType === "muscle_gain") {
    return "On part sur une base plus énergique, pour progresser sans surplus excessif.";
  }

  return "On part sur une base stable, simple à suivre au quotidien.";
}

export default function OnboardingPage() {
  const router = useRouter();
  const { profile, hasLoaded, completeOnboarding } = useNutritionStore();

  const [step, setStep] = useState<Step>(0);

  const [profileForm, setProfileForm] = useState<ProfileFormState>({
    sex: profile.sex,
    age: String(profile.age),
    heightCm: String(profile.heightCm),
    currentWeightKg: String(profile.currentWeightKg),
    activityLevel: profile.activityLevel,
    goalType: profile.goalType,
    goalSpeed: profile.goalSpeed,
  });

  const previewProfile: UserProfile = useMemo(
    () =>
      ({
        sex: profileForm.sex,
        age: parseNumber(profileForm.age),
        heightCm: parseNumber(profileForm.heightCm),
        currentWeightKg: parseNumber(profileForm.currentWeightKg),
        activityLevel: profileForm.activityLevel,
        goalType: profileForm.goalType,
        goalSpeed: profileForm.goalSpeed,
      }) as UserProfile,
    [profileForm]
  );

  const estimatedTdee = useMemo(
    () => calculateTdee(previewProfile),
    [previewProfile]
  );

  const suggestedGoals = useMemo(
    () => calculateSuggestedGoals(previewProfile),
    [previewProfile]
  );

  function updateProfileField(key: ProfileFormKey, value: string) {
    setProfileForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function goNext() {
    setStep((current) => Math.min(5, current + 1) as Step);
  }

  function goBack() {
    setStep((current) => Math.max(0, current - 1) as Step);
  }

  function finishOnboarding() {
    completeOnboarding(previewProfile, suggestedGoals);
    router.push("/");
  }

  if (!hasLoaded) {
    return (
      <div className="mt-app-bg grid min-h-[100svh] place-items-center">
        <p className="text-sm font-black text-[var(--mt-ink-2)]">
          Chargement...
        </p>
      </div>
    );
  }

  return (
    <div className="mt-app-bg">
      <main className="mt-phone-shell min-h-[100svh] bg-[var(--mt-bg)]">
        <section className="OnboardingHero">
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div className="grid h-12 w-12 place-items-center rounded-[18px] border border-white/25 bg-white/18 font-[var(--mt-display)] text-xl font-semibold text-white backdrop-blur">
                M
              </div>

              <span className="rounded-full bg-white/16 px-3 py-2 text-[11px] font-black uppercase tracking-[0.14em] text-white backdrop-blur">
                Configuration
              </span>
            </div>

            <div className="mt-10">
              <p className="text-[12px] font-black uppercase tracking-[0.2em] text-white/64">
                MacroTrack Personal
              </p>

              <h1 className="mt-display mt-4 text-[54px] font-semibold leading-[0.88] tracking-[-0.06em] text-white">
                On part
                <br />
                sur de
                <br />
                bonnes bases.
              </h1>

              <p className="mt-6 max-w-[310px] text-[15px] leading-7 text-white/78">
                Quelques questions pour créer une base nutrition simple,
                rassurante et ajustable.
              </p>
            </div>
          </div>
        </section>

        <section className="OnboardingSheet">
          <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-[var(--mt-line-2)]" />

          <ProgressDots step={step} />

          {step === 0 && <WelcomeStep onNext={goNext} />}

          {step === 1 && (
            <ProfileStep
              profileForm={profileForm}
              updateProfileField={updateProfileField}
              onBack={goBack}
              onNext={goNext}
            />
          )}

          {step === 2 && (
            <GoalStep
              profileForm={profileForm}
              updateProfileField={updateProfileField}
              onBack={goBack}
              onNext={goNext}
            />
          )}

          {step === 3 && (
            <ActivityStep
              profileForm={profileForm}
              updateProfileField={updateProfileField}
              onBack={goBack}
              onNext={goNext}
            />
          )}

          {step === 4 && (
            <SuggestionStep
              profile={previewProfile}
              estimatedTdee={estimatedTdee}
              suggestedGoals={suggestedGoals}
              onBack={goBack}
              onNext={goNext}
            />
          )}

          {step === 5 && (
            <FinalStep
              profile={previewProfile}
              suggestedGoals={suggestedGoals}
              onBack={goBack}
              onFinish={finishOnboarding}
            />
          )}
        </section>
      </main>
    </div>
  );
}

function WelcomeStep({ onNext }: { onNext: () => void }) {
  return (
    <div>
      <StepKicker>Bienvenue</StepKicker>

      <h2 className="OnboardingTitle">
        Une app nutrition douce, pas culpabilisante.
      </h2>

      <p className="OnboardingText">
        L’objectif n’est pas d’être parfaite tous les jours. L’objectif, c’est
        de rendre les tendances visibles et les choix plus simples.
      </p>

      <div className="mt-6 grid gap-3">
        <OnboardingInfo
          title="Simple au quotidien"
          text="Ajout de repas, repas types, aliments favoris et suivi du poids."
        />
        <OnboardingInfo
          title="Ajustable"
          text="Les objectifs peuvent être changés à tout moment."
        />
        <OnboardingInfo
          title="Sans pression"
          text="On regarde surtout la moyenne et la progression."
        />
      </div>

      <div className="mt-6">
        <button type="button" onClick={onNext} className="mt-btn-primary">
          Commencer
        </button>
      </div>
    </div>
  );
}

function ProfileStep({
  profileForm,
  updateProfileField,
  onBack,
  onNext,
}: {
  profileForm: ProfileFormState;
  updateProfileField: UpdateProfileField;
  onBack: () => void;
  onNext: () => void;
}) {
  return (
    <div>
      <StepKicker>Étape 1</StepKicker>
      <h2 className="OnboardingTitle">Ton profil</h2>
      <p className="OnboardingText">
        Ces infos servent uniquement à estimer une base de départ cohérente.
      </p>

      <div className="mt-6 grid gap-4">
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
              onChange={(event) => updateProfileField("age", event.target.value)}
              className="OnboardingInput"
              placeholder="25"
            />
          </Field>

          <Field label="Taille">
            <input
              value={profileForm.heightCm}
              onChange={(event) =>
                updateProfileField("heightCm", event.target.value)
              }
              className="OnboardingInput"
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
            className="OnboardingInput"
            placeholder="60"
          />
        </Field>
      </div>

      <Actions onBack={onBack} onNext={onNext} />
    </div>
  );
}

function GoalStep({
  profileForm,
  updateProfileField,
  onBack,
  onNext,
}: {
  profileForm: ProfileFormState;
  updateProfileField: UpdateProfileField;
  onBack: () => void;
  onNext: () => void;
}) {
  return (
    <div>
      <StepKicker>Étape 2</StepKicker>
      <h2 className="OnboardingTitle">Ton objectif</h2>
      <p className="OnboardingText">
        On choisit une direction. Rien n’est figé, tu pourras modifier ça plus
        tard.
      </p>

      <div className="mt-6 grid gap-5">
        <Field label="Objectif">
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

        <Field label="Rythme">
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
      </div>

      <Actions onBack={onBack} onNext={onNext} />
    </div>
  );
}

function ActivityStep({
  profileForm,
  updateProfileField,
  onBack,
  onNext,
}: {
  profileForm: ProfileFormState;
  updateProfileField: UpdateProfileField;
  onBack: () => void;
  onNext: () => void;
}) {
  return (
    <div>
      <StepKicker>Étape 3</StepKicker>
      <h2 className="OnboardingTitle">Ton activité</h2>
      <p className="OnboardingText">
        Ça sert à estimer ta dépense journalière. On pourra ajuster ensuite avec
        les résultats réels.
      </p>

      <div className="mt-6 grid gap-2">
        {activities.map((activity) => (
          <ActivityChoice
            key={activity.value}
            active={profileForm.activityLevel === activity.value}
            label={activity.label}
            text={activity.text}
            onClick={() => updateProfileField("activityLevel", activity.value)}
          />
        ))}
      </div>

      <Actions onBack={onBack} onNext={onNext} />
    </div>
  );
}

function SuggestionStep({
  profile,
  estimatedTdee,
  suggestedGoals,
  onBack,
  onNext,
}: {
  profile: UserProfile;
  estimatedTdee: number;
  suggestedGoals: NutritionGoals;
  onBack: () => void;
  onNext: () => void;
}) {
  return (
    <div>
      <StepKicker>Étape 4</StepKicker>
      <h2 className="OnboardingTitle">Ta base de départ</h2>
      <p className="OnboardingText">
        L’app propose une base simple. Ce n’est pas une règle définitive, juste
        un point de départ.
      </p>

      <div className="mt-6 overflow-hidden rounded-[28px] bg-gradient-to-br from-[var(--mt-rouge-lit)] via-[var(--mt-rouge)] to-[var(--mt-rouge-deep)] p-5 text-white shadow-[var(--mt-shadow-red)]">
        <p className="text-[12px] font-black uppercase tracking-[0.18em] text-white/62">
          Dépense estimée
        </p>

        <div className="mt-3 flex items-end gap-2">
          <p className="mt-display text-[56px] font-semibold leading-[0.85] tracking-[-0.06em]">
            {estimatedTdee}
          </p>
          <p className="mb-1 text-[14px] font-black text-white/68">kcal/j</p>
        </div>

        <p className="mt-5 text-[14px] leading-7 text-white/78">
          {getGoalText(profile)}
        </p>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <SuggestionCard label="Calories" value={`${suggestedGoals.calories}`} />
        <SuggestionCard label="Protéines" value={`${suggestedGoals.proteinG}g`} />
        <SuggestionCard label="Glucides" value={`${suggestedGoals.carbsG}g`} />
        <SuggestionCard label="Lipides" value={`${suggestedGoals.fatG}g`} />
      </div>

      <Actions onBack={onBack} onNext={onNext} nextLabel="Valider la base" />
    </div>
  );
}

function FinalStep({
  profile,
  suggestedGoals,
  onBack,
  onFinish,
}: {
  profile: UserProfile;
  suggestedGoals: NutritionGoals;
  onBack: () => void;
  onFinish: () => void;
}) {
  return (
    <div>
      <StepKicker>Dernière étape</StepKicker>
      <h2 className="OnboardingTitle">Tout est prêt.</h2>
      <p className="OnboardingText">
        On démarre avec une base claire, douce et ajustable. Le plus important :
        la régularité, pas la perfection.
      </p>

      <div className="mt-6 grid gap-3">
        <SummaryRow title="Objectif" value={getGoalLabel(profile.goalType)} />
        <SummaryRow
          title="Rythme"
          value={goalSpeedLabels[profile.goalSpeed] ?? "Modéré"}
        />
        <SummaryRow
          title="Activité"
          value={activityLabels[profile.activityLevel] ?? "Activité modérée"}
        />
        <SummaryRow
          title="Calories"
          value={`${suggestedGoals.calories} kcal/j`}
        />
      </div>

      <div className="mt-6 rounded-[24px] border border-[var(--mt-rouge-soft)] bg-[var(--mt-rouge-wash)] p-4">
        <p className="text-[13px] font-bold leading-6 text-[var(--mt-rouge-deep)]">
          Tu pourras tout modifier ensuite dans les objectifs. Rien n’est bloqué.
        </p>
      </div>

      <div className="mt-6 grid gap-2">
        <button type="button" onClick={onFinish} className="mt-btn-primary">
          Entrer dans l’app
        </button>

        <button type="button" onClick={onBack} className="OnboardingBackButton">
          Retour
        </button>
      </div>
    </div>
  );
}

function ProgressDots({ step }: { step: Step }) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className={`h-2 flex-1 rounded-full ${
              index <= step ? "bg-[var(--mt-rouge)]" : "bg-[var(--mt-line-2)]"
            }`}
          />
        ))}
      </div>
      <p className="mt-3 text-[11px] font-black uppercase tracking-[0.14em] text-[var(--mt-ink-3)]">
        {step + 1} / 6
      </p>
    </div>
  );
}

function StepKicker({ children }: { children: ReactNode }) {
  return (
    <p className="text-[12px] font-black uppercase tracking-[0.18em] text-[var(--mt-rouge)]">
      {children}
    </p>
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

function ChoiceButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
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

function ActivityChoice({
  active,
  label,
  text,
  onClick,
}: {
  active: boolean;
  label: string;
  text: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-[22px] p-4 text-left ${
        active
          ? "bg-[var(--mt-rouge)] text-white shadow-[var(--mt-shadow-red)]"
          : "bg-white text-[var(--mt-ink)] shadow-[var(--mt-shadow-sm)] ring-1 ring-[var(--mt-line)]"
      }`}
    >
      <p className="text-[15px] font-black">{label}</p>
      <p
        className={`mt-1 text-[12px] leading-5 ${
          active ? "text-white/74" : "text-[var(--mt-ink-2)]"
        }`}
      >
        {text}
      </p>
    </button>
  );
}

function SuggestionCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[22px] bg-white p-4 shadow-[var(--mt-shadow-sm)] ring-1 ring-[var(--mt-line)]">
      <p className="text-[11px] font-black uppercase text-[var(--mt-ink-3)]">
        {label}
      </p>
      <p className="mt-3 text-[26px] font-black leading-none tracking-[-0.04em] text-[var(--mt-ink)]">
        {value}
      </p>
    </div>
  );
}

function SummaryRow({ title, value }: { title: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-[20px] bg-white p-4 shadow-[var(--mt-shadow-sm)] ring-1 ring-[var(--mt-line)]">
      <span className="text-[13px] font-bold text-[var(--mt-ink-2)]">
        {title}
      </span>
      <span className="text-right text-[14px] font-black text-[var(--mt-ink)]">
        {value}
      </span>
    </div>
  );
}

function OnboardingInfo({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-[22px] bg-white p-4 shadow-[var(--mt-shadow-sm)] ring-1 ring-[var(--mt-line)]">
      <p className="text-[15px] font-black text-[var(--mt-ink)]">{title}</p>
      <p className="mt-1 text-[13px] leading-6 text-[var(--mt-ink-2)]">
        {text}
      </p>
    </div>
  );
}

function Actions({
  onBack,
  onNext,
  nextLabel = "Continuer",
}: {
  onBack: () => void;
  onNext: () => void;
  nextLabel?: string;
}) {
  return (
    <div className="mt-6 grid gap-2">
      <button type="button" onClick={onNext} className="mt-btn-primary">
        {nextLabel}
      </button>

      <button type="button" onClick={onBack} className="OnboardingBackButton">
        Retour
      </button>
    </div>
  );
}