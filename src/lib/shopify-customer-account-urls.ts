/**
 * Links to the Shopify Online Store customer pages (/account/register, /account/login).
 *
 * Set NEXT_PUBLIC_SHOPIFY_STORE_ORIGIN to your **customer-facing** domain (e.g. https://shop.example.com)
 * so registration matches what buyers use at checkout. If unset, SHOPIFY_STORE_DOMAIN is used
 * (often *.myshopify.com — Shopify may redirect to the primary domain).
 */
export function shopifyStorefrontOrigin(): string | null {
  const raw =
    process.env.NEXT_PUBLIC_SHOPIFY_STORE_ORIGIN?.trim() ||
    process.env.SHOPIFY_STORE_DOMAIN?.trim();
  if (raw == null || raw === "") return null;
  const host = raw
    .replace(/^https?:\/\//i, "")
    .split("/")[0]
    ?.replace(/\/$/, "");
  if (host == null || host === "") return null;
  return `https://${host}`;
}

export function shopifyAccountRegisterUrl(): string | null {
  const origin = shopifyStorefrontOrigin();
  return origin != null ? `${origin}/account/register` : null;
}

export function shopifyAccountLoginUrl(): string | null {
  const origin = shopifyStorefrontOrigin();
  return origin != null ? `${origin}/account/login` : null;
}
