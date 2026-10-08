import { describe, expect, it } from "vitest";
import {
  formatCalories,
  formatMacroWithUnit,
  formatNutritionNumber,
  formatUnifiedMacros,
  normalizeCategory,
  parseArabicFromDescription,
  parseCategoryFromDescription,
  parseIngredientsFromDescription,
  parseNutritionFromDescription,
  parsePortionFromDescription,
  parseSizeVariantsFromDescription,
  stripArabicBlockFromDescription,
  stripEmbeddedNutritionFromDescription,
} from "@/lib/parse-product-nutrition";

describe("parseIngredientsFromDescription", () => {
  it("parses ingredients with Parmesan cheese and walnuts without stopping on N", () => {
    const raw = "Ingredients: Grilled Tomato, Basil, Olive Oil, Walnut, Parmesan Cheese\n250gm";
    expect(parseIngredientsFromDescription(raw)).toBe(
      "Grilled Tomato, Basil, Olive Oil, Walnut, Parmesan Cheese"
    );
  });

  it("parses ingredients from HTML description from Shopify", () => {
    const html = "<p><strong>Ingredients:</strong> Grilled Tomato, Basil, Olive Oil, Walnut, Parmesan Cheese</p><p>250gm</p>";
    expect(parseIngredientsFromDescription(html)).toBe(
      "Grilled Tomato, Basil, Olive Oil, Walnut, Parmesan Cheese"
    );
  });

  it("parses ingredients containing Chicken and Seasoning", () => {
    const raw = "Ingredients: Clean Chicken Breast/Thigh, Extra Virgin Olive Oil, Natural Herbs & Spices";
    expect(parseIngredientsFromDescription(raw)).toBe(
      "Clean Chicken Breast/Thigh, Extra Virgin Olive Oil, Natural Herbs & Spices"
    );
  });

  it("parses ingredients followed by Portion and Nutrition sections", () => {
    const raw = "Ingredients: Cottage Cheese, Red Pepper, Fresh Parsley, Extra Virgin Olive Oil\nPortion: 250g\nNutrition: Protein: 20g | Carbs: 5g | Fat: 10g";
    expect(parseIngredientsFromDescription(raw)).toBe(
      "Cottage Cheese, Red Pepper, Fresh Parsley, Extra Virgin Olive Oil"
    );
  });

  it("parses Arabic ingredients list", () => {
    const raw = "المكونات: جبنة قريش، طماطم مشوية، ريحان طازج، عين جمل، زيت زيتون بكر ممتاز";
    expect(parseIngredientsFromDescription(raw)).toBe(
      "جبنة قريش، طماطم مشوية، ريحان طازج، عين جمل، زيت زيتون بكر ممتاز"
    );
  });
});

describe("stripEmbeddedNutritionFromDescription", () => {
  it("strips embedded ingredients section while preserving main product story text", () => {
    const raw = "Delicious cottage cheese dip made fresh daily. Ingredients: Grilled Tomato, Basil, Olive Oil, Walnut, Parmesan Cheese";
    expect(stripEmbeddedNutritionFromDescription(raw)).toBe("Delicious cottage cheese dip made fresh daily.");
  });
});

describe("parsePortionFromDescription", () => {
  it("parses portion size from description text", () => {
    const raw = "Ingredients: Almond flour\nPortion: 250g Jar\nNutrition: 200 kcal";
    expect(parsePortionFromDescription(raw)).toBe("250g Jar");
  });
});

describe("parseCategoryFromDescription & normalizeCategory", () => {
  it("parses explicit category header from product description", () => {
    const html = "<p>Category: Keto Desserts</p><p>Ingredients: Almond flour...</p>";
    expect(parseCategoryFromDescription(html)).toBe("keto_desserts");
  });

  it("normalizes misspellings like 'Desert' to keto_desserts", () => {
    const text = "Pack: Set Of 6 Muffins Serving Per One: Cal 133 Category: Desert";
    expect(parseCategoryFromDescription(text)).toBe("keto_desserts");
  });

  it("parses Arabic category header from description", () => {
    const text = "القسم: سلطة\nالمكونات: خس، دجاج";
    expect(parseCategoryFromDescription(text)).toBe("salads");
  });

  it("normalizes Cottage Cheese correctly into veggie_sides", () => {
    const cat = normalizeCategory("Meal & High Protein", {
      title: "Cottage Cheese with Red Pepper & Parsley 250gm",
      handle: "cottage-cheese-red-pepper",
      productType: "Cottage Cheese",
    });
    expect(cat.id).toBe("veggie_sides");
    expect(cat.labelEn).toBe("Vegetable Sides");
  });

  it("normalizes meals with no category header into high_protein", () => {
    const cat = normalizeCategory(null, {
      title: "Doner Kebab 250gm",
      handle: "doner-kebab",
      productType: "Meals",
      tags: ["meals"],
    });
    expect(cat.id).toBe("high_protein");
  });

  it("normalizes custom clean category dynamically", () => {
    const cat = normalizeCategory("Cold Pressed Juices");
    expect(cat.id).toBe("cold_pressed_juices");
    expect(cat.labelEn).toBe("Cold Pressed Juices");
  });
});

