/**
 * Pulls macro numbers from free-form product copy (e.g. Shopify descriptions).
 * Handles strings like: "Protein: 22g | Carbs: 37g | Fat: 30g" including cases where
 * text runs into "Protein" (e.g. "ChocolateProtein: 22g") because we match the
 * literal "Protein:" substring, not a word boundary before it.
 */
export type ParsedDescriptionNutrition = {
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
    return { pro: null, carb: null, fat: null };
  }

  const pro =
    capture(/(?:💪\s*)?(?:Protein|Pro)\s*:?\s*(\d+(?:\.\d+)?)\s*(?:g|gram(?:s)?)?/i, t) ??
    capture(/(\d+(?:\.\d+)?)\s*g?\s*(?:Protein|Pro)\b/i, t);

  const carb =
    capture(/(?:🍞\s*)?(?:Carbs?|Carbohydrates?)\s*:?\s*(\d+(?:\.\d+)?)\s*(?:g|gram(?:s)?)?/i, t) ??
    capture(/(\d+(?:\.\d+)?)\s*g?\s*Carbs?/i, t);

  const fat =
    capture(/(?:🧈\s*)?(?:Fats?)\s*:?\s*(\d+(?:\.\d+)?)\s*(?:g|gram(?:s)?)?/i, t) ??
    capture(/(\d+(?:\.\d+)?)\s*g?\s*Fats?/i, t);

  return { pro, carb, fat };
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

export function cleanUnicodeAndStraySymbols(text: string): string {
  if (!text) return "";
  return text
    .replace(/\uFFFD/g, "")
    .replace(/[🌿📦📊🔥💪🧈🍞]/g, "")
    .replace(/Ingredients\s*:\s*/gi, "Ingredients: ")
    .replace(/Portion\s*:\s*/gi, "Portion: ")
    .replace(/\s+/g, " ")
    .trim();
}

