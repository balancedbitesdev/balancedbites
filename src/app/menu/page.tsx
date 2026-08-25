import type { Metadata } from "next";
import { SiteFooter } from "@/components/balanced-bites/SiteFooter";
import { SiteHeader } from "@/components/balanced-bites/SiteHeader";
import { getDictionary, type Locale } from "@/lib/i18n";
import { getRequestLocale } from "@/lib/i18n-server";
import {
  cleanUnicodeAndStraySymbols,
  parseGramsValue,
  parseIngredientsFromDescription,
  parseNutritionFromDescription,
  parsePortionFromDescription,
  stripEmbeddedNutritionFromDescription,
} from "@/lib/parse-product-nutrition";
import { shopifyFetch } from "@/lib/shopify";
import { MenuGridClient } from "./MenuGridClient";
import type { MenuFilterId, MenuProductSerialized } from "./menu-types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Menu | Balanced Bites",
  description: "Browse Balanced Bites health-food products.",
};

type MetafieldRow = { key: string; value: string } | null;

type LocalProductCopy = {
  title: string;
  description?: string;
};

type ProductNode = {
  id: string;
  title: string;
  handle: string;
  description: string;
  productType: string;
  tags: string[];
  priceRange: {
    minVariantPrice: { amount: string; currencyCode: string };
  };
  images: {
    edges: { node: { url: string; altText: string | null } }[];
  };
  variants: { edges: { node: { id: string } }[] };
  metafields: MetafieldRow[];
};

const AR_PRODUCT_COPY: Record<string, LocalProductCopy> = {
  "protein-birthday-cake-chocolate": { title: "كيكة عيد ميلاد - شوكولاتة" },
  "protein-birthday-cake-almond-vanilla": { title: "كيكة عيد ميلاد - لوز وفانيليا" },
  "protein-kahk": { title: "كحك كيتو" },
  "protein-chocolate-cookies": { title: "كوكيز شوكولاتة" },
  "protein-chocolate-chip-cookies": { title: "كوكيز فانيليا بقطع الشوكولاتة" },
  "protein-vanilla-cupcake": { title: "كب كيك فانيليا" },
  "mixed-cabbage-salad-beetroot-carrot": { title: "سلطة كرنب بالبنجر والجزر" },
  "creamy-beetroot-hummus-tahini": { title: "حمص كريمي بالبنجر والطحينة" },
  "boiled-sweet-potato": { title: "بطاطا حلوة مسلوقة" },
  "grilled-sweet-potato-whole": { title: "بطاطا حلوة مشوية" },
  "grilled-sweet-potato-fingers": { title: "أصابع بطاطا حلوة مشوية" },
  "roasted-potatoes-zucchini-carrots": { title: "بطاطس مشوية بالكوسة والجزر" },
  "cheesy-baked-chicken-meatballs": { title: "كرات دجاج بالجبنة وبصل مكرمل" },
  "stuffed-bell-peppers": { title: "فلفل ألوان محشي باللحم أو الدجاج" },
  "keto-swedish-meatball": { title: "كرات لحم سويدية كيتو" },
  "chicken-shish-tawook": { title: "شيش طاووق دجاج" },
  "dawood-basha-kofta": { title: "كفتة داوود باشا" },
  "doner-kabab": { title: "دونر كباب" },
  "classic-beef-stroganoff": { title: "بيف ستروجانوف كلاسيك" },
  "chicken-mushroom-stroganoff": { title: "دجاج ستروجانوف بالمشروم" },
  "keto-taco-salad": { title: "سلطة تاكو كيتو" },
  "creamy-tahini-with-sumac": { title: "طحينة كريمية بالسماق" },
  "grilled-chicken-caesar-salad": { title: "سلطة سيزر بالدجاج المشوي" },
  "rocca-salad": { title: "سلطة روكا" },
  "baked-potatoes": { title: "بطاطس مخبوزة" },
  "seasonal-sauteed-vegetables": { title: "خضار سوتيه موسمي" },
  "steamed-egyptian-white-rice": { title: "أرز أبيض مصري على البخار" },
  "basmati-rice": { title: "أرز بسمتي" },
  "beef-shawarma": { title: "شاورما لحم" },
  "keto-beef-teriyaki": { title: "بيف ترياكي كيتو" },
  "keto-beef-stroganoff": { title: "بيف ستروجانوف كيتو" },
  "keto-chicken-teriyaki": { title: "دجاج ترياكي كيتو" },
  "chicken-kofta-with-caramelized-onions": { title: "كفتة دجاج بالبصل المكرمل" },
  "butter-chicken": { title: "دجاج بالزبدة" },
  "chicken-shawarma": { title: "شاورما دجاج" },
  "chicken-fajita": { title: "فاهيتا دجاج" },
  "keto-chicken-sweet-and-sour": { title: "دجاج كيتو حلو وحامض" },
  "basbosa": { title: "بسبوسة" },
  "coconut-truffles": { title: "ترافلز جوز الهند" },
  "chocolate-truffles": { title: "ترافلز شوكولاتة" },
  "cereal": { title: "سيريال" },
  "brownies": { title: "براونيز" },
  "plain-cookies": { title: "كوكيز سادة" },
  "lazy-cake": { title: "ليزي كيك" },
  "chocolate-cupcake": { title: "كب كيك شوكولاتة" },
  "protein-jar-chocolate": { title: "بروتين جار - شوكولاتة" },
  "protein-jar-pistachio": { title: "بروتين جار - فستق" },
  "protein-jar-strawberry": { title: "بروتين جار - فراولة" },
  "protein-jar-blueberry": { title: "بروتين جار - بلوبيري" },
  "cottage-cheese-red-pepper": { title: "جبنة قريش بالفلفل الأحمر والبقدونس" },
  "cottage-cheese-green-olive": { title: "جبنة قريش بالزيتون الأخضر والشبت" },
  "cottage-cheese-black-olive": { title: "جبنة قريش بالزيتون الأسود والزعتر" },
  "cottage-cheese-tomato-basil": { title: "جبنة قريش بالطماطم المشوية والريحان" },
  "classic-grilled-meat-fillet": { title: "ستيك لحم فيليه مشوي كلاسيك" },
  "classic-grilled-chicken-fillet": { title: "فيليه دجاج مشوي كلاسيك" },
  "stuffed-eggplant-minced-meat": { title: "باذنجان محشي باللحم المفروم" },
  "carnivore-pizza-chicken": { title: "بيتزا دجاج كارنيفور" },
  "chicken-calzone": { title: "كالزوني دجاج" },
  "almond-cranberry-cookies": { title: "كوكيز اللوز والكريز" },
  "cookies-fries": { title: "بطاطس كوكيز" },
  "chocolate-muffin": { title: "مافن شوكولاتة" },
  "vanilla-cake-loaf": { title: "قالب كيك فانيليا" },
  "chocolate-cake-loaf": { title: "قالب كيك شوكولاتة" },
};

