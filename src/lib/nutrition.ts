import {
  ActivityLevel,
  Food,
  GoalSpeed,
  GoalType,
  Meal,
  MealItem,
  MealType,
  NutritionGoals,
  Sex,
  UserProfile,
} from "@/types/nutrition";

export const mealTypeLabels: Record<MealType, string> = {
  breakfast: "Petit-déjeuner",
  lunch: "Déjeuner",
  snack: "Collation",
  dinner: "Dîner",
  other: "Autre",
};

export function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return Math.random().toString(36).slice(2);
}

export function todayLocalDate() {
  const date = new Date();
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function formatDateFr(date: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(`${date}T12:00:00`));
}

export function addDays(date: string, days: number) {
  const next = new Date(`${date}T12:00:00`);
  next.setDate(next.getDate() + days);

  const year = next.getFullYear();
  const month = `${next.getMonth() + 1}`.padStart(2, "0");
  const day = `${next.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function calculateValue(
  valuePer100g: number | null | undefined,
  quantityG: number
) {
  if (valuePer100g === null || valuePer100g === undefined) {
    return null;
  }

  return Math.round((valuePer100g * quantityG) / 100);
}

function calculateDecimalValue(
  valuePer100g: number | null | undefined,
  quantityG: number
) {
  if (valuePer100g === null || valuePer100g === undefined) {
    return null;
  }

  return Math.round(((valuePer100g * quantityG) / 100) * 10) / 10;
}

export function buildMealItem(food: Food, quantityG: number): MealItem {
  const calories = calculateValue(food.caloriesPer100g, quantityG);
  const proteinG = calculateDecimalValue(food.proteinPer100g, quantityG);
  const carbsG = calculateDecimalValue(food.carbsPer100g, quantityG);
  const fatG = calculateDecimalValue(food.fatPer100g, quantityG);
  const fiberG = calculateDecimalValue(food.fiberPer100g, quantityG);
  const sugarG = calculateDecimalValue(food.sugarPer100g, quantityG);
  const saltG = calculateDecimalValue(food.saltPer100g, quantityG);

  return {
    id: createId(),
    foodId: food.id,
    foodNameSnapshot: food.name,
    brandSnapshot: food.brand,
    quantityG,
    calories,
    proteinG,
    carbsG,
    fatG,
    fiberG,
    sugarG,
    saltG,
    isComplete:
      calories !== null && proteinG !== null && carbsG !== null && fatG !== null,
  };
}

export function sumNullable(values: Array<number | null | undefined>) {
  const knownValues = values.filter(
    (value): value is number => value !== null && value !== undefined
  );

  if (knownValues.length === 0) {
    return null;
  }

  return (
    Math.round(
      knownValues.reduce((total, value) => total + value, 0) * 10
    ) / 10
  );
}

export function calculateMealTotals(meal: Meal) {
  return {
    calories: sumNullable(meal.items.map((item) => item.calories)),
    proteinG: sumNullable(meal.items.map((item) => item.proteinG)),
    carbsG: sumNullable(meal.items.map((item) => item.carbsG)),
    fatG: sumNullable(meal.items.map((item) => item.fatG)),
    incompleteItems: meal.items.filter((item) => !item.isComplete).length,
  };
}

export function calculateDayTotals(meals: Meal[]) {
  const items = meals.flatMap((meal) => meal.items);

  return {
    calories: sumNullable(items.map((item) => item.calories)),
    proteinG: sumNullable(items.map((item) => item.proteinG)),
    carbsG: sumNullable(items.map((item) => item.carbsG)),
    fatG: sumNullable(items.map((item) => item.fatG)),
    incompleteItems: items.filter((item) => !item.isComplete).length,
  };
}

export function formatMacro(value: number | null, suffix: string) {
  if (value === null) {
    return "—";
  }

  return `${value}${suffix}`;
}

export function getProgress(value: number | null, target: number) {
  if (value === null || target <= 0) {
    return 0;
  }

  return Math.min(Math.round((value / target) * 100), 100);
}

export function isFoodComplete(food: Food) {
  return (
    food.caloriesPer100g !== null &&
    food.proteinPer100g !== null &&
    food.carbsPer100g !== null &&
    food.fatPer100g !== null
  );
}

/* ----------------------------- */
/* Profil, TDEE et objectifs     */
/* ----------------------------- */

export const activityLevelLabels: Record<ActivityLevel, string> = {
  sedentary: "Sédentaire",
  light: "Légèrement active",
  moderate: "Modérément active",
  active: "Active",
  very_active: "Très active",
};

export const activityMultipliers: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

export const goalTypeLabels: Record<GoalType, string> = {
  fat_loss: "Perte de poids",
  maintenance: "Maintien",
  muscle_gain: "Prise de masse",
  recomposition: "Recomposition",
};

export const goalSpeedLabels: Record<GoalSpeed, string> = {
  gentle: "Douce",
  moderate: "Modérée",
  assertive: "Plus ambitieuse",
};

export function calculateBmr({
  sex,
  age,
  heightCm,
  currentWeightKg,
}: {
  sex: Sex;
  age: number;
  heightCm: number;
  currentWeightKg: number;
}) {
  const base = 10 * currentWeightKg + 6.25 * heightCm - 5 * age;

  return Math.round(sex === "male" ? base + 5 : base - 161);
}

export function calculateTdee(profile: UserProfile) {
  const bmr = calculateBmr(profile);
  const multiplier = activityMultipliers[profile.activityLevel];

  return Math.round(bmr * multiplier);
}

export function getCalorieAdjustment(goalType: GoalType, goalSpeed: GoalSpeed) {
  if (goalType === "maintenance") return 0;

  if (goalType === "recomposition") {
    if (goalSpeed === "gentle") return -100;
    if (goalSpeed === "moderate") return -200;
    return -300;
  }

  if (goalType === "fat_loss") {
    if (goalSpeed === "gentle") return -250;
    if (goalSpeed === "moderate") return -400;
    return -500;
  }

  if (goalType === "muscle_gain") {
    if (goalSpeed === "gentle") return 150;
    if (goalSpeed === "moderate") return 250;
    return 350;
  }

  return 0;
}

export function calculateRecommendedGoals(
  profile: UserProfile
): NutritionGoals {
  const tdee = calculateTdee(profile);
  const calorieAdjustment = getCalorieAdjustment(
    profile.goalType,
    profile.goalSpeed
  );

  const calories = Math.max(tdee + calorieAdjustment, 1200);

  let proteinPerKg = 1.6;

  if (profile.goalType === "fat_loss") proteinPerKg = 1.8;
  if (profile.goalType === "recomposition") proteinPerKg = 1.8;
  if (profile.goalType === "muscle_gain") proteinPerKg = 1.7;

  const proteinG = Math.round(profile.currentWeightKg * proteinPerKg);
  const fatG = Math.round(profile.currentWeightKg * 0.8);

  const caloriesFromProtein = proteinG * 4;
  const caloriesFromFat = fatG * 9;
  const remainingCalories = Math.max(
    calories - caloriesFromProtein - caloriesFromFat,
    0
  );

  const carbsG = Math.round(remainingCalories / 4);

  return {
    calories,
    proteinG,
    carbsG,
    fatG,
  };
}

export function explainGoal(profile: UserProfile) {
  const tdee = calculateTdee(profile);
  const adjustment = getCalorieAdjustment(profile.goalType, profile.goalSpeed);
  const target = tdee + adjustment;

  if (profile.goalType === "fat_loss") {
    return `Ta dépense journalière est estimée à environ ${tdee} kcal. Pour une perte de poids ${goalSpeedLabels[
      profile.goalSpeed
    ].toLowerCase()}, l’app propose une cible autour de ${target} kcal.`;
  }

  if (profile.goalType === "muscle_gain") {
    return `Ta dépense journalière est estimée à environ ${tdee} kcal. Pour une prise de masse ${goalSpeedLabels[
      profile.goalSpeed
    ].toLowerCase()}, l’app propose un léger surplus autour de ${target} kcal.`;
  }

  if (profile.goalType === "recomposition") {
    return `Ta dépense journalière est estimée à environ ${tdee} kcal. Pour une recomposition, l’app propose une cible proche du maintien, avec une priorité sur les protéines.`;
  }

  return `Ta dépense journalière est estimée à environ ${tdee} kcal. L’objectif maintien garde une cible proche de cette dépense.`;
}

export function getGoalLabel(profile: UserProfile) {
  return goalTypeLabels[profile.goalType];
}

export function getDayCoachMessage({
  calories,
  proteinG,
  fatG,
  carbsG,
  goals,
  profile,
}: {
  calories: number | null;
  proteinG: number | null;
  carbsG: number | null;
  fatG: number | null;
  goals: NutritionGoals;
  profile: UserProfile;
}) {
  if (calories === null) {
    return {
      title: "Commence par ajouter un repas.",
      description:
        "Une fois le premier repas ajouté, l’app pourra analyser la journée et t’aider à ajuster simplement.",
      tone: "neutral" as const,
    };
  }

  const caloriesProgress = calories / goals.calories;
  const proteinProgress = proteinG === null ? 0 : proteinG / goals.proteinG;

  if (caloriesProgress < 0.45) {
    return {
      title: "Journée encore très peu remplie.",
      description:
        "Il reste beaucoup de marge sur les calories. L’objectif est de suivre sans se restreindre trop fortement.",
      tone: "neutral" as const,
    };
  }

  if (profile.goalType === "fat_loss" && caloriesProgress > 1.1) {
    return {
      title: "Tu dépasses un peu la cible calories.",
      description:
        "Ce n’est pas grave sur une journée. Regarde surtout la moyenne sur plusieurs jours, pas un seul repas.",
      tone: "warning" as const,
    };
  }

  if (proteinProgress < 0.65 && caloriesProgress > 0.65) {
    return {
      title: "Les protéines sont encore un peu basses.",
      description:
        "Pour aider la satiété et préserver la masse musculaire, tu peux prévoir une source de protéines sur le prochain repas.",
      tone: "warning" as const,
    };
  }

  if (proteinProgress >= 0.9 && caloriesProgress <= 1.05) {
    return {
      title: "Journée bien alignée avec l’objectif.",
      description:
        "Les calories et les protéines sont cohérentes avec l’objectif actuel. Continue à suivre tranquillement.",
      tone: "success" as const,
    };
  }

  if (profile.goalType === "muscle_gain" && caloriesProgress < 0.85) {
    return {
      title: "Il manque encore un peu d’énergie.",
      description:
        "Pour une prise de masse, l’enjeu est souvent de manger assez régulièrement sans tout concentrer le soir.",
      tone: "neutral" as const,
    };
  }

  return {
    title: "Journée en cours.",
    description:
      "Continue à ajouter les repas au fil de la journée. L’analyse devient plus utile quand la journée est complète.",
    tone: "neutral" as const,
  };
}

export function getSimpleNutritionTip(profile: UserProfile) {
  if (profile.goalType === "fat_loss") {
    return "Pour une perte de poids durable, l’objectif n’est pas de manger le moins possible, mais d’avoir un léger déficit régulier, avec assez de protéines et des repas rassasiants.";
  }

  if (profile.goalType === "muscle_gain") {
    return "Pour une prise de masse propre, l’idée est de créer un léger surplus calorique, tout en gardant un bon apport en protéines et un entraînement régulier.";
  }

  if (profile.goalType === "recomposition") {
    return "Pour une recomposition, la priorité est souvent la régularité : protéines suffisantes, entraînement sérieux, sommeil correct et suivi sur plusieurs semaines.";
  }

  return "Pour le maintien, l’objectif est de rester proche de ta dépense journalière moyenne, sans chercher la perfection jour par jour.";
}

export function normalizeSearchText(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/œ/g, "oe")
    .replace(/Œ/g, "oe")
    .toLowerCase()
    .trim();
}

export function foodMatchesSearch({
  foodName,
  brand,
  category,
  query,
}: {
  foodName: string;
  brand?: string;
  category: string;
  query: string;
}) {
  const normalizedQuery = normalizeSearchText(query);

  if (!normalizedQuery) return true;

  const searchableText = normalizeSearchText(
    `${foodName} ${brand ?? ""} ${category}`
  );

  const queryWords = normalizedQuery
    .split(" ")
    .map((word) => word.trim())
    .filter(Boolean);

  return queryWords.every((word) => searchableText.includes(word));
}