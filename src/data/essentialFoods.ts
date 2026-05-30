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

function getExpectedCaloriesRange(definition: EssentialDefinition): [number, number] | null {
    const name = normalizeSearchText(definition.name);
    const category = definition.category;
  
    if (name.includes("huile")) return [850, 950];
  
    if (
      name.includes("amande") ||
      name.includes("noix") ||
      name.includes("cacahuete") ||
      name.includes("cacahuète") ||
      name.includes("beurre de cacahuete") ||
      name.includes("beurre de cacahuète")
    ) {
      return [450, 750];
    }
  
    if (name.includes("beurre") && !name.includes("cacahuete")) {
      return [700, 780];
    }
  
    if (name.includes("avocat")) return [120, 250];
  
    if (category === "Fruits") return [20, 140];
  
    if (category === "Légumes") return [5, 120];
  
    if (category === "Féculents & céréales") {
      if (name.includes("flocons") || name.includes("avoine")) {
        return [330, 420];
      }
  
      if (name.includes("pain")) {
        return [200, 310];
      }
  
      if (
        name.includes("cuit") ||
        name.includes("cuite") ||
        name.includes("cuites") ||
        name.includes("cuits")
      ) {
        return [60, 220];
      }
  
      return [60, 420];
    }
  
    if (category === "Légumineuses") {
      if (
        name.includes("cuit") ||
        name.includes("cuite") ||
        name.includes("cuites") ||
        name.includes("cuits")
      ) {
        return [60, 200];
      }
  
      return [60, 380];
    }
  
    if (category === "Viandes") {
      if (name.includes("steak") && name.includes("5")) return [100, 180];
      if (name.includes("jambon")) return [80, 170];
      if (name.includes("poulet") || name.includes("dinde")) return [90, 240];
  
      return [80, 350];
    }
  
    if (category === "Poissons") {
      if (name.includes("saumon")) return [130, 280];
      if (name.includes("thon")) return [80, 180];
      if (name.includes("cabillaud")) return [60, 140];
      if (name.includes("crevette")) return [60, 140];
  
      return [50, 350];
    }
  
    if (category === "Œufs") return [120, 220];
  
    if (category === "Produits laitiers") {
      if (name.includes("lait")) return [30, 80];
      if (name.includes("fromage blanc")) return [40, 120];
      if (name.includes("yaourt")) return [40, 130];
  
      return [30, 180];
    }
  
    if (category === "Fromages") return [180, 420];
  
    return null;
  }
  
  function isInExpectedCaloriesRange(food: Food, definition: EssentialDefinition) {
    const range = getExpectedCaloriesRange(definition);
  
    if (!range) return true;
    if (food.caloriesPer100g === null || food.caloriesPer100g === undefined) {
      return false;
    }
  
    const [min, max] = range;
  
    return food.caloriesPer100g >= min && food.caloriesPer100g <= max;
  }
  
  function getCookingExpectation(definition: EssentialDefinition) {
    const name = normalizeSearchText(definition.name);
  
    if (
      name.includes("cuit") ||
      name.includes("cuite") ||
      name.includes("cuits") ||
      name.includes("cuites")
    ) {
      return "cooked";
    }
  
    return null;
  }
  
  function hasCookedKeyword(text: string) {
    return (
      text.includes("cuit") ||
      text.includes("cuite") ||
      text.includes("cuits") ||
      text.includes("cuites") ||
      text.includes("bouilli") ||
      text.includes("bouillie") ||
      text.includes("vapeur") ||
      text.includes("poele") ||
      text.includes("poêlé") ||
      text.includes("roti") ||
      text.includes("rôti")
    );
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
  
    const caloriesInExpectedRange = isInExpectedCaloriesRange(food, definition);
    const cookingExpectation = getCookingExpectation(definition);
  
    if (food.category === definition.category) score += 300;
  
    if (definition.preferred && includesAny(fullText, definition.preferred)) {
      score += 350;
    }
  
    if (definition.avoid && includesAny(fullText, definition.avoid)) {
      score -= 1500;
    }
  
    if (caloriesInExpectedRange) {
      score += 2000;
    } else {
      score -= 5000;
    }
  
    if (cookingExpectation === "cooked") {
      if (hasCookedKeyword(fullText)) {
        score += 1200;
      } else {
        score -= 2500;
      }
    }
  
    if (food.dataQualityStatus === "complete") score += 300;
  
    const commaCount = food.name.split(",").length;
    const wordCount = food.name.split(" ").length;
  
    if (commaCount <= 2) score += 200;
    if (wordCount <= 8) score += 150;
    if (wordCount > 18) score -= 200;
  
    const badProcessedWords = [
      "burger",
      "sandwich",
      "pizza",
      "gateau",
      "gâteau",
      "biscuit",
      "dessert",
      "sauce",
      "restauration rapide",
      "préemballé",
      "preemballe",
      "plat composé",
      "plat compose",
      "pané",
      "pane",
      "frit",
      "nugget",
    ];
  
    if (includesAny(fullText, badProcessedWords)) {
      score -= 2500;
    }
  
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
  
    const autoReviewed =
      bestMatch.dataQualityStatus === "complete" &&
      isInExpectedCaloriesRange(bestMatch, definition);
  
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
      reviewed: autoReviewed,
      reviewNotes: autoReviewed
        ? "Auto-audit : correspondance Ciqual cohérente avec les bornes attendues."
        : "Auto-audit : valeur à vérifier, correspondance Ciqual potentiellement incertaine.",
      dataQualityStatus: autoReviewed
        ? "complete"
        : bestMatch.dataQualityStatus ?? "needs_review",
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
      servingName: "1 banane moyenne",
      servingSizeG: 120,
      isFavorite: true,
    },
    {
      id: "pomme",
      name: "Pomme",
      category: "Fruits",
      queries: [["pomme"]],
      avoid: ["compote", "jus", "tarte", "sechee", "séchée"],
      servingName: "1 pomme moyenne",
      servingSizeG: 150,
      isFavorite: true,
    },
    {
      id: "poire",
      name: "Poire",
      category: "Fruits",
      queries: [["poire"]],
      avoid: ["sirop", "tarte", "jus"],
      servingName: "1 poire moyenne",
      servingSizeG: 160,
    },
    {
      id: "orange",
      name: "Orange",
      category: "Fruits",
      queries: [["orange"]],
      avoid: ["jus", "confiture"],
      servingName: "1 orange",
      servingSizeG: 160,
    },
    {
      id: "kiwi",
      name: "Kiwi",
      category: "Fruits",
      queries: [["kiwi"]],
      servingName: "1 kiwi",
      servingSizeG: 75,
    },
    {
      id: "fraise",
      name: "Fraises",
      category: "Fruits",
      queries: [["fraise"]],
      avoid: ["confiture", "tarte", "dessert"],
      servingName: "1 bol",
      servingSizeG: 150,
    },
    {
      id: "framboise",
      name: "Framboises",
      category: "Fruits",
      queries: [["framboise"]],
      avoid: ["confiture", "dessert"],
      servingName: "1 bol",
      servingSizeG: 125,
    },
    {
      id: "myrtille",
      name: "Myrtilles",
      category: "Fruits",
      queries: [["myrtille"]],
      avoid: ["confiture", "dessert"],
      servingName: "1 bol",
      servingSizeG: 125,
    },
    {
      id: "mangue",
      name: "Mangue",
      category: "Fruits",
      queries: [["mangue"]],
      avoid: ["jus", "sechee", "séchée"],
      servingName: "1 portion",
      servingSizeG: 150,
    },
    {
      id: "ananas",
      name: "Ananas",
      category: "Fruits",
      queries: [["ananas"]],
      avoid: ["jus", "sirop"],
      servingName: "1 portion",
      servingSizeG: 150,
    },
    {
      id: "avocat",
      name: "Avocat",
      category: "Fruits",
      queries: [["avocat"]],
      servingName: "1/2 avocat",
      servingSizeG: 100,
    },
  
    // Légumes
    {
      id: "brocoli-cuit",
      name: "Brocoli cuit",
      category: "Légumes",
      queries: [["brocoli", "cuit"], ["brocoli"]],
      preferred: ["cuit", "bouilli", "vapeur"],
      servingName: "1 portion",
      servingSizeG: 200,
      isFavorite: true,
    },
    {
      id: "courgette-cuite",
      name: "Courgette cuite",
      category: "Légumes",
      queries: [["courgette", "cuit"], ["courgette"]],
      preferred: ["cuite"],
      servingName: "1 portion",
      servingSizeG: 200,
    },
    {
      id: "carotte-cuite",
      name: "Carotte cuite",
      category: "Légumes",
      queries: [["carotte", "cuite"], ["carotte", "cuit"], ["carotte"]],
      preferred: ["cuite"],
      servingName: "1 portion",
      servingSizeG: 150,
    },
    {
      id: "tomate",
      name: "Tomate",
      category: "Légumes",
      queries: [["tomate"]],
      avoid: ["sauce", "concentré", "concentre", "jus"],
      servingName: "1 tomate moyenne",
      servingSizeG: 120,
    },
    {
      id: "concombre",
      name: "Concombre",
      category: "Légumes",
      queries: [["concombre"]],
      servingName: "1 portion",
      servingSizeG: 100,
    },
    {
      id: "poivron",
      name: "Poivron",
      category: "Légumes",
      queries: [["poivron"]],
      servingName: "1 portion",
      servingSizeG: 100,
    },
    {
      id: "haricots-verts-cuits",
      name: "Haricots verts cuits",
      category: "Légumes",
      queries: [["haricot", "vert", "cuit"], ["haricots", "verts"]],
      preferred: ["cuit"],
      servingName: "1 portion",
      servingSizeG: 200,
    },
    {
      id: "epinards-cuits",
      name: "Épinards cuits",
      category: "Légumes",
      queries: [["epinard", "cuit"], ["epinards", "cuits"], ["épinard"]],
      preferred: ["cuit"],
      servingName: "1 portion",
      servingSizeG: 150,
    },
    {
      id: "champignons",
      name: "Champignons",
      category: "Légumes",
      queries: [["champignon"]],
      avoid: ["sauce", "pizza"],
      servingName: "1 portion",
      servingSizeG: 100,
    },
    {
      id: "chou-fleur-cuit",
      name: "Chou-fleur cuit",
      category: "Légumes",
      queries: [["chou", "fleur", "cuit"], ["chou-fleur"]],
      preferred: ["cuit"],
      servingName: "1 portion",
      servingSizeG: 200,
    },
    {
      id: "oignon",
      name: "Oignon",
      category: "Légumes",
      queries: [["oignon"]],
      servingName: "1/2 oignon",
      servingSizeG: 50,
    },
  
    // Féculents & céréales
    {
      id: "riz-blanc-cuit",
      name: "Riz blanc cuit",
      category: "Féculents & céréales",
      queries: [["riz", "blanc", "cuit"], ["riz", "cuit"]],
      preferred: ["blanc", "cuit"],
      avoid: ["salade", "dessert", "plat"],
      servingName: "1 portion",
      servingSizeG: 150,
      isFavorite: true,
    },
    {
      id: "riz-complet-cuit",
      name: "Riz complet cuit",
      category: "Féculents & céréales",
      queries: [["riz", "complet", "cuit"], ["riz complet"]],
      preferred: ["complet", "cuit"],
      servingName: "1 portion",
      servingSizeG: 150,
    },
    {
      id: "pates-cuites",
      name: "Pâtes cuites",
      category: "Féculents & céréales",
      queries: [["pates", "cuites"], ["pâte", "cuite"], ["pates"]],
      preferred: ["cuites"],
      avoid: ["sauce", "salade", "lasagne"],
      servingName: "1 portion",
      servingSizeG: 150,
      isFavorite: true,
    },
    {
      id: "pates-completes-cuites",
      name: "Pâtes complètes cuites",
      category: "Féculents & céréales",
      queries: [["pates", "completes", "cuites"], ["pate", "complete"]],
      preferred: ["complete", "cuites"],
      servingName: "1 portion",
      servingSizeG: 150,
    },
    {
      id: "quinoa-cuit",
      name: "Quinoa cuit",
      category: "Féculents & céréales",
      queries: [["quinoa", "cuit"], ["quinoa"]],
      preferred: ["cuit"],
      servingName: "1 portion",
      servingSizeG: 150,
    },
    {
      id: "semoule-cuite",
      name: "Semoule cuite",
      category: "Féculents & céréales",
      queries: [["semoule", "cuite"], ["semoule"]],
      preferred: ["cuite"],
      servingName: "1 portion",
      servingSizeG: 150,
    },
    {
      id: "boulgour-cuit",
      name: "Boulgour cuit",
      category: "Féculents & céréales",
      queries: [["boulgour", "cuit"], ["boulgour"]],
      preferred: ["cuit"],
      servingName: "1 portion",
      servingSizeG: 150,
    },
    {
      id: "pomme-de-terre-cuite",
      name: "Pomme de terre cuite",
      category: "Féculents & céréales",
      queries: [["pomme", "terre", "cuite"], ["pomme de terre"]],
      preferred: ["cuite", "vapeur"],
      avoid: ["frite", "chips", "purée", "puree"],
      servingName: "1 portion",
      servingSizeG: 200,
      isFavorite: true,
    },
    {
      id: "patate-douce-cuite",
      name: "Patate douce cuite",
      category: "Féculents & céréales",
      queries: [["patate", "douce", "cuite"], ["patate douce"]],
      preferred: ["cuite"],
      servingName: "1 portion",
      servingSizeG: 200,
    },
    {
      id: "flocons-avoine",
      name: "Flocons d’avoine",
      category: "Féculents & céréales",
      queries: [["flocons", "avoine"], ["avoine"]],
      avoid: ["biscuit", "barre"],
      servingName: "1 bol",
      servingSizeG: 50,
      isFavorite: true,
    },
  
    // Pains & boulangerie
    {
      id: "pain-complet",
      name: "Pain complet",
      category: "Pains & boulangerie",
      queries: [["pain", "complet"]],
      avoid: ["sandwich", "burger"],
      servingName: "1 tranche",
      servingSizeG: 40,
      isFavorite: true,
    },
    {
      id: "pain-de-mie-complet",
      name: "Pain de mie complet",
      category: "Pains & boulangerie",
      queries: [["pain", "mie", "complet"], ["pain", "complet"]],
      preferred: ["mie", "complet"],
      avoid: ["sandwich", "burger"],
      servingName: "1 tranche",
      servingSizeG: 40,
    },
    {
      id: "baguette",
      name: "Baguette",
      category: "Pains & boulangerie",
      queries: [["baguette"], ["pain", "baguette"]],
      avoid: ["sandwich"],
      servingName: "1 morceau",
      servingSizeG: 50,
    },
    {
      id: "wrap-ble",
      name: "Wrap de blé",
      category: "Pains & boulangerie",
      queries: [["tortilla", "ble"], ["wrap", "ble"], ["galette", "ble"]],
      preferred: ["ble", "blé"],
      avoid: ["garni", "sandwich"],
      servingName: "1 wrap",
      servingSizeG: 60,
    },
  
    // Protéines animales
    {
      id: "poulet-filet-cuit",
      name: "Filet de poulet cuit",
      category: "Viandes",
      queries: [["poulet", "filet", "cuit"], ["poulet", "blanc", "cuit"]],
      preferred: ["filet", "blanc", "cuit"],
      avoid: ["burger", "sandwich", "nugget", "pané", "pane", "pizza"],
      servingName: "1 portion",
      servingSizeG: 120,
      isFavorite: true,
    },
    {
      id: "poulet-roti",
      name: "Poulet rôti",
      category: "Viandes",
      queries: [["poulet", "roti"], ["poulet", "rôti"]],
      preferred: ["roti", "rôti"],
      avoid: ["burger", "sandwich"],
      servingName: "1 portion",
      servingSizeG: 120,
    },
    {
      id: "dinde-escalope-cuite",
      name: "Escalope de dinde cuite",
      category: "Viandes",
      queries: [["dinde", "escalope"], ["dinde", "cuite"]],
      preferred: ["escalope", "cuite"],
      servingName: "1 portion",
      servingSizeG: 120,
    },
    {
      id: "steak-hache-5",
      name: "Steak haché 5%",
      category: "Viandes",
      queries: [["steak", "hache", "5"], ["boeuf", "hache", "5"]],
      preferred: ["5"],
      servingName: "1 steak",
      servingSizeG: 100,
    },
    {
      id: "jambon-blanc",
      name: "Jambon blanc",
      category: "Viandes",
      queries: [["jambon", "blanc"], ["jambon", "cuit"]],
      preferred: ["blanc", "cuit"],
      servingName: "1 tranche",
      servingSizeG: 40,
      isFavorite: true,
    },
    {
      id: "oeuf-entier",
      name: "Œuf entier",
      category: "Œufs",
      queries: [["oeuf", "entier"], ["œuf", "entier"], ["oeuf"]],
      preferred: ["entier"],
      avoid: ["gateau", "gâteau", "biscuit", "dessert"],
      servingName: "1 œuf",
      servingSizeG: 60,
      isFavorite: true,
    },
    {
      id: "oeuf-dur",
      name: "Œuf dur",
      category: "Œufs",
      queries: [["oeuf", "dur"], ["œuf", "dur"]],
      preferred: ["dur"],
      avoid: ["gateau", "gâteau"],
      servingName: "1 œuf",
      servingSizeG: 60,
    },
    {
      id: "oeuf-au-plat",
      name: "Œuf au plat",
      category: "Œufs",
      queries: [["oeuf", "plat"], ["œuf", "plat"]],
      preferred: ["plat"],
      avoid: ["gateau", "gâteau"],
      servingName: "1 œuf",
      servingSizeG: 60,
    },
  
    // Poissons
    {
      id: "thon-naturel",
      name: "Thon au naturel",
      category: "Poissons",
      queries: [["thon", "naturel"], ["thon"]],
      preferred: ["naturel"],
      avoid: ["huile", "sandwich", "salade"],
      servingName: "1 boîte égouttée",
      servingSizeG: 120,
      isFavorite: true,
    },
    {
      id: "saumon-cuit",
      name: "Saumon cuit",
      category: "Poissons",
      queries: [["saumon", "cuit"], ["saumon"]],
      preferred: ["cuit"],
      avoid: ["sushi", "fumé", "fume"],
      servingName: "1 pavé",
      servingSizeG: 120,
    },
    {
      id: "cabillaud-cuit",
      name: "Cabillaud cuit",
      category: "Poissons",
      queries: [["cabillaud", "cuit"], ["cabillaud"]],
      preferred: ["cuit"],
      servingName: "1 portion",
      servingSizeG: 150,
    },
    {
      id: "crevettes-cuites",
      name: "Crevettes cuites",
      category: "Poissons",
      queries: [["crevette", "cuite"], ["crevettes"]],
      preferred: ["cuite"],
      servingName: "1 portion",
      servingSizeG: 120,
    },
  
    // Légumineuses
    {
      id: "lentilles-cuites",
      name: "Lentilles cuites",
      category: "Légumineuses",
      queries: [["lentilles", "cuites"], ["lentille", "cuite"], ["lentilles"]],
      preferred: ["cuites"],
      servingName: "1 portion",
      servingSizeG: 150,
      isFavorite: true,
    },
    {
      id: "pois-chiches-cuits",
      name: "Pois chiches cuits",
      category: "Légumineuses",
      queries: [["pois", "chiches", "cuits"], ["pois chiches"]],
      preferred: ["cuits"],
      servingName: "1 portion",
      servingSizeG: 150,
    },
    {
      id: "haricots-rouges-cuits",
      name: "Haricots rouges cuits",
      category: "Légumineuses",
      queries: [["haricots", "rouges", "cuits"], ["haricot", "rouge"]],
      preferred: ["cuits"],
      servingName: "1 portion",
      servingSizeG: 150,
    },
    {
      id: "haricots-blancs-cuits",
      name: "Haricots blancs cuits",
      category: "Légumineuses",
      queries: [["haricots", "blancs", "cuits"], ["haricot", "blanc"]],
      preferred: ["cuits"],
      servingName: "1 portion",
      servingSizeG: 150,
    },
    {
      id: "tofu-ferme",
      name: "Tofu ferme",
      category: "Légumineuses",
      queries: [["tofu"], ["tofu", "ferme"]],
      preferred: ["ferme"],
      avoid: ["dessert", "soyeux"],
      servingName: "1 portion",
      servingSizeG: 120,
    },
  
    // Produits laitiers
    {
      id: "fromage-blanc",
      name: "Fromage blanc nature",
      category: "Produits laitiers",
      queries: [["fromage", "blanc"]],
      avoid: ["sucre", "dessert"],
      servingName: "1 bol",
      servingSizeG: 150,
      isFavorite: true,
    },
    {
      id: "skyr-nature",
      name: "Skyr nature",
      category: "Produits laitiers",
      queries: [["skyr"]],
      avoid: ["sucre", "fruit", "dessert"],
      servingName: "1 pot",
      servingSizeG: 150,
      isFavorite: true,
    },
    {
      id: "yaourt-nature",
      name: "Yaourt nature",
      category: "Produits laitiers",
      queries: [["yaourt", "nature"]],
      avoid: ["sucre", "fruit", "dessert"],
      servingName: "1 pot",
      servingSizeG: 125,
    },
    {
      id: "yaourt-grec",
      name: "Yaourt grec nature",
      category: "Produits laitiers",
      queries: [["yaourt", "grec"], ["grec", "nature"]],
      avoid: ["sucre", "fruit", "dessert"],
      servingName: "1 portion",
      servingSizeG: 150,
    },
    {
      id: "lait-demi-ecreme",
      name: "Lait demi-écrémé",
      category: "Produits laitiers",
      queries: [["lait", "demi", "ecreme"], ["lait", "demi", "écrémé"]],
      preferred: ["demi"],
      servingName: "1 verre",
      servingSizeG: 250,
    },
  
    // Fromages
    {
      id: "mozzarella",
      name: "Mozzarella",
      category: "Fromages",
      queries: [["mozzarella"]],
      servingName: "1 portion",
      servingSizeG: 30,
    },
    {
      id: "feta",
      name: "Feta",
      category: "Fromages",
      queries: [["feta"]],
      servingName: "1 portion",
      servingSizeG: 30,
    },
    {
      id: "emmental",
      name: "Emmental",
      category: "Fromages",
      queries: [["emmental"]],
      servingName: "1 portion",
      servingSizeG: 30,
    },
    {
      id: "chevre",
      name: "Fromage de chèvre",
      category: "Fromages",
      queries: [["chevre"], ["chèvre"]],
      servingName: "1 portion",
      servingSizeG: 30,
    },
  
    // Matières grasses
    {
      id: "huile-olive",
      name: "Huile d’olive",
      category: "Matières grasses",
      queries: [["huile", "olive"]],
      servingName: "1 cuillère à soupe",
      servingSizeG: 10,
      isFavorite: true,
    },
    {
      id: "beurre",
      name: "Beurre",
      category: "Matières grasses",
      queries: [["beurre"]],
      avoid: ["cacahuete", "cacahuète"],
      servingName: "1 noisette",
      servingSizeG: 10,
    },
  
    // Oléagineux & graines
    {
      id: "amandes",
      name: "Amandes",
      category: "Oléagineux & graines",
      queries: [["amande"]],
      avoid: ["lait", "poudre"],
      servingName: "1 petite poignée",
      servingSizeG: 15,
      isFavorite: true,
    },
    {
      id: "noix",
      name: "Noix",
      category: "Oléagineux & graines",
      queries: [["noix"]],
      avoid: ["huile"],
      servingName: "1 petite poignée",
      servingSizeG: 15,
    },
    {
      id: "noix-cajou",
      name: "Noix de cajou",
      category: "Oléagineux & graines",
      queries: [["noix", "cajou"]],
      servingName: "1 petite poignée",
      servingSizeG: 15,
    },
    {
      id: "beurre-cacahuete",
      name: "Beurre de cacahuète",
      category: "Oléagineux & graines",
      queries: [["beurre", "cacahuete"], ["beurre", "cacahuète"]],
      servingName: "1 cuillère à soupe",
      servingSizeG: 15,
    },
    {
      id: "graines-chia",
      name: "Graines de chia",
      category: "Oléagineux & graines",
      queries: [["graines", "chia"], ["chia"]],
      servingName: "1 cuillère à soupe",
      servingSizeG: 15,
    },
    {
      id: "graines-courge",
      name: "Graines de courge",
      category: "Oléagineux & graines",
      queries: [["graines", "courge"], ["courge"]],
      servingName: "1 petite poignée",
      servingSizeG: 15,
    },
  ];

export const essentialFoods: Food[] = essentialDefinitions
  .map(createEssentialFood)
  .filter((food): food is Food => food !== null);