import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  MAX_CART_LINES_PER_REQUEST,
  isValidShopifyCartGid,
  isValidShopifyCartLineGid,
  isValidShopifyProductVariantGid,
} from "@/lib/cart-input-validation";
import { createLogger, truncateGid } from "@/lib/logger";
import {
  BB_CART_COOKIE,
  bbCartCookieOptions,
  storefrontCartLinesAdd,
  storefrontCartLinesRemove,
  storefrontCartLinesUpdate,
  storefrontCreateCart,
  storefrontGetCart,
} from "@/lib/shopify-cart";

const log = createLogger("api.cart");

const NO_STORE_HEADERS = {
  "Cache-Control": "private, no-store, must-revalidate",
  Vary: "Cookie",
} as const;

function withCartCacheHeaders(res: NextResponse) {
  for (const [k, v] of Object.entries(NO_STORE_HEADERS)) {
    res.headers.set(k, v);
  }
  return res;
}

export async function GET() {
  const jar = await cookies();
  const cartId = jar.get(BB_CART_COOKIE)?.value;
  if (cartId == null || cartId.length === 0) {
    return withCartCacheHeaders(NextResponse.json({ cart: null }));
  }
  if (!isValidShopifyCartGid(cartId)) {
    log.warn("get_cart_cookie_invalid", { cartId: truncateGid(cartId) });
    const res = NextResponse.json({ cart: null });
    res.cookies.delete(BB_CART_COOKIE);
    return withCartCacheHeaders(res);
  }
  const cart = await storefrontGetCart(cartId);
  if (cart == null) {
    log.warn("get_cart_shopify_miss", { cartId: truncateGid(cartId) });
    const res = NextResponse.json({ cart: null });
    res.cookies.delete(BB_CART_COOKIE);
    return withCartCacheHeaders(res);
  }
  return withCartCacheHeaders(NextResponse.json({ cart }));
}

