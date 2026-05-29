export type MealType = "breakfast" | "lunch" | "snack" | "dinner" | "other";

export type FoodSource =
  | "label"
  | "manual"
  | "unknown"
  | "openfoodfacts"
  | "ciqual";

export type Sex = "female" | "male";

export type ActivityLevel =
  | "sedentary"
  | "light"
  | "moderate"
  | "active"
  | "very_active";

export type GoalType =
  | "fat_loss"
  | "maintenance"
  | "muscle_gain"
  | "recomposition";

export type GoalSpeed = "gentle" | "moderate" | "assertive";

export type UserProfile = {
  sex: Sex;
  age: number;
  heightCm: number;
  currentWeightKg: number;
  activityLevel: ActivityLevel;
  goalType: GoalType;
  goalSpeed: GoalSpeed;
};

export type Food = {
  id: string;
  name: string;
  brand?: string;
  barcode?: string;
  externalUrl?: string;
  imageUrl?: string;
  dataQualityStatus?: "complete" | "partial" | "missing" | "needs_review";
  category: string;
  servingName?: string;
  servingSizeG?: number | null;
  isFavorite?: boolean;
  isEssential?: boolean;
  officialName?: string;
  reviewed?: boolean;
  reviewNotes?: string;

  caloriesPer100g: number | null;
  proteinPer100g: number | null;
  carbsPer100g: number | null;
  fatPer100g: number | null;
  saturatedFatPer100g?: number | null;
  sugarPer100g?: number | null;
  fiberPer100g?: number | null;
  saltPer100g?: number | null;

  source: FoodSource;
  verified: boolean;

  createdAt: string;
  updatedAt: string;
};

export type MealItem = {
  id: string;
  foodId: string;
  foodNameSnapshot: string;
  brandSnapshot?: string;
  quantityG: number;

  calories: number | null;
  proteinG: number | null;
  carbsG: number | null;
  fatG: number | null;
  fiberG?: number | null;
  sugarG?: number | null;
  saltG?: number | null;

  isComplete: boolean;
};

export type Meal = {
  id: string;
  date: string;
  type: MealType;
  name?: string;
  items: MealItem[];
  createdAt: string;
  updatedAt: string;
};

export type MealTemplate = {
  id: string;
  name: string;
  type: MealType;
  items: MealItem[];
  isDefault?: boolean;
  createdAt: string;
  updatedAt: string;
};

export type NutritionGoals = {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
};

export type WeightLog = {
  id: string;
  date: string;
  weightKg: number;
  notes?: string;
  createdAt: string;
};

export type AppData = {
  onboardingCompleted: boolean;
  defaultMealTemplatesAdded: boolean;
  profile: UserProfile;
  foods: Food[];
  meals: Meal[];
  mealTemplates: MealTemplate[];
  goals: NutritionGoals;
  weightLogs: WeightLog[];
};