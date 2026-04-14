/**
 * Flat delivery fee shown in the cart and aligned with Shopify Checkout.
 * Set `NEXT_PUBLIC_DELIVERY_FEE_EGP` (number). Change in env / Vercel without code changes.
 * You must also add a matching flat shipping rate in Shopify Admin (see docs/SHOPIFY_CHECKOUT.md).
 */

const DEFAULT_EGP = 50;

/** Flat delivery in EGP; from `NEXT_PUBLIC_DELIVERY_FEE_EGP` (default 50). */
export function getDeliveryFeeEgp(): number {
  return normalizeFee(process.env.NEXT_PUBLIC_DELIVERY_FEE_EGP);
}

function normalizeFee(raw: string | undefined): number {
  if (raw == null || raw.trim() === "") return DEFAULT_EGP;
  const n = Number.parseFloat(raw);
  if (!Number.isFinite(n) || n < 0) return DEFAULT_EGP;
  return n;
}
