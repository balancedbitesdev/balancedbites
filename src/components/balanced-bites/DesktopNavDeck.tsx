"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { getDictionary, type Locale } from "@/lib/i18n";
import type { SiteNavActive } from "./SiteHeader";

const ITEMS: { href: string; key: SiteNavActive; label: string }[] = [
  { href: "/", key: "home", label: "Home" },
  { href: "/menu", key: "menu", label: "Menu" },
  { href: "/my-plan", key: "my-plan", label: "My Plan" },
  { href: "/about", key: "about", label: "About" },
  { href: "/account", key: "account", label: "Account" },
  { href: "/contact", key: "contact", label: "Contact" },
];

type Pill = { left: number; top: number; width: number; height: number };

const EMPTY_PILL: Pill = { left: 0, top: 0, width: 0, height: 0 };

type Props = {
  active: SiteNavActive | null;
  locale: Locale;
};

export function DesktopNavDeck({ active, locale }: Props) {
  const t = getDictionary(locale);
  const navRef = useRef<HTMLElement>(null);
  const linkRefs = useRef<Partial<Record<SiteNavActive, HTMLAnchorElement | null>>>(
    {},
  );
  const [pill, setPill] = useState<Pill>(EMPTY_PILL);
  const reduceMotion = useReducedMotion();

  const updatePill = useCallback(() => {
    const nav = navRef.current;
    if (active == null || !nav) {
      setPill(EMPTY_PILL);
      return;
    }
    const el = linkRefs.current[active];
    if (!el) {
      setPill(EMPTY_PILL);
      return;
    }
    setPill({
      left: el.offsetLeft,
      top: el.offsetTop,
      width: el.offsetWidth,
      height: el.offsetHeight,
    });
  }, [active, locale]);

  useLayoutEffect(() => {
    const nav = navRef.current;
    // Measure link geometry for the sliding pill (layout sync, not external subscription).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    updatePill();
    const raf = requestAnimationFrame(updatePill);
    nav?.addEventListener("scroll", updatePill, { passive: true });
    window.addEventListener("resize", updatePill);
    let ro: ResizeObserver | undefined;
    if (typeof ResizeObserver !== "undefined" && nav) {
      ro = new ResizeObserver(() => updatePill());
      ro.observe(nav);
    }
    return () => {
      cancelAnimationFrame(raf);
      nav?.removeEventListener("scroll", updatePill);
      window.removeEventListener("resize", updatePill);
      ro?.disconnect();
    };
  }, [updatePill]);

  const showPill = active != null && pill.width > 0;

  const transition = reduceMotion
    ? { duration: 0.12, ease: "easeOut" as const }
    : { type: "spring" as const, stiffness: 520, damping: 38, mass: 0.72 };

  return (
    <nav
      ref={navRef}
      dir={locale === "ar" ? "rtl" : "ltr"}
      className="menu-scrollbar relative hidden min-w-0 flex-1 justify-center gap-1 overflow-x-auto overscroll-x-contain px-2 py-2.5 text-[14px] font-medium lg:flex xl:gap-1.5 xl:text-[15px]"
      aria-label="Primary"
    >
      <motion.div
        aria-hidden
        className="pointer-events-none absolute z-0 rounded-full bg-[#426237]/18 ring-1 ring-[#426237]/15"
        initial={false}
        animate={{
          left: pill.left,
          top: pill.top,
          width: pill.width,
          height: pill.height,
          opacity: showPill ? 1 : 0,
        }}
        transition={transition}
      />
      {ITEMS.map((item) => {
        const isOn = active === item.key;
        const label =
          item.key === "my-plan" ? t.nav.myPlan : t.nav[item.key];
        return (
          <Link
            key={item.key}
            ref={(el) => {
              linkRefs.current[item.key] = el;
            }}
            href={item.href}
            prefetch
            className={`relative z-10 whitespace-nowrap rounded-full px-4 py-2 text-[14px] transition-[color,transform,background-color] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.97] [@media(hover:hover)_and_(pointer:fine)]:hover:bg-white/35 xl:px-[1.125rem] xl:text-[15px] ${
              isOn
                ? "font-semibold text-[#426237]"
                : "font-medium text-[#426237]/75 [@media(hover:hover)_and_(pointer:fine)]:hover:text-[#426237]"
            }`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
