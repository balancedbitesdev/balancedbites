import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { CartNavButton } from "./CartNavButton";

export type SiteNavActive =
  | "home"
  | "menu"
  | "learn"
  | "about"
  | "contact"
  | "my-plan"
  | "account";

type Props = {
  active: SiteNavActive | null;
  orderNowHref: string;
};

export function SiteHeader({ active, orderNowHref }: Props) {
  return (
    <>
      {/* Reserves space so fixed bar does not cover page content */}
      <div className="h-[4.75rem] shrink-0 sm:h-[5.25rem]" aria-hidden />
      <header className="pointer-events-none fixed left-0 right-0 top-0 z-50 flex justify-center px-3 pt-3 sm:px-4 sm:pt-4">
        <div className="pointer-events-auto flex w-full max-w-5xl items-center gap-2 rounded-full border border-white/45 bg-[#f4f1eb]/50 px-2 py-2 shadow-[0_12px_48px_-12px_rgba(66,98,55,0.28)] ring-1 ring-[#426237]/10 backdrop-blur-2xl backdrop-saturate-150 sm:gap-3 sm:px-4 sm:py-2.5">
          <Link
            href="/"
            className="relative flex shrink-0 items-center rounded-full outline-offset-4 transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#426237]"
          >
            <Image
              src="/BB_By_Dalia-new.png"
              alt="Balanced Bites"
              width={200}
              height={56}
              className="h-9 w-auto sm:h-10"
              priority
            />
          </Link>

          <nav
            className="menu-scrollbar flex min-w-0 flex-1 justify-center gap-0.5 overflow-x-auto overscroll-x-contain py-0.5 text-xs font-medium sm:text-sm"
            aria-label="Primary"
          >
            <NavItem href="/" active={active === "home"}>
              Home
            </NavItem>
            <NavItem href="/menu" active={active === "menu"}>
              Menu
            </NavItem>
            <NavItem href="/learn" active={active === "learn"}>
              Learn
            </NavItem>
            <NavItem href="/about" active={active === "about"}>
              About
            </NavItem>
            <NavItem href="/contact" active={active === "contact"}>
              Contact
            </NavItem>
            <NavItem href="/my-plan" active={active === "my-plan"}>
              My Plan
            </NavItem>
            <NavItem href="/account" active={active === "account"}>
              Account
            </NavItem>
          </nav>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <CartNavButton />
            <a
              href={orderNowHref}
              className="rounded-full bg-[#426237] px-3 py-2 text-xs font-semibold text-white shadow-sm transition-colors duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-[#2c4224] active:scale-[0.98] sm:px-4 sm:text-sm"
            >
              <span className="sm:hidden">Order</span>
              <span className="hidden sm:inline">Order Now</span>
            </a>
          </div>
        </div>
      </header>
    </>
  );
}

function NavItem({
  href,
  children,
  active,
}: {
  href: string;
  children: ReactNode;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`whitespace-nowrap rounded-full px-2.5 py-1.5 transition-colors duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] sm:px-3 ${
        active
          ? "bg-[#426237]/18 font-semibold text-[#426237] ring-1 ring-[#426237]/15"
          : "text-[#426237]/75 hover:bg-white/35 hover:text-[#426237]"
      }`}
    >
      {children}
    </Link>
  );
}
