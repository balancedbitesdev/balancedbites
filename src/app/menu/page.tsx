import type { Metadata } from "next";
import { SiteFooter } from "@/components/balanced-bites/SiteFooter";
import { SiteHeader } from "@/components/balanced-bites/SiteHeader";
import {
  parseNutritionFromDescription,
  stripEmbeddedNutritionFromDescription,
} from "@/lib/parse-product-nutrition";
import { shopifyFetch } from "@/lib/shopify";
import { MenuGridClient } from "./MenuGridClient";
import type { MenuFilterId, MenuProductSerialized } from "./menu-types";

export const metadata: Metadata = {
  title: "Menu | Balanced Bites",
  description: "Browse Balanced Bites health-food products.",
};

const PRODUCTS_QUERY = `
  query {
    products(first: 20) {
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
  productType: string,
  tags: string[],
): MenuFilterId | "other" {
  const blob = [productType, ...tags].join(" ").toLowerCase();
  if (
    /\b(meal plan|weekly plan|subscription plan|plan box|full[-\s]?week)\b/.test(
      blob,
    )
  ) {
    return "meal_plans";
  }
  if (
    /\b(dessert|sweet|brownie|cake|cookie|treat|honey\s*cake|pastry)\b/.test(
      blob,
    )
  ) {
    return "desserts";
  }
  if (
    /\b(meal|bowl|lunch|dinner|breakfast|plate|entree|main|snack|salad)\b/.test(
      blob,
    )
  ) {
    return "meals";
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
    filterKey: inferFilterKey(node.productType ?? "", node.tags ?? []),
    pro: formatMacro(mf.protein ?? fromDesc.pro ?? undefined, "g"),
    fat: formatMacro(mf.fat ?? fromDesc.fat ?? undefined, "g"),
    carb: formatMacro(mf.carbs ?? fromDesc.carb ?? undefined, "g"),
  };
}

export default async function MenuPage() {
  const orderNowHref = "/menu";

  const response = await shopifyFetch({ query: PRODUCTS_QUERY });

  const payload =
    response && "body" in response && response.body != null
      ? (response.body as {
          data?: { products?: { edges: { node: ProductNode }[] } };
          errors?: { message: string }[];
        })
      : null;

  const graphErrors = payload?.errors;
  const edges = payload?.data?.products?.edges ?? [];
  const products = edges.map((e) => serializeProduct(e.node));

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
            Our curated laboratory
          </p>
          <h1
            id="menu-heading"
            className="menu-serif mt-5 max-w-3xl text-4xl font-semibold tracking-tight text-[#426237] sm:text-5xl"
          >
            Our Menu
          </h1>
          <div className="mt-5 max-w-2xl space-y-4 text-pretty text-base leading-relaxed text-gray-600">
            <p>
              Every meal is nutritionist-approved, macro-balanced, and crafted
              from premium natural ingredients.
            </p>
            <p className="menu-script text-xl text-[#426237]/90 sm:text-2xl">
              Healthy food that actually tastes like a dream.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
          <div className="mb-8 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-950">
            <p className="font-semibold text-[#426237]">Delivery & pickup</p>
            <p className="mt-1">
              <strong>Delivery</strong> is only available for <strong>6th of October</strong> and{" "}
              <strong>Sheikh Zayed</strong>. Elsewhere, choose <strong>pickup</strong>: orders are
              ready <strong>Saturdays from 10:00 AM</strong> (confirm by WhatsApp after checkout).
            </p>
          </div>
          {graphErrors != null && graphErrors.length > 0 ? (
            <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              Could not load products. Please try again later.
            </p>
          ) : (
            <MenuGridClient products={products} />
          )}
        </section>


      </main>

      <SiteFooter />
    </div>
  );
}
