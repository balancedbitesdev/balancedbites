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
  cal: string | null;
};

function capture(re: RegExp, text: string): string | null {
  const m = re.exec(text);
  return m?.[1] != null ? m[1].trim() : null;
}

export function parseNutritionFromDescription(text: string): ParsedDescriptionNutrition {
  // Normalize whitespace and HTML entities
  const t = text
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (t.length === 0) {
    return { pro: null, carb: null, fat: null, cal: null };
  }

  // Protein: handles "Protein 28gm", "Pro: 35", "Protein:506", "Protein23.6", "💪 Protein: 22g"
  const pro =
    capture(/(?:💪\s*)?(?:Protein|Pro)\s*:?\s*(\d+(?:\.\d+)?)\s*(?:g|gram(?:s)?|gm)?/i, t) ??
    capture(/(\d+(?:\.\d+)?)\s*(?:g|gram(?:s)?|gm)?\s*(?:Protein|Pro)\b/i, t);

  // Carbs: handles "Carb 41 Gm", "Carbs: 9", "Carbohydrates: 28g", "🍞 Carbs 18"
  const carb =
    capture(/(?:🍞\s*)?(?:Carbohydrates?|Carbs?|Carb)\s*:?\s*(\d+(?:\.\d+)?)\s*(?:g|gram(?:s)?|gm)?/i, t) ??
    capture(/(\d+(?:\.\d+)?)\s*(?:g|gram(?:s)?|gm)?\s*(?:Carbohydrates?|Carbs?|Carb)\b/i, t);

  // Fat: handles "Fat 25 gm", "Fat: 14", "Fat :28", "Fat5.2", "Ffat 28", "🧈 Fat 10"
  const fat =
    capture(/(?:🧈\s*)?(?:Fats?|Ffat)\s*:?\s*(\d+(?:\.\d+)?)\s*(?:g|gram(?:s)?|gm)?/i, t) ??
    capture(/(\d+(?:\.\d+)?)\s*(?:g|gram(?:s)?|gm)?\s*Fats?\b/i, t);

  // Calories: handles "Cal 502", "Cals 195", "Cals: 200", "Cal: 110", "SmallCal 610", "Cal1000", "🔥 500 kcal"
  const cal =
    capture(/(?:🔥\s*)?(?:Calories?|Cals?|Energy|سعرات(?:\s*حرارية)?)\s*:?\s*(\d+(?:\.\d+)?)\s*(?:kcal|cal(?:ories)?)?/i, t) ??
    capture(/(?:Small|Large)?\s*Cal\s*:?\s*(\d+(?:\.\d+)?)\s*(?:kcal|cal)?/i, t) ??
    capture(/(\d+(?:\.\d+)?)\s*(?:kcal|calories)\b/i, t) ??
    capture(/🔥\s*(\d+(?:\.\d+)?)/i, t);

  return { pro, carb, fat, cal };
}

/**
 * Parses and formats a numeric value cleanly:
 * Strips unnecessary trailing decimals (e.g. 32.0 -> "32", 32.5 -> "32.5").
 * Returns null if missing or NaN.
 */
export function formatNutritionNumber(raw: number | string | null | undefined): string | null {
  if (raw == null) return null;
  const str = String(raw).trim();
  if (str === "" || str === "—" || str === "-") return null;
  const match = str.match(/-?\d+(?:\.\d+)?/);
  if (!match) return null;
  const num = parseFloat(match[0]);
  if (!Number.isFinite(num)) return null;
  // Strip trailing zeros after decimal point
  const formatted = num % 1 === 0 ? num.toFixed(0) : num.toString();
  return formatted;
}

/**
 * Formats a calorie string consistently across the entire app.
 * Missing values return "—", never a misleading "0".
 */
export function formatCalories(raw: number | string | null | undefined, locale: "en" | "ar" = "en"): string {
  const numStr = formatNutritionNumber(raw);
  if (numStr == null) return "—";
  if (locale === "ar") {
    return `${numStr} سعرة حرارية`;
  }
  return `${numStr} kcal`;
}

/**
 * Formats a macro string consistently (e.g. "Protein 32g" or "32g").
 */
