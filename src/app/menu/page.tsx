import type { Metadata } from "next";
import { SiteFooter } from "@/components/balanced-bites/SiteFooter";
import { SiteHeader } from "@/components/balanced-bites/SiteHeader";
import { getDictionary, type Locale } from "@/lib/i18n";
import { getRequestLocale } from "@/lib/i18n-server";
import {
  CANONICAL_CATEGORIES,
  cleanUnicodeAndStraySymbols,
  formatCalories,
  formatMacroWithUnit,
  formatNutritionNumber,
  formatUnifiedMacros,
  normalizeCategory,
  normalizeIngredientsText,
  parseArabicFromDescription,
  parseCategoryFromDescription,
  parseGramsValue,
  parseIngredientsFromDescription,
  parseNutritionFromDescription,
  parsePortionFromDescription,
  parseSizeVariantsFromDescription,
  stripArabicBlockFromDescription,
  stripEmbeddedNutritionFromDescription,
} from "@/lib/parse-product-nutrition";
import { shopifyFetch } from "@/lib/shopify";
import { MenuGridClient } from "./MenuGridClient";
import type { MenuCategoryChip, MenuProductSerialized, MenuProductVariantSerialized } from "./menu-types";

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
  "chocolate-protein-jar": { title: "بروتين جار - شوكولاتة" },
  "pistachio-protein-jar": { title: "بروتين جار - فستق" },
  "strawberry-protein-jar": { title: "بروتين جار - فراولة" },
  "blueberry-protein-jar": { title: "بروتين جار - بلوبيري" },
  "protein-birthday-cake-chocolate": { title: "كيكة عيد ميلاد - شوكولاتة" },
  "protein-birthday-cake-almond-vanilla": { title: "كيكة عيد ميلاد - لوز وفانيليا" },
  "birthday-chocolate-cake": { title: "كيكة عيد ميلاد - شوكولاتة" },
  "birthday-almond-cake": { title: "كيكة عيد ميلاد - لوز" },
  "kahk": { title: "كحك كيتو" },
  "protein-kahk": { title: "كحك كيتو" },
  "chocolate-cookies": { title: "كوكيز شوكولاتة" },
  "protein-chocolate-cookies": { title: "كوكيز شوكولاتة" },
  "chocolate-chip-cookies": { title: "كوكيز بقطع الشوكولاتة" },
  "protein-chocolate-chip-cookies": { title: "كوكيز فانيليا بقطع الشوكولاتة" },
  "vanilla-muffin": { title: "مافن فانيليا" },
  "protein-vanilla-cupcake": { title: "كب كيك فانيليا" },
  "mixed-cabbage-salad-with-beetroot-and-carrot": { title: "سلطة كرنب بالبنجر والجزر" },
  "mixed-cabbage-salad-beetroot-carrot": { title: "سلطة كرنب بالبنجر والجزر" },
  "creamy-beetroot-hummus-with-tahini": { title: "حمص كريمي بالبنجر والطحينة" },
  "creamy-beetroot-hummus-tahini": { title: "حمص كريمي بالبنجر والطحينة" },
  "boiled-sweet-potato": { title: "بطاطا حلوة مسلوقة" },
  "grilled-sweet-potato": { title: "بطاطا حلوة مشوية" },
  "grilled-sweet-potato-whole": { title: "بطاطا حلوة مشوية" },
  "grilled-sweet-potato-fingers": { title: "أصابع بطاطا حلوة مشوية" },
  "roasted-potatoes-zucchini-carrots": { title: "بطاطس مشوية بالكوسة والجزر" },
  "seasonal-saut-ed-vegetables": { title: "خضار سوتيه موسمي" },
  "cottage-cheese-with-red-pepper-and-parsley": { title: "جبنة قريش بالفلفل الأحمر والبقدونس" },
  "cottage-cheese-with-green-olive-and-dill": { title: "جبنة قريش بالزيتون الأخضر والشبت" },
  "cottage-cheese-with-black-olive-and-zaatar": { title: "جبنة قريش بالزيتون الأسود والزعتر" },
  "cottage-cheese-with-tomato-basil-and-walnut": { title: "جبنة قريش بالطماطم والريحان وعين الجمل" },
  "cheesy-baked-chicken-meatballs": { title: "كرات دجاج بالجبنة وبصل مكرمل" },
  "keto-chicken-kofta-with-caramelized-onion": { title: "كفتة دجاج كيتو بالبصل المكرمل" },
  "keto-chicken-kofta-with-caramelized-onion-500gm": { title: "كفتة دجاج كيتو بالبصل المكرمل ٥٠٠ جم" },
  "stuffed-bell-peppers-with-ground-beef": { title: "فلفل ألوان محشي باللحم المفروم" },
  "stuffed-bell-peppers-with-ground-beef-500gm": { title: "فلفل ألوان محشي باللحم المفروم ٥٠٠ جم" },
  "stuffed-bell-peppers-with-ground-chicken": { title: "فلفل ألوان محشي بالدجاج المفروم" },
  "stuffed-bell-peppers": { title: "فلفل ألوان محشي باللحم أو الدجاج" },
  "keto-swedish-meatballs": { title: "كرات لحم سويدية كيتو" },
  "keto-swedish-meatballs-500gm": { title: "كرات لحم سويدية كيتو ٥٠٠ جم" },
  "keto-swedish-meatball": { title: "كرات لحم سويدية كيتو" },
  "shish-tawook": { title: "شيش طاووق ٢٥٠ جم" },
  "shish-tawook-500gm": { title: "شيش طاووق ٥٠٠ جم" },
  "chicken-shish-tawook": { title: "شيش طاووق دجاج" },
  "beef-meatballs-in-tomato-sauce-dawood-basha": { title: "كرات لحم بصلصة الطماطم - داوود باشا ٢٥٠ جم" },
  "beef-meatballs-in-tomato-sauce-dawood-basha-500gm": { title: "كرات لحم بصلصة الطماطم - داوود باشا ٥٠٠ جم" },
  "dawood-basha-kofta": { title: "كفتة داوود باشا" },
  "doner-kebab": { title: "دونر كباب ٢٥٠ جم" },
  "doner-kebab-500gm": { title: "دونر كباب ٥٠٠ جم" },
  "doner-kabab": { title: "دونر كباب" },
  "classic-beef-stroganoff": { title: "بيف ستروجانوف كلاسيك" },
  "keto-chicken-stroganoff": { title: "دجاج ستروجانوف كيتو ٢٥٠ جم" },
  "keto-chicken-stroganoff-500gm": { title: "دجاج ستروجانوف كيتو ٥٠٠ جم" },
  "chicken-mushroom-stroganoff": { title: "دجاج ستروجانوف بالمشروم" },
  "keto-taco-salad": { title: "سلطة تاكو كيتو" },
  "creamy-tahini-with-sumac": { title: "طحينة كريمية بالسماق" },
  "grilled-chicken-caesar-salad": { title: "سلطة سيزر بالدجاج المشوي" },
  "rocca-salad": { title: "سلطة روكا" },
  "baked-potatoes": { title: "بطاطس مخبوزة" },
  "seasonal-sauteed-vegetables": { title: "خضار سوتيه موسمي" },
  "steamed-egyptian-white-rice": { title: "أرز أبيض مصري على البخار" },
  "basmati-rice": { title: "أرز بسمتي" },
  "basmati-rice-2": { title: "أرز بسمتي ١٠٠ جم" },
  "beef-shawarma": { title: "شاورما لحم" },
  "beef-shawarma-500gm": { title: "شاورما لحم ٥٠٠ جم" },
  "keto-beef-teriyaki": { title: "بيف ترياكي كيتو" },
  "keto-beef-teriyaki-500gm": { title: "بيف ترياكي كيتو ٥٠٠ جم" },
  "keto-beef-stroganoff": { title: "بيف ستروجانوف كيتو" },
  "keto-beef-stroganoff-500gm": { title: "بيف ستروجانوف كيتو ٥٠٠ جم" },
  "keto-chicken-teriyaki": { title: "دجاج ترياكي كيتو" },
  "keto-chicken-teriyaki-500gm": { title: "دجاج ترياكي كيتو ٥٠٠ جم" },
  "chicken-kofta-with-caramelized-onions": { title: "كفتة دجاج بالبصل المكرمل" },
  "butter-chicken": { title: "دجاج بالزبدة" },
  "butter-chicken-500gm": { title: "دجاج بالزبدة ٥٠٠ جم" },
  "chicken-shawarma": { title: "شاورما دجاج" },
  "chicken-shawarma-500gm": { title: "شاورما دجاج ٥٠٠ جم" },
  "chicken-fajita": { title: "فاهيتا دجاج" },
  "chicken-fajita-500gm": { title: "فاهيتا دجاج ٥٠٠ جم" },
  "keto-chicken-sweet-and-sour": { title: "دجاج كيتو حلو وحامض" },
  "keto-chicken-sweet-and-sour-500gm": { title: "دجاج كيتو حلو وحامض ٥٠٠ جم" },
  "basbosa": { title: "بسبوسة" },
  "basbosa-2-pieces": { title: "بسبوسة - قطعتين" },
  "basbosa-set-of-6-pieces": { title: "بسبوسة - عبوة ٦ قطع" },
  "peanut-butter-tart": { title: "تارت زبدة الفول السوداني" },
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
  "classic-grilled-meat-fillet-500gm": { title: "ستيك لحم فيليه مشوي كلاسيك ٥٠٠ جم" },
  "classic-grilled-chicken-fillet": { title: "فيليه دجاج مشوي كلاسيك" },
  "classic-grilled-chicken-fillet-large": { title: "فيليه دجاج مشوي كلاسيك ٥٠٠ جم" },
  "stuffed-eggplant-minced-meat": { title: "باذنجان محشي باللحم المفروم" },
  "stuffed-eggplant-with-minced-meat": { title: "باذنجان محشي باللحم المفروم ٢٥٠ جم" },
  "stuffed-eggplant-with-minced-meat-500gm": { title: "باذنجان محشي باللحم المفروم ٥٠٠ جم" },
  "carnivore-pizza-chicken": { title: "بيتزا دجاج كارنيفور" },
  "carnivore-pizza-chicken-500gm": { title: "بيتزا دجاج كارنيفور ٥٠٠ جم" },
  "chicken-calzone": { title: "كالزوني دجاج" },
  "chicken-calzone-500gm": { title: "فلفل ألوان محشي بالدجاج المفروم ٥٠٠ جم" },
  "chicken-calzone-500gm-1": { title: "كالزوني دجاج ٥٠٠ جم" },
  "almond-cranberry-cookies": { title: "كوكيز اللوز والكريز" },
  "cookies-fries": { title: "بطاطس كوكيز" },
  "chocolate-muffin": { title: "مافن شوكولاتة" },
  "vanilla-cake-loaf": { title: "قالب كيك فانيليا" },
  "chocolate-cake-loaf": { title: "قالب كيك شوكولاتة" },
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
  "peanut-butter-tart": {
    en: "Almond Flour, Stevia Sweetener, Coconut Flour, Coconut Milk, Pure Peanut Butter, 85% Dark Chocolate",
    ar: "دقيق لوز، محلي ستيفيا، دقيق جوز الهند، حليب جوز الهند، زبدة فول سوداني، شوكولاتة داكنة ٨٥٪",
  },
};

