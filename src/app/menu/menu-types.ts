export type MenuFilterId =
  | "all"
  | "keto_desserts"
  | "high_protein"
  | "clean_carb"
  | "veggie_sides"
  | "salads"
  | "frozen";

export type MenuProductImage = {
  url: string;
  alt: string;
};

export type MenuProductVariantSerialized = {
  id: string;
  title: string;
  priceLabel: string;
  pro: string;
  fat: string;
  carb: string;
  cal: string;
  portionPlain?: string;
};

export type MenuCategoryChip = {
  id: string;
  label: string;
  count: number;
};

export type MenuProductSerialized = {
  id: string;
  title: string;
  handle: string;
  descriptionPlain: string;
  /** Plain-text ingredients when metafield is set; otherwise cleaned description */
  ingredientsPlain: string;
  /** Serving size & piece count e.g. "1 Jar (250g)", "Pack of 3 Truffles", "1 Full Meal (300g)" */
  portionPlain: string;
  /** Per-serving / per-piece note e.g. "Price is for full pack of 3 pcs · Macros listed per piece" */
  servingNote: string;
  priceLabel: string;
  /** Storefront ProductVariant GID for Cart API */
  variantId: string | null;
  /** All product images from Shopify (order preserved) */
  images: MenuProductImage[];
  /** First image; kept for simple consumers */
  imageUrl: string | null;
  imageAlt: string;
  /** Short label for the image badge, e.g. DESSERT */
  categoryLabel: string;
  filterKey: MenuFilterId | "other" | string;
  pro: string;
  fat: string;
  carb: string;
  cal: string;
  /** Unified, standardized macro string e.g. "Protein 32g · Carbs 45g · Fat 18g" */
  unifiedMacros: string;
  /** Clean numeric calorie amount for sorting or comparisons */
  caloriesNumber: number | null;
  /** Size / portion variants parsed from product description or options */
  sizeVariants: MenuProductVariantSerialized[];
};

