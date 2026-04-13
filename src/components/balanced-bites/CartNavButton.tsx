"use client";

import { useCallback, useEffect, useState } from "react";
import { useCartDrawer } from "@/components/balanced-bites/CartDrawer";
import { fetchCartPayload, subscribeCartUpdated } from "@/lib/cart-client-api";

export function CartNavButton() {
  const { open, toggle } = useCartDrawer();
  const [count, setCount] = useState<number | null>(null);

  const refresh = useCallback(async () => {
    try {
      const cart = await fetchCartPayload();
      setCount(cart?.totalQuantity ?? 0);
    } catch {
      setCount(0);
    }
  }, []);

  useEffect(() => {
    void refresh();
    return subscribeCartUpdated(() => void refresh());
  }, [refresh]);

  const label = count == null ? "…" : String(count);
  const looksActive = open;

  return (
    <button
      type="button"
      onClick={toggle}
      aria-expanded={open}
      aria-controls="bb-cart-drawer"
      className={`relative flex min-h-11 min-w-11 items-center justify-center rounded-full text-sm font-semibold transition-colors duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.97] ${
        looksActive
          ? "bg-[#426237] text-white"
          : "bg-white text-[#426237] ring-1 ring-[#426237]/20 hover:bg-[#f4f1eb]"
      }`}
      aria-label={`Shopping cart, ${count ?? 0} items`}
    >
      <CartIcon className="h-5 w-5" />
      {count != null && count > 0 ? (
        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#ac8058] px-1 text-[10px] font-bold text-white">
          {label}
        </span>
      ) : null}
    </button>
  );
}

function CartIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M6 6h15l-1.5 9h-12L6 6zm0 0L5 3H2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="9" cy="20" r="1.5" fill="currentColor" />
      <circle cx="18" cy="20" r="1.5" fill="currentColor" />
    </svg>
  );
}
