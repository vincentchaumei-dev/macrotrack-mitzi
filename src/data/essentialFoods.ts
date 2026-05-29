import { ciqualFoods } from "@/data/ciqualFoods.generated";
import { Food } from "@/types/nutrition";

type EssentialDefinition = {
  id: string;
  name: string;
  category: string;
  queries: string[][];
  avoid?: string[];
  preferred?: string[];
  servingName?: string;
  servingSizeG?: number;
  isFavorite?: boolean;
};

function normalizeSearchText(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/œ/g, "oe")
    .replace(/Œ/g, "oe")
    .toLowerCase()
    .trim();
}

function includesAll(text: string, words: string[]) {
  return words.every((word) => text.includes(normalizeSearchText(word)));
}

function includesAny(text: string, words: string[]) {
  return words.some((word) => text.includes(normalizeSearchText(word)));
}

function scoreFood(food: Food, definition: EssentialDefinition) {
  const foodName = normalizeSearchText(food.name);
  const category = normalizeSearchText(food.category);
  const fullText = `${foodName} ${category}`;

  const matchesQuery = definition.queries.some((query) =>
    includesAll(fullText, query)
  );

  if (!matchesQuery) return -999999;

  let score = 0;

  if (food.category === definition.category) score += 200;

  if (definition.preferred && includesAny(fullText, definition.preferred)) {
    score += 250;
  }

  if (definition.avoid && includesAny(fullText, definition.avoid)) {
    score -= 900;
  }

  const wordCount = food.name.split(",").length + food.name.split(" ").length;

  if (wordCount <= 6) score += 150;
  if (wordCount <= 10) score += 80;
  if (wordCount > 18) score -= 120;

  if (food.dataQualityStatus === "complete") score += 100;

  return score;
}

function createEssentialFood(definition: EssentialDefinition): Food | null {
  const bestMatch = ciqualFoods
    .map((food) => ({
      food,
      score: scoreFood(food, definition),
    }))
    .filter((item) => item.score > -999999)
    .sort((a, b) => b.score - a.score)[0]?.food;

  if (!bestMatch) {
    return null;
  }

  const createdAt = "2026-01-01T00:00:00.000Z";

  return {
    ...bestMatch,
    id: `essential-${definition.id}`,
    name: definition.name,
    officialName: bestMatch.name,
    category: definition.category,
    servingName: definition.servingName ?? "100 g",
    servingSizeG: definition.servingSizeG ?? 100,
    isFavorite: definition.isFavorite ?? false,
    isEssential: true,
    source: "ciqual",
    verified: true,
    dataQualityStatus: bestMatch.dataQualityStatus ?? "complete",
    createdAt,
    updatedAt: createdAt,
  };
}