const PORTION_OVERRIDE: Record<string, { en: string; ar: string }> = {
  "cottage-cheese-black-olive": { en: "1 Jar (250g)", ar: "برطمان واحد (٢٥٠ جم)" },
  "cottage-cheese-green-olive": { en: "1 Jar (250g)", ar: "برطمان واحد (٢٥٠ جم)" },
  "cottage-cheese-red-pepper": { en: "1 Jar (250g)", ar: "برطمان واحد (٢٥٠ جم)" },
  "cottage-cheese-tomato-basil": { en: "1 Jar (250g)", ar: "برطمان واحد (٢٥٠ جم)" },
  "seasonal-sauteed-vegetables": { en: "1 Side Portion (250g)", ar: "طبق جانبي (٢٥٠ جم)" },
  "peanut-butter-tart": { en: "Set of 6 Pieces", ar: "عبوة ٦ قطع" },
  "chocolate-muffin": { en: "Set of 6 Muffins", ar: "عبوة ٦ قطع مافن" },
  "vanilla-muffin": { en: "Set of 6 Muffins", ar: "عبوة ٦ قطع مافن" },
  "chocolate-chip-cookies": { en: "Set of 6 Cookies (50g/pc)", ar: "عبوة ٦ قطع كوكيز (٥٠ جم/قطعة)" },
  "chocolate-cookies": { en: "Set of 6 Cookies (50g/pc)", ar: "عبوة ٦ قطع كوكيز (٥٠ جم/قطعة)" },
  "almond-cranberry-cookies": { en: "Set of 6 Cookies (50g/pc)", ar: "عبوة ٦ قطع كوكيز (٥٠ جم/قطعة)" },
  "cookies-fries": { en: "Box of 5 Cookies Fries", ar: "علبة ٥ أصابع كوكيز" },
  "coconut-truffles": { en: "Box of 5 Truffles", ar: "علبة ٥ قطع ترافلز" },
  "chocolate-truffles": { en: "Box of 5 Truffles", ar: "علبة ٥ قطع ترافلز" },
  "kahk": { en: "Set of 16 Pieces", ar: "عبوة ١٦ قطعة كحك" },
  "protein-kahk": { en: "Set of 16 Pieces", ar: "عبوة ١٦ قطعة كحك" },
  "basbosa-set-of-6-pieces": { en: "Set of 6 Pieces", ar: "عبوة ٦ قطع بسبوسة" },
  "basbosa-2-pieces": { en: "Pack of 2 Pieces", ar: "عبوة قطعتين بسبوسة" },
  "plain-cookies": { en: "Pack of 2 Cookies", ar: "عبوة قطعتين كوكيز" },
  "brownies": { en: "1 Large Piece (85g)", ar: "قطعة واحدة كبيرة (٨٥ جم)" },
  "chocolate-cupcake": { en: "1 Cupcake", ar: "كب كيك واحدة" },
  "vanilla-cake-loaf": { en: "Whole Loaf (8 Slices)", ar: "قالب كامل (٨ شرائح)" },
  "chocolate-cake-loaf": { en: "Whole Loaf (8 Slices)", ar: "قالب كامل (٨ شرائح)" },
  "birthday-almond-cake": { en: "Whole Cake (12 Slices, 20cm)", ar: "كيكة كاملة (١٢ قطعة، قطر ٢٠ سم)" },
  "birthday-chocolate-cake": { en: "Whole Cake (12 Slices, 20cm)", ar: "كيكة كاملة (١٢ قطعة، قطر ٢٠ سم)" },
  "lazy-cake": { en: "1 Generous Slice", ar: "شريحة ليزي كيك كبيرة" },
  "basbosa": { en: "1 Generous Slice", ar: "قطعة بسبوسة كبيرة" },
  "cereal": { en: "1 Box (50g)", ar: "علبة واحدة (٥٠ جم)" },
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
  "peanut-butter-tart": { en: "Price for full set of 6 pcs · Macros shown per piece", ar: "السعر للعبوة بالكامل (٦ قطع) · السعرات لكل قطعة واحدة" },
  "chocolate-muffin": { en: "Price for full set of 6 muffins · Macros shown per muffin", ar: "السعر للعبوة بالكامل (٦ قطع مافن) · السعرات لكل مافن واحدة" },
  "vanilla-muffin": { en: "Price for full set of 6 muffins · Macros shown per muffin", ar: "السعر للعبوة بالكامل (٦ قطع مافن) · السعرات لكل مافن واحدة" },
  "chocolate-chip-cookies": { en: "Price for full set of 6 cookies · Macros shown per cookie", ar: "السعر للعبوة بالكامل (٦ قطع كوكيز) · السعرات لكل كوكيز واحدة" },
  "chocolate-cookies": { en: "Price for full set of 6 cookies · Macros shown per cookie", ar: "السعر للعبوة بالكامل (٦ قطع كوكيز) · السعرات لكل كوكيز واحدة" },
  "almond-cranberry-cookies": { en: "Price for full set of 6 cookies · Macros shown per cookie", ar: "السعر للعبوة بالكامل (٦ قطع كوكيز) · السعرات لكل كوكيز واحدة" },
  "cookies-fries": { en: "Price & macros for full box of 5 pcs", ar: "السعر والقيمة الغذائية للعلبة كاملة (٥ قطع)" },
  "coconut-truffles": { en: "Price for full box of 5 pcs · Macros shown per piece", ar: "السعر للعلبة بالكامل (٥ قطع) · السعرات لكل قطعة واحدة" },
  "chocolate-truffles": { en: "Price for full box of 5 pcs · Macros shown per piece", ar: "السعر للعلبة بالكامل (٥ قطع) · السعرات لكل قطعة واحدة" },
  "kahk": { en: "Price for full set of 16 pcs · Macros shown per piece", ar: "السعر للعبوة بالكامل (١٦ قطعة) · السعرات لكل قطعة واحدة" },
  "protein-kahk": { en: "Price for full set of 16 pcs · Macros shown per piece", ar: "السعر للعبوة بالكامل (١٦ قطعة) · السعرات لكل قطعة واحدة" },
  "basbosa-set-of-6-pieces": { en: "Price for full set of 6 pcs · Macros shown per piece", ar: "السعر للعبوة بالكامل (٦ قطع) · السعرات لكل قطعة واحدة" },
  "basbosa-2-pieces": { en: "Price for full pack of 2 pcs · Macros shown per piece", ar: "السعر للعبوة بالكامل (قطعتين) · السعرات لكل قطعة واحدة" },
  "plain-cookies": { en: "Price for full pack of 2 pcs · Macros shown per cookie", ar: "السعر للعبوة بالكامل (قطعتين) · السعرات لكل كوكيز واحدة" },
  "brownies": { en: "Price & macros per 1 large piece (85g)", ar: "السعر والقيمة الغذائية للقطعة الواحدة (٨٥ جم)" },
  "chocolate-cupcake": { en: "Price & macros per cupcake", ar: "السعر والقيمة الغذائية للكب كيك الواحدة" },
  "vanilla-cake-loaf": { en: "Price for full loaf (8 slices) · Macros shown per slice", ar: "السعر لقالب الكيك بالكامل (٨ شرائح) · السعرات للشريحة الواحدة" },
  "chocolate-cake-loaf": { en: "Price for full loaf (8 slices) · Macros shown per slice", ar: "السعر لقالب الكيك بالكامل (٨ شرائح) · السعرات للشريحة الواحدة" },
  "birthday-almond-cake": { en: "Price for full 20cm cake (12 slices) · Macros shown per slice", ar: "السعر للكيكة بالكامل (١٢ قطعة، قطر ٢٠ سم) · السعرات للقطعة الواحدة" },
  "birthday-chocolate-cake": { en: "Price for full 20cm cake (12 slices) · Macros shown per slice", ar: "السعر للكيكة بالكامل (١٢ قطعة، قطر ٢٠ سم) · السعرات للقطعة الواحدة" },
};

