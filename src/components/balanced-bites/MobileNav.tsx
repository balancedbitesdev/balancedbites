"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { getDictionary, type Locale } from "@/lib/i18n";
import { useCartDrawer } from "./CartDrawer";
import type { SiteNavActive } from "./SiteHeader";
import { useMobileMenu } from "./MobileMenuContext";

const NAV_ITEMS: { href: string; label: string; key: SiteNavActive }[] = [
  { href: "/", label: "Home", key: "home" },
  { href: "/menu", label: "Menu", key: "menu" },
  { href: "/my-plan", label: "My Plan", key: "my-plan" },
  { href: "/about", label: "About", key: "about" },
  { href: "/account", label: "Account", key: "account" },
  { href: "/contact", label: "Contact", key: "contact" },
];

/** Stacking: dim layer below header & sidebar; sidebar above scrim. Portaled to body. */
const Z_BACKDROP = 1040;
const Z_SIDEBAR = 1060;

type Props = {
  active: SiteNavActive | null;
  orderNowHref: string;
  locale: Locale;
};

export function MobileNav({ active, orderNowHref, locale }: Props) {
  const t = getDictionary(locale);
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
          className={`fixed inset-0 bg-black/60 backdrop-blur-[3px] transition-opacity duration-[260ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none lg:hidden ${
            open ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
          style={{ zIndex: Z_BACKDROP }}
          onClick={close}
          aria-hidden
        />

        <aside
          className={`fixed right-0 top-0 flex h-[100dvh] w-[min(84vw,320px)] max-w-[100vw] flex-col bg-[#f4f1eb] pb-[env(safe-area-inset-bottom)] shadow-[-16px_0_48px_-12px_rgba(66,98,55,0.35)] ring-1 ring-[#426237]/10 transition-transform duration-[260ms] ease-[cubic-bezier(0.32,0.72,0,1)] will-change-transform motion-reduce:transition-none lg:hidden ${
            open ? "translate-x-0" : "translate-x-full"
          }`}
          style={{ zIndex: Z_SIDEBAR }}
          aria-hidden={!open}
          inert={!open}
        >
          <div className="flex items-center justify-end px-5 pt-5">
            <button
              type="button"
              onClick={close}
              aria-label="Close menu"
              className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 ring-1 ring-[#426237]/12 transition-[background-color,transform] duration-[160ms] ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-white active:scale-[0.97]"
            >
              <svg
                width="20"
                height="20"
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
            className="mt-3 flex flex-1 flex-col gap-1.5 overflow-y-auto px-4 pb-4"
            aria-label="Mobile navigation"
          >
            {NAV_ITEMS.map((item, i) => {
              const isActive = active === item.key;
              const label =
                item.key === "my-plan" ? t.nav.myPlan : t.nav[item.key];
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  onClick={close}
                  className={`rounded-xl px-4 py-3.5 text-[1.0625rem] font-semibold leading-snug transition-[opacity,transform,background-color,color] duration-[240ms] ease-[cubic-bezier(0.23,1,0.32,1)] ${
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
                  {label}
                </Link>
              );
            })}
          </nav>

          <div
            className="border-t border-[#426237]/10 px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4"
            style={{
              opacity: open ? 1 : 0,
              transform: open ? "translateY(0)" : "translateY(8px)",
              transition:
                "opacity 260ms cubic-bezier(0.23, 1, 0.32, 1) 200ms, transform 260ms cubic-bezier(0.23, 1, 0.32, 1) 200ms",
            }}
          >
            <Link
              href={orderNowHref}
              onClick={close}
              className="flex min-h-12 shrink-0 items-center justify-center whitespace-nowrap rounded-full bg-[#426237] px-6 py-3 text-center text-base font-semibold leading-none text-white shadow-sm transition-[background-color,transform] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-[#2c4224] active:scale-[0.97]"
            >
              {t.nav.orderNow}
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
        className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/85 ring-1 ring-[#426237]/12 transition-[background-color,transform] duration-[200ms] ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-white active:scale-[0.97] sm:h-11 sm:w-11 lg:hidden"
      >
        <div className="flex w-[19px] flex-col items-center gap-[5px]">
          <span
            className="block h-[2.5px] w-full rounded-full bg-[#426237] transition-[transform] duration-[260ms] ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none"
            style={
              open
                ? { transform: "translateY(3.75px) rotate(45deg)" }
                : undefined
            }
          />
          <span
            className="block h-[2.5px] w-full rounded-full bg-[#426237] transition-[transform] duration-[260ms] ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none"
            style={
              open
                ? { transform: "translateY(-3.75px) rotate(-45deg)" }
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
