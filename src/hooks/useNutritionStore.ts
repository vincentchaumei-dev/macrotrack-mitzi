"use client";

import { useEffect, useMemo, useState } from "react";
import { seedFoods } from "@/data/seedFoods";
import { seedMealTemplates } from "@/data/seedMealTemplates";
import {
  AppData,
  Food,
  Meal,
  MealItem,
  MealTemplate,
  MealType,
  NutritionGoals,
  UserProfile,
  WeightLog,
} from "@/types/nutrition";
import { buildMealItem, createId, todayLocalDate } from "@/lib/nutrition";

const STORAGE_KEY = "macrotrack-personal-v1";

const defaultProfile: UserProfile = {
  sex: "female",
  age: 25,
  heightCm: 165,
  currentWeightKg: 60,
  activityLevel: "light",
  goalType: "maintenance",
  goalSpeed: "gentle",
};

const defaultGoals: NutritionGoals = {
  calories: 1800,
  proteinG: 110,
  carbsG: 190,
  fatG: 55,
};

const defaultData: AppData = {
  onboardingCompleted: false,
  defaultMealTemplatesAdded: true,
  profile: defaultProfile,
  foods: seedFoods,
  meals: [],
  mealTemplates: seedMealTemplates,
  goals: defaultGoals,
  weightLogs: [],
};

function cloneAppData<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function writeLocalStorage(data: AppData) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.warn("Impossible d’enregistrer les données MacroTrack.", error);
  }
}

function shouldPreserveUserNutrition(food: Food) {
  return food.reviewed === true;
}

function mergeEssentialFood(seedFood: Food, existingFood: Food) {
  const preserveNutrition = shouldPreserveUserNutrition(existingFood);

  return {
    ...seedFood,

    id: existingFood.id,
    createdAt: existingFood.createdAt ?? seedFood.createdAt,
    updatedAt: new Date().toISOString(),

    isFavorite: existingFood.isFavorite ?? seedFood.isFavorite,

    reviewed: existingFood.reviewed ?? seedFood.reviewed,
    reviewNotes: existingFood.reviewNotes ?? seedFood.reviewNotes,

    caloriesPer100g: preserveNutrition
      ? existingFood.caloriesPer100g
      : seedFood.caloriesPer100g,
    proteinPer100g: preserveNutrition
      ? existingFood.proteinPer100g
      : seedFood.proteinPer100g,
    carbsPer100g: preserveNutrition
      ? existingFood.carbsPer100g
      : seedFood.carbsPer100g,
    fatPer100g: preserveNutrition
      ? existingFood.fatPer100g
      : seedFood.fatPer100g,
    saturatedFatPer100g: preserveNutrition
      ? existingFood.saturatedFatPer100g
      : seedFood.saturatedFatPer100g,
    fiberPer100g: preserveNutrition
      ? existingFood.fiberPer100g
      : seedFood.fiberPer100g,
    sugarPer100g: preserveNutrition
      ? existingFood.sugarPer100g
      : seedFood.sugarPer100g,
    saltPer100g: preserveNutrition
      ? existingFood.saltPer100g
      : seedFood.saltPer100g,

    dataQualityStatus: preserveNutrition
      ? existingFood.dataQualityStatus
      : seedFood.dataQualityStatus,
  };
}

function mergeSeedFoods(existingFoods: Food[]) {
  const merged = new Map<string, Food>();

  seedFoods.forEach((food) => {
    merged.set(food.id, food);
  });

  existingFoods.forEach((food) => {
    const seedFood = merged.get(food.id);

    if (seedFood?.isEssential) {
      merged.set(food.id, mergeEssentialFood(seedFood, food));
      return;
    }

    merged.set(food.id, {
      ...seedFood,
      ...food,
    });
  });

  return Array.from(merged.values());
}

