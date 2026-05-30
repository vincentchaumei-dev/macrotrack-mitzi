"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { useNutritionStore } from "@/hooks/useNutritionStore";
import {
  calculateDayTotals,
  calculateTdee,
  formatMacro,
  goalTypeLabels,
  mealTypeLabels,
  todayLocalDate,
} from "@/lib/nutrition";
import { Food, Meal, MealType } from "@/types/nutrition";

const mealTypeOrder: MealType[] = ["breakfast", "lunch", "dinner", "snack"];

const personalMessage =
  "Bienvenue sur l'app beauty, wlh t parfaite, j'ai essayé de rendre le truc le plus didactique possible si t'as question reach me : tu me call jour et nuit ou au pire tu me dis je prends un vol pour Bilbao, hésite pas à me dire, je suis tout à ta disposition, pas de culpabilisation, juste un tracking rien ne sert d'être parfait sur une journée et culpabiliser une autre, c'est un tout, et tu fais déjà le plus important : me parler, t parfait et somptueuse, keep up la cadence chérie t'es o top";

function toNumber(value: number | null | undefined) {
  return typeof value === "number" ? value : 0;
}

function getPercent(value: number, target: number) {
  if (target <= 0) return 0;
  return Math.min(100, Math.round((value / target) * 100));
}

function formatWeekDay(date: Date) {
  return new Intl.DateTimeFormat("fr-FR", { weekday: "short" })
    .format(date)
    .slice(0, 1)
    .toUpperCase();
}

function getWeekDays(selectedDate: string) {
  const base = new Date(`${selectedDate}T12:00:00`);
  const day = base.getDay() === 0 ? 7 : base.getDay();
  const monday = new Date(base);
  monday.setDate(base.getDate() - day + 1);

  return Array.from({ length: 7 }, (_, index) => {
    const current = new Date(monday);
    current.setDate(monday.getDate() + index);

    const date = current.toISOString().slice(0, 10);

    return {
      label: formatWeekDay(current),
      number: String(current.getDate()).padStart(2, "0"),
      date,
      active: date === selectedDate,
    };
  });
}

function shiftLocalDate(date: string, offset: number) {
  const current = new Date(`${date}T12:00:00`);
  current.setDate(current.getDate() + offset);
  return current.toISOString().slice(0, 10);
}

function formatSelectedDate(date: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(`${date}T12:00:00`));
}

function getMealGradient(index: number) {
  const gradients = [
    "linear-gradient(140deg,#F2C94C,#E8A23D)",
    "linear-gradient(140deg,#A8C66C,#6E9B3E)",
    "linear-gradient(140deg,#E8455F,#B5304B)",
    "linear-gradient(140deg,#6E7CA6,#39446F)",
  ];

  return gradients[index % gradients.length];
}

function getRecentFoods(meals: Meal[], foods: Food[], limit = 8) {
  const foodsById = new Map(foods.map((food) => [food.id, food]));
  const seen = new Set<string>();
  const recentFoods: Food[] = [];

  [...meals]
    .sort((a, b) => {
      const aTime = a.updatedAt || a.createdAt;
      const bTime = b.updatedAt || b.createdAt;
      return bTime.localeCompare(aTime);
    })
    .forEach((meal) => {
      [...meal.items].reverse().forEach((item) => {
        if (seen.has(item.foodId)) return;

        const food = foodsById.get(item.foodId);

        if (!food) return;

        seen.add(item.foodId);
        recentFoods.push(food);
      });
    });

  return recentFoods.slice(0, limit);
}

function getCoachText({
  caloriesRemaining,
  protein,
  proteinTarget,
}: {
  caloriesRemaining: number;
  protein: number;
  proteinTarget: number;
}) {
  const proteinRemaining = Math.max(0, proteinTarget - protein);

  if (caloriesRemaining > 0) {
    return (
      <>
        Il reste <b>{caloriesRemaining} kcal</b>
        {proteinRemaining > 0 ? (
          <>
            {" "}
            et <b>{proteinRemaining} g de protéines</b>
          </>
        ) : null}{" "}
        pour atteindre la base du jour.
      </>
    );
  }

  return (
    <>
      Un peu au-dessus aujourd’hui. Rien de dramatique : ce qui compte, c’est la{" "}
      <b>moyenne</b> et la régularité.
    </>
  );
}

