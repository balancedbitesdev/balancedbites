import { describe, expect, it } from "vitest";
import {
  extractSizeInfo,
  groupProductsBySizes,
} from "@/lib/group-menu-products";
import type { MenuProductSerialized } from "@/app/menu/menu-types";

function createMockProduct(
  overrides: Partial<MenuProductSerialized> & { title: string },
): MenuProductSerialized {
  const { title, ...rest } = overrides;
  return {
    id: `gid://shopify/Product/${Math.random().toString(36).substring(7)}`,
    title,
    handle: title.toLowerCase().replace(/\s+/g, "-"),
    descriptionPlain: "Description",
    ingredientsPlain: "Ingredients",
    portionPlain: "1 Portion",
    servingNote: "",
    priceLabel: "250 EGP",
    variantId: `gid://shopify/ProductVariant/${Math.random().toString(36).substring(7)}`,
    images: [{ url: "https://example.com/image.jpg", alt: title }],
    imageUrl: "https://example.com/image.jpg",
    imageAlt: title,
    categoryLabel: "HIGH PROTEIN",
    filterKey: "high_protein",
    filterKeys: ["high_protein"],
    pro: "58g",
    fat: "19g",
    carb: "4g",
    cal: "430 kcal",
    unifiedMacros: "Protein 58g · Carbs 4g · Fat 19g",
    caloriesNumber: 430,
    sizeVariants: [],
    ...rest,
  };
}

describe("extractSizeInfo", () => {
  it("extracts grams from English titles correctly", () => {
    const res250 = extractSizeInfo("Keto Chicken Sweet and Sour 250gm", "en");
    expect(res250.baseTitle).toBe("Keto Chicken Sweet and Sour");
    expect(res250.sizeLabel).toBe("250g");
    expect(res250.order).toBe(250);

    const res500 = extractSizeInfo("Keto Chicken Sweet and Sour 500gm", "en");
    expect(res500.baseTitle).toBe("Keto Chicken Sweet and Sour");
    expect(res500.sizeLabel).toBe("500g");
    expect(res500.order).toBe(500);
  });

  it("extracts grams from Arabic titles with Arabic-Indic numerals", () => {
    const res250 = extractSizeInfo("شيش طاووق ٢٥٠ جم", "ar");
    expect(res250.baseTitle).toBe("شيش طاووق");
    expect(res250.sizeLabel).toBe("250 جم");
    expect(res250.order).toBe(250);

    const res500 = extractSizeInfo("شيش طاووق ٥٠٠ جم", "ar");
    expect(res500.baseTitle).toBe("شيش طاووق");
    expect(res500.sizeLabel).toBe("500 جم");
    expect(res500.order).toBe(500);
  });

  it("extracts Basbosa pieces in English and Arabic", () => {
    const en2 = extractSizeInfo("Basbosa 2 Pieces", "en");
    expect(en2.baseTitle).toBe("Basbosa");
    expect(en2.sizeLabel).toBe("2 Pieces");
    expect(en2.order).toBe(2);

    const en6 = extractSizeInfo("Basbosa Set of 6 Pieces", "en");
    expect(en6.baseTitle).toBe("Basbosa");
    expect(en6.sizeLabel).toBe("Set Of 6 Pieces");
    expect(en6.order).toBe(6);

    const ar2 = extractSizeInfo("بسبوسة - قطعتين", "ar");
    expect(ar2.baseTitle).toBe("بسبوسة كيتو");
    expect(ar2.sizeLabel).toBe("قطعتين (2 Pieces)");
    expect(ar2.order).toBe(2);

    const ar6 = extractSizeInfo("بسبوسة - عبوة ٦ قطع", "ar");
    expect(ar6.baseTitle).toBe("بسبوسة كيتو");
    expect(ar6.sizeLabel).toBe("عبوة ٦ قطع (6 Pieces)");
    expect(ar6.order).toBe(6);
  });
});