function mergeSeedMealTemplates(existingTemplates: MealTemplate[]) {
  const merged = new Map<string, MealTemplate>();

  seedMealTemplates.forEach((template) => {
    merged.set(template.id, template);
  });

  existingTemplates.forEach((template) => {
    merged.set(template.id, {
      ...merged.get(template.id),
      ...template,
    });
  });

  return Array.from(merged.values());
}

function refreshMealItemsFromFoods(items: MealItem[], foods: Food[]) {
  const foodsById = new Map(foods.map((food) => [food.id, food]));

  return items.map((item) => {
    const food = foodsById.get(item.foodId);

    if (!food) return item;

    const refreshedItem = buildMealItem(food, item.quantityG);

    return {
      ...refreshedItem,
      id: item.id,
    };
  });
}

/**
 * Important :
 * Les meals sont un historique. On ne les rafraîchit jamais depuis la base foods.
 * Un MealItem contient des snapshots nutritionnels figés au moment de l’ajout.
 *
 * Les templates, eux, sont des bases réutilisables : ils peuvent suivre les corrections
 * de la base foods pour que les futurs repas soient meilleurs.
 */
function refreshMealTemplatesFromFoods(
  mealTemplates: MealTemplate[],
  foods: Food[]
) {
  const updatedAt = new Date().toISOString();

  return mealTemplates.map((template) => ({
    ...template,
    items: refreshMealItemsFromFoods(template.items, foods),
    updatedAt,
  }));
}

function normalizeImportedData(input: Partial<AppData>): AppData {
  const defaultMealTemplatesAlreadyAdded =
    input.defaultMealTemplatesAdded === true;

  const existingFoods = Array.isArray(input.foods) ? input.foods : [];
  const mergedFoods =
    existingFoods.length > 0 ? mergeSeedFoods(existingFoods) : seedFoods;

  const existingTemplates = Array.isArray(input.mealTemplates)
    ? input.mealTemplates
    : [];

  const mergedTemplates = defaultMealTemplatesAlreadyAdded
    ? existingTemplates
    : mergeSeedMealTemplates(existingTemplates);

  const meals = Array.isArray(input.meals) ? input.meals : [];

  return {
    onboardingCompleted:
      typeof input.onboardingCompleted === "boolean"
        ? input.onboardingCompleted
        : false,
    defaultMealTemplatesAdded: true,
    profile: input.profile ?? defaultProfile,
    foods: mergedFoods,

    // Ne jamais recalculer l’historique à l’import.
    meals,

    mealTemplates: refreshMealTemplatesFromFoods(mergedTemplates, mergedFoods),
    goals: input.goals ?? defaultGoals,
    weightLogs: Array.isArray(input.weightLogs) ? input.weightLogs : [],
  };
}

function cloneMealItems(items: MealItem[]) {
  return items.map((item) => ({
    ...item,
    id: createId(),
  }));
}

