import type { CartPayload } from "@/lib/shopify-cart";

const CART_UPDATED_EVENT = "bb-cart-updated";

export function dispatchCartUpdated() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(CART_UPDATED_EVENT));
  }
}

export function subscribeCartUpdated(handler: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(CART_UPDATED_EVENT, handler);
  return () => window.removeEventListener(CART_UPDATED_EVENT, handler);
}

export async function fetchCartPayload(): Promise<CartPayload | null> {
  const res = await fetch("/api/cart", { method: "GET" });
  const data = (await res.json()) as { cart?: CartPayload | null };
  return data.cart ?? null;
}

export async function postCartMutation(
  body: object,
): Promise<{ ok: true; cart: CartPayload | null } | { ok: false; error: string }> {
  const res = await fetch("/api/cart", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await res.json()) as { cart?: CartPayload | null; error?: string };
  if (!res.ok) return { ok: false, error: data.error ?? "Request failed" };
  return { ok: true, cart: data.cart ?? null };
}