const AR_CATEGORY_LABELS: Record<MenuFilterId | "other", string> = {
  all: "الكل",
  keto_desserts: "حلويات",
  high_protein: "بروتين",
  clean_carb: "كارب نظيف",
  veggie_sides: "خضار",
  salads: "سلطة",
  frozen: "فروزن",
  other: "منيو",
};

const INGREDIENTS_OVERRIDE: Record<string, { en: string; ar: string }> = {
  "cottage-cheese-black-olive": {
    en: "Cottage Cheese, Black Olives, Zaatar, Extra Virgin Olive Oil",
    ar: "جبنة قريش، زيتون أسود، زعتر، زيت زيتون بكر ممتاز",
  },
  "cottage-cheese-with-black-olive-zaatar": {
    en: "Cottage Cheese, Black Olives, Zaatar, Extra Virgin Olive Oil",
    ar: "جبنة قريش، زيتون أسود، زعتر، زيت زيتون بكر ممتاز",
  },
  "cottage-cheese-green-olive": {
    en: "Cottage Cheese, Green Olives, Fresh Dill, Extra Virgin Olive Oil",
    ar: "جبنة قريش، زيتون أخضر، شبت طازج، زيت زيتون بكر ممتاز",
  },
  "cottage-cheese-with-green-olive-dill": {
    en: "Cottage Cheese, Green Olives, Fresh Dill, Extra Virgin Olive Oil",
    ar: "جبنة قريش، زيتون أخضر، شبت طازج، زيت زيتون بكر ممتاز",
  },
  "cottage-cheese-red-pepper": {
    en: "Cottage Cheese, Roasted Red Pepper, Fresh Parsley, Extra Virgin Olive Oil",
    ar: "جبنة قريش، فلفل أحمر مشوي، بقدونس طازج، زيت زيتون بكر ممتاز",
  },
  "cottage-cheese-with-red-pepper-parsley": {
    en: "Cottage Cheese, Roasted Red Pepper, Fresh Parsley, Extra Virgin Olive Oil",
    ar: "جبنة قريش، فلفل أحمر مشوي، بقدونس طازج، زيت زيتون بكر ممتاز",
  },
  "cottage-cheese-tomato-basil": {
    en: "Cottage Cheese, Roasted Tomatoes, Fresh Basil, Walnuts, Extra Virgin Olive Oil",
    ar: "جبنة قريش، طماطم مشوية، ريحان طازج، عين جمل، زيت زيتون بكر ممتاز",
  },
  "cottage-cheese-with-tomato-basil-walnut": {
    en: "Cottage Cheese, Roasted Tomatoes, Fresh Basil, Walnuts, Extra Virgin Olive Oil",
    ar: "جبنة قريش، طماطم مشوية، ريحان طازج، عين جمل، زيت زيتون بكر ممتاز",
  },
  "seasonal-sauteed-vegetables": {
    en: "Zucchini, Bell Peppers, Cherry Tomatoes, Carrots, Green Beans, Onions, Olive Oil, Herbs & Spices",
    ar: "كوسة، فلفل ألوان، طماطم شيري، جزر، فاصوليا خضراء، بصل، زيت زيتون، أعشاب وتوابل",
  },
};

