import { Food } from "@/types/nutrition";

function now() {
  return new Date().toISOString();
}

export const seedFoods: Food[] = [
  {
    id: "seed-toastiligne-pain-complet",
    name: "Pain de mie complet Toastiligne",
    brand: "La Boulangère",
    category: "Pains & boulangerie",
    servingName: "1 tranche",
    servingSizeG: 38.4,
    caloriesPer100g: 226,
    proteinPer100g: 10,
    carbsPer100g: 39,
    fatPer100g: 1.9,
    saturatedFatPer100g: 0.9,
    sugarPer100g: 2.8,
    fiberPer100g: 6.2,
    saltPer100g: 0.98,
    source: "label",
    verified: true,
    createdAt: now(),
    updatedAt: now(),
  },
  {
    id: "seed-carre-frais-0",
    name: "Carré Frais 0%",
    brand: "Carré Frais",
    category: "Fromages",
    servingName: "1 portion",
    servingSizeG: 25,
    caloriesPer100g: 85,
    proteinPer100g: 16,
    carbsPer100g: 4.5,
    fatPer100g: 0.3,
    saturatedFatPer100g: 0.2,
    sugarPer100g: 2.9,
    fiberPer100g: null,
    saltPer100g: 1.3,
    source: "label",
    verified: true,
    createdAt: now(),
    updatedAt: now(),
  },
];