export function formatMacroWithUnit(
  raw: number | string | null | undefined,
  locale: "en" | "ar" = "en"
): string {
  const numStr = formatNutritionNumber(raw);
  if (numStr == null) return "—";
  if (locale === "ar") {
    return `${numStr} جم`;
  }
  return `${numStr}g`;
}

/**
 * Generates the unified macro string:
 * "Protein 32g · Carbs 45g · Fat 18g"
 * "بروتين 32 جم · كارب 45 جم · دهون 18 جم"
 */
export function formatUnifiedMacros(
  pro: number | string | null | undefined,
  carb: number | string | null | undefined,
  fat: number | string | null | undefined,
  locale: "en" | "ar" = "en"
): string {
  const pStr = formatNutritionNumber(pro);
  const cStr = formatNutritionNumber(carb);
  const fStr = formatNutritionNumber(fat);

  if (pStr == null && cStr == null && fStr == null) return "—";

  if (locale === "ar") {
    const parts: string[] = [];
    if (pStr != null) parts.push(`بروتين ${pStr} جم`);
    if (cStr != null) parts.push(`كارب ${cStr} جم`);
    if (fStr != null) parts.push(`دهون ${fStr} جم`);
    return parts.join(" · ");
  }

  const parts: string[] = [];
  if (pStr != null) parts.push(`Protein ${pStr}g`);
  if (cStr != null) parts.push(`Carbs ${cStr}g`);
  if (fStr != null) parts.push(`Fat ${fStr}g`);
  return parts.join(" · ");
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
    .replace(/[🌿📦📊🔥💪🧈🍞🥑🌾]/g, "")
    .replace(/Ingredients\s*:\s*/gi, "Ingredients: ")
    .replace(/Portion\s*:\s*/gi, "Portion: ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Normalizes and cleans the text of the ingredients section.
 * Strips leaked serving sizes, portions, and macro snippets, and standardizes casing and punctuation.
 */
export function normalizeIngredientsText(raw: string, locale: "en" | "ar" = "en"): string {
  if (!raw || !raw.trim()) return "";

  const isArabic = locale === "ar" || /[\u0600-\u06FF]/.test(raw);

  let cleaned = raw
    .replace(/<\/(?:p|div|li|h[1-6])>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\uFFFD/g, "")
    // Remove headers
    .replace(/^(?:Ingredients|Ingredient|المكونات)\s*[:\-]?\s*/gi, "")
    // Remove set, pack, box, slice phrases completely before splitting
    .replace(/\b(?:Set|Pack|Box)\s+of\s+[^,.\n;•]+/gi, "")
    .replace(/\b(?:Set|Pack|Box)\s+of\b/gi, "")
    .replace(/\b(?:Diameter|قطر)\s*:\s*[^,.\n;•]+/gi, "")
    .replace(/\b(?:Divided into|مقسم إلى)\s*[^,.\n;•]+/gi, "")
    .replace(/\b\d+\s*Slices?\s*(?:\([^)]*\))?/gi, "")
    .replace(/\b\d+\s*(?:pieces?|pcs?|servings?|portion|pack|jar|bowl|muffins?|cookies?|truffles?)\s*(?:\([^)]*\))?/gi, "")
    .replace(/\b(?:Portion|Serving|Servings|حجم الوجبة|الحصص)\s*[:\-]?\s*[^,.\n]+/gi, "")
    .replace(/\bPer\s+(?:Jar|Portion|Pack|Bowl|Piece|Serving|Cookie|Box|One)\b/gi, "")
    .replace(/\([^)]*serving[^)]*\)/gi, "")
    .replace(/\([^)]*portion[^)]*\)/gi, "")
    .replace(/\b(?:Set|Pack|Box)\s*$/gi, "")
    // Remove stray nutrition facts/macros
    .replace(/📊\s*Nutrition\s*Facts\s*:?/gi, "")
    .replace(/🔥\s*\d+(?:\.\d+)?\s*(?:kcal|calories?)?/gi, "")
    .replace(/💪\s*Protein\s*:?\s*\d+(?:\.\d+)?\s*(?:g|gram(?:s)?)?/gi, "")
    .replace(/🧈\s*Fat\s*:?\s*\d+(?:\.\d+)?\s*(?:g|gram(?:s)?)?/gi, "")
    .replace(/🍞\s*Carbs?\s*:?\s*\d+(?:\.\d+)?\s*(?:g|gram(?:s)?)?/gi, "")
    .replace(/(?:Calories?|Energy|Cal)\s*:?\s*\d+(?:\.\d+)?\s*(?:kcal)?/gi, "")
    .replace(/Protein\s*:?\s*\d+(?:\.\d+)?\s*(?:g)?/gi, "")
    .replace(/Fat\s*:?\s*\d+(?:\.\d+)?\s*(?:g)?/gi, "")
    .replace(/Carbs?\s*:?\s*\d+(?:\.\d+)?\s*(?:g)?/gi, "")
    .replace(/[🌿📦📊🔥💪🧈🍞🥑🌾]/g, "");

  // Turn periods between words into commas if used as delimiters (e.g. "Buffalo Butter. Stevia" -> "Buffalo Butter, Stevia")
  cleaned = cleaned.replace(/([a-zA-Z\u0600-\u06FF])\s*\.\s+([a-zA-Z\u0600-\u06FF])/g, "$1, $2");

  // Split into individual ingredients
  const delimiter = /[,،\n\r;•\+\-]/;
  const parts = cleaned
    .split(delimiter)
    .map((p) => p.trim().replace(/^[\s.:\-•]+|[\s.:\-•]+$/g, ""))
    .filter((p) => {
      if (p.length < 2) return false;
      // Filter out stray numbers or words like "Serving", "Slices", "Set of"
      if (/^(?:\d+|\d+\s*(?:g|gm|ml|oz|kcal)|serving|slices?|portion|set|pack|box|set\s+of|pack\s+of|box\s+of|عبوة|علبة)$/i.test(p)) return false;
      return true;
    });

  if (parts.length === 0) return "";

  // Title Case for English, clean casing
  const normalizedParts = parts.map((item) => {
    if (isArabic) {
      return item.trim();
    }
    return item
      .toLowerCase()
      .split(/\s+/)
      .map((w, idx) => {
        if (idx > 0 && /^(and|with|in|of|or|a|the)$/i.test(w)) return w;
        // Capitalize initial letter and any letter immediately following '/' or '-'
        return w.replace(/(^|[\/\-_])([a-z])/g, (_, boundary, char) => boundary + char.toUpperCase());
      })
      .join(" ");
  });

  const sep = isArabic ? "، " : ", ";
  return normalizedParts.join(sep);
}

