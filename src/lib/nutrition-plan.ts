export type GoalId = "lose" | "maintain" | "gain";
export type ActivityId =
  | "sedentary"
  | "light"
  | "moderate"
  | "active"
  | "very_active";
export type GenderId = "male" | "female" | "other";
export type DietaryId =
  | "keto"
  | "low_carb"
  | "balanced"
  | "high_protein"
  | "vegetarian"
  | "mediterranean";

export type MacroSplit = {
  proteinPct: number;
  carbsPct: number;
  fatPct: number;
};

export type PlanTargets = {
  dailyCalories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  bmr: number;
  tdee: number;
};

function activityMultiplier(activity: ActivityId): number {
  switch (activity) {
    case "sedentary":
      return 1.2;
    case "light":
      return 1.375;
    case "moderate":
      return 1.55;
    case "active":
      return 1.725;
    case "very_active":
      return 1.9;
    default:
      return 1.375;
  }
}

function goalCalorieFactor(goal: GoalId): number {
  switch (goal) {
    case "lose":
      return 0.85;
    case "maintain":
      return 1;
    case "gain":
      return 1.12;
    default:
      return 1;
  }
}

export function bmrMifflinStJeor(
  weightKg: number,
  heightCm: number,
  age: number,
  gender: GenderId,
): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  if (gender === "male") return base + 5;
  if (gender === "female") return base - 161;
  return (base + 5 + base - 161) / 2;
}

export function dietaryMacroSplit(dietary: DietaryId): MacroSplit {
  switch (dietary) {
    case "keto":
      return { proteinPct: 25, carbsPct: 5, fatPct: 70 };
    case "low_carb":
      return { proteinPct: 30, carbsPct: 20, fatPct: 50 };
    case "high_protein":
      return { proteinPct: 35, carbsPct: 35, fatPct: 30 };
    case "vegetarian":
      return { proteinPct: 25, carbsPct: 45, fatPct: 30 };
    case "mediterranean":
      return { proteinPct: 25, carbsPct: 45, fatPct: 30 };
    case "balanced":
    default:
      return { proteinPct: 30, carbsPct: 40, fatPct: 30 };
  }
}

export function computePlanTargets(
  weightKg: number,
  heightCm: number,
  age: number,
  gender: GenderId,
  activity: ActivityId,
  goal: GoalId,
  dietary: DietaryId,
): PlanTargets {
  const bmr = bmrMifflinStJeor(weightKg, heightCm, age, gender);
  const tdee = bmr * activityMultiplier(activity);
  const dailyCalories = Math.round(tdee * goalCalorieFactor(goal));
  const { proteinPct, carbsPct, fatPct } = dietaryMacroSplit(dietary);

  const proteinG = Math.round((dailyCalories * (proteinPct / 100)) / 4);
  const carbsG = Math.round((dailyCalories * (carbsPct / 100)) / 4);
  const fatG = Math.round((dailyCalories * (fatPct / 100)) / 9);

  return { dailyCalories, proteinG, carbsG, fatG, bmr: Math.round(bmr), tdee: Math.round(tdee) };
}

export function goalLabel(goal: GoalId): string {
  switch (goal) {
    case "lose":
      return "Lose weight";
    case "maintain":
      return "Maintain weight";
    case "gain":
      return "Gain muscle";
    default:
      return goal;
  }
}

export function activityLabel(activity: ActivityId): string {
  switch (activity) {
    case "sedentary":
      return "Mostly seated";
    case "light":
      return "Light exercise 1–3 days/week";
    case "moderate":
      return "Moderate exercise 3–5 days/week";
    case "active":
      return "Hard exercise 6–7 days/week";
    case "very_active":
      return "Athlete / physical job";
    default:
      return activity;
  }
}

export function dietaryLabel(dietary: DietaryId): string {
  switch (dietary) {
    case "keto":
      return "Keto";
    case "low_carb":
      return "Low carb";
    case "balanced":
      return "Balanced";
    case "high_protein":
      return "High protein";
    case "vegetarian":
      return "Vegetarian";
    case "mediterranean":
      return "Mediterranean";
    default:
      return dietary;
  }
}

const DIETARY_KEYWORDS: Record<DietaryId, string[]> = {
  keto: ["keto", "ketogenic", "low carb", "low-carb", "high fat"],
  low_carb: ["low carb", "low-carb", "keto", "protein", "sugar free"],
  balanced: ["balanced", "whole", "natural", "fresh", "macro"],
  high_protein: ["protein", "muscle", "lean", "chicken", "greek"],
  vegetarian: ["vegan", "vegetarian", "plant", "greens", "salad"],
  mediterranean: ["olive", "mediterranean", "fish", "grain", "fresh"],
};

export function scoreProductForDiet(
  blob: string,
  dietary: DietaryId,
): number {
  const b = blob.toLowerCase();
  let score = 0;
  for (const kw of DIETARY_KEYWORDS[dietary]) {
    if (b.includes(kw)) score += 2;
  }
  return score;
}
