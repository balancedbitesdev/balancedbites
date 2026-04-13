/**
 * Pulls macro numbers from free-form product copy (e.g. Shopify descriptions).
 * Handles strings like: "Protein: 22g | Carbs: 37g | Fat: 30g" including cases where
 * text runs into "Protein" (e.g. "ChocolateProtein: 22g") because we match the
 * literal "Protein:" substring, not a word boundary before it.
 */
export type ParsedDescriptionNutrition = {
  cal: string | null;
  pro: string | null;
  carb: string | null;
  fat: string | null;
};

function capture(re: RegExp, text: string): string | null {
  const m = re.exec(text);
  return m?.[1] != null ? m[1].trim() : null;
}

export function parseNutritionFromDescription(text: string): ParsedDescriptionNutrition {
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length === 0) {
    return { cal: null, pro: null, carb: null, fat: null };
  }

  const pro = capture(/Protein\s*:\s*(\d+(?:\.\d+)?)\s*(?:g|gram(?:s)?)?/i, t);
  const carb = capture(/Carbs?\s*:\s*(\d+(?:\.\d+)?)\s*(?:g|gram(?:s)?)?/i, t);
  const fat = capture(/Fat\s*:\s*(\d+(?:\.\d+)?)\s*(?:g|gram(?:s)?)?/i, t);

  let cal =
    capture(/(?:Calories?|Energy|kcal)\s*:\s*(\d+(?:\.\d+)?)\s*(?:kcal|cal(?:ories)?)?/i, t) ??
    capture(/\bCal\s*:\s*(\d+(?:\.\d+)?)\s*(?:kcal)?/i, t);

  if (cal == null) {
    cal = capture(/(\d+(?:\.\d+)?)\s*(?:kcal|calories)\b/i, t);
  }

  return { cal, pro, carb, fat };
}

/** Atwater general factors: 4 kcal/g protein & carbs, 9 kcal/g fat */
export function estimateCaloriesFromMacros(
  proteinG: number,
  carbsG: number,
  fatG: number,
): number {
  return Math.round(4 * proteinG + 4 * carbsG + 9 * fatG);
}

/**
 * First number in a metafield or parsed fragment, e.g. "22", "22g", "22.5 g".
 */
export function parseGramsValue(raw: string | null | undefined): number | null {
  if (raw == null || raw.trim() === "") return null;
  const m = raw.trim().match(/(\d+(?:\.\d+)?)/);
  if (m == null) return null;
  const n = parseFloat(m[1]);
  return Number.isFinite(n) ? n : null;
}

/**
 * Removes embedded macro segments from copy so the menu shows flavor/story text only.
 * Parse first, then strip — stripping uses the same shapes as parsing.
 */
export function stripEmbeddedNutritionFromDescription(text: string): string {
  let t = text.replace(/\s+/g, " ").trim();
  if (t.length === 0) return "";

  const patterns: RegExp[] = [
    /\s*[|·•]\s*Protein\s*:\s*\d+(?:\.\d+)?\s*(?:g|gram(?:s)?)?/gi,
    /\s*[|·•]\s*Carbs?\s*:\s*\d+(?:\.\d+)?\s*(?:g|gram(?:s)?)?/gi,
    /\s*[|·•]\s*Fat\s*:\s*\d+(?:\.\d+)?\s*(?:g|gram(?:s)?)?/gi,
    /\s*[|·•]\s*(?:Calories?|Energy)\s*:\s*\d+(?:\.\d+)?\s*(?:kcal|cal(?:ories)?)?/gi,
    /\s*[|·•]\s*Cal\s*:\s*\d+(?:\.\d+)?\s*(?:kcal)?/gi,
    /\s*[|·•]\s*\d+(?:\.\d+)?\s*(?:kcal|calories)\b/gi,
    // No leading \b on Protein so "ChocolateProtein: 22g" still matches
    /Protein\s*:\s*\d+(?:\.\d+)?\s*(?:g|gram(?:s)?)?/gi,
    /Carbs?\s*:\s*\d+(?:\.\d+)?\s*(?:g|gram(?:s)?)?/gi,
    /Fat\s*:\s*\d+(?:\.\d+)?\s*(?:g|gram(?:s)?)?/gi,
    /(?:^|\s)(?:Calories?|Energy)\s*:\s*\d+(?:\.\d+)?\s*(?:kcal|cal(?:ories)?)?/gi,
    /\bCal\s*:\s*\d+(?:\.\d+)?\s*(?:kcal)?/gi,
    /\d+(?:\.\d+)?\s*(?:kcal|calories)\b/gi,
  ];

  for (const re of patterns) {
    t = t.replace(re, " ");
  }

  t = t
    .replace(/\s*[|·•]\s*/g, " ")
    .replace(/\s*[-–—]\s*$/u, "")
    .replace(/\s*[-–—]\s*$/u, "")
    .replace(/\s+/g, " ")
    .trim();

  return t;
}
