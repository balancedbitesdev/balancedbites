/** Validates Shopify Storefront API GIDs from the browser before hitting Shopify. */

const MAX_GID_LEN = 280;

export function isValidShopifyCartGid(id: string): boolean {
  if (id.length < 24 || id.length > MAX_GID_LEN) return false;
  if (!id.startsWith("gid://shopify/Cart/")) return false;
  // Opaque cart tokens vary; block whitespace and HTML/script injection chars only.
  if (/[\s<>'"\\]/.test(id)) return false;
  return true;
}

export function isValidShopifyProductVariantGid(id: string): boolean {
  if (id.length > MAX_GID_LEN) return false;
  return /^gid:\/\/shopify\/ProductVariant\/\d+$/.test(id);
}

export function isValidShopifyCartLineGid(id: string): boolean {
  if (id.length > MAX_GID_LEN) return false;
  return /^gid:\/\/shopify\/CartLine\/\d+$/.test(id);
}

export const MAX_CART_LINES_PER_REQUEST = 40;
