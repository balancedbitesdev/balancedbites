import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  BB_CART_COOKIE,
  storefrontCartLinesAdd,
  storefrontCartLinesRemove,
  storefrontCartLinesUpdate,
  storefrontCreateCart,
  storefrontGetCart,
} from "@/lib/shopify-cart";

const COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

function cookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  };
}

export async function GET() {
  const jar = await cookies();
  const cartId = jar.get(BB_CART_COOKIE)?.value;
  if (cartId == null || cartId.length === 0) {
    return NextResponse.json({ cart: null });
  }
  const cart = await storefrontGetCart(cartId);
  if (cart == null) {
    const res = NextResponse.json({ cart: null });
    res.cookies.delete(BB_CART_COOKIE);
    return res;
  }
  return NextResponse.json({ cart });
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
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const jar = await cookies();
  let cartId = jar.get(BB_CART_COOKIE)?.value ?? null;

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
      return NextResponse.json({ error: "merchandiseId required" }, { status: 400 });
    }
    const id = await ensureCart();
    if (id == null) {
      return NextResponse.json({ error: "Could not create cart" }, { status: 502 });
    }
    const { cart, errors } = await storefrontCartLinesAdd(id, [
      { merchandiseId, quantity },
    ]);
    if (errors.length > 0 || cart == null) {
      return NextResponse.json(
        { error: errors[0] ?? "Add to cart failed" },
        { status: 400 },
      );
    }
    const res = NextResponse.json({ cart });
    res.cookies.set(BB_CART_COOKIE, cart.id, cookieOptions());
    return res;
  }

  if (body.action === "update") {
    if (cartId == null) {
      return NextResponse.json({ error: "No cart" }, { status: 400 });
    }
    const lines = body.lines;
    if (!Array.isArray(lines) || lines.length === 0) {
      return NextResponse.json({ error: "lines required" }, { status: 400 });
    }
    const { cart, errors } = await storefrontCartLinesUpdate(cartId, lines);
    if (errors.length > 0 || cart == null) {
      return NextResponse.json(
        { error: errors[0] ?? "Update failed" },
        { status: 400 },
      );
    }
    const res = NextResponse.json({ cart });
    res.cookies.set(BB_CART_COOKIE, cart.id, cookieOptions());
    return res;
  }

  if (body.action === "remove") {
    if (cartId == null) {
      return NextResponse.json({ error: "No cart" }, { status: 400 });
    }
    const lineIds = body.lineIds;
    if (!Array.isArray(lineIds) || lineIds.length === 0) {
      return NextResponse.json({ error: "lineIds required" }, { status: 400 });
    }
    const { cart, errors } = await storefrontCartLinesRemove(cartId, lineIds);
    if (errors.length > 0) {
      return NextResponse.json({ error: errors[0] }, { status: 400 });
    }
    const res = NextResponse.json({ cart });
    if (cart == null || cart.totalQuantity === 0) {
      res.cookies.delete(BB_CART_COOKIE);
    } else {
      res.cookies.set(BB_CART_COOKIE, cart.id, cookieOptions());
    }
    return res;
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
