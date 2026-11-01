import type { Locale } from "@/lib/i18n";
import {
  formatCalories,
  formatMacroWithUnit,
  parseGramsValue,
} from "@/lib/parse-product-nutrition";
import type {
  MenuProductSerialized,
  MenuProductVariantSerialized,
} from "@/app/menu/menu-types";

export function extractSizeInfo(
  title: string,
  locale: Locale,
): { baseTitle: string; sizeLabel: string | null; order: number } {
  const isAr = locale === "ar";
  // Convert Arabic-Indic numerals (٠-٩) to ASCII (0-9) for consistent parsing
  const asciiTitle = title.replace(/[٠-٩]/g, (d) =>
    String(d.charCodeAt(0) - 1632),
  );

  // 1. Basbosa special casing:
  // e.g. "Basbosa 2 Pieces", "Basbosa Set Of 6 Pieces", "بسبوسة - قطعتين", "بسبوسة - عبوة 6 قطع"
  if (
    /^(?:Basbosa\b|بسبوسة)/i.test(asciiTitle) &&
    (/(?:2\s*pieces?|قطعتين|2\s*قطع|2\s*قطعة)/i.test(asciiTitle) ||
      /(?:6\s*pieces?|6\s*قطع|6\s*قطعة)/i.test(asciiTitle))
  ) {
    const isTwoPieces = /(?:2\s*pieces?|قطعتين|2\s*قطع|2\s*قطعة)/i.test(
      asciiTitle,
    );
    const sizeLabel = isAr
      ? isTwoPieces
        ? "قطعتين (2 Pieces)"
        : "عبوة ٦ قطع (6 Pieces)"
      : isTwoPieces
        ? "2 Pieces"
        : "Set Of 6 Pieces";
    return {
      baseTitle: isAr ? "بسبوسة كيتو" : "Basbosa",
      sizeLabel,
      order: isTwoPieces ? 2 : 6,
    };
  }

  // 2. Grams suffix: e.g. "Keto Chicken Sweet and Sour 250gm", "Chicken Fajita 500gm", "250 جم"
  const mGrams = asciiTitle.match(
    /^(.*?)\s*[-–—(]?\s*(\d+)\s*(?:gm|g|جم)\s*\)?$/i,
  );
  if (mGrams) {
    const grams = parseInt(mGrams[2], 10);
    return {
      baseTitle: mGrams[1].trim(),
      sizeLabel: isAr ? `${grams} جم` : `${grams}g`,
      order: grams,
    };
  }

  return { baseTitle: title.trim(), sizeLabel: null, order: 0 };
}

export function groupProductsBySizes(
  products: MenuProductSerialized[],
  locale: Locale,
): MenuProductSerialized[] {
  const groupMap = new Map<
    string,
    {
      baseTitle: string;
      items: {
        product: MenuProductSerialized;
        sizeLabel: string | null;
        order: number;
      }[];
    }
  >();

  for (const product of products) {
    const { baseTitle, sizeLabel, order } = extractSizeInfo(
      product.title,
      locale,
    );
    const key = baseTitle.toLowerCase();
    if (!groupMap.has(key)) {
      groupMap.set(key, { baseTitle, items: [] });
    }
    groupMap.get(key)!.items.push({ product, sizeLabel, order });
  }

  const merged: MenuProductSerialized[] = [];

  for (const group of groupMap.values()) {
    if (group.items.length <= 1) {
      merged.push(group.items[0].product);
      continue;
    }

    // Sort by order so the smaller portion (e.g. 250g) is first
    group.items.sort((a, b) => a.order - b.order);

    // Primary product base is the smallest portion
    const primary = { ...group.items[0].product };
    primary.title = group.baseTitle;

    const baseItem = group.items[0];
    const baseOrder = baseItem.order > 0 ? baseItem.order : 1;
    const baseCal = parseGramsValue(baseItem.product.cal);
    const basePro = parseGramsValue(baseItem.product.pro);
    const baseFat = parseGramsValue(baseItem.product.fat);
    const baseCarb = parseGramsValue(baseItem.product.carb);

    // Create size variants from all products in this group
    const sizeVariants: MenuProductVariantSerialized[] = group.items.map(
      ({ product, sizeLabel, order }) => {
        const title = sizeLabel || product.portionPlain || product.title;
        let cal = product.cal;
        let pro = product.pro;
        let fat = product.fat;
        let carb = product.carb;

        // If this is a larger variant (e.g. 500g vs 250g, or 6 pcs vs 2 pcs)
        if (order > baseOrder && baseOrder > 0) {
          const ratio = order / baseOrder;
          const itemCal = parseGramsValue(product.cal);
          const itemPro = parseGramsValue(product.pro);
          const itemFat = parseGramsValue(product.fat);
          const itemCarb = parseGramsValue(product.carb);

          // If calories are unscaled or missing, scale by portion ratio
          if (baseCal != null && (itemCal == null || itemCal <= baseCal)) {
            const scaledCal = Math.round(baseCal * ratio);
            cal = formatCalories(scaledCal, locale);
          }

          // If protein is unscaled or missing, scale by portion ratio
          if (basePro != null && (itemPro == null || itemPro <= basePro)) {
            const scaledPro = Math.round(basePro * ratio * 10) / 10;
            pro = formatMacroWithUnit(scaledPro, locale);
          }

          // If fat is unscaled or missing, scale by portion ratio
          if (baseFat != null && (itemFat == null || itemFat <= baseFat)) {
            const scaledFat = Math.round(baseFat * ratio * 10) / 10;
            fat = formatMacroWithUnit(scaledFat, locale);
          }

          // If carbs are unscaled or missing, scale by portion ratio
          if (baseCarb != null && (itemCarb == null || itemCarb <= baseCarb)) {
            const scaledCarb = Math.round(baseCarb * ratio * 10) / 10;
            carb = formatMacroWithUnit(scaledCarb, locale);
          }
        }

        return {
          id: product.variantId || product.id,
          title,
          priceLabel: product.priceLabel,
          pro,
          fat,
          carb,
          cal,
          portionPlain: title,
          variantId: product.variantId,
        };
      },
    );

    primary.sizeVariants = sizeVariants;
    primary.portionPlain = sizeVariants.map((v) => v.title).join(" / ");

    // Combine images from all size options (deduped by url)
    const seenUrls = new Set<string>();
    const allImages = group.items
      .flatMap((i) => i.product.images)
      .filter((img) => {
        if (!img.url || seenUrls.has(img.url)) return false;
        seenUrls.add(img.url);
        return true;
      });
    if (allImages.length > 0) {
      primary.images = allImages;
    }

    // Combine filterKeys
    const combinedFilterKeys = Array.from(
      new Set(
        group.items.flatMap((i) =>
          i.product.filterKeys && i.product.filterKeys.length > 0
            ? i.product.filterKeys
            : [i.product.filterKey],
        ),
      ),
    );
    primary.filterKeys = combinedFilterKeys;

    merged.push(primary);
  }

  return merged;
}
