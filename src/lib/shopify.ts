import { createLogger } from "@/lib/logger";
import type { Locale } from "@/lib/i18n";

const log = createLogger("shopify.fetch");

const domain = process.env.SHOPIFY_STORE_DOMAIN;
const storefrontAccessToken = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN;

export async function shopifyFetch({
  query,
  variables = {},
  locale,
}: {
  query: string;
  variables?: Record<string, unknown>;
  /** Hint for localized catalog responses (used with `@inContext` on the query). */
  locale?: Locale;
}) {
  const endpoint = `https://${domain}/api/2024-01/graphql.json`;

  try {
    const result = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": storefrontAccessToken!,
        ...(locale === "ar"
          ? { "Accept-Language": "ar,en;q=0.8" }
          : { "Accept-Language": "en" }),
      },
      body: JSON.stringify({ query, variables }),
    });

    let body: unknown;
    try {
      body = await result.json();
    } catch {
      log.warn("storefront_non_json_body", { status: result.status });
      body = null;
    }

    if (!result.ok) {
      log.warn("storefront_http_error", {
        status: result.status,
        hasErrors: Array.isArray((body as { errors?: unknown } | null)?.errors),
      });
    }

    return {
      status: result.status,
      body,
    };
  } catch (error) {
    log.error("storefront_fetch_failed", {
      err: error instanceof Error ? error.message : String(error),
    });
    return {
      status: 500,
      error: "Error receiving data",
    };
  }
}