const FALLBACK_NUTRITION: Record<
  string,
  { protein?: string; fat?: string; carbs?: string; cal?: string }
> = {
  "cottage-cheese-with-tomato-basil-walnut": { protein: "28g", carbs: "6g", fat: "14g", cal: "260 kcal" },
  "cottage-cheese-tomato-basil": { protein: "28g", carbs: "6g", fat: "14g", cal: "260 kcal" },
  "cottage-cheese-with-black-olive-zaatar": { protein: "28g", carbs: "5g", fat: "15g", cal: "265 kcal" },
  "cottage-cheese-black-olive": { protein: "28g", carbs: "5g", fat: "15g", cal: "265 kcal" },
  "cottage-cheese-with-green-olive-dill": { protein: "28g", carbs: "5g", fat: "14g", cal: "255 kcal" },
  "cottage-cheese-green-olive": { protein: "28g", carbs: "5g", fat: "14g", cal: "255 kcal" },
  "cottage-cheese-with-red-pepper-parsley": { protein: "28g", carbs: "6g", fat: "14g", cal: "260 kcal" },
  "cottage-cheese-red-pepper": { protein: "28g", carbs: "6g", fat: "14g", cal: "260 kcal" },
  "keto-taco-salad": { protein: "25g", carbs: "8g", fat: "22g", cal: "330 kcal" },
  "creamy-tahini-with-sumac": { protein: "4g", carbs: "6g", fat: "16g", cal: "180 kcal" },
  "creamy-beetroot-hummus-with-tahini": { protein: "5g", carbs: "14g", fat: "10g", cal: "165 kcal" },
  "creamy-beetroot-hummus-tahini": { protein: "5g", carbs: "14g", fat: "10g", cal: "165 kcal" },
  "grilled-chicken-caesar-salad": { protein: "35g", carbs: "4g", fat: "18g", cal: "320 kcal" },
  "mixed-cabbage-salad-with-beetroot-carrot": { protein: "3g", carbs: "10g", fat: "5g", cal: "95 kcal" },
  "mixed-cabbage-salad-beetroot-carrot": { protein: "3g", carbs: "10g", fat: "5g", cal: "95 kcal" },
  "rocca-salad": { protein: "4g", carbs: "8g", fat: "12g", cal: "150 kcal" },
  "seasonal-sauteed-vegetables": { protein: "4g", carbs: "12g", fat: "6g", cal: "110 kcal" },
  "grilled-sweet-potato-whole": { protein: "3g", carbs: "32g", fat: "0.2g", cal: "135 kcal" },
  "grilled-sweet-potato-fingers": { protein: "3g", carbs: "32g", fat: "0.2g", cal: "135 kcal" },
  "boiled-sweet-potato": { protein: "2g", carbs: "28g", fat: "0.2g", cal: "130 kcal" },
  "steamed-egyptian-white-rice": { protein: "2.4g", carbs: "27g", fat: "0.2g", cal: "130 kcal" },
  "basmati-rice": { protein: "2.5g", carbs: "8g", fat: "0.3g", cal: "130 kcal" },
  "classic-grilled-chicken-fillet": { protein: "77g", carbs: "0g", fat: "31g", cal: "610 kcal" },
  "carnivore-pizza-chicken": { protein: "9.6g", carbs: "3g", fat: "1.6g", cal: "82 kcal" },
  "stuffed-eggplant-with-minced-meat": { protein: "30g", carbs: "18g", fat: "40g", cal: "620 kcal" },
  "stuffed-eggplant-minced-meat": { protein: "30g", carbs: "18g", fat: "40g", cal: "620 kcal" },
  "classic-grilled-meat-fillet": { protein: "54g", carbs: "0g", fat: "40g", cal: "620 kcal" },
  "chicken-calzone": { protein: "40g", carbs: "8g", fat: "30g", cal: "470 kcal" },
  "cheesy-baked-chicken-meatballs-with-caramelized-onion": { protein: "35g", carbs: "6g", fat: "25g", cal: "390 kcal" },
  "cheesy-baked-chicken-meatballs": { protein: "35g", carbs: "6g", fat: "25g", cal: "390 kcal" },
  "stuffed-bell-peppers-chicken": { protein: "28g", carbs: "10g", fat: "15g", cal: "285 kcal" },
  "stuffed-bell-peppers-beef": { protein: "30g", carbs: "10g", fat: "20g", cal: "340 kcal" },
  "stuffed-bell-peppers": { protein: "30g", carbs: "10g", fat: "20g", cal: "340 kcal" },
  "dawood-basha-kofta": { protein: "35g", carbs: "8g", fat: "25g", cal: "400 kcal" },
  "keto-swedish-meatballs": { protein: "30g", carbs: "5g", fat: "28g", cal: "395 kcal" },
  "keto-swedish-meatball": { protein: "30g", carbs: "5g", fat: "28g", cal: "395 kcal" },
  "beef-shawarma": { protein: "35g", carbs: "4g", fat: "22g", cal: "355 kcal" },
  "doner-kebab": { protein: "32g", carbs: "3g", fat: "25g", cal: "365 kcal" },
  "doner-kabab": { protein: "32g", carbs: "3g", fat: "25g", cal: "365 kcal" },
  "keto-beef-teriyaki": { protein: "30g", carbs: "6g", fat: "20g", cal: "325 kcal" },
  "keto-beef-stroganoff": { protein: "28g", carbs: "5g", fat: "25g", cal: "360 kcal" },
  "classic-beef-stroganoff": { protein: "28g", carbs: "5g", fat: "25g", cal: "360 kcal" },
  "keto-chicken-teriyaki": { protein: "35g", carbs: "6g", fat: "12g", cal: "270 kcal" },
  "chicken-kofta-with-caramelized-onions": { protein: "30g", carbs: "5g", fat: "15g", cal: "275 kcal" },
  "chicken-mushroom-stroganoff": { protein: "32g", carbs: "5g", fat: "18g", cal: "310 kcal" },
  "butter-chicken": { protein: "30g", carbs: "8g", fat: "22g", cal: "350 kcal" },
  "chicken-shawarma": { protein: "35g", carbs: "4g", fat: "14g", cal: "285 kcal" },
  "chicken-shish-tawook": { protein: "35g", carbs: "4g", fat: "10g", cal: "250 kcal" },
  "chicken-fajita": { protein: "30g", carbs: "8g", fat: "12g", cal: "260 kcal" },
  "keto-chicken-sweet-and-sour": { protein: "28g", carbs: "7g", fat: "10g", cal: "230 kcal" },
  "peanut-butter-tart": { protein: "12g", carbs: "10g", fat: "28g", cal: "340 kcal" },
  "lazy-cake": { protein: "8g", carbs: "8g", fat: "22g", cal: "260 kcal" },
  "keto-kahk": { protein: "6g", carbs: "6g", fat: "20g", cal: "228 kcal" },
  "protein-kahk": { protein: "6g", carbs: "6g", fat: "20g", cal: "228 kcal" },
  "basbosa": { protein: "7g", carbs: "9g", fat: "18g", cal: "222 kcal" },
  "cereal": { protein: "10g", carbs: "12g", fat: "24g", cal: "300 kcal" },
  "brownies": { protein: "8g", carbs: "8g", fat: "20g", cal: "240 kcal" },
  "coconut-truffles": { protein: "3g", carbs: "5g", fat: "16g", cal: "175 kcal" },
  "chocolate-truffles": { protein: "4g", carbs: "6g", fat: "18g", cal: "200 kcal" },
  "birthday-chocolate-cake": { protein: "10g", carbs: "10g", fat: "25g", cal: "300 kcal" },
  "protein-birthday-cake-chocolate": { protein: "10g", carbs: "10g", fat: "25g", cal: "300 kcal" },
  "birthday-almond-vanilla-cake": { protein: "10g", carbs: "8g", fat: "22g", cal: "265 kcal" },
  "protein-birthday-cake-almond-vanilla": { protein: "10g", carbs: "8g", fat: "22g", cal: "265 kcal" },
  "chocolate-cake-loaf": { protein: "9g", carbs: "8g", fat: "22g", cal: "260 kcal" },
  "vanilla-cake-loaf": { protein: "9g", carbs: "7g", fat: "20g", cal: "240 kcal" },
  "vanilla-muffin": { protein: "6g", carbs: "5g", fat: "14g", cal: "170 kcal" },
  "vanilla-cupcake": { protein: "6g", carbs: "5g", fat: "14g", cal: "170 kcal" },
  "protein-vanilla-cupcake": { protein: "6g", carbs: "5g", fat: "14g", cal: "170 kcal" },
  "chocolate-cupcake": { protein: "6g", carbs: "5g", fat: "15g", cal: "180 kcal" },
  "chocolate-muffin": { protein: "7g", carbs: "6g", fat: "15g", cal: "185 kcal" },
  "cookies-fries": { protein: "5g", carbs: "5g", fat: "16g", cal: "182 kcal" },
  "almond-cranberry-cookies": { protein: "5g", carbs: "7g", fat: "16g", cal: "190 kcal" },
  "chocolate-chip-cookies": { protein: "5g", carbs: "6g", fat: "17g", cal: "195 kcal" },
  "protein-chocolate-chip-cookies": { protein: "5g", carbs: "6g", fat: "17g", cal: "195 kcal" },
  "chocolate-cookies": { protein: "5g", carbs: "5g", fat: "16g", cal: "182 kcal" },
  "protein-chocolate-cookies": { protein: "5g", carbs: "5g", fat: "16g", cal: "182 kcal" },
  "plain-cookies": { protein: "5g", carbs: "5g", fat: "16g", cal: "180 kcal" },
  "protein-jar-blueberry": { protein: "15g", carbs: "8g", fat: "2.4g", cal: "133 kcal" },
  "protein-jar-strawberry": { protein: "13g", carbs: "10g", fat: "4g", cal: "150 kcal" },
  "protein-jar-pistachio": { protein: "19g", carbs: "15g", fat: "24g", cal: "350 kcal" },
  "protein-jar-chocolate": { protein: "22g", carbs: "37g", fat: "30g", cal: "500 kcal" },
};