const essentialDefinitions: EssentialDefinition[] = [
  // Fruits
  {
    id: "banane",
    name: "Banane",
    category: "Fruits",
    queries: [["banane"]],
    avoid: ["sechee", "séchée", "chips", "dessert"],
  },
  {
    id: "pomme",
    name: "Pomme",
    category: "Fruits",
    queries: [["pomme"]],
    avoid: ["compote", "jus", "tarte", "sechee", "séchée"],
  },
  {
    id: "poire",
    name: "Poire",
    category: "Fruits",
    queries: [["poire"]],
    avoid: ["sirop", "tarte", "jus"],
  },
  {
    id: "orange",
    name: "Orange",
    category: "Fruits",
    queries: [["orange"]],
    avoid: ["jus", "confiture"],
  },
  {
    id: "kiwi",
    name: "Kiwi",
    category: "Fruits",
    queries: [["kiwi"]],
  },
  {
    id: "fraise",
    name: "Fraise",
    category: "Fruits",
    queries: [["fraise"]],
    avoid: ["confiture", "tarte", "dessert"],
  },
  {
    id: "framboise",
    name: "Framboise",
    category: "Fruits",
    queries: [["framboise"]],
    avoid: ["confiture", "dessert"],
  },
  {
    id: "myrtille",
    name: "Myrtille",
    category: "Fruits",
    queries: [["myrtille"]],
    avoid: ["confiture", "dessert"],
  },
  {
    id: "mangue",
    name: "Mangue",
    category: "Fruits",
    queries: [["mangue"]],
    avoid: ["jus", "sechee", "séchée"],
  },
  {
    id: "ananas",
    name: "Ananas",
    category: "Fruits",
    queries: [["ananas"]],
    avoid: ["jus", "sirop"],
  },
  {
    id: "avocat",
    name: "Avocat",
    category: "Fruits",
    queries: [["avocat"]],
  },

  // Légumes
  {
    id: "brocoli-cuit",
    name: "Brocoli cuit",
    category: "Légumes",
    queries: [["brocoli", "cuit"], ["brocoli"]],
    preferred: ["cuit", "bouilli", "vapeur"],
  },
  {
    id: "courgette-cuite",
    name: "Courgette cuite",
    category: "Légumes",
    queries: [["courgette", "cuit"], ["courgette"]],
    preferred: ["cuite"],
  },
  {
    id: "carotte-cuite",
    name: "Carotte cuite",
    category: "Légumes",
    queries: [["carotte", "cuite"], ["carotte", "cuit"], ["carotte"]],
    preferred: ["cuite"],
  },
  {
    id: "tomate",
    name: "Tomate",
    category: "Légumes",
    queries: [["tomate"]],
    avoid: ["sauce", "concentré", "concentre", "jus"],
  },
  {
    id: "concombre",
    name: "Concombre",
    category: "Légumes",
    queries: [["concombre"]],
  },
  {
    id: "poivron",
    name: "Poivron",
    category: "Légumes",
    queries: [["poivron"]],
  },
  {
    id: "haricots-verts-cuits",
    name: "Haricots verts cuits",
    category: "Légumes",
    queries: [["haricot", "vert", "cuit"], ["haricots", "verts"]],
    preferred: ["cuit"],
  },
  {
    id: "epinards-cuits",
    name: "Épinards cuits",
    category: "Légumes",
    queries: [["epinard", "cuit"], ["epinards", "cuits"], ["épinard"]],
    preferred: ["cuit"],
  },
  {
    id: "champignons",
    name: "Champignons",
    category: "Légumes",
    queries: [["champignon"]],
    avoid: ["sauce", "pizza"],
  },
  {
    id: "chou-fleur-cuit",
    name: "Chou-fleur cuit",
    category: "Légumes",
    queries: [["chou", "fleur", "cuit"], ["chou-fleur"]],
    preferred: ["cuit"],
  },
  {
    id: "oignon",
    name: "Oignon",
    category: "Légumes",
    queries: [["oignon"]],
  },

  // Féculents
  {
    id: "riz-blanc-cuit",
    name: "Riz blanc cuit",
    category: "Féculents & céréales",
    queries: [["riz", "blanc", "cuit"], ["riz", "cuit"]],
    preferred: ["blanc", "cuit"],
    avoid: ["salade", "dessert", "plat"],
  },
  {
    id: "riz-complet-cuit",
    name: "Riz complet cuit",
    category: "Féculents & céréales",
    queries: [["riz", "complet", "cuit"], ["riz complet"]],
    preferred: ["complet", "cuit"],
  },
  {
    id: "pates-cuites",
    name: "Pâtes cuites",
    category: "Féculents & céréales",
    queries: [["pates", "cuites"], ["pâte", "cuite"], ["pates"]],
    preferred: ["cuites"],
    avoid: ["sauce", "salade", "lasagne"],
  },
  {
    id: "pates-completes-cuites",
    name: "Pâtes complètes cuites",
    category: "Féculents & céréales",
    queries: [["pates", "completes", "cuites"], ["pate", "complete"]],
    preferred: ["complete", "cuites"],
  },
  {
    id: "quinoa-cuit",
    name: "Quinoa cuit",
    category: "Féculents & céréales",
    queries: [["quinoa", "cuit"], ["quinoa"]],
    preferred: ["cuit"],
  },
  {
    id: "semoule-cuite",
    name: "Semoule cuite",
    category: "Féculents & céréales",
    queries: [["semoule", "cuite"], ["semoule"]],
    preferred: ["cuite"],
  },
  {
    id: "boulgour-cuit",
    name: "Boulgour cuit",
    category: "Féculents & céréales",
    queries: [["boulgour", "cuit"], ["boulgour"]],
    preferred: ["cuit"],
  },
  {
    id: "pomme-de-terre-cuite",
    name: "Pomme de terre cuite",
    category: "Féculents & céréales",
    queries: [["pomme", "terre", "cuite"], ["pomme de terre"]],
    preferred: ["cuite", "vapeur"],
    avoid: ["frite", "chips", "purée", "puree"],
  },
  {
    id: "patate-douce-cuite",
    name: "Patate douce cuite",
    category: "Féculents & céréales",
    queries: [["patate", "douce", "cuite"], ["patate douce"]],
    preferred: ["cuite"],
  },
  {
    id: "flocons-avoine",
    name: "Flocons d’avoine",
    category: "Féculents & céréales",
    queries: [["flocons", "avoine"], ["avoine"]],
    avoid: ["biscuit", "barre"],
  },
  {
    id: "pain-complet",
    name: "Pain complet",
    category: "Pains & boulangerie",
    queries: [["pain", "complet"]],
    avoid: ["sandwich", "burger"],
  },

  // Protéines animales
  {
    id: "poulet-filet-cuit",
    name: "Poulet filet cuit",
    category: "Viandes",
    queries: [["poulet", "filet", "cuit"], ["poulet", "blanc", "cuit"]],
    preferred: ["filet", "blanc", "cuit"],
    avoid: ["burger", "sandwich", "nugget", "pané", "pane", "pizza"],
  },
  {
    id: "poulet-roti",
    name: "Poulet rôti",
    category: "Viandes",
    queries: [["poulet", "roti"], ["poulet", "rôti"]],
    preferred: ["roti", "rôti"],
    avoid: ["burger", "sandwich"],
  },
  {
    id: "dinde-escalope-cuite",
    name: "Dinde escalope cuite",
    category: "Viandes",
    queries: [["dinde", "escalope"], ["dinde", "cuite"]],
    preferred: ["escalope", "cuite"],
  },
  {
    id: "steak-hache-5",
    name: "Steak haché 5%",
    category: "Viandes",
    queries: [["steak", "hache", "5"], ["boeuf", "hache", "5"]],
    preferred: ["5"],
  },
  {
    id: "jambon-blanc",
    name: "Jambon blanc",
    category: "Viandes",
    queries: [["jambon", "blanc"], ["jambon", "cuit"]],
    preferred: ["blanc", "cuit"],
  },
  {
    id: "oeuf-entier",
    name: "Œuf entier",
    category: "Œufs",
    queries: [["oeuf", "entier"], ["œuf", "entier"], ["oeuf"]],
    preferred: ["entier"],
    avoid: ["gateau", "gâteau", "biscuit", "dessert"],
  },
  {
    id: "oeuf-dur",
    name: "Œuf dur",
    category: "Œufs",
    queries: [["oeuf", "dur"], ["œuf", "dur"]],
    preferred: ["dur"],
    avoid: ["gateau", "gâteau"],
  },
  {
    id: "oeuf-au-plat",
    name: "Œuf au plat",
    category: "Œufs",
    queries: [["oeuf", "plat"], ["œuf", "plat"]],
    preferred: ["plat"],
    avoid: ["gateau", "gâteau"],
  },

  // Poissons
  {
    id: "thon-naturel",
    name: "Thon au naturel",
    category: "Poissons",
    queries: [["thon", "naturel"], ["thon"]],
    preferred: ["naturel"],
    avoid: ["huile", "sandwich", "salade"],
  },
  {
    id: "saumon-cuit",
    name: "Saumon cuit",
    category: "Poissons",
    queries: [["saumon", "cuit"], ["saumon"]],
    preferred: ["cuit"],
    avoid: ["sushi", "fumé", "fume"],
  },
  {
    id: "cabillaud-cuit",
    name: "Cabillaud cuit",
    category: "Poissons",
    queries: [["cabillaud", "cuit"], ["cabillaud"]],
    preferred: ["cuit"],
  },
  {
    id: "crevettes-cuites",
    name: "Crevettes cuites",
    category: "Poissons",
    queries: [["crevette", "cuite"], ["crevettes"]],
    preferred: ["cuite"],
  },

  // Légumineuses
  {
    id: "lentilles-cuites",
    name: "Lentilles cuites",
    category: "Légumineuses",
    queries: [["lentilles", "cuites"], ["lentille", "cuite"], ["lentilles"]],
    preferred: ["cuites"],
  },
  {
    id: "pois-chiches-cuits",
    name: "Pois chiches cuits",
    category: "Légumineuses",
    queries: [["pois", "chiches", "cuits"], ["pois chiches"]],
    preferred: ["cuits"],
  },
  {
    id: "haricots-rouges-cuits",
    name: "Haricots rouges cuits",
    category: "Légumineuses",
    queries: [["haricots", "rouges", "cuits"], ["haricot", "rouge"]],
    preferred: ["cuits"],
  },
  {
    id: "haricots-blancs-cuits",
    name: "Haricots blancs cuits",
    category: "Légumineuses",
    queries: [["haricots", "blancs", "cuits"], ["haricot", "blanc"]],
    preferred: ["cuits"],
  },

  // Produits laitiers
  {
    id: "fromage-blanc",
    name: "Fromage blanc nature",
    category: "Produits laitiers",
    queries: [["fromage", "blanc"]],
    avoid: ["sucre", "dessert"],
  },
  {
    id: "yaourt-nature",
    name: "Yaourt nature",
    category: "Produits laitiers",
    queries: [["yaourt", "nature"]],
    avoid: ["sucre", "fruit", "dessert"],
  },
  {
    id: "lait-demi-ecreme",
    name: "Lait demi-écrémé",
    category: "Produits laitiers",
    queries: [["lait", "demi", "ecreme"], ["lait", "demi", "écrémé"]],
    preferred: ["demi"],
  },
  {
    id: "mozzarella",
    name: "Mozzarella",
    category: "Fromages",
    queries: [["mozzarella"]],
  },
  {
    id: "feta",
    name: "Feta",
    category: "Fromages",
    queries: [["feta"]],
  },

  // Matières grasses & oléagineux
  {
    id: "huile-olive",
    name: "Huile d’olive",
    category: "Matières grasses",
    queries: [["huile", "olive"]],
  },
  {
    id: "beurre",
    name: "Beurre",
    category: "Matières grasses",
    queries: [["beurre"]],
    avoid: ["cacahuete", "cacahuète"],
  },
  {
    id: "amandes",
    name: "Amandes",
    category: "Oléagineux & graines",
    queries: [["amande"]],
    avoid: ["lait", "poudre"],
  },
  {
    id: "noix",
    name: "Noix",
    category: "Oléagineux & graines",
    queries: [["noix"]],
    avoid: ["huile"],
  },
  {
    id: "noix-cajou",
    name: "Noix de cajou",
    category: "Oléagineux & graines",
    queries: [["noix", "cajou"]],
  },
  {
    id: "beurre-cacahuete",
    name: "Beurre de cacahuète",
    category: "Oléagineux & graines",
    queries: [["beurre", "cacahuete"], ["beurre", "cacahuète"]],
  },
];

export const essentialFoods: Food[] = essentialDefinitions
  .map(createEssentialFood)
  .filter((food): food is Food => food !== null);