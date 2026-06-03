"use client";

import { useState } from "react";
import { MealItem } from "@/types/nutrition";

// ---------------------------------------------------------------------------
// Catalogue statique des plats restaurant
// Valeurs approximatives par portion (estimation honnête)
// ---------------------------------------------------------------------------

type RestaurantDish = {
  id: string;
  emoji: string;
  name: string;
  portionLabel: string; // affiché sous le nom : "1 part · env. 135g"
  portionG: number;     // grammes par 1 portion
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
};

type RestaurantCategory = {
  id: string;
  label: string;
  emoji: string;
  dishes: RestaurantDish[];
};

const RESTAURANT_CATEGORIES: RestaurantCategory[] = [
  {
    id: "fastfood",
    label: "Fast-food",
    emoji: "🍔",
    dishes: [
      { id: "burger-classique",  emoji: "🍔", name: "Burger classique",    portionLabel: "1 burger · env. 150g",  portionG: 150, calories: 320, proteinG: 16, carbsG: 32, fatG: 14 },
      { id: "big-burger",        emoji: "🍔", name: "Big burger",          portionLabel: "1 burger · env. 200g",  portionG: 200, calories: 420, proteinG: 22, carbsG: 38, fatG: 20 },
      { id: "double-burger",     emoji: "🍔", name: "Double burger",       portionLabel: "1 burger · env. 250g",  portionG: 250, calories: 550, proteinG: 32, carbsG: 42, fatG: 28 },
      { id: "wrap-poulet",       emoji: "🌯", name: "Wrap poulet",         portionLabel: "1 wrap · env. 220g",   portionG: 220, calories: 380, proteinG: 24, carbsG: 42, fatG: 12 },
      { id: "frites",            emoji: "🍟", name: "Portion de frites",   portionLabel: "1 portion · env. 130g", portionG: 130, calories: 370, proteinG: 4,  carbsG: 48, fatG: 18 },
      { id: "nuggets-6",         emoji: "🍗", name: "Nuggets x6",          portionLabel: "6 pièces · env. 105g",  portionG: 105, calories: 280, proteinG: 17, carbsG: 20, fatG: 14 },
      { id: "hot-dog",           emoji: "🌭", name: "Hot dog",             portionLabel: "1 hot dog · env. 160g", portionG: 160, calories: 310, proteinG: 12, carbsG: 30, fatG: 16 },
    ],
  },
  {
    id: "pizza",
    label: "Pizza",
    emoji: "🍕",
    dishes: [
      { id: "pizza-margherita-part", emoji: "🍕", name: "Margherita (part)",   portionLabel: "1 part · env. 135g",  portionG: 135, calories: 270, proteinG: 11, carbsG: 35, fatG: 9  },
      { id: "pizza-jambon-part",     emoji: "🍕", name: "Jambon (part)",       portionLabel: "1 part · env. 140g",  portionG: 140, calories: 290, proteinG: 14, carbsG: 35, fatG: 10 },
      { id: "pizza-4fromages-part",  emoji: "🍕", name: "4 fromages (part)",   portionLabel: "1 part · env. 145g",  portionG: 145, calories: 340, proteinG: 16, carbsG: 34, fatG: 16 },
      { id: "pizza-pepperoni-part",  emoji: "🍕", name: "Pepperoni (part)",    portionLabel: "1 part · env. 140g",  portionG: 140, calories: 325, proteinG: 14, carbsG: 34, fatG: 15 },
      { id: "pizza-entiere",         emoji: "🍕", name: "Pizza entière",       portionLabel: "1 pizza · env. 360g", portionG: 360, calories: 730, proteinG: 29, carbsG: 94, fatG: 24 },
    ],
  },
  {
    id: "japonais",
    label: "Japonais",
    emoji: "🍣",
    dishes: [
      { id: "maki-x6",     emoji: "🍣", name: "Maki x6",         portionLabel: "6 pièces · env. 110g", portionG: 110, calories: 150, proteinG: 7,  carbsG: 27, fatG: 2  },
      { id: "california-6",emoji: "🍱", name: "California roll x6",portionLabel: "6 pièces · env. 150g", portionG: 150, calories: 220, proteinG: 9,  carbsG: 35, fatG: 6  },
      { id: "nigiri-3",    emoji: "🍣", name: "Nigiri x3",        portionLabel: "3 pièces · env. 120g", portionG: 120, calories: 160, proteinG: 9,  carbsG: 28, fatG: 2  },
      { id: "sashimi-6",   emoji: "🐟", name: "Sashimi x6",       portionLabel: "6 pièces · env. 120g", portionG: 120, calories: 120, proteinG: 18, carbsG: 1,  fatG: 4  },
      { id: "chirashi",    emoji: "🍱", name: "Bol chirashi",      portionLabel: "1 bol · env. 380g",   portionG: 380, calories: 480, proteinG: 26, carbsG: 72, fatG: 8  },
      { id: "ramen",       emoji: "🍜", name: "Ramen",             portionLabel: "1 bol · env. 500g",   portionG: 500, calories: 520, proteinG: 22, carbsG: 68, fatG: 16 },
    ],
  },
  {
    id: "asiatique",
    label: "Asiatique",
    emoji: "🥡",
    dishes: [
      { id: "bo-bun",         emoji: "🥗", name: "Bo bun",           portionLabel: "1 bol · env. 350g",   portionG: 350, calories: 420, proteinG: 22, carbsG: 56, fatG: 10 },
      { id: "pad-thai",       emoji: "🍜", name: "Pad thaï",          portionLabel: "1 assiette · env. 360g",portionG: 360, calories: 530, proteinG: 22, carbsG: 68, fatG: 18 },
      { id: "nems-3",         emoji: "🥟", name: "Nems x3",           portionLabel: "3 nems · env. 120g",  portionG: 120, calories: 230, proteinG: 8,  carbsG: 22, fatG: 13 },
      { id: "riz-cantonais",  emoji: "🍚", name: "Riz cantonais",     portionLabel: "1 assiette · env. 260g",portionG: 260, calories: 380, proteinG: 12, carbsG: 62, fatG: 10 },
      { id: "wok-legumes",    emoji: "🥦", name: "Wok de légumes",    portionLabel: "1 assiette · env. 300g",portionG: 300, calories: 280, proteinG: 8,  carbsG: 40, fatG: 10 },
      { id: "poulet-curry",   emoji: "🍛", name: "Poulet au curry",   portionLabel: "1 assiette · env. 350g",portionG: 350, calories: 450, proteinG: 28, carbsG: 42, fatG: 16 },
    ],
  },
  {
    id: "sandwicherie",
    label: "Sandwich",
    emoji: "🥪",
    dishes: [
      { id: "jambon-beurre",   emoji: "🥖", name: "Jambon beurre",     portionLabel: "1 sandwich · env. 200g",portionG: 200, calories: 430, proteinG: 18, carbsG: 46, fatG: 18 },
      { id: "kebab",           emoji: "🌮", name: "Kebab",              portionLabel: "1 kebab · env. 360g",  portionG: 360, calories: 620, proteinG: 30, carbsG: 58, fatG: 26 },
      { id: "croque-monsieur", emoji: "🧀", name: "Croque-monsieur",    portionLabel: "1 croque · env. 180g", portionG: 180, calories: 430, proteinG: 20, carbsG: 40, fatG: 20 },
      { id: "bagel-saumon",    emoji: "🥯", name: "Bagel saumon",       portionLabel: "1 bagel · env. 240g",  portionG: 240, calories: 480, proteinG: 26, carbsG: 52, fatG: 18 },
      { id: "panini",          emoji: "🥪", name: "Panini poulet",      portionLabel: "1 panini · env. 200g", portionG: 200, calories: 420, proteinG: 24, carbsG: 44, fatG: 14 },
    ],
  },
  {
    id: "traditionnel",
    label: "Traditionnel",
    emoji: "🍽️",
    dishes: [
      { id: "steak-frites",       emoji: "🥩", name: "Steak frites",        portionLabel: "1 assiette · env. 400g",portionG: 400, calories: 720, proteinG: 42, carbsG: 52, fatG: 32 },
      { id: "poulet-roti",        emoji: "🍗", name: "Poulet rôti",          portionLabel: "1 cuisse+pilon · env. 220g",portionG:220, calories: 350, proteinG: 36, carbsG: 0,  fatG: 22 },
      { id: "pates-bolognaise",   emoji: "🍝", name: "Pâtes bolognaise",     portionLabel: "1 assiette · env. 360g",portionG: 360, calories: 490, proteinG: 26, carbsG: 62, fatG: 14 },
      { id: "salade-cesar",       emoji: "🥗", name: "Salade César",         portionLabel: "1 assiette · env. 260g",portionG: 260, calories: 360, proteinG: 22, carbsG: 18, fatG: 22 },
      { id: "quiche-lorraine",    emoji: "🥧", name: "Quiche lorraine (part)",portionLabel: "1 part · env. 160g",  portionG: 160, calories: 360, proteinG: 14, carbsG: 24, fatG: 24 },
      { id: "tajine-poulet",      emoji: "🫕", name: "Tajine poulet",        portionLabel: "1 assiette · env. 300g",portionG: 300, calories: 380, proteinG: 28, carbsG: 35, fatG: 12 },
      { id: "entrecote",          emoji: "🥩", name: "Entrecôte",            portionLabel: "1 pièce · env. 220g",  portionG: 220, calories: 480, proteinG: 44, carbsG: 0,  fatG: 32 },
    ],
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createRestaurantItem(dish: RestaurantDish, portions: number): MealItem {
  const factor = portions;
  return {
    id: `rest-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    foodId: `restaurant-${dish.id}`,
    foodNameSnapshot: `${dish.name} (restau, ~estimation)`,
    quantityG: Math.round(dish.portionG * factor),
    calories: Math.round(dish.calories * factor),
    proteinG: Math.round(dish.proteinG * factor),
    carbsG: Math.round(dish.carbsG * factor),
    fatG: Math.round(dish.fatG * factor),
    isComplete: true,
  };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

type Props = {
  onAdd: (item: MealItem) => void;
  onClose: () => void;
};

export function RestaurantSheet({ onAdd, onClose }: Props) {
  const [activeCat, setActiveCat] = useState<string>("fastfood");
  const [selectedDish, setSelectedDish] = useState<RestaurantDish | null>(null);
  const [portions, setPortions] = useState(1);
  const [addedFlash, setAddedFlash] = useState("");

  const category = RESTAURANT_CATEGORIES.find((c) => c.id === activeCat)!;

  function handleSelectDish(dish: RestaurantDish) {
    setSelectedDish(dish);
    setPortions(1);
  }

  function handleAdd() {
    if (!selectedDish) return;
    const item = createRestaurantItem(selectedDish, portions);
    onAdd(item);
    setAddedFlash(`${selectedDish.name} ajouté ✓`);
    setSelectedDish(null);
    setPortions(1);
    window.setTimeout(() => setAddedFlash(""), 2500);
  }

  const preview = selectedDish
    ? {
        calories: Math.round(selectedDish.calories * portions),
        proteinG: Math.round(selectedDish.proteinG * portions),
        carbsG: Math.round(selectedDish.carbsG * portions),
        fatG: Math.round(selectedDish.fatG * portions),
      }
    : null;

  return (
    <div className="fixed inset-0 z-[110] flex flex-col bg-[var(--mt-bg)]">
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-5 pb-3 pt-[calc(16px+env(safe-area-inset-top))]">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[var(--mt-rouge)]">
            Repas extérieur
          </p>
          <h1 className="mt-display mt-1 text-[30px] font-semibold leading-none tracking-[-0.045em] text-[var(--mt-ink)]">
            Mode restaurant
          </h1>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="grid h-10 w-10 place-items-center rounded-full bg-[var(--mt-card-soft)] text-[var(--mt-ink)] ring-1 ring-[var(--mt-line)]"
        >
          <CloseIcon />
        </button>
      </div>

      {/* ── Disclaimer ── */}
      <div className="mx-5 mb-3 rounded-[16px] bg-[var(--mt-card-soft)] px-4 py-2.5 text-[12px] font-semibold leading-5 text-[var(--mt-ink-2)] ring-1 ring-[var(--mt-line)]">
        💡 Valeurs approximatives — pratique pour un repas au resto sans peser.
      </div>

      {/* ── Category chips ── */}
      <div className="flex gap-2 overflow-x-auto px-5 pb-1">
        {RESTAURANT_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => {
              setActiveCat(cat.id);
              setSelectedDish(null);
            }}
            className={`shrink-0 rounded-full px-4 py-2.5 text-[12px] font-black transition-colors ${
              activeCat === cat.id
                ? "bg-[var(--mt-ink)] text-[var(--mt-bg)]"
                : "bg-[var(--mt-card)] text-[var(--mt-ink-2)] ring-1 ring-[var(--mt-line)]"
            }`}
          >
            {cat.emoji} {cat.label}
          </button>
        ))}
      </div>

      {/* ── Flash confirmation ── */}
      {addedFlash && (
        <div className="mx-5 mt-3 rounded-[14px] bg-[var(--mt-success-soft)] px-3 py-2.5 text-center text-[12px] font-bold text-[var(--mt-success)]">
          {addedFlash}
        </div>
      )}

      {/* ── Dish grid (scrollable) ── */}
      <div className="mt-3 flex-1 overflow-y-auto px-5 pb-4">
        <div className="grid grid-cols-2 gap-3">
          {category.dishes.map((dish) => {
            const isSelected = selectedDish?.id === dish.id;
            return (
              <button
                key={dish.id}
                type="button"
                onClick={() => handleSelectDish(dish)}
                className={`rounded-[22px] p-4 text-left transition-all ${
                  isSelected
                    ? "bg-gradient-to-br from-[var(--mt-rouge-lit)] via-[var(--mt-rouge)] to-[var(--mt-rouge-deep)] shadow-[var(--mt-shadow-red)]"
                    : "bg-[var(--mt-card)] ring-1 ring-[var(--mt-line)]"
                }`}
              >
                <p className="text-[28px] leading-none">{dish.emoji}</p>
                <p
                  className={`mt-3 text-[13px] font-black leading-tight tracking-[-0.01em] ${
                    isSelected ? "text-white" : "text-[var(--mt-ink)]"
                  }`}
                >
                  {dish.name}
                </p>
                <p
                  className={`mt-1 text-[10.5px] font-semibold leading-tight ${
                    isSelected ? "text-white/72" : "text-[var(--mt-ink-3)]"
                  }`}
                >
                  {dish.portionLabel}
                </p>
                <p
                  className={`mt-3 text-[22px] font-black leading-none tracking-[-0.03em] ${
                    isSelected ? "text-white" : "text-[var(--mt-ink)]"
                  }`}
                >
                  {dish.calories}
                  <span
                    className={`ml-1 text-[11px] font-bold ${
                      isSelected ? "text-white/72" : "text-[var(--mt-ink-3)]"
                    }`}
                  >
                    kcal
                  </span>
                </p>
                <div className={`mt-2 flex gap-2 text-[10px] font-black ${isSelected ? "text-white/80" : "text-[var(--mt-ink-2)]"}`}>
                  <span>P {dish.proteinG}g</span>
                  <span>G {dish.carbsG}g</span>
                  <span>L {dish.fatG}g</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Portion stepper + Add bar (fixed bottom) ── */}
      {selectedDish && (
        <div className="border-t border-[var(--mt-line)] bg-[var(--mt-card)] px-5 pb-[calc(16px+env(safe-area-inset-bottom))] pt-4">
          <div className="flex items-center justify-between gap-3">
            {/* Stepper */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setPortions((p) => Math.max(1, p - 1))}
                className="grid h-10 w-10 place-items-center rounded-full bg-[var(--mt-card-soft)] text-[22px] font-black text-[var(--mt-ink)] ring-1 ring-[var(--mt-line)]"
              >
                −
              </button>
              <div className="min-w-[48px] text-center">
                <p className="text-[28px] font-black leading-none tracking-[-0.04em] text-[var(--mt-ink)]">
                  {portions}
                </p>
                <p className="text-[10px] font-bold text-[var(--mt-ink-3)]">
                  portion{portions > 1 ? "s" : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPortions((p) => Math.min(10, p + 1))}
                className="grid h-10 w-10 place-items-center rounded-full bg-[var(--mt-card-soft)] text-[22px] font-black text-[var(--mt-ink)] ring-1 ring-[var(--mt-line)]"
              >
                +
              </button>
            </div>

            {/* Macros preview */}
            {preview && (
              <div className="flex-1 rounded-[16px] bg-[var(--mt-card-soft)] px-3 py-2 text-right ring-1 ring-[var(--mt-line)]">
                <p className="text-[20px] font-black leading-none tracking-[-0.03em] text-[var(--mt-ink)]">
                  {preview.calories} <span className="text-[11px] font-bold text-[var(--mt-ink-3)]">kcal</span>
                </p>
                <p className="mt-1 text-[10px] font-black text-[var(--mt-ink-2)]">
                  P{preview.proteinG} · G{preview.carbsG} · L{preview.fatG}
                </p>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleAdd}
            className="mt-btn-primary mt-4"
          >
            Ajouter au repas
          </button>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}
