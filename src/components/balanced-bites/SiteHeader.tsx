import Image from "next/image";
import Link from "next/link";
import { CartNavButton } from "./CartNavButton";
import { DesktopNavDeck } from "./DesktopNavDeck";
import { MobileNav } from "./MobileNav";

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
      <div className="h-[3.75rem] shrink-0 sm:h-[4rem] lg:h-[5rem]" aria-hidden />
      <header className="pointer-events-none fixed left-0 right-0 top-0 z-[1055] flex justify-center px-3 pt-2.5 sm:px-4 sm:pt-4 lg:z-50">
        <div className="pointer-events-auto flex h-11 w-full max-w-5xl items-center rounded-full border border-white/45 bg-[#f4f1eb]/50 shadow-[0_12px_48px_-12px_rgba(66,98,55,0.28)] ring-1 ring-[#426237]/10 backdrop-blur-2xl backdrop-saturate-150 lg:h-auto lg:py-2.5">
          {/* Logo — left-aligned */}
          <Link
            href="/"
            className="relative flex shrink-0 items-center rounded-full pl-2.5 outline-offset-4 transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#426237] lg:pl-4"
          >
            <Image
              src="/BB_By_Dalia-new.png"
              alt="Balanced Bites"
              width={200}
              height={56}
              className="h-6 w-auto sm:h-7 lg:h-9"
              priority
            />
          </Link>

          <DesktopNavDeck active={active} />

          {/* Right actions — pushed to the far right on mobile via flex-1 spacer */}
          <div className="flex-1 lg:hidden" />
          <div className="flex shrink-0 items-center gap-1 pr-2 lg:gap-2 lg:pr-2.5">
            <CartNavButton />
            <a
              href={orderNowHref}
              className="hidden rounded-full bg-[#426237] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-[#2c4224] active:scale-[0.98] lg:inline-flex"
            >
              Order Now
            </a>
            <MobileNav active={active} orderNowHref={orderNowHref} />
          </div>
        </div>
      </header>
    </>
  );
}