export async function POST(req: Request) {
  let body: {
    action?: string;
    merchandiseId?: string;
    quantity?: number;
    lines?: { id: string; quantity: number }[];
    lineIds?: string[];
  };
  try {
    body = await req.json();
  } catch {
    log.warn("post_body_invalid_json");
    return withCartCacheHeaders(
      NextResponse.json({ error: "Invalid JSON" }, { status: 400 }),
    );
  }

  const jar = await cookies();
  let cartId = jar.get(BB_CART_COOKIE)?.value ?? null;
  if (cartId != null && cartId !== "" && !isValidShopifyCartGid(cartId)) {
    cartId = null;
  }

  async function ensureCart(): Promise<string | null> {
    if (cartId != null && cartId.length > 0) {
      const existing = await storefrontGetCart(cartId);
      if (existing != null) return cartId;
    }
    const created = await storefrontCreateCart();
    if (created == null) return null;
    cartId = created.id;
    return cartId;
  }

  if (body.action === "add") {
    const merchandiseId = body.merchandiseId;
    const quantity = Math.min(
      99,
      Math.max(1, Math.floor(Number(body.quantity) || 1)),
    );
    if (merchandiseId == null || merchandiseId.length === 0) {
      return withCartCacheHeaders(
        NextResponse.json({ error: "merchandiseId required" }, { status: 400 }),
      );
    }
    if (!isValidShopifyProductVariantGid(merchandiseId)) {
      return withCartCacheHeaders(
        NextResponse.json({ error: "Invalid merchandiseId" }, { status: 400 }),
      );
    }
    const id = await ensureCart();
    if (id == null) {
      log.error("add_cart_create_failed");
      return withCartCacheHeaders(
        NextResponse.json({ error: "Could not create cart" }, { status: 502 }),
      );
    }
    const { cart, errors } = await storefrontCartLinesAdd(id, [
      { merchandiseId, quantity },
    ]);
    if (errors.length > 0 || cart == null) {
      log.warn("add_lines_shopify_error", {
        cartId: truncateGid(id),
        detail: errors[0] ?? "null_cart",
      });
      return withCartCacheHeaders(
        NextResponse.json(
          { error: errors[0] ?? "Add to cart failed" },
          { status: 400 },
        ),
      );
    }
    const res = NextResponse.json({ cart });
    res.cookies.set(BB_CART_COOKIE, cart.id, bbCartCookieOptions());
    return withCartCacheHeaders(res);
  }

  if (body.action === "update") {
    if (cartId == null || !isValidShopifyCartGid(cartId)) {
      return withCartCacheHeaders(
        NextResponse.json({ error: "No cart" }, { status: 400 }),
      );
    }
    const lines = body.lines;
    if (!Array.isArray(lines) || lines.length === 0) {
      return withCartCacheHeaders(
        NextResponse.json({ error: "lines required" }, { status: 400 }),
      );
    }
    if (lines.length > MAX_CART_LINES_PER_REQUEST) {
      return withCartCacheHeaders(
        NextResponse.json({ error: "Too many lines" }, { status: 400 }),
      );
    }
    const normalized = lines.map((line) => ({
      id: String(line.id),
      quantity: Math.min(99, Math.max(1, Math.floor(Number(line.quantity) || 1))),
    }));
    for (const line of normalized) {
      if (!isValidShopifyCartLineGid(line.id)) {
        return withCartCacheHeaders(
          NextResponse.json({ error: "Invalid line id" }, { status: 400 }),
        );
      }
    }
    const { cart, errors } = await storefrontCartLinesUpdate(cartId, normalized);
    if (errors.length > 0 || cart == null) {
      log.warn("update_lines_shopify_error", {
        cartId: truncateGid(cartId),
        detail: errors[0] ?? "null_cart",
      });
      return withCartCacheHeaders(
        NextResponse.json(
          { error: errors[0] ?? "Update failed" },
          { status: 400 },
        ),
      );
    }
    const res = NextResponse.json({ cart });
    res.cookies.set(BB_CART_COOKIE, cart.id, bbCartCookieOptions());
    return withCartCacheHeaders(res);
  }

  if (body.action === "remove") {
    if (cartId == null || !isValidShopifyCartGid(cartId)) {
      return withCartCacheHeaders(
        NextResponse.json({ error: "No cart" }, { status: 400 }),
      );
    }
    const lineIds = body.lineIds;
    if (!Array.isArray(lineIds) || lineIds.length === 0) {
      return withCartCacheHeaders(
        NextResponse.json({ error: "lineIds required" }, { status: 400 }),
      );
    }
    if (lineIds.length > MAX_CART_LINES_PER_REQUEST) {
      return withCartCacheHeaders(
        NextResponse.json({ error: "Too many lineIds" }, { status: 400 }),
      );
    }
    const ids = lineIds.map((id) => String(id));
    for (const id of ids) {
      if (!isValidShopifyCartLineGid(id)) {
        return withCartCacheHeaders(
          NextResponse.json({ error: "Invalid line id" }, { status: 400 }),
        );
      }
    }
    const { cart, errors } = await storefrontCartLinesRemove(cartId, ids);
    if (errors.length > 0) {
      log.warn("remove_lines_shopify_error", {
        cartId: truncateGid(cartId),
        detail: errors[0],
      });
      return withCartCacheHeaders(
        NextResponse.json({ error: errors[0] }, { status: 400 }),
      );
    }
    const res = NextResponse.json({ cart });
    if (cart == null || cart.totalQuantity === 0) {
      res.cookies.delete(BB_CART_COOKIE);
    } else {
      res.cookies.set(BB_CART_COOKIE, cart.id, bbCartCookieOptions());
    }
    return withCartCacheHeaders(res);
  }

  log.warn("post_unknown_action", { action: body.action });
  return withCartCacheHeaders(
    NextResponse.json({ error: "Unknown action" }, { status: 400 }),
  );
}
