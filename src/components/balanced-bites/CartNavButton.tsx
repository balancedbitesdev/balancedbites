"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useCartDrawer } from "@/components/balanced-bites/CartDrawer";
import { useMobileMenu } from "@/components/balanced-bites/MobileMenuContext";
import { fetchCartPayload, subscribeCartUpdated } from "@/lib/cart-client-api";

export function CartNavButton() {
  const { open, toggle } = useCartDrawer();
  const { setOpen: setMobileMenuOpen } = useMobileMenu();
  const [count, setCount] = useState<number | null>(null);
  const [bump, setBump] = useState(false);
  const bumpTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refresh = useCallback(async () => {
    try {
      const cart = await fetchCartPayload();
      setCount(cart?.totalQuantity ?? 0);
    } catch {
      setCount(0);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const raf = requestAnimationFrame(() => {
      if (!cancelled) void refresh();
    });
    const unsub = subscribeCartUpdated((detail) => {
      void refresh();
      if (detail.added != null) {
        if (bumpTimer.current != null) clearTimeout(bumpTimer.current);
        setBump(true);
        bumpTimer.current = setTimeout(() => setBump(false), 450);
      }
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      unsub();
      if (bumpTimer.current != null) clearTimeout(bumpTimer.current);
    };
  }, [refresh]);

  const label = count == null ? "…" : String(count);
  const looksActive = open;

  return (
    <button
      type="button"
      onClick={() => {
        setMobileMenuOpen(false);
        toggle();
      }}
      aria-expanded={open}
      aria-controls="bb-cart-drawer"
      className={`relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-[background-color,color,box-shadow,transform] duration-200 ease-out hover:shadow-[0_10px_28px_-16px_rgba(66,98,55,0.45)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#426237]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f4f1eb] active:scale-95 sm:h-11 sm:w-11 lg:h-11 lg:w-11 ${
        looksActive
          ? "bg-[#426237] text-white shadow-[0_12px_28px_-14px_rgba(66,98,55,0.55)]"
          : "bg-white/85 text-[#426237] ring-1 ring-[#426237]/12 hover:bg-white"
      }`}
      aria-label={`Shopping cart, ${count ?? 0} items`}
    >
      <span className={bump ? "bb-cart-bump inline-flex" : "inline-flex"}>
        <CartIcon className="h-6 w-6 sm:h-5 sm:w-5" />
      </span>
      {count != null && count > 0 ? (
        <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#ac8058] px-0.5 text-[10px] font-bold text-white sm:-right-1 sm:-top-1">
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
