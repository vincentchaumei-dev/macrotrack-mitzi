import { Food, Meal, MealItem, MealType } from "@/types/nutrition";

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

function calculateValue(valuePer100g: number | null | undefined, quantityG: number) {
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

  return Math.round(knownValues.reduce((total, value) => total + value, 0) * 10) / 10;
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