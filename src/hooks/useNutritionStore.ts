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
  onboardingCompleted: false,
  defaultMealTemplatesAdded: true,
  profile: defaultProfile,
  foods: seedFoods,
  meals: [],
  mealTemplates: seedMealTemplates,
  goals: defaultGoals,
  weightLogs: [],
};

function mergeSeedFoods(existingFoods: Food[]) {
  const merged = new Map<string, Food>();

  seedFoods.forEach((food) => {
    merged.set(food.id, food);
  });

  existingFoods.forEach((food) => {
    const seedFood = merged.get(food.id);
  
    if (seedFood?.isEssential) {
      merged.set(food.id, {
        ...food,
        ...seedFood,
        isFavorite: food.isFavorite ?? seedFood.isFavorite,
      });
  
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

function normalizeImportedData(input: Partial<AppData>): AppData {
  const defaultMealTemplatesAlreadyAdded =
    input.defaultMealTemplatesAdded === true;

  const existingTemplates = Array.isArray(input.mealTemplates)
    ? input.mealTemplates
    : [];

  return {
    onboardingCompleted:
      typeof input.onboardingCompleted === "boolean"
        ? input.onboardingCompleted
        : false,
    defaultMealTemplatesAdded: true,
    profile: input.profile ?? defaultProfile,
    foods: Array.isArray(input.foods)
      ? mergeSeedFoods(input.foods)
      : seedFoods,
    meals: Array.isArray(input.meals) ? input.meals : [],
    mealTemplates: defaultMealTemplatesAlreadyAdded
      ? existingTemplates
      : mergeSeedMealTemplates(existingTemplates),
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

      const updatedFood = updatedFoods.find((food) => food.id === foodId);

      if (!updatedFood) {
        return {
          ...current,
          foods: updatedFoods,
        };
      }

      const foodForRefresh: Food = updatedFood;

      function refreshItem(item: MealItem): MealItem {
        if (item.foodId !== foodId) {
          return item;
        }

        const refreshedItem = buildMealItem(foodForRefresh, item.quantityG);

        return {
          ...refreshedItem,
          id: item.id,
        };
      }

      function hasFoodInItems(items: MealItem[]) {
        return items.some((item) => item.foodId === foodId);
      }

      return {
        ...current,
        foods: updatedFoods,

        meals: current.meals.map((meal) => {
          if (!hasFoodInItems(meal.items)) {
            return meal;
          }

          return {
            ...meal,
            items: meal.items.map(refreshItem),
            updatedAt,
          };
        }),

        mealTemplates: current.mealTemplates.map((template) => {
          if (!hasFoodInItems(template.items)) {
            return template;
          }

          return {
            ...template,
            items: template.items.map(refreshItem),
            updatedAt,
          };
        }),
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
    onboardingCompleted: data.onboardingCompleted,
    profile: data.profile,
    foods,
    meals,
    mealTemplates,
    goals: data.goals,
    weightLogs,
    completeOnboarding,
    setOnboardingCompleted,
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