describe("groupProductsBySizes macro scaling", () => {
  it("scales unscaled / duplicate macros for 500g variant (e.g. 250g vs 500g)", () => {
    const item250 = createMockProduct({
      title: "Keto Chicken Sweet and Sour 250gm",
      priceLabel: "260 EGP",
      cal: "430 kcal",
      pro: "58g",
      fat: "19g",
      carb: "4g",
    });

    // In Shopify, the 500gm description was copied verbatim with 250gm macros
    const item500 = createMockProduct({
      title: "Keto Chicken Sweet and Sour 500gm",
      priceLabel: "490 EGP",
      cal: "430 kcal", // unscaled
      pro: "58g", // unscaled
      fat: "19g", // unscaled
      carb: "4g", // unscaled
    });

    const grouped = groupProductsBySizes([item250, item500], "en");
    expect(grouped).toHaveLength(1);

    const product = grouped[0];
    expect(product.title).toBe("Keto Chicken Sweet and Sour");
    expect(product.sizeVariants).toHaveLength(2);

    const variant250 = product.sizeVariants![0];
    expect(variant250.title).toBe("250g");
    expect(variant250.cal).toBe("430 kcal");
    expect(variant250.pro).toBe("58g");
    expect(variant250.fat).toBe("19g");
    expect(variant250.carb).toBe("4g");

    const variant500 = product.sizeVariants![1];
    expect(variant500.title).toBe("500g");
    // Scaled by 500 / 250 = 2x
    expect(variant500.cal).toBe("860 kcal");
    expect(variant500.pro).toBe("116g");
    expect(variant500.fat).toBe("38g");
    expect(variant500.carb).toBe("8g");
  });

  it("scales unscaled macros for Basbosa (2 Pieces vs 6 Pieces, 3x ratio)", () => {
    const item2 = createMockProduct({
      title: "Basbosa 2 Pieces",
      cal: "210 kcal",
      pro: "5g",
      fat: "18g",
      carb: "6g",
    });

    const item6 = createMockProduct({
      title: "Basbosa Set of 6 Pieces",
      cal: "210 kcal", // unscaled copy-paste
      pro: "5g",
      fat: "18g",
      carb: "6g",
    });

    const grouped = groupProductsBySizes([item2, item6], "en");
    expect(grouped).toHaveLength(1);

    const product = grouped[0];
    expect(product.sizeVariants).toHaveLength(2);

    const variant6 = product.sizeVariants![1];
    expect(variant6.title).toBe("Set Of 6 Pieces");
    // Scaled by 6 / 2 = 3x
    expect(variant6.cal).toBe("630 kcal");
    expect(variant6.pro).toBe("15g");
    expect(variant6.fat).toBe("54g");
    expect(variant6.carb).toBe("18g");
  });

  it("preserves already-scaled macros from Shopify (e.g. Chicken Fajita 500gm)", () => {
    const item250 = createMockProduct({
      title: "Chicken Fajita 250gm",
      cal: "650 kcal",
      pro: "58g",
      fat: "25g",
      carb: "5g",
    });

    const item500 = createMockProduct({
      title: "Chicken Fajita 500gm",
      cal: "1300 kcal", // already scaled in Shopify
      pro: "116g",
      fat: "50g",
      carb: "10g",
    });

    const grouped = groupProductsBySizes([item250, item500], "en");
    expect(grouped).toHaveLength(1);

    const variant500 = grouped[0].sizeVariants![1];
    expect(variant500.cal).toBe("1300 kcal");
    expect(variant500.pro).toBe("116g");
    expect(variant500.fat).toBe("50g");
    expect(variant500.carb).toBe("10g");
  });

  it("scales and formats correctly in Arabic", () => {
    const item250 = createMockProduct({
      title: "شيش طاووق ٢٥٠ جم",
      cal: "430 سعرة حرارية",
      pro: "58 جم",
      fat: "19 جم",
      carb: "4 جم",
    });

    const item500 = createMockProduct({
      title: "شيش طاووق ٥٠٠ جم",
      cal: "430 سعرة حرارية",
      pro: "58 جم",
      fat: "19 جم",
      carb: "4 جم",
    });

    const grouped = groupProductsBySizes([item250, item500], "ar");
    expect(grouped).toHaveLength(1);

    const variant500 = grouped[0].sizeVariants![1];
    expect(variant500.title).toBe("500 جم");
    expect(variant500.cal).toBe("860 سعرة حرارية");
    expect(variant500.pro).toBe("116 جم");
    expect(variant500.fat).toBe("38 جم");
    expect(variant500.carb).toBe("8 جم");
  });
});
