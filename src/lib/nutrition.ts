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
  sedentary: "Sédentaire · 0 entraînement/semaine",
  light: "Légère · 1 à 2 entraînements/semaine",
  moderate: "Modérée · 3 à 4 entraînements/semaine",
  active: "Active · 5 entraînements/semaine",
  very_active: "Très active · 6+ entraînements/semaine",
};

export const activityMultipliers: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.35,
  moderate: 1.5,
  active: 1.65,
  very_active: 1.8,
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

function roundToNearestTen(value: number) {
  return Math.round(value / 10) * 10;
}

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

export function getMinimumCalorieTarget(profile: UserProfile) {
  const sexFloor = profile.sex === "male" ? 1600 : 1300;
  const bmrFloor = Math.round(calculateBmr(profile) * 0.85);

  return Math.max(sexFloor, bmrFloor);
}

export function calculateCalorieTarget(profile: UserProfile) {
  const bmr = calculateBmr(profile);
  const tdee = calculateTdee(profile);
  const adjustment = getCalorieAdjustment(profile.goalType, profile.goalSpeed);
  const rawCalories = tdee + adjustment;

  const minimumCalories = getMinimumCalorieTarget(profile);

  const deficitFloor =
    profile.goalType === "fat_loss" || profile.goalType === "recomposition"
      ? Math.round(tdee * 0.75)
      : 0;

  const guardedCalories =
    profile.goalType === "fat_loss" || profile.goalType === "recomposition"
      ? Math.max(rawCalories, minimumCalories, deficitFloor)
      : Math.max(rawCalories, minimumCalories);

  const calories = roundToNearestTen(guardedCalories);

  return {
    bmr,
    tdee,
    adjustment,
    rawCalories: Math.round(rawCalories),
    minimumCalories,
    deficitFloor,
    calories,
    wasLimited: calories > Math.round(rawCalories),
  };
}

function getProteinTargetPerKg(goalType: GoalType) {
  if (goalType === "fat_loss") return 1.8;
  if (goalType === "recomposition") return 1.8;
  if (goalType === "muscle_gain") return 1.7;

  return 1.6;
}

function getFatTargetPerKg(goalType: GoalType) {
  if (goalType === "muscle_gain") return 0.85;

  return 0.8;
}