export function useNutritionStore() {
  const [data, setData] = useState<AppData>(defaultData);
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);

      if (raw) {
        const parsed = JSON.parse(raw) as Partial<AppData>;
        setData(normalizeImportedData(parsed));
      } else {
        setData(defaultData);
      }
    } catch {
      setData(defaultData);
    } finally {
      setHasLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!hasLoaded) return;

    writeLocalStorage(data);
  }, [data, hasLoaded]);

  const foods = useMemo(
    () => [...data.foods].sort((a, b) => a.name.localeCompare(b.name)),
    [data.foods]
  );

  const meals = useMemo(
    () =>
      [...data.meals].sort((a, b) => {
        if (a.date === b.date) {
          return a.createdAt.localeCompare(b.createdAt);
        }

        return b.date.localeCompare(a.date);
      }),
    [data.meals]
  );

  const mealTemplates = useMemo(
    () =>
      [...data.mealTemplates].sort((a, b) => {
        if (a.isDefault && !b.isDefault) return -1;
        if (!a.isDefault && b.isDefault) return 1;
        return a.name.localeCompare(b.name);
      }),
    [data.mealTemplates]
  );

  const weightLogs = useMemo(
    () => [...data.weightLogs].sort((a, b) => b.date.localeCompare(a.date)),
    [data.weightLogs]
  );

  function completeOnboarding(profile: UserProfile, goals: NutritionGoals) {
    setData((current) => ({
      ...current,
      onboardingCompleted: true,
      profile,
      goals,
    }));
  }

  function setOnboardingCompleted(value: boolean) {
    setData((current) => ({
      ...current,
      onboardingCompleted: value,
    }));
  }

  function syncEssentialFoods() {
    setData((current) => {
      const mergedFoods = mergeSeedFoods(current.foods);

      return {
        ...current,
        foods: mergedFoods,

        // Ne jamais recalculer les repas existants.
        meals: current.meals,

        // Les templates peuvent être rafraîchis pour les futurs ajouts.
        mealTemplates: refreshMealTemplatesFromFoods(
          current.mealTemplates,
          mergedFoods
        ),
      };
    });
  }

  function addFood(input: Omit<Food, "id" | "createdAt" | "updatedAt">) {
    const date = new Date().toISOString();

    const food: Food = {
      ...input,
      id: createId(),
      createdAt: date,
      updatedAt: date,
    };

    setData((current) => ({
      ...current,
      foods: [...current.foods, food],
    }));

    return food;
  }

  function deleteFood(foodId: string) {
    setData((current) => ({
      ...current,
      foods: current.foods.filter((food) => food.id !== foodId),
    }));
  }

  function updateFood(
    foodId: string,
    input: Partial<Omit<Food, "id" | "createdAt">>
  ) {
    const updatedAt = new Date().toISOString();

    setData((current) => {
      const updatedFoods = current.foods.map((food) =>
        food.id === foodId
          ? {
              ...food,
              ...input,
              updatedAt,
            }
          : food
      );

      return {
        ...current,
        foods: updatedFoods,

        // Important : modifier un aliment ne modifie jamais le journal passé.
        meals: current.meals,

        // Les templates ne sont pas un historique : on les met à jour pour les prochains repas.
        mealTemplates: refreshMealTemplatesFromFoods(
          current.mealTemplates,
          updatedFoods
        ),
      };
    });
  }

  function addMeal(input: Omit<Meal, "id" | "createdAt" | "updatedAt">) {
    const date = new Date().toISOString();

    const meal: Meal = {
      ...input,
      id: createId(),
      createdAt: date,
      updatedAt: date,
    };

    setData((current) => ({
      ...current,
      meals: [...current.meals, meal],
    }));

    return meal;
  }

  function deleteMeal(mealId: string) {
    setData((current) => ({
      ...current,
      meals: current.meals.filter((meal) => meal.id !== mealId),
    }));
  }

  function duplicateMeal(mealId: string, targetDate: string) {
    const meal = data.meals.find((item) => item.id === mealId);

    if (!meal) return null;

    const date = new Date().toISOString();

    const duplicatedMeal: Meal = {
      ...meal,
      id: createId(),
      date: targetDate,
      name: meal.name ? `${meal.name} copie` : undefined,
      items: cloneMealItems(meal.items),
      createdAt: date,
      updatedAt: date,
    };

    setData((current) => ({
      ...current,
      meals: [...current.meals, duplicatedMeal],
    }));

    return duplicatedMeal;
  }

  function copyDay(sourceDate: string, targetDate: string) {
    const sourceMeals = data.meals.filter((meal) => meal.date === sourceDate);

    if (sourceMeals.length === 0) {
      return 0;
    }

    const date = new Date().toISOString();

    const copiedMeals: Meal[] = sourceMeals.map((meal) => ({
      ...meal,
      id: createId(),
      date: targetDate,
      items: cloneMealItems(meal.items),
      createdAt: date,
      updatedAt: date,
    }));

    setData((current) => ({
      ...current,
      meals: [...current.meals, ...copiedMeals],
    }));

    return copiedMeals.length;
  }

  function saveMealAsTemplate(mealId: string) {
    const meal = data.meals.find((item) => item.id === mealId);

    if (!meal) return null;

    const date = new Date().toISOString();

    const template: MealTemplate = {
      id: createId(),
      name: meal.name || "Repas type",
      type: meal.type,
      items: cloneMealItems(meal.items),
      isDefault: false,
      createdAt: date,
      updatedAt: date,
    };

    setData((current) => ({
      ...current,
      mealTemplates: [...current.mealTemplates, template],
    }));

    return template;
  }

  function createMealTemplate(input: {
    name: string;
    type: MealType;
    items: MealItem[];
  }) {
    const date = new Date().toISOString();

    const template: MealTemplate = {
      id: createId(),
      name: input.name.trim() || "Ma recette",
      type: input.type,
      items: cloneMealItems(input.items),
      isDefault: false,
      createdAt: date,
      updatedAt: date,
    };

    setData((current) => ({
      ...current,
      mealTemplates: [...current.mealTemplates, template],
    }));

    return template;
  }

  function deleteMealTemplate(templateId: string) {
    setData((current) => ({
      ...current,
      mealTemplates: current.mealTemplates.filter(
        (template) => template.id !== templateId
      ),
    }));
  }

  function addTemplateAsMeal(templateId: string, targetDate = todayLocalDate()) {
    const template = data.mealTemplates.find((item) => item.id === templateId);

    if (!template) return null;

    const date = new Date().toISOString();

    const meal: Meal = {
      id: createId(),
      date: targetDate,
      type: template.type,
      name: template.name,
      items: cloneMealItems(template.items),
      createdAt: date,
      updatedAt: date,
    };

    setData((current) => ({
      ...current,
      meals: [...current.meals, meal],
    }));

    return meal;
  }

  function updateProfile(profile: UserProfile) {
    setData((current) => ({
      ...current,
      profile,
    }));
  }

  function updateGoals(goals: NutritionGoals) {
    setData((current) => ({
      ...current,
      goals,
    }));
  }

  function addWeightLog(input: Omit<WeightLog, "id" | "createdAt">) {
    const weightLog: WeightLog = {
      ...input,
      id: createId(),
      createdAt: new Date().toISOString(),
    };

    setData((current) => ({
      ...current,
      weightLogs: [...current.weightLogs, weightLog],
    }));

    return weightLog;
  }

  function deleteWeightLog(weightLogId: string) {
    setData((current) => ({
      ...current,
      weightLogs: current.weightLogs.filter((log) => log.id !== weightLogId),
    }));
  }

  function resetData() {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore localStorage failures.
    }

    setData(defaultData);
  }

  function importData(nextData: Partial<AppData>) {
    const normalized = normalizeImportedData(nextData);

    setData(normalized);
    writeLocalStorage(normalized);
  }

  function exportData() {
    return cloneAppData(data);
  }

  function getMealsByDate(date = todayLocalDate()) {
    return meals.filter((meal) => meal.date === date);
  }

  return {
    hasLoaded,
    onboardingCompleted: data.onboardingCompleted,
    profile: data.profile,
    foods,
    meals,
    mealTemplates,
    goals: data.goals,
    weightLogs,
    completeOnboarding,
    setOnboardingCompleted,
    syncEssentialFoods,
    addFood,
    deleteFood,
    updateFood,
    addMeal,
    deleteMeal,
    duplicateMeal,
    copyDay,
    saveMealAsTemplate,
    createMealTemplate,
    deleteMealTemplate,
    addTemplateAsMeal,
    updateProfile,
    updateGoals,
    addWeightLog,
    deleteWeightLog,
    resetData,
    importData,
    exportData,
    getMealsByDate,
  };
}