describe("parseNutritionFromDescription & formatters", () => {
  it("parses live Shopify descriptions with Cals, cramped labels, and Ffat", () => {
    const desc1 = "Cals 195 Pro 3.5 Carb 9.5 Fat 15 Category: Salad";
    expect(parseNutritionFromDescription(desc1)).toEqual({
      cal: "195",
      pro: "3.5",
      carb: "9.5",
      fat: "15",
    });

    const desc2 = "Cals 460 Pro: 35 Carbs: 9 Ffat 28 Category: Salad";
    expect(parseNutritionFromDescription(desc2)).toEqual({
      cal: "460",
      pro: "35",
      carb: "9",
      fat: "28",
    });

    const desc3 = "Cal 820 Protein58 Fat 60Carb 8";
    expect(parseNutritionFromDescription(desc3)).toEqual({
      cal: "820",
      pro: "58",
      carb: "8",
      fat: "60",
    });
  });

  it("normalizes and formats nutrition numbers and units cleanly", () => {
    expect(formatNutritionNumber("32.0")).toBe("32");
    expect(formatNutritionNumber("32.5")).toBe("32.5");
    expect(formatNutritionNumber(null)).toBeNull();

    expect(formatCalories(520, "en")).toBe("520 kcal");
    expect(formatCalories(null, "en")).toBe("—");
    expect(formatCalories(520, "ar")).toBe("520 سعرة حرارية");

    expect(formatMacroWithUnit("32.0", "en")).toBe("32g");
    expect(formatMacroWithUnit("32.5", "ar")).toBe("32.5 جم");

    expect(formatUnifiedMacros("32.0", "45", "18.5", "en")).toBe(
      "Protein 32g · Carbs 45g · Fat 18.5g"
    );
    expect(formatUnifiedMacros("32", "45", "18", "ar")).toBe(
      "بروتين 32 جم · كارب 45 جم · دهون 18 جم"
    );
  });
});

describe("parseSizeVariantsFromDescription", () => {
  it("parses multi-variant portion breakdown lines", () => {
    const text = `
      Small Portion (280 EGP): 760 kcal • Protein: 55g • Fat: 52g • Carbs: 7g
      Large Portion (460 EGP): 1520 kcal • Protein: 110g • Fat: 104g • Carbs: 14g
    `;
    const variants = parseSizeVariantsFromDescription(text);
    expect(variants).toHaveLength(2);
    expect(variants[0].titleEn).toBe("Small Portion");
    expect(variants[0].titleAr).toBe("حجم صغير");
    expect(variants[0].priceAmount).toBe(280);
    expect(variants[0].pro).toBe("55g");
    expect(variants[1].titleEn).toBe("Large Portion");
    expect(variants[1].priceAmount).toBe(460);
  });
});

describe("parseArabicFromDescription & stripArabicBlockFromDescription", () => {
  it("parses Arabic tags from description copy", () => {
    const text = `
      Juicy grilled chicken breast with natural herbs.
      Category: Meal (High Protein)
      Calories: 380 | Protein: 42g | Carbs: 2g | Fat: 8g

      العنوان: فيليه دجاج مشوي
      الوصف: صدور دجاج متبلة بالأعشاب الطبيعية وزيت الزيتون
      المكونات: صدور دجاج، زيت زيتون، أعشاب وتوابل
    `;

    const parsed = parseArabicFromDescription(text);
    expect(parsed.title).toBe("فيليه دجاج مشوي");
    expect(parsed.description).toBe("صدور دجاج متبلة بالأعشاب الطبيعية وزيت الزيتون");
    expect(parsed.ingredients).toBe("صدور دجاج، زيت زيتون، أعشاب وتوابل");
  });

  it("parses English-labeled Arabic tags (Title Ar / Description Ar / Ingredients Ar)", () => {
    const text = `
      Delicious low carb brownies.
      Title Ar: براونيز كيتو
      Description Ar: براونيز شيكولاتة غنية وصحية بدقيق اللوز
      Ingredients Ar: دقيق اللوز، كاكاو خام، زبدة
    `;

    const parsed = parseArabicFromDescription(text);
    expect(parsed.title).toBe("براونيز كيتو");
    expect(parsed.description).toBe("براونيز شيكولاتة غنية وصحية بدقيق اللوز");
    expect(parsed.ingredients).toBe("دقيق اللوز، كاكاو خام، زبدة");
  });

  it("parses explicit [AR] ... [/AR] blocks", () => {
    const text = `
      Almond flour vanilla cookies.
      [AR]
      العنوان: كوكيز فانيليا
      الوصف: كوكيز فانيليا مقرمشة
      [/AR]
    `;

    const parsed = parseArabicFromDescription(text);
    expect(parsed.title).toBe("كوكيز فانيليا");
    expect(parsed.description).toBe("كوكيز فانيليا مقرمشة");
    expect(parsed.ingredients).toBeNull();
  });

  it("returns nulls when description has no Arabic translation markup", () => {
    const text = "Pure dark chocolate bar. Calories: 200 | Protein: 5g";
    const parsed = parseArabicFromDescription(text);
    expect(parsed.title).toBeNull();
    expect(parsed.description).toBeNull();
    expect(parsed.ingredients).toBeNull();
  });

  it("strips Arabic translation tags and blocks from English description", () => {
    const text = `
      Juicy grilled chicken breast with natural herbs.
      العنوان: فيليه دجاج مشوي
      الوصف: صدور دجاج متبلة بالأعشاب الطبيعية وزيت الزيتون
      المكونات: صدور دجاج، زيت زيتون، أعشاب وتوابل
    `;

    const stripped = stripArabicBlockFromDescription(text);
    expect(stripped).toBe("Juicy grilled chicken breast with natural herbs.");
  });

  it("strips [AR] blocks cleanly from English description", () => {
    const text = `
      Healthy keto dessert.
      [AR]
      العنوان: حلوى كيتو
      الوصف: حلوى صحية
      [/AR]
    `;

    const stripped = stripArabicBlockFromDescription(text);
    expect(stripped).toBe("Healthy keto dessert.");
  });
});