function getCleanIngredients(
  handle: string,
  rawIng: string,
  title: string,
  locale: Locale,
): string {
  if (INGREDIENTS_OVERRIDE[handle]?.[locale]) {
    return normalizeIngredientsText(INGREDIENTS_OVERRIDE[handle][locale], locale);
  }

  let cleaned = normalizeIngredientsText(rawIng, locale);

  // If ingredients string equals the title, or is too short / bogus
  if (!cleaned || cleaned.toLowerCase() === title.toLowerCase() || cleaned.length < 3) {
    if (handle.includes("chicken")) {
      cleaned = locale === "ar"
        ? "صدور دجاج صافي، زيت زيتون بكر ممتاز، أعشاب وتوابل طبيعية"
        : "Clean Chicken Breast/Thigh, Extra Virgin Olive Oil, Natural Herbs & Spices";
    } else if (handle.includes("meat") || handle.includes("steak") || handle.includes("fillet") || handle.includes("kofta")) {
      cleaned = locale === "ar"
        ? "لحم بقر بلدي ممتاز، زيت زيتون بكر ممتاز، ملح هيمالايا وأعشاب"
        : "Premium Beef Cut, Extra Virgin Olive Oil, Himalayan Salt & Natural Seasoning";
    } else if (
      handle.includes("cookie") ||
      handle.includes("brownie") ||
      handle.includes("cake") ||
      handle.includes("truffle") ||
      handle.includes("basbosa") ||
      handle.includes("muffin") ||
      handle.includes("cereal") ||
      handle.includes("lazy-cake")
    ) {
      cleaned = locale === "ar"
        ? "دقيق اللوز، سكر ستيفيا، زبدة طبيعية، كاكاو خام، بيض طازج"
        : "Almond Flour, Stevia Sweetener, Pure Grass-Fed Butter, Raw Cocoa, Fresh Eggs";
    } else if (handle.includes("salad") || handle.includes("veggie") || handle.includes("vegetables")) {
      cleaned = locale === "ar"
        ? "خضروات طازجة متنوعة، زيت زيتون بكر ممتاز، دريسنج طبيعي"
        : "Mixed Fresh Garden Greens, Extra Virgin Olive Oil, Natural House Dressing";
    } else {
      cleaned = locale === "ar"
        ? "مكونات طبيعية طازجة ١٠٠٪ بدون سكر مضاف أو مواد حافظة"
        : "100% Clean Natural Ingredients, No Added Sugar, No Artificial Preservatives";
    }
  }

  return normalizeIngredientsText(cleaned, locale);
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
              { namespace: "custom", key: "calories" },
              { namespace: "custom", key: "cal" },
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

function translateMenuTextToArabic(text: string): string {
  if (text.trim().length === 0) return "";

  const replacements: Array<[RegExp, string]> = [
    [/\bingredients?\s*:/gi, "المكونات:"],
    [/\bcottage cheese\b/gi, "جبنة قريش"],
    [/\bchocolate chip cookies\b/gi, "كوكيز بقطع الشوكولاتة"],
    [/\bchocolate cookies\b/gi, "كوكيز شوكولاتة"],
    [/\bpeanut butter tart\b/gi, "تارت زبدة الفول السوداني"],
    [/\bprotein jar\b/gi, "بروتين جار"],
    [/\bblueberry\b/gi, "بلوبيري"],
    [/\bstrawberry\b/gi, "فراولة"],
    [/\bpistachio\b/gi, "فستق"],
    [/\bvanilla\b/gi, "فانيليا"],
    [/\bpeanut butter\b/gi, "زبدة فول سوداني"],
    [/\bpeanut\b/gi, "فول سوداني"],
    [/\bery?thritol\b/gi, "إريثريتول"],
    [/\bper one\b/gi, "للقطعة الواحدة"],
    [/\bper piece\b/gi, "للقطعة"],
    [/\bpieces\b/gi, "قطع"],
    [/\bpiece\b/gi, "قطعة"],
    [/\bcal\b/gi, "سعرات"],
    [/\bcarb\b/gi, "كارب"],
    [/\bcarbs\b/gi, "كارب"],
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
    [/\bcake\b/gi, "كيك"],
    [/&(?:amp;?|#38;?)/gi, "و"],
    [/\\u0026(?:amp;?)?/gi, "و"],
    [/\bamp\b/gi, "و"],
    [/&/g, "و"],
    [/\bground beef\b/gi, "لحم بقر مفروم"],
    [/\bground chicken\b/gi, "دجاج مفروم"],
    [/\bminced meat\b/gi, "لحم مفروم"],
    [/\bground\b/gi, "مفروم"],
    [/\bminced\b/gi, "مفروم"],
    [/\bmeat fillet\b/gi, "فيليه لحم"],
    [/\bfillet\b/gi, "فيليه"],
    [/\blean beef\b/gi, "لحم بقر قليل الدسم"],
    [/\blean\b/gi, "قليل الدسم"],
    [/\bmeat\b/gi, "لحم"],
    [/\bhimalayan salt\b/gi, "ملح هيمالايا"],
    [/\bsalt\b/gi, "ملح"],
    [/\btomato paste\b/gi, "معجون طماطم"],
    [/\bpaste\b/gi, "معجون"],
    [/\bcolored bell peppers?\b/gi, "فلفل ألوان"],
    [/\bbell peppers?\b/gi, "فلفل رومي"],
    [/\bred peppers?\b/gi, "فلفل أحمر"],
    [/\byellow peppers?\b/gi, "فلفل أصفر"],
    [/\bgreen peppers?\b/gi, "فلفل أخضر"],
    [/\bcolored\b/gi, "ألوان"],
    [/\bbell\b/gi, "رومي"],
    [/\bpepper\b/gi, "فلفل"],
    [/\bred\b/gi, "أحمر"],
    [/\byellow\b/gi, "أصفر"],
    [/\bgreen\b/gi, "أخضر"],
    [/\bwhite\b/gi, "أبيض"],
    [/\bgarlic powder\b/gi, "بودرة ثوم"],
    [/\bonion powder\b/gi, "بودرة بصل"],
    [/\bpowder\b/gi, "بودرة"],
    [/\bapple cider vinegar\b/gi, "خل تفاح"],
    [/\bvinegar\b/gi, "خل"],
    [/\bmozzarella cheese\b/gi, "جبنة موزاريلا"],
    [/\bmozzarella\b/gi, "موزاريلا"],
    [/\bmozzrella\b/gi, "موزاريلا"],
    [/\bcheddar cheese\b/gi, "جبنة شيدر"],
    [/\bcheddar\b/gi, "شيدر"],
    [/\bsmoked paprika\b/gi, "بابريكا مدخنة"],
    [/\bpaprika\b/gi, "بابريكا"],
    [/\bgreek yogurt\b/gi, "زبادي يوناني"],
    [/\byogurt\b/gi, "زبادي"],
    [/\bsesame seeds\b/gi, "سمسم"],
    [/\bsesame\b/gi, "سمسم"],
    [/\bseeds\b/gi, "بذور"],
    [/\bmushrooms?\b/gi, "مشروم"],
    [/\bcumin\b/gi, "كمون"],
    [/\bturmeric\b/gi, "كركم"],
    [/\bcurcum\b/gi, "كركم"],
    [/\bcashew nuts?\b/gi, "كاجو"],
    [/\bcashews?\b/gi, "كاجو"],
    [/\bpomegranate molasses\b/gi, "دبس رمان"],
    [/\bpomegranate\b/gi, "رمان"],
    [/\bmolasses\b/gi, "دبس"],
    [/\bbalsamic vinegar\b/gi, "خل بلسمك"],
    [/\bbalsamic\b/gi, "بلسمك"],
    [/\bzucchini\b/gi, "كوسة"],
    [/\bcaramelized onions?\b/gi, "بصل مكرمل"],
    [/\bcaramelized\b/gi, "مكرمل"],
    [/\bbroccoli\b/gi, "بروكلي"],
    [/\bcauliflower\b/gi, "قرنبيط"],
    [/\bgreen beans\b/gi, "فاصوليا خضراء"],
    [/\bbeans\b/gi, "فاصوليا"],
    [/\bpeas\b/gi, "بسلة"],
    [/\bgaram masala\b/gi, "جرام ماسالا"],
    [/\bpeppermint\b/gi, "نعناع"],
    [/\bunsweetened\b/gi, "بدون سكر"],
    [/\bshredded\b/gi, "مبشور"],
    [/\bmayo\b/gi, "مايونيز"],
    [/\btaco seasoning\b/gi, "بهارات تاكو"],
    [/\bseasoning\b/gi, "توابل"],
    [/\bcranberry\b/gi, "توت بري"],
    [/\balmond\b/gi, "لوز"],
    [/\bfries\b/gi, "أصابع"],
    [/\bcookies fries\b/gi, "بطاطس كوكيز"],
    [/\band\b/gi, "و"],
    [/\bwith\b/gi, "مع"],
    [/\bof\b/gi, "من"],
    [/\bin\b/gi, "في"],
    [/\bchicken\b/gi, "دجاج"],
    [/\bbeef\b/gi, "لحم بقر"],
    [/\bonions?\b/gi, "بصل"],
    [/\bcheese\b/gi, "جبنة"],
    [/\bspices?\b/gi, "توابل"],
    [/\bsoy sauce\b/gi, "صويا صوص"],
    [/\bsoy\b/gi, "صويا"],
    [/\bsauce\b/gi, "صوص"],
    [/\bsesame oil\b/gi, "زيت سمسم"],
    [/\brice vinegar\b/gi, "خل أرز"],
    [/\brice\b/gi, "أرز"],
    [/\bginger\b/gi, "زنجبيل"],
    [/\btomatoes?\b/gi, "طماطم"],
    [/\btomato\b/gi, "طماطم"],
    [/\bchickpeas\b/gi, "حمص"],
    [/\bhummus\b/gi, "حمص"],
    [/\btahini\b/gi, "طحينة"],
    [/\blemon juice\b/gi, "عصير ليمون"],
    [/\blemon\b/gi, "ليمون"],
    [/\bjuice\b/gi, "عصير"],
    [/\bsweet potato\b/gi, "بطاطا حلوة"],
    [/\beggplants?\b/gi, "باذنجان"],
    [/\bmeatballs?\b/gi, "كرات لحم"],
    [/\btomato sauce\b/gi, "صلصة طماطم"],
    [/\bshawarma\b/gi, "شاورما"],
    [/\bteriyaki\b/gi, "ترياكي"],
    [/\bstroganoff\b/gi, "ستروجانوف"],
    [/\bfajita\b/gi, "فاهيتا"],
    [/\bketo\b/gi, "كيتو"],
    [/\bcabbage\b/gi, "كرنب"],
    [/\bbeetroot\b/gi, "بنجر"],
    [/\bcarrots?\b/gi, "جزر"],
    [/\barugula\b/gi, "جرجير"],
    [/\blettuce\b/gi, "خس"],
    [/\bavocado\b/gi, "افوكادو"],
    [/\bolives?\b/gi, "زيتون"],
    [/\boil\b/gi, "زيت"],
    [/\bgarll?ic\b/gi, "ثوم"],
    [/\bmonk\s*fruits?\b/gi, "مونك فروت"],
    [/\bsugar[\s\-]free\b/gi, "بدون سكر"],
    [/\bsugar\b/gi, "سكر"],
    [/\bfree\b/gi, "خالي"],
    [/\braw\b/gi, "خام"],
    [/\bnatural\b/gi, "طبيعي"],
    [/\bcocoa?\b/gi, "كاكاو"],
    [/\bchocolates?\b/gi, "شوكولاتة"],
    [/\bper\b/gi, "لكل"],
    [/\bdivided into\b/gi, "مقسم إلى"],
    [/\bdiameter\b/gi, "قطر"],
    [/\brow\b/gi, "صف"],
    [/\bcm\b/gi, "سم"],
    [/\bsumac\b/gi, "سماق"],
    [/\btaco\b/gi, "تاكو"],
    [/\bgrilled\b/gi, "مشوي"],
    [/\bclassic\b/gi, "كلاسيك"],
    [/\bstuffed\b/gi, "محشي"],
    [/\bset\b/gi, "عبوة"],
    [/\bbox\b/gi, "علبة"],
    [/\bpack\b/gi, "عبوة"],
    [/\b(\d+)\s*(?:gm|g)\b/gi, "$1 جم"],
    [/\bsmall portion\b/gi, "حجم صغير"],
    [/\blarge portion\b/gi, "حجم كبير"],
    [/\bset of 6 muffins\b/gi, "عبوة ٦ قطع مافن"],
    [/\bset of 12 muffins\b/gi, "عبوة ١٢ قطعة مافن"],
    [/\bpack of 3 truffles\b/gi, "عبوة ٣ قطع ترافلز"],
    [/\bpack of 2 cookies\b/gi, "عبوة قطعتين كوكيز"],
    [/\b1 jar\s*\(([^)]+)\)/gi, "برطمان واحد"],
    [/\b1 salad bowl\b/gi, "طبق سلطة واحد"],
    [/\b1 serving\b/gi, "وجبة واحدة"],
    [/\b1 full meal portion\b/gi, "وجبة واحدة كاملة"],
  ];

  return replacements.reduce(
    (current, [pattern, replacement]) => current.replace(pattern, replacement),
    text,
  );
}

function isNutritionOnlyText(text: string): boolean {
  const compact = text
    .replace(/[\d.,]+/g, " ")
    .replace(/\b(?:calories?|cals?|cal|kcal|protein|pro|carbs?|carbohydrates?|fat|fats?|gm|g)\b/gi, " ")
    .replace(/\b(?:سعرات|حرارية|بروتين|كارب|دهون|جم)\b/g, " ")
    .replace(/[^\p{L}]+/gu, " ")
    .trim();

  return compact.length === 0;
}

function serializeProduct(node: ProductNode, locale: Locale): MenuProductSerialized {
  const descriptionRaw = stripHtml(node.description ?? "");
  const parsedArabic = parseArabicFromDescription(node.description ?? "");
  const fromDesc = parseNutritionFromDescription(descriptionRaw);
  const parsedDescriptionPlain = stripArabicBlockFromDescription(
    stripEmbeddedNutritionFromDescription(descriptionRaw)
  );

  const localCopy = locale === "ar" ? AR_PRODUCT_COPY[node.handle] : undefined;

  let displayTitle = node.title;
  if (locale === "ar") {
    if (parsedArabic.title) {
      displayTitle = parsedArabic.title;
    } else if (localCopy?.title) {
      displayTitle = localCopy.title;
    } else if (/[\u0600-\u06FF]/.test(node.title)) {
      displayTitle = node.title;
    } else {
      displayTitle = translateMenuTextToArabic(node.title);
    }
  }

  const images: { url: string; alt: string }[] = node.images.edges
    .map((e) => e.node)
    .filter((n) => n.url != null && n.url.length > 0)
    .map((n) => ({ url: n.url, alt: n.altText ?? displayTitle }));
  const image = images[0];
  const variantId = node.variants.edges[0]?.node.id ?? null;
  const { amount, currencyCode } = node.priceRange.minVariantPrice;
  const mf = metafieldMap(node.metafields ?? []);

  let descriptionPlain = "";
  if (locale === "ar") {
    if (parsedArabic.description) {
      descriptionPlain = parsedArabic.description;
    } else if (localCopy?.description) {
      descriptionPlain = localCopy.description;
    } else {
      const translated = translateMenuTextToArabic(parsedDescriptionPlain);
      descriptionPlain =
        isNutritionOnlyText(translated) || /[A-Za-z]{2,}/.test(translated)
          ? ""
          : localCopy != null && parsedDescriptionPlain === node.title
            ? displayTitle
            : translated;
    }
  } else {
    descriptionPlain = isNutritionOnlyText(parsedDescriptionPlain) ? "" : parsedDescriptionPlain;
  }

  const descCategory = parseCategoryFromDescription(node.description ?? "");
  const categoryInfo = normalizeCategory(descCategory, {
    title: node.title,
    handle: node.handle,
    productType: node.productType,
    tags: node.tags,
    description: node.description,
  });
  const filterKey = categoryInfo.id;
  const categoryLabel = locale === "ar" ? categoryInfo.labelAr : categoryInfo.labelEn.toUpperCase();

  const baseIng = (mf.ingredients && mf.ingredients.trim().length > 0)
    ? mf.ingredients
    : (parseIngredientsFromDescription(node.description ?? "") ?? parseIngredientsFromDescription(descriptionRaw) ?? "");

  let rawIng = getCleanIngredients(node.handle, baseIng, displayTitle, locale);
  if (locale === "ar" && parsedArabic.ingredients) {
    rawIng = normalizeIngredientsText(parsedArabic.ingredients, "ar");
  }

  let portionPlain = PORTION_OVERRIDE[node.handle]?.[locale];
  if (!portionPlain) {
    portionPlain = mf.portion || parsePortionFromDescription(descriptionRaw) || "";
    if (portionPlain && locale === "ar") {
      portionPlain = translateMenuTextToArabic(portionPlain);
    }
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

  const fb = FALLBACK_NUTRITION[node.handle];
  const rawVariants = parseSizeVariantsFromDescription(node.description ?? "");
  const sizeVariants: MenuProductVariantSerialized[] = rawVariants.map((v) => {
    let pLabel = formatMoney(amount, currencyCode);
    if (v.priceAmount != null) {
      pLabel = formatMoney(v.priceAmount.toString(), currencyCode);
    }
    const vTitle = locale === "ar" ? v.titleAr : v.titleEn;
    const vPro = formatMacroWithUnit(v.pro, locale);
    const vFat = formatMacroWithUnit(v.fat, locale);
    const vCarb = formatMacroWithUnit(v.carb, locale);
    const vCal = formatCalories(v.cal, locale);
    return {
      id: v.id,
      title: vTitle,
      priceLabel: pLabel,
      pro: vPro,
      fat: vFat,
      carb: vCarb,
      cal: vCal,
      portionPlain: vTitle,
    };
  });

  // Default price and macros (from first size variant if present, since small/default variant is 1st)
  const defaultVar = sizeVariants[0];
  const finalPriceLabel = defaultVar?.priceLabel ?? formatMoney(amount, currencyCode);

  const rawPro = defaultVar ? defaultVar.pro : (mf.protein ?? fromDesc.pro ?? fb?.protein);
  const rawFat = defaultVar ? defaultVar.fat : (mf.fat ?? fromDesc.fat ?? fb?.fat);
  const rawCarb = defaultVar ? defaultVar.carb : (mf.carbs ?? fromDesc.carb ?? fb?.carbs);
  let rawCal = defaultVar ? defaultVar.cal : (mf.calories ?? mf.cal ?? fromDesc.cal ?? fb?.cal);

  if (!rawCal && (rawPro || rawFat || rawCarb)) {
    const proG = parseGramsValue(rawPro);
    const fatG = parseGramsValue(rawFat);
    const carbG = parseGramsValue(rawCarb);
    if (proG != null || fatG != null || carbG != null) {
      const calVal = Math.round((proG ?? 0) * 4 + (carbG ?? 0) * 4 + (fatG ?? 0) * 9);
      if (calVal > 0) rawCal = `${calVal}`;
    }
  }

  const pro = formatMacroWithUnit(rawPro, locale);
  const fat = formatMacroWithUnit(rawFat, locale);
  const carb = formatMacroWithUnit(rawCarb, locale);
  const cal = formatCalories(rawCal, locale);
  const unifiedMacros = formatUnifiedMacros(rawPro, rawCarb, rawFat, locale);
  const calNum = formatNutritionNumber(rawCal);
  const caloriesNumber = calNum ? parseFloat(calNum) : null;

  return {
    id: node.id,
    title: displayTitle,
    handle: node.handle,
    descriptionPlain,
    ingredientsPlain: cleanUnicodeAndStraySymbols(
      locale === "ar"
        ? (parsedArabic.ingredients
            ? normalizeIngredientsText(parsedArabic.ingredients, "ar")
            : translateMenuTextToArabic(stripHtml(rawIng)))
        : stripHtml(rawIng)
    ),
    portionPlain,
    servingNote,
    priceLabel: finalPriceLabel,
    variantId,
    images,
    imageUrl: image?.url ?? null,
    imageAlt: image?.alt ?? displayTitle,
    categoryLabel,
    filterKey,
    pro,
    fat,
    carb,
    cal,
    unifiedMacros,
    caloriesNumber,
    sizeVariants,
  };
}

export default async function MenuPage() {
  const locale = await getRequestLocale();
  const t = getDictionary(locale);
  const orderNowHref = "/menu";

  const { nodes, errors: graphErrors } = await fetchAllMenuProductNodes(locale);
  const products = nodes.map((node) => serializeProduct(node, locale));

  // Dynamically extract unique categories present in the products data
  const categoryMap = new Map<string, { id: string; label: string; count: number; order: number }>();
  for (const p of products) {
    const catId = p.filterKey;
    if (!categoryMap.has(catId)) {
      const info = CANONICAL_CATEGORIES[catId] ?? {
        id: catId,
        labelEn: catId,
        labelAr: catId,
        order: 10,
      };
      categoryMap.set(catId, {
        id: catId,
        label: locale === "ar" ? info.labelAr : info.labelEn,
        count: 0,
        order: info.order,
      });
    }
    categoryMap.get(catId)!.count += 1;
  }

  const dynamicCategories: MenuCategoryChip[] = Array.from(categoryMap.values())
    .filter((c) => c.count > 0)
    .sort((a, b) => a.order - b.order)
    .map(({ id, label, count }) => ({ id, label, count }));

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
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-800 shadow-sm">
              <p className="font-semibold">{t.menu.loadError}</p>
              <p className="mt-2 text-xs text-red-700">
                {locale === "ar"
                  ? "يمكنك المحاولة مجددًا، أو التواصل معنا عبر واتساب للمساعدة."
                  : "Please refresh to try again, or contact us directly on WhatsApp."}
              </p>
            </div>
          ) : (
            <MenuGridClient
              products={products}
              categories={dynamicCategories}
              locale={locale}
            />
          )}
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
