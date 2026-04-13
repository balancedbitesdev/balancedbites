"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  dispatchCartUpdated,
  fetchCartPayload,
  postCartMutation,
  subscribeCartUpdated,
} from "@/lib/cart-client-api";
import type { CartPayload } from "@/lib/shopify-cart";

type CartDrawerContextValue = {
  open: boolean;
  setOpen: (next: boolean) => void;
  toggle: () => void;
};

const CartDrawerContext = createContext<CartDrawerContextValue | null>(null);

export function useCartDrawer() {
  const ctx = useContext(CartDrawerContext);
  if (ctx == null) {
    throw new Error("useCartDrawer must be used within CartDrawerProvider");
  }
  return ctx;
}

export function CartDrawerProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const toggle = useCallback(() => setOpen((o) => !o), []);

  useEffect(() => {
    if (!open) return;
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const value = useMemo(
    () => ({ open, setOpen, toggle }),
    [open, toggle],
  );

  return (
    <CartDrawerContext.Provider value={value}>{children}</CartDrawerContext.Provider>
  );
}

function formatMoney(amount: string, currencyCode: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode,
  }).format(parseFloat(amount));
}

export function CartDrawer() {
  const { open, setOpen } = useCartDrawer();
  const router = useRouter();
  const [cart, setCart] = useState<CartPayload | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setCart(await fetchCartPayload());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    void load();
  }, [open, load]);

  useEffect(() => {
    return subscribeCartUpdated(() => {
      if (open) void load();
    });
  }, [open, load]);

  const lines = useMemo(
    () => cart?.lines.edges.map((e) => e.node) ?? [],
    [cart],
  );

  const total = cart?.cost?.totalAmount;

  async function post(body: object) {
    const result = await postCartMutation(body);
    if (!result.ok) throw new Error(result.error);
    setCart(result.cart);
    dispatchCartUpdated();
    router.refresh();
  }

  async function setQty(lineId: string, quantity: number) {
    if (!cart?.id) return;
    const q = Math.min(99, Math.max(1, quantity));
    setBusy(lineId);
    try {
      await post({
        action: "update",
        lines: [{ id: lineId, quantity: q }],
      });
    } catch (e) {
      console.error(e);
      alert(e instanceof Error ? e.message : "Could not update");
    } finally {
      setBusy(null);
    }
  }

  async function removeLine(lineId: string) {
    if (!cart?.id) return;
    setBusy(lineId);
    try {
      await post({ action: "remove", lineIds: [lineId] });
    } catch (e) {
      console.error(e);
      alert(e instanceof Error ? e.message : "Could not remove");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div
      className={`fixed inset-0 z-[100] transition-[visibility] duration-300 ${
        open ? "visible" : "pointer-events-none invisible delay-300"
      }`}
      aria-hidden={!open}
    >
      <button
        type="button"
        className={`absolute inset-0 bg-[#1a1a1a]/40 backdrop-blur-[2px] transition-opacity duration-300 ease-out ${
          open ? "opacity-100" : "opacity-0"
        }`}
        onClick={() => setOpen(false)}
        aria-label="Close cart"
        tabIndex={open ? 0 : -1}
      />

      <aside
        id="bb-cart-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
        className={`absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-[#f4f1eb] shadow-2xl ring-1 ring-[#426237]/15 transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-[#426237]/10 px-5 py-4">
          <h2 className="menu-serif text-lg font-semibold text-[#426237]">Your cart</h2>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="flex min-h-10 min-w-10 items-center justify-center rounded-full text-[#426237] ring-1 ring-[#426237]/15 transition-colors hover:bg-white"
            aria-label="Close cart"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {loading ? (
            <p className="text-center text-sm text-gray-600">Loading cart…</p>
          ) : cart == null || lines.length === 0 ? (
            <div className="rounded-2xl bg-white/90 px-5 py-10 text-center ring-1 ring-[#426237]/10">
              <p className="font-semibold text-[#426237]">Your cart is empty</p>
              <p className="mt-2 text-sm text-gray-600">
                Add meals from the menu—close this panel anytime to keep browsing.
              </p>
              <Link
                href="/menu"
                onClick={() => setOpen(false)}
                className="mt-6 inline-flex min-h-11 items-center justify-center rounded-full bg-[#426237] px-8 py-3 text-sm font-semibold text-white hover:bg-[#2c4224]"
              >
                Browse menu
              </Link>
            </div>
          ) : (
            <ul className="space-y-3">
              {lines.map((line) => {
                const m = line.merchandise;
                const title = m?.product?.title ?? m?.title ?? "Item";
                const img = m?.image?.url;
                const lineTotal = line.cost?.totalAmount;
                const cur = lineTotal?.currencyCode ?? m?.price?.currencyCode ?? "USD";
                const isBusy = busy === line.id;

                return (
                  <li
                    key={line.id}
                    className="flex gap-3 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-[#426237]/10"
                  >
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-[#f4f1eb]">
                      {img ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={img} alt={m?.image?.altText ?? title} className="h-full w-full object-cover" />
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-[#426237]">{title}</p>
                      {m?.title != null && m.title !== "Default Title" ? (
                        <p className="text-xs text-gray-500">{m.title}</p>
                      ) : null}
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <label className="flex items-center gap-1 text-xs text-gray-600">
                          Qty
                          <input
                            key={`${line.id}-${line.quantity}`}
                            type="number"
                            min={1}
                            max={99}
                            disabled={isBusy}
                            defaultValue={line.quantity}
                            onBlur={(e) => {
                              const v = Math.floor(Number(e.target.value) || 1);
                              if (v !== line.quantity) void setQty(line.id, v);
                            }}
                            className="w-14 rounded-md border border-[#426237]/20 bg-[#f4f1eb] px-1 py-0.5 text-center text-xs font-semibold"
                          />
                        </label>
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => void removeLine(line.id)}
                          className="text-xs font-semibold text-red-700 underline-offset-2 hover:underline"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-xs text-gray-500">Total</p>
                      <p className="text-sm font-bold tabular-nums text-[#426237]">
                        {lineTotal != null ? formatMoney(lineTotal.amount, cur) : "—"}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {cart != null && lines.length > 0 ? (
          <div className="border-t border-[#426237]/10 bg-[#f4f1eb]/95 px-5 py-4 backdrop-blur-sm">
            <div className="flex items-center justify-between text-[#426237]">
              <span className="text-sm font-semibold">Estimated total</span>
              <span className="text-lg font-bold tabular-nums">
                {total != null ? formatMoney(total.amount, total.currencyCode) : "—"}
              </span>
            </div>
            {cart.checkoutUrl ? (
              <a
                href={cart.checkoutUrl}
                className="mt-4 flex min-h-12 w-full items-center justify-center rounded-full bg-[#426237] px-6 text-center text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#2c4224] active:scale-[0.98]"
              >
                Proceed to secure checkout
              </a>
            ) : (
              <p className="mt-4 text-center text-sm text-red-700">Checkout is temporarily unavailable.</p>
            )}
          </div>
        ) : null}
      </aside>
    </div>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path
        d="M6 6l12 12M18 6L6 18"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