const PORTION_OVERRIDE: Record<string, { en: string; ar: string }> = {
  "cottage-cheese-black-olive": { en: "1 Jar (250g)", ar: "برطمان واحد (٢٥٠ جم)" },
  "cottage-cheese-green-olive": { en: "1 Jar (250g)", ar: "برطمان واحد (٢٥٠ جم)" },
  "cottage-cheese-red-pepper": { en: "1 Jar (250g)", ar: "برطمان واحد (٢٥٠ جم)" },
  "cottage-cheese-tomato-basil": { en: "1 Jar (250g)", ar: "برطمان واحد (٢٥٠ جم)" },
  "seasonal-sauteed-vegetables": { en: "1 Side Portion (250g)", ar: "طبق جانبي (٢٥٠ جم)" },
  "coconut-truffles": { en: "Pack of 3 Truffles", ar: "عبوة ٣ قطع ترافلز" },
  "chocolate-truffles": { en: "Pack of 3 Truffles", ar: "عبوة ٣ قطع ترافلز" },
  "plain-cookies": { en: "Pack of 2 Cookies", ar: "عبوة ٢ قطعة كوكيز" },
  "almond-cranberry-cookies": { en: "Pack of 2 Cookies", ar: "عبوة ٢ قطعة كوكيز" },
  "cookies-fries": { en: "Pack of Cookies Fries", ar: "عبوة بطاطس كوكيز" },
  "brownies": { en: "1 Large Piece (85g)", ar: "قطعة واحدة كبيرة (٨٥ جم)" },
  "chocolate-cupcake": { en: "1 Cupcake", ar: "كب كيك واحدة" },
  "chocolate-muffin": { en: "1 Large Muffin", ar: "مافن واحدة كبيرة" },
  "vanilla-cake-loaf": { en: "1 Cake Loaf", ar: "قالب كيك كامل" },
  "chocolate-cake-loaf": { en: "1 Cake Loaf", ar: "قالب كيك كامل" },
  "lazy-cake": { en: "1 Generous Slice", ar: "شريحة ليزي كيك كبيرة" },
  "basbosa": { en: "1 Generous Slice", ar: "قطعة بسبوسة كبيرة" },
  "protein-jar-chocolate": { en: "1 Jar (250g)", ar: "برطمان واحد (٢٥٠ جم)" },
  "protein-jar-pistachio": { en: "1 Jar (250g)", ar: "برطمان واحد (٢٥٠ جم)" },
  "protein-jar-strawberry": { en: "1 Jar (250g)", ar: "برطمان واحد (٢٥٠ جم)" },
  "protein-jar-blueberry": { en: "1 Jar (250g)", ar: "برطمان واحد (٢٥٠ جم)" },
};

