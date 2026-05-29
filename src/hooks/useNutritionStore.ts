"use client";

import { useEffect, useMemo, useState } from "react";
import { seedFoods } from "@/data/seedFoods";
import {
  AppData,
  Food,
  Meal,
  MealItem,
  MealTemplate,
  NutritionGoals,
  UserProfile,
  WeightLog,
} from "@/types/nutrition";
import { createId, todayLocalDate } from "@/lib/nutrition";

const STORAGE_KEY = "macrotrack-personal-v1";

const defaultProfile: UserProfile = {
  sex: "female",
  age: 25,
  heightCm: 165,
  currentWeightKg: 60,
  activityLevel: "light",
  goalType: "fat_loss",
  goalSpeed: "moderate",
};

const defaultGoals: NutritionGoals = {
  calories: 1800,
  proteinG: 110,
  carbsG: 190,
  fatG: 55,
};

const defaultData: AppData = {
  profile: defaultProfile,
  foods: seedFoods,
  meals: [],
  mealTemplates: [],
  goals: defaultGoals,
  weightLogs: [],
};

function normalizeImportedData(input: Partial<AppData>): AppData {
  return {
    profile: input.profile ?? defaultProfile,
    foods: Array.isArray(input.foods) ? input.foods : seedFoods,
    meals: Array.isArray(input.meals) ? input.meals : [],
    mealTemplates: Array.isArray(input.mealTemplates)
      ? input.mealTemplates
      : [],
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

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
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
      [...data.mealTemplates].sort((a, b) =>
        a.name.localeCompare(b.name)
      ),
    [data.mealTemplates]
  );

  const weightLogs = useMemo(
    () => [...data.weightLogs].sort((a, b) => b.date.localeCompare(a.date)),
    [data.weightLogs]
  );

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
    setData((current) => ({
      ...current,
      foods: current.foods.map((food) =>
        food.id === foodId
          ? {
              ...food,
              ...input,
              updatedAt: new Date().toISOString(),
            }
          : food
      ),
    }));
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
    window.localStorage.removeItem(STORAGE_KEY);
    setData(defaultData);
  }

  function importData(nextData: Partial<AppData>) {
    const normalized = normalizeImportedData(nextData);
    setData(normalized);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  }

  function exportData() {
    return data;
  }

  function getMealsByDate(date = todayLocalDate()) {
    return meals.filter((meal) => meal.date === date);
  }

  return {
    hasLoaded,
    profile: data.profile,
    foods,
    meals,
    mealTemplates,
    goals: data.goals,
    weightLogs,
    addFood,
    deleteFood,
    updateFood,
    addMeal,
    deleteMeal,
    duplicateMeal,
    copyDay,
    saveMealAsTemplate,
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