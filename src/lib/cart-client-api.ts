import type { CartPayload } from "@/lib/shopify-cart";

const CART_UPDATED_EVENT = "bb-cart-updated";

export type CartUpdatedDetail = {
  /** Present when the cart change was triggered by adding a line item */
  added?: { title: string };
};

export function dispatchCartUpdated(detail: CartUpdatedDetail = {}) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent<CartUpdatedDetail>(CART_UPDATED_EVENT, { detail }),
    );
  }
}

export function subscribeCartUpdated(handler: (detail: CartUpdatedDetail) => void) {
  if (typeof window === "undefined") return () => {};
  const listener = (e: Event) => {
    const ce = e as CustomEvent<CartUpdatedDetail>;
    handler(ce.detail ?? {});
  };
  window.addEventListener(CART_UPDATED_EVENT, listener);
  return () => window.removeEventListener(CART_UPDATED_EVENT, listener);
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