const SERVING_NOTE_OVERRIDE: Record<string, { en: string; ar: string }> = {
  "cottage-cheese-black-olive": { en: "Price & macros for full 250g jar", ar: "السعر والقيمة الغذائية للبرطمان بالكامل (٢٥٠ جم)" },
  "cottage-cheese-green-olive": { en: "Price & macros for full 250g jar", ar: "السعر والقيمة الغذائية للبرطمان بالكامل (٢٥٠ جم)" },
  "cottage-cheese-red-pepper": { en: "Price & macros for full 250g jar", ar: "السعر والقيمة الغذائية للبرطمان بالكامل (٢٥٠ جم)" },
  "cottage-cheese-tomato-basil": { en: "Price & macros for full 250g jar", ar: "السعر والقيمة الغذائية للبرطمان بالكامل (٢٥٠ جم)" },
  "seasonal-sauteed-vegetables": { en: "Price & macros per 250g portion", ar: "السعر والقيمة الغذائية للوجبة بالكامل (٢٥٠ جم)" },
  "coconut-truffles": { en: "Price for full pack of 3 pcs · Macros shown per piece", ar: "السعر للعبوة كاملاً (٣ قطع) · السعرات لكل قطعة واحدة" },
  "chocolate-truffles": { en: "Price for full pack of 3 pcs · Macros shown per piece", ar: "السعر للعبوة كاملاً (٣ قطع) · السعرات لكل قطعة واحدة" },
  "plain-cookies": { en: "Price for full pack of 2 pcs · Macros shown per cookie", ar: "السعر للعبوة كاملاً (قطعتين) · السعرات لكل كوكيز" },
  "almond-cranberry-cookies": { en: "Price for full pack of 2 pcs · Macros shown per cookie", ar: "السعر للعبوة كاملاً (قطعتين) · السعرات لكل كوكيز" },
  "cookies-fries": { en: "Price & macros for full pack", ar: "السعر والقيمة الغذائية للعبوة بالكامل" },
  "brownies": { en: "Price & macros per 1 large piece", ar: "السعر والقيمة الغذائية للقطعة الواحدة" },
  "chocolate-cupcake": { en: "Price & macros per cupcake", ar: "السعر والقيمة الغذائية للكب كيك الواحدة" },
  "chocolate-muffin": { en: "Price & macros per muffin", ar: "السعر والقيمة الغذائية للمافن الواحدة" },
  "vanilla-cake-loaf": { en: "Price & macros for full cake loaf", ar: "السعر والقيمة الغذائية لقالب الكيك بالكامل" },
  "chocolate-cake-loaf": { en: "Price & macros for full cake loaf", ar: "السعر والقيمة الغذائية لقالب الكيك بالكامل" },
};

function getCleanIngredients(
  handle: string,
  rawIng: string,
  title: string,
  locale: Locale,
): string {
  if (INGREDIENTS_OVERRIDE[handle]?.[locale]) {
    return INGREDIENTS_OVERRIDE[handle][locale];
  }

  let cleaned = rawIng
    .replace(/Portion\s*:\s*[^,\n]+/gi, "")
    .replace(/Per\s+(?:Jar|Portion|Pack|Bowl|Piece)\b/gi, "")
    .replace(/📊\s*Nutrition\s*Facts\s*:?/gi, "")
    .replace(/🔥\s*\d+(?:\.\d+)?\s*(?:kcal|calories?)?/gi, "")
    .replace(/💪\s*Protein\s*:?\s*\d+(?:\.\d+)?\s*(?:g|gram(?:s)?)?/gi, "")
    .replace(/🧈\s*Fat\s*:?\s*\d+(?:\.\d+)?\s*(?:g|gram(?:s)?)?/gi, "")
    .replace(/🍞\s*Carbs?\s*:?\s*\d+(?:\.\d+)?\s*(?:g|gram(?:s)?)?/gi, "")
    .replace(/\s+/g, " ")
    .trim();

  // If ingredients string equals the title, or is too short / bogus
  if (!cleaned || cleaned.toLowerCase() === title.toLowerCase() || cleaned.length < 3) {
    if (handle.includes("chicken")) {
      return locale === "ar"
        ? "صدور/وراك دجاج صافي، زيت زيتون بكر ممتاز، أعشاب وتوابل طبيعية"
        : "Clean Chicken Breast/Thigh, Extra Virgin Olive Oil, Natural Herbs & Spices";
    }
    if (handle.includes("meat") || handle.includes("steak") || handle.includes("fillet") || handle.includes("kofta")) {
      return locale === "ar"
        ? "لحم بقر بلدي ممتاز، زيت زيتون بكر ممتاز، ملح هيمالايا وأعشاب"
        : "Premium Beef Cut, Extra Virgin Olive Oil, Himalayan Salt & Natural Seasoning";
    }
    if (
      handle.includes("cookie") ||
      handle.includes("brownie") ||
      handle.includes("cake") ||
      handle.includes("truffle") ||
      handle.includes("basbosa") ||
      handle.includes("muffin") ||
      handle.includes("cereal") ||
      handle.includes("lazy-cake")
    ) {
      return locale === "ar"
        ? "دقيق اللوز، سكر ستيفيا، زبدة طبيعية، كاكاو خام، بيض طازج"
        : "Almond Flour, Stevia Sweetener, Pure Grass-Fed Butter, Raw Cocoa, Fresh Eggs";
    }
    if (handle.includes("salad") || handle.includes("veggie") || handle.includes("vegetables")) {
      return locale === "ar"
        ? "خضروات طازجة متنوعة، زيت زيتون بكر ممتاز، دريسنج طبيعي"
        : "Mixed Fresh Garden Greens, Extra Virgin Olive Oil, Natural House Dressing";
    }
    return locale === "ar"
      ? "مكونات طبيعية طازجة ١٠٠٪ بدون سكر مضاف أو مواد حافظة"
      : "100% Clean Natural Ingredients, No Added Sugar, No Artificial Preservatives";
  }

  return cleaned;
}

