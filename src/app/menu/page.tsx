import type { Metadata } from "next";
import { SiteFooter } from "@/components/balanced-bites/SiteFooter";
import { SiteHeader } from "@/components/balanced-bites/SiteHeader";
import { getDictionary, type Locale } from "@/lib/i18n";
import { getRequestLocale } from "@/lib/i18n-server";
import {
  parseNutritionFromDescription,
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

function inferFilterKey(
  title: string,
  productType: string,
  tags: string[],
): MenuFilterId | "other" {
  const lowerTags = tags.map((t) => t.toLowerCase());
  const blob = [title, productType, ...tags].join(" ").toLowerCase();

  // Shopify tags / productType take explicit priority (owner-set in admin)
  if (lowerTags.some((t) => /(^|[\s_-])frozen([\s_-]|$)/.test(t))) {
    return "frozen";
  }
  if (lowerTags.some((t) => /(^|[\s_-])salad([\s_-]|$)/.test(t))) {
    return "salads";
  }
  if (
    lowerTags.some((t) =>
      /(^|[\s_-])(keto[\s_-]?dessert|dessert|sweet)([\s_-]|$)/.test(t),
    )
  ) {
    return "keto_desserts";
  }
  if (
    lowerTags.some((t) =>
      /(^|[\s_-])(high[\s_-]?protein|protein|meal|main)([\s_-]|$)/.test(t),
    )
  ) {
    return "high_protein";
  }
  if (
    lowerTags.some((t) =>
      /(^|[\s_-])(clean[\s_-]?carb|carb|side)([\s_-]|$)/.test(t),
    )
  ) {
    return "clean_carb";
  }
  if (
    lowerTags.some((t) =>
      /(^|[\s_-])(veg|veggie|vegetable)([\s_-]|$)/.test(t),
    )
  ) {
    return "veggie_sides";
  }

  // Fallback keyword inference on title + description
  if (/\bfrozen\b/.test(blob)) return "frozen";
  if (
    /\b(salad|rocca|caesar|tahini|hummus|taco\s*salad|cabbage)\b/.test(blob)
  ) {
    return "salads";
  }
  if (
    /\b(dessert|sweet|brownie|cake|cookie|tart|jar|kahk|basbosa|truffle|cereal|cupcake|lazy\s*cake)\b/.test(
      blob,
    )
  ) {
    return "keto_desserts";
  }
  if (/\b(rice|basmati|sweet\s*potato|baked\s*potato)\b/.test(blob)) {
    return "clean_carb";
  }
  if (/\b(saut[eé]ed|seasonal\s*veg|vegetable|veggies)\b/.test(blob)) {
    return "veggie_sides";
  }
  if (
    /\b(chicken|beef|shawarma|kofta|kebab|meatball|stroganoff|teriyaki|fajita|tawook|calzone|d[öo]ner|grilled|stuffed|sweet\s*and\s*sour|butter\s*chicken|swedish)\b/.test(
      blob,
    )
  ) {
    return "high_protein";
  }
  return "other";
}

function imageCategoryLabel(productType: string, tags: string[]): string {
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

function serializeProduct(node: ProductNode): MenuProductSerialized {
  const images: { url: string; alt: string }[] = node.images.edges
    .map((e) => e.node)
    .filter((n) => n.url != null && n.url.length > 0)
    .map((n) => ({ url: n.url, alt: n.altText ?? node.title }));
  const image = images[0];
  const variantId = node.variants.edges[0]?.node.id ?? null;
  const { amount, currencyCode } = node.priceRange.minVariantPrice;
  const mf = metafieldMap(node.metafields ?? []);
  const descriptionRaw = stripHtml(node.description ?? "");
  const fromDesc = parseNutritionFromDescription(descriptionRaw);
  const descriptionPlain = stripEmbeddedNutritionFromDescription(descriptionRaw);

  return {
    id: node.id,
    title: node.title,
    handle: node.handle,
    descriptionPlain,
    ingredientsPlain: stripHtml(mf.ingredients ?? ""),
    priceLabel: formatMoney(amount, currencyCode),
    variantId,
    images,
    imageUrl: image?.url ?? null,
    imageAlt: image?.alt ?? node.title,
    categoryLabel: imageCategoryLabel(node.productType ?? "", node.tags ?? []),
    filterKey: inferFilterKey(
      `${(node.handle ?? "").replace(/-/g, " ")} ${node.title ?? ""}`,
      node.productType ?? "",
      node.tags ?? [],
    ),
    pro: formatMacro(mf.protein ?? fromDesc.pro ?? undefined, "g"),
    fat: formatMacro(mf.fat ?? fromDesc.fat ?? undefined, "g"),
    carb: formatMacro(mf.carbs ?? fromDesc.carb ?? undefined, "g"),
  };
}

export default async function MenuPage() {
  const locale = await getRequestLocale();
  const t = getDictionary(locale);
  const orderNowHref = "/menu";

  const { nodes, errors: graphErrors } = await fetchAllMenuProductNodes(locale);
  const products = nodes.map((node) => serializeProduct(node));

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