export function calculateRecommendedGoals(
  profile: UserProfile
): NutritionGoals {
  const { calories } = calculateCalorieTarget(profile);

  const proteinG = Math.round(
    profile.currentWeightKg * getProteinTargetPerKg(profile.goalType)
  );

  const fatG = Math.round(
    profile.currentWeightKg * getFatTargetPerKg(profile.goalType)
  );

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

export const calculateSuggestedGoals = calculateRecommendedGoals;

export function explainGoal(profile: UserProfile) {
  const {
    tdee,
    calories,
    rawCalories,
    minimumCalories,
    deficitFloor,
    wasLimited,
  } = calculateCalorieTarget(profile);

  const limitText = wasLimited
    ? ` La cible brute aurait été autour de ${rawCalories} kcal, mais l’app l’a remontée à ${calories} kcal pour éviter un objectif trop bas.`
    : "";

  const adjustmentText =
    " Cette estimation reste une base de départ : le vrai réglage se fait après 2 à 3 semaines, avec l’évolution du poids moyen et la régularité du suivi.";

  if (profile.goalType === "fat_loss") {
    return `Ta dépense journalière est estimée à environ ${tdee} kcal. Pour une perte de poids ${goalSpeedLabels[
      profile.goalSpeed
    ].toLowerCase()}, l’app propose une cible autour de ${calories} kcal.${limitText}${adjustmentText}`;
  }

  if (profile.goalType === "muscle_gain") {
    return `Ta dépense journalière est estimée à environ ${tdee} kcal. Pour une prise de masse ${goalSpeedLabels[
      profile.goalSpeed
    ].toLowerCase()}, l’app propose un léger surplus autour de ${calories} kcal.${adjustmentText}`;
  }

  if (profile.goalType === "recomposition") {
    return `Ta dépense journalière est estimée à environ ${tdee} kcal. Pour une recomposition, l’app propose une cible proche du maintien, avec une priorité sur les protéines.${limitText}${adjustmentText}`;
  }

  return `Ta dépense journalière est estimée à environ ${tdee} kcal. L’objectif maintien garde une cible autour de ${calories} kcal.${adjustmentText}`;
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

const simpleFoodCategories = [
  "Fruits",
  "Légumes",
  "Légumineuses",
  "Féculents & céréales",
  "Viandes",
  "Poissons",
  "Œufs",
  "Produits laitiers",
  "Fromages",
  "Matières grasses",
  "Oléagineux & graines",
];

const processedFoodKeywords = [
  "burger",
  "sandwich",
  "pizza",
  "quiche",
  "tarte",
  "gateau",
  "gâteau",
  "biscuit",
  "dessert",
  "viennoiserie",
  "croissant",
  "pain au chocolat",
  "restauration rapide",
  "fast food",
  "pané",
  "pane",
  "frit",
  "frite",
  "nugget",
  "cordon bleu",
  "sauce",
  "plat prepare",
  "plat préparé",
  "industriel",
  "snack",
  "chips",
  "bonbon",
  "chocolat",
  "glace",
];

const simplePreparationKeywords = [
  "cru",
  "cuit",
  "cuite",
  "bouilli",
  "bouillie",
  "vapeur",
  "grille",
  "grillé",
  "rotî",
  "rôti",
  "poele",
  "poêlé",
  "nature",
  "sans peau",
  "filet",
  "blanc",
  "entier",
];

function includesAny(text: string, keywords: string[]) {
  return keywords.some((keyword) => text.includes(normalizeSearchText(keyword)));
}

function countWords(text: string) {
  return normalizeSearchText(text)
    .split(" ")
    .map((word) => word.trim())
    .filter(Boolean).length;
}

export function scoreFoodSearch(food: Food, query: string) {
  const normalizedQuery = normalizeSearchText(query);
  const normalizedName = normalizeSearchText(food.name);
  const normalizedBrand = normalizeSearchText(food.brand ?? "");
  const normalizedCategory = normalizeSearchText(food.category);

  if (!normalizedQuery) {
    let emptyScore = 0;
  
    if (food.isEssential) emptyScore += 2000;
    if (food.isFavorite) emptyScore += 1000;

    if (food.isFavorite) emptyScore += 1000;
    if (food.source !== "ciqual") emptyScore += 200;
    if (simpleFoodCategories.includes(food.category)) emptyScore += 100;

    return emptyScore;
  }

  const queryWords = normalizedQuery
    .split(" ")
    .map((word) => word.trim())
    .filter(Boolean);

  let score = 0;
  if (food.isEssential) score += 5000;

  const searchableText = `${normalizedName} ${normalizedBrand} ${normalizedCategory}`;

  const allWordsMatch = queryWords.every((word) => searchableText.includes(word));

  if (!allWordsMatch) {
    return -999999;
  }

  if (food.isFavorite) score += 2000;

  // Les aliments ajoutés à la main, par étiquette ou Open Food Facts sont souvent plus spécifiques.
  if (food.source === "label") score += 500;
  if (food.source === "manual") score += 450;
  if (food.source === "openfoodfacts") score += 250;

  // Match exact : priorité absolue.
  if (normalizedName === normalizedQuery) score += 6000;

  // Le nom commence par la recherche : très fort.
  if (normalizedName.startsWith(normalizedQuery)) score += 3500;

  // Le nom contient la recherche complète.
  if (normalizedName.includes(normalizedQuery)) score += 2000;

  // Bonus si chaque mot recherché apparaît dans le nom.
  const allWordsInName = queryWords.every((word) => normalizedName.includes(word));
  if (allWordsInName) score += 1000;

  // Bonus aliments simples/bruts.
  if (simpleFoodCategories.includes(food.category)) score += 900;

  // Bonus pour préparations simples : cru, cuit, vapeur, filet, blanc, nature...
  if (includesAny(normalizedName, simplePreparationKeywords)) score += 500;

  // Bonus si l’aliment est court/simple.
  const wordsCount = countWords(food.name);
  if (wordsCount <= 2) score += 800;
  else if (wordsCount <= 4) score += 500;
  else if (wordsCount <= 7) score += 200;

  // Grosse pénalité plats transformés.
  if (includesAny(normalizedName, processedFoodKeywords)) score -= 2500;

  // Pénalité si le mot recherché est seulement dans une préparation longue.
  if (wordsCount > 10) score -= 500;

  // Pénalité pour catégories moins utiles en recherche de base.
  if (
    food.category === "Produits sucrés" ||
    food.category === "Snacks" ||
    food.category === "Plats préparés" ||
    food.category === "Sauces & condiments"
  ) {
    score -= 1200;
  }

  // Un aliment complet est plus utile.
  if (isFoodComplete(food)) score += 250;

  return score;
}

export function compareFoodsForSearch(a: Food, b: Food, query: string) {
  const scoreA = scoreFoodSearch(a, query);
  const scoreB = scoreFoodSearch(b, query);

  if (scoreA !== scoreB) {
    return scoreB - scoreA;
  }

  const aWords = countWords(a.name);
  const bWords = countWords(b.name);

  if (aWords !== bWords) {
    return aWords - bWords;
  }

  return a.name.localeCompare(b.name);
}

export function isUserFriendlyFood(food: Food) {
  return (
    food.isEssential ||
    food.isFavorite ||
    food.source === "label" ||
    food.source === "manual" ||
    food.source === "openfoodfacts"
  );
}

export function shouldShowFoodInSimpleMode(food: Food, query: string) {
  const hasQuery = query.trim().length > 0;

  if (isUserFriendlyFood(food)) {
    return true;
  }

  // Si l’utilisateur cherche précisément quelque chose, on autorise la base Ciqual complète.
  // Mais elle restera classée derrière les aliments essentiels.
  if (hasQuery) {
    return true;
  }

  return false;
}