import type { Metadata } from "next";
import { SiteFooter } from "@/components/balanced-bites/SiteFooter";
import { SiteHeader } from "@/components/balanced-bites/SiteHeader";
import { stripEmbeddedNutritionFromDescription } from "@/lib/parse-product-nutrition";
import { shopifyFetch } from "@/lib/shopify";
import { PlanWizard } from "./PlanWizard";
import type { PlanProductCard } from "./plan-types";

export const metadata: Metadata = {
  title: "My Plan | Balanced Bites",
  description:
    "Build a personalized nutrition plan tailored to your goals, activity, and diet preferences.",
};

const PLAN_PRODUCTS_QUERY = `
  query {
    products(first: 24) {
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
          images(first: 1) {
            edges {
              node {
                url
                altText
              }
            }
          }
        }
      }
    }
  }
`;

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
};

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function formatMoney(amount: string, currencyCode: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode,
  }).format(parseFloat(amount));
}

function serializePlanProduct(node: ProductNode): PlanProductCard {
  const image = node.images.edges[0]?.node;
  const { amount, currencyCode } = node.priceRange.minVariantPrice;
  return {
    id: node.id,
    title: node.title,
    handle: node.handle,
    descriptionPlain: stripEmbeddedNutritionFromDescription(
      stripHtml(node.description ?? ""),
    ),
    priceLabel: formatMoney(amount, currencyCode),
    imageUrl: image?.url ?? null,
    imageAlt: image?.altText ?? node.title,
    productType: node.productType ?? "",
    tags: node.tags ?? [],
  };
}

export default async function MyPlanPage() {
  const orderNowHref = "/menu";

  const response = await shopifyFetch({ query: PLAN_PRODUCTS_QUERY });

  const payload =
    response && "body" in response && response.body != null
      ? (response.body as {
          data?: { products?: { edges: { node: ProductNode }[] } };
          errors?: { message: string }[];
        })
      : null;

  const edges = payload?.data?.products?.edges ?? [];
  const products = edges.map((e) => serializePlanProduct(e.node));

  return (
    <div className="min-h-full bg-gradient-to-b from-[#f4f1eb] via-[#f4f1eb] to-[#e8e4dc] font-sans text-[#426237]">
      <SiteHeader active="my-plan" orderNowHref={orderNowHref} />

      <main>
        <section
          className="mx-auto max-w-3xl px-4 pb-2 pt-10 text-center sm:px-6 sm:pt-14"
          aria-labelledby="plan-intro"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#426237]/70">
            Personalized nutrition plan
          </p>
          <h1
            id="plan-intro"
            className="menu-serif mt-3 text-3xl font-semibold tracking-tight sm:text-4xl"
          >
            Get Your Plan
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-pretty text-sm leading-relaxed text-gray-600">
            Answer a few questions. We will estimate your energy needs, set macro targets, and
            suggest menu items that fit your style.
          </p>
        </section>

        <PlanWizard products={products} />
      </main>

      <SiteFooter variant="green" />
    </div>
  );
}
