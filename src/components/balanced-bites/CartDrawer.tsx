"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import Skeleton from "react-loading-skeleton";
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
import { getDeliveryFeeEgp } from "@/lib/delivery-fee";
import type { CartPayload } from "@/lib/shopify-cart";
import { useToast } from "@/components/balanced-bites/Toast";
import { useMobileMenu } from "./MobileMenuContext";

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
  const { open: mobileMenuOpen } = useMobileMenu();
  const { showSoft } = useToast();
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
    if (mobileMenuOpen) setOpen(false);
  }, [mobileMenuOpen, setOpen]);

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
  const subtotal = cart?.cost?.subtotalAmount ?? cart?.cost?.totalAmount;

  const pricing = useMemo(() => {
    if (subtotal == null) return null;
    const currency = subtotal.currencyCode;
    const deliveryEgp = getDeliveryFeeEgp();
    if (currency !== "EGP" || deliveryEgp <= 0) {
      return {
        kind: "simple" as const,
        label: "Estimated total",
        amount: subtotal.amount,
        currencyCode: currency,
        note: "Delivery & taxes are finalized at checkout.",
      };
    }
    const items = Number.parseFloat(subtotal.amount);
    if (!Number.isFinite(items)) return null;
    const estimated = items + deliveryEgp;
    return {
      kind: "egp" as const,
      items,
      deliveryEgp,
      estimated,
      currencyCode: currency,
    };
  }, [subtotal]);

  async function post(body: object): Promise<boolean> {
    const result = await postCartMutation(body);
    if (!result.ok) {
      showSoft(result.error);
      return false;
    }
    setCart(result.cart);
    dispatchCartUpdated();
    router.refresh();
    return true;
  }

  async function setQty(lineId: string, quantity: number) {
    if (!cart?.id) return;
    const q = Math.min(99, Math.max(1, quantity));
    setBusy(lineId);
    try {
      const ok = await post({
        action: "update",
        lines: [{ id: lineId, quantity: q }],
      });
      if (!ok) void load();
    } finally {
      setBusy(null);
    }
  }

  async function removeLine(lineId: string) {
    if (!cart?.id) return;
    setBusy(lineId);
    try {
      const ok = await post({ action: "remove", lineIds: [lineId] });
      if (!ok) void load();
    } finally {
      setBusy(null);
    }
  }

  return (
    <div
      className={`fixed inset-0 z-[1070] transition-[visibility] duration-[260ms] ${
        open ? "visible" : "pointer-events-none invisible delay-[260ms]"
      }`}
      aria-hidden={!open}
    >
      <button
        type="button"
        className={`absolute inset-0 bg-[#1a1a1a]/45 backdrop-blur-[2px] transition-opacity duration-[260ms] ease-[cubic-bezier(0.23,1,0.32,1)] ${
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
        className={`bb-cart-drawer-panel absolute right-0 top-0 flex h-full w-full max-w-[min(75vw,28rem)] flex-col bg-[#f4f1eb] shadow-2xl ring-1 ring-[#426237]/15 transition-transform duration-[260ms] ease-[cubic-bezier(0.32,0.72,0,1)] ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-[#426237]/10 px-5 py-4">
          <h2 className="menu-serif text-lg font-semibold text-[#426237]">Your cart</h2>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="flex min-h-10 min-w-10 items-center justify-center rounded-full text-[#426237] ring-1 ring-[#426237]/15 transition-[background-color,color,transform] duration-[160ms] ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#426237]/35 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f4f1eb] active:scale-[0.97]"
            aria-label="Close cart"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {loading ? (
            <ul className="space-y-3" aria-busy="true" aria-label="Loading cart">
              <CartDrawerLineSkeleton />
              <CartDrawerLineSkeleton />
              <CartDrawerLineSkeleton />
            </ul>
          ) : cart == null || lines.length === 0 ? (
            <div className="rounded-2xl bg-white/90 px-5 py-10 text-center ring-1 ring-[#426237]/10">
              <p className="font-semibold text-[#426237]">Your cart is empty</p>
              <p className="mt-2 text-sm text-gray-600">
                Add meals from the menu—close this panel anytime to keep browsing.
              </p>
              <Link
                href="/menu"
                onClick={() => setOpen(false)}
                className="mt-6 inline-flex min-h-11 items-center justify-center rounded-full bg-[#426237] px-8 py-3 text-sm font-semibold text-white shadow-[0_14px_36px_-20px_rgba(66,98,55,0.55)] transition-[background-color,box-shadow,transform] duration-[200ms] ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-[#2c4224] hover:shadow-[0_18px_40px_-18px_rgba(66,98,55,0.5)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#426237]/45 focus-visible:ring-offset-2 focus-visible:ring-offset-white active:scale-[0.97]"
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
                        <div className="flex items-center gap-1.5 rounded-full bg-[#f4f1eb] p-0.5 ring-1 ring-[#426237]/12">
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => {
                              if (line.quantity <= 1) void removeLine(line.id);
                              else void setQty(line.id, line.quantity - 1);
                            }}
                            className="flex h-8 min-w-8 items-center justify-center rounded-full text-sm font-semibold text-[#426237] transition-[background-color,color,transform] duration-[160ms] ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#426237]/30 disabled:cursor-not-allowed disabled:opacity-45 active:scale-[0.97]"
                            aria-label={line.quantity <= 1 ? "Remove item" : "Decrease quantity"}
                          >
                            −
                          </button>
                          <span className="min-w-[1.75rem] text-center text-xs font-bold tabular-nums text-[#426237]">
                            {line.quantity}
                          </span>
                          <button
                            type="button"
                            disabled={isBusy || line.quantity >= 99}
                            onClick={() => void setQty(line.id, line.quantity + 1)}
                            className="flex h-8 min-w-8 items-center justify-center rounded-full text-sm font-semibold text-[#426237] transition-[background-color,color,transform] duration-[160ms] ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#426237]/30 disabled:cursor-not-allowed disabled:opacity-45 active:scale-[0.97]"
                            aria-label="Increase quantity"
                          >
                            +
                          </button>
                        </div>
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => void removeLine(line.id)}
                          className="text-xs font-semibold text-[#6b5b4d] underline-offset-2 transition-[color,transform] duration-[160ms] ease-[cubic-bezier(0.23,1,0.32,1)] hover:text-[#426237] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#426237]/25 focus-visible:ring-offset-1 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-45 active:scale-[0.97]"
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
            {pricing?.kind === "egp" ? (
              <div className="space-y-2 text-[#426237]">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Items</span>
                  <span className="tabular-nums font-medium">
                    {formatMoney(String(pricing.items), pricing.currencyCode)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Delivery</span>
                  <span className="tabular-nums font-medium">
                    {formatMoney(String(pricing.deliveryEgp), pricing.currencyCode)}
                  </span>
                </div>
                <div className="flex items-center justify-between border-t border-[#426237]/10 pt-2">
                  <span className="text-sm font-semibold">Estimated total</span>
                  <span className="text-lg font-bold tabular-nums">
                    {formatMoney(String(pricing.estimated), pricing.currencyCode)}
                  </span>
                </div>
                {/* <p className="text-[11px] leading-snug text-gray-500">
                  Matches flat delivery in Shopify Checkout when configured. Tax may still apply at
                  checkout unless your prices include tax—see store settings.
                </p> */}
              </div>
            ) : (
              <div className="flex items-center justify-between text-[#426237]">
                <span className="text-sm font-semibold">
                  {pricing?.label ?? "Estimated total"}
                </span>
                <span className="text-lg font-bold tabular-nums">
                  {subtotal != null
                    ? formatMoney(subtotal.amount, subtotal.currencyCode)
                    : total != null
                      ? formatMoney(total.amount, total.currencyCode)
                      : "—"}
                </span>
              </div>
            )}
            {pricing?.kind === "simple" && pricing.note != null ? (
              <p className="mt-2 text-[11px] leading-snug text-gray-500">{pricing.note}</p>
            ) : null}
            {cart.checkoutUrl ? (
              <a
                href={cart.checkoutUrl}
                className="mt-4 flex min-h-12 w-full items-center justify-center rounded-full bg-[#426237] px-6 text-center text-sm font-semibold text-white shadow-[0_14px_36px_-20px_rgba(66,98,55,0.65)] transition-[background-color,box-shadow,transform] duration-[200ms] ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-[#2c4224] hover:shadow-[0_18px_40px_-18px_rgba(66,98,55,0.55)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#426237]/45 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f4f1eb] active:scale-[0.97]"
              >
                Proceed to secure checkout
              </a>
            ) : (
              <p className="mt-4 text-center text-sm text-stone-600">
                Checkout will be ready in a moment—feel free to keep browsing.
              </p>
            )}
          </div>
        ) : null}
      </aside>
    </div>
  );
}

function CartDrawerLineSkeleton() {
  return (
    <li className="flex gap-3 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-[#426237]/10">
      <Skeleton
        width={64}
        height={64}
        borderRadius={12}
        className="shrink-0 leading-none"
        containerClassName="leading-none"
      />
      <div className="min-w-0 flex-1 space-y-2 py-1">
        <Skeleton height={16} width="72%" className="leading-none" />
        <Skeleton height={12} width="38%" className="leading-none" />
        <Skeleton height={32} width={72} className="leading-none" />
      </div>
      <div className="flex w-14 flex-col items-end gap-2 pt-0.5">
        <Skeleton height={12} width={40} className="leading-none" />
        <Skeleton height={20} width={52} className="leading-none" />
      </div>
    </li>
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