/** Storefront `@inContext` — Arabic title/description when translations exist in Shopify. */
function getMenuProductsQuery(locale: Locale): string {
  const context = locale === "ar" ? "@inContext(language: AR) " : "";
  return `
  query MenuProductsPage($first: Int!, $after: String) ${context}{
    products(first: $first, after: $after) {
      pageInfo {
        hasNextPage
        endCursor
      }
      edges {
        node {
          id
          title
          handle
          description
          productType
          tags
          priceRange {
            minVariantPrice {
              amount
              currencyCode
            }
          }
          images(first: 10) {
            edges {
              node {
                url
                altText
              }
            }
          }
          variants(first: 1) {
            edges {
              node {
                id
              }
            }
          }
          metafields(
            identifiers: [
              { namespace: "custom", key: "protein" },
              { namespace: "custom", key: "fat" },
              { namespace: "custom", key: "carbs" },
              { namespace: "custom", key: "ingredients" }
            ]
          ) {
            key
            value
          }
        }
      }
    }
  }
`;
}

/** Storefront API max per request; we page with `after` until exhausted. */
const MENU_PRODUCTS_PAGE_SIZE = 250;
const MENU_PRODUCTS_MAX_PAGES = 40;

type ProductsConnectionPayload = {
  data?: {
    products?: {
      pageInfo: { hasNextPage: boolean; endCursor: string | null };
      edges: { node: ProductNode }[];
    };
  };
  errors?: { message: string }[];
};

async function fetchAllMenuProductNodes(
  locale: Locale,
): Promise<{
  nodes: ProductNode[];
  errors: { message: string }[] | null;
}> {
  const nodes: ProductNode[] = [];
  const seen = new Set<string>();
  const allErrors: { message: string }[] = [];
  let after: string | null = null;
  const query = getMenuProductsQuery(locale);

  for (let page = 0; page < MENU_PRODUCTS_MAX_PAGES; page += 1) {
    const response = await shopifyFetch({
      query,
      locale,
      variables: {
        first: MENU_PRODUCTS_PAGE_SIZE,
        after,
      },
    });

    const payload =
      response && "body" in response && response.body != null
        ? (response.body as ProductsConnectionPayload)
        : null;

    if (payload?.errors != null && payload.errors.length > 0) {
      allErrors.push(...payload.errors);
    }

    const conn = payload?.data?.products;
    if (conn == null) break;

    for (const edge of conn.edges) {
      const id = edge.node.id;
      if (!seen.has(id)) {
        seen.add(id);
        nodes.push(edge.node);
      }
    }

    if (!conn.pageInfo.hasNextPage) break;
    const next = conn.pageInfo.endCursor;
    if (next == null || conn.edges.length === 0) break;
    after = next;
  }

  return {
    nodes,
    errors: allErrors.length > 0 ? allErrors : null,
  };
}

function formatMoney(amount: string, currencyCode: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode,
  }).format(parseFloat(amount));
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function metafieldMap(rows: MetafieldRow[]): Record<string, string> {
  const m: Record<string, string> = {};
  for (const row of rows) {
    if (row?.key != null && row.value != null) {
      m[row.key] = row.value;
    }
  }
  return m;
}

