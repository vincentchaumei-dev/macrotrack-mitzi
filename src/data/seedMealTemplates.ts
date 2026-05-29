import { seedFoods } from "@/data/seedFoods";
import { Food, MealItem, MealTemplate, MealType } from "@/types/nutrition";

type TemplateItemDefinition = {
  foodId: string;
  quantityG: number;
};

type TemplateDefinition = {
  id: string;
  name: string;
  type: MealType;
  items: TemplateItemDefinition[];
};

const createdAt = "2026-01-01T00:00:00.000Z";

function findFood(foodId: string) {
  return seedFoods.find((food) => food.id === foodId) ?? null;
}

function calculateCalories(valuePer100g: number | null | undefined, quantityG: number) {
  if (valuePer100g === null || valuePer100g === undefined) return null;
  return Math.round((valuePer100g * quantityG) / 100);
}

function calculateMacro(valuePer100g: number | null | undefined, quantityG: number) {
  if (valuePer100g === null || valuePer100g === undefined) return null;
  return Math.round(((valuePer100g * quantityG) / 100) * 10) / 10;
}

function buildTemplateItem(
  food: Food,
  quantityG: number,
  templateId: string,
  index: number
): MealItem {
  const calories = calculateCalories(food.caloriesPer100g, quantityG);
  const proteinG = calculateMacro(food.proteinPer100g, quantityG);
  const carbsG = calculateMacro(food.carbsPer100g, quantityG);
  const fatG = calculateMacro(food.fatPer100g, quantityG);
  const fiberG = calculateMacro(food.fiberPer100g, quantityG);
  const sugarG = calculateMacro(food.sugarPer100g, quantityG);
  const saltG = calculateMacro(food.saltPer100g, quantityG);

  return {
    id: `${templateId}-item-${index + 1}`,
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
      calories !== null &&
      proteinG !== null &&
      carbsG !== null &&
      fatG !== null,
  };
}

function createTemplate(definition: TemplateDefinition): MealTemplate | null {
  const items = definition.items
    .map((item, index) => {
      const food = findFood(item.foodId);

      if (!food) return null;

      return buildTemplateItem(food, item.quantityG, definition.id, index);
    })
    .filter((item): item is MealItem => item !== null);

  if (items.length === 0) return null;

  return {
    id: definition.id,
    name: definition.name,
    type: definition.type,
    items,
    isDefault: true,
    createdAt,
    updatedAt: createdAt,
  };
}

const templateDefinitions: TemplateDefinition[] = [
  {
    id: "default-breakfast-protein-simple",
    name: "Petit-déj simple protéiné",
    type: "breakfast",
    items: [
      { foodId: "seed-toastiligne-pain-complet", quantityG: 76.8 },
      { foodId: "seed-carre-frais-0", quantityG: 25 },
      { foodId: "essential-oeuf-entier", quantityG: 50 },
      { foodId: "essential-jambon-blanc", quantityG: 40 },
    ],
  },
  {
    id: "default-breakfast-oats",
    name: "Petit-déj flocons d’avoine",
    type: "breakfast",
    items: [
      { foodId: "essential-flocons-avoine", quantityG: 50 },
      { foodId: "essential-fromage-blanc", quantityG: 150 },
      { foodId: "essential-banane", quantityG: 100 },
      { foodId: "essential-amandes", quantityG: 15 },
    ],
  },
  {
    id: "default-lunch-chicken-rice",
    name: "Déjeuner poulet riz",
    type: "lunch",
    items: [
      { foodId: "essential-poulet-filet-cuit", quantityG: 130 },
      { foodId: "essential-riz-blanc-cuit", quantityG: 180 },
      { foodId: "essential-brocoli-cuit", quantityG: 200 },
      { foodId: "essential-huile-olive", quantityG: 10 },
    ],
  },
  {
    id: "default-dinner-salmon-vegetables",
    name: "Dîner saumon légumes",
    type: "dinner",
    items: [
      { foodId: "essential-saumon-cuit", quantityG: 120 },
      { foodId: "essential-pomme-de-terre-cuite", quantityG: 180 },
      { foodId: "essential-haricots-verts-cuits", quantityG: 200 },
      { foodId: "essential-huile-olive", quantityG: 5 },
    ],
  },
  {
    id: "default-snack-protein",
    name: "Collation protéinée",
    type: "snack",
    items: [
      { foodId: "essential-fromage-blanc", quantityG: 200 },
      { foodId: "essential-pomme", quantityG: 150 },
      { foodId: "essential-amandes", quantityG: 15 },
    ],
  },
  {
    id: "default-vegetarian-simple",
    name: "Repas végétarien simple",
    type: "lunch",
    items: [
      { foodId: "essential-lentilles-cuites", quantityG: 180 },
      { foodId: "essential-quinoa-cuit", quantityG: 150 },
      { foodId: "essential-carotte-cuite", quantityG: 150 },
      { foodId: "essential-huile-olive", quantityG: 10 },
    ],
  },
  {
    id: "default-fat-loss-satiety",
    name: "Repas perte de poids satiété",
    type: "dinner",
    items: [
      { foodId: "essential-thon-naturel", quantityG: 120 },
      { foodId: "essential-pomme-de-terre-cuite", quantityG: 200 },
      { foodId: "essential-haricots-verts-cuits", quantityG: 200 },
      { foodId: "essential-yaourt-nature", quantityG: 125 },
    ],
  },
  {
    id: "default-muscle-gain-clean",
    name: "Repas prise de masse propre",
    type: "lunch",
    items: [
      { foodId: "essential-pates-cuites", quantityG: 250 },
      { foodId: "essential-poulet-filet-cuit", quantityG: 150 },
      { foodId: "essential-huile-olive", quantityG: 10 },
      { foodId: "essential-banane", quantityG: 120 },
      { foodId: "essential-yaourt-nature", quantityG: 125 },
    ],
  },
];

export const seedMealTemplates: MealTemplate[] = templateDefinitions
  .map(createTemplate)
  .filter((template): template is MealTemplate => template !== null);