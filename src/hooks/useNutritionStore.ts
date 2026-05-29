"use client";

import { useEffect, useMemo, useState } from "react";
import { seedFoods } from "@/data/seedFoods";
import { AppData, Food, Meal, NutritionGoals, WeightLog } from "@/types/nutrition";
import { createId, todayLocalDate } from "@/lib/nutrition";

const STORAGE_KEY = "macrotrack-personal-v1";

const defaultGoals: NutritionGoals = {
  calories: 2300,
  proteinG: 160,
  carbsG: 250,
  fatG: 70,
};

const defaultData: AppData = {
  foods: seedFoods,
  meals: [],
  goals: defaultGoals,
  weightLogs: [],
};

function normalizeImportedData(input: Partial<AppData>): AppData {
  return {
    foods: Array.isArray(input.foods) ? input.foods : seedFoods,
    meals: Array.isArray(input.meals) ? input.meals : [],
    goals: input.goals ?? defaultGoals,
    weightLogs: Array.isArray(input.weightLogs) ? input.weightLogs : [],
  };
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
    foods,
    meals,
    goals: data.goals,
    weightLogs,
    addFood,
    deleteFood,
    addMeal,
    deleteMeal,
    updateGoals,
    addWeightLog,
    deleteWeightLog,
    resetData,
    importData,
    exportData,
    getMealsByDate,
  };
}