"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useCartDrawer } from "./CartDrawer";
import type { SiteNavActive } from "./SiteHeader";
import { useMobileMenu } from "./MobileMenuContext";

const NAV_ITEMS: { href: string; label: string; key: SiteNavActive }[] = [
  { href: "/", label: "Home", key: "home" },
  { href: "/menu", label: "Menu", key: "menu" },
  { href: "/learn", label: "Learn", key: "learn" },
  { href: "/about", label: "About", key: "about" },
  { href: "/contact", label: "Contact", key: "contact" },
  { href: "/my-plan", label: "My Plan", key: "my-plan" },
  { href: "/account", label: "Account", key: "account" },
];

/** Stacking: dim layer below header & sidebar; sidebar above scrim. Portaled to body. */
const Z_BACKDROP = 1040;
const Z_SIDEBAR = 1060;

type Props = {
  active: SiteNavActive | null;
  orderNowHref: string;
};

export function MobileNav({ active, orderNowHref }: Props) {
  const pathname = usePathname();
  const { open, setOpen } = useMobileMenu();
  const { setOpen: setCartOpen } = useCartDrawer();
  const [mounted, setMounted] = useState(false);

  const close = useCallback(() => setOpen(false), [setOpen]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- client-only portal gate
    setMounted(true);
  }, []);

  useEffect(() => {
    close();
  }, [pathname, close]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [open]);

  const overlay =
    mounted ? (
      <>
        <div
          className={`fixed inset-0 bg-black/60 backdrop-blur-[3px] transition-opacity duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] lg:hidden ${
            open ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
          style={{ zIndex: Z_BACKDROP }}
          onClick={close}
          aria-hidden
        />

        <aside
          className={`fixed right-0 top-0 flex h-[100dvh] w-[min(82vw,300px)] flex-col bg-[#f4f1eb] shadow-[-16px_0_48px_-12px_rgba(66,98,55,0.35)] ring-1 ring-[#426237]/10 transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] lg:hidden ${
            open ? "translate-x-0" : "translate-x-full"
          }`}
          style={{ zIndex: Z_SIDEBAR }}
          aria-hidden={!open}
        >
          <div className="flex items-center justify-end px-4 pt-4">
            <button
              type="button"
              onClick={close}
              aria-label="Close menu"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 ring-1 ring-[#426237]/12 transition-colors hover:bg-white active:scale-[0.96]"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 18 18"
                fill="none"
                aria-hidden
              >
                <path
                  d="M4 4l10 10M14 4L4 14"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>

          <nav
            className="mt-2 flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 pb-4"
            aria-label="Mobile navigation"
          >
            {NAV_ITEMS.map((item, i) => {
              const isActive = active === item.key;
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  onClick={close}
                  className={`rounded-xl px-3 py-2.5 text-[0.9375rem] font-semibold transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                    isActive
                      ? "bg-[#426237]/12 text-[#426237]"
                      : "text-[#426237]/70 hover:bg-white/70 hover:text-[#426237]"
                  }`}
                  style={{
                    transitionDelay: open ? `${50 + i * 35}ms` : "0ms",
                    opacity: open ? 1 : 0,
                    transform: open ? "translateX(0)" : "translateX(12px)",
                  }}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div
            className="border-t border-[#426237]/10 px-3 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3"
            style={{
              opacity: open ? 1 : 0,
              transform: open ? "translateY(0)" : "translateY(8px)",
              transition:
                "opacity 350ms cubic-bezier(0.32,0.72,0,1) 280ms, transform 350ms cubic-bezier(0.32,0.72,0,1) 280ms",
            }}
          >
            <Link
              href={orderNowHref}
              onClick={close}
              className="flex h-10 items-center justify-center rounded-full bg-[#426237] px-5 text-sm font-semibold text-white shadow-sm transition-colors duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-[#2c4224] active:scale-[0.98]"
            >
              Order Now
            </Link>
          </div>
        </aside>
      </>
    ) : null;

  return (
    <>
      <button
        type="button"
        onClick={() => {
          const next = !open;
          if (next) setCartOpen(false);
          setOpen(next);
        }}
        aria-expanded={open}
        aria-label={open ? "Close menu" : "Open menu"}
        className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/85 ring-1 ring-[#426237]/12 transition-colors duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-white active:scale-[0.96] lg:hidden"
      >
        <div className="flex w-[15px] flex-col items-center gap-[4px]">
          <span
            className="block h-[2px] w-full rounded-full bg-[#426237] transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]"
            style={
              open
                ? { transform: "translateY(3px) rotate(45deg)" }
                : undefined
            }
          />
          <span
            className="block h-[2px] w-full rounded-full bg-[#426237] transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]"
            style={
              open
                ? { transform: "translateY(-3px) rotate(-45deg)" }
                : undefined
            }
          />
        </div>
      </button>

      {mounted && typeof document !== "undefined"
        ? createPortal(overlay, document.body)
        : null}
    </>
  );
}