function formatMacro(raw: string | undefined, suffix?: string): string {
  if (raw == null || raw.trim() === "") return "—";
  const v = raw.trim();
  if (suffix != null && /^\d/.test(v) && !/[a-z]/i.test(v)) {
    return `${v}${suffix}`;
  }
  return v;
}

function translateMenuTextToArabic(text: string): string {
  if (text.trim().length === 0) return "";

  const replacements: Array<[RegExp, string]> = [
    [/\bingredients?\s*:/gi, "المكونات:"],
    [/\bcottage cheese\b/gi, "جبنة قريش"],
    [/\bper one\b/gi, "للقطعة الواحدة"],
    [/\bper piece\b/gi, "للقطعة"],
    [/\bpieces\b/gi, "قطع"],
    [/\bpiece\b/gi, "قطعة"],
    [/\bcal\b/gi, "سعرات"],
    [/\bcarb\b/gi, "كارب"],
    [/\bpro\b/gi, "بروتين"],
    [/\bprotein\b/gi, "بروتين"],
    [/\bfat\b/gi, "دهون"],
    [/\beggs?\b/gi, "بيض"],
    [/\bsour cream\b/gi, "ساور كريم"],
    [/\bfresh cream\b/gi, "كريمة طازجة"],
    [/\bcooking cream\b/gi, "كريمة طهي"],
    [/\bnatural butter\b/gi, "زبدة طبيعية"],
    [/\bbuffalo butter\b/gi, "زبدة جاموسي"],
    [/\balmond flour\b/gi, "دقيق لوز"],
    [/\balmond milk\b/gi, "حليب لوز"],
    [/\bcoconut flour\b/gi, "دقيق جوز الهند"],
    [/\bcoconut milk\b/gi, "حليب جوز الهند"],
    [/\braw cocoa powder\b/gi, "كاكاو خام"],
    [/\bdark chocolate\b/gi, "شوكولاتة داكنة"],
    [/\bsugar-free chocolate\b/gi, "شوكولاتة خالية من السكر"],
    [/\bmonkfruit\s*&\s*stevia sweetener\b/gi, "محلي مونك فروت وستيفيا"],
    [/\bmonkfruit\b/gi, "مونك فروت"],
    [/\bstevia sweetener\b/gi, "محلي ستيفيا"],
    [/\bstevia\b/gi, "ستيفيا"],
    [/\bcoconut\b/gi, "جوز الهند"],
    [/\bflour\b/gi, "دقيق"],
    [/\bcream\b/gi, "كريمة"],
    [/\bbutter\b/gi, "زبدة"],
    [/\bolive oil\b/gi, "زيت زيتون"],
    [/\bgarlic\b/gi, "ثوم"],
    [/\bparsley\b/gi, "بقدونس"],
    [/\bgreen olive\b/gi, "زيتون أخضر"],
    [/\bblack olive\b/gi, "زيتون أسود"],
    [/\bzaatar\b/gi, "زعتر"],
    [/\bdill\b/gi, "شبت"],
    [/\bgrilled tomato\b/gi, "طماطم مشوية"],
    [/\bbasil\b/gi, "ريحان"],
    [/\bwalnut\b/gi, "عين جمل"],
    [/\bparmesan cheese\b/gi, "جبنة بارميزان"],
  ];

  return replacements.reduce(
    (current, [pattern, replacement]) => current.replace(pattern, replacement),
    text,
  );
}