export default function Home() {
  const router = useRouter();

  const {
    profile,
    goals,
    foods,
    meals: allMeals,
    getMealsByDate,
    copyDay,
    hasLoaded,
    onboardingCompleted,
  } = useNutritionStore();

  const today = todayLocalDate();
  const [selectedDate, setSelectedDate] = useState(today);
  const [flashMessage, setFlashMessage] = useState("");

  const weekDays = useMemo(() => getWeekDays(selectedDate), [selectedDate]);
  const meals = getMealsByDate(selectedDate);
  const totals = calculateDayTotals(meals);

  const selectedDateTitle =
    selectedDate === today ? "Aujourd’hui" : formatSelectedDate(selectedDate);

  function goToPreviousDay() {
    setSelectedDate((current) => shiftLocalDate(current, -1));
  }

  function goToNextDay() {
    setSelectedDate((current) => shiftLocalDate(current, 1));
  }

  function notify(message: string) {
    setFlashMessage(message);
    window.setTimeout(() => setFlashMessage(""), 2600);
  }

  function handleCopyPreviousDay() {
    const sourceDate = shiftLocalDate(selectedDate, -1);

    if (meals.length > 0) {
      const confirmed = window.confirm(
        "Cette journée contient déjà des repas. Copier la veille va les ajouter en plus. Tu continues ?"
      );

      if (!confirmed) return;
    }

    const copiedCount = copyDay(sourceDate, selectedDate);

    if (copiedCount === 0) {
      notify("Aucun repas trouvé sur la veille.");
      return;
    }

    notify(
      `${copiedCount} repas copié${copiedCount > 1 ? "s" : ""} depuis la veille.`
    );
  }

  const calories = toNumber(totals.calories);
  const protein = toNumber(totals.proteinG);
  const carbs = toNumber(totals.carbsG);
  const fat = toNumber(totals.fatG);

  const caloriesRemaining = goals.calories - calories;
  const proteinRemaining = Math.max(0, goals.proteinG - protein);

  const caloriePercent = getPercent(calories, goals.calories);
  const proteinPercent = getPercent(protein, goals.proteinG);
  const carbsPercent = getPercent(carbs, goals.carbsG);
  const fatPercent = getPercent(fat, goals.fatG);

  const tdee = calculateTdee(profile);

  const weeklyData = useMemo(
    () =>
      weekDays.map((day) => {
        const dayMeals = allMeals.filter((meal) => meal.date === day.date);
        const dayTotals = calculateDayTotals(dayMeals);
        const dayCalories = toNumber(dayTotals.calories);

        return {
          ...day,
          calories: dayCalories,
          percent: getPercent(dayCalories, goals.calories),
          tracked: dayMeals.length > 0,
        };
      }),
    [allMeals, goals.calories, weekDays]
  );

  const trackedDays = weeklyData.filter((day) => day.tracked).length;
  const weeklyAverage =
    trackedDays > 0
      ? Math.round(
          weeklyData.reduce((sum, day) => sum + day.calories, 0) / trackedDays
        )
      : 0;

  const recentFoods = useMemo(
    () => getRecentFoods(allMeals, foods, 8),
    [allMeals, foods]
  );

  const favoriteFoods = useMemo(
    () => foods.filter((food) => food.isFavorite).slice(0, 8),
    [foods]
  );

  const quickFoods = recentFoods.length > 0 ? recentFoods : favoriteFoods;

  useEffect(() => {
    if (hasLoaded && !onboardingCompleted) {
      router.push("/onboarding");
    }
  }, [hasLoaded, onboardingCompleted, router]);

  if (!hasLoaded || !onboardingCompleted) {
    return (
      <AppShell>
        <div className="grid min-h-[100svh] place-items-center">
          <p className="text-sm font-bold text-[var(--mt-ink-2)]">
            Chargement...
          </p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="min-h-[100svh] bg-[var(--mt-bg)]">
        {flashMessage ? (
          <div className="mt-dashboard-toast">{flashMessage}</div>
        ) : null}

        <section className="mt-immersive">
          <div className="mt-immersive-inner">
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-3">
                <div className="grid h-[42px] w-[42px] overflow-hidden rounded-[14px] border border-white/25 bg-white/20 backdrop-blur">
                  <img
                    src="/brand/macrotrack-logo.png"
                    alt=""
                    aria-hidden="true"
                    className="h-full w-full object-cover"
                  />
                </div>

                <div>
                  <p className="text-[11.5px] font-semibold text-white/75">
                    Bonjour,
                  </p>
                  <p className="text-[18px] font-black leading-none tracking-[-0.03em] text-white">
                    MacroTrack
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <Link
                  href="/goals"
                  className="grid h-10 w-10 place-items-center rounded-[13px] border border-white/20 bg-white/16 text-white backdrop-blur"
                  aria-label="Objectifs"
                >
                  <SettingsIcon />
                </Link>

                <Link
                  href="/settings"
                  className="grid h-10 w-10 place-items-center rounded-[13px] border border-white/20 bg-white/16 text-white backdrop-blur"
                  aria-label="Paramètres"
                >
                  <BellIcon />
                </Link>
              </div>
            </div>

            <div className="mt-week">
              {weeklyData.map((day) => (
                <button
                  key={day.date}
                  type="button"
                  onClick={() => setSelectedDate(day.date)}
                  aria-pressed={day.active}
                  className={`mt-week-day ${day.active ? "mt-week-active" : ""}`}
                >
                  <div className="mt-week-label">{day.label}</div>
                  <div className="mt-week-num">{day.number}</div>
                </button>
              ))}
            </div>

            <div className="mt-dashboard-date-nav">
              <button
                type="button"
                onClick={goToPreviousDay}
                className="mt-date-chip mt-date-chip--ghost"
              >
                <span className="mt-date-chip-arrow">←</span>
                <span>Veille</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedDate(today)}
                className="mt-date-chip mt-date-chip--primary"
              >
                Aujourd’hui
              </button>

              <button
                type="button"
                onClick={goToNextDay}
                className="mt-date-chip mt-date-chip--ghost"
              >
                <span>Demain</span>
                <span className="mt-date-chip-arrow">→</span>
              </button>
            </div>

            <div className="mt-big-cal">
              <div className="mt-big-cal-number">
                {Math.max(0, caloriesRemaining)}
              </div>
              <div className="mt-big-cal-label">
                kcal restantes · <b>{calories}</b> / {goals.calories} consommées
              </div>
            </div>

            <div className="mt-progress-line">
              <i style={{ width: `${caloriePercent}%` }} />
            </div>

            <div className="mt-immersive-macros">
              <MacroGlass
                label="Protéines"
                value={protein}
                target={goals.proteinG}
                percent={proteinPercent}
              />
              <MacroGlass
                label="Glucides"
                value={carbs}
                target={goals.carbsG}
                percent={carbsPercent}
              />
              <MacroGlass
                label="Lipides"
                value={fat}
                target={goals.fatG}
                percent={fatPercent}
              />
            </div>
          </div>
        </section>

        <section className="mt-sheet">
          <div className="mt-sheet-grip" />

          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[var(--mt-rouge)]">
                {goalTypeLabels[profile.goalType]} · TDEE {tdee} kcal
              </p>
              <h1 className="mt-display mt-1 text-[24px] font-black tracking-[-0.04em] text-[var(--mt-ink)]">
                {selectedDateTitle}
              </h1>
            </div>

            <Link
              href="/add"
              className="rounded-full bg-[var(--mt-rouge)] px-4 py-3 text-[12px] font-black text-white shadow-[var(--mt-shadow-red)]"
            >
              Ajouter
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <MetricCard
              label="Calories"
              value={`${Math.max(0, caloriesRemaining)}`}
              detail="restantes"
            />
            <MetricCard
              label="Protéines"
              value={`${proteinRemaining}g`}
              detail="restantes"
            />
          </div>

          <section className="mt-card mt-4 rounded-[24px] p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[var(--mt-rouge)]">
                  Actions rapides
                </p>
                <h2 className="mt-display mt-1 text-[22px] font-black tracking-[-0.04em] text-[var(--mt-ink)]">
                  Gagner du temps
                </h2>
              </div>

              <Link
                href="/add"
                className="text-[12px] font-black text-[var(--mt-rouge)]"
              >
                Ajouter
              </Link>
            </div>

            <div className="mt-4 grid gap-2">
              <QuickActionButton
                title="Ajouter un repas"
                description="Créer un repas étape par étape."
                href="/add"
                tone="primary"
              />

              <QuickActionButton
                title="Voir les bases pré-faites"
                description="Choisir tranquillement un repas type."
                href="/recipes"
              />

              <QuickActionButton
                title="Copier la veille"
                description="Reprendre les repas de la journée précédente."
                onClick={handleCopyPreviousDay}
              />
            </div>
          </section>

          <section className="mt-card mt-4 rounded-[24px] p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[var(--mt-rouge)]">
                  Semaine
                </p>
                <h2 className="mt-display mt-1 text-[22px] font-black tracking-[-0.04em] text-[var(--mt-ink)]">
                  Vue rapide
                </h2>
              </div>

              <div className="text-right">
                <p className="text-[18px] font-black text-[var(--mt-ink)]">
                  {trackedDays}/7
                </p>
                <p className="text-[10px] font-black uppercase text-[var(--mt-ink-3)]">
                  jours
                </p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-7 gap-1.5">
              {weeklyData.map((day) => (
                <div key={day.date} className="text-center">
                  <div className="mx-auto flex h-16 w-full max-w-[30px] items-end rounded-full bg-[var(--mt-card-soft)] p-1 ring-1 ring-[var(--mt-line)]">
                    <div
                      className={`w-full rounded-full ${
                        day.active
                          ? "bg-[var(--mt-rouge)]"
                          : "bg-[var(--mt-rouge-soft)]"
                      }`}
                      style={{ height: `${Math.max(8, day.percent)}%` }}
                    />
                  </div>
                  <p className="mt-2 text-[10px] font-black text-[var(--mt-ink-3)]">
                    {day.label}
                  </p>
                </div>
              ))}
            </div>

            <p className="mt-4 text-[12.5px] font-bold leading-6 text-[var(--mt-ink-2)]">
              Moyenne suivie :{" "}
              <span className="font-black text-[var(--mt-ink)]">
                {trackedDays > 0
                  ? `${weeklyAverage} kcal`
                  : "pas encore assez de données"}
              </span>
            </p>
          </section>

          <section className="mt-card mt-4 rounded-[24px] p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[var(--mt-rouge)]">
                  Repas
                </p>
                <h2 className="mt-display mt-1 text-[22px] font-black tracking-[-0.04em] text-[var(--mt-ink)]">
                  Journée
                </h2>
              </div>

              <Link
                href="/journal"
                className="text-[12px] font-black text-[var(--mt-rouge)]"
              >
                Journal
              </Link>
            </div>

            <div className="mt-4 grid gap-3">
              {mealTypeOrder.map((mealType, index) => (
                <MealTypeCard
                  key={mealType}
                  mealType={mealType}
                  meals={meals.filter((meal) => meal.type === mealType)}
                  index={index}
                />
              ))}
            </div>
          </section>

          {quickFoods.length > 0 && (
            <section className="mt-card mt-4 rounded-[24px] p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[var(--mt-rouge)]">
                    Ajout rapide
                  </p>
                  <h2 className="mt-display mt-1 text-[22px] font-black tracking-[-0.04em] text-[var(--mt-ink)]">
                    {recentFoods.length > 0 ? "Récents" : "Favoris"}
                  </h2>
                </div>

                <Link
                  href="/add"
                  className="text-[12px] font-black text-[var(--mt-rouge)]"
                >
                  Ajouter
                </Link>
              </div>

              <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
                {quickFoods.map((food) => (
                  <Link
                  key={food.id}
                  href="/add"
                  className="mt-quick-food-card"
                >
                    <div className="grid h-9 w-9 place-items-center rounded-[13px] bg-[var(--mt-rouge-wash)] text-[var(--mt-rouge-deep)]">
                      <span className="text-[15px] font-black">
                        {food.name.slice(0, 1).toUpperCase()}
                      </span>
                    </div>
                    <p className="mt-3 line-clamp-2 text-[12px] font-black leading-tight text-[var(--mt-ink)]">
                      {food.name}
                    </p>
                    <p className="mt-2 text-[10px] font-bold text-[var(--mt-ink-3)]">
                      {food.servingSizeG
                        ? `${food.servingName || "Portion"} · ${food.servingSizeG}g`
                        : `${food.caloriesPer100g ?? "—"} kcal`}
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          )}

          <section className="mt-card mt-4 rounded-[24px] p-4">
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[var(--mt-rouge)]">
              Petit mot pour toi
            </p>
            <p className="mt-personal-note">{personalMessage}</p>
          </section>

          <div className="mt-insight mt-4">
            <div className="mt-insight-icon">
              <LightIcon />
            </div>
            <p>
              {getCoachText({
                caloriesRemaining,
                protein,
                proteinTarget: goals.proteinG,
              })}
            </p>
          </div>

          <div className="h-20" />
        </section>
      </div>
    </AppShell>
  );
}

function QuickActionButton({
  title,
  description,
  href,
  onClick,
  tone = "neutral",
}: {
  title: string;
  description: string;
  href?: string;
  onClick?: () => void;
  tone?: "primary" | "neutral";
}) {
  const className =
    tone === "primary"
      ? "mt-quick-action mt-quick-action-primary"
      : "mt-quick-action";

  const content = (
    <>
      <span>
        <b>{title}</b>
        <small>{description}</small>
      </span>
      <em>→</em>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={className}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={className}>
      {content}
    </button>
  );
}

function MacroGlass({
  label,
  value,
  target,
  percent,
}: {
  label: string;
  value: number;
  target: number;
  percent: number;
}) {
  return (
    <div className="mt-immersive-macro">
      <div className="mt-immersive-macro-label">{label}</div>
      <div className="mt-immersive-macro-value">
        {value}
        <small>/{target}g</small>
      </div>
      <div className="mt-mini-bar">
        <i style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="mt-card rounded-[24px] p-4">
      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[var(--mt-ink-3)]">
        {label}
      </p>
      <p className="mt-2 text-[26px] font-black tracking-[-0.05em] text-[var(--mt-ink)]">
        {value}
      </p>
      <p className="mt-1 text-[12px] font-bold text-[var(--mt-ink-2)]">
        {detail}
      </p>
    </div>
  );
}

function MealTypeCard({
  mealType,
  meals,
  index,
}: {
  mealType: MealType;
  meals: Meal[];
  index: number;
}) {
  const totals = calculateDayTotals(meals);
  const hasMeals = meals.length > 0;

  return (
    <article className="flex items-center gap-3 rounded-[22px] bg-[var(--mt-card-soft)] p-3 ring-1 ring-[var(--mt-line)]">
      <div
        className="h-12 w-12 shrink-0 rounded-[16px]"
        style={{ background: getMealGradient(index) }}
      />

      <div className="min-w-0 flex-1">
        <p className="text-[14px] font-black text-[var(--mt-ink)]">
          {mealTypeLabels[mealType]}
        </p>

        {hasMeals ? (
          <p className="mt-1 line-clamp-1 text-[12px] font-bold text-[var(--mt-ink-2)]">
            {meals
              .map((meal) => meal.name || mealTypeLabels[meal.type])
              .join(", ")}
          </p>
        ) : (
          <p className="mt-1 text-[12px] font-bold text-[var(--mt-ink-3)]">
            Pas encore ajouté
          </p>
        )}
      </div>

      {hasMeals ? (
        <div className="text-right">
          <p className="text-[19px] font-black leading-none text-[var(--mt-ink)]">
            {formatMacro(totals.calories, "")}
          </p>
          <p className="mt-1 text-[9px] font-black uppercase text-[var(--mt-ink-3)]">
            kcal
          </p>
        </div>
      ) : (
        <Link
          href="/add"
          className="rounded-full bg-white px-3 py-2 text-[11px] font-black text-[var(--mt-rouge)] ring-1 ring-[var(--mt-line)]"
        >
          Ajouter
        </Link>
      )}
    </article>
  );
}

function SettingsIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.8 1.8 0 0 0 .36 2l.04.04a2 2 0 1 1-2.83 2.83l-.04-.04a1.8 1.8 0 0 0-2-.36 1.8 1.8 0 0 0-1 1.63V21a2 2 0 1 1-4 0v-.06a1.8 1.8 0 0 0-1-1.63 1.8 1.8 0 0 0-2 .36l-.04.04a2 2 0 1 1-2.83-2.83l.04-.04a1.8 1.8 0 0 0 .36-2 1.8 1.8 0 0 0-1.63-1H3a2 2 0 1 1 0-4h.06a1.8 1.8 0 0 0 1.63-1 1.8 1.8 0 0 0-.36-2l-.04-.04a2 2 0 1 1 2.83-2.83l.04.04a1.8 1.8 0 0 0 2 .36 1.8 1.8 0 0 0 1-1.63V3a2 2 0 1 1 4 0v.06a1.8 1.8 0 0 0 1 1.63 1.8 1.8 0 0 0 2-.36l.04-.04a2 2 0 1 1 2.83 2.83l-.04.04a1.8 1.8 0 0 0-.36 2 1.8 1.8 0 0 0 1.63 1H21a2 2 0 1 1 0 4h-.06a1.8 1.8 0 0 0-1.54 1Z" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.7 21a2 2 0 0 1-3.4 0" />
    </svg>
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