export function parseIngredientsFromDescription(text: string, locale: "en" | "ar" = "en"): string | null {
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

  return normalizeIngredientsText(ing, locale);
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
  const mSet = normalized.match(/(?:Pack|Set|Box)\s*[:\-]?\s*((?:Set|Pack|Box)\s+of\s+[^,.\n<]+|\d+\s*(?:pieces?|pcs?|muffins?|cookies?|truffles?|slices?)[^,.\n<]*)/i);
  if (mSet && mSet[1]) {
    const cleaned = cleanUnicodeAndStraySymbols(mSet[1]);
    if (cleaned.length > 0) return cleaned;
  }
  const m2 = normalized.match(/(?:Per\s+Jar|Per\s+Portion|Per\s+Bowl|Per\s+Piece|Per\s+Pack|\d+\s*(?:g|gm)\b)/i);
  if (m2 && m2[0]) {
    return cleanUnicodeAndStraySymbols(m2[0]);
  }
  return null;
}

/**
 * Removes embedded macro segments, ingredient headers, and category tags from copy so the menu shows flavor/story text only.
 */
export function stripEmbeddedNutritionFromDescription(text: string): string {
  let t = text.replace(/\uFFFD/g, "").replace(/\s+/g, " ").trim();
  if (t.length === 0) return "";

  // Strip whole Category header
  t = t.replace(/(?:Category|Product Category|القسم|قسم)\s*[:\-]?\s*[^|\n•<]+/gi, " ");

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
    // Colon-less, run-together macros from Shopify copy, e.g. "Protein 28gmCarb 41 GmFat 25 gmCal 502", "SmallCal 610".
    /(?:Small|Large)?\s*(?:Protein|Pro|Carbohydrates?|Carbs?|F?fats?|Calories|Cals?)\s*:?\s*\d+(?:\.\d+)?\s*(?:gm|g|kcal)?/gi,
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

  if (/^(?:Ingredients|Nutrition|المكونات|Category|القسم)\s*:?$/i.test(t)) {
    return "";
  }

  return cleanUnicodeAndStraySymbols(t);
}