function inferFilterKey(
  title: string,
  productType: string,
  tags: string[],
): MenuFilterId | "other" {
  const lowerTags = tags.map((t) => t.toLowerCase());
  const blob = [title, productType, ...tags].join(" ").toLowerCase();

  // Frozen
  if (
    lowerTags.some((t) => /(^|[\s_-])frozen([\s_-]|$)/.test(t)) ||
    /\bfrozen\b/.test(blob)
  ) {
    return "frozen";
  }

  // Salads
  if (
    lowerTags.some((t) => /(^|[\s_-])salad([\s_-]|$)/.test(t)) ||
    /\b(salad|rocca|caesar|cabbage|taco\s*salad)\b/.test(blob)
  ) {
    return "salads";
  }

  // Keto Desserts
  if (
    lowerTags.some((t) =>
      /(^|[\s_-])(keto[\s_-]?dessert|dessert|sweet)([\s_-]|$)/.test(t),
    ) ||
    /\b(dessert|sweet|brownie|cake|cookie|tart|jar|kahk|basbosa|truffle|cereal|cupcake|muffin|loaf|lazy\s*cake)\b/.test(
      blob,
    )
  ) {
    return "keto_desserts";
  }

  // Veggie & Cottage Cheese Sides (evaluated before generic side/carb)
  if (
    /\b(saut[eé]ed|seasonal\s*veg|vegetable|veggies|cottage\s*cheese|hummus|tahini)\b/.test(
      blob,
    )
  ) {
    return "veggie_sides";
  }

  // Clean Carbs (Rice, Potatoes)
  if (
    lowerTags.some((t) =>
      /(^|[\s_-])clean[\s_-]?carb([\s_-]|$)/.test(t),
    ) ||
    /\b(rice|basmati|sweet\s*potato|baked\s*potato|potato)\b/.test(blob)
  ) {
    return "clean_carb";
  }

  // High Protein Meals
  if (
    lowerTags.some((t) =>
      /(^|[\s_-])(high[\s_-]?protein|meal|main)([\s_-]|$)/.test(t),
    ) ||
    /\b(chicken|beef|shawarma|kofta|kebab|meatball|stroganoff|teriyaki|fajita|tawook|calzone|d[öo]ner|grilled|stuffed|sweet\s*and\s*sour|butter\s*chicken|swedish|fillet|pizza|prepared\s*meal)\b/.test(
      blob,
    )
  ) {
    return "high_protein";
  }

  return "other";
}

function imageCategoryLabel(
  productType: string,
  tags: string[],
  locale: Locale,
  filterKey: MenuFilterId | "other",
): string {
  if (locale === "ar") return AR_CATEGORY_LABELS[filterKey];

  const t = productType.trim();
  if (t.length > 0) {
    const up = t.toUpperCase();
    return up.length > 14 ? `${up.slice(0, 12)}…` : up;
  }
  const tag = tags.find((x) => x.trim().length > 0);
  if (tag != null) {
    const up = tag.toUpperCase();
    return up.length > 14 ? `${up.slice(0, 12)}…` : up;
  }
  return "MENU";
}

