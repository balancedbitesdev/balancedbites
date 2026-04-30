import Image from "next/image";
import Link from "next/link";
import { getDictionary } from "@/lib/i18n";
import { getRequestLocale } from "@/lib/i18n-server";
import { CartNavButton } from "./CartNavButton";
import { DesktopNavDeck } from "./DesktopNavDeck";
import { LanguageToggle } from "./LanguageToggle";
import { MobileNav } from "./MobileNav";

export type SiteNavActive =
  | "home"
  | "menu"
  | "about"
  | "contact"
  | "my-plan"
  | "account";

type Props = {
  active: SiteNavActive | null;
  orderNowHref: string;
  /** Use with pages whose canvas is warm cream (e.g. home hero) so the bar doesn’t sit on a mismatched tint */
  warmCanvas?: boolean;
};

export async function SiteHeader({
  active,
  orderNowHref,
  warmCanvas = false,
}: Props) {
  const locale = await getRequestLocale();
  const t = getDictionary(locale);
  const barTint = warmCanvas
    ? "border-white/50 bg-[#fffdf9]/60 ring-[#426237]/8"
    : "border-white/45 bg-[#f4f1eb]/50 ring-[#426237]/10";

  return (
    <>
      {/* Reserves space for fixed bar: pt + bar height + small gap below pill (keep in sync with header pt + bar h). */}
      <div className="h-[4.625rem] shrink-0 sm:h-[4.75rem] lg:h-[5.125rem]" aria-hidden />
      <header className="pointer-events-none fixed left-0 right-0 top-0 z-[1055] flex justify-center px-3 pt-1.5 sm:px-4 sm:pt-2 lg:px-5 lg:pt-2.5">
        <div
          dir="ltr"
          className={`pointer-events-auto flex h-14 w-full max-w-6xl items-center rounded-full shadow-[0_12px_48px_-12px_rgba(66,98,55,0.28)] backdrop-blur-2xl backdrop-saturate-150 sm:h-[3.375rem] lg:grid lg:h-auto lg:min-h-0 lg:grid-cols-[12rem_minmax(0,1fr)_minmax(15rem,auto)] lg:py-2.5 xl:grid-cols-[13rem_minmax(0,1fr)_minmax(16rem,auto)] ${barTint}`}
        >
          {/* Logo — left-aligned */}
          <Link
            href="/"
            className="relative flex shrink-0 items-center rounded-full pl-3 outline-offset-4 transition-[opacity,transform] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] hover:opacity-90 active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#426237] sm:pl-2.5 lg:justify-start lg:pl-4"
          >
            <Image
              src="/BB_By_Dalia-new.png"
              alt="Balanced Bites"
              width={200}
              height={56}
              className="h-8 w-auto sm:h-7 lg:h-9"
              priority
            />
          </Link>

          <DesktopNavDeck active={active} locale={locale} />

          {/* Right actions — pushed to the far right on mobile via flex-1 spacer */}
          <div className="flex-1 lg:hidden" />
          <div className="flex shrink-0 items-center gap-2 pr-2.5 lg:justify-end lg:gap-2.5 lg:pr-3">
            <LanguageToggle locale={locale} />
            <CartNavButton />
            <a
              href={orderNowHref}
              className="hidden shrink-0 whitespace-nowrap rounded-full bg-[#426237] px-4 py-2 text-center text-[14px] font-semibold leading-none text-white shadow-sm transition-[background-color,transform,box-shadow] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-[#2c4224] active:scale-[0.97] lg:inline-flex lg:items-center lg:justify-center xl:px-5 xl:text-[15px]"
            >
              {t.nav.orderNow}
            </a>
            <MobileNav active={active} orderNowHref={orderNowHref} locale={locale} />
          </div>
        </div>
      </header>
    </>
  );
}