export function parseIngredientsFromDescription(text: string): string | null {
  if (!text || !text.trim()) return null;

  const normalized = text
    .replace(/<\/(?:p|div|li|h[1-6])>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ");

  const match = normalized.match(
    /(?:Ingredients|Ingredient|المكونات)\s*[:\-]?\s*([\s\S]+?)(?=(?:Nutrition\b|Nutrition Facts|Protein\b|Pro\b|Carbs?\b|Carbohydrates?\b|Fats?\b|Calories?\b|Cal\b|Energy\b|Portion\b|Per\s+(?:Jar|Portion|Pack|Bowl|Piece)\b|💪|🍞|🧈|🔥|📊|<|\n\s*\d+\s*(?:g|gm|grams|kg|ml|oz)\b|$))/i
  );

  if (!match || !match[1]) return null;

  let ing = match[1]
    .replace(/\uFFFD/g, "")
    .replace(/\s+/g, " ")
    .trim();

  ing = ing.replace(/\s+\d+\s*(?:gm|g|grams|kg|ml|oz)\b$/i, "").trim();

  if (ing.length < 2) return null;

  return ing;
}

export function parsePortionFromDescription(text: string): string | null {
  if (!text || !text.trim()) return null;

  const normalized = text
    .replace(/<\/(?:p|div|li|h[1-6])>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ");

  const m = normalized.match(
    /Portion\s*[:\-]?\s*([\s\S]+?)(?=(?:Ingredients|Ingredient|المكونات|Nutrition|Protein|Pro|Carbs|Fat|Calories|Cal|Energy|💪|🍞|🧈|🔥|📊|<|\n|$))/i
  );
  if (m && m[1]) {
    const cleaned = cleanUnicodeAndStraySymbols(m[1]);
    if (cleaned.length > 0) return cleaned;
  }
  const m2 = normalized.match(/(?:Per\s+Jar|Per\s+Portion|Per\s+Bowl|Per\s+Piece|Per\s+Pack|\d+\s*(?:g|gm)\b)/i);
  if (m2 && m2[0]) {
    return cleanUnicodeAndStraySymbols(m2[0]);
  }
  return null;
}

/**
 * Removes embedded macro segments and ingredient headers from copy so the menu shows flavor/story text only.
 * Parse first, then strip — stripping uses the same shapes as parsing.
 */
export function stripEmbeddedNutritionFromDescription(text: string): string {
  let t = text.replace(/\uFFFD/g, "").replace(/\s+/g, " ").trim();
  if (t.length === 0) return "";

  // Strip whole Ingredients section if present in description
  t = t.replace(
    /(?:Ingredients|Ingredient|المكونات)\s*[:\-]?\s*[\s\S]+?(?=(?:Nutrition\b|Nutrition Facts|Protein\b|Pro\b|Carbs?\b|Carbohydrates?\b|Fats?\b|Calories?\b|Cal\b|Energy\b|Portion\b|Per\s+(?:Jar|Portion|Pack|Bowl|Piece)\b|💪|🍞|🧈|🔥|📊|<|$))/gi,
    " "
  );
  t = t.replace(/(?:Ingredients|Ingredient|المكونات)\s*[:\-]?\s*/gi, " ");
  t = t.replace(/Nutrition\s*[:\-]?\s*/gi, " ");
  t = t.replace(/المكونات\s*[:\-]?\s*/gi, " ");

  const patterns: RegExp[] = [
    /📊\s*Nutrition\s*Facts\s*:?/gi,
    /🔥\s*\d+(?:\.\d+)?\s*(?:kcal|calories?)?/gi,
    /💪\s*Protein\s*:?\s*\d+(?:\.\d+)?\s*(?:g|gram(?:s)?)?/gi,
    /🧈\s*Fat\s*:?\s*\d+(?:\.\d+)?\s*(?:g|gram(?:s)?)?/gi,
    /🍞\s*Carbs?\s*:?\s*\d+(?:\.\d+)?\s*(?:g|gram(?:s)?)?/gi,
    /\s*[|·•&]\s*Protein\s*:\s*\d+(?:\.\d+)?\s*(?:g|gram(?:s)?)?/gi,
    /\s*[|·•&]\s*Carbs?\s*:\s*\d+(?:\.\d+)?\s*(?:g|gram(?:s)?)?/gi,
    /\s*[|·•&]\s*Fat\s*:\s*\d+(?:\.\d+)?\s*(?:g|gram(?:s)?)?/gi,
    /\s*[|·•&]\s*(?:Calories?|Energy)\s*:\s*\d+(?:\.\d+)?\s*(?:kcal|cal(?:ories)?)?/gi,
    /\s*[|·•&]\s*Cal\s*:\s*\d+(?:\.\d+)?\s*(?:kcal)?/gi,
    /\s*[|·•&]\s*\d+(?:\.\d+)?\s*(?:kcal|calories)\b/gi,
    /Protein\s*:\s*\d+(?:\.\d+)?\s*(?:g|gram(?:s)?)?/gi,
    /Carbs?\s*:\s*\d+(?:\.\d+)?\s*(?:g|gram(?:s)?)?/gi,
    /Fat\s*:\s*\d+(?:\.\d+)?\s*(?:g|gram(?:s)?)?/gi,
    /(?:^|\s)(?:Calories?|Energy)\s*:\s*\d+(?:\.\d+)?\s*(?:kcal|cal(?:ories)?)?/gi,
    /\bCal\s*:\s*\d+(?:\.\d+)?\s*(?:kcal)?/gi,
    /\d+(?:\.\d+)?\s*(?:kcal|calories)\b/gi,
    /[🔥💪🧈🍞📊🌿📦]/g,
  ];

  for (const re of patterns) {
    t = t.replace(re, " ");
  }

  t = t
    .replace(/\s*[|·•&]\s*/g, " ")
    .replace(/\s*[-–—]\s*$/u, "")
    .replace(/\s*[-–—]\s*$/u, "")
    .replace(/\s+/g, " ")
    .trim();

  if (/^(?:Ingredients|Nutrition|المكونات)\s*:?$/i.test(t)) {
    return "";
  }

  return cleanUnicodeAndStraySymbols(t);
}
