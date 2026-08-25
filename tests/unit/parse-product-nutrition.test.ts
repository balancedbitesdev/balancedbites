import { describe, expect, it } from "vitest";
import {
  parseIngredientsFromDescription,
  parsePortionFromDescription,
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