export type ParsedArabicContent = {
  title: string | null;
  description: string | null;
  ingredients: string | null;
};

/**
 * Extracts Arabic translations (title, description, ingredients) embedded in product description copy.
 * Supports:
 * 1. Tag format:
 *    العنوان: فيليه دجاج مشوي
 *    الوصف: صدور دجاج متبلة بالأعشاب الطبيعية
 *    المكونات: صدور دجاج، زيت زيتون
 *    (Also accepts "Title Ar:", "Description Ar:", "Ingredients Ar:", "الاسم:")
 * 2. Block format:
 *    [AR] ... [/AR] or --- AR --- ... ---
 */
export function parseArabicFromDescription(text: string): ParsedArabicContent {
  if (!text || !text.trim()) {
    return { title: null, description: null, ingredients: null };
  }

  // Normalize HTML break/paragraph tags to line breaks first
  const normalized = text
    .replace(/<\/(?:p|div|li|h[1-6])>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ");

  // Check if there is an explicit [AR] ... [/AR] block or --- AR --- block
  const blockMatch =
    normalized.match(/\[AR\]([\s\S]+?)\[\/AR\]/i) ||
    normalized.match(/(?:^|\n)\s*---+\s*(?:AR|ARABIC)?\s*---+([\s\S]+?)(?:---+|$)/i);

  const targetText = blockMatch ? blockMatch[1] : normalized;

  // Title:
  // e.g. "العنوان: فيليه دجاج" or "اسم المنتج: فيليه دجاج" or "Title Ar: فيليه دجاج"
  let title: string | null = null;
  const titleMatch = targetText.match(
    /(?:^|\n)\s*(?:العنوان\s*(?:بالعربي(?:ة)?)?|اسم\s*المنتج|الاسم|Title\s*(?:\(?AR\)?|Arabic)?)\s*[:\-]\s*([^\n\r]+)/i
  );
  if (titleMatch && titleMatch[1]) {
    const t = titleMatch[1].trim();
    if (t.length > 0) title = t;
  }

  // Description:
  // e.g. "الوصف: صدور دجاج متبلة..." or "Description Ar: ..."
  let description: string | null = null;
  const descMatch = targetText.match(
    /(?:^|\n)\s*(?:الوصف\s*(?:بالعربي(?:ة)?)?|تفاصيل\s*(?:المنتج)?|Description\s*(?:\(?AR\)?|Arabic)?|Desc\s*(?:\(?AR\)?|Arabic)?)\s*[:\-]\s*([\s\S]+?)(?=(?:\n\s*(?:المكونات|Ingredients|Category|القسم|Nutrition|السعرات|Portion|الحصص|\[\/AR\]|---|$)))/i
  );
  if (descMatch && descMatch[1]) {
    const d = descMatch[1].replace(/\s+/g, " ").trim();
    if (d.length > 0) description = d;
  }

  // Ingredients:
  // e.g. "المكونات: صدور دجاج، زيت زيتون..." or "Ingredients Ar: ..."
  let ingredients: string | null = null;
  const ingMatch = targetText.match(
    /(?:^|\n)\s*(?:المكونات\s*(?:بالعربي(?:ة)?)?|Ingredients\s*(?:\(?AR\)?|Arabic)?)\s*[:\-]\s*([\s\S]+?)(?=(?:\n\s*(?:الوصف|العنوان|اسم\s*المنتج|Category|القسم|Nutrition|السعرات|Portion|الحصص|\[\/AR\]|---|$)))/i
  );
  if (ingMatch && ingMatch[1]) {
    const ing = ingMatch[1].replace(/\s+/g, " ").trim();
    if (ing.length > 0) ingredients = ing;
  }

  return { title, description, ingredients };
}

/**
 * Strips Arabic translation tags, blocks, and Arabic-only lines from description copy
 * so the English view of the product displays clean English without translation metadata.
 */
export function stripArabicBlockFromDescription(text: string): string {
  if (!text || !text.trim()) return "";

  let cleaned = text;

  // 1. Remove [AR]...[/AR] blocks
  cleaned = cleaned.replace(/\[AR\][\s\S]*?\[\/AR\]/gi, " ");

  // 2. Remove --- AR --- blocks
  cleaned = cleaned.replace(/(?:^|\n)\s*---+\s*(?:AR|ARABIC)?\s*---+[\s\S]*?(?:---+|$)/gi, " ");

  // 3. Remove labeled translation lines
  cleaned = cleaned.replace(
    /(?:^|\n)\s*(?:العنوان\s*(?:بالعربي(?:ة)?)?|اسم\s*المنتج|الاسم|Title\s*(?:\(?AR\)?|Arabic)?)\s*[:\-][^\n]*/gi,
    " "
  );
  cleaned = cleaned.replace(
    /(?:^|\n)\s*(?:الوصف\s*(?:بالعربي(?:ة)?)?|تفاصيل\s*(?:المنتج)?|Description\s*(?:\(?AR\)?|Arabic)?|Desc\s*(?:\(?AR\)?|Arabic)?)\s*[:\-][^\n]*/gi,
    " "
  );
  cleaned = cleaned.replace(
    /(?:^|\n)\s*(?:المكونات\s*(?:بالعربي(?:ة)?)?|Ingredients\s*(?:\(?AR\)?|Arabic)?)\s*[:\-][^\n]*/gi,
    " "
  );

  // 4. If any line is predominantly Arabic script (e.g. Arabic paragraph without label), remove it from English copy
  const lines = cleaned.split("\n").filter((line) => {
    const trimmed = line.trim();
    if (!trimmed) return true;
    const arabicCount = (trimmed.match(/[\u0600-\u06FF]/g) || []).length;
    const latinCount = (trimmed.match(/[A-Za-z]/g) || []).length;
    if (arabicCount > 3 && arabicCount >= latinCount) {
      return false;
    }
    return true;
  });

  cleaned = lines.join(" ").replace(/\s+/g, " ").trim();
  return cleanUnicodeAndStraySymbols(cleaned);
}

export type CanonicalCategoryInfo = {
  id: string;
  labelEn: string;
  labelAr: string;
  order: number;
};

export const CANONICAL_CATEGORIES: Record<string, CanonicalCategoryInfo> = {
  high_protein: {
    id: "high_protein",
    labelEn: "High Protein",
    labelAr: "بروتين عالي",
    order: 1,
  },
  clean_carb: {
    id: "clean_carb",
    labelEn: "Clean Carb",
    labelAr: "كارب نضيف",
    order: 2,
  },
  veggie_sides: {
    id: "veggie_sides",
    labelEn: "Vegetable Sides",
    labelAr: "جوانب خضار",
    order: 3,
  },
  salads: {
    id: "salads",
    labelEn: "Salads",
    labelAr: "سلطات",
    order: 4,
  },
  keto_desserts: {
    id: "keto_desserts",
    labelEn: "Keto Desserts",
    labelAr: "حلويات كيتو",
    order: 5,
  },
  frozen: {
    id: "frozen",
    labelEn: "Frozen",
    labelAr: "فروزن",
    order: 6,
  },
};

export type ProductContextForCategory = {
  title?: string;
  handle?: string;
  productType?: string;
  tags?: string[];
  description?: string;
};

export function parseCategoryFromDescription(text: string): string | null {
  if (!text || !text.trim()) return null;

  const normalized = text
    .replace(/<\/(?:p|div|li|h[1-6])>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ");

  const match = normalized.match(/(?:Category|Product Category|القسم|قسم)\s*[:\-]?\s*([^\n<,]+)/i);
  if (match && match[1]) {
    const rawCategory = match[1].trim();
    // Ignore if matched text looks like a macro line
    if (/^(?:\d|cal|calories|pro|protein|fat|carbs?)\b/i.test(rawCategory)) {
      return null;
    }
    const cat = normalizeCategory(rawCategory);
    return cat.id;
  }

  return null;
}

/**
 * Normalizes raw category text and product context into a canonical category structure.
 * Deduplicates equivalent categories (e.g. "Dessert", "Desert", "Keto Desserts"),
 * handles missing/corrupt values gracefully, and preserves sensible ordering.
 */
export function normalizeCategory(
  rawCategory: string | null | undefined,
  context?: ProductContextForCategory
): CanonicalCategoryInfo {
  const raw = (rawCategory ?? "").trim();
  const ctxTitle = context?.title ?? "";
  const ctxHandle = context?.handle ?? "";
  const ctxType = context?.productType ?? "";
  const ctxTags = (context?.tags ?? []).join(" ");
  const combinedContext = `${raw} ${ctxTitle} ${ctxHandle} ${ctxType} ${ctxTags}`.toLowerCase();

  // 1. Cottage cheese items belong under veggie_sides
  if (/cottage[-_\s]cheese/i.test(combinedContext)) {
    return CANONICAL_CATEGORIES.veggie_sides;
  }

  // 2. Veggie sides / sauteed vegetables / hummus / tahini
  if (
    /(?:veggie|vegetable|side|hummus|tahini|خضار|جانبي|سوتيه)/i.test(raw) ||
    /\b(seasonal\s*veg|saut[eé]ed|vegetables?|veggies?|hummus|tahini)\b/i.test(combinedContext)
  ) {
    return CANONICAL_CATEGORIES.veggie_sides;
  }

  // 3. Salads
  if (
    /(?:salad|سلطة|سلطات)/i.test(raw) ||
    /\b(salad|rocca|caesar|cabbage|taco\s*salad)\b/i.test(combinedContext)
  ) {
    return CANONICAL_CATEGORIES.salads;
  }

  // 4. Clean carbs (rice, sweet potato, potato)
  if (
    /(?:clean\s*carb|carb|rice|potato|كارب|أرز|بطاطا)/i.test(raw) ||
    /\b(rice|basmati|sweet\s*potato|baked\s*potato)\b/i.test(combinedContext)
  ) {
    return CANONICAL_CATEGORIES.clean_carb;
  }

  // 5. Keto Desserts / Desserts (handles "Dessert", "Desert", "Keto Dessert", "Cake", "Cookie", etc.)
  if (
    /(?:keto|dessert|desert|sweet|حلو|حلويات)/i.test(raw) ||
    /\b(dessert|sweet|brownie|cake|cookie|tart|jar|kahk|basbosa|truffle|cereal|cupcake|muffin|loaf|lazy\s*cake)\b/i.test(combinedContext)
  ) {
    return CANONICAL_CATEGORIES.keto_desserts;
  }

  // 6. Frozen
  if (
    /(?:frozen|فروزن|مجمد)/i.test(raw) ||
    /\bfrozen\b/i.test(combinedContext)
  ) {
    return CANONICAL_CATEGORIES.frozen;
  }

  // 7. High Protein / Meals (chicken, beef, meatballs, kofta, shawarma, doner, stroganoff, etc.)
  if (
    /(?:protein|meal|main|بروتين|وجبة|وجبات)/i.test(raw) ||
    /\b(chicken|beef|meat|shawarma|kofta|kebab|kabab|meatball|stroganoff|teriyaki|fajita|tawook|calzone|d[öo]ner|fillet|pizza|meal)\b/i.test(combinedContext)
  ) {
    return CANONICAL_CATEGORIES.high_protein;
  }

  // 8. If raw category exists and is a custom valid string (not a macro string or empty)
  if (raw.length > 1 && !/(?:cal|protein|fat|carb|\d+)/i.test(raw)) {
    const slug = raw
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");

    if (slug.length > 0) {
      // Clean title case
      const labelEn = raw
        .toLowerCase()
        .split(/\s+/)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");

      return {
        id: slug,
        labelEn,
        labelAr: labelEn,
        order: 10,
      };
    }
  }

  // Default fallback is High Protein
  return CANONICAL_CATEGORIES.high_protein;
}

export type ParsedSizeVariant = {
  id: string;
  titleEn: string;
  titleAr: string;
  priceAmount: number | null;
  pro: string;
  fat: string;
  carb: string;
  cal: string;
};

export function parseSizeVariantsFromDescription(text: string): ParsedSizeVariant[] {
  if (!text || !text.trim()) return [];

  const normalized = text
    .replace(/<\/(?:p|div|li|h[1-6])>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ");

  const candidates: ParsedSizeVariant[] = [];
  const lines = normalized.split("\n").map((l) => l.trim()).filter((l) => l.length > 0);

  let variantIdx = 1;
  for (const line of lines) {
    // Match lines like: Ground Beef Small (250 EGP): 1050 kcal • Protein: 70g • Fat: 75g • Carbs: 18g
    // or Small Portion (280 EGP): 760 kcal ...
    // or Set of 6 Muffins (350 EGP) ...
    const lineMatch = line.match(
      /^(?:[\*\-•]\s*)?([^\(\:\n]+?)\s*(?:\((\d+(?:\.\d+)?)\s*(?:EGP|ج\.م|LE)?\))?\s*[:\-]\s*([\s\S]+)$/i
    );

    if (lineMatch) {
      const rawTitle = lineMatch[1].trim();
      const rawPrice = lineMatch[2] ? parseFloat(lineMatch[2]) : null;
      const rest = lineMatch[3].trim();

      // Reject lines where the title is actually a macro/nutrition line (e.g. "Cal 154.4Protein" or "Nutrition")
      if (
        /(?:cal|calories|protein|pro|fat|carbs?|nutrition|ingredients|المكونات|القيمة)/i.test(rawTitle)
      ) {
        continue;
      }

      // Must be a legitimate portion or size phrasing
      const isLegitSizeTitle =
        /(?:small|large|medium|portion|set|pack|pieces?|pcs|grams?|slice|loaf|كبير|صغير|عبوة|قطعة|حجم)/i.test(rawTitle) ||
        rawPrice != null;

      if (isLegitSizeTitle) {
        const nut = parseNutritionFromDescription(rest);
        const calStr = nut.cal ? `${nut.cal} kcal` : "—";
        const proVal = nut.pro ? (nut.pro.includes("g") ? nut.pro : `${nut.pro}g`) : "—";
        const fatVal = nut.fat ? (nut.fat.includes("g") ? nut.fat : `${nut.fat}g`) : "—";
        const carbVal = nut.carb ? (nut.carb.includes("g") ? nut.carb : `${nut.carb}g`) : "—";

        // Translate title to Arabic helper
        let titleAr = rawTitle;
        if (/Small Portion/i.test(rawTitle)) titleAr = "حجم صغير";
        else if (/Large Portion/i.test(rawTitle)) titleAr = "حجم كبير";
        else if (/Ground Beef Small/i.test(rawTitle)) titleAr = "لحم بقر (حجم صغير)";
        else if (/Ground Beef Large/i.test(rawTitle)) titleAr = "لحم بقر (حجم كبير)";
        else if (/Ground Chicken Small/i.test(rawTitle)) titleAr = "دجاج مفروم (حجم صغير)";
        else if (/Ground Chicken Large/i.test(rawTitle)) titleAr = "دجاج مفروم (حجم كبير)";
        else if (/Set of 6 Muffins/i.test(rawTitle)) titleAr = "عبوة ٦ قطع مافن";
        else if (/Set of 12 Muffins/i.test(rawTitle)) titleAr = "عبوة ١٢ قطعة مافن";
        else if (/Set of 6 Cookies/i.test(rawTitle)) titleAr = "عبوة ٦ قطع كوكيز";
        else if (/Set of 16 Pieces/i.test(rawTitle)) titleAr = "عبوة ١٦ قطعة";
        else if (/250\s*(?:gm|g)/i.test(rawTitle)) titleAr = "٢٥٠ جم";
        else if (/500\s*(?:gm|g)/i.test(rawTitle)) titleAr = "٥٠٠ جم";
        else if (/Pack of 3/i.test(rawTitle)) titleAr = "عبوة ٣ قطع";
        else if (/Pack of 2/i.test(rawTitle)) titleAr = "عبوة قطعتين";

        candidates.push({
          id: `var-${variantIdx++}`,
          titleEn: rawTitle,
          titleAr,
          priceAmount: rawPrice,
          pro: proVal,
          fat: fatVal,
          carb: carbVal,
          cal: calStr,
        });
      }
    }
  }

  // "If the item doesn't have the option of servings or different sizes, don't make it an option."
  // Having options requires at least two distinct choices.
  if (candidates.length < 2) {
    return [];
  }

  return candidates;
}