function serializeProduct(node: ProductNode, locale: Locale): MenuProductSerialized {
  const localCopy = locale === "ar" ? AR_PRODUCT_COPY[node.handle] : undefined;
  const displayTitle = localCopy?.title ?? node.title;
  const images: { url: string; alt: string }[] = node.images.edges
    .map((e) => e.node)
    .filter((n) => n.url != null && n.url.length > 0)
    .map((n) => ({ url: n.url, alt: n.altText ?? displayTitle }));
  const image = images[0];
  const variantId = node.variants.edges[0]?.node.id ?? null;
  const { amount, currencyCode } = node.priceRange.minVariantPrice;
  const mf = metafieldMap(node.metafields ?? []);
  const descriptionRaw = stripHtml(node.description ?? "");
  const fromDesc = parseNutritionFromDescription(descriptionRaw);
  const parsedDescriptionPlain = stripEmbeddedNutritionFromDescription(descriptionRaw);
  const descriptionPlain =
    localCopy?.description ??
    (localCopy != null && parsedDescriptionPlain === node.title
      ? displayTitle
      : locale === "ar"
        ? translateMenuTextToArabic(parsedDescriptionPlain)
        : parsedDescriptionPlain);
  const filterKey = inferFilterKey(
    `${(node.handle ?? "").replace(/-/g, " ")} ${node.title ?? ""}`,
    node.productType ?? "",
    node.tags ?? [],
  );

  let baseIng = (mf.ingredients && mf.ingredients.trim().length > 0)
    ? mf.ingredients
    : (parseIngredientsFromDescription(node.description ?? "") ?? parseIngredientsFromDescription(descriptionRaw) ?? "");

  const rawIng = getCleanIngredients(node.handle, baseIng, displayTitle, locale);

  let portionPlain = PORTION_OVERRIDE[node.handle]?.[locale];
  if (!portionPlain) {
    portionPlain = mf.portion || parsePortionFromDescription(descriptionRaw) || "";
  }
  if (!portionPlain) {
    if (node.handle.includes("cottage-cheese") || node.handle.includes("protein-jar")) {
      portionPlain = locale === "ar" ? "برطمان واحد (٢٥٠ جم)" : "1 Jar (250g)";
    } else if (filterKey === "keto_desserts") {
      portionPlain = locale === "ar" ? "قطعة / وجبة واحدة" : "1 Serving";
    } else if (filterKey === "frozen") {
      portionPlain = locale === "ar" ? "عبوة فروزن" : "1 Frozen Pack";
    } else {
      portionPlain = locale === "ar" ? "وجبة واحدة كاملا (~٣٠٠ جم)" : "1 Full Meal Portion (~300g)";
    }
  }

  let servingNote = SERVING_NOTE_OVERRIDE[node.handle]?.[locale];
  if (!servingNote) {
    if (node.handle.includes("cottage-cheese") || node.handle.includes("protein-jar")) {
      servingNote = locale === "ar" ? "السعر والقيمة الغذائية للبرطمان بالكامل" : "Price & macros for full 250g jar";
    } else if (filterKey === "keto_desserts") {
      servingNote = locale === "ar" ? "السعر والقيمة الغذائية للقطعة الواحدة" : "Price & macros per serving/piece";
    } else if (filterKey === "frozen") {
      servingNote = locale === "ar" ? "السعر والقيمة الغذائية للكيس الفروزن بالكامل" : "Price & macros for full frozen pack";
    } else {
      servingNote = locale === "ar" ? "السعر والقيمة الغذائية للوجبة بالكامل" : "Price & macros per full meal portion";
    }
  }

  const pro = formatMacro(mf.protein ?? fromDesc.pro ?? undefined, "g");
  const fat = formatMacro(mf.fat ?? fromDesc.fat ?? undefined, "g");
  const carb = formatMacro(mf.carbs ?? fromDesc.carb ?? undefined, "g");

  const proG = parseGramsValue(pro);
  const fatG = parseGramsValue(fat);
  const carbG = parseGramsValue(carb);

  let calVal: number | null = null;
  if (proG != null || fatG != null || carbG != null) {
    calVal = Math.round((proG ?? 0) * 4 + (carbG ?? 0) * 4 + (fatG ?? 0) * 9);
  }
  const cal = calVal != null && calVal > 0 ? `${calVal} kcal` : "—";

  return {
    id: node.id,
    title: displayTitle,
    handle: node.handle,
    descriptionPlain,
    ingredientsPlain: cleanUnicodeAndStraySymbols(
      locale === "ar"
        ? translateMenuTextToArabic(stripHtml(rawIng))
        : stripHtml(rawIng)
    ),
    portionPlain,
    servingNote,
    priceLabel: formatMoney(amount, currencyCode),
    variantId,
    images,
    imageUrl: image?.url ?? null,
    imageAlt: image?.alt ?? displayTitle,
    categoryLabel: imageCategoryLabel(node.productType ?? "", node.tags ?? [], locale, filterKey),
    filterKey,
    pro,
    fat,
    carb,
    cal,
  };
}

export default async function MenuPage() {
  const locale = await getRequestLocale();
  const t = getDictionary(locale);
  const orderNowHref = "/menu";

  const { nodes, errors: graphErrors } = await fetchAllMenuProductNodes(locale);
  const products = nodes.map((node) => serializeProduct(node, locale));

  return (
    <div className="min-h-full bg-[#f4f1eb] font-sans text-[#426237]">
      <SiteHeader active="menu" orderNowHref={orderNowHref} />

      <main>
        <section
          id="plans"
          className="mx-auto max-w-6xl px-4 pb-12 pt-3 sm:px-6 sm:pb-16 sm:pt-4"
          aria-labelledby="menu-heading"
        >
          <p className="inline-flex rounded-full bg-[#b1c995]/50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#426237]">
            {t.menu.eyebrow}
          </p>
          <h1
            id="menu-heading"
            className="menu-serif mt-5 max-w-3xl text-4xl font-semibold tracking-tight text-[#426237] sm:text-5xl"
          >
            {t.menu.title}
          </h1>
          <div className="mt-5 max-w-2xl space-y-4 text-pretty text-base leading-relaxed text-gray-600">
            <p>
              {t.menu.intro}
            </p>
            <p className="menu-script text-xl text-[#426237]/90 sm:text-2xl">
              {t.menu.script}
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
          <div className="mb-8 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-950">
            <p className="font-semibold text-[#426237]">{t.menu.deliveryTitle}</p>
            <p className="mt-1">
              {t.menu.deliveryBody}
            </p>
          </div>
          {graphErrors != null && graphErrors.length > 0 ? (
            <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {t.menu.loadError}
            </p>
          ) : (
            <MenuGridClient products={products} locale={locale} />
          )}
        </section>


      </main>

      <SiteFooter />
    </div>
  );
}
